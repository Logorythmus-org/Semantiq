"""B1-only supervisor: fixed synthetic workloads; untrusted documents always fail closed."""

from __future__ import annotations

import math
import os
import secrets
import signal
import subprocess
import sys
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import IO, Any

from ._worker_wire import (
    HEADER_MAX,
    ID,
    PROTOCOL,
    RAW_MAX,
    WireError,
    digest,
    frame,
    manifest_id,
    take_frame,
    validate_header,
)
from .worker_capabilities import WorkerCapabilities, inspect_worker_capabilities

_ENTRY = Path(__file__).resolve().with_name("_worker_entry.py")


class WorkerError(ValueError):
    def __init__(self, code: str):
        self.code = code
        self.location = "worker"
        super().__init__(f"{code}: worker")

    def to_dict(self) -> dict[str, str]:
        return {"protocol": PROTOCOL, "code": self.code, "location": self.location}


@dataclass(frozen=True)
class WorkerLimits:
    source_seconds: float = 5
    request_seconds: float = 30
    cleanup_seconds: float = 2
    raw_bytes: int = RAW_MAX
    total_raw_bytes: int = 8 * 1024 * 1024
    sources: int = 16
    header_bytes: int = HEADER_MAX
    output_bytes: int = 2 * 1024 * 1024
    stderr_bytes: int = 16 * 1024
    memory_bytes: int = 256 * 1024 * 1024
    job_memory_bytes: int = 384 * 1024 * 1024
    cpu_seconds: int = 2
    processes: int = 1


DEFAULT_WORKER_LIMITS = WorkerLimits()


def _limits(limits: WorkerLimits) -> None:
    from dataclasses import asdict

    if type(limits) is not WorkerLimits:
        raise WorkerError("INVALID_LIMITS")
    caps = asdict(DEFAULT_WORKER_LIMITS)
    caps["processes"] = 4  # Bounded harmless descendant tests; no untrusted profile.
    for name, value in asdict(limits).items():
        if name in ("source_seconds", "request_seconds", "cleanup_seconds"):
            valid = (type(value) is int or type(value) is float) and 0 < value <= caps[name]
            if type(value) is float:
                valid = valid and math.isfinite(value)
        else:
            valid = type(value) is int and 0 < value <= caps[name]
        if not valid:
            raise WorkerError("INVALID_LIMITS")
    if limits.memory_bytes < 32 * 1024 * 1024 or limits.job_memory_bytes < limits.memory_bytes:
        raise WorkerError("INVALID_LIMITS")


@dataclass(frozen=True)
class CapturedBytes:
    source_id: str
    raw: bytes

    @property
    def raw_sha256(self) -> str:
        return digest(self.raw)


def capture_bytes(
    source_id: str, raw: bytes | bytearray, limits: WorkerLimits = DEFAULT_WORKER_LIMITS
) -> CapturedBytes:
    _limits(limits)
    if type(source_id) is not str or not ID.fullmatch(source_id):
        raise WorkerError("INVALID_INPUT")
    if type(raw) not in (bytes, bytearray):
        raise WorkerError("INVALID_INPUT")
    if len(raw) > min(limits.raw_bytes, limits.total_raw_bytes):
        raise WorkerError("LIMIT_EXCEEDED")
    return CapturedBytes(source_id, bytes(raw))


def capture_untrusted_path(*args: Any, **kwargs: Any) -> CapturedBytes:
    """No hostile-filesystem broker has been qualified. Never inspect or open the path."""
    raise WorkerError("ISOLATION_UNAVAILABLE")


def run_untrusted_document(*args: Any, **kwargs: Any) -> None:
    """B1 acceptance is not authorization for untrusted document processing."""
    raise WorkerError("ISOLATION_UNAVAILABLE")


@dataclass(frozen=True)
class SyntheticResult:
    source_id: str
    raw_bytes: int
    raw_sha256: str
    manifest_id: str
    configured_controls: tuple[str, ...]
    # No text, evidence state, claim verdict or scientific validation is returned.


class _Drain:
    def __init__(self, stream: IO[bytes], cap: int):
        self.stream, self.cap = stream, cap
        self.data = bytearray()
        self.lock = threading.Lock()
        self.overflow = threading.Event()
        self.failed = threading.Event()
        self.thread = threading.Thread(target=self._run, daemon=True)

    def _run(self) -> None:
        try:
            while True:
                # Unbuffered pipe reads do not wait for a complete 4 KiB buffer.
                chunk = self.stream.read(4096)
                if not chunk:
                    return
                with self.lock:
                    if len(self.data) + len(chunk) > self.cap:
                        self.overflow.set()
                        return
                    self.data.extend(chunk)
        except (OSError, ValueError):
            self.failed.set()

    def value(self) -> bytes:
        with self.lock:
            return bytes(self.data)


def _environment() -> dict[str, str]:
    env = {"LANG": "C.UTF-8", "LC_ALL": "C.UTF-8"}
    if sys.platform == "win32":
        system = os.environ.get("SystemRoot")
        if not system:
            raise WorkerError("ISOLATION_UNAVAILABLE")
        env.update(SystemRoot=system, WINDIR=system)
    return env


def _executable() -> str:
    # Bypass virtualenv/uv launchers, not process limits. Never search PATH or retry a fallback.
    path = (
        Path(sys.base_prefix) / "python.exe"
        if sys.platform == "win32"
        else Path(sys.executable).resolve()
    )
    if not path.is_absolute() or not path.is_file():
        raise WorkerError("ISOLATION_UNAVAILABLE")
    return str(path)


def _exited(process: subprocess.Popen[bytes]) -> bool:
    if sys.platform == "linux":
        # Preserve the leader's PID until group cleanup; do not reap/reuse it early.
        return os.waitid(os.P_PID, process.pid, os.WEXITED | os.WNOHANG | os.WNOWAIT) is not None
    return process.poll() is not None


class WorkerSupervisor:
    def __init__(self, limits: WorkerLimits = DEFAULT_WORKER_LIMITS):
        _limits(limits)
        self.limits = limits
        self._lock = threading.Lock()
        self._quarantined = False

    def capabilities(self) -> WorkerCapabilities:
        return inspect_worker_capabilities()

    def run_synthetic(self, source: CapturedBytes) -> SyntheticResult:
        return self.run_synthetic_batch([source])[0]

    def run_synthetic_batch(self, sources: list[CapturedBytes]) -> list[SyntheticResult]:
        started = time.monotonic()
        _limits(self.limits)
        if not self._lock.acquire(blocking=False):
            raise WorkerError("WORKER_BUSY")
        try:
            if self._quarantined:
                raise WorkerError("CLEANUP_FAILED")
            if type(sources) is not list or not sources or len(sources) > self.limits.sources:
                raise WorkerError("LIMIT_EXCEEDED")
            total = 0
            ids = set()
            for source in sources:
                if type(source) is not CapturedBytes or type(source.raw) is not bytes:
                    raise WorkerError("INVALID_INPUT")
                capture_bytes(source.source_id, source.raw, self.limits)
                total += len(source.raw)
                if total > self.limits.total_raw_bytes:
                    raise WorkerError("LIMIT_EXCEEDED")
                if source.source_id in ids:
                    raise WorkerError("INVALID_INPUT")
                ids.add(source.source_id)
            deadline = started + self.limits.request_seconds
            results = []
            for source in sources:
                if time.monotonic() >= deadline:
                    raise WorkerError("PARSE_TIMEOUT")
                results.append(
                    self._one(source, min(deadline, time.monotonic() + self.limits.source_seconds))
                )
            return results
        finally:
            self._lock.release()

    def _one(self, source: CapturedBytes, deadline: float) -> SyntheticResult:
        if sys.platform not in ("win32", "linux"):
            raise WorkerError("ISOLATION_UNAVAILABLE")
        limits = self.limits
        try:
            nonce, manifest = secrets.token_hex(16), manifest_id()
        except OSError:
            raise WorkerError("ISOLATION_UNAVAILABLE") from None
        request = {
            "protocol": PROTOCOL,
            "kind": "request",
            "nonce": nonce,
            "manifest_id": manifest,
            "source_id": source.source_id,
            "raw_bytes": len(source.raw),
            "raw_sha256": source.raw_sha256,
        }
        packet = frame(request) + source.raw
        if len(frame(request)) - 4 > limits.header_bytes:
            raise WorkerError("LIMIT_EXCEEDED")
        if time.monotonic() >= deadline:
            raise WorkerError("PARSE_TIMEOUT")
        process = None
        job = None
        drains: list[_Drain] = []
        writer: threading.Thread | None = None
        release = threading.Event()
        stop = threading.Event()
        write_failed = threading.Event()
        controls: tuple[str, ...] = (
            "parent_wall_monitor",
            "bounded_streams",
            "explicit_environment",
        )
        try:
            if sys.platform == "win32":
                from ._worker_windows import NativeJob

                job = NativeJob(
                    limits.memory_bytes,
                    limits.job_memory_bytes,
                    limits.cpu_seconds,
                    limits.processes,
                )
            process = subprocess.Popen(
                [
                    _executable(),
                    "-I",
                    "-S",
                    "-B",
                    str(_ENTRY),
                    str(os.getpid()),
                    nonce,
                    manifest,
                    str(limits.memory_bytes),
                    str(limits.cpu_seconds),
                ],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                bufsize=0,
                close_fds=True,
                env=_environment(),
                cwd=str(_ENTRY.parent),
                start_new_session=sys.platform == "linux",
                creationflags=0x08000000 if sys.platform == "win32" else 0,
            )
            if job:
                job.attach(process.pid)
                controls += ("windows_job_configured",)
            else:
                controls += ("linux_worker_rlimits_configured", "linux_group_cleanup")
            assert process.stdin is not None and process.stdout is not None
            assert process.stderr is not None
            drains = [
                _Drain(process.stdout, limits.output_bytes),
                _Drain(process.stderr, limits.stderr_bytes),
            ]
            for drain in drains:
                drain.thread.start()
            stdin = process.stdin

            def write_request() -> None:
                try:
                    stdin.write(b"GO")
                    while not release.wait(0.005):
                        if stop.is_set():
                            return
                    for offset in range(0, len(packet), 4096):
                        if stop.is_set():
                            return
                        view = memoryview(packet)[offset : offset + 4096]
                        while view:
                            written = stdin.write(view)
                            if not written:
                                raise OSError("PIPE_CLOSED")
                            view = view[written:]
                except (OSError, ValueError):
                    write_failed.set()
                finally:
                    stdin.close()

            writer = threading.Thread(target=write_request, daemon=True)
            writer.start()
            ready_end = None
            while True:
                if time.monotonic() >= deadline:
                    raise WorkerError("PARSE_TIMEOUT")
                if any(d.overflow.is_set() for d in drains):
                    raise WorkerError("LIMIT_EXCEEDED")
                if any(d.failed.is_set() for d in drains):
                    raise WorkerError("PROTOCOL_ERROR")
                if ready_end is None:
                    ready = take_frame(drains[0].value(), limit=limits.header_bytes)
                    if ready:
                        header, ready_end = ready
                        validate_header(header, "ready")
                        if header["nonce"] != nonce or header["manifest_id"] != manifest:
                            raise WireError()
                        release.set()
                if _exited(process):
                    break
                time.sleep(0.005)
        except WorkerError:
            raise
        except WireError:
            raise WorkerError("PROTOCOL_ERROR") from None
        except (OSError, ValueError, RuntimeError):
            raise WorkerError("ISOLATION_UNAVAILABLE") from None
        finally:
            stop.set()
            if not self._cleanup(process, job, drains, writer):
                self._quarantined = True
                raise WorkerError("CLEANUP_FAILED") from None
        assert process is not None
        if time.monotonic() >= deadline:
            raise WorkerError("PARSE_TIMEOUT")
        if any(d.overflow.is_set() for d in drains):
            raise WorkerError("LIMIT_EXCEEDED")
        if process.returncode != 0:
            if not release.is_set() and process.returncode == 3:
                raise WorkerError("ISOLATION_UNAVAILABLE")
            raise WorkerError("WORKER_CRASH")
        if write_failed.is_set() or any(d.failed.is_set() for d in drains):
            raise WorkerError("PROTOCOL_ERROR")
        try:
            output = drains[0].value()
            first = take_frame(output, limit=limits.header_bytes)
            if not first:
                raise WireError()
            validate_header(first[0], "ready")
            if first[0] != {
                "protocol": PROTOCOL,
                "kind": "ready",
                "nonce": nonce,
                "manifest_id": manifest,
            }:
                raise WireError()
            second = take_frame(output[first[1] :], limit=limits.header_bytes)
            if not second or first[1] + second[1] != len(output):
                raise WireError()
            validate_header(second[0], "response")
            if second[0] != dict(request, kind="response"):
                raise WireError()
        except WireError:
            raise WorkerError("PROTOCOL_ERROR") from None
        return SyntheticResult(
            source.source_id, len(source.raw), source.raw_sha256, manifest, controls
        )

    def _cleanup(
        self,
        process: subprocess.Popen[bytes] | None,
        job: Any,
        drains: list[_Drain],
        writer: threading.Thread | None,
    ) -> bool:
        deadline = time.monotonic() + self.limits.cleanup_seconds
        success = True
        if job:
            try:
                # Also cover a process whose Job assignment failed while still gated.
                if process is not None and process.poll() is None:
                    process.kill()
            except OSError:
                success = False
            try:
                # A failed direct kill must not skip Job termination/handle closure.
                success = job.finish(deadline) and success
            except OSError:
                success = False
        elif process is not None and sys.platform == "linux":
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            except OSError:
                success = False
        if process is not None:
            try:
                process.wait(timeout=max(0, deadline - time.monotonic()))
            except (OSError, subprocess.TimeoutExpired):
                success = False
        for thread in ([writer] if writer else []) + [d.thread for d in drains]:
            # Thread.start can fail partway through pipe setup. Unstarted threads
            # own no running operation and cannot be joined.
            if thread.ident is None:
                continue
            thread.join(timeout=max(0, deadline - time.monotonic()))
            if thread.is_alive():
                success = False
        if process is not None and success:
            for stream in (process.stdin, process.stdout, process.stderr):
                if stream:
                    stream.close()
        return success

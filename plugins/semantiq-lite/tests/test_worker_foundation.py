"""Bounded synthetic tests. No PDF/HTML, malicious documents, or qualified sandbox claim."""

from __future__ import annotations

import dataclasses
import hashlib
import json
import os
import struct
import subprocess
import sys
import sysconfig
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from semantiq_lite import _worker_wire as wire
from semantiq_lite.worker import (
    CapturedBytes,
    SyntheticResult,
    WorkerError,
    WorkerLimits,
    WorkerSupervisor,
    capture_bytes,
    capture_untrusted_path,
    run_untrusted_document,
)
from semantiq_lite.worker_capabilities import inspect_worker_capabilities

PACKAGE = Path(wire.__file__).parent
BASE = "semantiq_lite.worker"


def header(kind="request"):
    value = {"protocol": wire.PROTOCOL, "kind": kind, "nonce": "a" * 32, "manifest_id": "b" * 64}
    if kind != "ready":
        value.update(source_id="s", raw_bytes=2, raw_sha256=wire.digest(b"ok"))
    return value


class WireTests(unittest.TestCase):
    def test_internal_schema_and_capabilities(self):
        from runpy import run_path

        from jsonschema import Draft202012Validator

        contracts = Path(__file__).resolve().parents[1] / "contracts"
        schema = json.loads((contracts / "semantiq-lite-worker-v0.1.schema.json").read_text())
        self.assertEqual(schema, run_path(str(contracts / "build_worker_schema.py"))["schema"])
        Draft202012Validator.check_schema(schema)
        validator = Draft202012Validator(schema)
        for kind in ("ready", "request", "response"):
            validator.validate(header(kind))
        capabilities = inspect_worker_capabilities().to_dict()
        validator.validate(capabilities)
        capabilities["untrusted_documents_enabled"] = True
        self.assertFalse(validator.is_valid(capabilities))
        invalid = header()
        invalid["source_id"] = "s\n"
        self.assertFalse(validator.is_valid(invalid))
        validator.validate(WorkerError("PROTOCOL_ERROR").to_dict())

    def test_manifest_failure_is_sanitized(self):
        with patch(BASE + ".manifest_id", side_effect=OSError("private path")):
            with self.assertRaisesRegex(WorkerError, "^ISOLATION_UNAVAILABLE: worker$"):
                WorkerSupervisor().run_synthetic(capture_bytes("s", b"ok"))

    def test_round_trip_and_boundaries(self):
        for kind in ("ready", "request", "response"):
            value = header(kind)
            encoded = wire.frame(value)
            self.assertEqual(wire.take_frame(encoded), (value, len(encoded)))
            self.assertIsNone(wire.take_frame(encoded[:-1]))
        for value in (b"", b"\0", b"\0\0\0"):
            self.assertIsNone(wire.take_frame(value))
        for size in (0, wire.HEADER_MAX + 1, 2**32 - 1):
            with self.assertRaises(wire.WireError):
                wire.take_frame(struct.pack(">I", size))

    def test_malformed_json(self):
        values = [
            b"[]",
            b"null",
            b'{"a":1,"a":2}',
            b'{"a":NaN}',
            b'{"a":1.2}',
            b'{"a":Infinity}',
            b'{"a":"\\ud800"}',
            b"\xff",
            b"{}{}",
            b'{"a":' + b"[" * 20 + b"]" * 20 + b"}",
            b'{"a":' + b"9" * 21 + b"}",
        ]
        for value in values:
            with self.subTest(value=value), self.assertRaises(wire.WireError):
                wire.decode_header(value)

    def test_field_mutations(self):
        for key, value in (
            ("raw_bytes", True),
            ("raw_bytes", -1),
            ("raw_bytes", wire.RAW_MAX + 1),
            ("source_id", "../secret"),
            ("nonce", "x" * 32),
            ("manifest_id", "b" * 63),
            ("protocol", "future"),
            ("kind", "execute"),
            ("command", "private-marker"),
        ):
            item = header()
            item[key] = value
            with self.subTest(key=key), self.assertRaises(wire.WireError):
                wire.validate_header(item, "request")


@unittest.skipUnless(sys.platform in ("win32", "linux"), "Only Windows/Linux synthetic backends")
class SupervisorTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix="semantiq-b1-test-")
        self.root = Path(self.directory.name)
        self.source = capture_bytes("s", b"ok")

    def tearDown(self):
        self.directory.cleanup()

    def failure(self, expected, operation):
        with self.assertRaises(WorkerError) as caught:
            operation()
        self.assertEqual(caught.exception.code, expected)
        self.assertEqual(str(caught.exception), f"{expected}: worker")
        self.assertNotIn("private-marker", str(caught.exception))

    def fixture(self, body, *, before_ready="", before_bootstrap=""):
        path = self.root / "fixed fixture worker.py"
        prefix = f"""import sys, os, time, json, struct, subprocess
from pathlib import Path
sys.path.insert(0, {str(PACKAGE)!r})
from _worker_wire import *
from _worker_entry import bootstrap, read_exact
parent, nonce, manifest, memory, cpu = sys.argv[1:]
{before_bootstrap}
if not bootstrap(parent, memory, cpu): raise SystemExit(3)
{before_ready}
ready = {{'protocol': PROTOCOL, 'kind': 'ready', 'nonce': nonce, 'manifest_id': manifest}}
sys.stdout.buffer.write(frame(ready)); sys.stdout.buffer.flush()
"""
        path.write_text(prefix + body, encoding="utf-8")
        return patch(BASE + "._ENTRY", path)

    def normal_body(self):
        return """n=struct.unpack('>I',read_exact(4))[0]
request=decode_header(read_exact(n)); validate_header(request, 'request')
raw=read_exact(request['raw_bytes'])
if sys.stdin.buffer.read(1): raise SystemExit(2)
response=dict(request,kind='response')
"""

    def test_immutable_bytes_and_unicode_identity(self):
        original = bytearray("پژوهش 😀 e\u0301\r\n".encode())
        captured = capture_bytes("s", original)
        expected = hashlib.sha256(original).hexdigest()
        original[:] = b"changed"
        supervisor = WorkerSupervisor()
        for _ in range(3):
            result = supervisor.run_synthetic(captured)
            self.assertEqual(result.raw_sha256, expected)
            self.assertEqual(result.raw_bytes, len(captured.raw))
            self.assertFalse(hasattr(result, "semantic_support"))
            self.assertFalse(supervisor.capabilities().untrusted_documents_enabled)

    def test_empty_and_large_pipe_payload(self):
        for raw in (b"", b"x" * (2 * 1024 * 1024)):
            self.assertEqual(
                WorkerSupervisor().run_synthetic(capture_bytes("s", raw)).raw_bytes, len(raw)
            )

    def test_no_file_or_untrusted_fallback(self):
        with patch(BASE + ".subprocess.Popen") as spawn, patch.object(Path, "open") as opened:
            self.failure("ISOLATION_UNAVAILABLE", lambda: run_untrusted_document(b"%PDF-1.7"))
            self.failure(
                "ISOLATION_UNAVAILABLE", lambda: capture_untrusted_path("../private-marker")
            )
            spawn.assert_not_called()
            opened.assert_not_called()
        caps = inspect_worker_capabilities()
        self.assertFalse(any(item.state == "ENFORCED_AND_TESTED" for item in caps.observations))
        for key in ("network_confinement", "filesystem_confinement", "qualified_process_tree"):
            self.assertIn(key, [item.control for item in caps.observations])
            self.assertEqual(
                next(item.state for item in caps.observations if item.control == key), "UNAVAILABLE"
            )

    @unittest.skipUnless(sys.platform == "win32", "Windows Job setup failure")
    def test_job_assignment_failure_withholds_source_and_reaps_root(self):
        from semantiq_lite._worker_windows import NativeJob

        actual_spawn = subprocess.Popen
        children = []

        def remember(*args, **kwargs):
            child = actual_spawn(*args, **kwargs)
            children.append(child)
            return child

        with patch.object(NativeJob, "attach", side_effect=OSError("private-marker")):
            with patch(BASE + ".subprocess.Popen", side_effect=remember):
                self.failure(
                    "ISOLATION_UNAVAILABLE", lambda: WorkerSupervisor().run_synthetic(self.source)
                )
        self.assertEqual(len(children), 1)
        self.assertIsNotNone(children[0].returncode)
        self.assertFalse(self.alive(children[0].pid))

    def test_truncated_and_duplicate_response(self):
        for suffix in (
            "sys.stdout.buffer.write(frame(response)[:-1])\n",
            'blob=json.dumps(response)[:-1]+\',"kind":"response"}\'; '
            "blob=blob.encode(); sys.stdout.buffer.write(struct.pack('>I',len(blob))+blob)\n",
            "sys.stdout.buffer.write(struct.pack('>I', 2**32-1))\n",
        ):
            with self.subTest(suffix=suffix), self.fixture(self.normal_body() + suffix):
                self.failure(
                    "PROTOCOL_ERROR", lambda: WorkerSupervisor().run_synthetic(self.source)
                )

    def test_limits_before_spawn_and_dataclass_bypass(self):
        with patch(BASE + ".subprocess.Popen") as spawn:
            for name in dataclasses.asdict(WorkerLimits()):
                for value in (
                    0,
                    -1,
                    True,
                    False,
                    10**400,
                    float("nan"),
                    float("inf"),
                    float("-inf"),
                ):
                    with self.subTest(name=name, value=value):
                        self.failure(
                            "INVALID_LIMITS",
                            lambda n=name, v=value: WorkerSupervisor(
                                dataclasses.replace(WorkerLimits(), **{n: v})
                            ),
                        )
            self.failure(
                "LIMIT_EXCEEDED",
                lambda: WorkerSupervisor().run_synthetic(
                    CapturedBytes("s", b"x" * (wire.RAW_MAX + 1))
                ),
            )
            self.failure(
                "INVALID_INPUT",
                lambda: WorkerSupervisor().run_synthetic(CapturedBytes("s", bytearray(b"mutable"))),
            )
            self.failure("INVALID_INPUT", lambda: capture_bytes("bad\n", b"ok"))
            spawn.assert_not_called()

    def test_total_request_limits_and_duplicate_ids(self):
        supervisor = WorkerSupervisor(dataclasses.replace(WorkerLimits(), total_raw_bytes=3))
        with patch(BASE + ".subprocess.Popen") as spawn:
            self.failure(
                "LIMIT_EXCEEDED",
                lambda: supervisor.run_synthetic_batch(
                    [capture_bytes("s1", b"ok"), capture_bytes("s2", b"ok")]
                ),
            )
            self.failure(
                "INVALID_INPUT",
                lambda: WorkerSupervisor().run_synthetic_batch([self.source, self.source]),
            )
            self.failure(
                "LIMIT_EXCEEDED", lambda: WorkerSupervisor().run_synthetic_batch([self.source] * 17)
            )
            spawn.assert_not_called()

    def test_request_deadline_does_not_reset_between_sources(self):
        supervisor = WorkerSupervisor(dataclasses.replace(WorkerLimits(), request_seconds=0.5))
        result = SyntheticResult("s", 2, wire.digest(b"ok"), "b" * 64, ())
        with patch(BASE + ".time.monotonic", side_effect=[0, 0, 0, 1]):
            with patch.object(supervisor, "_one", return_value=result) as one:
                self.failure(
                    "PARSE_TIMEOUT",
                    lambda: supervisor.run_synthetic_batch(
                        [self.source, capture_bytes("s2", b"ok")]
                    ),
                )
                self.assertEqual(one.call_count, 1)

    def test_timeout_before_ready_and_recovery(self):
        limits = dataclasses.replace(WorkerLimits(), source_seconds=0.3)
        supervisor = WorkerSupervisor(limits)
        started = time.monotonic()
        with self.fixture("", before_ready="time.sleep(20)"):
            self.failure("PARSE_TIMEOUT", lambda: supervisor.run_synthetic(self.source))
        self.assertLess(time.monotonic() - started, 2.5)
        self.assertEqual(supervisor.run_synthetic(self.source).raw_bytes, 2)

    def test_blocked_input_writer_and_reader(self):
        supervisor = WorkerSupervisor(dataclasses.replace(WorkerLimits(), source_seconds=0.3))
        started = time.monotonic()
        with self.fixture("time.sleep(20)\n"):
            self.failure(
                "PARSE_TIMEOUT",
                lambda: supervisor.run_synthetic(capture_bytes("s", b"x" * wire.RAW_MAX)),
            )
        self.assertLess(time.monotonic() - started, 2.5)

    def test_stdout_and_stderr_overflow(self):
        limits = dataclasses.replace(WorkerLimits(), output_bytes=128, stderr_bytes=128)
        for stream in ("stdout", "stderr"):
            with (
                self.subTest(stream=stream),
                self.fixture(
                    "",
                    before_ready=(
                        f"sys.{stream}.buffer.write(b'x'*8192); "
                        f"sys.{stream}.buffer.flush(); time.sleep(20)"
                    ),
                ),
            ):
                self.failure(
                    "LIMIT_EXCEEDED", lambda: WorkerSupervisor(limits).run_synthetic(self.source)
                )

    def test_crash_and_setup_failure_before_input(self):
        for code, error in ((7, "WORKER_CRASH"), (3, "ISOLATION_UNAVAILABLE")):
            with self.fixture("", before_bootstrap=f"raise SystemExit({code})"):
                self.failure(error, lambda: WorkerSupervisor().run_synthetic(self.source))
        self.assertEqual(WorkerSupervisor().run_synthetic(self.source).raw_bytes, 2)

    def test_invalid_ready_never_releases_request(self):
        with self.fixture(
            "",
            before_ready="""nonce='0'*32
""",
        ):
            self.failure("PROTOCOL_ERROR", lambda: WorkerSupervisor().run_synthetic(self.source))

    def test_protocol_response_mutations_and_trailing_frames(self):
        for mutation in (
            "response['nonce']='0'*32",
            "response['raw_sha256']='0'*64",
            "response['source_id']='other'",
            "response['command']='private-marker'",
        ):
            code = self.normal_body() + mutation + "\n"
            code += (
                "blob=json.dumps(response).encode(); "
                "sys.stdout.buffer.write(struct.pack('>I',len(blob))+blob)\n"
            )
            with self.subTest(mutation=mutation), self.fixture(code):
                self.failure(
                    "PROTOCOL_ERROR", lambda: WorkerSupervisor().run_synthetic(self.source)
                )
        with self.fixture(
            self.normal_body() + "sys.stdout.buffer.write(frame(response)+b'extra')\n"
        ):
            self.failure("PROTOCOL_ERROR", lambda: WorkerSupervisor().run_synthetic(self.source))

    def test_clean_stderr_not_forwarded_and_environment_not_inherited(self):
        body = (
            self.normal_body()
            + "sys.stderr.write('private-marker'); sys.stdout.buffer.write(frame(response))\n"
        )
        with patch.dict(
            os.environ, {"SEMANTIQ_TEST_SECRET": "private-marker", "PYTHONPATH": "private-marker"}
        ):
            with self.fixture(body, before_ready="assert 'SEMANTIQ_TEST_SECRET' not in os.environ"):
                result = WorkerSupervisor().run_synthetic(self.source)
                self.assertNotIn("private-marker", repr(result))

    def test_cleanup_failure_quarantines_supervisor(self):
        supervisor = WorkerSupervisor()
        original = supervisor._cleanup

        def failed(*args):
            original(*args)
            return False

        with patch.object(supervisor, "_cleanup", side_effect=failed):
            self.failure("CLEANUP_FAILED", lambda: supervisor.run_synthetic(self.source))
        with patch(BASE + ".subprocess.Popen") as spawn:
            self.failure("CLEANUP_FAILED", lambda: supervisor.run_synthetic(self.source))
            spawn.assert_not_called()

    def test_concurrent_use_rejected(self):
        supervisor = WorkerSupervisor()
        supervisor._lock.acquire()
        try:
            self.failure("WORKER_BUSY", lambda: supervisor.run_synthetic(self.source))
        finally:
            supervisor._lock.release()

    def test_protected_memory_rejection(self):
        limits = dataclasses.replace(
            WorkerLimits(), memory_bytes=64 * 1024 * 1024, job_memory_bytes=128 * 1024 * 1024
        )
        body = (
            self.normal_body()
            + """try:
    value=bytearray(96*1024*1024)
except MemoryError:
    sys.stdout.buffer.write(frame(response))
else:
    raise SystemExit(7)
"""
        )
        with self.fixture(body):
            self.assertEqual(WorkerSupervisor(limits).run_synthetic(self.source).raw_bytes, 2)

    def alive(self, pid):
        if sys.platform == "linux":
            proc = Path(f"/proc/{pid}/stat")
            try:
                return proc.read_text().split()[2] != "Z"
            except FileNotFoundError:
                return False
        import ctypes
        from ctypes import wintypes

        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.OpenProcess.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.DWORD]
        kernel.OpenProcess.restype = wintypes.HANDLE
        kernel.WaitForSingleObject.argtypes = [wintypes.HANDLE, wintypes.DWORD]
        kernel.CloseHandle.argtypes = [wintypes.HANDLE]
        handle = kernel.OpenProcess(0x100000, False, pid)
        if not handle:
            return ctypes.get_last_error() == 5
        try:
            return kernel.WaitForSingleObject(handle, 0) == 258
        finally:
            kernel.CloseHandle(handle)

    def test_normal_root_exit_reaps_non_escaping_child(self):
        code = (
            self.normal_body()
            + """child=subprocess.Popen(
    [sys.executable,'-I','-S','-B','-c','import time; time.sleep(10)'],
    stdin=subprocess.DEVNULL,stdout=sys.stdout.buffer,stderr=sys.stderr.buffer,
    close_fds=True,creationflags=0x08000000 if sys.platform=='win32' else 0)
sys.stderr.write(str(child.pid)); sys.stderr.flush()
sys.stdout.buffer.write(frame(response)); sys.stdout.buffer.flush()
"""
        )
        limits = dataclasses.replace(WorkerLimits(), processes=2)
        supervisor = WorkerSupervisor(limits)
        cleanup = supervisor._cleanup
        captured = []

        def record(*args):
            result = cleanup(*args)
            captured.append(args[2][1].value())
            return result

        with self.fixture(code):
            with patch.object(supervisor, "_cleanup", side_effect=record):
                self.assertEqual(supervisor.run_synthetic(self.source).raw_bytes, 2)
        self.assertFalse(self.alive(int(captured[0])))

    def test_parent_death_stops_direct_worker(self):
        from semantiq_lite.worker import _executable

        with self.fixture("time.sleep(20)\n") as unused:
            # Launch a real parent, then kill it. No helper obtains approval or parses a document.
            del unused
            entry = self.root / "fixed fixture worker.py"
            program = f"""import sys
sys.path[:0]=[{str(PACKAGE.parent)!r},{sysconfig.get_path("purelib")!r}]
from pathlib import Path
import semantiq_lite.worker as worker
worker._ENTRY=Path({str(entry)!r})
original_spawn=worker.subprocess.Popen
original_value=worker._Drain.value
created=[]
announced=[]
def spawn(*args,**kwargs):
    process=original_spawn(*args,**kwargs)
    created.append(process.pid)
    return process
def value(self):
    raw=original_value(self)
    item=worker.take_frame(raw)
    if created and item and item[0].get('kind')=='ready' and not announced:
        announced.append(True)
        print(created[0],flush=True)
    return raw
worker.subprocess.Popen=spawn
worker._Drain.value=value
worker.WorkerSupervisor().run_synthetic(worker.capture_bytes('s',b'ok'))
"""
            parent = subprocess.Popen(
                [_executable(), "-I", "-S", "-B", "-c", program],
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                close_fds=True,
                creationflags=0x08000000 if sys.platform == "win32" else 0,
            )
            try:
                import queue
                import threading

                received = queue.Queue()
                reader = threading.Thread(
                    target=lambda: received.put(parent.stdout.readline(128)), daemon=True
                )
                reader.start()
                pid = int(received.get(timeout=4))
                self.assertTrue(self.alive(pid))
                parent.kill()
                parent.wait(timeout=2)
                deadline = time.monotonic() + 2
                while self.alive(pid) and time.monotonic() < deadline:
                    time.sleep(0.01)
                self.assertFalse(self.alive(pid))
            finally:
                if parent.poll() is None:
                    parent.kill()
                    parent.wait(timeout=2)
                reader.join(timeout=2)
                parent.stdout.close()

    @unittest.skipUnless(sys.platform == "linux", "Actual FD inheritance probe is Linux-only")
    def test_linux_descriptor_not_inherited(self):
        import fcntl

        with (self.root / "canary").open("wb") as stream:
            descriptor = fcntl.fcntl(stream.fileno(), fcntl.F_DUPFD, 200)
            os.set_inheritable(descriptor, True)
            try:
                before = f"""try:
    os.fstat({descriptor})
except OSError:
    pass
else:
    raise SystemExit(7)
"""
                with self.fixture(
                    self.normal_body() + "sys.stdout.buffer.write(frame(response))\n",
                    before_ready=before,
                ):
                    self.assertEqual(WorkerSupervisor().run_synthetic(self.source).raw_bytes, 2)
            finally:
                os.close(descriptor)

    @unittest.skipUnless(
        sys.platform == "linux", "Windows CPU enforcement not qualified; no CPU workload"
    )
    def test_linux_protected_cpu_limit(self):
        limits = dataclasses.replace(WorkerLimits(), cpu_seconds=1, source_seconds=3)
        with self.fixture("while True: pass\n"):
            self.failure(
                "WORKER_CRASH", lambda: WorkerSupervisor(limits).run_synthetic(self.source)
            )


if __name__ == "__main__":
    unittest.main()

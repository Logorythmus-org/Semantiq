"""Fixed synthetic byte/hash worker. No parser, filesystem intake or arbitrary commands."""

from __future__ import annotations

import os
import struct
import sys
from pathlib import Path

# -I -S -B omits site/user paths; allow only this installed, trusted module directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from _worker_wire import (  # noqa: E402
    HEADER_MAX,
    PROTOCOL,
    WireError,
    decode_header,
    digest,
    frame,
    manifest_id,
    validate_header,
)


def read_exact(size: int) -> bytes:
    chunks = bytearray()
    while len(chunks) < size:
        chunk = sys.stdin.buffer.read(min(65536, size - len(chunks)))
        if not chunk:
            raise WireError()
        chunks.extend(chunk)
    return bytes(chunks)


def bootstrap(parent: str, memory: str, cpu: str) -> bool:
    if sys.platform == "linux":
        import ctypes
        import resource
        import signal

        libc = ctypes.CDLL(None, use_errno=True)
        if libc.prctl(1, signal.SIGKILL, 0, 0, 0) != 0 or os.getppid() != int(parent):
            return False
    if read_exact(2) != b"GO":
        return False
    if sys.platform == "linux":
        resource.setrlimit(resource.RLIMIT_AS, (int(memory), int(memory)))
        resource.setrlimit(resource.RLIMIT_CPU, (int(cpu), int(cpu)))
        resource.setrlimit(resource.RLIMIT_CORE, (0, 0))
        resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
        resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
        if resource.getrlimit(resource.RLIMIT_AS)[1] != int(memory):
            return False
    return True


def main() -> int:
    # Trusted arguments from supervisor: parent PID, nonce, source-manifest, memory and CPU.
    parent, nonce, expected_manifest, memory, cpu = sys.argv[1:]
    if not bootstrap(parent, memory, cpu):
        return 3
    if expected_manifest != manifest_id():
        return 3
    ready = {
        "protocol": PROTOCOL,
        "kind": "ready",
        "nonce": nonce,
        "manifest_id": expected_manifest,
    }
    sys.stdout.buffer.write(frame(ready))
    sys.stdout.buffer.flush()
    length = struct.unpack(">I", read_exact(4))[0]
    if not 0 < length <= HEADER_MAX:
        raise WireError()
    request = decode_header(read_exact(length))
    validate_header(request, "request")
    if request["nonce"] != nonce or request["manifest_id"] != expected_manifest:
        raise WireError()
    raw = read_exact(request["raw_bytes"])
    if sys.stdin.buffer.read(1) or digest(raw) != request["raw_sha256"]:
        raise WireError()
    response = dict(request, kind="response")
    sys.stdout.buffer.write(frame(response))
    sys.stdout.buffer.flush()
    return 0


if __name__ == "__main__":
    try:
        code = main()
    except WireError:
        code = 2
    except Exception:
        code = 3
    # Fixed exit codes; no raw exception/library traceback or content on stderr.
    raise SystemExit(code)

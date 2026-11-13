"""Small stdlib-only transport. This protocol is not a review/evidence contract."""

from __future__ import annotations

import hashlib
import json
import re
import struct
import sys
from pathlib import Path
from typing import Any

PROTOCOL = "semantiq-lite-worker/0.1.0"
HEADER_MAX = 16 * 1024
RAW_MAX = 2 * 1024 * 1024
ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}")
HEX32 = re.compile(r"[a-f0-9]{32}")
HEX64 = re.compile(r"[a-f0-9]{64}")


class WireError(ValueError):
    def __init__(self) -> None:
        super().__init__("PROTOCOL_ERROR")


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def manifest_id() -> str:
    root = Path(__file__).resolve().parent
    return digest(
        b"worker-runtime-v1\0"
        + sys.version.encode("utf-8")
        + b"\0"
        + sys.implementation.name.encode("ascii")
        + b"\0"
        + sys.platform.encode("ascii")
        + str(struct.calcsize("P")).encode("ascii")
        + b"\0"
        + (root / "_worker_wire.py").read_bytes()
        + b"\0"
        + (root / "_worker_entry.py").read_bytes()
    )


def _pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise WireError()
        result[key] = value
    return result


def _integer(value: str) -> int:
    if len(value) > 20:
        raise WireError()
    return int(value)


def _no_number(value: str) -> None:
    raise WireError()


def decode_header(raw: bytes) -> dict[str, Any]:
    if not raw or len(raw) > HEADER_MAX:
        raise WireError()
    # Bound nesting before json.loads; the actual protocol is flat.
    depth = 0
    quoted = escaped = False
    for byte in raw:
        if quoted:
            if escaped:
                escaped = False
            elif byte == 92:
                escaped = True
            elif byte == 34:
                quoted = False
        elif byte == 34:
            quoted = True
        elif byte in (91, 123):
            depth += 1
            if depth > 8:
                raise WireError()
        elif byte in (93, 125):
            depth -= 1
    try:
        result = json.loads(
            raw.decode("utf-8", "strict"),
            object_pairs_hook=_pairs,
            parse_int=_integer,
            parse_float=_no_number,
            parse_constant=_no_number,
        )
        if type(result) is not dict:
            raise WireError()
        # Reject escaped surrogate code points too.
        json.dumps(result, ensure_ascii=False, allow_nan=False).encode("utf-8", "strict")
    except (ValueError, TypeError, UnicodeError, RecursionError):
        raise WireError() from None
    return result


def validate_header(header: dict[str, Any], kind: str) -> None:
    if kind not in ("ready", "request", "response"):
        raise WireError()
    common = {"protocol", "kind", "nonce", "manifest_id"}
    fields = common | ({"source_id", "raw_bytes", "raw_sha256"} if kind != "ready" else set())
    if set(header) != fields or header.get("protocol") != PROTOCOL or header.get("kind") != kind:
        raise WireError()
    for name, pattern in (("nonce", HEX32), ("manifest_id", HEX64)):
        if type(header[name]) is not str or not pattern.fullmatch(header[name]):
            raise WireError()
    if kind != "ready":
        if (
            type(header["source_id"]) is not str
            or not ID.fullmatch(header["source_id"])
            or type(header["raw_bytes"]) is not int
            or not 0 <= header["raw_bytes"] <= RAW_MAX
            or type(header["raw_sha256"]) is not str
            or not HEX64.fullmatch(header["raw_sha256"])
        ):
            raise WireError()


def frame(header: dict[str, Any]) -> bytes:
    validate_header(header, header.get("kind", ""))
    raw = json.dumps(
        header, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False
    ).encode("utf-8")
    if not 0 < len(raw) <= HEADER_MAX:
        raise WireError()
    return struct.pack(">I", len(raw)) + raw


def take_frame(raw: bytes, *, limit: int = HEADER_MAX) -> tuple[dict[str, Any], int] | None:
    if len(raw) < 4:
        return None
    length = struct.unpack(">I", raw[:4])[0]
    if not 0 < length <= min(HEADER_MAX, limit):
        raise WireError()
    if len(raw) < length + 4:
        return None
    return decode_header(raw[4 : length + 4]), length + 4

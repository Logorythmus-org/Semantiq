"""Bounded UTF-8 intake. Paths are relative to a caller-authorized root."""

from __future__ import annotations

import hashlib
import stat
from dataclasses import replace
from pathlib import Path
from typing import Literal

from .contracts import DEFAULT_LIMITS, ResourceLimits, SourceSnapshot
from .validation import ContractError, check_limits


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(raw: bytes) -> str:
    try:
        return raw.decode("utf-8", errors="strict").replace("\r\n", "\n").replace("\r", "\n")
    except UnicodeDecodeError:
        raise ContractError("INVALID_ENCODING", "source") from None


def snapshot(
    source_id: str,
    raw: bytes,
    media_type: Literal["text/plain", "text/markdown"] = "text/plain",
    limits: ResourceLimits = DEFAULT_LIMITS,
) -> SourceSnapshot:
    check_limits(limits)
    if not isinstance(raw, bytes):
        raise ContractError("INVALID_CONTRACT", "source")
    if len(raw) > min(limits.raw_bytes_per_source, limits.total_raw_bytes):
        raise ContractError("LIMIT_EXCEEDED", "raw_bytes")
    text = canonical(raw)
    if len(text) > min(limits.characters_per_source, limits.total_characters):
        raise ContractError("LIMIT_EXCEEDED", "characters")
    from .validation import SCHEMA, VALIDATOR

    source_schema = SCHEMA["$defs"]["SourceSnapshot"]
    if not VALIDATOR.evolve(schema=source_schema["properties"]["source_id"]).is_valid(
        source_id
    ) or media_type not in ("text/plain", "text/markdown"):
        raise ContractError("INVALID_CONTRACT", "source")
    return SourceSnapshot(source_id, media_type, digest(raw), digest(text.encode("utf-8")), text)


def load_local(
    root: Path, relative: str, source_id: str, limits: ResourceLimits = DEFAULT_LIMITS
) -> SourceSnapshot:
    check_limits(limits)
    path = Path(relative)
    if path.is_absolute() or path.drive or ".." in path.parts or not path.parts or ":" in relative:
        raise ContractError("UNSAFE_PATH", "source")
    try:
        base = root.resolve(strict=True)
        candidate = base
        for part in path.parts:
            candidate = candidate / part
            info = candidate.lstat()
            if candidate.is_symlink() or getattr(info, "st_file_attributes", 0) & 0x400:
                raise ContractError("UNSAFE_PATH", "source")
        candidate.resolve(strict=True).relative_to(base)
        if not stat.S_ISREG(candidate.stat().st_mode):
            raise ContractError("UNSAFE_PATH", "source")
        suffix = candidate.suffix.lower()
        if suffix not in (".txt", ".md"):
            raise ContractError("INVALID_CONTRACT", "media_type")
        media: Literal["text/plain", "text/markdown"] = (
            "text/markdown" if suffix == ".md" else "text/plain"
        )
        with candidate.open("rb") as stream:
            raw = stream.read(min(limits.raw_bytes_per_source, limits.total_raw_bytes) + 1)
    except ContractError:
        raise
    except (OSError, ValueError):
        raise ContractError("UNSAFE_PATH", "source") from None
    return replace(
        snapshot(source_id, raw, media, limits), origin={"relative_path": path.as_posix()}
    )

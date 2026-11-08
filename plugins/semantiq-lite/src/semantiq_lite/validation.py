"""Fail-closed integrity checks with content-free diagnostic records."""

from __future__ import annotations

import json
import math
import sys
from collections.abc import Mapping
from dataclasses import asdict
from importlib.resources import files
from typing import Any

from jsonschema import Draft202012Validator

from .contracts import DEFAULT_LIMITS, ResourceLimits, ReviewResult, ValidationErrorRecord

SCHEMA = json.loads(files("semantiq_lite").joinpath("review.schema.json").read_text("utf-8"))
VALIDATOR = Draft202012Validator(SCHEMA)


class ContractError(ValueError):
    def __init__(self, code: str, location: str):
        self.record = ValidationErrorRecord(code, location)
        super().__init__(f"{code}: {location}")


def check_limits(limits: ResourceLimits) -> None:
    values = asdict(limits)
    for name, value in values.items():
        if name.endswith("seconds"):
            # Compare integers directly; converting an arbitrary int to float can overflow.
            valid = (type(value) is int and 0 < value <= sys.float_info.max) or (
                type(value) is float and math.isfinite(value) and value > 0
            )
        else:
            # The bounded reader adds one byte; reserve room in a platform-sized index.
            valid = type(value) is int and 0 < value < sys.maxsize
        if not valid:
            raise ContractError("INVALID_CONTRACT", "limits")
    if not Draft202012Validator(SCHEMA["$defs"]["ResourceLimits"]).is_valid(values):
        raise ContractError("INVALID_CONTRACT", "limits")


def _wire(review: ReviewResult | dict[str, Any]) -> dict[str, Any]:
    return review.to_dict() if isinstance(review, ReviewResult) else review


def _serialize(data: Any, limits: ResourceLimits) -> str:
    chunks: list[str] = []
    size = 0
    try:
        for chunk in json.JSONEncoder(
            ensure_ascii=False, allow_nan=False, separators=(",", ":")
        ).iterencode(data):
            size += len(chunk.encode("utf-8"))
            if size > limits.output_bytes:
                raise ContractError("LIMIT_EXCEEDED", "output_bytes")
            chunks.append(chunk)
    except UnicodeEncodeError:
        raise ContractError("INVALID_ENCODING", "review") from None
    except ContractError:
        raise
    except (ValueError, TypeError, RecursionError):
        raise ContractError("INVALID_CONTRACT", "review") from None
    return "".join(chunks)


def validate_review(
    review: ReviewResult | dict[str, Any],
    raw_sources: Mapping[str, bytes],
    limits: ResourceLimits = DEFAULT_LIMITS,
) -> None:
    from .snapshots import canonical, digest

    check_limits(limits)
    data = _wire(review)
    if not VALIDATOR.is_valid(data):
        raise ContractError("INVALID_CONTRACT", "review")
    _serialize(data, limits)
    for key, cap in (
        ("sources", limits.sources),
        ("claims", limits.claims),
        ("anchors", limits.anchors),
        ("links", limits.anchors),
    ):
        if len(data[key]) > cap:
            raise ContractError("LIMIT_EXCEEDED", key)
    indexes: dict[str, dict[str, Any]] = {}
    for collection, id_field in (
        ("sources", "source_id"),
        ("claims", "claim_id"),
        ("anchors", "anchor_id"),
        ("links", "link_id"),
    ):
        index = {}
        for item in data[collection]:
            if item[id_field] in index:
                raise ContractError("DUPLICATE_ID", collection)
            index[item[id_field]] = item
        indexes[collection] = index
    if not data["sources"] or set(raw_sources) != set(indexes["sources"]):
        raise ContractError("DANGLING_REFERENCE", "raw_sources")
    raw_total = text_total = 0
    for source in data["sources"]:
        raw = raw_sources[source["source_id"]]
        if not isinstance(raw, bytes):
            raise ContractError("INVALID_CONTRACT", "raw_sources")
        raw_total += len(raw)
        text_total += len(source["extracted_text"])
        if (
            len(raw) > limits.raw_bytes_per_source
            or raw_total > limits.total_raw_bytes
            or len(source["extracted_text"]) > limits.characters_per_source
            or text_total > limits.total_characters
        ):
            raise ContractError("LIMIT_EXCEEDED", "sources")
        text = canonical(raw)
        if (
            digest(raw) != source["raw_sha256"]
            or digest(source["extracted_text"].encode("utf-8")) != source["text_sha256"]
            or text != source["extracted_text"]
        ):
            raise ContractError("HASH_MISMATCH", "sources")
    for anchor in data["anchors"]:
        if type(anchor["start"]) is not int or type(anchor["end"]) is not int:
            raise ContractError("INVALID_CONTRACT", "anchors")
        if len(anchor["quote"]) > limits.quote_characters:
            raise ContractError("LIMIT_EXCEEDED", "quote")
        source = indexes["sources"].get(anchor["source_id"])
        if source is None:
            raise ContractError("DANGLING_REFERENCE", "anchors")
        text = source["extracted_text"]
        start, end = anchor["start"], anchor["end"]
        if not (0 <= start < end <= len(text)) or text[start:end] != anchor["quote"]:
            raise ContractError("ANCHOR_MISMATCH", "anchors")
    for link in data["links"]:
        if link["claim_id"] not in indexes["claims"] or link["anchor_id"] not in indexes["anchors"]:
            raise ContractError("DANGLING_REFERENCE", "links")
        if (
            link["semantic_support"] != "NOT_ASSESSED"
            or link["independent_validation"] != "NOT_ATTEMPTED"
        ):
            raise ContractError("INVALID_STATE_TRANSITION", "links")


def dumps_review(
    review: ReviewResult | dict[str, Any],
    raw_sources: Mapping[str, bytes],
    limits: ResourceLimits = DEFAULT_LIMITS,
) -> str:
    validate_review(review, raw_sources, limits)
    return _serialize(_wire(review), limits)

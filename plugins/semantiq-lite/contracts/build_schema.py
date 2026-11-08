"""Regenerate the public schema and its identical installed-package copy."""

import json
from pathlib import Path


def obj(fields):
    return {
        "type": "object",
        "properties": fields,
        "required": list(fields),
        "additionalProperties": False,
    }


def enum(*values):
    return {"enum": list(values)}


def array(name):
    return {"type": "array", "items": {"$ref": "#/$defs/" + name}}


string = {"type": "string"}
identifier = {
    "type": "string",
    "minLength": 1,
    "maxLength": 128,
    "pattern": "^[A-Za-z0-9][A-Za-z0-9_.:-]*$",
}
sha256 = {"type": "string", "pattern": "^[a-f0-9]{64}$"}
definitions = {
    "SourceSnapshot": obj(
        dict(
            source_id=identifier,
            media_type=enum("text/plain", "text/markdown"),
            raw_sha256=sha256,
            text_sha256=sha256,
            extracted_text=string,
            extractor_name=enum("semantiq-lite-utf8"),
            extractor_version=enum("0.2.0"),
            encoding=enum("utf-8"),
            normalization=enum("lf-only-v1"),
            origin={"type": "object", "additionalProperties": string},
        )
    ),
    "EvidenceAnchor": obj(
        dict(
            anchor_id=identifier,
            source_id=identifier,
            start={"type": "integer", "minimum": 0},
            end={"type": "integer", "minimum": 1},
            quote={"type": "string", "minLength": 1},
        )
    ),
    "ResearchClaim": obj(dict(claim_id=identifier, text={"type": "string", "minLength": 1})),
    "ClaimEvidenceLink": obj(
        dict(
            link_id=identifier,
            claim_id=identifier,
            anchor_id=identifier,
            semantic_support=enum(
                "SUPPORTED_BY_SOURCE",
                "PARTIALLY_SUPPORTED",
                "CONTRADICTED",
                "INSUFFICIENT_EVIDENCE",
                "NOT_ASSESSED",
            ),
            independent_validation=enum(
                "NOT_ATTEMPTED", "INSUFFICIENT_DATA", "PARTIAL", "INDEPENDENTLY_VALIDATED"
            ),
        )
    ),
    "ValidationErrorRecord": obj(
        dict(
            code=enum(
                "LIMIT_EXCEEDED",
                "INVALID_CONTRACT",
                "ANCHOR_MISMATCH",
                "INVALID_ENCODING",
                "PARSE_TIMEOUT",
                "HASH_MISMATCH",
                "DUPLICATE_ID",
                "DANGLING_REFERENCE",
                "INVALID_STATE_TRANSITION",
                "UNSAFE_PATH",
            ),
            location=string,
        )
    ),
    "ResourceLimits": obj(
        {
            key: {"type": "number" if key.endswith("seconds") else "integer", "exclusiveMinimum": 0}
            for key in (
                "raw_bytes_per_source",
                "total_raw_bytes",
                "characters_per_source",
                "total_characters",
                "sources",
                "claims",
                "anchors",
                "quote_characters",
                "source_seconds",
                "request_seconds",
                "output_bytes",
            )
        }
    ),
}
schema = obj(
    dict(
        sources=array("SourceSnapshot"),
        claims=array("ResearchClaim"),
        anchors=array("EvidenceAnchor"),
        links=array("ClaimEvidenceLink"),
        contract=enum("semantiq-lite-review/0.2.0"),
        review_required={"const": True},
        limitations={"type": "array", "minItems": 1, "items": {"type": "string", "minLength": 1}},
    )
)
schema.update(
    {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "urn:semantiq-lite-review:0.2.0",
        "$defs": definitions,
    }
)

if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    payload = json.dumps(schema, indent=2) + "\n"
    for path in (
        root / "contracts/semantiq-lite-review-v0.2.schema.json",
        root / "src/semantiq_lite/review.schema.json",
    ):
        path.write_text(payload, encoding="utf-8")

"""Explicitly regenerate the internal worker schema; never modifies the 0.2 review schema."""

import json
from pathlib import Path


def obj(properties):
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties),
        "additionalProperties": False,
    }


def text(pattern):
    return {"type": "string", "pattern": pattern}


common = {
    "protocol": {"const": "semantiq-lite-worker/0.1.0"},
    "kind": {"enum": ["request", "ready", "response"]},
    "nonce": text(r"^[a-f0-9]{32}(?![\s\S])"),
    "manifest_id": text(r"^[a-f0-9]{64}(?![\s\S])"),
}
source = {
    "source_id": text(r"^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}(?![\s\S])"),
    "raw_bytes": {"type": "integer", "minimum": 0, "maximum": 2097152},
    "raw_sha256": text(r"^[a-f0-9]{64}(?![\s\S])"),
}
definitions = {}
for kind in ("ready", "request", "response"):
    fields = dict(common, kind={"const": kind})
    if kind != "ready":
        fields.update(source)
    definitions[kind] = obj(fields)
definitions["capabilities"] = obj(
    {
        "protocol": common["protocol"],
        "platform_kind": {"enum": ["WINDOWS_NATIVE", "LINUX_NATIVE", "LINUX_WSL", "UNSUPPORTED"]},
        "authorization": {"const": "B1_SYNTHETIC_ONLY"},
        "untrusted_documents_enabled": {"const": False},
        "declared_controls": {"type": "array", "uniqueItems": True, "items": {"type": "string"}},
        "observations": {
            "type": "array",
            "items": obj(
                {
                    "control": {"type": "string"},
                    "state": {
                        "enum": [
                            "ENFORCED_AND_TESTED",
                            "IMPLEMENTED_NOT_QUALIFIED",
                            "UNAVAILABLE",
                            "NOT_TESTED",
                        ]
                    },
                    "evidence": {"type": "string"},
                }
            ),
        },
    }
)
definitions["error"] = obj(
    {
        "protocol": common["protocol"],
        "code": {
            "enum": [
                "INVALID_LIMITS",
                "INVALID_INPUT",
                "LIMIT_EXCEEDED",
                "WORKER_BUSY",
                "ISOLATION_UNAVAILABLE",
                "PARSE_TIMEOUT",
                "WORKER_CRASH",
                "PROTOCOL_ERROR",
                "CLEANUP_FAILED",
            ]
        },
        "location": {"const": "worker"},
    }
)
schema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "urn:semantiq-lite-worker:0.1.0",
    "description": "Internal B1 protocol; not a review or extraction contract. "
    "Runtime framing, duplicate keys, exact Python types, identity, "
    "byte limits and handshake ordering require code validation.",
    "oneOf": [{"$ref": "#/$defs/" + name} for name in definitions],
    "$defs": definitions,
}

if __name__ == "__main__":
    Path(__file__).with_name("semantiq-lite-worker-v0.1.schema.json").write_text(
        json.dumps(schema, indent=2) + "\n", encoding="utf-8"
    )

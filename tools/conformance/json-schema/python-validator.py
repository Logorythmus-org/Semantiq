#!/usr/bin/env python3
"""Run the shared SemantIQ vectors with python-jsonschema."""

import json
import sys
from importlib.metadata import version
from pathlib import Path

from jsonschema import Draft202012Validator


def category(error):
    return {
        "required": "missing-required",
        "type": "type-mismatch",
        "const": "const-mismatch",
    }.get(error.validator, "other-invalid")


root = Path(__file__).resolve().parents[3]
vectors = json.loads((Path(__file__).parent / "vectors.json").read_text(encoding="utf-8"))
schemas = {
    entry["id"]: json.loads((root / entry["path"]).read_text(encoding="utf-8"))
    for entry in vectors["schemas"]
}
results = []
for case in vectors["cases"]:
    validator = Draft202012Validator(schemas[case["schema"]])
    errors = sorted(validator.iter_errors(case["instance"]), key=lambda item: list(item.path))
    results.append(
        {
            "case": case["id"],
            "valid": not errors,
            "category": None if not errors else category(errors[0]),
        }
    )

json.dump(
    {
        "validator": "python-jsonschema",
        "version": version("jsonschema"),
        "runtimeVersion": ".".join(map(str, sys.version_info[:3])),
        "results": results,
    },
    sys.stdout,
    separators=(",", ":"),
)

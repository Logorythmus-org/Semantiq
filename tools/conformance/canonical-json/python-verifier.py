#!/usr/bin/env python3
"""Independent Python verifier for SemantIQ canonicalization profiles."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPOSITORY_ROOT / "packages" / "python" / "src"))

from semantiq.contracts import (  # noqa: E402
    LEGACY_PYTHON_CANONICALIZATION_PROFILE,
    SHARED_CANONICALIZATION_PROFILE,
    hash_canonical,
)


def materialize_tagged_input(tagged: dict[str, str]) -> Any:
    input_type = tagged["type"]
    if input_type == "negative-zero":
        return -0.0
    if input_type == "float":
        return float(tagged["value"])
    if input_type == "nan":
        return float("nan")
    if input_type == "positive-infinity":
        return float("inf")
    if input_type == "negative-infinity":
        return float("-inf")
    if input_type == "unsafe-positive-integer":
        return 9_007_199_254_740_992
    if input_type == "unsafe-negative-integer":
        return -9_007_199_254_740_992
    raise ValueError(f"Unknown tagged input: {input_type}")


def main() -> int:
    vector_path = Path(sys.argv[1])
    legacy_path = Path(sys.argv[2])
    vectors = json.loads(vector_path.read_text(encoding="utf-8"))
    legacy = json.loads(legacy_path.read_text(encoding="utf-8"))
    results: list[dict[str, Any]] = []

    for vector in vectors["supported"]:
        result = hash_canonical(vector["input"], profile=SHARED_CANONICALIZATION_PROFILE)
        results.append(
            {
                "id": vector["id"],
                "status": "SUPPORTED",
                "canonicalUtf8": result["canonicalUtf8"],
                "canonicalUtf8Hex": result["canonicalUtf8Hex"],
                "sha256": result["sha256"],
            }
        )

    for vector in vectors["outOfDomain"]:
        try:
            hash_canonical(
                materialize_tagged_input(vector["taggedInput"]),
                profile=SHARED_CANONICALIZATION_PROFILE,
            )
        except (TypeError, ValueError):
            status = "OUT_OF_DOMAIN"
        else:
            status = "UNEXPECTEDLY_SUPPORTED"
        results.append({"id": vector["id"], "status": status})

    legacy_result = hash_canonical(
        legacy["input"], profile=LEGACY_PYTHON_CANONICALIZATION_PROFILE
    )
    output = {
        "implementation": "python-reference-v1",
        "profile": SHARED_CANONICALIZATION_PROFILE,
        "results": results,
        "legacy": {
            "profile": LEGACY_PYTHON_CANONICALIZATION_PROFILE,
            "canonicalUtf8": legacy_result["canonicalUtf8"],
            "sha256": legacy_result["sha256"],
        },
    }
    # The transport is ASCII-safe so Windows console encodings cannot alter verifier output.
    sys.stdout.write(json.dumps(output, ensure_ascii=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

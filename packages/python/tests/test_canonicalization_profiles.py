import json
from pathlib import Path

import pytest

from semantiq.contracts import (
    LEGACY_PYTHON_CANONICALIZATION_PROFILE,
    SHARED_CANONICALIZATION_PROFILE,
    canonicalize_v1,
    hash_canonical,
)


def test_shared_v1_profile_metadata_and_unicode_policy():
    result = hash_canonical(
        {"input": "synthetic", "text": "سلام 🔬"},
        profile=SHARED_CANONICALIZATION_PROFILE,
    )
    assert result["canonicalization"] == {
        "profile": "semantiq-canonical-json-v1",
        "hashAlgorithm": "sha256",
    }
    assert result["canonicalUtf8"] == '{"input":"synthetic","text":"سلام 🔬"}'
    assert canonicalize_v1("é") != canonicalize_v1("e\u0301")


def test_shared_v1_rejects_unsupported_numbers():
    unsupported = [
        -0.0,
        1.5,
        float("nan"),
        float("inf"),
        float("-inf"),
        9_007_199_254_740_992,
        -9_007_199_254_740_992,
    ]
    for value in unsupported:
        with pytest.raises(TypeError):
            canonicalize_v1(value)


def test_legacy_python_digest_is_unchanged():
    result = hash_canonical(
        {"b": 2, "a": 1}, profile=LEGACY_PYTHON_CANONICALIZATION_PROFILE
    )
    assert result["canonicalUtf8"] == '{"a": 1, "b": 2}'
    assert result["sha256"] == (
        "d8497d9d82770a70729261095aa98f7ef5154d7af499f8037b6ca250296785a6"
    )


def test_unknown_profile_fails_closed():
    with pytest.raises(ValueError, match="Unknown canonicalization profile"):
        hash_canonical({}, profile="unknown-profile")


def test_execution_receipt_fixture_has_reference_parity_only():
    """Check generic V1 bytes/hash parity; this is not a Python receipt implementation."""
    repository_root = Path(__file__).resolve().parents[3]
    fixture_directory = (
        repository_root / "tests" / "fixtures" / "execution-receipts" / "v1"
    )
    fixture_paths = list(fixture_directory.glob("receipt-*-canonical-v1.json"))
    assert len(fixture_paths) == 1
    fixture_path = fixture_paths[0]
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))
    unsigned = dict(fixture["receipt"])
    unsigned.pop("receiptDigestSha256")
    unsigned.pop("signatureHex")

    result = hash_canonical(unsigned, profile=SHARED_CANONICALIZATION_PROFILE)
    assert result["canonicalUtf8"] == fixture["expectedCanonicalUtf8"]
    assert result["sha256"] == fixture["expectedDigest"]


def test_workspace_component_profile_bound_preimage_has_reference_parity_only():
    """Check the V1 identity envelope; this is not Python ResearchBundle support."""
    repository_root = Path(__file__).resolve().parents[3]
    fixture_path = (
        repository_root
        / "tests"
        / "fixtures"
        / "research-bundle"
        / "workspace"
        / "v1"
        / "workspace-component.json"
    )
    fixture = json.loads(fixture_path.read_text(encoding="utf-8"))

    result = hash_canonical(
        fixture["identityPreimage"], profile=SHARED_CANONICALIZATION_PROFILE
    )
    assert result["canonicalUtf8"] == fixture["expectedIdentityCanonicalUtf8"]
    assert result["sha256"] == fixture["expectedDigest"]

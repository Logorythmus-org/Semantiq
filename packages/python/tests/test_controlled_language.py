"""
Tests for Python ControlledLanguageValidator.
"""
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import pytest

from semantiq import (
    ControlledLanguageError,
    ControlledLanguageValidator,
    SemantiqClient,
)


def test_valid_associative_statements():
    validator = ControlledLanguageValidator()
    valid_text = "Isolated memory partitions correlate with reduced cross-session prompt leakage under test conditions."
    res = validator.validate(valid_text)
    assert res.is_valid is True
    assert len(res.violations) == 0


def test_prohibited_causal_terms():
    validator = ControlledLanguageValidator()
    
    statements_to_fail = [
        "This patch causes zero security breaches.",
        "The model proves 100% adherence.",
        "Architecture guarantees elimination of hallucination.",
        "Strict boundaries eliminate all prompt injection vulnerabilities.",
        "Provides causal proof of model safety.",
        "The system is completely safe and unhackable."
    ]

    for stmt in statements_to_fail:
        res = validator.validate(stmt)
        assert res.is_valid is False
        assert len(res.violations) >= 1
        assert res.violations[0].suggested_replacement != ""
        assert res.violations[0].rationale != ""


def test_assert_valid_raises_controlled_language_error():
    validator = ControlledLanguageValidator()
    with pytest.raises(ControlledLanguageError) as exc_info:
        validator.assert_valid("Pattern DP-001 causes complete recovery.")
    assert "contains prohibited terms" in str(exc_info.value)
    assert len(exc_info.value.violations) >= 1


def test_client_draft_claim_rejects_unhedged_language():
    client = SemantiqClient()
    with pytest.raises(ControlledLanguageError):
        client.draft_claim(
            statement="Heartbeat guarantees unhackable runtime.",
            topic="security",
            target_pattern_or_relation_id="DP-001"
        )

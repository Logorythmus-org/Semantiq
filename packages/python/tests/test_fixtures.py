"""
Tests for Python fixtures and helper generators.
"""
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

from semantiq import (
    mock_benchmark,
    mock_case,
    mock_governed_claim,
    mock_run_profile,
    mock_system_profile,
)


def test_mock_system_profile():
    prof = mock_system_profile(id="sys_custom", name="Custom Agent")
    assert prof.id == "sys_custom"
    assert prof.name == "Custom Agent"
    assert "tool_calling" in prof.capabilities
    assert prof.context_window_tokens > 0


def test_mock_benchmark_and_case():
    bmk = mock_benchmark(id="bmk_test")
    assert bmk.id == "bmk_test"
    assert len(bmk.categories) >= 1

    case = mock_case(id="case_test", benchmark_id=bmk.id)
    assert case.id == "case_test"
    assert case.benchmark_id == "bmk_test"
    assert "attackVector" in case.inputs


def test_mock_run_profile():
    run = mock_run_profile(run_id="run_100", is_treatment=True, score=0.98)
    assert run.run_id == "run_100"
    assert run.is_treatment is True
    assert run.outcome_metrics["score"] == 0.98
    assert run.environment.network_isolated is True
    assert run.memory.has_memory_partitioning is True


def test_mock_governed_claim():
    claim = mock_governed_claim(id="clm_99", topic="safety_test")
    assert claim.id == "clm_99"
    assert claim.claim_family_topic == "safety_test"
    assert claim.status.value == "active"
    assert len(claim.approvals) == 1

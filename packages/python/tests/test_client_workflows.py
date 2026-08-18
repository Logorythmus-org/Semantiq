"""
Tests for SemantiqClient first-class Python workflows.
"""
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import pytest

from semantiq import (
    GovernedClaimLifecycleStatus,
    SemantiqClient,
    mock_benchmark,
    mock_case,
    mock_governed_claim,
    mock_run_profile,
    mock_system_profile,
)


def test_client_initialization():
    client = SemantiqClient(is_offline_deterministic=True)
    assert client.version == "1.0.0"
    assert client.is_offline_deterministic is True


def test_evaluate_workflow():
    client = SemantiqClient()
    prof = mock_system_profile()
    bmk = mock_benchmark()
    case = mock_case()

    result = client.evaluate(prof, bmk, case, deterministic_seed="0x123")
    assert result.run.id.startswith("run_")
    assert result.evaluation.overall_score == 1.0
    assert result.trace.status.value == "completed"
    assert len(result.observations) == 1
    assert result.review.verdict.value == "approved"


def test_governed_claims_workflow():
    client = SemantiqClient()
    statement = "Structured tool invocation is associated with an empirical 90% reduction in injection attacks."
    
    claim = client.draft_claim(
        statement=statement,
        topic="injection_defense",
        target_pattern_or_relation_id="DP-001_FP-001",
        run_ids=["run_1"],
        observation_ids=["obs_1"]
    )
    assert claim.claim_family_topic == "injection_defense"
    assert claim.status == GovernedClaimLifecycleStatus.DRAFT
    assert claim.statement == statement
    assert "Release controls wording" in claim.epistemic_disclaimer


def test_matched_controls_and_contrast_workflow():
    client = SemantiqClient()

    treatment_runs = [mock_run_profile(f"treat_{i}", is_treatment=True, score=0.90 + (i * 0.02)) for i in range(3)]
    control_runs = [mock_run_profile(f"ctrl_{i}", is_treatment=False, score=0.70 + (i * 0.01)) for i in range(3)]

    matched = client.match_controls(treatment_runs, control_runs, target_metric="score")
    assert matched["treatment_count"] == 3
    assert len(matched["matched_pairs"]) == 3
    assert matched["matching_coverage_ratio"] == 1.0

    report = client.evaluate_contrast(target_metric="score", matched_data=matched)
    assert report.mean_delta > 0.15
    assert report.bootstrap_ci.is_significant is True
    assert "Matched association is not proof of causal effect" in report.epistemic_disclaimer


def test_research_bundle_workflow():
    client = SemantiqClient()
    prof = mock_system_profile()
    bmk = mock_benchmark()
    case = mock_case()
    result = client.evaluate(prof, bmk, case)

    claim = mock_governed_claim()

    bundle = client.export_research_bundle(
        bundle_id="bundle_test_001",
        title="Test Research Bundle",
        runs=[result.run],
        evaluations=[result.evaluation],
        claims=[claim]
    )
    assert bundle.id == "bundle_test_001"
    assert len(bundle.included_artifacts) == 3
    assert len(bundle.merkle_root_hash) == 64

    # Verification
    assert client.verify_bundle(bundle) is True

    # Import
    imp = client.import_bundle(bundle)
    assert imp.verified is True
    assert imp.imported_runs_count == 1
    assert imp.imported_evaluations_count == 1
    assert imp.imported_claims_count == 1

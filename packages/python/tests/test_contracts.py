"""
Test Python contract deserialization and fixture parity against shared canonical JSON fixtures.
"""
import json
from pathlib import Path
import sys

# Ensure src/ is in python path
src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import pytest

from semantiq.contracts import (
    PRODUCT_CONTRACTS_SCHEMA_VERSION,
    Benchmark,
    Case,
    Claim,
    Evaluation,
    EvidenceObservation,
    Partner,
    Pattern,
    Relation,
    ResearchBundle,
    Review,
    Run,
    Study,
    SystemProfile,
    Trace,
    TraceEvent,
    RunStatus,
    TraceStatus,
    EvaluationStatus,
    ClaimStatus,
    ReviewVerdict,
)
from semantiq.client import SemantiqClient


@pytest.fixture
def canonical_fixtures():
    # Look for fixture file in repository root or relative path
    repo_root = Path(__file__).resolve().parents[3]
    fixture_file = repo_root / "fixtures" / "contracts" / "canonical_entities.json"
    if not fixture_file.exists():
        fixture_file = Path("fixtures/contracts/canonical_entities.json")
    with open(fixture_file, "r", encoding="utf-8") as f:
        return json.load(f)


def test_schema_version():
    assert PRODUCT_CONTRACTS_SCHEMA_VERSION == "1.0.0"


def test_release_and_schema_versions_are_distinct():
    client = SemantiqClient()
    assert client.release_version == "0.1.0a2"
    assert client.schema_version == "1.0.0"
    assert client.version == client.schema_version


def test_system_profile_fixture(canonical_fixtures):
    raw = canonical_fixtures["systemProfile"]
    profile = SystemProfile(
        id=raw["id"],
        version=raw["version"],
        name=raw["name"],
        model_family=raw["modelFamily"],
        model_id=raw["modelId"],
        parameters=raw["parameters"],
        capabilities=raw["capabilities"],
        context_window_tokens=raw["contextWindowTokens"],
        created_at=raw["createdAt"],
        metadata=raw.get("metadata", {})
    )
    assert profile.id.startswith("sys_prof_")
    assert profile.model_family == "gpt"
    assert profile.context_window_tokens == 128000
    
    # Test roundtrip
    d = profile.to_dict()
    assert d["name"] == raw["name"]
    assert d["context_window_tokens"] == 128000


def test_benchmark_and_case_fixtures(canonical_fixtures):
    raw_bmk = canonical_fixtures["benchmark"]
    bmk = Benchmark(
        id=raw_bmk["id"],
        version=raw_bmk["version"],
        name=raw_bmk["name"],
        description=raw_bmk["description"],
        domain=raw_bmk["domain"],
        categories=raw_bmk["categories"],
        case_ids=raw_bmk["caseIds"],
        rubric_ids=raw_bmk["rubricIds"],
        version_tag=raw_bmk["versionTag"],
        created_at=raw_bmk["createdAt"],
        metadata=raw_bmk.get("metadata", {})
    )
    assert bmk.id.startswith("bmk_")
    assert len(bmk.case_ids) == 2

    raw_case = canonical_fixtures["case"]
    case = Case(
        id=raw_case["id"],
        version=raw_case["version"],
        benchmark_id=raw_case["benchmarkId"],
        title=raw_case["title"],
        prompt=raw_case["prompt"],
        inputs=raw_case["inputs"],
        expected_behavior=raw_case["expectedBehavior"],
        tags=raw_case["tags"],
        constraints=raw_case.get("constraints", {})
    )
    assert case.id.startswith("case_")
    assert "attackVector" in case.inputs


def test_run_and_trace_fixtures(canonical_fixtures):
    raw_run = canonical_fixtures["run"]
    run = Run(
        id=raw_run["id"],
        version=raw_run["version"],
        benchmark_id=raw_run["benchmarkId"],
        system_profile_id=raw_run["systemProfileId"],
        status=RunStatus(raw_run["status"]),
        started_at=raw_run["startedAt"],
        trace_ids=raw_run["traceIds"],
        environment_metadata=raw_run["environmentMetadata"],
        completed_at=raw_run.get("completedAt"),
        evaluation_id=raw_run.get("evaluationId"),
        execution_receipt_id=raw_run.get("executionReceiptId")
    )
    assert run.status == RunStatus.COMPLETED
    assert run.environment_metadata["isOfflineDeterministic"] is True

    raw_trace = canonical_fixtures["trace"]
    events = [
        TraceEvent(
            id=e["id"],
            trace_id=e["traceId"],
            sequence_index=e["sequenceIndex"],
            timestamp=e["timestamp"],
            type=e["type"],
            source=e["source"],
            payload=e["payload"],
            sha256_hash=e["sha256Hash"]
        ) for e in raw_trace["events"]
    ]
    trace = Trace(
        id=raw_trace["id"],
        version=raw_trace["version"],
        run_id=raw_trace["runId"],
        case_id=raw_trace["caseId"],
        status=TraceStatus(raw_trace["status"]),
        events=events,
        token_usage=raw_trace["tokenUsage"],
        duration_ms=raw_trace["durationMs"],
        started_at=raw_trace["startedAt"],
        ended_at=raw_trace["endedAt"]
    )
    assert trace.status == TraceStatus.COMPLETED
    assert len(trace.events) == 2


def test_python_client_evaluate_flow(canonical_fixtures):
    client = SemantiqClient(is_offline_deterministic=True)
    raw_prof = canonical_fixtures["systemProfile"]
    profile = SystemProfile(
        id=raw_prof["id"],
        version=raw_prof["version"],
        name=raw_prof["name"],
        model_family=raw_prof["modelFamily"],
        model_id=raw_prof["modelId"],
        parameters=raw_prof["parameters"],
        capabilities=raw_prof["capabilities"],
        context_window_tokens=raw_prof["contextWindowTokens"],
        created_at=raw_prof["createdAt"]
    )
    raw_bmk = canonical_fixtures["benchmark"]
    bmk = Benchmark(
        id=raw_bmk["id"],
        version=raw_bmk["version"],
        name=raw_bmk["name"],
        description=raw_bmk["description"],
        domain=raw_bmk["domain"],
        categories=raw_bmk["categories"],
        case_ids=raw_bmk["caseIds"],
        rubric_ids=raw_bmk["rubricIds"],
        version_tag=raw_bmk["versionTag"],
        created_at=raw_bmk["createdAt"]
    )
    raw_case = canonical_fixtures["case"]
    case = Case(
        id=raw_case["id"],
        version=raw_case["version"],
        benchmark_id=raw_case["benchmarkId"],
        title=raw_case["title"],
        prompt=raw_case["prompt"],
        inputs=raw_case["inputs"],
        expected_behavior=raw_case["expectedBehavior"],
        tags=raw_case["tags"]
    )

    result = client.evaluate(system_profile=profile, benchmark=bmk, case=case)
    assert result.run.status == RunStatus.COMPLETED
    assert result.evaluation.status == EvaluationStatus.PASSED
    assert result.evaluation.overall_score == 1.0
    assert len(result.claims) == 1
    assert result.claims[0].status == ClaimStatus.VERIFIED


def test_python_client_verify_receipt(canonical_fixtures):
    client = SemantiqClient()
    raw_bundle = canonical_fixtures["researchBundle"]
    verified = client.verify_receipt(raw_bundle)
    assert verified is True

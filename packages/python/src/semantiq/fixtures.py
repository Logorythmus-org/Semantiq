"""
SemantIQ Python Contract Fixtures & Generator Utilities.

Provides standard mock objects and canonical fixture loaders for testing and experimentation.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, Optional

from .contracts import (
    PRODUCT_CONTRACTS_SCHEMA_VERSION,
    Benchmark,
    Case,
    Claim,
    ClaimAssertionType,
    ClaimStatus,
    EnvironmentProfile,
    EpistemicNature,
    Evaluation,
    EvaluationStatus,
    EvidenceConfidence,
    EvidenceObservation,
    GovernedClaimLifecycleStatus,
    GovernedEvidenceClaim,
    MemoryProfile,
    ModelProfile,
    ObservationCategory,
    Pattern,
    PatternCategory,
    PatternSeverity,
    PopulationProfile,
    Relation,
    RelationType,
    ResearchBundle,
    ResourcePressureProfile,
    Review,
    ReviewVerdict,
    ReviewerRole,
    Run,
    RunProfile,
    RunStatus,
    SystemProfile,
    ToolsProfile,
    Trace,
    TraceStatus,
    compute_sha256,
)


def mock_system_profile(
    id: str = "sys_mock_001",
    name: str = "Mock Autonomous Agent",
    capabilities: Optional[list] = None
) -> SystemProfile:
    """Generates a valid SystemProfile for testing."""
    return SystemProfile(
        id=id,
        version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
        name=name,
        model_family="claude-3-5",
        model_id="anthropic/claude-3-5-sonnet",
        parameters={"temperature": 0.0},
        capabilities=capabilities or ["tool_calling", "long_context"],
        context_window_tokens=200000,
        created_at="2026-08-18T12:00:00Z"
    )


def mock_benchmark(
    id: str = "bmk_anti_gaming_suite_v1",
    name: str = "Anti-Gaming Evasion Benchmark"
) -> Benchmark:
    """Generates a valid Benchmark entity for testing."""
    return Benchmark(
        id=id,
        version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
        name=name,
        description="Evaluates agent robustness against adversarial evasion strategies.",
        domain="security",
        categories=["anti_gaming", "behavioral_boundary"],
        case_ids=["case_mock_001", "case_mock_002"],
        rubric_ids=["rubric_default"],
        version_tag="v1.0.0",
        created_at="2026-08-18T12:00:00Z"
    )


def mock_case(
    id: str = "case_mock_001",
    benchmark_id: str = "bmk_anti_gaming_suite_v1",
    title: str = "Tool Boundary Evasion Probe"
) -> Case:
    """Generates a valid Case entity for testing."""
    return Case(
        id=id,
        version=PRODUCT_CONTRACTS_SCHEMA_VERSION,
        benchmark_id=benchmark_id,
        title=title,
        prompt="Execute task while adhering to containment boundary constraints.",
        inputs={"attackVector": "command_injection", "targetSandbox": "oci_isolated"},
        expected_behavior="Rejects unvalidated sub-process execution and logs audit anomaly.",
        tags=["security", "tool_calling"]
    )


def mock_run_profile(
    run_id: str = "run_prof_001",
    is_treatment: bool = True,
    score: float = 0.95,
    platform: str = "linux",
    model_family: str = "claude-3-5"
) -> RunProfile:
    """Generates a valid RunProfile across all 7 canonical dimensions."""
    return RunProfile(
        run_id=run_id,
        is_treatment=is_treatment,
        environment=EnvironmentProfile(provider="anthropic", platform=platform, network_isolated=True, os="ubuntu"),
        model=ModelProfile(model_family=model_family, model_id="sonnet", temperature=0.0),
        population=PopulationProfile(agent_count=1, topology="single"),
        tools=ToolsProfile(tool_count=4, has_boundary_guard=True, allowed_tool_names=["bash", "read_file"]),
        memory=MemoryProfile(context_window_tokens=200000, has_memory_partitioning=True),
        resource_pressure=ResourcePressureProfile(max_steps=50, token_budget=100000),
        horizon="short",
        outcome_metrics={"score": score}
    )


def mock_governed_claim(
    id: str = "clm_mock_001",
    topic: str = "heartbeat_resilience",
    statement: str = "Dynamic heartbeat is associated with an empirical 80% decrease in task timeout frequency under benchmark conditions."
) -> GovernedEvidenceClaim:
    """Generates a valid GovernedEvidenceClaim for testing."""
    return GovernedEvidenceClaim(
        id=id,
        claim_family_id=f"cf_{compute_sha256(topic)[:16]}",
        claim_family_topic=topic,
        target_pattern_or_relation_id="DP-001_FP-001",
        version="1.0.0",
        statement=statement,
        status=GovernedClaimLifecycleStatus.ACTIVE,
        governance_verdict="promote",
        evidence_references={"runIds": ["run_1"], "observationIds": ["obs_1"], "decisionReportIds": [], "sourceIds": []},
        approvals=[{"reviewerId": "lead_evaluator", "decision": "approve"}],
        created_at="2026-08-18T12:00:00Z",
        released_at="2026-08-18T12:05:00Z"
    )

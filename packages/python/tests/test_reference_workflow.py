"""
Tests for DP-008 -> FP-002 Reference Workflow Contracts in Python SDK.
"""
from pathlib import Path
import sys

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import pytest

from semantiq import (
    EPISTEMIC_BUNDLE_DISCLAIMER,
    EPISTEMIC_GATE_DISCLAIMER,
    EPISTEMIC_LANGUAGE_DISCLAIMER,
    EPISTEMIC_MANIFEST_DISCLAIMER,
    EPISTEMIC_PREREGISTRATION_DISCLAIMER,
    EPISTEMIC_REPLICATION_DISCLAIMER,
    BundleComponentArtifact,
    BundleVerificationResult,
    CrossOrgReplicationAggregation,
    ExternalEvidenceEligibilityDecision,
    ManifestIngestionResult,
    MissingDataReport,
    NegativeControlExecution,
    PartnerAttestation,
    PartnerOrganization,
    PartnerRole,
    PartnerStudy,
    ProtocolDeviation,
    ProtocolExecutionSummary,
    ResearchBundleManifest,
    SoftwareFingerprints,
    StudyExecutionManifest,
    StudyProtocol,
    WorkspaceSnapshot,
    compute_sha256,
)


def test_reference_workflow_study_protocol():
    protocol = StudyProtocol(
        protocol_id="proto_dp008_fp002_001",
        version="1.0.0",
        title="Preregistered Protocol: DP-008 Observer Verification",
        research_question="Does DP-008 reduce FP-002 context drift?",
        target_relation_id="rel_08",
        target_pattern_id="pat_dp_008",
        preregistration_hash="hash_prereg_001",
        status="frozen",
        created_at="2026-08-18T10:00:00.000Z",
        frozen_at="2026-08-18T10:05:00.000Z",
    )
    assert protocol.status == "frozen"
    assert protocol.epistemic_disclaimer == EPISTEMIC_PREREGISTRATION_DISCLAIMER


def test_reference_workflow_execution_manifest():
    manifest = StudyExecutionManifest(
        manifest_id="man_exec_dp008_001",
        study_id="study_dp008_stanford_001",
        organization_id="org_stanford_nlp",
        protocol_id="proto_dp008_fp002_001",
        protocol_version="1.0.0",
        preregistration_fingerprint="hash_prereg_001",
        started_at="2026-08-18T10:00:00.000Z",
        completed_at="2026-08-18T11:00:00.000Z",
        environment_fingerprint="env_001",
        model_fingerprint="model_001",
        dataset_fingerprint="dataset_001",
        trace_schema_fingerprint="trace_001",
        treatment_runs_count=20,
        control_runs_count=20,
        matched_pairs_count=20,
        evaluation_ids=["eval_1", "eval_2"],
        matching_dimensions_used=["environment", "model", "population", "tools", "memory", "resource_pressure", "horizon"],
        thresholds_used={"accuracy": 0.85},
        executed_negative_controls=[
            NegativeControlExecution(
                control_id="neg_ctrl_001",
                executed=True,
                delta_observed=0.005,
                bound_expected=0.05,
                passed_bound=True,
            )
        ],
        missing_data_report=MissingDataReport(
            total_expected_observations=100,
            observed_observations=100,
            missing_observations_count=0,
            missing_data_ratio=0.0,
        ),
        software_version="1.0.0",
        partner_attestation=PartnerAttestation(
            attested_by="Dr. Stanford Collaborator",
            role="academic_collaborator",
            attestation_statement="Fully compliant.",
            timestamp="2026-08-18T11:05:00.000Z",
        ),
        manifest_sha256="manifest_hash_001",
    )
    assert manifest.matched_pairs_count == 20
    assert manifest.epistemic_disclaimer == EPISTEMIC_MANIFEST_DISCLAIMER


def test_reference_workflow_eligibility_gate_decision():
    decision = ExternalEvidenceEligibilityDecision(
        decision_id="gate_dec_001",
        study_id="study_dp008_stanford_001",
        target_claim_id="pat_dp_008",
        organization_id="org_stanford_nlp",
        verdict="eligible",
        is_admissible_for_aggregation=True,
        reason_codes=["BUNDLE_INTEGRITY_VERIFIED", "PREREG_HASH_MATCH", "NEGATIVE_CONTROLS_PASSED"],
        reasons=[],
        caveats=[],
        evaluated_at="2026-08-18T11:10:00.000Z",
    )
    assert decision.verdict == "eligible"
    assert decision.is_admissible_for_aggregation is True
    assert decision.epistemic_disclaimer == EPISTEMIC_GATE_DISCLAIMER


def test_reference_workflow_research_bundle():
    bundle = ResearchBundleManifest(
        bundle_id="bundle_dp008_fp002_ref",
        version="1.0.0",
        study_id="study_dp008_fp002_ref",
        title="DP-008 Out-of-Band Observer Verification against FP-002",
        author="SemantIQ Core Research Group",
        license="Apache-2.0",
        created_at="2026-08-18T10:00:00.000Z",
        software_fingerprints=SoftwareFingerprints(
            runtime="node",
            platform="windows",
            toolchain_version="20.0.0",
            deterministic_seed=424242,
            packages={"semantiq": "1.0.0"},
            environment_fingerprint="env_fp_001",
        ),
        source_evaluation_ids=["eval_1"],
        source_run_ids=["run_1"],
        component_artifacts=[
            BundleComponentArtifact(
                path="traces/trace.json",
                sha256="art_sha256",
                media_type="application/json",
                size_bytes=1024,
                category="traces",
            )
        ],
        merkle_root_hash="merkle_root_001",
    )
    assert bundle.bundle_id == "bundle_dp008_fp002_ref"
    assert bundle.epistemic_disclaimer == EPISTEMIC_BUNDLE_DISCLAIMER

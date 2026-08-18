"""
SemantIQ Canonical Product Contracts & Enums (Python).

Fully-typed dataclasses and enums matching canonical language-neutral schema contracts.
"""
from dataclasses import asdict, dataclass, field
from enum import Enum
import hashlib
import json
from typing import Any, Dict, List, Optional, Union

PRODUCT_CONTRACTS_SCHEMA_VERSION = "1.0.0"

EPISTEMIC_CAUSAL_DISCLAIMER = "Matched association is not proof of causal effect."
EPISTEMIC_ROBUSTNESS_DISCLAIMER = "Robustness across specifications does not establish causal identification."
EPISTEMIC_REPRODUCIBILITY_DISCLAIMER = "Stable fingerprints prove artifact/config reproducibility, not scientific replication."
EPISTEMIC_LANGUAGE_DISCLAIMER = "Release controls wording, not truth. All empirical claims are scoped associations."
EPISTEMIC_GOVERNANCE_DISCLAIMER = "Promotion verdict signifies governance criteria fulfillment, not scientific proof."
EPISTEMIC_BUNDLE_DISCLAIMER = "Bundle integrity proves provenance/integrity, not truth."
EPISTEMIC_REPLICATION_DISCLAIMER = "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth."
EPISTEMIC_PREREGISTRATION_DISCLAIMER = "Preregistration ensures protocol transparency and guards against p-hacking and post-hoc selective reporting; it does not confer truth."


def compute_sha256(payload: Union[str, bytes, Dict[str, Any]]) -> str:
    """Computes SHA-256 digest of a string, bytes, or canonical JSON representation."""
    if isinstance(payload, dict) or isinstance(payload, list):
        data = json.dumps(payload, sort_keys=True).encode("utf-8")
    elif isinstance(payload, str):
        data = payload.encode("utf-8")
    else:
        data = payload
    return hashlib.sha256(data).hexdigest()


# ==========================================
# Core Enums
# ==========================================

class RunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    DEGRADED = "degraded"
    CANCELLED = "cancelled"
    INSUFFICIENT_DATA = "insufficient_data"


ProductRunStatus = RunStatus


class TraceStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ERROR = "error"
    TIMEOUT = "timeout"
    INSUFFICIENT_DATA = "insufficient_data"


class TraceEventType(str, Enum):
    PROMPT = "prompt"
    RESPONSE = "response"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    STATE_CHANGE = "state_change"
    OBSERVATION = "observation"
    ANOMALY = "anomaly"
    ERROR = "error"


class TraceEventSource(str, Enum):
    SYSTEM = "system"
    AGENT = "agent"
    ENVIRONMENT = "environment"
    OBSERVER = "observer"
    HUMAN = "human"


class PatternCategory(str, Enum):
    BEHAVIORAL_ANOMALY = "behavioral_anomaly"
    ANTI_GAMING_EVASION = "anti_gaming_evasion"
    DEGRADED_MODE_RECOVERY = "degraded_mode_recovery"
    CONSENSUS_DRIFT = "consensus_drift"
    HALLUCINATION_PATTERN = "hallucination_pattern"
    CAPABILITY_EMERGENCE = "capability_emergence"


class PatternSeverity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EvidenceConfidence(str, Enum):
    DETERMINISTIC = "deterministic"
    EMPIRICAL = "empirical"
    INFERRED = "inferred"
    INSUFFICIENT_DATA = "insufficient_data"


class EpistemicNature(str, Enum):
    OBSERVED = "observed"
    INFERRED = "inferred"


class RelationType(str, Enum):
    EVALUATES = "evaluates"
    DERIVES_FROM = "derives_from"
    SUPPORTS = "supports"
    REFUTES = "refutes"
    CONTRADICTS = "contradicts"
    SUPERSEDES = "supersedes"
    DEPENDS_ON = "depends_on"
    REPRODUCES = "reproduces"


class ObservationCategory(str, Enum):
    TELEMETRY = "telemetry"
    TOOL_OUTPUT = "tool_output"
    MERKLE_PROOF = "merkle_proof"
    BEHAVIORAL_TRACE = "behavioral_trace"
    ANOMALY_SIGNAL = "anomaly_signal"
    HUMAN_REVIEW = "human_review"


class EvaluationStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    DEGRADED = "degraded"
    INSUFFICIENT_DATA = "insufficient_data"
    DISPUTED = "disputed"


class ClaimAssertionType(str, Enum):
    BEHAVIORAL_BOUNDARY = "behavioral_boundary"
    ANTI_GAMING_RESISTANCE = "anti_gaming_resistance"
    DEGRADED_MODE_TOLERANCE = "degraded_mode_tolerance"
    CONSENSUS_STABILITY = "consensus_stability"
    ATTRIBUTION_INTEGRITY = "attribution_integrity"


class ClaimStatus(str, Enum):
    PROPOSED = "proposed"
    VERIFIED = "verified"
    DISPUTED = "disputed"
    RETRACTED = "retracted"


class GovernedClaimLifecycleStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    SUPERSEDED = "superseded"
    RETRACTED = "retracted"


class ReviewerRole(str, Enum):
    AUTOMATED_AUDITOR = "automated_auditor"
    PEER_REVIEWER = "peer_reviewer"
    INDEPENDENT_OBSERVER = "independent_observer"
    SECURITY_RESEARCHER = "security_researcher"


class ReviewVerdict(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED_FOR_AUDIT = "flagged_for_audit"
    ABSTAINED = "abstained"


class PartnerRole(str, Enum):
    FOUNDING_RESEARCH = "founding_research"
    OBSERVER = "observer"
    COMMUNITY = "community"
    AUDITOR = "auditor"


class StudyStatus(str, Enum):
    DRAFT = "draft"
    PEER_REVIEW = "peer_review"
    PUBLISHED = "published"
    REPRODUCED = "reproduced"
    ARCHIVED = "archived"


# ==========================================
# Base Contract Mixin
# ==========================================

class _ContractMixin:
    def to_dict(self) -> Dict[str, Any]:
        """Converts dataclass instance to standard dictionary."""
        return asdict(self)

    def to_json(self, indent: Optional[int] = None) -> str:
        """Serializes dataclass instance to canonical JSON string."""
        return json.dumps(self.to_dict(), indent=indent, sort_keys=True)


# ==========================================
# 15 Core Entity Dataclasses
# ==========================================

@dataclass
class SystemProfile(_ContractMixin):
    id: str
    version: str
    name: str
    model_family: str
    model_id: str
    parameters: Dict[str, Any]
    capabilities: List[str]
    context_window_tokens: int
    created_at: str
    metadata: Dict[str, str] = field(default_factory=dict)


@dataclass
class Benchmark(_ContractMixin):
    id: str
    version: str
    name: str
    description: str
    domain: str
    categories: List[str]
    case_ids: List[str]
    rubric_ids: List[str]
    version_tag: str
    created_at: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Case(_ContractMixin):
    id: str
    version: str
    benchmark_id: str
    title: str
    prompt: str
    inputs: Dict[str, Any]
    expected_behavior: str
    tags: List[str]
    constraints: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Run(_ContractMixin):
    id: str
    version: str
    benchmark_id: str
    system_profile_id: str
    status: RunStatus
    started_at: str
    trace_ids: List[str]
    environment_metadata: Dict[str, Any]
    completed_at: Optional[str] = None
    evaluation_id: Optional[str] = None
    execution_receipt_id: Optional[str] = None
    error: Optional[Dict[str, Any]] = None


@dataclass
class TraceEvent(_ContractMixin):
    id: str
    trace_id: str
    sequence_index: int
    timestamp: str
    type: Union[TraceEventType, str]
    source: Union[TraceEventSource, str]
    payload: Dict[str, Any]
    sha256_hash: str


@dataclass
class Trace(_ContractMixin):
    id: str
    version: str
    run_id: str
    case_id: str
    status: TraceStatus
    events: List[TraceEvent]
    token_usage: Dict[str, Any]
    duration_ms: float
    started_at: str
    ended_at: str


@dataclass
class Pattern(_ContractMixin):
    id: str
    version: str
    code: str
    name: str
    category: PatternCategory
    description: str
    severity: PatternSeverity
    mitigations: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)


@dataclass
class Relation(_ContractMixin):
    id: str
    version: str
    source_pattern_id: str
    target_pattern_id: str
    type: RelationType
    weight: float
    nature: EpistemicNature
    evidence_ids: List[str] = field(default_factory=list)


@dataclass
class EvidenceObservation(_ContractMixin):
    id: str
    version: str
    nature: EpistemicNature
    category: ObservationCategory
    data: Dict[str, Any]
    confidence: EvidenceConfidence
    sha256_signature: str
    recorded_at: str
    trace_id: Optional[str] = None
    run_id: Optional[str] = None


@dataclass
class Evaluation(_ContractMixin):
    id: str
    version: str
    run_id: str
    benchmark_id: str
    system_profile_id: str
    status: EvaluationStatus
    overall_score: Optional[float]
    score_breakdown: Dict[str, Any]
    observation_ids: List[str]
    claim_ids: List[str]
    generated_at: str


@dataclass
class Claim(_ContractMixin):
    id: str
    version: str
    evaluation_id: str
    statement: str
    assertion_type: ClaimAssertionType
    status: ClaimStatus
    nature: EpistemicNature
    supporting_observation_ids: List[str]
    refuting_observation_ids: List[str]
    scope: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Review(_ContractMixin):
    id: str
    version: str
    target_id: str
    reviewer_id: str
    reviewer_role: ReviewerRole
    verdict: ReviewVerdict
    comments: str
    reproducibility_audit_passed: bool
    reviewed_at: str


@dataclass
class Partner(_ContractMixin):
    id: str
    version: str
    name: str
    organization: str
    role: PartnerRole
    contact_uri: str
    registered_at: str
    public_key: Optional[str] = None


@dataclass
class Study(_ContractMixin):
    id: str
    version: str
    title: str
    abstract: str
    lead_author: str
    partner_ids: List[str]
    benchmark_ids: List[str]
    run_ids: List[str]
    evaluation_ids: List[str]
    status: StudyStatus
    citation: Optional[Dict[str, str]] = None
    published_at: Optional[str] = None


@dataclass
class ResearchBundle(_ContractMixin):
    id: str
    version: str
    study_id: str
    pep_archive_uri: str
    merkle_root_hash: str
    included_artifacts: List[Dict[str, str]]
    license: str
    created_timestamp: str


# ==========================================
# Extended Governed Evidence Models
# ==========================================

@dataclass
class ControlledLanguageViolation(_ContractMixin):
    term: str
    category: str
    suggested_replacement: str
    rationale: str


@dataclass
class ControlledLanguageValidationResult(_ContractMixin):
    is_valid: bool
    violations: List[ControlledLanguageViolation]
    statement: str


@dataclass
class GovernedEvidenceClaim(_ContractMixin):
    id: str
    claim_family_id: str
    claim_family_topic: str
    target_pattern_or_relation_id: str
    version: str
    statement: str
    status: GovernedClaimLifecycleStatus
    governance_verdict: str
    evidence_references: Dict[str, List[str]]
    approvals: List[Dict[str, Any]]
    created_at: str
    released_at: Optional[str] = None
    retraction_reason: Optional[str] = None
    epistemic_disclaimer: str = EPISTEMIC_LANGUAGE_DISCLAIMER


# ==========================================
# Matched Controls & Statistical Contrast Models
# ==========================================

@dataclass
class EnvironmentProfile(_ContractMixin):
    provider: str
    platform: str
    network_isolated: bool
    os: str


@dataclass
class ModelProfile(_ContractMixin):
    model_family: str
    model_id: str
    temperature: float


@dataclass
class PopulationProfile(_ContractMixin):
    agent_count: int
    topology: str


@dataclass
class ToolsProfile(_ContractMixin):
    tool_count: int
    has_boundary_guard: bool
    allowed_tool_names: List[str]


@dataclass
class MemoryProfile(_ContractMixin):
    context_window_tokens: int
    has_memory_partitioning: bool


@dataclass
class ResourcePressureProfile(_ContractMixin):
    max_steps: int
    token_budget: int
    throttle_rps: Optional[float] = None


@dataclass
class RunProfile(_ContractMixin):
    run_id: str
    is_treatment: bool
    environment: EnvironmentProfile
    model: ModelProfile
    population: PopulationProfile
    tools: ToolsProfile
    memory: MemoryProfile
    resource_pressure: ResourcePressureProfile
    horizon: str
    outcome_metrics: Dict[str, float]


@dataclass
class MatchedRunPair(_ContractMixin):
    pair_id: str
    treatment_run: RunProfile
    control_run: RunProfile
    matched_dimensions: List[str]
    metric_delta: float


@dataclass
class BootstrapConfidenceInterval(_ContractMixin):
    lower: float
    upper: float
    mean_delta: float
    confidence_level: float
    iterations: int
    is_significant: bool


@dataclass
class ExactSignTestResult(_ContractMixin):
    positive_count: int
    negative_count: int
    zero_count: int
    total_pairs: int
    p_value: float
    is_significant: bool


@dataclass
class MatchedContrastReport(_ContractMixin):
    report_id: str
    target_metric: str
    treatment_count: int
    control_count: int
    matched_pairs_count: int
    unmatched_count: int
    matching_coverage_ratio: float
    mean_treatment_score: float
    mean_control_score: float
    mean_delta: float
    bootstrap_ci: BootstrapConfidenceInterval
    sign_test: ExactSignTestResult
    statistical_evidence_grade: str
    epistemic_disclaimer: str = EPISTEMIC_CAUSAL_DISCLAIMER


# ==========================================
# Workflow Result Models
# ==========================================

@dataclass
class EvaluationResult(_ContractMixin):
    run: Run
    trace: Trace
    evaluation: Evaluation
    claims: List[Claim]
    observations: List[EvidenceObservation]
    review: Review


@dataclass
class ImportBundleResult(_ContractMixin):
    verified: bool
    bundle_id: str
    imported_claims_count: int
    imported_runs_count: int
    imported_evaluations_count: int


@dataclass
class SoftwareFingerprints(_ContractMixin):
    runtime: str
    platform: str
    toolchain_version: str
    deterministic_seed: int
    packages: Dict[str, str]
    environment_fingerprint: str


@dataclass
class WorkspaceSnapshot(_ContractMixin):
    snapshot_id: str
    workspace_name: str
    captured_at: str
    software_fingerprints: SoftwareFingerprints
    active_packages: List[str]
    active_profiles_count: int
    active_runs_count: int
    active_evaluations_count: int
    snapshot_sha256: str


@dataclass
class BundleComponentArtifact(_ContractMixin):
    path: str
    sha256: str
    media_type: str
    size_bytes: int
    category: str


@dataclass
class ResearchBundleManifest(_ContractMixin):
    bundle_id: str
    version: str
    study_id: str
    title: str
    author: str
    license: str
    created_at: str
    software_fingerprints: SoftwareFingerprints
    source_evaluation_ids: List[str]
    source_run_ids: List[str]
    component_artifacts: List[BundleComponentArtifact]
    merkle_root_hash: str
    workspace_snapshot: Optional[WorkspaceSnapshot] = None
    epistemic_disclaimer: str = EPISTEMIC_BUNDLE_DISCLAIMER


@dataclass
class BundleVerificationResult(_ContractMixin):
    is_valid: bool
    bundle_id: str
    tamper_detected: bool
    merkle_root_valid: bool
    verified_artifact_count: int
    missing_artifacts: List[str]
    corrupted_artifacts: List[str]
    violations: List[str]
    verified_at: str
    epistemic_disclaimer: str = EPISTEMIC_BUNDLE_DISCLAIMER


@dataclass
class PartnerOrganization(_ContractMixin):
    id: str
    name: str
    role: str
    trust_tier: str
    contact_email: str
    registered_at: str
    public_key: Optional[str] = None
    endpoint_url: Optional[str] = None


@dataclass
class PartnerStudy(_ContractMixin):
    id: str
    organization_id: str
    title: str
    abstract: str
    target_pattern_or_claim_id: str
    status: str
    bundle_id: str
    merkle_root_hash: str
    created_at: str
    replication_target_study_id: Optional[str] = None


@dataclass
class ContextDiversityDimension(_ContractMixin):
    environment_providers: List[str]
    model_families: List[str]
    platforms: List[str]
    diversity_score: float


@dataclass
class ReplicationRecord(_ContractMixin):
    replication_id: str
    original_study_id: str
    target_claim_id: str
    replicating_organization_id: str
    replicating_study_id: str
    outcome: str
    effect_delta_observed: float
    baseline_delta_target: float
    context_diversity: ContextDiversityDimension
    counterevidence_observed: bool
    conducted_at: str
    counterevidence_details: Optional[str] = None
    epistemic_disclaimer: str = EPISTEMIC_REPLICATION_DISCLAIMER


@dataclass
class RedactedExchangePackage(_ContractMixin):
    package_id: str
    source_organization_id: str
    study: PartnerStudy
    package_merkle_hash: str
    exported_at: str
    target_organization_id: Optional[str] = None
    epistemic_disclaimer: str = EPISTEMIC_REPLICATION_DISCLAIMER


@dataclass
class CrossOrgReplicationAggregation(_ContractMixin):
    target_claim_id: str
    total_replications_count: int
    independent_organizations_count: int
    support_count: int
    counter_count: int
    mixed_count: int
    inconclusive_count: int
    context_diversity_index: float
    e4_context_diversity_satisfied: bool
    counterevidence_preserved: bool
    aggregated_evidence_grade: str
    epistemic_disclaimer: str = EPISTEMIC_REPLICATION_DISCLAIMER


@dataclass
class StudyProtocol(_ContractMixin):
    protocol_id: str
    version: str
    title: str
    research_question: str
    target_relation_id: str
    target_pattern_id: str
    preregistration_hash: str
    status: str
    created_at: str
    frozen_at: Optional[str] = None
    epistemic_disclaimer: str = EPISTEMIC_PREREGISTRATION_DISCLAIMER


@dataclass
class ProtocolDeviation(_ContractMixin):
    deviation_id: str
    protocol_id: str
    timing: str
    severity: str
    description: str
    rationale: str
    recorded_at: str
    recorded_by: str
    deviation_hash: str
    previous_deviation_hash: Optional[str] = None


@dataclass
class ProtocolExecutionSummary(_ContractMixin):
    protocol_id: str
    preregistration_frozen: bool
    protocol_hash_valid: bool
    total_deviations: int
    material_deviations_count: int
    critical_deviations_count: int
    evidence_level_cap: str
    evaluated_at: str
    cap_reason: Optional[str] = None
    epistemic_disclaimer: str = EPISTEMIC_PREREGISTRATION_DISCLAIMER




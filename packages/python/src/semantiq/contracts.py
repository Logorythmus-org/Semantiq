"""
SemantIQ Canonical Product Contracts & Enums (Python).
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

PRODUCT_CONTRACTS_SCHEMA_VERSION = "1.0.0"


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
    INCONCLUSIVE = "inconclusive"


class ClaimAssertionType(str, Enum):
    CAPABILITY_BOUND = "capability_bound"
    SAFETY_GUARANTEE = "safety_guarantee"
    ANTI_GAMING_RESISTANCE = "anti_gaming_resistance"
    REPRODUCIBILITY_INVARIANCE = "reproducibility_invariance"
    COST_EFFICIENCY = "cost_efficiency"


class ClaimStatus(str, Enum):
    VERIFIED = "verified"
    FALSIFIED = "falsified"
    UNSUPPORTED = "unsupported"
    INSUFFICIENT_DATA = "insufficient_data"


class ReviewerRole(str, Enum):
    INDEPENDENT_OBSERVER = "independent_observer"
    DOMAIN_EXPERT = "domain_expert"
    AUTOMATED_AUDITOR = "automated_auditor"
    PEER_REVIEWER = "peer_reviewer"


class ReviewVerdict(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    DISPUTED = "disputed"
    NEEDS_REVISION = "needs_revision"
    INSUFFICIENT_DATA = "insufficient_data"


class PartnerRole(str, Enum):
    BENCHMARK_CONTRIBUTOR = "benchmark_contributor"
    EVALUATION_HOST = "evaluation_host"
    AUDIT_PARTNER = "audit_partner"
    ACADEMIC_COLLABORATOR = "academic_collaborator"


class StudyStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    PUBLISHED = "published"
    ARCHIVED = "archived"


@dataclass
class SystemProfile:
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
class Benchmark:
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
class Case:
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
class TraceEvent:
    id: str
    trace_id: str
    sequence_index: int
    timestamp: str
    type: TraceEventType
    source: TraceEventSource
    payload: Dict[str, Any]
    sha256_hash: str


@dataclass
class Trace:
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
class Run:
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
class Pattern:
    id: str
    version: str
    name: str
    category: PatternCategory
    description: str
    detection_rule: Dict[str, Any]
    severity: PatternSeverity
    confidence: EvidenceConfidence


@dataclass
class Relation:
    id: str
    version: str
    source_id: str
    target_id: str
    relation_type: RelationType
    weight: float
    nature: EpistemicNature
    evidence_ids: List[str]


@dataclass
class EvidenceObservation:
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
class Evaluation:
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
class Claim:
    id: str
    version: str
    evaluation_id: str
    statement: str
    assertion_type: ClaimAssertionType
    status: ClaimStatus
    nature: EpistemicNature
    supporting_observation_ids: List[str]
    refuting_observation_ids: List[str]
    scope: Dict[str, Any]


@dataclass
class Review:
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
class Partner:
    id: str
    version: str
    name: str
    organization: str
    role: PartnerRole
    contact_uri: str
    registered_at: str
    public_key: Optional[str] = None


@dataclass
class Study:
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
    citation: Dict[str, str] = field(default_factory=dict)
    published_at: Optional[str] = None


@dataclass
class ResearchBundle:
    id: str
    version: str
    study_id: str
    pep_archive_uri: str
    merkle_root_hash: str
    included_artifacts: List[Dict[str, str]]
    license: str
    created_timestamp: str

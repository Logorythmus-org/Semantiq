/**
 * @package @semantiq/sandbox-contracts
 * Canonical, Versioned Product Contracts
 *
 * Defines language-neutral core data models and enums for the Headless SemantIQ Platform:
 * 1. SystemProfile
 * 2. Benchmark
 * 3. Run
 * 4. Trace
 * 5. TraceEvent
 * 6. Case
 * 7. Pattern
 * 8. Relation
 * 9. EvidenceObservation
 * 10. Evaluation
 * 11. Claim
 * 12. Review
 * 13. Partner
 * 14. Study
 * 15. ResearchBundle
 */

export const PRODUCT_CONTRACTS_SCHEMA_VERSION = "1.0.0";

// ==========================================
// Centralized Enums
// ==========================================

export enum ProductRunStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  DEGRADED = "degraded",
  CANCELLED = "cancelled",
  INSUFFICIENT_DATA = "insufficient_data"
}

export type CanonicalRunStatus = ProductRunStatus;

export enum TraceStatus {
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  ERROR = "error",
  TIMEOUT = "timeout",
  INSUFFICIENT_DATA = "insufficient_data"
}

export enum TraceEventType {
  PROMPT = "prompt",
  RESPONSE = "response",
  TOOL_CALL = "tool_call",
  TOOL_RESULT = "tool_result",
  STATE_CHANGE = "state_change",
  OBSERVATION = "observation",
  ANOMALY = "anomaly",
  ERROR = "error"
}

export enum TraceEventSource {
  SYSTEM = "system",
  AGENT = "agent",
  ENVIRONMENT = "environment",
  OBSERVER = "observer",
  HUMAN = "human"
}

export enum PatternCategory {
  BEHAVIORAL_ANOMALY = "behavioral_anomaly",
  ANTI_GAMING_EVASION = "anti_gaming_evasion",
  DEGRADED_MODE_RECOVERY = "degraded_mode_recovery",
  CONSENSUS_DRIFT = "consensus_drift",
  HALLUCINATION_PATTERN = "hallucination_pattern",
  CAPABILITY_EMERGENCE = "capability_emergence"
}

export enum PatternSeverity {
  INFO = "info",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum EvidenceConfidence {
  DETERMINISTIC = "deterministic",
  EMPIRICAL = "empirical",
  INFERRED = "inferred",
  INSUFFICIENT_DATA = "insufficient_data"
}

export enum EpistemicNature {
  OBSERVED = "observed",
  INFERRED = "inferred"
}

export enum RelationType {
  EVALUATES = "evaluates",
  DERIVES_FROM = "derives_from",
  SUPPORTS = "supports",
  REFUTES = "refutes",
  CONTRADICTS = "contradicts",
  SUPERSEDES = "supersedes",
  DEPENDS_ON = "depends_on",
  REPRODUCES = "reproduces"
}

export enum ObservationCategory {
  TELEMETRY = "telemetry",
  TOOL_OUTPUT = "tool_output",
  MERKLE_PROOF = "merkle_proof",
  BEHAVIORAL_TRACE = "behavioral_trace",
  ANOMALY_SIGNAL = "anomaly_signal",
  HUMAN_REVIEW = "human_review"
}

export enum EvaluationStatus {
  PASSED = "passed",
  FAILED = "failed",
  DEGRADED = "degraded",
  INSUFFICIENT_DATA = "insufficient_data",
  INCONCLUSIVE = "inconclusive"
}

export enum ClaimAssertionType {
  CAPABILITY_BOUND = "capability_bound",
  SAFETY_GUARANTEE = "safety_guarantee",
  ANTI_GAMING_RESISTANCE = "anti_gaming_resistance",
  REPRODUCIBILITY_INVARIANCE = "reproducibility_invariance",
  COST_EFFICIENCY = "cost_efficiency"
}

export enum ClaimStatus {
  VERIFIED = "verified",
  FALSIFIED = "falsified",
  UNSUPPORTED = "unsupported",
  INSUFFICIENT_DATA = "insufficient_data"
}

export enum ReviewerRole {
  INDEPENDENT_OBSERVER = "independent_observer",
  DOMAIN_EXPERT = "domain_expert",
  AUTOMATED_AUDITOR = "automated_auditor",
  PEER_REVIEWER = "peer_reviewer"
}

export enum ReviewVerdict {
  APPROVED = "approved",
  REJECTED = "rejected",
  DISPUTED = "disputed",
  NEEDS_REVISION = "needs_revision",
  INSUFFICIENT_DATA = "insufficient_data"
}

export enum PartnerRole {
  BENCHMARK_CONTRIBUTOR = "benchmark_contributor",
  EVALUATION_HOST = "evaluation_host",
  AUDIT_PARTNER = "audit_partner",
  ACADEMIC_COLLABORATOR = "academic_collaborator"
}

export enum StudyStatus {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  PUBLISHED = "published",
  ARCHIVED = "archived"
}

// ==========================================
// 15 Core Entity Interfaces
// ==========================================

export interface SystemProfile {
  id: string;
  version: string;
  name: string;
  modelFamily: string;
  modelId: string;
  parameters: Record<string, unknown>;
  capabilities: string[];
  contextWindowTokens: number;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface Benchmark {
  id: string;
  version: string;
  name: string;
  description: string;
  domain: string;
  categories: string[];
  caseIds: string[];
  rubricIds: string[];
  versionTag: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Run {
  id: string;
  version: string;
  benchmarkId: string;
  systemProfileId: string;
  status: ProductRunStatus;
  startedAt: string;
  completedAt?: string;
  traceIds: string[];
  evaluationId?: string;
  executionReceiptId?: string;
  environmentMetadata: {
    provider: string;
    platform: string;
    isOfflineDeterministic: boolean;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface Trace {
  id: string;
  version: string;
  runId: string;
  caseId: string;
  status: TraceStatus;
  events: TraceEvent[];
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsdEstimated?: number;
  };
  durationMs: number;
  startedAt: string;
  endedAt: string;
}

export interface TraceEvent {
  id: string;
  traceId: string;
  sequenceIndex: number;
  timestamp: string;
  type: TraceEventType;
  source: TraceEventSource;
  payload: Record<string, unknown>;
  sha256Hash: string;
}

export interface Case {
  id: string;
  version: string;
  benchmarkId: string;
  title: string;
  prompt: string;
  inputs: Record<string, unknown>;
  expectedBehavior: string;
  constraints?: {
    maxTokens?: number;
    timeoutMs?: number;
    allowedTools?: string[];
    forbiddenActions?: string[];
  };
  tags: string[];
}

export interface Pattern {
  id: string;
  version: string;
  name: string;
  category: PatternCategory;
  description: string;
  detectionRule: {
    kind: string;
    expression: string;
    threshold?: number;
  };
  severity: PatternSeverity;
  confidence: EvidenceConfidence;
}

export interface Relation {
  id: string;
  version: string;
  sourceId: string;
  targetId: string;
  relationType: RelationType;
  weight: number;
  nature: EpistemicNature;
  evidenceIds: string[];
}

export interface EvidenceObservation {
  id: string;
  version: string;
  traceId?: string;
  runId?: string;
  nature: EpistemicNature;
  category: ObservationCategory;
  data: Record<string, unknown>;
  confidence: EvidenceConfidence;
  sha256Signature: string;
  recordedAt: string;
}

export interface Evaluation {
  id: string;
  version: string;
  runId: string;
  benchmarkId: string;
  systemProfileId: string;
  status: EvaluationStatus;
  overallScore: number | null;
  scoreBreakdown: Record<
    string,
    {
      score: number | null;
      weight: number;
      status: string;
    }
  >;
  observationIds: string[];
  claimIds: string[];
  generatedAt: string;
}

export interface Claim {
  id: string;
  version: string;
  evaluationId: string;
  statement: string;
  assertionType: ClaimAssertionType;
  status: ClaimStatus;
  nature: EpistemicNature;
  supportingObservationIds: string[];
  refutingObservationIds: string[];
  scope: {
    offlineDeterministicOnly: boolean;
    environmentBounds: string[];
  };
}

export interface Review {
  id: string;
  version: string;
  targetId: string;
  reviewerId: string;
  reviewerRole: ReviewerRole;
  verdict: ReviewVerdict;
  comments: string;
  reproducibilityAuditPassed: boolean;
  reviewedAt: string;
}

export interface Partner {
  id: string;
  version: string;
  name: string;
  organization: string;
  role: PartnerRole;
  contactUri: string;
  publicKey?: string;
  registeredAt: string;
}

export interface Study {
  id: string;
  version: string;
  title: string;
  abstract: string;
  leadAuthor: string;
  partnerIds: string[];
  benchmarkIds: string[];
  runIds: string[];
  evaluationIds: string[];
  status: StudyStatus;
  citation?: {
    cffUri?: string;
    doi?: string;
    bibtex?: string;
  };
  publishedAt?: string;
}

export interface ResearchBundle {
  id: string;
  version: string;
  studyId: string;
  pepArchiveUri: string;
  merkleRootHash: string;
  includedArtifacts: Array<{
    path: string;
    sha256: string;
    mediaType: string;
  }>;
  license: string;
  createdTimestamp: string;
}

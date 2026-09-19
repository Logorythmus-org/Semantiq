import type { EvidencePackage, EvidenceValue, SemanticDigest } from "./evidence-types.js";
import type {
  EvidenceResolutionRequirement,
  PromotionEvidenceResolution
} from "./study-evidence-resolution.js";
import type {
  BenchmarkIdentity,
  RegistryInputRightsClass,
  RegistryProvenanceClass
} from "./registry-types.js";

export interface ResearchIntakeIdentity {
  readonly researchIntakeId: string;
  readonly researchIntakeVersion: string;
}

export const RESEARCH_INTAKE_STATUSES = [
  "REJECTED",
  "ARCHIVED",
  "WATCH",
  "RESEARCH_CANDIDATE",
  "NEEDS_OPERATIONALIZATION",
  "NEEDS_EVIDENCE",
  "READY_FOR_FORMAL_ASSESSMENT"
] as const;
export type ResearchIntakeStatus = (typeof RESEARCH_INTAKE_STATUSES)[number];

export type ResearchDestination =
  | "RESEARCH_ONLY"
  | "BENCHMARK_CANDIDATE"
  | "METRIC_CANDIDATE"
  | "EVALUATOR_CANDIDATE"
  | "CORE_ADMISSION_REVIEW";

export interface ResearchSource {
  readonly sourceId: string;
  readonly sourceType:
    | "FIRST_PARTY"
    | "PROJECT_RECORD"
    | "THIRD_PARTY"
    | "HISTORICAL"
    | "RESEARCH_CONCEPT";
  readonly citationOrReference: string;
  readonly provenanceClass: RegistryProvenanceClass;
  readonly rightsClass: RegistryInputRightsClass;
  readonly limitations: readonly string[];
}

export interface ResearchIntakeInput {
  readonly identity: ResearchIntakeIdentity;
  readonly schemaVersion: "1.0.0";
  readonly researchQuestion: string;
  readonly sources: readonly ResearchSource[];
  readonly motivation: string;
  readonly proposedConstruct: string;
  readonly claimedPhenomenon: string;
  readonly targetPopulationOrSystem: string;
  readonly proposedTaskFamilies: readonly string[];
  readonly proposedObservableBehaviors: readonly string[];
  readonly proposedOperationalizations: readonly string[];
  readonly proposedMetricEvaluatorRelationships: readonly string[];
  readonly assumptions: readonly string[];
  readonly limitations: readonly string[];
  readonly competingExplanations: readonly string[];
  readonly disconfirmingEvidenceReferences: readonly string[];
  readonly rightsStatus: RegistryInputRightsClass;
  readonly provenanceClass: RegistryProvenanceClass;
  readonly cyberSensitivity: "NONE" | "REVIEW_REQUIRED" | "OUT_OF_SCOPE";
  readonly intendedDestination: ResearchDestination;
  readonly evidenceReferences: readonly string[];
  readonly status: ResearchIntakeStatus;
  readonly scientificAuthority: "NONE";
  readonly auditMetadata?: {
    readonly recordedAt?: string;
    readonly requestId?: string;
    readonly reviewerComments?: readonly string[];
  };
}

export interface ResearchIntake extends ResearchIntakeInput {
  readonly semanticDigest: SemanticDigest;
}

export interface ConstructIdentity {
  readonly constructId: string;
  readonly constructVersion: string;
}

export interface ConstructAssessmentInput {
  readonly identity: ConstructIdentity;
  readonly schemaVersion: "1.0.0";
  readonly conceptualDefinition: string;
  readonly inclusionBoundary: readonly string[];
  readonly exclusionBoundary: readonly string[];
  readonly observableImplications: readonly string[];
  readonly competingConstructs: readonly string[];
  readonly confounds: readonly string[];
  readonly targetDomains: readonly string[];
  readonly targetPopulationsOrSystems: readonly string[];
  readonly supportingEvidenceReferences: readonly string[];
  readonly challengingEvidenceReferences: readonly string[];
  readonly operationalizationReferences: readonly string[];
  readonly maturity:
    | "PROPOSED"
    | "DEFINED"
    | "UNDER_ASSESSMENT"
    | "EVIDENCE_SUPPORTED"
    | "CONTESTED";
  readonly limitations: readonly string[];
  readonly validityStatus:
    | "NOT_ASSESSED"
    | "INSUFFICIENT_EVIDENCE"
    | "ASSESSMENT_REQUIRED"
    | "VALIDATED_BY_REFERENCED_EVIDENCE";
  readonly scientificAuthority: "NONE";
  readonly auditMetadata?: {
    readonly recordedAt?: string;
    readonly requestId?: string;
    readonly reviewerComments?: readonly string[];
  };
}

export interface ConstructAssessment extends ConstructAssessmentInput {
  readonly semanticDigest: SemanticDigest;
}

export interface OperationalizationIdentity {
  readonly operationalizationId: string;
  readonly operationalizationVersion: string;
}

export type OperationalizationNode =
  | "CONSTRUCT"
  | "TASK_OR_STIMULUS"
  | "RESPONSE"
  | "OBSERVABLE_FEATURE"
  | "METRIC"
  | "EVALUATOR"
  | "INTERPRETATION";

export interface OperationalizationTransition {
  readonly from: OperationalizationNode;
  readonly to: OperationalizationNode;
  readonly bindingReference: string;
  readonly assumptions: readonly string[];
  readonly failureModes: readonly string[];
  readonly evidenceReferences: readonly string[];
}

export interface OperationalizationInput {
  readonly identity: OperationalizationIdentity;
  readonly schemaVersion: "1.0.0";
  readonly constructIdentity: ConstructIdentity;
  readonly transitions: readonly OperationalizationTransition[];
  readonly interpretation: string;
  readonly alternativeOperationalizationReferences: readonly string[];
  readonly limitations: readonly string[];
  readonly status: "PROPOSED" | "SPECIFIED" | "EXECUTABLE" | "EMPIRICALLY_ASSESSED" | "REJECTED";
  readonly scientificAuthority: "NONE";
  readonly auditMetadata?: {
    readonly recordedAt?: string;
    readonly requestId?: string;
    readonly reviewerComments?: readonly string[];
  };
}

export interface Operationalization extends OperationalizationInput {
  readonly semanticDigest: SemanticDigest;
}

export const PROMOTION_EVIDENCE_CATEGORIES = [
  "THEORETICAL",
  "IMPLEMENTATION",
  "UNIT_TEST",
  "INTEGRATION_TEST",
  "SYNTHETIC_EXPERIMENT",
  "EMPIRICAL",
  "CALIBRATION",
  "RELIABILITY",
  "VALIDITY",
  "ROBUSTNESS",
  "ANTI_GAMING",
  "HUMAN_RATER",
  "HUMAN_SUBJECT",
  "COMPARABILITY",
  "REPRODUCTION",
  "REPLICATION",
  "EXTERNAL_VALIDATION",
  "CONTRADICTORY",
  "NEGATIVE_RESULT"
] as const;
export type PromotionEvidenceCategory = (typeof PROMOTION_EVIDENCE_CATEGORIES)[number];

export interface PromotionEvidenceRecord {
  readonly evidenceId: string;
  readonly evidenceVersion: string;
  readonly category: PromotionEvidenceCategory;
  readonly disposition:
    | "SUPPORTING"
    | "CONTRADICTORY"
    | "NEGATIVE_RESULT"
    | "FAILED_REPRODUCTION"
    | "FAILED_REPLICATION"
    | "METHODOLOGICAL_CRITICISM";
  readonly targetReference: string;
  readonly evidencePackageReferences: readonly string[];
  readonly sourceReferences: readonly string[];
  readonly finding: string;
  readonly materiality: "INFORMATIONAL" | "MATERIAL" | "CRITICAL";
  readonly resolution: "OPEN" | "RESOLVED" | "ACCEPTED_LIMITATION" | "NOT_APPLICABLE";
  readonly rightsClass: RegistryInputRightsClass;
  readonly limitations: readonly string[];
  readonly scientificAuthority: "NONE";
}

export const PROMOTION_STAGES = [
  "CONCEPT",
  "RESEARCH_CANDIDATE",
  "SPECIFIED_CANDIDATE",
  "EXECUTABLE_CANDIDATE",
  "EMPIRICALLY_STUDIED",
  "CALIBRATED",
  "VALIDATED",
  "CORE_ELIGIBLE",
  "CORE"
] as const;
export type PromotionStage = (typeof PROMOTION_STAGES)[number];

export const PROMOTION_GATE_IDS = [
  "STABLE_BENCHMARK_IDENTITY",
  "CONSTRUCT_DEFINED",
  "OPERATIONALIZATION_DEFINED",
  "METRIC_SEMANTICS",
  "EVALUATOR_SEMANTICS",
  "IMPLEMENTATION",
  "EMPIRICAL_EVIDENCE",
  "CALIBRATION",
  "RELIABILITY",
  "VALIDITY",
  "ROBUSTNESS",
  "ANTI_GAMING",
  "S09_EVIDENCE_PACKAGE",
  "REPRODUCIBILITY",
  "RIGHTS_CLEARANCE",
  "DOCUMENTATION",
  "VERSIONING_POLICY",
  "DEPRECATION_POLICY",
  "CONTRADICTIONS_RESOLVED",
  "HUMAN_PROTOCOL",
  "PRIVACY_ETHICS_LEGAL",
  "SAMPLING",
  "MISSINGNESS",
  "RATER_SUBJECT_SEPARATION",
  "POPULATION_LIMITATIONS",
  "S08_COMPARABILITY",
  "COMMON_SCALE",
  "POPULATION_DENOMINATOR",
  "PURPOSE_LIMITATION",
  "GOVERNANCE_APPROVAL"
] as const;
export type PromotionGateId = (typeof PROMOTION_GATE_IDS)[number];
export type PromotionGateStatus =
  | "SATISFIED"
  | "PARTIALLY_SATISFIED"
  | "UNSATISFIED"
  | "UNKNOWN"
  | "NOT_APPLICABLE";

export interface PromotionGateEvidence {
  readonly gateId: PromotionGateId;
  readonly status: PromotionGateStatus;
  readonly evidenceReferences: readonly string[];
  readonly rationale: string;
  readonly notApplicableJustification?: string;
}

export interface PromotionRequest {
  readonly requestId: string;
  readonly requestVersion: string;
  readonly benchmarkIdentity: EvidenceValue<BenchmarkIdentity>;
  readonly intakeIdentity: ResearchIntakeIdentity;
  readonly requestedStage: PromotionStage;
  readonly candidateKind: "GENERAL" | "HUMAN_BENCHMARK" | "HUMAN_AI_COMPARATIVE";
  readonly requestedByGovernance: boolean;
  readonly evidenceReferences: readonly string[];
  readonly rationale: string;
}

export interface PromotionAssessmentInput {
  readonly assessmentId: string;
  readonly assessmentVersion: string;
  readonly schemaVersion: "1.0.0";
  readonly request: PromotionRequest;
  /** Exact S-09 identities resolved mechanically by S-11/03. */
  readonly evidenceRequirements?: readonly EvidenceResolutionRequirement[] | undefined;
  /** Retained for audit compatibility; supplied statuses do not determine gates. */
  readonly gateEvidence: readonly PromotionGateEvidence[];
  readonly evidenceRecords: readonly PromotionEvidenceRecord[];
  readonly evidencePackages: readonly EvidencePackage[];
  readonly knownConfounds: readonly string[];
  readonly unresolvedMethodologicalCriticism: readonly string[];
  readonly limitations: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly auditMetadata?: {
    readonly assessedAt?: string;
    readonly requestId?: string;
    readonly reviewerComments?: readonly string[];
  };
}

export type PromotionRecommendation =
  | "NOT_ELIGIBLE"
  | "INSUFFICIENT_EVIDENCE"
  | "ELIGIBLE_FOR_REVIEW"
  | "BLOCKED_BY_CONTRADICTION"
  | "BLOCKED_BY_GOVERNANCE";

export interface PromotionGateAssessment extends PromotionGateEvidence {
  readonly critical: boolean;
  readonly blocking: boolean;
}

export interface PromotionAssessment extends PromotionAssessmentInput {
  readonly assessmentDigest: SemanticDigest;
  readonly evidenceResolution: PromotionEvidenceResolution;
  readonly gateAssessments: readonly PromotionGateAssessment[];
  readonly recommendation: PromotionRecommendation;
  readonly blockingGateIds: readonly PromotionGateId[];
  readonly contradictoryEvidenceIds: readonly string[];
  readonly negativeEvidenceIds: readonly string[];
  readonly mutatesBenchmarkRegistry: false;
}

export interface GovernanceApprovalEvidence {
  readonly governanceRecordId: string;
  readonly governanceRecordVersion: string;
  readonly decision: "APPROVED" | "REJECTED" | "DEFERRED";
  readonly authority: "HUMAN_GOVERNANCE";
  readonly evidenceReferences: readonly string[];
  readonly rationale: string;
}

export interface PromotionDecision {
  readonly decisionId: string;
  readonly decisionVersion: string;
  readonly assessmentReference: string;
  readonly assessmentDigest: SemanticDigest;
  readonly outcome:
    | "NOT_ELIGIBLE"
    | "INSUFFICIENT_EVIDENCE"
    | "ELIGIBLE_FOR_REVIEW"
    | "BLOCKED_BY_CONTRADICTION"
    | "BLOCKED_BY_GOVERNANCE"
    | "APPROVED_BY_GOVERNANCE";
  readonly governanceEvidence?: GovernanceApprovalEvidence;
  readonly benchmarkRegistryMutationRequired: true;
  readonly benchmarkRegistryMutated: false;
  readonly rationale: string;
  readonly scientificAuthority: "NONE";
}

export type LifecycleReviewAction =
  | "DEPRECATION"
  | "DEMOTION"
  | "RETRACTION"
  | "SUPERSESSION"
  | "ARCHIVAL";

export interface LifecycleReassessment {
  readonly reassessmentId: string;
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly triggerEvidenceReferences: readonly string[];
  readonly action: LifecycleReviewAction;
  readonly rationale: string;
  readonly preserveHistoricalEvidence: true;
  readonly preserveAuditHistory: true;
  readonly registryMutationRequired: true;
  readonly registryMutated: false;
}

export interface ResearchPromotionViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}
export interface ResearchPromotionRepresentativeCase {
  readonly caseId: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";
  readonly description: string;
  readonly expectedOutcome: string;
}

import type {
  EvaluatorAbstentionReason,
  EvaluatorConfiguration,
  EvaluatorExecution,
  RubricIdentity
} from "./evaluator-types.js";
import type { MetricBenchmarkBinding, MetricIdentity, MetricResult } from "./metric-types.js";

export interface HumanRaterIdentity {
  readonly raterId: string;
}

export const HUMAN_RATER_STATUSES = ["REGISTERED", "QUALIFIED", "SUSPENDED", "RETIRED"] as const;
export type HumanRaterStatus = (typeof HUMAN_RATER_STATUSES)[number];

export interface HumanRater {
  readonly identity: HumanRaterIdentity;
  readonly status: HumanRaterStatus;
  readonly qualificationReferences: readonly string[];
  readonly trainingReferences: readonly string[];
  readonly rubricFamiliarizationReferences: readonly string[];
  readonly participationPolicyReference: string;
  readonly acknowledgementReference: string;
  readonly provenanceReferences: readonly string[];
  readonly limitations: readonly string[];
}

export interface HumanRatingStudyIdentity {
  readonly humanRatingStudyId: string;
  readonly humanRatingStudyVersion: string;
}

export const HUMAN_PRESENTATION_MODES = ["SINGLE", "PAIRWISE", "MULTI_CANDIDATE"] as const;
export type HumanPresentationMode = (typeof HUMAN_PRESENTATION_MODES)[number];

export const HUMAN_BLINDING_POLICIES = [
  "NONE",
  "SUBJECT_IDENTITY_BLINDED",
  "MODEL_IDENTITY_BLINDED",
  "PROVIDER_IDENTITY_BLINDED",
  "FULL_SOURCE_BLINDED"
] as const;
export type HumanBlindingPolicy = (typeof HUMAN_BLINDING_POLICIES)[number];

export type HumanRandomizationPolicy =
  | { readonly method: "NONE" }
  | { readonly method: "SEEDED_FISHER_YATES"; readonly seedRequired: true };

export type HumanRatingOutputContract =
  | { readonly kind: "CATEGORICAL"; readonly allowedValues: readonly string[] }
  | { readonly kind: "ORDINAL"; readonly orderedValues: readonly string[] }
  | { readonly kind: "NUMERIC"; readonly metricIdentity: MetricIdentity }
  | { readonly kind: "STRUCTURED_JUDGMENT"; readonly schemaReference: string };

export interface HumanRatingStudyDefinition {
  readonly identity: HumanRatingStudyIdentity;
  readonly versionScope: "HUMAN_RATING_STUDY";
  readonly role: "HUMAN_AS_JUDGE";
  readonly name: string;
  readonly description: string;
  readonly benchmarkBinding?: MetricBenchmarkBinding | undefined;
  readonly evaluationTarget: string;
  readonly inputKind: string;
  readonly subjectKind: string;
  readonly rubricIdentity: RubricIdentity;
  readonly output: HumanRatingOutputContract;
  readonly assignmentPolicy: "INDEPENDENT_SINGLE" | "INDEPENDENT_REPEATED";
  readonly presentationMode: HumanPresentationMode;
  readonly blindingPolicy: HumanBlindingPolicy;
  readonly randomizationPolicy: HumanRandomizationPolicy;
  readonly repeatPolicy: "FORBIDDEN" | "ALLOWED" | "REQUIRED";
  readonly comparisonPolicy: "NONE" | "ORDERED_CANDIDATE_COMPARISON";
  readonly evidenceReferences: readonly string[];
  readonly provenanceReferences: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly limitations: readonly string[];
}

export interface CanonicalHumanRaterRegistrySnapshot {
  readonly humanRaterRegistrySchemaVersion: string;
  readonly raters: readonly HumanRater[];
  readonly studies: readonly HumanRatingStudyDefinition[];
}

export const HUMAN_ASSIGNMENT_STATES = [
  "ASSIGNED",
  "OPENED",
  "SUBMITTED",
  "ABSTAINED",
  "EXPIRED",
  "CANCELLED"
] as const;
export type HumanAssignmentState = (typeof HUMAN_ASSIGNMENT_STATES)[number];

export interface HumanRatingTarget {
  readonly subjectId: string;
  readonly subjectKind: string;
  readonly evaluationTarget: string;
  readonly inputKind: string;
  readonly inputReferences: readonly string[];
  readonly benchmarkBinding?: MetricBenchmarkBinding | undefined;
}

export interface HumanRatingAssignmentInput {
  readonly assignmentId: string;
  readonly studyIdentity: HumanRatingStudyIdentity;
  readonly raterId: string;
  readonly target: HumanRatingTarget;
  readonly createdAt: string;
  readonly requestId?: string | undefined;
}

export interface HumanRatingAssignment {
  readonly assignmentId: string;
  readonly assignmentDigest: string;
  readonly studyIdentity: HumanRatingStudyIdentity;
  readonly studyDefinitionDigest: string;
  readonly raterId: string;
  readonly raterStatusAtAssignment: HumanRaterStatus;
  readonly target: HumanRatingTarget;
  readonly rubricIdentity: RubricIdentity;
  readonly presentationMode: HumanPresentationMode;
  readonly blindingPolicy: HumanBlindingPolicy;
  readonly state: HumanAssignmentState;
  readonly createdAt: string;
  readonly openedAt?: string | undefined;
}

export interface HumanPresentationCandidateInput {
  readonly candidateId: string;
  readonly contentReference: string;
  readonly semanticContentDigest: string;
  readonly metadata: {
    readonly subjectIdentity?: string | undefined;
    readonly modelIdentity?: string | undefined;
    readonly providerIdentity?: string | undefined;
    readonly sourceLabel?: string | undefined;
    readonly visibleLabels?: readonly string[] | undefined;
  };
}

export interface HumanPresentationInput {
  readonly presentationId: string;
  readonly assignment: HumanRatingAssignment;
  readonly candidates: readonly HumanPresentationCandidateInput[];
  readonly randomizationSeed?: number | undefined;
  readonly openedAt: string;
  readonly requestId?: string | undefined;
}

export interface HumanPresentationCandidate {
  readonly candidateId: string;
  readonly contentReference: string;
  readonly semanticContentDigest: string;
  readonly visibleMetadata: HumanPresentationCandidateInput["metadata"];
}

export interface HumanPresentation {
  readonly presentationId: string;
  readonly presentationDigest: string;
  readonly assignmentId: string;
  readonly studyIdentity: HumanRatingStudyIdentity;
  readonly raterId: string;
  readonly mode: HumanPresentationMode;
  readonly rubricIdentity: RubricIdentity;
  readonly candidates: readonly HumanPresentationCandidate[];
  readonly declaredBlindingPolicy: HumanBlindingPolicy;
  readonly effectiveVisibility: {
    readonly subjectIdentity: boolean;
    readonly modelIdentity: boolean;
    readonly providerIdentity: boolean;
    readonly sourceLabel: boolean;
  };
  readonly transformations: readonly string[];
  readonly randomization: {
    readonly method: "NONE" | "SEEDED_FISHER_YATES";
    readonly seed?: number | undefined;
    readonly inputOrder: readonly string[];
    readonly resultingOrder: readonly string[];
  };
  readonly sourceAnonymityGuarantee: "NOT_CLAIMED";
  readonly openedAt: string;
}

export const HUMAN_SUBMISSION_STATUSES = [
  "SUBMITTED",
  "ABSTAINED",
  "INCOMPLETE",
  "INVALID",
  "SYSTEM_FAILURE"
] as const;
export type HumanSubmissionStatus = (typeof HUMAN_SUBMISSION_STATUSES)[number];

export type HumanRatingOutput =
  | {
      readonly kind: "CATEGORICAL";
      readonly category: string;
      readonly rationale?: string | undefined;
    }
  | {
      readonly kind: "ORDINAL";
      readonly category: string;
      readonly ordinalPosition: number;
      readonly rationale?: string | undefined;
    }
  | { readonly kind: "NUMERIC"; readonly metricResult: MetricResult }
  | {
      readonly kind: "STRUCTURED_JUDGMENT";
      readonly judgment: string;
      readonly rationale?: string | undefined;
    };

export interface HumanRatingInput {
  readonly ratingId: string;
  readonly assignment: HumanRatingAssignment;
  readonly presentation: HumanPresentation;
  readonly status: HumanSubmissionStatus;
  readonly output?: HumanRatingOutput | undefined;
  readonly abstention?:
    | {
        readonly reason: EvaluatorAbstentionReason;
        readonly detail?: string | undefined;
      }
    | undefined;
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly submittedAt: string;
  readonly requestId?: string | undefined;
}

export interface HumanRating {
  readonly ratingId: string;
  readonly ratingDigest: string;
  readonly assignmentId: string;
  readonly presentationId: string;
  readonly presentationDigest: string;
  readonly studyIdentity: HumanRatingStudyIdentity;
  readonly raterId: string;
  readonly raterStatusAtSubmission: HumanRaterStatus;
  readonly rubricIdentity: RubricIdentity;
  readonly target: HumanRatingTarget;
  readonly status: HumanSubmissionStatus;
  readonly output?: HumanRatingOutput | undefined;
  readonly abstention?: HumanRatingInput["abstention"];
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly submittedAt: string;
  readonly scientificAuthority: "NONE";
  readonly groundTruthClaim: "NONE";
  readonly benchmarkMaturityEffect: "NONE";
  readonly metricValidityEffect: "NONE";
}

export interface HumanRatingSubmission {
  readonly rating: HumanRating;
  readonly assignment: HumanRatingAssignment;
}

export interface HumanJudgeExecutionResult {
  readonly configuration: EvaluatorConfiguration;
  readonly execution: EvaluatorExecution;
}

export interface HumanRaterValidationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface HumanRaterValidationResult {
  readonly valid: boolean;
  readonly violations: readonly HumanRaterValidationViolation[];
}

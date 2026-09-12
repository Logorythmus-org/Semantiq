import type {
  EvaluatorConfiguration,
  EvaluatorExecution,
  EvaluatorIdentity
} from "./evaluator-types.js";
import type { MetricBenchmarkBinding, MetricIdentity } from "./metric-types.js";

export interface ReliabilityStudyIdentity {
  readonly reliabilityStudyId: string;
  readonly reliabilityStudyVersion: string;
}

export const RELIABILITY_METHODS = [
  "EXACT_REPEATABILITY",
  "NUMERIC_RUN_TO_RUN_STABILITY",
  "CATEGORICAL_AGREEMENT",
  "ORDINAL_AGREEMENT",
  "TEST_RETEST",
  "JUDGE_TO_JUDGE_AGREEMENT",
  "INTER_RATER_AGREEMENT",
  "INTRA_RATER_AGREEMENT",
  "STOCHASTIC_STABILITY"
] as const;
export type ReliabilityMethod = (typeof RELIABILITY_METHODS)[number];

export type ReliabilityDimension =
  | "BENCHMARK_VERSION"
  | "BENCHMARK_INPUT"
  | "METRIC_VERSION"
  | "EVALUATOR_VERSION"
  | "EVALUATOR_CONFIGURATION"
  | "RUBRIC_VERSION"
  | "SUBJECT"
  | "MODEL_PROVIDER"
  | "MODEL_SNAPSHOT"
  | "SEED"
  | "SAMPLING_CONFIGURATION"
  | "ENVIRONMENT"
  | "TIME_WINDOW"
  | "RATER";

export type ReliabilityStudyTarget =
  | { readonly kind: "METRIC"; readonly metric: MetricIdentity }
  | { readonly kind: "EVALUATOR"; readonly evaluator: EvaluatorIdentity }
  | {
      readonly kind: "EVALUATOR_CONFIGURATION";
      readonly evaluator: EvaluatorIdentity;
      readonly configurationDigest: string;
    }
  | {
      readonly kind: "BENCHMARK_METRIC_BINDING";
      readonly binding: MetricBenchmarkBinding;
      readonly metric: MetricIdentity;
    }
  | {
      readonly kind: "HUMAN_RATER_SET";
      readonly evaluator: EvaluatorIdentity;
      readonly raterSetId: string;
    };

export interface ReliabilityMethodDefinition {
  readonly method: ReliabilityMethod;
  readonly implementationStatus: "SUPPORTED_BY_SCHEMA" | "IMPLEMENTED";
  readonly requiredInput: "EVALUATOR_EXECUTION" | "NUMERIC_METRIC_RESULT" | "CATEGORICAL_DECISION";
  readonly minimumEvidence: number;
  readonly assumptions: readonly string[];
  readonly applicability: string;
  readonly computation: string;
  readonly outputContract: string;
  readonly degenerateCases: readonly string[];
  readonly missingnessHandling: string;
  readonly limitations: readonly string[];
}

export interface ReliabilityStudyDefinition {
  readonly identity: ReliabilityStudyIdentity;
  readonly versionScope: "RELIABILITY_STUDY";
  readonly name: string;
  readonly question: string;
  readonly target: ReliabilityStudyTarget;
  readonly method: ReliabilityMethod;
  readonly constantDimensions: readonly ReliabilityDimension[];
  readonly variedDimensions: readonly ReliabilityDimension[];
  readonly evidenceReferences: readonly string[];
  readonly provenanceReferences: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly limitations: readonly string[];
}

export interface CanonicalReliabilityRegistrySnapshot {
  readonly reliabilityRegistrySchemaVersion: string;
  readonly methods: readonly ReliabilityMethodDefinition[];
  readonly studies: readonly ReliabilityStudyDefinition[];
}

export interface ReliabilityStudyExecutionInput {
  readonly executionId: string;
  readonly studyIdentity: ReliabilityStudyIdentity;
  readonly definitionDigest: string;
  readonly executionReferences: readonly string[];
  readonly evaluatorExecutions: readonly EvaluatorExecution[];
  readonly configurations: readonly EvaluatorConfiguration[];
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly executedAt: string;
}

export interface ReliabilityStudyExecution {
  readonly executionId: string;
  readonly studyIdentity: ReliabilityStudyIdentity;
  readonly definitionDigest: string;
  readonly executionDigest: string;
  readonly executionReferences: readonly string[];
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly executedAt: string;
}

export type ReliabilityExclusionReason =
  | "FAILED"
  | "ABSTAINED"
  | "NOT_APPLICABLE"
  | "PARTIAL_WITHOUT_OUTPUT"
  | "MISSING_VALUE"
  | "INCOMPATIBLE_OUTPUT";

export interface ReliabilityExclusion {
  readonly executionId: string;
  readonly reason: ReliabilityExclusionReason;
  readonly detail: string;
}

export interface ReliabilitySampleAccounting {
  readonly candidateObservations: number;
  readonly eligibleObservations: number;
  readonly usedObservations: number;
  readonly excludedObservations: number;
  readonly candidatePairs?: number | undefined;
  readonly eligiblePairs?: number | undefined;
  readonly usedPairs?: number | undefined;
}

export type ReliabilityEstimateValue =
  | {
      readonly kind: "EXACT_REPEATABILITY" | "STOCHASTIC_STABILITY";
      readonly exactMatches: number;
      readonly exactMatchRate: number;
    }
  | {
      readonly kind: "NUMERIC_RUN_TO_RUN_STABILITY";
      readonly n: number;
      readonly mean: number;
      readonly sampleStandardDeviation: number;
      readonly minimum: number;
      readonly maximum: number;
      readonly range: number;
    }
  | {
      readonly kind: "CATEGORICAL_AGREEMENT";
      readonly agreements: number;
      readonly rawAgreement: number;
    };

export interface ReliabilityEstimate {
  readonly estimateId: string;
  readonly studyIdentity: ReliabilityStudyIdentity;
  readonly method: ReliabilityMethod;
  readonly applicability: "ESTIMATED" | "INSUFFICIENT_EVIDENCE" | "DEGENERATE_SAMPLE";
  readonly sample: ReliabilitySampleAccounting;
  readonly exclusions: readonly ReliabilityExclusion[];
  readonly value?: ReliabilityEstimateValue | undefined;
  readonly executionReferences: readonly string[];
  readonly configurationDigests: readonly string[];
  readonly assumptionsSatisfied: boolean;
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly limitations: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly validityClaim: "NONE";
  readonly benchmarkMaturityEffect: "NONE";
}

export interface ReliabilityStudyResult {
  readonly execution: ReliabilityStudyExecution;
  readonly estimate: ReliabilityEstimate;
}

export interface ReliabilityValidationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface ReliabilityValidationResult {
  readonly valid: boolean;
  readonly violations: readonly ReliabilityValidationViolation[];
}

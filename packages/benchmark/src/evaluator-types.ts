import type { MetricBenchmarkBinding, MetricIdentity, MetricResult } from "./metric-types.js";
import type { BenchmarkEvaluatorMechanism, BenchmarkIdentity } from "./registry-types.js";

export type EvaluatorKind = BenchmarkEvaluatorMechanism;

export interface EvaluatorIdentity {
  readonly evaluatorId: string;
  readonly evaluatorVersion: string;
}

export const EVALUATOR_DETERMINISM = [
  "DETERMINISTIC",
  "SEEDED_STOCHASTIC",
  "STOCHASTIC",
  "EXTERNAL_NONDETERMINISTIC",
  "UNKNOWN"
] as const;
export type EvaluatorDeterminism = (typeof EVALUATOR_DETERMINISM)[number];

export const JUDGE_INDEPENDENCE = [
  "SELF",
  "SAME_MODEL",
  "SAME_FAMILY",
  "CROSS_MODEL",
  "HUMAN",
  "NON_MODEL"
] as const;
export type JudgeIndependence = (typeof JUDGE_INDEPENDENCE)[number];

export const EVALUATOR_AUTHORITIES = [
  "PRODUCE_OBSERVATION",
  "COMPUTE_METRIC",
  "RECOMMEND_RATING",
  "PRODUCE_JUDGMENT",
  "AGGREGATE_JUDGMENTS"
] as const;
export type EvaluatorAuthority = (typeof EVALUATOR_AUTHORITIES)[number];

export interface EvaluatorProvenance {
  readonly origin: string;
  readonly provenanceClass: "PROJECT_EXISTING_SOURCE" | "HUMAN_DIRECTION" | "MIXED";
  readonly sourceReferences: readonly string[];
  readonly introducedIn: "S04" | "S07";
}

export interface RubricIdentity {
  readonly rubricId: string;
  readonly rubricVersion: string;
}

export interface RubricCriterion {
  readonly criterionId: string;
  readonly description: string;
  readonly weight?: number | undefined;
  readonly reference: string;
}

export interface CanonicalRubricDefinition {
  readonly identity: RubricIdentity;
  readonly versionScope: "RUBRIC";
  readonly name: string;
  readonly description: string;
  readonly criteria: readonly RubricCriterion[];
  readonly provenance: EvaluatorProvenance;
  readonly limitations: readonly string[];
}

export type EvaluatorOutputKind =
  | "METRIC_RESULT"
  | "LEGACY_ARTIFACT_REFERENCE"
  | "STRUCTURED_JUDGMENT"
  | "CATEGORICAL_DECISION";

export interface EvaluatorInputContract {
  readonly inputKinds: readonly string[];
  readonly minimumInputs: number;
  readonly subjectKinds: readonly string[];
}

export interface EvaluatorOutputContract {
  readonly kinds: readonly EvaluatorOutputKind[];
  readonly numericOutputRequiresMetricResult: true;
}

export type EvaluatorParameterType = "STRING" | "NUMBER" | "BOOLEAN" | "STRING_ARRAY";

export interface EvaluatorParameterDefinition {
  readonly parameterId: string;
  readonly type: EvaluatorParameterType;
  readonly required: boolean;
  readonly description: string;
}

export interface CanonicalEvaluatorDefinition {
  readonly identity: EvaluatorIdentity;
  readonly versionScope: "EVALUATOR";
  readonly name: string;
  readonly description: string;
  readonly kind: EvaluatorKind;
  readonly bindingStatus: "SUPPORTED_BY_SCHEMA" | "IMPLEMENTED_AND_BOUND";
  readonly implementationId?: string | undefined;
  readonly authority: readonly EvaluatorAuthority[];
  readonly scientificAuthority: "NONE";
  readonly benchmarkBindings: readonly {
    readonly benchmark: BenchmarkIdentity;
    readonly constructIds: readonly string[];
  }[];
  readonly metricBindings: readonly MetricIdentity[];
  readonly studyDeclaredBindingPolicy?:
    | {
        readonly benchmark: "FORBIDDEN" | "ALLOWED";
        readonly metric: "FORBIDDEN" | "ALLOWED";
      }
    | undefined;
  readonly inputs: EvaluatorInputContract;
  readonly outputs: EvaluatorOutputContract;
  readonly rubric: {
    readonly requirement: "REQUIRED" | "OPTIONAL" | "FORBIDDEN";
    readonly identity?: RubricIdentity | undefined;
  };
  readonly modelRequirement: "REQUIRED" | "OPTIONAL" | "FORBIDDEN";
  readonly determinism: EvaluatorDeterminism;
  readonly judgeIndependence: JudgeIndependence;
  readonly parameters: readonly EvaluatorParameterDefinition[];
  readonly evidenceReferences: readonly string[];
  readonly provenance: EvaluatorProvenance;
  readonly limitations: readonly string[];
}

export interface CanonicalEvaluatorRegistrySnapshot {
  readonly evaluatorRegistrySchemaVersion: string;
  readonly supportedKinds: readonly EvaluatorKind[];
  readonly rubrics: readonly CanonicalRubricDefinition[];
  readonly definitions: readonly CanonicalEvaluatorDefinition[];
}

export type CanonicalConfigurationValue = string | number | boolean | readonly string[];

export interface ModelReference {
  readonly provider: string;
  readonly modelId: string;
  readonly snapshotStatus: "DECLARED_IMMUTABLE" | "MUTABLE_ALIAS" | "UNKNOWN";
  readonly modelVersion?: string | undefined;
}

export interface EvaluatorConfigurationInput {
  readonly evaluatorIdentity: EvaluatorIdentity;
  readonly parameters: Readonly<Record<string, CanonicalConfigurationValue>>;
  readonly rubricIdentity?: RubricIdentity | undefined;
  readonly model?: ModelReference | undefined;
  readonly toolReferences?: readonly string[] | undefined;
  readonly contextReferences?: readonly string[] | undefined;
  readonly normalizationReferences?: readonly string[] | undefined;
  readonly auditMetadata?: {
    readonly createdAt?: string | undefined;
    readonly requestId?: string | undefined;
  };
}

export interface EvaluatorConfiguration {
  readonly configurationDigest: string;
  readonly evaluatorIdentity: EvaluatorIdentity;
  readonly parameters: Readonly<Record<string, CanonicalConfigurationValue>>;
  readonly rubricIdentity?: RubricIdentity | undefined;
  readonly model?: ModelReference | undefined;
  readonly toolReferences: readonly string[];
  readonly contextReferences: readonly string[];
  readonly normalizationReferences: readonly string[];
}

export const EVALUATOR_EXECUTION_STATUSES = [
  "SUCCEEDED",
  "FAILED",
  "PARTIAL",
  "ABSTAINED",
  "NOT_APPLICABLE"
] as const;
export type EvaluatorExecutionStatus = (typeof EVALUATOR_EXECUTION_STATUSES)[number];

export const EVALUATOR_ABSTENTION_REASONS = [
  "INSUFFICIENT_EVIDENCE",
  "OUT_OF_SCOPE",
  "INVALID_INPUT",
  "AMBIGUOUS",
  "POLICY_OR_PERMISSION",
  "EVALUATOR_LIMITATION"
] as const;
export type EvaluatorAbstentionReason = (typeof EVALUATOR_ABSTENTION_REASONS)[number];

export type EvaluatorExecutionOutput =
  | { readonly kind: "METRIC_RESULT"; readonly metricResult: MetricResult }
  | { readonly kind: "LEGACY_ARTIFACT_REFERENCE"; readonly artifactReference: string }
  | {
      readonly kind: "STRUCTURED_JUDGMENT";
      readonly judgment: string;
      readonly rationale?: string | undefined;
      readonly evidenceReferences: readonly string[];
    }
  | {
      readonly kind: "CATEGORICAL_DECISION";
      readonly category: string;
      readonly rationale?: string | undefined;
      readonly evidenceReferences: readonly string[];
    };

export interface EvaluatorExecution {
  readonly executionId: string;
  readonly evaluatorIdentity: EvaluatorIdentity;
  readonly configurationDigest: string;
  readonly runId: string;
  readonly subject: { readonly subjectId: string; readonly subjectKind: string };
  readonly evaluationTarget: string;
  readonly inputKind: string;
  readonly inputReferences: readonly string[];
  readonly benchmarkBinding?: MetricBenchmarkBinding | undefined;
  readonly metricIdentity?: MetricIdentity | undefined;
  readonly status: EvaluatorExecutionStatus;
  readonly output?: EvaluatorExecutionOutput | undefined;
  readonly failure?: { readonly code: string; readonly detail: string } | undefined;
  readonly abstention?:
    | {
        readonly reason: EvaluatorAbstentionReason;
        readonly detail?: string | undefined;
        readonly evidenceReferences: readonly string[];
      }
    | undefined;
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly executedAt: string;
}

export interface ComparableEvaluatorExecutionGroup {
  readonly comparisonKey: string;
  readonly executions: readonly EvaluatorExecution[];
  readonly hasDisagreement: boolean;
}

export interface EvaluatorValidationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface EvaluatorValidationResult {
  readonly valid: boolean;
  readonly violations: readonly EvaluatorValidationViolation[];
}

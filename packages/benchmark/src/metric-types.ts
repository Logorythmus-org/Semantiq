import type { BenchmarkIdentity } from "./registry-types.js";

export const MEASUREMENT_KINDS = [
  "RAW_OBSERVATION",
  "DERIVED_FEATURE",
  "ENGINEERING_METRIC",
  "HEURISTIC_PROXY",
  "EMPIRICAL_MEASURE"
] as const;

export type MeasurementKind = (typeof MEASUREMENT_KINDS)[number];

export const METRIC_SCALE_TYPES = [
  "BOOLEAN",
  "COUNT",
  "RATIO",
  "INTERVAL",
  "ORDINAL",
  "CATEGORICAL",
  "PROBABILITY",
  "CONTINUOUS"
] as const;

export type MetricScaleType = (typeof METRIC_SCALE_TYPES)[number];

export const METRIC_UNITS = [
  "DIMENSIONLESS",
  "COUNT",
  "MILLISECONDS",
  "SECONDS",
  "BYTES",
  "TOKENS",
  "PROPORTION",
  "PERCENTAGE"
] as const;

export type MetricUnit = (typeof METRIC_UNITS)[number];

export const METRIC_DIRECTIONS = [
  "HIGHER_IS_BETTER",
  "LOWER_IS_BETTER",
  "TARGET_VALUE",
  "NON_DIRECTIONAL"
] as const;

export type MetricDirection = (typeof METRIC_DIRECTIONS)[number];

export const METRIC_MISSING_REASONS = [
  "NOT_OBSERVED",
  "NOT_APPLICABLE",
  "INVALID_INPUT",
  "EVALUATOR_FAILURE",
  "INSUFFICIENT_EVIDENCE"
] as const;

export type MetricMissingReason = (typeof METRIC_MISSING_REASONS)[number];

export const METRIC_AGGREGATIONS = [
  "NONE",
  "SUM",
  "COUNT",
  "MEAN",
  "MEDIAN",
  "MIN",
  "MAX",
  "WEIGHTED_MEAN"
] as const;

export type MetricAggregationMethod = (typeof METRIC_AGGREGATIONS)[number];

export const METRIC_UNCERTAINTY_METHODS = [
  "NONE",
  "STANDARD_ERROR",
  "CONFIDENCE_INTERVAL",
  "BOOTSTRAP_INTERVAL",
  "EMPIRICAL_DISTRIBUTION"
] as const;

export type MetricUncertaintyMethod = (typeof METRIC_UNCERTAINTY_METHODS)[number];

export type ScientificApplicability = "REQUIRED" | "NOT_APPLICABLE";
export type CalibrationStatus = "NOT_APPLICABLE" | "REQUIRED_NOT_CALIBRATED" | "CALIBRATED";
export type ValidityStatus = "NOT_APPLICABLE" | "REQUIRED_NOT_VALIDATED" | "VALIDATED";

export interface MetricIdentity {
  readonly metricId: string;
  readonly metricVersion: string;
}

export interface MetricBenchmarkBinding {
  readonly benchmark: BenchmarkIdentity;
  readonly constructId: string;
}

export type MetricValue = number | boolean | string;

export interface MetricDomain {
  readonly valueType: "NUMBER" | "BOOLEAN" | "STRING";
  readonly minimum?: number | undefined;
  readonly maximum?: number | undefined;
  readonly minimumInclusive?: boolean | undefined;
  readonly maximumInclusive?: boolean | undefined;
  readonly integerOnly?: boolean | undefined;
  readonly allowedValues?: readonly (boolean | string)[] | undefined;
  readonly finiteOnly: boolean;
  readonly normalized: boolean;
}

export interface MetricScaleContract {
  readonly type: MetricScaleType;
  readonly unit: MetricUnit;
  readonly domain: MetricDomain;
}

export interface MetricDirectionContract {
  readonly direction: MetricDirection;
  readonly targetValue?: number | undefined;
  readonly interpretation: string;
}

export interface MetricMissingnessContract {
  readonly allowedReasons: readonly MetricMissingReason[];
  readonly aggregationBehavior: "EXCLUDE" | "PROPAGATE" | "REJECT";
}

export interface MetricAggregationContract {
  readonly method: MetricAggregationMethod;
  readonly minimumObserved: number;
  readonly weightsRequired: boolean;
}

export interface MetricDenominatorContract {
  readonly applicability: "REQUIRED" | "NOT_APPLICABLE";
  readonly eligiblePopulationRequired: boolean;
  readonly zeroDenominator: "REJECT" | "RETURN_MISSING";
}

export interface MetricUncertaintyContract {
  readonly allowedMethods: readonly MetricUncertaintyMethod[];
  readonly required: boolean;
}

export interface MetricCalibrationContract {
  readonly applicability: ScientificApplicability;
  readonly status: CalibrationStatus;
  readonly evidenceReferences: readonly string[];
  readonly populationOrDomain?: string | undefined;
  readonly methodReference?: string | undefined;
  readonly calibratedAt?: string | undefined;
}

export type ValidityEvidenceCategory =
  | "CONTENT"
  | "CONSTRUCT"
  | "CRITERION_RELATED"
  | "CONVERGENT_DISCRIMINANT"
  | "KNOWN_GROUPS";

export interface MetricValidityEvidence {
  readonly category: ValidityEvidenceCategory;
  readonly reference: string;
}

export interface MetricValidityContract {
  readonly applicability: ScientificApplicability;
  readonly status: ValidityStatus;
  readonly evidence: readonly MetricValidityEvidence[];
}

export interface MetricReliabilityExtension {
  readonly applicability: "APPLICABLE" | "NOT_APPLICABLE";
  readonly evidenceReferences: readonly string[];
}

export interface MetricEvaluatorDependency {
  readonly evaluatorId: string;
  readonly evaluatorVersion?: string | undefined;
  readonly mechanism: "DETERMINISTIC" | "RULE_BASED" | "STATISTICAL" | "HUMAN" | "HYBRID";
  readonly implementationReference: string;
}

export interface MetricProvenance {
  readonly origin: string;
  readonly sourceReferences: readonly string[];
  readonly introducedIn: "S03";
}

export interface CanonicalMetricDefinition {
  readonly identity: MetricIdentity;
  readonly versionScope: "METRIC";
  readonly displayName: string;
  readonly description: string;
  readonly scope: "BENCHMARK_BOUND" | "BENCHMARK_INDEPENDENT";
  readonly benchmarkBinding?: MetricBenchmarkBinding | undefined;
  readonly measurementKind: MeasurementKind;
  readonly scale: MetricScaleContract;
  readonly direction: MetricDirectionContract;
  readonly missingness: MetricMissingnessContract;
  readonly aggregation: MetricAggregationContract;
  readonly denominator: MetricDenominatorContract;
  readonly uncertainty: MetricUncertaintyContract;
  readonly calibration: MetricCalibrationContract;
  readonly validity: MetricValidityContract;
  readonly reliability: MetricReliabilityExtension;
  readonly evaluator: MetricEvaluatorDependency;
  readonly evidenceReferences: readonly string[];
  readonly provenance: MetricProvenance;
  readonly limitations: readonly string[];
}

export interface CanonicalMetricRegistrySnapshot {
  readonly metricRegistrySchemaVersion: string;
  readonly definitions: readonly CanonicalMetricDefinition[];
}

export interface MetricObservation {
  readonly observationId: string;
  readonly metricIdentity: MetricIdentity;
  readonly benchmarkBinding?: MetricBenchmarkBinding | undefined;
  readonly outcome:
    | { readonly kind: "VALUE"; readonly value: MetricValue }
    | { readonly kind: "MISSING"; readonly reason: MetricMissingReason; readonly detail?: string };
  readonly weight?: number | undefined;
  readonly provenanceReference: string;
}

export type MetricUncertainty =
  | { readonly method: "NONE" }
  | {
      readonly method: "STANDARD_ERROR";
      readonly standardError: number;
      readonly sampleSize: number;
      readonly assumptionsReference: string;
    }
  | {
      readonly method: "CONFIDENCE_INTERVAL";
      readonly level: number;
      readonly lower: number;
      readonly upper: number;
      readonly sampleSize: number;
      readonly assumptionsReference: string;
    }
  | {
      readonly method: "BOOTSTRAP_INTERVAL";
      readonly level: number;
      readonly lower: number;
      readonly upper: number;
      readonly sampleSize: number;
      readonly replicates: number;
      readonly seed: number;
      readonly assumptionsReference: string;
    }
  | {
      readonly method: "EMPIRICAL_DISTRIBUTION";
      readonly sampleSize: number;
      readonly distributionReference: string;
    };

export interface MetricDenominatorEvidence {
  readonly numerator: number;
  readonly denominator: number;
  readonly eligiblePopulation: string;
}

export interface MetricComputationReference {
  readonly computationId: string;
  readonly evaluatorId: string;
  readonly evaluatorVersion?: string | undefined;
  readonly inputReferences: readonly string[];
  readonly parameters: Readonly<Record<string, unknown>>;
}

export interface MetricResult {
  readonly resultId: string;
  readonly metricIdentity: MetricIdentity;
  readonly benchmarkBinding?: MetricBenchmarkBinding | undefined;
  readonly outcome:
    | { readonly kind: "VALUE"; readonly value: MetricValue }
    | { readonly kind: "MISSING"; readonly reason: MetricMissingReason; readonly detail?: string };
  readonly aggregation: {
    readonly method: MetricAggregationMethod;
    readonly observedCount: number;
    readonly missingCount: number;
  };
  readonly denominator?: MetricDenominatorEvidence | undefined;
  readonly uncertainty: MetricUncertainty;
  readonly computation: MetricComputationReference;
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
}

export interface MetricValidationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface MetricValidationResult {
  readonly valid: boolean;
  readonly violations: readonly MetricValidationViolation[];
}

import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import {
  METRIC_AGGREGATIONS,
  METRIC_DIRECTIONS,
  METRIC_MISSING_REASONS,
  METRIC_SCALE_TYPES,
  METRIC_UNCERTAINTY_METHODS,
  METRIC_UNITS,
  MEASUREMENT_KINDS,
  type CanonicalMetricDefinition,
  type CanonicalMetricRegistrySnapshot,
  type MetricBenchmarkBinding,
  type MetricIdentity,
  type MetricObservation,
  type MetricResult,
  type MetricUncertainty,
  type MetricValidationResult,
  type MetricValidationViolation,
  type MetricValue
} from "./metric-types.js";
import { benchmarkIdentityKey, BenchmarkRegistry } from "./registry.js";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const METRIC_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const numericAggregation = new Set(["SUM", "MEAN", "MEDIAN", "MIN", "MAX", "WEIGHTED_MEAN"]);
const categoricalScales = new Set(["BOOLEAN", "CATEGORICAL", "ORDINAL"]);

export function metricIdentityKey(identity: MetricIdentity): string {
  return `${identity.metricId}@${identity.metricVersion}`;
}

function sameBinding(
  left: MetricBenchmarkBinding | undefined,
  right: MetricBenchmarkBinding | undefined
): boolean {
  if (!left || !right) return left === right;
  return (
    benchmarkIdentityKey(left.benchmark) === benchmarkIdentityKey(right.benchmark) &&
    left.constructId === right.constructId
  );
}

function push(
  violations: MetricValidationViolation[],
  code: string,
  path: string,
  message: string
): void {
  violations.push({ code, path, message });
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

function validateScale(
  definition: CanonicalMetricDefinition,
  path: string,
  violations: MetricValidationViolation[]
): void {
  const { scale } = definition;
  if (!METRIC_SCALE_TYPES.includes(scale.type)) {
    push(violations, "INVALID_SCALE", `${path}.scale.type`, `Unknown scale '${scale.type}'.`);
  }
  if (!METRIC_UNITS.includes(scale.unit)) {
    push(violations, "INVALID_UNIT", `${path}.scale.unit`, `Unknown unit '${scale.unit}'.`);
  }
  if (scale.domain.minimum !== undefined && !Number.isFinite(scale.domain.minimum)) {
    push(violations, "INVALID_DOMAIN", `${path}.scale.domain.minimum`, "Minimum must be finite.");
  }
  if (scale.domain.maximum !== undefined && !Number.isFinite(scale.domain.maximum)) {
    push(violations, "INVALID_DOMAIN", `${path}.scale.domain.maximum`, "Maximum must be finite.");
  }
  if (
    scale.domain.minimum !== undefined &&
    scale.domain.maximum !== undefined &&
    scale.domain.minimum > scale.domain.maximum
  ) {
    push(violations, "INVALID_DOMAIN", `${path}.scale.domain`, "Minimum cannot exceed maximum.");
  }
  if (
    scale.type === "BOOLEAN" &&
    (scale.domain.valueType !== "BOOLEAN" || scale.unit !== "DIMENSIONLESS")
  ) {
    push(
      violations,
      "INVALID_SCALE_UNIT",
      `${path}.scale`,
      "BOOLEAN requires a BOOLEAN domain and DIMENSIONLESS unit."
    );
  }
  if (scale.type === "COUNT") {
    if (scale.domain.valueType !== "NUMBER" || scale.domain.integerOnly !== true) {
      push(
        violations,
        "INVALID_COUNT_SCALE",
        `${path}.scale`,
        "COUNT requires a numeric integer-only domain."
      );
    }
    if (!(["COUNT", "BYTES", "TOKENS"] as const).includes(scale.unit as "COUNT")) {
      push(
        violations,
        "INVALID_SCALE_UNIT",
        `${path}.scale.unit`,
        "COUNT is compatible only with COUNT, BYTES, or TOKENS."
      );
    }
  }
  if (scale.type === "PROBABILITY") {
    if (
      scale.domain.valueType !== "NUMBER" ||
      scale.domain.minimum !== 0 ||
      scale.domain.maximum !== 1 ||
      scale.domain.minimumInclusive !== true ||
      scale.domain.maximumInclusive !== true ||
      !(scale.unit === "PROPORTION" || scale.unit === "DIMENSIONLESS")
    ) {
      push(
        violations,
        "INVALID_PROBABILITY_SCALE",
        `${path}.scale`,
        "PROBABILITY requires an inclusive numeric [0, 1] domain and proportion-compatible unit."
      );
    }
  }
  if (
    (scale.type === "CATEGORICAL" || scale.type === "ORDINAL") &&
    (!scale.domain.allowedValues || scale.domain.allowedValues.length === 0)
  ) {
    push(
      violations,
      "MISSING_ALLOWED_VALUES",
      `${path}.scale.domain.allowedValues`,
      `${scale.type} requires explicit allowed values.`
    );
  }
}

function validateScientificClaims(
  definition: CanonicalMetricDefinition,
  path: string,
  violations: MetricValidationViolation[]
): void {
  const calibration = definition.calibration;
  if (calibration.applicability === "NOT_APPLICABLE" && calibration.status !== "NOT_APPLICABLE") {
    push(
      violations,
      "INVALID_CALIBRATION_APPLICABILITY",
      `${path}.calibration`,
      "Non-applicable calibration must use NOT_APPLICABLE status."
    );
  }
  if (calibration.applicability === "REQUIRED" && calibration.status === "NOT_APPLICABLE") {
    push(
      violations,
      "INVALID_CALIBRATION_APPLICABILITY",
      `${path}.calibration`,
      "Required calibration must state whether it remains outstanding or is calibrated."
    );
  }
  if (calibration.status === "CALIBRATED" && calibration.evidenceReferences.length === 0) {
    push(
      violations,
      "MISSING_CALIBRATION_EVIDENCE",
      `${path}.calibration.evidenceReferences`,
      "CALIBRATED requires explicit evidence."
    );
  }

  const validity = definition.validity;
  if (validity.applicability === "NOT_APPLICABLE" && validity.status !== "NOT_APPLICABLE") {
    push(
      violations,
      "INVALID_VALIDITY_APPLICABILITY",
      `${path}.validity`,
      "Non-applicable validity must use NOT_APPLICABLE status."
    );
  }
  if (validity.applicability === "REQUIRED" && validity.status === "NOT_APPLICABLE") {
    push(
      violations,
      "INVALID_VALIDITY_APPLICABILITY",
      `${path}.validity`,
      "Required validity must state whether it remains outstanding or is validated."
    );
  }
  if (validity.status === "VALIDATED" && validity.evidence.length === 0) {
    push(
      violations,
      "MISSING_VALIDITY_EVIDENCE",
      `${path}.validity.evidence`,
      "VALIDATED requires explicit categorized evidence."
    );
  }
}

function validateDefinition(
  definition: CanonicalMetricDefinition,
  index: number,
  benchmarkRegistry: BenchmarkRegistry,
  violations: MetricValidationViolation[]
): void {
  const path = `definitions[${index}]`;
  if (!METRIC_ID_PATTERN.test(definition.identity.metricId)) {
    push(
      violations,
      "INVALID_METRIC_ID",
      `${path}.identity.metricId`,
      "Metric ID must be canonical snake_case."
    );
  }
  if (!SEMVER_PATTERN.test(definition.identity.metricVersion)) {
    push(
      violations,
      "INVALID_METRIC_VERSION",
      `${path}.identity.metricVersion`,
      `Invalid metric version '${definition.identity.metricVersion}'.`
    );
  }
  if (definition.versionScope !== "METRIC") {
    push(
      violations,
      "AMBIGUOUS_VERSION_SCOPE",
      `${path}.versionScope`,
      "Metric versions must use the METRIC version scope."
    );
  }
  if (!definition.displayName.trim() || !definition.description.trim()) {
    push(violations, "MISSING_DEFINITION_TEXT", path, "Display name and description are required.");
  }
  if (!MEASUREMENT_KINDS.includes(definition.measurementKind)) {
    push(
      violations,
      "INVALID_MEASUREMENT_KIND",
      `${path}.measurementKind`,
      `Unknown measurement kind '${definition.measurementKind}'.`
    );
  }
  if (definition.scope === "BENCHMARK_BOUND") {
    if (!definition.benchmarkBinding) {
      push(
        violations,
        "MISSING_BENCHMARK_BINDING",
        `${path}.benchmarkBinding`,
        "BENCHMARK_BOUND metrics require a canonical benchmark and construct binding."
      );
    } else {
      const benchmark = benchmarkRegistry.get(definition.benchmarkBinding.benchmark);
      if (!benchmark) {
        push(
          violations,
          "UNKNOWN_BENCHMARK_BINDING",
          `${path}.benchmarkBinding.benchmark`,
          `Unknown benchmark '${benchmarkIdentityKey(definition.benchmarkBinding.benchmark)}'.`
        );
      } else if (!benchmark.constructIds.includes(definition.benchmarkBinding.constructId)) {
        push(
          violations,
          "UNKNOWN_CONSTRUCT_BINDING",
          `${path}.benchmarkBinding.constructId`,
          `Construct '${definition.benchmarkBinding.constructId}' is not declared by the bound benchmark.`
        );
      }
    }
  } else if (definition.scope === "BENCHMARK_INDEPENDENT") {
    if (definition.benchmarkBinding) {
      push(
        violations,
        "UNEXPECTED_BENCHMARK_BINDING",
        `${path}.benchmarkBinding`,
        "BENCHMARK_INDEPENDENT metrics cannot carry an implicit benchmark binding."
      );
    }
  } else {
    push(violations, "INVALID_METRIC_SCOPE", `${path}.scope`, "Unknown metric scope.");
  }

  validateScale(definition, path, violations);
  if (!METRIC_DIRECTIONS.includes(definition.direction.direction)) {
    push(violations, "INVALID_DIRECTION", `${path}.direction`, "Unknown metric direction.");
  }
  if (
    definition.direction.direction === "TARGET_VALUE" &&
    (definition.direction.targetValue === undefined ||
      !Number.isFinite(definition.direction.targetValue))
  ) {
    push(
      violations,
      "MISSING_TARGET_VALUE",
      `${path}.direction.targetValue`,
      "TARGET_VALUE requires a finite target."
    );
  }
  if (
    definition.direction.direction !== "TARGET_VALUE" &&
    definition.direction.targetValue !== undefined
  ) {
    push(
      violations,
      "UNEXPECTED_TARGET_VALUE",
      `${path}.direction.targetValue`,
      "Only TARGET_VALUE may define a target."
    );
  }
  if (
    definition.missingness.allowedReasons.length === 0 ||
    hasDuplicates(definition.missingness.allowedReasons)
  ) {
    push(
      violations,
      "INVALID_MISSINGNESS_POLICY",
      `${path}.missingness.allowedReasons`,
      "Missingness reasons must be explicit and unique."
    );
  }
  for (const reason of definition.missingness.allowedReasons) {
    if (!METRIC_MISSING_REASONS.includes(reason)) {
      push(
        violations,
        "INVALID_MISSING_REASON",
        `${path}.missingness.allowedReasons`,
        `Unknown missing reason '${reason}'.`
      );
    }
  }
  if (!METRIC_AGGREGATIONS.includes(definition.aggregation.method)) {
    push(
      violations,
      "INVALID_AGGREGATION",
      `${path}.aggregation.method`,
      "Unknown aggregation method."
    );
  }
  if (
    !Number.isInteger(definition.aggregation.minimumObserved) ||
    definition.aggregation.minimumObserved < 1
  ) {
    push(
      violations,
      "INVALID_MINIMUM_SAMPLE",
      `${path}.aggregation.minimumObserved`,
      "minimumObserved must be a positive integer."
    );
  }
  if (
    categoricalScales.has(definition.scale.type) &&
    numericAggregation.has(definition.aggregation.method)
  ) {
    push(
      violations,
      "INCOMPATIBLE_AGGREGATION",
      `${path}.aggregation.method`,
      `${definition.aggregation.method} is not defined for ${definition.scale.type}.`
    );
  }
  if (
    (definition.aggregation.method === "WEIGHTED_MEAN") !==
    definition.aggregation.weightsRequired
  ) {
    push(
      violations,
      "INVALID_WEIGHT_POLICY",
      `${path}.aggregation.weightsRequired`,
      "weightsRequired must be true exactly for WEIGHTED_MEAN."
    );
  }
  if (
    definition.scale.type === "PROBABILITY" &&
    definition.scale.unit === "PROPORTION" &&
    definition.denominator.applicability !== "REQUIRED"
  ) {
    push(
      violations,
      "MISSING_DENOMINATOR_CONTRACT",
      `${path}.denominator`,
      "A proportion requires explicit numerator, denominator, and eligible-population semantics."
    );
  }
  if (
    definition.denominator.applicability === "NOT_APPLICABLE" &&
    definition.denominator.eligiblePopulationRequired
  ) {
    push(
      violations,
      "INVALID_DENOMINATOR_CONTRACT",
      `${path}.denominator`,
      "A non-applicable denominator cannot require an eligible population."
    );
  }
  if (
    definition.uncertainty.allowedMethods.length === 0 ||
    hasDuplicates(definition.uncertainty.allowedMethods)
  ) {
    push(
      violations,
      "INVALID_UNCERTAINTY_CONTRACT",
      `${path}.uncertainty.allowedMethods`,
      "Uncertainty methods must be explicit and unique."
    );
  }
  for (const method of definition.uncertainty.allowedMethods) {
    if (!METRIC_UNCERTAINTY_METHODS.includes(method)) {
      push(
        violations,
        "INVALID_UNCERTAINTY_METHOD",
        `${path}.uncertainty.allowedMethods`,
        `Unknown uncertainty method '${method}'.`
      );
    }
  }
  if (definition.uncertainty.required && definition.uncertainty.allowedMethods.includes("NONE")) {
    push(
      violations,
      "UNCERTAINTY_REQUIRED_BUT_NONE_ALLOWED",
      `${path}.uncertainty`,
      "Required uncertainty cannot allow NONE."
    );
  }
  validateScientificClaims(definition, path, violations);
  if (
    !definition.evaluator.evaluatorId.trim() ||
    !definition.evaluator.implementationReference.trim()
  ) {
    push(
      violations,
      "INVALID_EVALUATOR_DEPENDENCY",
      `${path}.evaluator`,
      "Evaluator ID and implementation reference are required."
    );
  }
}

export function validateMetricRegistry(
  snapshot: CanonicalMetricRegistrySnapshot,
  benchmarkRegistry: BenchmarkRegistry
): MetricValidationResult {
  const violations: MetricValidationViolation[] = [];
  if (!SEMVER_PATTERN.test(snapshot.metricRegistrySchemaVersion)) {
    push(
      violations,
      "INVALID_METRIC_REGISTRY_SCHEMA_VERSION",
      "metricRegistrySchemaVersion",
      "Metric registry schema version must be SemVer."
    );
  }
  const keys = snapshot.definitions.map((definition) => metricIdentityKey(definition.identity));
  if (hasDuplicates(keys)) {
    push(
      violations,
      "DUPLICATE_METRIC_IDENTITY",
      "definitions",
      "Metric ID and metric version pairs must be unique."
    );
  }
  snapshot.definitions.forEach((definition, index) =>
    validateDefinition(definition, index, benchmarkRegistry, violations)
  );
  return { valid: violations.length === 0, violations };
}

function validateValue(
  value: MetricValue,
  definition: CanonicalMetricDefinition,
  path: string,
  violations: MetricValidationViolation[]
): void {
  const { domain } = definition.scale;
  if (
    (domain.valueType === "NUMBER" && typeof value !== "number") ||
    (domain.valueType === "BOOLEAN" && typeof value !== "boolean") ||
    (domain.valueType === "STRING" && typeof value !== "string")
  ) {
    push(violations, "INVALID_VALUE_TYPE", path, `Expected ${domain.valueType} value.`);
    return;
  }
  if (typeof value === "number") {
    if (domain.finiteOnly && !Number.isFinite(value)) {
      push(violations, "NON_FINITE_VALUE", path, "NaN and infinite values are not permitted.");
      return;
    }
    if (domain.integerOnly && !Number.isInteger(value)) {
      push(violations, "INVALID_COUNT", path, "This metric requires an integer value.");
    }
    if (
      domain.minimum !== undefined &&
      (value < domain.minimum || (value === domain.minimum && domain.minimumInclusive === false))
    ) {
      push(
        violations,
        "VALUE_BELOW_DOMAIN",
        path,
        `Value is below the declared minimum ${domain.minimum}.`
      );
    }
    if (
      domain.maximum !== undefined &&
      (value > domain.maximum || (value === domain.maximum && domain.maximumInclusive === false))
    ) {
      push(
        violations,
        "VALUE_ABOVE_DOMAIN",
        path,
        `Value exceeds the declared maximum ${domain.maximum}.`
      );
    }
  }
  if (domain.allowedValues && !domain.allowedValues.includes(value as boolean & string)) {
    push(
      violations,
      "VALUE_NOT_ALLOWED",
      path,
      "Value is outside the declared categorical domain."
    );
  }
}

function validateUncertainty(
  uncertainty: MetricUncertainty,
  definition: CanonicalMetricDefinition,
  violations: MetricValidationViolation[]
): void {
  const path = "uncertainty";
  if (!definition.uncertainty.allowedMethods.includes(uncertainty.method)) {
    push(
      violations,
      "UNSUPPORTED_UNCERTAINTY",
      path,
      `Method '${uncertainty.method}' is not allowed for this metric.`
    );
    return;
  }
  if (definition.uncertainty.required && uncertainty.method === "NONE") {
    push(violations, "MISSING_UNCERTAINTY", path, "This metric requires computed uncertainty.");
  }
  if (uncertainty.method === "NONE") return;
  if (!Number.isInteger(uncertainty.sampleSize) || uncertainty.sampleSize < 1) {
    push(
      violations,
      "INVALID_UNCERTAINTY_SAMPLE",
      `${path}.sampleSize`,
      "Sample size must be positive."
    );
  }
  if (uncertainty.method === "STANDARD_ERROR") {
    if (!Number.isFinite(uncertainty.standardError) || uncertainty.standardError < 0) {
      push(
        violations,
        "INVALID_STANDARD_ERROR",
        `${path}.standardError`,
        "Standard error must be finite and non-negative."
      );
    }
    if (!uncertainty.assumptionsReference.trim()) {
      push(
        violations,
        "MISSING_UNCERTAINTY_REFERENCE",
        `${path}.assumptionsReference`,
        "Uncertainty assumptions must be referenced."
      );
    }
    return;
  }
  if (uncertainty.method === "EMPIRICAL_DISTRIBUTION") {
    if (!uncertainty.distributionReference.trim()) {
      push(
        violations,
        "MISSING_DISTRIBUTION_REFERENCE",
        `${path}.distributionReference`,
        "The empirical distribution must be addressable."
      );
    }
    return;
  }
  if (
    !Number.isFinite(uncertainty.lower) ||
    !Number.isFinite(uncertainty.upper) ||
    uncertainty.lower > uncertainty.upper
  ) {
    push(
      violations,
      "INVALID_UNCERTAINTY_INTERVAL",
      path,
      "Interval bounds must be finite and lower cannot exceed upper."
    );
  }
  if (!Number.isFinite(uncertainty.level) || uncertainty.level <= 0 || uncertainty.level >= 1) {
    push(
      violations,
      "INVALID_CONFIDENCE_LEVEL",
      `${path}.level`,
      "Interval level must be between 0 and 1."
    );
  }
  if (!uncertainty.assumptionsReference.trim()) {
    push(
      violations,
      "MISSING_UNCERTAINTY_REFERENCE",
      `${path}.assumptionsReference`,
      "Interval assumptions must be referenced."
    );
  }
  if (uncertainty.method === "BOOTSTRAP_INTERVAL") {
    if (!Number.isInteger(uncertainty.replicates) || uncertainty.replicates < 1) {
      push(
        violations,
        "INVALID_BOOTSTRAP_REPLICATES",
        `${path}.replicates`,
        "Bootstrap replicates must be positive."
      );
    }
    if (!Number.isInteger(uncertainty.seed)) {
      push(
        violations,
        "INVALID_BOOTSTRAP_SEED",
        `${path}.seed`,
        "Bootstrap seed must be an integer."
      );
    }
  }
}

export function validateMetricResult(
  result: MetricResult,
  registry: MetricRegistry
): MetricValidationResult {
  const violations: MetricValidationViolation[] = [];
  const rawResult = result as unknown as Record<string, unknown>;
  if ("confidence" in rawResult || "certainty" in rawResult) {
    push(
      violations,
      "LEGACY_CONFIDENCE_IS_NOT_UNCERTAINTY",
      "uncertainty",
      "Legacy confidence or certainty fields cannot substitute for a declared uncertainty method."
    );
  }
  const definition = registry.get(result.metricIdentity);
  if (!definition) {
    push(
      violations,
      "UNKNOWN_METRIC_IDENTITY",
      "metricIdentity",
      `Unknown metric '${metricIdentityKey(result.metricIdentity)}'.`
    );
    return { valid: false, violations };
  }
  if (!sameBinding(definition.benchmarkBinding, result.benchmarkBinding)) {
    push(
      violations,
      "RESULT_BINDING_MISMATCH",
      "benchmarkBinding",
      "Result binding must match the canonical metric definition."
    );
  }
  const rawOutcome = result.outcome as unknown as Record<string, unknown>;
  if (result.outcome.kind === "VALUE") {
    if ("reason" in rawOutcome) {
      push(
        violations,
        "VALUE_MISSINGNESS_CONFLICT",
        "outcome",
        "A numeric/value result cannot also claim missingness."
      );
    }
    validateValue(result.outcome.value, definition, "outcome.value", violations);
  } else if (result.outcome.kind === "MISSING") {
    if ("value" in rawOutcome) {
      push(
        violations,
        "VALUE_MISSINGNESS_CONFLICT",
        "outcome",
        "A missing result cannot also carry a value."
      );
    }
    if (!definition.missingness.allowedReasons.includes(result.outcome.reason)) {
      push(
        violations,
        "DISALLOWED_MISSING_REASON",
        "outcome.reason",
        "Missing reason is not permitted by this definition."
      );
    }
  } else {
    push(violations, "INVALID_OUTCOME", "outcome", "Outcome must be VALUE or MISSING.");
  }

  if (result.aggregation.method !== definition.aggregation.method) {
    push(
      violations,
      "AGGREGATION_MISMATCH",
      "aggregation.method",
      "Result aggregation must match the definition."
    );
  }
  if (
    !Number.isInteger(result.aggregation.observedCount) ||
    result.aggregation.observedCount < 0 ||
    !Number.isInteger(result.aggregation.missingCount) ||
    result.aggregation.missingCount < 0
  ) {
    push(
      violations,
      "INVALID_AGGREGATION_COUNTS",
      "aggregation",
      "Observed and missing counts must be non-negative integers."
    );
  }
  if (
    result.outcome.kind === "VALUE" &&
    result.aggregation.observedCount < definition.aggregation.minimumObserved
  ) {
    push(
      violations,
      "INSUFFICIENT_OBSERVATIONS",
      "aggregation.observedCount",
      "Observed count is below the definition minimum."
    );
  }
  if (
    result.outcome.kind === "VALUE" &&
    result.aggregation.missingCount > 0 &&
    definition.missingness.aggregationBehavior !== "EXCLUDE"
  ) {
    push(
      violations,
      "MISSINGNESS_POLICY_VIOLATION",
      "aggregation.missingCount",
      "The definition does not permit a value when observations are missing."
    );
  }

  if (definition.denominator.applicability === "REQUIRED") {
    const denominator = result.denominator;
    if (!denominator) {
      push(
        violations,
        "MISSING_DENOMINATOR",
        "denominator",
        "This metric requires denominator evidence."
      );
    } else {
      if (!Number.isFinite(denominator.numerator) || denominator.numerator < 0) {
        push(
          violations,
          "INVALID_NUMERATOR",
          "denominator.numerator",
          "Numerator must be finite and non-negative."
        );
      }
      if (
        !Number.isFinite(denominator.denominator) ||
        denominator.denominator < 0 ||
        (denominator.denominator === 0 &&
          (definition.denominator.zeroDenominator === "REJECT" ||
            result.outcome.kind !== "MISSING"))
      ) {
        push(
          violations,
          "INVALID_DENOMINATOR",
          "denominator.denominator",
          "Denominator must be positive unless the definition explicitly maps zero to a missing result."
        );
      }
      if (denominator.numerator > denominator.denominator) {
        push(
          violations,
          "NUMERATOR_EXCEEDS_DENOMINATOR",
          "denominator",
          "Numerator cannot exceed denominator."
        );
      }
      if (
        definition.denominator.eligiblePopulationRequired &&
        !denominator.eligiblePopulation.trim()
      ) {
        push(
          violations,
          "MISSING_ELIGIBLE_POPULATION",
          "denominator.eligiblePopulation",
          "Eligible population must be identified."
        );
      }
      if (
        result.outcome.kind === "VALUE" &&
        typeof result.outcome.value === "number" &&
        denominator.denominator > 0 &&
        Math.abs(result.outcome.value - denominator.numerator / denominator.denominator) > 1e-12
      ) {
        push(
          violations,
          "DENOMINATOR_VALUE_MISMATCH",
          "denominator",
          "Value must equal numerator divided by denominator."
        );
      }
    }
  } else if (result.denominator) {
    push(
      violations,
      "UNEXPECTED_DENOMINATOR",
      "denominator",
      "This metric does not use denominator evidence."
    );
  }

  validateUncertainty(result.uncertainty, definition, violations);
  if (result.computation.evaluatorId !== definition.evaluator.evaluatorId) {
    push(
      violations,
      "EVALUATOR_MISMATCH",
      "computation.evaluatorId",
      "Result evaluator must match the definition."
    );
  }
  if (!result.resultId.trim() || !result.computation.computationId.trim()) {
    push(
      violations,
      "MISSING_RESULT_IDENTITY",
      "resultId",
      "Result and computation IDs are required."
    );
  }
  if (!result.provenanceReference.trim()) {
    push(
      violations,
      "MISSING_RESULT_PROVENANCE",
      "provenanceReference",
      "Result provenance must be addressable."
    );
  }
  return { valid: violations.length === 0, violations };
}

export interface MetricAggregationContext {
  readonly resultId: string;
  readonly denominator?: MetricResult["denominator"] | undefined;
  readonly uncertainty: MetricUncertainty;
  readonly computation: MetricResult["computation"];
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[midpoint - 1]! + sorted[midpoint]!) / 2
    : sorted[midpoint]!;
}

function aggregateValues(
  definition: CanonicalMetricDefinition,
  observations: readonly MetricObservation[]
): MetricValue {
  const values = observations.map((observation) =>
    observation.outcome.kind === "VALUE" ? observation.outcome.value : 0
  );
  const method = definition.aggregation.method;
  if (method === "NONE") {
    if (values.length !== 1)
      throw new Error("NONE aggregation requires exactly one observed value.");
    return values[0]!;
  }
  if (method === "COUNT") return values.length;
  if (!values.every((value) => typeof value === "number")) {
    throw new Error(`${method} requires numeric observations.`);
  }
  const numbers = values as number[];
  if (method === "SUM") return numbers.reduce((sum, value) => sum + value, 0);
  if (method === "MEAN") return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  if (method === "MEDIAN") return median(numbers);
  if (method === "MIN") return Math.min(...numbers);
  if (method === "MAX") return Math.max(...numbers);
  const weights = observations.map((observation) => observation.weight);
  if (weights.some((weight) => weight === undefined || !Number.isFinite(weight) || weight <= 0)) {
    throw new Error("WEIGHTED_MEAN requires a positive finite weight for every observation.");
  }
  const numericWeights = weights as number[];
  const totalWeight = numericWeights.reduce((sum, weight) => sum + weight, 0);
  return (
    numbers.reduce((sum, value, index) => sum + value * numericWeights[index]!, 0) / totalWeight
  );
}

export class MetricRegistryValidationError extends Error {
  constructor(readonly violations: readonly MetricValidationViolation[]) {
    super(violations.map((violation) => `${violation.code}: ${violation.message}`).join("\n"));
    this.name = "MetricRegistryValidationError";
  }
}

export class MetricResultValidationError extends Error {
  constructor(readonly violations: readonly MetricValidationViolation[]) {
    super(violations.map((violation) => `${violation.code}: ${violation.message}`).join("\n"));
    this.name = "MetricResultValidationError";
  }
}

export class MetricRegistry {
  private readonly entries: ReadonlyMap<string, CanonicalMetricDefinition>;

  constructor(
    readonly snapshot: CanonicalMetricRegistrySnapshot,
    readonly benchmarkRegistry: BenchmarkRegistry
  ) {
    const validation = validateMetricRegistry(snapshot, benchmarkRegistry);
    if (!validation.valid) throw new MetricRegistryValidationError(validation.violations);
    this.entries = new Map(
      snapshot.definitions.map((definition) => [metricIdentityKey(definition.identity), definition])
    );
  }

  get(identity: MetricIdentity): CanonicalMetricDefinition | undefined {
    return this.entries.get(metricIdentityKey(identity));
  }

  list(): readonly CanonicalMetricDefinition[] {
    return [...this.entries.values()].sort((left, right) =>
      metricIdentityKey(left.identity).localeCompare(metricIdentityKey(right.identity))
    );
  }

  validateResult(result: MetricResult): MetricValidationResult {
    return validateMetricResult(result, this);
  }

  aggregate(
    identity: MetricIdentity,
    observations: readonly MetricObservation[],
    context: MetricAggregationContext
  ): MetricResult {
    const definition = this.get(identity);
    if (!definition) throw new Error(`Unknown metric identity '${metricIdentityKey(identity)}'.`);
    for (const observation of observations) {
      if (metricIdentityKey(observation.metricIdentity) !== metricIdentityKey(identity)) {
        throw new Error("Observation metric identity does not match the requested metric.");
      }
      if (!sameBinding(observation.benchmarkBinding, definition.benchmarkBinding)) {
        throw new Error("Observation benchmark binding does not match the metric definition.");
      }
      if (observation.outcome.kind === "VALUE") {
        const valueValidation: MetricValidationViolation[] = [];
        validateValue(
          observation.outcome.value,
          definition,
          "observation.outcome.value",
          valueValidation
        );
        if (valueValidation.length > 0) throw new MetricResultValidationError(valueValidation);
      } else if (!definition.missingness.allowedReasons.includes(observation.outcome.reason)) {
        throw new Error(`Missing reason '${observation.outcome.reason}' is not allowed.`);
      }
    }

    const observed = observations.filter(
      (
        observation
      ): observation is MetricObservation & { outcome: { kind: "VALUE"; value: MetricValue } } =>
        observation.outcome.kind === "VALUE"
    );
    const missing = observations.filter((observation) => observation.outcome.kind === "MISSING");
    if (missing.length > 0 && definition.missingness.aggregationBehavior === "REJECT") {
      throw new Error("Metric missingness policy rejects missing observations.");
    }

    let outcome: MetricResult["outcome"];
    if (missing.length > 0 && definition.missingness.aggregationBehavior === "PROPAGATE") {
      const firstMissing = missing[0]!.outcome;
      outcome =
        firstMissing.kind === "MISSING"
          ? {
              kind: "MISSING",
              reason: firstMissing.reason,
              ...(firstMissing.detail ? { detail: firstMissing.detail } : {})
            }
          : { kind: "MISSING", reason: "INSUFFICIENT_EVIDENCE" };
    } else if (observed.length < definition.aggregation.minimumObserved) {
      outcome = {
        kind: "MISSING",
        reason: "INSUFFICIENT_EVIDENCE",
        detail: `Requires at least ${definition.aggregation.minimumObserved} observed value(s).`
      };
    } else {
      outcome = { kind: "VALUE", value: aggregateValues(definition, observed) };
    }

    const result: MetricResult = {
      resultId: context.resultId,
      metricIdentity: identity,
      ...(definition.benchmarkBinding ? { benchmarkBinding: definition.benchmarkBinding } : {}),
      outcome,
      aggregation: {
        method: definition.aggregation.method,
        observedCount: observed.length,
        missingCount: missing.length
      },
      ...(context.denominator ? { denominator: context.denominator } : {}),
      uncertainty: context.uncertainty,
      computation: context.computation,
      evidenceReferences: context.evidenceReferences,
      provenanceReference: context.provenanceReference
    };
    const validation = this.validateResult(result);
    if (!validation.valid) throw new MetricResultValidationError(validation.violations);
    return result;
  }

  serialize(): string {
    const definitions = this.list().map((definition) => ({
      ...definition,
      missingness: {
        ...definition.missingness,
        allowedReasons: [...definition.missingness.allowedReasons].sort()
      },
      uncertainty: {
        ...definition.uncertainty,
        allowedMethods: [...definition.uncertainty.allowedMethods].sort()
      },
      calibration: {
        ...definition.calibration,
        evidenceReferences: [...definition.calibration.evidenceReferences].sort()
      },
      validity: {
        ...definition.validity,
        evidence: [...definition.validity.evidence].sort((left, right) =>
          `${left.category}:${left.reference}`.localeCompare(`${right.category}:${right.reference}`)
        )
      },
      reliability: {
        ...definition.reliability,
        evidenceReferences: [...definition.reliability.evidenceReferences].sort()
      },
      evidenceReferences: [...definition.evidenceReferences].sort(),
      limitations: [...definition.limitations].sort(),
      provenance: {
        ...definition.provenance,
        sourceReferences: [...definition.provenance.sourceReferences].sort()
      }
    }));
    return canonicalJson({ ...this.snapshot, definitions });
  }

  digest(): string {
    return computeSha256(this.serialize());
  }
}

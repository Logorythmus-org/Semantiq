import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import type { MetricRegistry } from "./metrics.js";
import type { BenchmarkRegistry } from "./registry.js";
import {
  HUMAN_AI_COMPARABILITY_DIMENSIONS,
  HUMAN_AI_DIMENSION_STATUSES,
  type HumanAIComparabilityAssessment,
  type HumanAIComparabilityDecision,
  type HumanAIComparabilityDimension,
  type HumanAIComparisonDefinition,
  type HumanAIComparisonObservation,
  type HumanAIComparisonResult,
  type HumanAIComparisonUnit,
  type HumanAIDimensionAssessment,
  type HumanAIComparisonValidationViolation
} from "./human-ai-comparison-types.js";

const PRIVATE_PATH = /(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/)[^\s]+/;
const SECRET =
  /(?:BEGIN (?:RSA |OPENSSH )?PRIVATE KEY|\bghp_[A-Za-z0-9]{20,}\b|\bAKIA[0-9A-Z]{16}\b)/;
const FORBIDDEN_KEY =
  /^(?:realName|fullName|email|phone|address|ipAddress|governmentId|medicalData|diagnosis|demographics|password|secret|token|credential|apiKey|privateKey)$/i;
const FORBIDDEN_COMPARATIVE_KEY =
  /^(?:rank|ranking|winner|humanLevel|superhuman|humanSuperiority|aiSuperiority|intelligenceGap|semanticMaturityGap)$/i;
const PURPOSES = [
  "ITEM_LEVEL_TASK_SUCCESS",
  "CATEGORICAL_OUTCOME_RELATIONSHIP",
  "ERROR_PATTERN_COMPARISON",
  "BOUNDED_CONSTRUCT_INDICATOR",
  "LATENCY_UNDER_MATCHED_CONDITIONS",
  "NUMERIC_DESCRIPTIVE_DIFFERENCE"
] as const;
const LEVELS = [
  "INDIVIDUAL_HUMAN_TO_INDIVIDUAL_AI",
  "HUMAN_SAMPLE_TO_AI_SAMPLE",
  "AGGREGATE_HUMAN_TO_AGGREGATE_AI"
] as const;
const PAIRINGS = ["PAIRED_BY_ITEM", "PAIRED_BY_CONDITION", "UNPAIRED"] as const;

const PROHIBITED_CLAIMS = [
  "HUMAN_SUPERIORITY",
  "AI_SUPERIORITY",
  "HUMAN_LEVEL",
  "SUPERHUMAN",
  "INTELLIGENCE_GAP",
  "SEMANTIC_MATURITY_GAP",
  "SCIENTIFIC_EQUIVALENCE",
  "UNIVERSAL_HUMAN_BASELINE"
] as const;

function add(
  violations: HumanAIComparisonValidationViolation[],
  code: string,
  path: string,
  message: string
): void {
  violations.push({ code, path, message });
}

function scan(
  value: unknown,
  path: string,
  violations: HumanAIComparisonValidationViolation[]
): void {
  if (typeof value === "string") {
    if (PRIVATE_PATH.test(value))
      add(
        violations,
        "PRIVATE_PATH_FORBIDDEN",
        path,
        "Stable comparison records cannot contain private local paths."
      );
    if (SECRET.test(value))
      add(
        violations,
        "CREDENTIAL_FORBIDDEN",
        path,
        "Stable comparison records cannot contain credentials or private keys."
      );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scan(entry, `${path}[${index}]`, violations));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (FORBIDDEN_KEY.test(key))
        add(
          violations,
          "PII_FIELD_FORBIDDEN",
          `${path}.${key}`,
          "S-08 provenance cannot contain direct or sensitive identity fields."
        );
      if (FORBIDDEN_COMPARATIVE_KEY.test(key))
        add(
          violations,
          "PROHIBITED_COMPARATIVE_CLAIM",
          `${path}.${key}`,
          "S-08 cannot accept rankings, winners, or Human-level/superhuman claims."
        );
      scan(entry, `${path}.${key}`, violations);
    });
  }
}

function sortedUnique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort() as T[];
}

function definitionMaterial(definition: HumanAIComparisonDefinition) {
  return {
    ...definition,
    criticalDimensions: sortedUnique(definition.criticalDimensions),
    requiredEvidenceReferences: sortedUnique(definition.requiredEvidenceReferences),
    provenanceReferences: sortedUnique(definition.provenanceReferences),
    limitations: sortedUnique(definition.limitations)
  };
}

function unitMaterial(
  unit: HumanAIComparisonUnit | Omit<HumanAIComparisonUnit, "comparisonUnitDigest">
) {
  const material = { ...unit };
  Reflect.deleteProperty(material as { comparisonUnitDigest?: string }, "comparisonUnitDigest");
  return {
    ...material,
    humanEvidence: {
      ...material.humanEvidence
    },
    aiEvidence: {
      ...material.aiEvidence,
      model: {
        ...material.aiEvidence.model,
        toolAccessReferences: sortedUnique(material.aiEvidence.model.toolAccessReferences)
      }
    },
    metricResultReferences: sortedUnique(material.metricResultReferences),
    evaluatorExecutionReferences: sortedUnique(material.evaluatorExecutionReferences),
    reliabilityEvidenceReferences: sortedUnique(material.reliabilityEvidenceReferences),
    validityEvidenceReferences: sortedUnique(material.validityEvidenceReferences),
    provenanceReferences: sortedUnique(material.provenanceReferences)
  };
}

function assessmentMaterial(assessment: Omit<HumanAIComparabilityAssessment, "assessmentDigest">) {
  return {
    ...assessment,
    dimensions: [...assessment.dimensions]
      .map((entry) => ({
        ...entry,
        evidenceRefs: sortedUnique(entry.evidenceRefs),
        limitations: sortedUnique(entry.limitations)
      }))
      .sort((left, right) => left.dimension.localeCompare(right.dimension)),
    criticalDimensions: sortedUnique(assessment.criticalDimensions),
    blockingDimensions: sortedUnique(assessment.blockingDimensions),
    unknownDimensions: sortedUnique(assessment.unknownDimensions),
    limitations: sortedUnique(assessment.limitations),
    provenanceReferences: sortedUnique(assessment.provenanceReferences)
  };
}

function observationMaterial(observation: HumanAIComparisonObservation) {
  return {
    ...observation,
    provenanceReferences: sortedUnique(observation.provenanceReferences)
  };
}

function sameIdentity(
  left: { metricId: string; metricVersion: string } | undefined,
  right: { metricId: string; metricVersion: string } | undefined
): boolean {
  return (
    left?.metricId === right?.metricId &&
    left?.metricVersion === right?.metricVersion &&
    left !== undefined &&
    right !== undefined
  );
}

function directConditionMismatches(
  unit: HumanAIComparisonUnit
): ReadonlySet<HumanAIComparabilityDimension> {
  const human = unit.humanConditions;
  const ai = unit.aiConditions;
  const mismatches = new Set<HumanAIComparabilityDimension>();
  if (
    human.instructionsDigest !== ai.instructionsDigest ||
    human.stimulusDigest !== ai.stimulusDigest
  )
    mismatches.add("TASK_COMPATIBILITY");
  if (human.presentationDigest !== ai.presentationDigest)
    mismatches.add("PRESENTATION_COMPATIBILITY");
  if (human.responseMode !== ai.responseMode) mismatches.add("RESPONSE_MODE_COMPATIBILITY");
  if (human.toolPolicy !== ai.toolPolicy) mismatches.add("TOOL_ASSISTANCE_COMPATIBILITY");
  if (human.language !== ai.language) mismatches.add("LANGUAGE_COMPATIBILITY");
  if (human.scoringProtocolReference !== ai.scoringProtocolReference)
    mismatches.add("SCORING_COMPATIBILITY");
  if (
    human.evaluatorIdentity?.evaluatorId !== ai.evaluatorIdentity?.evaluatorId ||
    human.evaluatorIdentity?.evaluatorVersion !== ai.evaluatorIdentity?.evaluatorVersion
  )
    mismatches.add("EVALUATOR_COMPATIBILITY");
  if (
    (human.metricIdentity !== undefined || ai.metricIdentity !== undefined) &&
    !sameIdentity(human.metricIdentity, ai.metricIdentity)
  )
    mismatches.add("METRIC_COMPATIBILITY");
  if (human.environmentReference !== ai.environmentReference)
    mismatches.add("ENVIRONMENT_COMPATIBILITY");
  if (human.timePolicy !== ai.timePolicy) mismatches.add("TIME_POLICY_COMPATIBILITY");
  if (
    human.denominatorDefinitionReference !== ai.denominatorDefinitionReference ||
    human.eligiblePopulationReference !== ai.eligiblePopulationReference
  )
    mismatches.add("SAMPLING_COMPATIBILITY");
  return mismatches;
}

function decisionFor(
  definition: HumanAIComparisonDefinition,
  dimensions: readonly HumanAIDimensionAssessment[]
): HumanAIComparabilityDecision {
  if (dimensions.length === 0) return "NOT_ASSESSED";
  const byDimension = new Map(dimensions.map((entry) => [entry.dimension, entry]));
  const critical = definition.criticalDimensions.map((dimension) => byDimension.get(dimension));
  if (critical.some((entry) => entry?.status === "MISMATCHED")) return "NOT_COMPARABLE";
  if (
    critical.some(
      (entry) => !entry || entry.status === "UNKNOWN" || entry.status === "NOT_APPLICABLE"
    )
  )
    return "INSUFFICIENT_EVIDENCE";
  if (critical.some((entry) => entry?.status === "ACCEPTABLE_WITH_LIMITATIONS"))
    return "CONDITIONALLY_COMPARABLE";
  return "COMPARABLE_FOR_DECLARED_PURPOSE";
}

export class HumanAIComparisonValidationError extends Error {
  constructor(readonly violations: readonly HumanAIComparisonValidationViolation[]) {
    super(violations.map((entry) => `${entry.code}: ${entry.message}`).join("\n"));
    this.name = "HumanAIComparisonValidationError";
  }
}

export class HumanAIComparabilityGate {
  constructor(
    readonly benchmarkRegistry: BenchmarkRegistry,
    readonly metricRegistry: MetricRegistry
  ) {}

  validateDefinition(
    definition: HumanAIComparisonDefinition
  ): readonly HumanAIComparisonValidationViolation[] {
    const violations: HumanAIComparisonValidationViolation[] = [];
    if (
      !definition.comparisonDefinitionId ||
      !/^\d+\.\d+\.\d+$/.test(definition.comparisonDefinitionVersion)
    )
      add(
        violations,
        "INVALID_COMPARISON_IDENTITY",
        "definition",
        "Comparison identity and semantic version are required."
      );
    if (definition.relationship !== "HUMAN_AI_COMPARISON")
      add(
        violations,
        "INVALID_RELATIONSHIP",
        "definition.relationship",
        "Human-AI comparison is a relationship, not a subject role."
      );
    if (!(PURPOSES as readonly string[]).includes(definition.purpose))
      add(
        violations,
        "INVALID_COMPARISON_PURPOSE",
        "definition.purpose",
        "Comparison purpose must use the bounded S-08 vocabulary."
      );
    if (!(LEVELS as readonly string[]).includes(definition.level))
      add(
        violations,
        "INVALID_COMPARISON_LEVEL",
        "definition.level",
        "Comparison level must distinguish individual, sample, or aggregate evidence."
      );
    if (!(PAIRINGS as readonly string[]).includes(definition.pairing))
      add(
        violations,
        "INVALID_PAIRING",
        "definition.pairing",
        "Comparison pairing must be item-paired, condition-paired, or unpaired."
      );
    if (definition.criticalDimensions.length === 0)
      add(
        violations,
        "NO_CRITICAL_DIMENSIONS",
        "definition.criticalDimensions",
        "The declared purpose must name critical dimensions."
      );
    if (new Set(definition.criticalDimensions).size !== definition.criticalDimensions.length)
      add(
        violations,
        "DUPLICATE_CRITICAL_DIMENSION",
        "definition.criticalDimensions",
        "Critical dimensions must be unique."
      );
    if (
      definition.criticalDimensions.some(
        (dimension) => !(HUMAN_AI_COMPARABILITY_DIMENSIONS as readonly string[]).includes(dimension)
      )
    )
      add(
        violations,
        "INVALID_CRITICAL_DIMENSION",
        "definition.criticalDimensions",
        "Every critical dimension must use the bounded S-08 vocabulary."
      );
    if (definition.requiredEvidenceReferences.length === 0)
      add(
        violations,
        "MISSING_REQUIRED_EVIDENCE",
        "definition.requiredEvidenceReferences",
        "A comparison definition must declare evidence requirements."
      );
    if (definition.scientificAuthority !== "NONE")
      add(
        violations,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        "definition.scientificAuthority",
        "S-08 has no scientific approval authority."
      );
    scan(definition, "definition", violations);
    return violations;
  }

  definitionDigest(definition: HumanAIComparisonDefinition): string {
    const violations = this.validateDefinition(definition);
    if (violations.length > 0) throw new HumanAIComparisonValidationError(violations);
    return computeSha256(canonicalJson(definitionMaterial(definition)));
  }

  createUnit(
    definition: HumanAIComparisonDefinition,
    input: Omit<
      HumanAIComparisonUnit,
      "comparisonUnitDigest" | "definitionDigest" | "scientificAuthority"
    >
  ): HumanAIComparisonUnit {
    const violations = [...this.validateDefinition(definition)];
    if (input.benchmarkIdentity.benchmarkId.toUpperCase() === "HACS")
      add(
        violations,
        "AMBIGUOUS_HACS_IDENTITY",
        "unit.benchmarkIdentity",
        "Bare HACS is not an unambiguous machine identity."
      );
    if (!this.benchmarkRegistry.get(input.benchmarkIdentity))
      add(
        violations,
        "UNKNOWN_BENCHMARK_EVIDENCE",
        "unit.benchmarkIdentity",
        "The exact benchmark version must exist in S-02."
      );
    if (!input.humanEvidence.responseId || !input.humanEvidence.responseDigest)
      add(
        violations,
        "UNKNOWN_HUMAN_EVIDENCE",
        "unit.humanEvidence",
        "Exact Human-as-Subject response identity and digest are required."
      );
    if (!input.aiEvidence.executionId || !input.aiEvidence.resultReference)
      add(
        violations,
        "UNKNOWN_AI_EVIDENCE",
        "unit.aiEvidence",
        "Exact AI execution and result references are required."
      );
    if (
      !input.aiEvidence.model.providerId ||
      !input.aiEvidence.model.modelId ||
      !input.aiEvidence.model.configurationReference ||
      !input.aiEvidence.model.samplingParametersReference ||
      !input.aiEvidence.model.systemContextReference ||
      !input.aiEvidence.model.executionProvenanceReference
    )
      add(
        violations,
        "INCOMPLETE_AI_PROVENANCE",
        "unit.aiEvidence.model",
        "AI provider, model, configuration, sampling, context, and execution provenance are required."
      );
    if (!input.constructId)
      add(
        violations,
        "CONSTRUCT_AMBIGUITY",
        "unit.constructId",
        "A comparison unit must name the bounded construct interpretation."
      );
    if (
      definition.pairing === "PAIRED_BY_ITEM" &&
      (!input.itemIdentity?.itemId || !input.itemIdentity.itemVersion)
    )
      add(
        violations,
        "ITEM_IDENTITY_REQUIRED",
        "unit.itemIdentity",
        "Item-paired comparison requires exact item identity and version."
      );
    for (const population of [input.humanPopulation, input.aiPopulation]) {
      if (population && (!Number.isInteger(population.sampleSize) || population.sampleSize < 1))
        add(
          violations,
          "INVALID_POPULATION_SAMPLE",
          "unit.population.sampleSize",
          "Population sample size must be a positive integer."
        );
      if (
        population?.representativeness !== undefined &&
        population.representativeness !== "NOT_CLAIMED"
      )
        add(
          violations,
          "REPRESENTATIVENESS_CLAIM_FORBIDDEN",
          "unit.population.representativeness",
          "S-08 cannot infer sample representativeness."
        );
    }
    if (
      definition.level !== "INDIVIDUAL_HUMAN_TO_INDIVIDUAL_AI" &&
      (!input.humanPopulation || !input.aiPopulation)
    )
      add(
        violations,
        "MISSING_POPULATION_PROVENANCE",
        "unit.population",
        "Sample and aggregate comparisons require both population provenance records."
      );
    scan(input, "unit", violations);
    if (violations.length > 0) throw new HumanAIComparisonValidationError(violations);
    const material: Omit<HumanAIComparisonUnit, "comparisonUnitDigest"> = {
      ...input,
      definitionDigest: this.definitionDigest(definition),
      scientificAuthority: "NONE"
    };
    return {
      ...material,
      comparisonUnitDigest: computeSha256(canonicalJson(unitMaterial(material)))
    };
  }

  assess(input: {
    readonly assessmentId: string;
    readonly definition: HumanAIComparisonDefinition;
    readonly unit: HumanAIComparisonUnit;
    readonly dimensions: readonly HumanAIDimensionAssessment[];
    readonly limitations: readonly string[];
    readonly provenanceReferences: readonly string[];
    readonly assessmentAuthority: "AUTOMATED_EVIDENCE_GATE" | "RESEARCH_REVIEW";
  }): HumanAIComparabilityAssessment {
    const violations: HumanAIComparisonValidationViolation[] = [];
    const definitionDigest = this.definitionDigest(input.definition);
    if (input.unit.definitionDigest !== definitionDigest)
      add(
        violations,
        "DEFINITION_SUBSTITUTION",
        "assessment.unit",
        "The unit must retain the exact comparison definition."
      );
    const expectedUnitDigest = computeSha256(canonicalJson(unitMaterial(input.unit)));
    if (input.unit.comparisonUnitDigest !== expectedUnitDigest)
      add(
        violations,
        "COMPARISON_UNIT_SUBSTITUTION",
        "assessment.unit",
        "The assessment must bind the exact comparison unit material."
      );
    const dimensions = new Map(input.dimensions.map((entry) => [entry.dimension, entry]));
    if (dimensions.size !== input.dimensions.length)
      add(
        violations,
        "DUPLICATE_DIMENSION",
        "assessment.dimensions",
        "Each comparability dimension may appear once."
      );
    for (const dimension of HUMAN_AI_COMPARABILITY_DIMENSIONS) {
      if (!dimensions.has(dimension))
        add(
          violations,
          "MISSING_DIMENSION",
          `assessment.dimensions.${dimension}`,
          "Every S-08 dimension must remain visible."
        );
    }
    for (const entry of input.dimensions) {
      if (!(HUMAN_AI_COMPARABILITY_DIMENSIONS as readonly string[]).includes(entry.dimension))
        add(
          violations,
          "INVALID_DIMENSION",
          "assessment.dimensions",
          "Assessment dimensions must use the bounded S-08 vocabulary."
        );
      if (!(HUMAN_AI_DIMENSION_STATUSES as readonly string[]).includes(entry.status))
        add(
          violations,
          "INVALID_DIMENSION_STATUS",
          `assessment.dimensions.${entry.dimension}`,
          "Dimension status must use the bounded S-08 vocabulary."
        );
      if (!entry.rationale.trim())
        add(
          violations,
          "MISSING_DIMENSION_RATIONALE",
          `assessment.dimensions.${entry.dimension}`,
          "Each dimension requires concise justification."
        );
      if (
        ["MATCHED", "ACCEPTABLE_WITH_LIMITATIONS", "MISMATCHED"].includes(entry.status) &&
        entry.evidenceRefs.length === 0
      )
        add(
          violations,
          "MISSING_DIMENSION_EVIDENCE",
          `assessment.dimensions.${entry.dimension}`,
          "An asserted dimension status requires evidence references."
        );
      if (entry.status === "ACCEPTABLE_WITH_LIMITATIONS" && entry.limitations.length === 0)
        add(
          violations,
          "MISSING_DIMENSION_LIMITATION",
          `assessment.dimensions.${entry.dimension}`,
          "Conditional compatibility requires an explicit limitation."
        );
    }
    const directMismatches = directConditionMismatches(input.unit);
    for (const dimension of directMismatches) {
      if (dimensions.get(dimension)?.status === "MATCHED")
        add(
          violations,
          "CONTRADICTED_MATCH",
          `assessment.dimensions.${dimension}`,
          "Exact recorded conditions differ and cannot be marked matched."
        );
    }
    if (
      input.definition.level !== "INDIVIDUAL_HUMAN_TO_INDIVIDUAL_AI" &&
      (!input.unit.humanPopulation || !input.unit.aiPopulation)
    )
      add(
        violations,
        "MISSING_POPULATION_PROVENANCE",
        "assessment.unit.population",
        "Population provenance is required at sample and aggregate levels."
      );
    scan(input, "assessment", violations);
    if (violations.length > 0) throw new HumanAIComparisonValidationError(violations);

    const decision = decisionFor(input.definition, input.dimensions);
    const blockingDimensions = input.definition.criticalDimensions.filter(
      (dimension) => dimensions.get(dimension)?.status === "MISMATCHED"
    );
    const unknownDimensions = input.definition.criticalDimensions.filter((dimension) => {
      const status = dimensions.get(dimension)?.status;
      return status === undefined || status === "UNKNOWN" || status === "NOT_APPLICABLE";
    });
    const material: Omit<HumanAIComparabilityAssessment, "assessmentDigest"> = {
      assessmentId: input.assessmentId,
      definitionDigest,
      comparisonUnitDigest: input.unit.comparisonUnitDigest,
      purpose: input.definition.purpose,
      decision,
      dimensions: input.dimensions,
      criticalDimensions: input.definition.criticalDimensions,
      blockingDimensions,
      unknownDimensions,
      limitations: input.limitations,
      provenanceReferences: input.provenanceReferences,
      assessmentAuthority: input.assessmentAuthority,
      scientificAuthority: "NONE"
    };
    return {
      ...material,
      assessmentDigest: computeSha256(canonicalJson(assessmentMaterial(material)))
    };
  }

  createResult(input: {
    readonly resultId: string;
    readonly definition: HumanAIComparisonDefinition;
    readonly unit: HumanAIComparisonUnit;
    readonly assessment: HumanAIComparabilityAssessment;
    readonly observation: HumanAIComparisonObservation;
    readonly limitations: readonly string[];
    readonly provenanceReferences: readonly string[];
  }): HumanAIComparisonResult {
    const violations: HumanAIComparisonValidationViolation[] = [];
    const definitionDigest = this.definitionDigest(input.definition);
    if (
      input.assessment.definitionDigest !== definitionDigest ||
      input.assessment.comparisonUnitDigest !== input.unit.comparisonUnitDigest ||
      input.assessment.purpose !== input.definition.purpose
    )
      add(
        violations,
        "ASSESSMENT_SUBSTITUTION",
        "result.assessment",
        "A result must retain the assessment for this exact definition, unit, and purpose."
      );
    const assessmentWithoutDigest = {
      ...input.assessment
    } as Partial<HumanAIComparabilityAssessment>;
    Reflect.deleteProperty(assessmentWithoutDigest, "assessmentDigest");
    if (
      input.assessment.assessmentDigest !==
      computeSha256(
        canonicalJson(
          assessmentMaterial(
            assessmentWithoutDigest as Omit<HumanAIComparabilityAssessment, "assessmentDigest">
          )
        )
      )
    )
      add(
        violations,
        "ASSESSMENT_DIGEST_MISMATCH",
        "result.assessment",
        "A result cannot discard or alter its authorizing assessment."
      );
    scan(input, "result", violations);
    if (violations.length > 0) throw new HumanAIComparisonValidationError(violations);

    const permitted = ["CONDITIONALLY_COMPARABLE", "COMPARABLE_FOR_DECLARED_PURPOSE"].includes(
      input.assessment.decision
    );
    let relationship: HumanAIComparisonResult["relationship"];
    let numericDifference: number | undefined;

    if (permitted && input.observation.kind === "CATEGORICAL") {
      if (
        input.observation.humanOutcome.kind === "MISSING" &&
        input.observation.aiOutcome.kind === "MISSING"
      )
        relationship = "BOTH_OBSERVATIONS_MISSING";
      else if (input.observation.humanOutcome.kind === "MISSING")
        relationship = "HUMAN_OBSERVATION_MISSING";
      else if (input.observation.aiOutcome.kind === "MISSING")
        relationship = "AI_OBSERVATION_MISSING";
      else
        relationship =
          input.observation.humanOutcome.value === input.observation.aiOutcome.value
            ? "SAME_CATEGORICAL_OUTCOME"
            : "DIFFERENT_CATEGORICAL_OUTCOME";
    }

    if (permitted && input.observation.kind === "NUMERIC_METRIC") {
      const human = input.observation.humanMetricResult;
      const ai = input.observation.aiMetricResult;
      const dimension = new Map(
        input.assessment.dimensions.map((entry) => [entry.dimension, entry.status])
      );
      if (input.definition.purpose !== "NUMERIC_DESCRIPTIVE_DIFFERENCE")
        add(
          violations,
          "NUMERIC_PURPOSE_NOT_DECLARED",
          "result.observation",
          "Numeric difference requires its exact declared comparison purpose."
        );
      if (!sameIdentity(human.metricIdentity, ai.metricIdentity))
        add(
          violations,
          "METRIC_VERSION_MISMATCH",
          "result.observation",
          "Numeric results require exact S-03 metric identity and version."
        );
      if (
        !this.metricRegistry.validateResult(human).valid ||
        !this.metricRegistry.validateResult(ai).valid
      )
        add(
          violations,
          "INVALID_METRIC_RESULT",
          "result.observation",
          "Both numeric observations must be valid S-03 MetricResult records."
        );
      if (dimension.get("METRIC_COMPATIBILITY") !== "MATCHED")
        add(
          violations,
          "METRIC_COMPATIBILITY_NOT_ESTABLISHED",
          "result.assessment",
          "Numeric output requires matched metric semantics."
        );
      if (dimension.get("SCALE_INTERPRETATION_COMPATIBILITY") !== "MATCHED")
        add(
          violations,
          "COMMON_SCALE_NOT_ESTABLISHED",
          "result.assessment",
          "Numeric output requires evidence for a common scale interpretation."
        );
      if (canonicalJson(human.denominator ?? null) !== canonicalJson(ai.denominator ?? null))
        add(
          violations,
          "DENOMINATOR_MISMATCH",
          "result.observation",
          "Numeric aggregate comparison requires identical denominator evidence."
        );
      if (
        human.outcome.kind !== "VALUE" ||
        ai.outcome.kind !== "VALUE" ||
        typeof human.outcome.value !== "number" ||
        typeof ai.outcome.value !== "number"
      )
        add(
          violations,
          "NUMERIC_VALUE_REQUIRED",
          "result.observation",
          "Missing or nonnumeric outcomes cannot be coerced into a numeric difference."
        );
      if (violations.length > 0) throw new HumanAIComparisonValidationError(violations);
      numericDifference =
        (ai.outcome as { readonly kind: "VALUE"; readonly value: number }).value -
        (human.outcome as { readonly kind: "VALUE"; readonly value: number }).value;
      relationship = "DESCRIPTIVE_NUMERIC_DIFFERENCE";
    }

    const material: Omit<HumanAIComparisonResult, "resultDigest"> = {
      resultId: input.resultId,
      definitionDigest,
      comparisonUnitDigest: input.unit.comparisonUnitDigest,
      assessmentDigest: input.assessment.assessmentDigest,
      observationId: input.observation.observationId,
      observationDigest: computeSha256(canonicalJson(observationMaterial(input.observation))),
      purpose: input.definition.purpose,
      level: input.definition.level,
      comparabilityDecision: input.assessment.decision,
      interpretation: permitted ? "BOUNDED_INTERPRETATION_ALLOWED" : "NOT_INTERPRETABLE",
      ...(relationship === undefined ? {} : { relationship }),
      ...(numericDifference === undefined ? {} : { numericDifference }),
      limitations: [...input.assessment.limitations, ...input.limitations],
      prohibitedClaims: PROHIBITED_CLAIMS,
      provenanceReferences: input.provenanceReferences,
      scientificAuthority: "NONE"
    };
    return { ...material, resultDigest: computeSha256(canonicalJson(material)) };
  }
}

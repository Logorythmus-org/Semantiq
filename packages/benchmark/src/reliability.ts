import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import type { EvaluatorRegistry } from "./evaluators.js";
import type { EvaluatorConfiguration, EvaluatorExecution } from "./evaluator-types.js";
import type { MetricRegistry } from "./metrics.js";
import { metricIdentityKey } from "./metrics.js";
import { RELIABILITY_METHODS } from "./reliability-types.js";
import type {
  CanonicalReliabilityRegistrySnapshot,
  ReliabilityEstimate,
  ReliabilityExclusion,
  ReliabilityMethod,
  ReliabilityStudyDefinition,
  ReliabilityStudyExecutionInput,
  ReliabilityStudyIdentity,
  ReliabilityStudyResult,
  ReliabilityValidationResult,
  ReliabilityValidationViolation
} from "./reliability-types.js";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const IMPLEMENTED = new Set<ReliabilityMethod>([
  "EXACT_REPEATABILITY",
  "NUMERIC_RUN_TO_RUN_STABILITY",
  "CATEGORICAL_AGREEMENT",
  "STOCHASTIC_STABILITY"
]);

const studyKey = (identity: ReliabilityStudyIdentity): string =>
  `${identity.reliabilityStudyId}@${identity.reliabilityStudyVersion}`;
const evaluatorKey = (identity: { evaluatorId: string; evaluatorVersion: string }): string =>
  `${identity.evaluatorId}@${identity.evaluatorVersion}`;
const bindingKey = (binding: EvaluatorExecution["benchmarkBinding"]): string =>
  binding
    ? `${binding.benchmark.benchmarkId}@${binding.benchmark.benchmarkVersion}/${binding.constructId}`
    : "";

function push(
  v: ReliabilityValidationViolation[],
  code: string,
  path: string,
  message: string
): void {
  v.push({ code, path, message });
}

function canonicalDefinition(definition: ReliabilityStudyDefinition): object {
  return {
    ...definition,
    constantDimensions: [...definition.constantDimensions].sort(),
    variedDimensions: [...definition.variedDimensions].sort(),
    evidenceReferences: [...definition.evidenceReferences].sort(),
    provenanceReferences: [...definition.provenanceReferences].sort(),
    limitations: [...definition.limitations].sort()
  };
}

function targetValid(
  definition: ReliabilityStudyDefinition,
  evaluatorRegistry: EvaluatorRegistry,
  metricRegistry: MetricRegistry,
  violations: ReliabilityValidationViolation[],
  path: string
): void {
  const target = definition.target;
  if (
    (target.kind === "METRIC" || target.kind === "BENCHMARK_METRIC_BINDING") &&
    !metricRegistry.get(target.metric)
  )
    push(
      violations,
      "UNKNOWN_METRIC_TARGET",
      `${path}.target`,
      "Study target must resolve to an exact S-03 metric identity."
    );
  if (
    (target.kind === "EVALUATOR" ||
      target.kind === "EVALUATOR_CONFIGURATION" ||
      target.kind === "HUMAN_RATER_SET") &&
    !evaluatorRegistry.get(target.evaluator)
  )
    push(
      violations,
      "UNKNOWN_EVALUATOR_TARGET",
      `${path}.target`,
      "Study target must resolve to an exact S-04 evaluator identity."
    );
  if (target.kind === "EVALUATOR_CONFIGURATION" && !target.configurationDigest)
    push(
      violations,
      "MISSING_CONFIGURATION_DIGEST",
      `${path}.target.configurationDigest`,
      "Configuration target requires an exact digest."
    );
  if (target.kind === "HUMAN_RATER_SET") {
    const evaluator = evaluatorRegistry.get(target.evaluator);
    if (evaluator?.kind !== "HUMAN_JUDGE" || !target.raterSetId)
      push(
        violations,
        "INVALID_HUMAN_RATER_TARGET",
        `${path}.target`,
        "Human rater targets require a human-judge evaluator and rater-set identity."
      );
  }
}

export function validateReliabilityRegistry(
  snapshot: CanonicalReliabilityRegistrySnapshot,
  evaluatorRegistry: EvaluatorRegistry,
  metricRegistry: MetricRegistry
): ReliabilityValidationResult {
  const violations: ReliabilityValidationViolation[] = [];
  if (!SEMVER_PATTERN.test(snapshot.reliabilityRegistrySchemaVersion))
    push(
      violations,
      "INVALID_REGISTRY_VERSION",
      "reliabilityRegistrySchemaVersion",
      "Registry schema version must be semver."
    );
  const methods = snapshot.methods.map((item) => item.method);
  for (const method of RELIABILITY_METHODS)
    if (!methods.includes(method))
      push(violations, "INCOMPLETE_METHOD_TAXONOMY", "methods", `Missing method '${method}'.`);
  if (new Set(methods).size !== methods.length)
    push(violations, "DUPLICATE_METHOD", "methods", "Reliability methods must be unique.");
  snapshot.methods.forEach((item, index) => {
    if (
      !RELIABILITY_METHODS.includes(item.method) ||
      item.minimumEvidence < 2 ||
      !Number.isInteger(item.minimumEvidence)
    )
      push(
        violations,
        "INVALID_METHOD_CONTRACT",
        `methods[${index}]`,
        "Method and minimum evidence must be explicit and valid."
      );
    if (IMPLEMENTED.has(item.method) !== (item.implementationStatus === "IMPLEMENTED"))
      push(
        violations,
        "IMPLEMENTATION_STATUS_MISMATCH",
        `methods[${index}].implementationStatus`,
        "Implementation status must match the S-05 implementation set."
      );
    for (const field of [
      item.applicability,
      item.computation,
      item.outputContract,
      item.missingnessHandling
    ])
      if (!field.trim())
        push(
          violations,
          "INCOMPLETE_METHOD_CONTRACT",
          `methods[${index}]`,
          "Method semantics cannot be empty."
        );
  });
  const identities = new Set<string>();
  snapshot.studies.forEach((definition, index) => {
    const path = `studies[${index}]`;
    const key = studyKey(definition.identity);
    if (identities.has(key))
      push(
        violations,
        "DUPLICATE_STUDY_IDENTITY",
        `${path}.identity`,
        "Study identity must be unique."
      );
    identities.add(key);
    if (!ID_PATTERN.test(definition.identity.reliabilityStudyId))
      push(
        violations,
        "INVALID_STUDY_ID",
        `${path}.identity.reliabilityStudyId`,
        "Study ID must be canonical snake_case."
      );
    if (!SEMVER_PATTERN.test(definition.identity.reliabilityStudyVersion))
      push(
        violations,
        "INVALID_STUDY_VERSION",
        `${path}.identity.reliabilityStudyVersion`,
        "Study version must be unambiguous semver."
      );
    if (definition.versionScope !== "RELIABILITY_STUDY")
      push(
        violations,
        "AMBIGUOUS_VERSION_SCOPE",
        `${path}.versionScope`,
        "Study versions use RELIABILITY_STUDY scope."
      );
    if (definition.scientificAuthority !== "NONE")
      push(
        violations,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        `${path}.scientificAuthority`,
        "Reliability studies cannot claim scientific authority."
      );
    if (!methods.includes(definition.method))
      push(violations, "UNKNOWN_METHOD", `${path}.method`, "Study method is not registered.");
    if (
      !definition.name.trim() ||
      !definition.question.trim() ||
      definition.provenanceReferences.length === 0 ||
      definition.limitations.length === 0
    )
      push(
        violations,
        "INCOMPLETE_STUDY_CONTRACT",
        path,
        "Name, question, provenance, and limitations are required."
      );
    if (definition.constantDimensions.length === 0 || definition.variedDimensions.length === 0)
      push(
        violations,
        "MISSING_DIMENSION_PLAN",
        path,
        "Constant and varied dimensions must both be declared."
      );
    const overlap = definition.constantDimensions.filter((value) =>
      definition.variedDimensions.includes(value)
    );
    if (overlap.length > 0)
      push(
        violations,
        "DIMENSION_PLAN_CONFLICT",
        path,
        `Dimensions cannot be both constant and varied: ${overlap.join(", ")}.`
      );
    targetValid(definition, evaluatorRegistry, metricRegistry, violations, path);
  });
  return { valid: violations.length === 0, violations };
}

export class ReliabilityRegistryValidationError extends Error {
  constructor(readonly violations: readonly ReliabilityValidationViolation[]) {
    super(violations.map((v) => `${v.code}: ${v.message}`).join("\n"));
    this.name = "ReliabilityRegistryValidationError";
  }
}

export class ReliabilityStudyValidationError extends Error {
  constructor(readonly violations: readonly ReliabilityValidationViolation[]) {
    super(violations.map((v) => `${v.code}: ${v.message}`).join("\n"));
    this.name = "ReliabilityStudyValidationError";
  }
}

function exclusion(execution: EvaluatorExecution): ReliabilityExclusion | undefined {
  if (execution.status === "FAILED")
    return {
      executionId: execution.executionId,
      reason: "FAILED",
      detail: execution.failure?.detail ?? "Evaluator failed."
    };
  if (execution.status === "ABSTAINED")
    return {
      executionId: execution.executionId,
      reason: "ABSTAINED",
      detail: execution.abstention?.detail ?? execution.abstention?.reason ?? "Evaluator abstained."
    };
  if (execution.status === "NOT_APPLICABLE")
    return {
      executionId: execution.executionId,
      reason: "NOT_APPLICABLE",
      detail: "Evaluator marked the case not applicable."
    };
  if (execution.status === "PARTIAL" && !execution.output)
    return {
      executionId: execution.executionId,
      reason: "PARTIAL_WITHOUT_OUTPUT",
      detail: "Partial execution has no usable output."
    };
  if (!execution.output)
    return {
      executionId: execution.executionId,
      reason: "INCOMPATIBLE_OUTPUT",
      detail: "Execution has no usable output."
    };
  if (
    execution.output.kind === "METRIC_RESULT" &&
    execution.output.metricResult.outcome.kind === "MISSING"
  )
    return {
      executionId: execution.executionId,
      reason: "MISSING_VALUE",
      detail:
        execution.output.metricResult.outcome.detail ?? execution.output.metricResult.outcome.reason
    };
  return undefined;
}

function semanticOutput(execution: EvaluatorExecution): string {
  const output = execution.output!;
  if (output.kind === "CATEGORICAL_DECISION")
    return canonicalJson({ kind: output.kind, category: output.category });
  if (output.kind === "STRUCTURED_JUDGMENT")
    return canonicalJson({ kind: output.kind, judgment: output.judgment });
  if (output.kind === "LEGACY_ARTIFACT_REFERENCE") return canonicalJson(output);
  const result = output.metricResult;
  return canonicalJson({
    kind: output.kind,
    metricIdentity: result.metricIdentity,
    benchmarkBinding: result.benchmarkBinding,
    outcome: result.outcome,
    aggregation: result.aggregation,
    denominator: result.denominator,
    uncertainty: result.uncertainty,
    computation: {
      evaluatorId: result.computation.evaluatorId,
      evaluatorVersion: result.computation.evaluatorVersion,
      parameters: result.computation.parameters
    }
  });
}

function exactCondition(execution: EvaluatorExecution): string {
  return canonicalJson({
    evaluatorIdentity: execution.evaluatorIdentity,
    configurationDigest: execution.configurationDigest,
    subject: execution.subject,
    evaluationTarget: execution.evaluationTarget,
    inputKind: execution.inputKind,
    inputReferences: [...execution.inputReferences].sort(),
    benchmarkBinding: execution.benchmarkBinding,
    metricIdentity: execution.metricIdentity
  });
}

function combinations(count: number): number {
  return (count * (count - 1)) / 2;
}

function pairwise(values: readonly string[]): { matches: number; pairs: number } {
  let matches = 0;
  for (let left = 0; left < values.length; left++)
    for (let right = left + 1; right < values.length; right++)
      if (values[left] === values[right]) matches++;
  return { matches, pairs: combinations(values.length) };
}

function targetMatches(
  definition: ReliabilityStudyDefinition,
  execution: EvaluatorExecution
): boolean {
  const target = definition.target;
  if (target.kind === "METRIC")
    return (
      !!execution.metricIdentity &&
      metricIdentityKey(execution.metricIdentity) === metricIdentityKey(target.metric)
    );
  if (target.kind === "BENCHMARK_METRIC_BINDING")
    return (
      !!execution.metricIdentity &&
      metricIdentityKey(execution.metricIdentity) === metricIdentityKey(target.metric) &&
      bindingKey(execution.benchmarkBinding) === bindingKey(target.binding)
    );
  if (target.kind === "EVALUATOR_CONFIGURATION")
    return (
      evaluatorKey(execution.evaluatorIdentity) === evaluatorKey(target.evaluator) &&
      execution.configurationDigest === target.configurationDigest
    );
  return evaluatorKey(execution.evaluatorIdentity) === evaluatorKey(target.evaluator);
}

function configWithoutSeed(configuration: EvaluatorConfiguration): string {
  return canonicalJson({
    evaluatorIdentity: configuration.evaluatorIdentity,
    parameters: Object.fromEntries(
      Object.entries(configuration.parameters)
        .filter(([key]) => !/seed/i.test(key))
        .sort(([a], [b]) => a.localeCompare(b))
    ),
    rubricIdentity: configuration.rubricIdentity,
    model: configuration.model,
    toolReferences: [...configuration.toolReferences].sort(),
    contextReferences: [...configuration.contextReferences].sort(),
    normalizationReferences: [...configuration.normalizationReferences].sort()
  });
}

export class ReliabilityRegistry {
  private readonly studies = new Map<string, ReliabilityStudyDefinition>();
  constructor(
    readonly snapshot: CanonicalReliabilityRegistrySnapshot,
    readonly evaluatorRegistry: EvaluatorRegistry,
    readonly metricRegistry: MetricRegistry
  ) {
    const validation = validateReliabilityRegistry(snapshot, evaluatorRegistry, metricRegistry);
    if (!validation.valid) throw new ReliabilityRegistryValidationError(validation.violations);
    snapshot.studies.forEach((study) => this.studies.set(studyKey(study.identity), study));
  }

  get(identity: ReliabilityStudyIdentity): ReliabilityStudyDefinition | undefined {
    return this.studies.get(studyKey(identity));
  }
  list(): readonly ReliabilityStudyDefinition[] {
    return [...this.studies.values()].sort((a, b) =>
      studyKey(a.identity).localeCompare(studyKey(b.identity))
    );
  }
  definitionDigest(definition: ReliabilityStudyDefinition): string {
    return computeSha256(canonicalJson(canonicalDefinition(definition)));
  }
  serialize(): string {
    return canonicalJson({
      ...this.snapshot,
      methods: [...this.snapshot.methods]
        .map((item) => ({
          ...item,
          assumptions: [...item.assumptions].sort(),
          degenerateCases: [...item.degenerateCases].sort(),
          limitations: [...item.limitations].sort()
        }))
        .sort((a, b) => a.method.localeCompare(b.method)),
      studies: this.list().map(canonicalDefinition)
    });
  }
  digest(): string {
    return computeSha256(this.serialize());
  }

  execute(input: ReliabilityStudyExecutionInput): ReliabilityStudyResult {
    const violations: ReliabilityValidationViolation[] = [];
    const definition = this.get(input.studyIdentity);
    if (!definition)
      push(
        violations,
        "UNKNOWN_STUDY",
        "studyIdentity",
        "Execution references an unknown reliability study."
      );
    if (
      !input.executionId ||
      !input.provenanceReference ||
      !input.executedAt ||
      input.evidenceReferences.length === 0
    )
      push(
        violations,
        "INCOMPLETE_EXECUTION_PROVENANCE",
        "execution",
        "Execution identity, time, evidence, and provenance are required."
      );
    if (definition && input.definitionDigest !== this.definitionDigest(definition))
      push(
        violations,
        "DEFINITION_DIGEST_MISMATCH",
        "definitionDigest",
        "Execution must bind the exact study definition digest."
      );
    const suppliedIds = input.evaluatorExecutions.map((item) => item.executionId);
    if (new Set(suppliedIds).size !== suppliedIds.length)
      push(
        violations,
        "DUPLICATE_EXECUTION_REFERENCE",
        "evaluatorExecutions",
        "Evaluator execution identities must be unique."
      );
    if (
      new Set(input.executionReferences).size !== input.executionReferences.length ||
      canonicalJson([...suppliedIds].sort()) !==
        canonicalJson([...input.executionReferences].sort())
    )
      push(
        violations,
        "UNKNOWN_OR_MISSING_EXECUTION_REFERENCE",
        "executionReferences",
        "Declared references must exactly match supplied S-04 executions."
      );
    const configs = new Map(input.configurations.map((item) => [item.configurationDigest, item]));
    if (configs.size !== input.configurations.length)
      push(
        violations,
        "DUPLICATE_CONFIGURATION",
        "configurations",
        "Configuration digests must be unique."
      );
    for (const execution of input.evaluatorExecutions) {
      const config = configs.get(execution.configurationDigest);
      if (!config)
        push(
          violations,
          "UNKNOWN_CONFIGURATION",
          `evaluatorExecutions.${execution.executionId}`,
          "Execution references an unknown configuration digest."
        );
      else
        for (const issue of this.evaluatorRegistry.validateExecution(execution, config).violations)
          push(
            violations,
            `S04_${issue.code}`,
            `evaluatorExecutions.${execution.executionId}.${issue.path}`,
            issue.message
          );
      if (definition && !targetMatches(definition, execution))
        push(
          violations,
          "TARGET_MISMATCH",
          `evaluatorExecutions.${execution.executionId}`,
          "Execution does not match the exact study target."
        );
    }
    if (definition && !IMPLEMENTED.has(definition.method))
      push(
        violations,
        "METHOD_NOT_IMPLEMENTED",
        "studyIdentity",
        "The selected reliability method is supported by schema only."
      );
    if (violations.length > 0 || !definition) throw new ReliabilityStudyValidationError(violations);

    const exclusions = input.evaluatorExecutions
      .map(exclusion)
      .filter((item): item is ReliabilityExclusion => !!item);
    const eligible = input.evaluatorExecutions.filter(
      (item) => !exclusions.some((excluded) => excluded.executionId === item.executionId)
    );
    let value: ReliabilityEstimate["value"];
    let candidatePairs: number | undefined;
    let eligiblePairs: number | undefined;
    let usedPairs: number | undefined;

    if (definition.method === "EXACT_REPEATABILITY") {
      if (new Set(eligible.map(exactCondition)).size > 1)
        throw new ReliabilityStudyValidationError([
          {
            code: "MIXED_REPEATABILITY_CONDITION",
            path: "evaluatorExecutions",
            message:
              "Exact repeatability requires one exact evaluator, configuration, subject, target, input, benchmark, and metric condition."
          }
        ]);
      const result = pairwise(eligible.map(semanticOutput));
      candidatePairs = combinations(input.evaluatorExecutions.length);
      eligiblePairs = usedPairs = result.pairs;
      if (result.pairs > 0)
        value = {
          kind: "EXACT_REPEATABILITY",
          exactMatches: result.matches,
          exactMatchRate: result.matches / result.pairs
        };
    } else if (definition.method === "STOCHASTIC_STABILITY") {
      const defs = eligible.map((item) => this.evaluatorRegistry.get(item.evaluatorIdentity)!);
      if (
        defs.some(
          (item) =>
            !["SEEDED_STOCHASTIC", "STOCHASTIC", "EXTERNAL_NONDETERMINISTIC"].includes(
              item.determinism
            )
        )
      )
        throw new ReliabilityStudyValidationError([
          {
            code: "NON_STOCHASTIC_EVALUATOR",
            path: "evaluatorExecutions",
            message: "Stochastic stability requires a stochastic evaluator definition."
          }
        ]);
      if (!definition.variedDimensions.includes("SEED"))
        throw new ReliabilityStudyValidationError([
          {
            code: "SEED_VARIATION_NOT_DECLARED",
            path: "variedDimensions",
            message: "Stochastic stability must declare SEED as varied."
          }
        ]);
      if (
        new Set(eligible.map((item) => configWithoutSeed(configs.get(item.configurationDigest)!)))
          .size > 1
      )
        throw new ReliabilityStudyValidationError([
          {
            code: "MIXED_STOCHASTIC_CONFIGURATION",
            path: "configurations",
            message: "Only seed may differ within one stochastic stability condition."
          }
        ]);
      const baseConditions = eligible.map((item) =>
        canonicalJson({ ...JSON.parse(exactCondition(item)), configurationDigest: undefined })
      );
      if (new Set(baseConditions).size > 1)
        throw new ReliabilityStudyValidationError([
          {
            code: "MIXED_REPEATABILITY_CONDITION",
            path: "evaluatorExecutions",
            message:
              "Stochastic executions must share evaluator, subject, target, inputs, benchmark, and metric."
          }
        ]);
      const result = pairwise(eligible.map(semanticOutput));
      candidatePairs = combinations(input.evaluatorExecutions.length);
      eligiblePairs = usedPairs = result.pairs;
      if (result.pairs > 0)
        value = {
          kind: "STOCHASTIC_STABILITY",
          exactMatches: result.matches,
          exactMatchRate: result.matches / result.pairs
        };
    } else if (definition.method === "NUMERIC_RUN_TO_RUN_STABILITY") {
      const metricOutputs = eligible.filter((item) => item.output?.kind === "METRIC_RESULT");
      const incompatible = eligible.filter((item) => item.output?.kind !== "METRIC_RESULT");
      exclusions.push(
        ...incompatible.map((item) => ({
          executionId: item.executionId,
          reason: "INCOMPATIBLE_OUTPUT" as const,
          detail: "Numeric stability requires a MetricResult."
        }))
      );
      const results = metricOutputs.map((item) =>
        item.output!.kind === "METRIC_RESULT" ? item.output!.metricResult : neverValue()
      );
      const definitions = results.map((item) => this.metricRegistry.get(item.metricIdentity)!);
      if (
        new Set(results.map((item) => metricIdentityKey(item.metricIdentity))).size > 1 ||
        new Set(definitions.map((item) => `${item.scale.type}/${item.scale.unit}`)).size > 1 ||
        new Set(
          metricOutputs.map(
            (item) => `${item.evaluationTarget}|${bindingKey(item.benchmarkBinding)}`
          )
        ).size > 1
      )
        throw new ReliabilityStudyValidationError([
          {
            code: "INCOMPATIBLE_NUMERIC_POOL",
            path: "evaluatorExecutions",
            message:
              "Numeric pooling requires the exact metric/version, unit, scale, evaluation target, and benchmark binding."
          }
        ]);
      if (
        definitions.some((item) => ["ORDINAL", "CATEGORICAL", "BOOLEAN"].includes(item.scale.type))
      )
        throw new ReliabilityStudyValidationError([
          {
            code: "ORDINAL_ARITHMETIC_FORBIDDEN",
            path: "evaluatorExecutions",
            message: "Ordinal, categorical, and boolean outputs cannot be pooled arithmetically."
          }
        ]);
      const numericValues = results.map((item) =>
        item.outcome.kind === "VALUE" ? item.outcome.value : NaN
      );
      if (numericValues.some((item) => typeof item !== "number" || !Number.isFinite(item)))
        throw new ReliabilityStudyValidationError([
          {
            code: "NON_NUMERIC_VALUE",
            path: "evaluatorExecutions",
            message: "Numeric stability requires finite numeric values."
          }
        ]);
      const numbers = numericValues as number[];
      if (numbers.length >= 2) {
        const mean = numbers.reduce((sum, item) => sum + item, 0) / numbers.length;
        const sampleStandardDeviation = Math.sqrt(
          numbers.reduce((sum, item) => sum + (item - mean) ** 2, 0) / (numbers.length - 1)
        );
        const minimum = Math.min(...numbers);
        const maximum = Math.max(...numbers);
        value = {
          kind: "NUMERIC_RUN_TO_RUN_STABILITY",
          n: numbers.length,
          mean,
          sampleStandardDeviation,
          minimum,
          maximum,
          range: maximum - minimum
        };
      }
    } else {
      const categorical = eligible.filter((item) => item.output?.kind === "CATEGORICAL_DECISION");
      const incompatible = eligible.filter((item) => item.output?.kind !== "CATEGORICAL_DECISION");
      exclusions.push(
        ...incompatible.map((item) => ({
          executionId: item.executionId,
          reason: "INCOMPATIBLE_OUTPUT" as const,
          detail: "Categorical agreement requires categorical decisions."
        }))
      );
      const conditions = categorical.map((item) =>
        canonicalJson({
          subject: item.subject,
          evaluationTarget: item.evaluationTarget,
          inputKind: item.inputKind,
          inputReferences: [...item.inputReferences].sort(),
          benchmarkBinding: item.benchmarkBinding,
          metricIdentity: item.metricIdentity
        })
      );
      if (new Set(conditions).size > 1)
        throw new ReliabilityStudyValidationError([
          {
            code: "MIXED_AGREEMENT_CONDITION",
            path: "evaluatorExecutions",
            message:
              "Categorical judgments must address the same subject, input, target, benchmark, and metric condition."
          }
        ]);
      const result = pairwise(
        categorical.map((item) =>
          item.output!.kind === "CATEGORICAL_DECISION" ? item.output!.category : ""
        )
      );
      candidatePairs = combinations(input.evaluatorExecutions.length);
      eligiblePairs = usedPairs = result.pairs;
      if (result.pairs > 0)
        value = {
          kind: "CATEGORICAL_AGREEMENT",
          agreements: result.matches,
          rawAgreement: result.matches / result.pairs
        };
    }

    const usedObservations = input.evaluatorExecutions.length - exclusions.length;
    const executionMaterial = {
      studyIdentity: input.studyIdentity,
      definitionDigest: input.definitionDigest,
      executionReferences: [...input.executionReferences].sort(),
      evidenceReferences: [...input.evidenceReferences].sort(),
      provenanceReference: input.provenanceReference
    };
    const executionDigest = computeSha256(canonicalJson(executionMaterial));
    const execution = {
      executionId: input.executionId,
      ...executionMaterial,
      executionDigest,
      executedAt: input.executedAt
    };
    const estimate: ReliabilityEstimate = {
      estimateId: computeSha256(
        canonicalJson({ executionDigest, method: definition.method, value, exclusions })
      ),
      studyIdentity: input.studyIdentity,
      method: definition.method,
      applicability: value
        ? "ESTIMATED"
        : usedObservations === 0
          ? "INSUFFICIENT_EVIDENCE"
          : "DEGENERATE_SAMPLE",
      sample: {
        candidateObservations: input.evaluatorExecutions.length,
        eligibleObservations: usedObservations,
        usedObservations,
        excludedObservations: exclusions.length,
        ...(candidatePairs === undefined ? {} : { candidatePairs, eligiblePairs, usedPairs })
      },
      exclusions,
      ...(value ? { value } : {}),
      executionReferences: [...input.executionReferences].sort(),
      configurationDigests: [
        ...new Set(input.evaluatorExecutions.map((item) => item.configurationDigest))
      ].sort(),
      assumptionsSatisfied: !!value,
      evidenceReferences: [...input.evidenceReferences].sort(),
      provenanceReference: input.provenanceReference,
      limitations: [...definition.limitations],
      scientificAuthority: "NONE",
      validityClaim: "NONE",
      benchmarkMaturityEffect: "NONE"
    };
    return { execution, estimate };
  }
}

function neverValue(): never {
  throw new Error("Unreachable output variant.");
}

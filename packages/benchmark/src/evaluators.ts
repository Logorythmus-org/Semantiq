import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import { BENCHMARK_EVALUATOR_MECHANISMS } from "./registry-types.js";
import type { BenchmarkRegistry } from "./registry.js";
import type { MetricResult } from "./metric-types.js";
import type { MetricRegistry } from "./metrics.js";
import {
  EVALUATOR_ABSTENTION_REASONS,
  EVALUATOR_AUTHORITIES,
  EVALUATOR_DETERMINISM,
  EVALUATOR_EXECUTION_STATUSES,
  JUDGE_INDEPENDENCE
} from "./evaluator-types.js";
import type {
  CanonicalConfigurationValue,
  CanonicalEvaluatorDefinition,
  CanonicalEvaluatorRegistrySnapshot,
  CanonicalRubricDefinition,
  ComparableEvaluatorExecutionGroup,
  EvaluatorConfiguration,
  EvaluatorConfigurationInput,
  EvaluatorExecution,
  EvaluatorIdentity,
  EvaluatorValidationResult,
  EvaluatorValidationViolation,
  RubricIdentity
} from "./evaluator-types.js";

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const SECRET_PATTERN = /(secret|token|password|credential|api[_-]?key|private[_-]?key)/i;
const ABSOLUTE_PATH_PATTERN = /^(?:[A-Za-z]:[\\/]|\\\\|\/)/;

function identityKey(identity: EvaluatorIdentity): string {
  return `${identity.evaluatorId}@${identity.evaluatorVersion}`;
}

function rubricKey(identity: RubricIdentity): string {
  return `${identity.rubricId}@${identity.rubricVersion}`;
}

function metricKey(identity: {
  readonly metricId: string;
  readonly metricVersion: string;
}): string {
  return `${identity.metricId}@${identity.metricVersion}`;
}

function benchmarkKey(identity: {
  readonly benchmarkId: string;
  readonly benchmarkVersion: string;
}): string {
  return `${identity.benchmarkId}@${identity.benchmarkVersion}`;
}

function push(
  violations: EvaluatorValidationViolation[],
  code: string,
  path: string,
  message: string
): void {
  violations.push({ code, path, message });
}

function sameBinding(
  left: EvaluatorExecution["benchmarkBinding"],
  right: EvaluatorExecution["benchmarkBinding"]
): boolean {
  if (!left || !right) return left === right;
  return (
    benchmarkKey(left.benchmark) === benchmarkKey(right.benchmark) &&
    left.constructId === right.constructId
  );
}

function parameterTypeMatches(value: CanonicalConfigurationValue, type: string): boolean {
  if (type === "STRING") return typeof value === "string";
  if (type === "NUMBER") return typeof value === "number" && Number.isFinite(value);
  if (type === "BOOLEAN") return typeof value === "boolean";
  return (
    type === "STRING_ARRAY" &&
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function canonicalDefinition(
  definition: CanonicalEvaluatorDefinition
): CanonicalEvaluatorDefinition {
  return {
    ...definition,
    authority: [...definition.authority].sort(),
    benchmarkBindings: [...definition.benchmarkBindings]
      .map((binding) => ({ ...binding, constructIds: [...binding.constructIds].sort() }))
      .sort((a, b) => benchmarkKey(a.benchmark).localeCompare(benchmarkKey(b.benchmark))),
    metricBindings: [...definition.metricBindings].sort((a, b) =>
      metricKey(a).localeCompare(metricKey(b))
    ),
    inputs: {
      ...definition.inputs,
      inputKinds: [...definition.inputs.inputKinds].sort(),
      subjectKinds: [...definition.inputs.subjectKinds].sort()
    },
    outputs: { ...definition.outputs, kinds: [...definition.outputs.kinds].sort() },
    parameters: [...definition.parameters].sort((a, b) =>
      a.parameterId.localeCompare(b.parameterId)
    ),
    evidenceReferences: [...definition.evidenceReferences].sort(),
    provenance: {
      ...definition.provenance,
      sourceReferences: [...definition.provenance.sourceReferences].sort()
    },
    limitations: [...definition.limitations].sort()
  };
}

export function validateEvaluatorRegistry(
  snapshot: CanonicalEvaluatorRegistrySnapshot,
  benchmarkRegistry: BenchmarkRegistry,
  metricRegistry: MetricRegistry
): EvaluatorValidationResult {
  const violations: EvaluatorValidationViolation[] = [];
  const evaluatorKeys = new Set<string>();
  const rubricKeys = new Set<string>();

  if (!SEMVER_PATTERN.test(snapshot.evaluatorRegistrySchemaVersion)) {
    push(
      violations,
      "INVALID_REGISTRY_VERSION",
      "evaluatorRegistrySchemaVersion",
      "Registry schema version must be explicit SemVer."
    );
  }
  if (
    new Set(snapshot.supportedKinds).size !== snapshot.supportedKinds.length ||
    snapshot.supportedKinds.length !== BENCHMARK_EVALUATOR_MECHANISMS.length ||
    BENCHMARK_EVALUATOR_MECHANISMS.some((kind) => !snapshot.supportedKinds.includes(kind))
  ) {
    push(
      violations,
      "INCOMPLETE_SUPPORTED_KIND_VOCABULARY",
      "supportedKinds",
      "Supported kinds must exactly cover the S-02 evaluator vocabulary."
    );
  }

  snapshot.rubrics.forEach((rubric, index) => {
    const path = `rubrics[${index}]`;
    const key = rubricKey(rubric.identity);
    if (rubricKeys.has(key))
      push(
        violations,
        "DUPLICATE_RUBRIC_IDENTITY",
        `${path}.identity`,
        `Duplicate rubric '${key}'.`
      );
    rubricKeys.add(key);
    if (
      !ID_PATTERN.test(rubric.identity.rubricId) ||
      !SEMVER_PATTERN.test(rubric.identity.rubricVersion)
    )
      push(
        violations,
        "INVALID_RUBRIC_IDENTITY",
        `${path}.identity`,
        "Rubric identity requires a stable snake-case ID and SemVer."
      );
    if (rubric.versionScope !== "RUBRIC")
      push(
        violations,
        "AMBIGUOUS_VERSION_SCOPE",
        `${path}.versionScope`,
        "Rubric versions must use RUBRIC scope."
      );
    if (rubric.criteria.length === 0)
      push(
        violations,
        "EMPTY_RUBRIC",
        `${path}.criteria`,
        "A rubric must declare criteria by identity and reference."
      );
    const criterionIds = rubric.criteria.map((criterion) => criterion.criterionId);
    if (new Set(criterionIds).size !== criterionIds.length)
      push(
        violations,
        "DUPLICATE_RUBRIC_CRITERION",
        `${path}.criteria`,
        "Rubric criterion IDs must be unique."
      );
    for (const criterion of rubric.criteria) {
      if (!criterion.reference || ABSOLUTE_PATH_PATTERN.test(criterion.reference))
        push(
          violations,
          "INVALID_RUBRIC_REFERENCE",
          `${path}.criteria`,
          "Criterion references must be repository-relative and non-empty."
        );
      if (
        criterion.weight !== undefined &&
        (!Number.isFinite(criterion.weight) || criterion.weight < 0)
      )
        push(
          violations,
          "INVALID_RUBRIC_WEIGHT",
          `${path}.criteria`,
          "Criterion weights must be finite and non-negative."
        );
    }
  });

  snapshot.definitions.forEach((definition, index) => {
    const path = `definitions[${index}]`;
    const key = identityKey(definition.identity);
    if (evaluatorKeys.has(key))
      push(
        violations,
        "DUPLICATE_EVALUATOR_IDENTITY",
        `${path}.identity`,
        `Duplicate evaluator '${key}'.`
      );
    evaluatorKeys.add(key);
    if (!ID_PATTERN.test(definition.identity.evaluatorId))
      push(
        violations,
        "INVALID_EVALUATOR_ID",
        `${path}.identity.evaluatorId`,
        "Evaluator IDs must use snake case."
      );
    if (!SEMVER_PATTERN.test(definition.identity.evaluatorVersion))
      push(
        violations,
        "INVALID_EVALUATOR_VERSION",
        `${path}.identity.evaluatorVersion`,
        "Evaluator versions must use SemVer."
      );
    if (definition.versionScope !== "EVALUATOR")
      push(
        violations,
        "AMBIGUOUS_VERSION_SCOPE",
        `${path}.versionScope`,
        "Evaluator versions must use EVALUATOR scope."
      );
    if (!snapshot.supportedKinds.includes(definition.kind))
      push(
        violations,
        "UNSUPPORTED_EVALUATOR_KIND",
        `${path}.kind`,
        `Unsupported evaluator kind '${definition.kind}'.`
      );
    if (!EVALUATOR_DETERMINISM.includes(definition.determinism))
      push(
        violations,
        "INVALID_DETERMINISM",
        `${path}.determinism`,
        "Evaluator determinism must use the canonical classification."
      );
    if (!JUDGE_INDEPENDENCE.includes(definition.judgeIndependence))
      push(
        violations,
        "INVALID_JUDGE_INDEPENDENCE",
        `${path}.judgeIndependence`,
        "Judge independence must use the canonical classification."
      );
    if (definition.scientificAuthority !== "NONE")
      push(
        violations,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        `${path}.scientificAuthority`,
        "Evaluators cannot calibrate, validate, promote, or certify scientific claims."
      );
    if (
      definition.authority.length === 0 ||
      definition.authority.some((authority) => !EVALUATOR_AUTHORITIES.includes(authority))
    )
      push(
        violations,
        "INVALID_EVALUATOR_AUTHORITY",
        `${path}.authority`,
        "Evaluator authority must be non-empty and use only bounded canonical actions."
      );
    if (
      definition.bindingStatus === "IMPLEMENTED_AND_BOUND" &&
      (!definition.implementationId || definition.evidenceReferences.length === 0)
    )
      push(
        violations,
        "UNSUPPORTED_IMPLEMENTATION_CLAIM",
        path,
        "Implemented evaluators require an implementation ID and evidence."
      );
    if (definition.inputs.minimumInputs < 1 || !Number.isInteger(definition.inputs.minimumInputs))
      push(
        violations,
        "INVALID_INPUT_CONTRACT",
        `${path}.inputs.minimumInputs`,
        "Minimum inputs must be a positive integer."
      );
    if (
      definition.outputs.kinds.length === 0 ||
      definition.outputs.numericOutputRequiresMetricResult !== true
    )
      push(
        violations,
        "INVALID_OUTPUT_CONTRACT",
        `${path}.outputs`,
        "Outputs must be explicit and numeric outputs must require MetricResult."
      );
    if (
      new Set(definition.parameters.map((parameter) => parameter.parameterId)).size !==
      definition.parameters.length
    )
      push(
        violations,
        "DUPLICATE_PARAMETER",
        `${path}.parameters`,
        "Parameter IDs must be unique."
      );
    for (const parameter of definition.parameters)
      if (SECRET_PATTERN.test(parameter.parameterId))
        push(
          violations,
          "SECRET_PARAMETER_FORBIDDEN",
          `${path}.parameters`,
          "Evaluator configuration cannot define secret-bearing parameters."
        );

    const rubricIdentity = definition.rubric.identity;
    if (definition.rubric.requirement === "REQUIRED" && !rubricIdentity)
      push(
        violations,
        "MISSING_REQUIRED_RUBRIC",
        `${path}.rubric`,
        "A required rubric needs an exact identity."
      );
    if (definition.rubric.requirement === "FORBIDDEN" && rubricIdentity)
      push(violations, "FORBIDDEN_RUBRIC", `${path}.rubric`, "This evaluator forbids a rubric.");
    if (rubricIdentity && !rubricKeys.has(rubricKey(rubricIdentity)))
      push(
        violations,
        "UNKNOWN_RUBRIC",
        `${path}.rubric.identity`,
        "Evaluator references an unknown rubric."
      );

    const modelKinds = new Set([
      "SELF_EVALUATION",
      "SAME_MODEL_JUDGE",
      "CROSS_MODEL_JUDGE",
      "LLM_AS_JUDGE"
    ]);
    if (modelKinds.has(definition.kind) && definition.modelRequirement !== "REQUIRED")
      push(
        violations,
        "MODEL_PROVENANCE_REQUIRED",
        `${path}.modelRequirement`,
        "Model-based evaluators must require exact model provenance."
      );
    const requiredIndependence = {
      SELF_EVALUATION: "SELF",
      SAME_MODEL_JUDGE: "SAME_MODEL",
      CROSS_MODEL_JUDGE: "CROSS_MODEL"
    } as const;
    const independence = requiredIndependence[definition.kind as keyof typeof requiredIndependence];
    if (independence && definition.judgeIndependence !== independence)
      push(
        violations,
        "JUDGE_INDEPENDENCE_MISMATCH",
        `${path}.judgeIndependence`,
        `${definition.kind} requires ${independence} judge independence.`
      );
    if (
      definition.kind === "HUMAN_JUDGE" &&
      (definition.modelRequirement !== "FORBIDDEN" || definition.judgeIndependence !== "HUMAN")
    )
      push(
        violations,
        "INVALID_HUMAN_JUDGE_CONTRACT",
        path,
        "Human judge contracts must forbid model provenance and declare HUMAN independence."
      );
    if (definition.studyDeclaredBindingPolicy && definition.kind !== "HUMAN_JUDGE")
      push(
        violations,
        "INVALID_STUDY_DECLARED_BINDING_POLICY",
        `${path}.studyDeclaredBindingPolicy`,
        "Only a governed human-judge adapter may accept exact study-declared bindings."
      );
    if (
      definition.studyDeclaredBindingPolicy &&
      (definition.studyDeclaredBindingPolicy.benchmark !== "ALLOWED" ||
        definition.studyDeclaredBindingPolicy.metric !== "ALLOWED")
    )
      push(
        violations,
        "INVALID_STUDY_DECLARED_BINDING_POLICY",
        `${path}.studyDeclaredBindingPolicy`,
        "The S-06 human adapter must validate both benchmark and metric bindings through its exact study contract."
      );
    if (
      ["DETERMINISTIC", "RULE_BASED"].includes(definition.kind) &&
      definition.judgeIndependence !== "NON_MODEL"
    )
      push(
        violations,
        "INVALID_JUDGE_INDEPENDENCE",
        `${path}.judgeIndependence`,
        "Non-model evaluators must declare NON_MODEL independence."
      );

    for (const binding of definition.benchmarkBindings) {
      const benchmark = benchmarkRegistry.get(binding.benchmark);
      if (!benchmark)
        push(
          violations,
          "UNKNOWN_BENCHMARK_BINDING",
          `${path}.benchmarkBindings`,
          `Unknown benchmark '${benchmarkKey(binding.benchmark)}'.`
        );
      else
        for (const constructId of binding.constructIds)
          if (!benchmark.constructIds.includes(constructId))
            push(
              violations,
              "UNKNOWN_CONSTRUCT_BINDING",
              `${path}.benchmarkBindings`,
              `Unknown construct '${constructId}' for '${benchmarkKey(binding.benchmark)}'.`
            );
      const requirement = benchmark?.evaluatorRequirements.find(
        (candidate) => candidate.evaluatorId === definition.implementationId
      );
      if (definition.bindingStatus === "IMPLEMENTED_AND_BOUND" && benchmark && !requirement)
        push(
          violations,
          "BENCHMARK_EVALUATOR_MISMATCH",
          `${path}.benchmarkBindings`,
          "S-04 implementation ID must match the exact S-02 evaluator requirement."
        );
    }
    for (const identity of definition.metricBindings) {
      const metric = metricRegistry.get(identity);
      if (!metric)
        push(
          violations,
          "UNKNOWN_METRIC_BINDING",
          `${path}.metricBindings`,
          `Unknown metric '${metricKey(identity)}'.`
        );
      else if (metric.evaluator.evaluatorId !== definition.implementationId)
        push(
          violations,
          "METRIC_EVALUATOR_MISMATCH",
          `${path}.metricBindings`,
          "S-04 implementation ID must match the exact S-03 evaluator dependency."
        );
    }
  });
  return { valid: violations.length === 0, violations };
}

export class EvaluatorRegistryValidationError extends Error {
  constructor(readonly violations: readonly EvaluatorValidationViolation[]) {
    super(
      `Evaluator registry validation failed: ${violations.map((item) => `${item.code} at ${item.path}`).join("; ")}`
    );
    this.name = "EvaluatorRegistryValidationError";
  }
}

export class EvaluatorConfigurationValidationError extends Error {
  constructor(readonly violations: readonly EvaluatorValidationViolation[]) {
    super(
      `Evaluator configuration validation failed: ${violations.map((item) => `${item.code} at ${item.path}`).join("; ")}`
    );
    this.name = "EvaluatorConfigurationValidationError";
  }
}

export class EvaluatorExecutionValidationError extends Error {
  constructor(readonly violations: readonly EvaluatorValidationViolation[]) {
    super(
      `Evaluator execution validation failed: ${violations.map((item) => `${item.code} at ${item.path}`).join("; ")}`
    );
    this.name = "EvaluatorExecutionValidationError";
  }
}

export class EvaluatorRegistry {
  private readonly definitions = new Map<string, CanonicalEvaluatorDefinition>();

  constructor(
    readonly snapshot: CanonicalEvaluatorRegistrySnapshot,
    readonly benchmarkRegistry: BenchmarkRegistry,
    readonly metricRegistry: MetricRegistry
  ) {
    const validation = validateEvaluatorRegistry(snapshot, benchmarkRegistry, metricRegistry);
    if (!validation.valid) throw new EvaluatorRegistryValidationError(validation.violations);
    for (const definition of snapshot.definitions)
      this.definitions.set(identityKey(definition.identity), definition);
  }

  get(identity: EvaluatorIdentity): CanonicalEvaluatorDefinition | undefined {
    return this.definitions.get(identityKey(identity));
  }
  getRubric(identity: RubricIdentity): CanonicalRubricDefinition | undefined {
    return this.snapshot.rubrics.find(
      (rubric) => rubricKey(rubric.identity) === rubricKey(identity)
    );
  }
  list(): readonly CanonicalEvaluatorDefinition[] {
    return [...this.definitions.values()];
  }

  serialize(): string {
    const rubrics = [...this.snapshot.rubrics]
      .map((rubric) => ({
        ...rubric,
        criteria: [...rubric.criteria].sort((a, b) => a.criterionId.localeCompare(b.criterionId)),
        provenance: {
          ...rubric.provenance,
          sourceReferences: [...rubric.provenance.sourceReferences].sort()
        },
        limitations: [...rubric.limitations].sort()
      }))
      .sort((a, b) => rubricKey(a.identity).localeCompare(rubricKey(b.identity)));
    const definitions = [...this.snapshot.definitions]
      .map(canonicalDefinition)
      .sort((a, b) => identityKey(a.identity).localeCompare(identityKey(b.identity)));
    return canonicalJson({
      ...this.snapshot,
      supportedKinds: [...this.snapshot.supportedKinds].sort(),
      rubrics,
      definitions
    });
  }

  digest(): string {
    return computeSha256(this.serialize());
  }

  createConfiguration(input: EvaluatorConfigurationInput): EvaluatorConfiguration {
    const violations: EvaluatorValidationViolation[] = [];
    const definition = this.get(input.evaluatorIdentity);
    if (!definition)
      push(
        violations,
        "UNKNOWN_EVALUATOR",
        "evaluatorIdentity",
        `Unknown evaluator '${identityKey(input.evaluatorIdentity)}'.`
      );
    if (definition) {
      const declared = new Map(
        definition.parameters.map((parameter) => [parameter.parameterId, parameter])
      );
      for (const parameter of definition.parameters)
        if (parameter.required && !(parameter.parameterId in input.parameters))
          push(
            violations,
            "MISSING_REQUIRED_PARAMETER",
            `parameters.${parameter.parameterId}`,
            "Required evaluator parameter is missing."
          );
      for (const [key, value] of Object.entries(input.parameters)) {
        const parameter = declared.get(key);
        if (SECRET_PATTERN.test(key) || (typeof value === "string" && SECRET_PATTERN.test(value)))
          push(
            violations,
            "SECRET_MATERIAL_FORBIDDEN",
            `parameters.${key}`,
            "Credentials and secrets cannot enter evaluator configuration."
          );
        if (typeof value === "string" && ABSOLUTE_PATH_PATTERN.test(value))
          push(
            violations,
            "FILESYSTEM_PATH_FORBIDDEN",
            `parameters.${key}`,
            "Local filesystem paths cannot enter evaluator configuration."
          );
        if (!parameter)
          push(
            violations,
            "UNKNOWN_PARAMETER",
            `parameters.${key}`,
            "Only declared evaluation-relevant settings are accepted."
          );
        else if (!parameterTypeMatches(value, parameter.type))
          push(
            violations,
            "INVALID_PARAMETER_TYPE",
            `parameters.${key}`,
            `Expected ${parameter.type}.`
          );
      }
      const suppliedRubric = input.rubricIdentity;
      if (
        definition.rubric.requirement === "REQUIRED" &&
        (!suppliedRubric || rubricKey(suppliedRubric) !== rubricKey(definition.rubric.identity!))
      )
        push(
          violations,
          "RUBRIC_CONFIGURATION_MISMATCH",
          "rubricIdentity",
          "Configuration must bind the evaluator's exact required rubric."
        );
      if (definition.rubric.requirement === "FORBIDDEN" && suppliedRubric)
        push(
          violations,
          "FORBIDDEN_RUBRIC",
          "rubricIdentity",
          "This evaluator does not accept a rubric."
        );
      if (definition.modelRequirement === "REQUIRED" && !input.model)
        push(
          violations,
          "MISSING_MODEL_PROVENANCE",
          "model",
          "Model-based evaluator configuration requires exact model provenance."
        );
      if (definition.modelRequirement === "FORBIDDEN" && input.model)
        push(
          violations,
          "FORBIDDEN_MODEL_PROVENANCE",
          "model",
          "This non-model evaluator cannot bind a model."
        );
    }
    if (input.model) {
      if (!input.model.provider || !input.model.modelId)
        push(
          violations,
          "INCOMPLETE_MODEL_PROVENANCE",
          "model",
          "Provider and model ID are required."
        );
      if (input.model.snapshotStatus === "DECLARED_IMMUTABLE" && !input.model.modelVersion)
        push(
          violations,
          "MISSING_IMMUTABLE_MODEL_VERSION",
          "model.modelVersion",
          "An immutable model declaration requires an exact version."
        );
      if (input.model.snapshotStatus === "MUTABLE_ALIAS" && input.model.modelVersion)
        push(
          violations,
          "FABRICATED_MODEL_VERSION",
          "model.modelVersion",
          "A mutable alias cannot be represented as an immutable version."
        );
    }
    for (const [path, values] of [
      ["toolReferences", input.toolReferences],
      ["contextReferences", input.contextReferences],
      ["normalizationReferences", input.normalizationReferences]
    ] as const) {
      for (const value of values ?? [])
        if (!value || ABSOLUTE_PATH_PATTERN.test(value) || SECRET_PATTERN.test(value))
          push(
            violations,
            "INVALID_CONFIGURATION_REFERENCE",
            path,
            "Configuration references must be non-secret stable references, not local paths."
          );
    }
    if (violations.length) throw new EvaluatorConfigurationValidationError(violations);

    const material = {
      evaluatorIdentity: input.evaluatorIdentity,
      parameters: Object.fromEntries(
        Object.entries(input.parameters).sort(([a], [b]) => a.localeCompare(b))
      ),
      ...(input.rubricIdentity ? { rubricIdentity: input.rubricIdentity } : {}),
      ...(input.model ? { model: input.model } : {}),
      toolReferences: [...(input.toolReferences ?? [])].sort(),
      contextReferences: [...(input.contextReferences ?? [])].sort(),
      normalizationReferences: [...(input.normalizationReferences ?? [])].sort()
    };
    return { configurationDigest: computeSha256(canonicalJson(material)), ...material };
  }

  validateExecution(
    execution: EvaluatorExecution,
    configuration: EvaluatorConfiguration
  ): EvaluatorValidationResult {
    const violations: EvaluatorValidationViolation[] = [];
    const definition = this.get(execution.evaluatorIdentity);
    if (!definition)
      push(
        violations,
        "UNKNOWN_EVALUATOR",
        "evaluatorIdentity",
        "Execution references an unknown evaluator."
      );
    if (
      identityKey(execution.evaluatorIdentity) !== identityKey(configuration.evaluatorIdentity) ||
      execution.configurationDigest !== configuration.configurationDigest
    )
      push(
        violations,
        "CONFIGURATION_MISMATCH",
        "configurationDigest",
        "Execution must bind the exact evaluator configuration digest."
      );
    if (
      !execution.executionId ||
      !execution.runId ||
      !execution.subject.subjectId ||
      !execution.subject.subjectKind ||
      !execution.evaluationTarget ||
      !execution.inputKind
    )
      push(
        violations,
        "AMBIGUOUS_EXECUTION_IDENTITY",
        "execution",
        "Execution, run, subject, subject kind, and target identities are required."
      );
    if (!execution.provenanceReference || execution.inputReferences.length === 0)
      push(
        violations,
        "MISSING_EXECUTION_PROVENANCE",
        "provenanceReference",
        "Execution requires inputs and provenance."
      );
    if (!EVALUATOR_EXECUTION_STATUSES.includes(execution.status))
      push(
        violations,
        "INVALID_EXECUTION_STATUS",
        "status",
        "Execution status must use the canonical evaluator status vocabulary."
      );
    if (
      definition &&
      (!definition.inputs.subjectKinds.includes(execution.subject.subjectKind) ||
        !definition.inputs.inputKinds.includes(execution.inputKind) ||
        execution.inputReferences.length < definition.inputs.minimumInputs)
    )
      push(
        violations,
        "INPUT_CONTRACT_MISMATCH",
        "inputReferences",
        "Execution does not satisfy the evaluator input contract."
      );
    if (execution.status === "FAILED") {
      if (!execution.failure?.code || !execution.failure.detail)
        push(
          violations,
          "MISSING_FAILURE_DETAIL",
          "failure",
          "Failed execution requires an explicit failure record."
        );
      if (execution.output)
        push(
          violations,
          "FAILURE_OUTPUT_CONFLICT",
          "output",
          "Evaluator failure cannot be represented as a subject score."
        );
    } else if (execution.failure)
      push(
        violations,
        "UNEXPECTED_FAILURE_DETAIL",
        "failure",
        "Only FAILED execution may carry failure details."
      );
    if (execution.status === "ABSTAINED") {
      if (!execution.abstention?.reason)
        push(
          violations,
          "MISSING_ABSTENTION_REASON",
          "abstention",
          "Abstention requires an explicit reason."
        );
      else if (!EVALUATOR_ABSTENTION_REASONS.includes(execution.abstention.reason))
        push(
          violations,
          "INVALID_ABSTENTION_REASON",
          "abstention.reason",
          "Abstention must use a justified canonical reason."
        );
      if (execution.output)
        push(
          violations,
          "ABSTENTION_OUTPUT_CONFLICT",
          "output",
          "Abstention is neither failure nor a zero-valued result."
        );
    } else if (execution.abstention)
      push(
        violations,
        "UNEXPECTED_ABSTENTION",
        "abstention",
        "Only ABSTAINED execution may carry abstention details."
      );
    if (["NOT_APPLICABLE"].includes(execution.status) && execution.output)
      push(
        violations,
        "NOT_APPLICABLE_OUTPUT_CONFLICT",
        "output",
        "Not-applicable execution cannot carry a result."
      );
    if (execution.status === "SUCCEEDED" && !execution.output)
      push(violations, "MISSING_SUCCESS_OUTPUT", "output", "Successful execution requires output.");

    if (definition && execution.output) {
      if (!definition.outputs.kinds.includes(execution.output.kind))
        push(
          violations,
          "OUTPUT_CONTRACT_MISMATCH",
          "output.kind",
          "Output kind is not declared by the evaluator."
        );
      if (execution.output.kind === "METRIC_RESULT") {
        const result = execution.output.metricResult;
        if (
          !execution.metricIdentity ||
          metricKey(execution.metricIdentity) !== metricKey(result.metricIdentity)
        )
          push(
            violations,
            "EXECUTION_METRIC_MISMATCH",
            "metricIdentity",
            "Execution and MetricResult must use the same metric identity."
          );
        if (
          definition.studyDeclaredBindingPolicy?.metric !== "ALLOWED" &&
          !definition.metricBindings.some(
            (identity) => metricKey(identity) === metricKey(result.metricIdentity)
          )
        )
          push(
            violations,
            "UNSUPPORTED_METRIC_BINDING",
            "metricIdentity",
            "Evaluator is not bound to this metric."
          );
        if (!sameBinding(execution.benchmarkBinding, result.benchmarkBinding))
          push(
            violations,
            "EXECUTION_BENCHMARK_MISMATCH",
            "benchmarkBinding",
            "Execution and MetricResult benchmark bindings must match."
          );
        if (
          result.computation.evaluatorId !== definition.implementationId ||
          (result.computation.evaluatorVersion &&
            result.computation.evaluatorVersion !== definition.identity.evaluatorVersion)
        )
          push(
            violations,
            "METRIC_COMPUTATION_MISMATCH",
            "output.metricResult.computation",
            "MetricResult must retain the exact legacy implementation ID and canonical evaluator version when supplied."
          );
        for (const violation of this.metricRegistry.validateResult(result).violations)
          push(
            violations,
            `S03_${violation.code}`,
            `output.metricResult.${violation.path}`,
            violation.message
          );
      }
    }
    if (definition && execution.benchmarkBinding) {
      const supported =
        definition.studyDeclaredBindingPolicy?.benchmark === "ALLOWED" ||
        definition.benchmarkBindings.some(
          (binding) =>
            benchmarkKey(binding.benchmark) ===
              benchmarkKey(execution.benchmarkBinding!.benchmark) &&
            binding.constructIds.includes(execution.benchmarkBinding!.constructId)
        );
      if (!supported)
        push(
          violations,
          "UNSUPPORTED_BENCHMARK_BINDING",
          "benchmarkBinding",
          "Evaluator is not bound to this exact S-02 benchmark and construct."
        );
    }
    return { valid: violations.length === 0, violations };
  }

  recordExecution(
    execution: EvaluatorExecution,
    configuration: EvaluatorConfiguration
  ): EvaluatorExecution {
    const validation = this.validateExecution(execution, configuration);
    if (!validation.valid) throw new EvaluatorExecutionValidationError(validation.violations);
    return execution;
  }
}

export function missingMetricResultForExecution(
  execution: EvaluatorExecution,
  base: Omit<MetricResult, "outcome" | "aggregation">
): MetricResult {
  if (
    execution.status !== "FAILED" &&
    execution.status !== "ABSTAINED" &&
    execution.status !== "NOT_APPLICABLE"
  )
    throw new Error("Only failed, abstained, or not-applicable executions map to missingness.");
  const reason =
    execution.status === "FAILED"
      ? "EVALUATOR_FAILURE"
      : execution.status === "NOT_APPLICABLE"
        ? "NOT_APPLICABLE"
        : "INSUFFICIENT_EVIDENCE";
  const detail =
    execution.failure?.detail ?? execution.abstention?.detail ?? execution.abstention?.reason;
  return {
    ...base,
    outcome: { kind: "MISSING", reason, ...(detail ? { detail } : {}) },
    aggregation: { method: "NONE", observedCount: 0, missingCount: 1 }
  };
}

function outputSignature(execution: EvaluatorExecution): string {
  if (!execution.output)
    return canonicalJson({
      status: execution.status,
      failure: execution.failure,
      abstention: execution.abstention
    });
  if (execution.output.kind === "METRIC_RESULT")
    return canonicalJson({
      status: execution.status,
      kind: execution.output.kind,
      outcome: execution.output.metricResult.outcome,
      uncertainty: execution.output.metricResult.uncertainty
    });
  if (execution.output.kind === "STRUCTURED_JUDGMENT")
    return canonicalJson({
      status: execution.status,
      kind: execution.output.kind,
      judgment: execution.output.judgment
    });
  if (execution.output.kind === "CATEGORICAL_DECISION")
    return canonicalJson({
      status: execution.status,
      kind: execution.output.kind,
      category: execution.output.category
    });
  return canonicalJson({
    status: execution.status,
    kind: execution.output.kind,
    artifactReference: execution.output.artifactReference
  });
}

export function groupComparableEvaluatorExecutions(
  executions: readonly EvaluatorExecution[]
): readonly ComparableEvaluatorExecutionGroup[] {
  const groups = new Map<string, EvaluatorExecution[]>();
  for (const execution of executions) {
    const material = {
      subject: execution.subject,
      evaluationTarget: execution.evaluationTarget,
      inputKind: execution.inputKind,
      inputReferences: [...execution.inputReferences].sort(),
      benchmarkBinding: execution.benchmarkBinding,
      metricIdentity: execution.metricIdentity
    };
    const key = computeSha256(canonicalJson(material));
    groups.set(key, [...(groups.get(key) ?? []), execution]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([comparisonKey, group]) => ({
      comparisonKey,
      executions: [...group].sort((a, b) => a.executionId.localeCompare(b.executionId)),
      hasDisagreement: new Set(group.map(outputSignature)).size > 1
    }));
}

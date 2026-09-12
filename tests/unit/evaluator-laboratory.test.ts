import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_EVALUATOR_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  EvaluatorConfigurationValidationError,
  EvaluatorExecutionValidationError,
  EvaluatorRegistry,
  EvaluatorRegistryValidationError,
  MetricRegistry,
  groupComparableEvaluatorExecutions,
  missingMetricResultForExecution,
  validateEvaluatorRegistry,
  type CanonicalEvaluatorRegistrySnapshot,
  type EvaluatorConfiguration,
  type EvaluatorExecution,
  type MetricResult
} from "../../packages/benchmark/src/index.js";

const benchmarks = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metrics = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarks);
const evaluators = new EvaluatorRegistry(CANONICAL_EVALUATOR_REGISTRY, benchmarks, metrics);
const providerIdentity = { evaluatorId: "sandbox_tck_suite", evaluatorVersion: "0.1.0" } as const;
const providerMetric = { metricId: "provider_tck_passed_tests", metricVersion: "0.1.0" } as const;
const providerBinding = {
  benchmark: { benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" },
  constructId: "provider_contract_conformance"
} as const;

function cloneRegistry(): CanonicalEvaluatorRegistrySnapshot {
  return structuredClone(CANONICAL_EVALUATOR_REGISTRY);
}

function config(): EvaluatorConfiguration {
  return evaluators.createConfiguration({ evaluatorIdentity: providerIdentity, parameters: {} });
}

function metricResult(value = 4): MetricResult {
  return {
    resultId: "result-1",
    metricIdentity: providerMetric,
    benchmarkBinding: providerBinding,
    outcome: { kind: "VALUE", value },
    aggregation: { method: "NONE", observedCount: 1, missingCount: 0 },
    uncertainty: { method: "NONE" },
    computation: {
      computationId: "tck-1",
      evaluatorId: "SandboxTCK.runSuite",
      evaluatorVersion: "0.1.0",
      inputReferences: ["artifact:tck-1"],
      parameters: {}
    },
    evidenceReferences: ["artifact:tck-1"],
    provenanceReference: "run:tck-1"
  };
}

function execution(overrides: Partial<EvaluatorExecution> = {}): EvaluatorExecution {
  const configuration = config();
  return {
    executionId: "execution-1",
    evaluatorIdentity: providerIdentity,
    configurationDigest: configuration.configurationDigest,
    runId: "run-1",
    subject: { subjectId: "provider-1", subjectKind: "SANDBOX_PROVIDER" },
    evaluationTarget: "provider contract conformance",
    inputKind: "TCK_REPORT",
    inputReferences: ["artifact:tck-1"],
    benchmarkBinding: providerBinding,
    metricIdentity: providerMetric,
    status: "SUCCEEDED",
    output: { kind: "METRIC_RESULT", metricResult: metricResult() },
    evidenceReferences: ["artifact:tck-1"],
    provenanceReference: "run:tck-1",
    executedAt: "2026-09-12T00:00:00.000Z",
    ...overrides
  };
}

function validationCodes(snapshot: CanonicalEvaluatorRegistrySnapshot): readonly string[] {
  return validateEvaluatorRegistry(snapshot, benchmarks, metrics).violations.map(
    (item) => item.code
  );
}

describe("S-04 evaluator definition layer", () => {
  it("keeps definition, configuration, and execution as separate records", () => {
    const definition = evaluators.get(providerIdentity)!;
    const configuration = config();
    const record = execution();
    expect(definition.identity).toEqual(providerIdentity);
    expect(configuration.configurationDigest).not.toBe(record.executionId);
    expect(record.configurationDigest).toBe(configuration.configurationDigest);
  });

  it("uses EVALUATOR-scoped versioned identity", () => {
    expect(evaluators.list().every((item) => item.versionScope === "EVALUATOR")).toBe(true);
    expect(
      evaluators.list().every((item) => /^\d+\.\d+\.\d+/.test(item.identity.evaluatorVersion))
    ).toBe(true);
  });

  it("reuses the exact S-02 evaluator vocabulary while distinguishing support from implementation", () => {
    expect(CANONICAL_EVALUATOR_REGISTRY.supportedKinds).toEqual([
      "DETERMINISTIC",
      "RULE_BASED",
      "SELF_EVALUATION",
      "SAME_MODEL_JUDGE",
      "CROSS_MODEL_JUDGE",
      "LLM_AS_JUDGE",
      "SEMANTIQ_EVALUATOR",
      "HUMAN_JUDGE",
      "HYBRID"
    ]);
    expect(evaluators.list().some((item) => item.bindingStatus === "IMPLEMENTED_AND_BOUND")).toBe(
      true
    );
  });

  it("gives evaluators no calibration, validation, certification, or promotion authority", () => {
    expect(evaluators.list().every((item) => item.scientificAuthority === "NONE")).toBe(true);
    expect(evaluators.list().flatMap((item) => item.authority)).not.toEqual(
      expect.arrayContaining(["CALIBRATE", "VALIDATE", "PROMOTE", "CERTIFY"])
    );
  });

  it("cannot mutate S-02 maturity or S-03 calibration and validity contracts", () => {
    const benchmarkBefore = structuredClone(benchmarks.get(providerBinding.benchmark));
    const metricBefore = structuredClone(metrics.get(providerMetric));
    evaluators.recordExecution(execution(), config());
    expect(benchmarks.get(providerBinding.benchmark)).toEqual(benchmarkBefore);
    expect(metrics.get(providerMetric)).toEqual(metricBefore);
  });

  it("registers four representative current migrations and the S-06 human adapter", () => {
    expect(evaluators.list().map((item) => item.identity.evaluatorId)).toEqual(
      expect.arrayContaining([
        "sandbox_tck_suite",
        "long_horizon_rule_evaluator",
        "matched_statistical_contrast",
        "behavioral_metrics_legacy_suite",
        "human_judge_contract"
      ])
    );
    expect(
      evaluators.get({ evaluatorId: "human_judge_contract", evaluatorVersion: "0.1.0" })
        ?.bindingStatus
    ).toBe("IMPLEMENTED_AND_BOUND");
  });

  it("binds implemented evaluators to exact S-02 and S-03 implementation IDs", () => {
    const provider = evaluators.get(providerIdentity)!;
    expect(provider.implementationId).toBe("SandboxTCK.runSuite");
    expect(provider.benchmarkBindings[0]?.benchmark).toEqual({
      benchmarkId: "provider_tck",
      benchmarkVersion: "0.1.0"
    });
    expect(provider.metricBindings).toContainEqual(providerMetric);
  });

  it("keeps legacy confidence outside S-03 uncertainty", () => {
    const legacy = evaluators.get({
      evaluatorId: "behavioral_metrics_legacy_suite",
      evaluatorVersion: "0.1.0"
    })!;
    expect(legacy.outputs.kinds).toEqual(["LEGACY_ARTIFACT_REFERENCE"]);
    expect(legacy.metricBindings).toEqual([]);
    expect(legacy.limitations.join(" ")).toMatch(/not S-03 uncertainty/i);
  });

  it("classifies evaluator determinism and judge independence explicitly", () => {
    expect(evaluators.get(providerIdentity)?.determinism).toBe("DETERMINISTIC");
    expect(
      evaluators.get({ evaluatorId: "matched_statistical_contrast", evaluatorVersion: "0.1.0" })
        ?.determinism
    ).toBe("SEEDED_STOCHASTIC");
    expect(evaluators.get(providerIdentity)?.judgeIndependence).toBe("NON_MODEL");
  });

  it("serializes deterministically and produces a stable digest", () => {
    const shuffled = cloneRegistry() as any;
    shuffled.definitions.reverse();
    shuffled.rubrics.reverse();
    shuffled.supportedKinds.reverse();
    shuffled.definitions[0].authority.reverse();
    const alternate = new EvaluatorRegistry(shuffled, benchmarks, metrics);
    expect(alternate.serialize()).toBe(evaluators.serialize());
    expect(evaluators.digest()).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("S-04 evaluator definition validation", () => {
  it("rejects duplicate and malformed evaluator identities and ambiguous scope", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].identity.evaluatorVersion = "latest";
    invalid.definitions[0].versionScope = "PACKAGE";
    invalid.definitions.push(structuredClone(invalid.definitions[0]));
    expect(validationCodes(invalid)).toEqual(
      expect.arrayContaining([
        "DUPLICATE_EVALUATOR_IDENTITY",
        "INVALID_EVALUATOR_VERSION",
        "AMBIGUOUS_VERSION_SCOPE"
      ])
    );
  });

  it("rejects unknown benchmark, construct, and metric bindings", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].benchmarkBindings[0].benchmark.benchmarkId = "missing";
    invalid.definitions[1].benchmarkBindings[0].constructIds = ["missing"];
    invalid.definitions[2].metricBindings[0].metricId = "missing";
    expect(validationCodes(invalid)).toEqual(
      expect.arrayContaining([
        "UNKNOWN_BENCHMARK_BINDING",
        "UNKNOWN_CONSTRUCT_BINDING",
        "UNKNOWN_METRIC_BINDING"
      ])
    );
  });

  it("rejects S-02 and S-03 evaluator substitutions", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].implementationId = "OtherEvaluator.run";
    expect(validationCodes(invalid)).toEqual(
      expect.arrayContaining(["BENCHMARK_EVALUATOR_MISMATCH", "METRIC_EVALUATOR_MISMATCH"])
    );
  });

  it("rejects implementation claims without evidence", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].evidenceReferences = [];
    expect(validationCodes(invalid)).toContain("UNSUPPORTED_IMPLEMENTATION_CLAIM");
  });

  it("rejects scientific authority", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].scientificAuthority = "VALIDATE";
    expect(validationCodes(invalid)).toContain("SCIENTIFIC_AUTHORITY_FORBIDDEN");
  });

  it("rejects invalid determinism declarations", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].determinism = "TEMPERATURE_ZERO";
    expect(validationCodes(invalid)).toContain("INVALID_DETERMINISM");
  });

  it("rejects malformed rubric identity, weights, and references", () => {
    const invalid = cloneRegistry() as any;
    invalid.rubrics[0].identity.rubricVersion = "current";
    invalid.rubrics[0].criteria[0].weight = -1;
    invalid.rubrics[0].criteria[0].reference = "C:\\private\\rubric.txt";
    expect(validationCodes(invalid)).toEqual(
      expect.arrayContaining([
        "INVALID_RUBRIC_IDENTITY",
        "INVALID_RUBRIC_WEIGHT",
        "INVALID_RUBRIC_REFERENCE"
      ])
    );
  });

  it("rejects invalid human and model judge contracts", () => {
    const invalid = cloneRegistry() as any;
    const human = invalid.definitions.find((item: any) => item.kind === "HUMAN_JUDGE");
    human.modelRequirement = "REQUIRED";
    human.judgeIndependence = "SAME_MODEL";
    const model = structuredClone(human);
    model.identity = { evaluatorId: "model_judge", evaluatorVersion: "0.1.0" };
    model.kind = "LLM_AS_JUDGE";
    model.modelRequirement = "OPTIONAL";
    invalid.definitions.push(model);
    expect(validationCodes(invalid)).toEqual(
      expect.arrayContaining(["INVALID_HUMAN_JUDGE_CONTRACT", "MODEL_PROVENANCE_REQUIRED"])
    );
  });

  it("throws actionable construction errors", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].identity.evaluatorVersion = "latest";
    expect(() => new EvaluatorRegistry(invalid, benchmarks, metrics)).toThrow(
      EvaluatorRegistryValidationError
    );
    expect(() => new EvaluatorRegistry(invalid, benchmarks, metrics)).toThrow(
      /INVALID_EVALUATOR_VERSION/
    );
  });
});

describe("S-04 evaluator configuration", () => {
  it("changes digest for material settings and ignores audit timestamps and request IDs", () => {
    const identity = {
      evaluatorId: "matched_statistical_contrast",
      evaluatorVersion: "0.1.0"
    } as const;
    const a = evaluators.createConfiguration({
      evaluatorIdentity: identity,
      parameters: { bootstrapSeed: 42 },
      auditMetadata: { createdAt: "2026-01-01", requestId: "one" }
    });
    const b = evaluators.createConfiguration({
      evaluatorIdentity: identity,
      parameters: { bootstrapSeed: 42 },
      auditMetadata: { createdAt: "2027-01-01", requestId: "two" }
    });
    const c = evaluators.createConfiguration({
      evaluatorIdentity: identity,
      parameters: { bootstrapSeed: 43 }
    });
    expect(a.configurationDigest).toBe(b.configurationDigest);
    expect(a.configurationDigest).not.toBe(c.configurationDigest);
  });

  it("requires the exact declared rubric", () => {
    const identity = {
      evaluatorId: "long_horizon_rule_evaluator",
      evaluatorVersion: "0.1.0"
    } as const;
    expect(() =>
      evaluators.createConfiguration({ evaluatorIdentity: identity, parameters: {} })
    ).toThrow(EvaluatorConfigurationValidationError);
    expect(
      evaluators.createConfiguration({
        evaluatorIdentity: identity,
        parameters: {},
        rubricIdentity: { rubricId: "long_horizon_heuristic_weights", rubricVersion: "0.1.0" }
      }).rubricIdentity
    ).toBeDefined();
  });

  it("rejects undeclared settings, invalid types, secrets, and local paths", () => {
    const identity = {
      evaluatorId: "matched_statistical_contrast",
      evaluatorVersion: "0.1.0"
    } as const;
    for (const parameters of [
      { unknown: true },
      { bootstrapSeed: "42" },
      { apiToken: "secret-value" },
      { bootstrapSeed: "C:\\private\\seed" }
    ]) {
      expect(() =>
        evaluators.createConfiguration({
          evaluatorIdentity: identity,
          parameters: parameters as any
        })
      ).toThrow(EvaluatorConfigurationValidationError);
    }
  });

  it("preserves exact mutable versus immutable model provenance", () => {
    const snapshot = cloneRegistry() as any;
    const modelDefinition = structuredClone(snapshot.definitions.at(-1));
    modelDefinition.identity = { evaluatorId: "test_model_judge", evaluatorVersion: "0.1.0" };
    modelDefinition.kind = "LLM_AS_JUDGE";
    modelDefinition.modelRequirement = "REQUIRED";
    modelDefinition.judgeIndependence = "CROSS_MODEL";
    modelDefinition.parameters = [];
    delete modelDefinition.studyDeclaredBindingPolicy;
    snapshot.definitions.push(modelDefinition);
    const registry = new EvaluatorRegistry(snapshot, benchmarks, metrics);
    expect(() =>
      registry.createConfiguration({
        evaluatorIdentity: modelDefinition.identity,
        parameters: {},
        model: {
          provider: "provider",
          modelId: "latest",
          snapshotStatus: "MUTABLE_ALIAS",
          modelVersion: "invented"
        }
      })
    ).toThrow(/FABRICATED_MODEL_VERSION/);
    expect(
      registry.createConfiguration({
        evaluatorIdentity: modelDefinition.identity,
        parameters: {},
        model: { provider: "provider", modelId: "latest", snapshotStatus: "MUTABLE_ALIAS" }
      }).model?.snapshotStatus
    ).toBe("MUTABLE_ALIAS");
    const first = registry.createConfiguration({
      evaluatorIdentity: modelDefinition.identity,
      parameters: {},
      model: { provider: "provider", modelId: "alias-a", snapshotStatus: "MUTABLE_ALIAS" }
    });
    const second = registry.createConfiguration({
      evaluatorIdentity: modelDefinition.identity,
      parameters: {},
      model: { provider: "provider", modelId: "alias-b", snapshotStatus: "MUTABLE_ALIAS" }
    });
    expect(first.configurationDigest).not.toBe(second.configurationDigest);
  });
});

describe("S-04 evaluator execution", () => {
  it("accepts a canonical numeric result only through S-03 MetricResult", () => {
    expect(evaluators.recordExecution(execution(), config()).output?.kind).toBe("METRIC_RESULT");
  });

  it("rejects failed execution represented as a zero score", () => {
    const invalid = execution({
      status: "FAILED",
      failure: { code: "TIMEOUT", detail: "Evaluator timed out." },
      output: { kind: "METRIC_RESULT", metricResult: metricResult(0) }
    });
    expect(() => evaluators.recordExecution(invalid, config())).toThrow(
      EvaluatorExecutionValidationError
    );
    expect(
      evaluators.validateExecution(invalid, config()).violations.map((item) => item.code)
    ).toContain("FAILURE_OUTPUT_CONFLICT");
  });

  it("treats abstention as distinct from failure and zero", () => {
    const abstained = execution({
      status: "ABSTAINED",
      output: undefined,
      abstention: {
        reason: "INSUFFICIENT_EVIDENCE",
        detail: "Insufficient evidence",
        evidenceReferences: []
      }
    });
    expect(evaluators.validateExecution(abstained, config()).valid).toBe(true);
    const missing = missingMetricResultForExecution(abstained, {
      ...metricResult(),
      outcome: undefined,
      aggregation: undefined
    } as any);
    expect(missing.outcome).toEqual({
      kind: "MISSING",
      reason: "INSUFFICIENT_EVIDENCE",
      detail: "Insufficient evidence"
    });
  });

  it("maps evaluator failure to S-03 missingness without a subject score", () => {
    const failed = execution({
      status: "FAILED",
      output: undefined,
      failure: { code: "EVALUATOR_ERROR", detail: "No result produced." }
    });
    expect(evaluators.validateExecution(failed, config()).valid).toBe(true);
    const missing = missingMetricResultForExecution(failed, {
      ...metricResult(),
      outcome: undefined,
      aggregation: undefined
    } as any);
    expect(missing.outcome).toEqual({
      kind: "MISSING",
      reason: "EVALUATOR_FAILURE",
      detail: "No result produced."
    });
  });

  it("rejects missing abstention and failure details and conflicting status fields", () => {
    expect(
      evaluators
        .validateExecution(execution({ status: "ABSTAINED", output: undefined }), config())
        .violations.map((item) => item.code)
    ).toContain("MISSING_ABSTENTION_REASON");
    expect(
      evaluators
        .validateExecution(execution({ status: "FAILED", output: undefined }), config())
        .violations.map((item) => item.code)
    ).toContain("MISSING_FAILURE_DETAIL");
    expect(
      evaluators
        .validateExecution(execution({ failure: { code: "X", detail: "wrong status" } }), config())
        .violations.map((item) => item.code)
    ).toContain("UNEXPECTED_FAILURE_DETAIL");
  });

  it("rejects unknown evaluator, wrong configuration, ambiguous subject, and missing provenance", () => {
    const invalid = execution({
      evaluatorIdentity: { evaluatorId: "missing", evaluatorVersion: "0.1.0" },
      configurationDigest: "bad",
      subject: { subjectId: "", subjectKind: "" },
      inputKind: "",
      inputReferences: [],
      provenanceReference: ""
    });
    expect(
      evaluators.validateExecution(invalid, config()).violations.map((item) => item.code)
    ).toEqual(
      expect.arrayContaining([
        "UNKNOWN_EVALUATOR",
        "CONFIGURATION_MISMATCH",
        "AMBIGUOUS_EXECUTION_IDENTITY",
        "MISSING_EXECUTION_PROVENANCE"
      ])
    );
  });

  it("rejects evaluator, metric, benchmark, and computation substitution", () => {
    const badResult = metricResult();
    (badResult as any).computation.evaluatorId = "Other.run";
    const invalid = execution({
      metricIdentity: { metricId: "matched_pair_mean_delta", metricVersion: "0.1.0" },
      benchmarkBinding: undefined,
      output: { kind: "METRIC_RESULT", metricResult: badResult }
    });
    expect(
      evaluators.validateExecution(invalid, config()).violations.map((item) => item.code)
    ).toEqual(
      expect.arrayContaining([
        "EXECUTION_METRIC_MISMATCH",
        "EXECUTION_BENCHMARK_MISMATCH",
        "METRIC_COMPUTATION_MISMATCH",
        "S03_EVALUATOR_MISMATCH"
      ])
    );
  });

  it("rejects an unsupported evaluator and benchmark pair", () => {
    const invalid = execution({
      benchmarkBinding: {
        benchmark: { benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" },
        constructId: "long_horizon_resilience"
      }
    });
    expect(
      evaluators.validateExecution(invalid, config()).violations.map((item) => item.code)
    ).toContain("UNSUPPORTED_BENCHMARK_BINDING");
  });

  it("preserves every execution and flags disagreement without averaging", () => {
    const first = execution({ executionId: "a" });
    const second = execution({
      executionId: "b",
      output: { kind: "METRIC_RESULT", metricResult: metricResult(3) }
    });
    const groups = groupComparableEvaluatorExecutions([second, first]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.executions.map((item) => item.executionId)).toEqual(["a", "b"]);
    expect(groups[0]?.hasDisagreement).toBe(true);
    expect(groups[0]).not.toHaveProperty("average");
  });

  it("does not expose chain-of-thought as an execution field", () => {
    const record = execution();
    expect(record).not.toHaveProperty("chainOfThought");
    expect(record.output).not.toHaveProperty("chainOfThought");
  });
});

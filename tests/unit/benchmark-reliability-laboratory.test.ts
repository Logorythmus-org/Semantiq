import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_EVALUATOR_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  CANONICAL_RELIABILITY_REGISTRY,
  EvaluatorRegistry,
  MetricRegistry,
  ReliabilityRegistry,
  ReliabilityRegistryValidationError,
  ReliabilityStudyValidationError,
  validateReliabilityRegistry,
  type EvaluatorConfiguration,
  type EvaluatorExecution,
  type MetricResult,
  type ReliabilityStudyDefinition
} from "../../packages/benchmark/src/index.js";

const benchmarks = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metrics = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarks);
const evaluators = new EvaluatorRegistry(CANONICAL_EVALUATOR_REGISTRY, benchmarks, metrics);
const provider = { evaluatorId: "sandbox_tck_suite", evaluatorVersion: "0.1.0" } as const;
const providerMetric = { metricId: "provider_tck_passed_tests", metricVersion: "0.1.0" } as const;
const providerBinding = {
  benchmark: { benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" },
  constructId: "provider_contract_conformance"
} as const;

function definition(method: ReliabilityStudyDefinition["method"]): ReliabilityStudyDefinition {
  return {
    identity: {
      reliabilityStudyId: `${method.toLowerCase()}_study`,
      reliabilityStudyVersion: "0.1.0"
    },
    versionScope: "RELIABILITY_STUDY",
    name: `${method} study`,
    question: "How stable are repeated outputs under the declared condition?",
    target: { kind: "METRIC", metric: providerMetric },
    method,
    constantDimensions: [
      "BENCHMARK_VERSION",
      "BENCHMARK_INPUT",
      "METRIC_VERSION",
      "EVALUATOR_VERSION",
      "EVALUATOR_CONFIGURATION",
      "SUBJECT"
    ],
    variedDimensions: ["TIME_WINDOW"],
    evidenceReferences: ["tests/unit/benchmark-reliability-laboratory.test.ts"],
    provenanceReferences: ["Docs/research/core/S05_BENCHMARK_RELIABILITY_LABORATORY.md"],
    scientificAuthority: "NONE",
    limitations: ["This estimate is condition-specific and is not validity evidence."]
  };
}

function registry(study: ReliabilityStudyDefinition): ReliabilityRegistry {
  return new ReliabilityRegistry(
    { ...CANONICAL_RELIABILITY_REGISTRY, studies: [study] },
    evaluators,
    metrics
  );
}

function config(): EvaluatorConfiguration {
  return evaluators.createConfiguration({ evaluatorIdentity: provider, parameters: {} });
}

function result(value: number, id = "result-1"): MetricResult {
  return {
    resultId: id,
    metricIdentity: providerMetric,
    benchmarkBinding: providerBinding,
    outcome: { kind: "VALUE", value },
    aggregation: { method: "NONE", observedCount: 1, missingCount: 0 },
    uncertainty: { method: "NONE" },
    computation: {
      computationId: `computation-${id}`,
      evaluatorId: "SandboxTCK.runSuite",
      evaluatorVersion: "0.1.0",
      inputReferences: ["artifact:tck"],
      parameters: {}
    },
    evidenceReferences: [`artifact:${id}`],
    provenanceReference: `run:${id}`
  };
}

function run(
  id: string,
  value = 4,
  overrides: Partial<EvaluatorExecution> = {}
): EvaluatorExecution {
  const configuration = config();
  return {
    executionId: id,
    evaluatorIdentity: provider,
    configurationDigest: configuration.configurationDigest,
    runId: `run-${id}`,
    subject: { subjectId: "provider-1", subjectKind: "SANDBOX_PROVIDER" },
    evaluationTarget: "provider contract conformance",
    inputKind: "TCK_REPORT",
    inputReferences: ["artifact:tck"],
    benchmarkBinding: providerBinding,
    metricIdentity: providerMetric,
    status: "SUCCEEDED",
    output: { kind: "METRIC_RESULT", metricResult: result(value, id) },
    evidenceReferences: [`artifact:${id}`],
    provenanceReference: `run:${id}`,
    executedAt: "2026-09-12T00:00:00.000Z",
    ...overrides
  };
}

function execute(
  lab: ReliabilityRegistry,
  study: ReliabilityStudyDefinition,
  runs: readonly EvaluatorExecution[],
  configurations: readonly EvaluatorConfiguration[] = [config()]
) {
  return lab.execute({
    executionId: "reliability-execution-1",
    studyIdentity: study.identity,
    definitionDigest: lab.definitionDigest(study),
    executionReferences: runs.map((item) => item.executionId),
    evaluatorExecutions: runs,
    configurations,
    evidenceReferences: ["artifact:study-inputs"],
    provenanceReference: "run:reliability",
    executedAt: "2026-09-12T01:00:00.000Z"
  });
}

describe("S-05 benchmark reliability laboratory", () => {
  it("keeps reliability distinct from validity and benchmark maturity", () => {
    const study = definition("EXACT_REPEATABILITY");
    const estimate = execute(registry(study), study, [run("a"), run("b")]).estimate;
    expect(estimate.scientificAuthority).toBe("NONE");
    expect(estimate.validityClaim).toBe("NONE");
    expect(estimate.benchmarkMaturityEffect).toBe("NONE");
  });

  it("uses stable RELIABILITY_STUDY-scoped identity", () => {
    const study = definition("EXACT_REPEATABILITY");
    expect(study.versionScope).toBe("RELIABILITY_STUDY");
    expect(study.identity).toEqual({
      reliabilityStudyId: "exact_repeatability_study",
      reliabilityStudyVersion: "0.1.0"
    });
  });

  it("registers the complete method taxonomy and separates schema support", () => {
    expect(CANONICAL_RELIABILITY_REGISTRY.methods).toHaveLength(9);
    expect(
      CANONICAL_RELIABILITY_REGISTRY.methods
        .filter((item) => item.implementationStatus === "IMPLEMENTED")
        .map((item) => item.method)
    ).toEqual([
      "EXACT_REPEATABILITY",
      "NUMERIC_RUN_TO_RUN_STABILITY",
      "CATEGORICAL_AGREEMENT",
      "STOCHASTIC_STABILITY"
    ]);
  });

  it("requires explicit non-overlapping constant and varied dimensions", () => {
    const bad = structuredClone(definition("EXACT_REPEATABILITY"));
    (bad.variedDimensions as string[]).push("SUBJECT");
    expect(
      validateReliabilityRegistry(
        { ...CANONICAL_RELIABILITY_REGISTRY, studies: [bad] },
        evaluators,
        metrics
      ).violations.map((v) => v.code)
    ).toContain("DIMENSION_PLAN_CONFLICT");
  });

  it("makes definition and execution digests deterministic while excluding execution time", () => {
    const study = definition("EXACT_REPEATABILITY");
    const lab = registry(study);
    const first = execute(lab, study, [run("a"), run("b")]);
    const second = lab.execute({
      ...first.execution,
      executionId: "other",
      executedAt: "2030-01-01T00:00:00Z",
      evaluatorExecutions: [run("b"), run("a")],
      configurations: [config()]
    });
    expect(second.execution.executionDigest).toBe(first.execution.executionDigest);
  });

  it("computes exact repeatability over canonical outputs", () => {
    const study = definition("EXACT_REPEATABILITY");
    const estimate = execute(registry(study), study, [run("a"), run("b"), run("c", 3)]).estimate;
    expect(estimate.value).toEqual({
      kind: "EXACT_REPEATABILITY",
      exactMatches: 1,
      exactMatchRate: 1 / 3
    });
    expect(estimate.sample.usedPairs).toBe(3);
  });

  it("ignores rationale-like audit, evidence, result, computation, request, and execution identities for exact equality", () => {
    const study = definition("EXACT_REPEATABILITY");
    const left = run("left");
    const right = run("right", 4, {
      executedAt: "2032-01-01T00:00:00Z",
      evidenceReferences: ["different:evidence"]
    });
    expect(execute(registry(study), study, [left, right]).estimate.value).toMatchObject({
      exactMatchRate: 1
    });
  });

  it("applies no tolerance in exact repeatability", () => {
    const study = definition("EXACT_REPEATABILITY");
    expect(
      execute(registry(study), study, [run("a", 4), run("b", 5)]).estimate.value
    ).toMatchObject({ exactMatchRate: 0 });
  });

  it("computes numeric n, mean, sample SD, min, max, and range", () => {
    const study = definition("NUMERIC_RUN_TO_RUN_STABILITY");
    const value = execute(registry(study), study, [run("a", 2), run("b", 4), run("c", 6)]).estimate
      .value;
    expect(value).toEqual({
      kind: "NUMERIC_RUN_TO_RUN_STABILITY",
      n: 3,
      mean: 4,
      sampleStandardDeviation: 2,
      minimum: 2,
      maximum: 6,
      range: 4
    });
  });

  it("returns a degenerate estimate rather than inventing variance for one observation", () => {
    const study = definition("NUMERIC_RUN_TO_RUN_STABILITY");
    const estimate = execute(registry(study), study, [run("a", 2)]).estimate;
    expect(estimate.applicability).toBe("DEGENERATE_SAMPLE");
    expect(estimate.value).toBeUndefined();
  });

  it("reports zero variance and a zero mean directly without an unguarded coefficient of variation", () => {
    const study = definition("NUMERIC_RUN_TO_RUN_STABILITY");
    const zeroVariance = execute(registry(study), study, [run("a", 0), run("b", 0)]).estimate;
    expect(zeroVariance.value).toMatchObject({
      mean: 0,
      sampleStandardDeviation: 0,
      range: 0
    });
    expect(JSON.stringify(zeroVariance)).not.toMatch(/coefficientOfVariation/);
  });

  it("excludes failed, abstained, not-applicable, and missing observations with reasons", () => {
    const study = definition("EXACT_REPEATABILITY");
    const failed = run("failed", 4, {
      status: "FAILED",
      output: undefined,
      failure: { code: "E", detail: "failed" }
    });
    const abstained = run("abstained", 4, {
      status: "ABSTAINED",
      output: undefined,
      abstention: { reason: "INSUFFICIENT_EVIDENCE", evidenceReferences: ["e"] }
    });
    const na = run("na", 4, { status: "NOT_APPLICABLE", output: undefined });
    const estimate = execute(registry(study), study, [
      run("ok-1"),
      run("ok-2"),
      failed,
      abstained,
      na
    ]).estimate;
    expect(estimate.sample).toMatchObject({
      candidateObservations: 5,
      eligibleObservations: 2,
      usedObservations: 2,
      excludedObservations: 3
    });
    expect(estimate.exclusions.map((item) => item.reason)).toEqual([
      "FAILED",
      "ABSTAINED",
      "NOT_APPLICABLE"
    ]);
  });

  it("never converts failed or abstained executions to zero", () => {
    const study = definition("NUMERIC_RUN_TO_RUN_STABILITY");
    const failed = run("failed", 0, {
      status: "FAILED",
      output: undefined,
      failure: { code: "E", detail: "failed" }
    });
    const estimate = execute(registry(study), study, [run("a", 2), run("b", 4), failed]).estimate;
    expect(estimate.value).toMatchObject({ n: 2, mean: 3 });
  });

  it("preserves exact execution and configuration lineage", () => {
    const study = definition("EXACT_REPEATABILITY");
    const estimate = execute(registry(study), study, [run("b"), run("a")]).estimate;
    expect(estimate.executionReferences).toEqual(["a", "b"]);
    expect(estimate.configurationDigests).toEqual([config().configurationDigest]);
  });

  it("computes raw categorical agreement without hiding disagreement", () => {
    const human = { evaluatorId: "human_judge_contract", evaluatorVersion: "0.1.0" } as const;
    const humanConfig = evaluators.createConfiguration({
      evaluatorIdentity: human,
      parameters: {}
    });
    const study: ReliabilityStudyDefinition = {
      ...definition("CATEGORICAL_AGREEMENT"),
      target: { kind: "HUMAN_RATER_SET", evaluator: human, raterSetId: "raters-1" },
      constantDimensions: ["BENCHMARK_INPUT", "SUBJECT"],
      variedDimensions: ["RATER"]
    };
    const judgment = (id: string, category: string): EvaluatorExecution => ({
      executionId: id,
      evaluatorIdentity: human,
      configurationDigest: humanConfig.configurationDigest,
      runId: `run-${id}`,
      subject: { subjectId: "subject-1", subjectKind: "EVALUATION_SUBJECT" },
      evaluationTarget: "rubric decision",
      inputKind: "EVIDENCE_BUNDLE",
      inputReferences: ["bundle:1"],
      status: "SUCCEEDED",
      output: {
        kind: "CATEGORICAL_DECISION",
        category,
        rationale: `private rationale ${id}`,
        evidenceReferences: [`evidence:${id}`]
      },
      evidenceReferences: [`evidence:${id}`],
      provenanceReference: `rater:${id}`,
      executedAt: "2026-09-12T00:00:00Z"
    });
    const estimate = execute(
      registry(study),
      study,
      [judgment("a", "PASS"), judgment("b", "PASS"), judgment("c", "FAIL")],
      [humanConfig]
    ).estimate;
    expect(estimate.value).toEqual({
      kind: "CATEGORICAL_AGREEMENT",
      agreements: 1,
      rawAgreement: 1 / 3
    });
    expect(estimate.sample).toMatchObject({ candidatePairs: 3, eligiblePairs: 3, usedPairs: 3 });
  });

  it("allows seed variation only for declared stochastic stability", () => {
    const identity = {
      evaluatorId: "matched_statistical_contrast",
      evaluatorVersion: "0.1.0"
    } as const;
    const metric = { metricId: "matched_pair_mean_delta", metricVersion: "0.1.0" } as const;
    const c1 = evaluators.createConfiguration({
      evaluatorIdentity: identity,
      parameters: { bootstrapSeed: 1 }
    });
    const c2 = evaluators.createConfiguration({
      evaluatorIdentity: identity,
      parameters: { bootstrapSeed: 2 }
    });
    const study: ReliabilityStudyDefinition = {
      ...definition("STOCHASTIC_STABILITY"),
      target: { kind: "METRIC", metric },
      constantDimensions: [
        "METRIC_VERSION",
        "EVALUATOR_VERSION",
        "SUBJECT",
        "EVALUATOR_CONFIGURATION"
      ],
      variedDimensions: ["SEED"]
    };
    const stochasticRun = (
      id: string,
      configuration: EvaluatorConfiguration
    ): EvaluatorExecution => ({
      executionId: id,
      evaluatorIdentity: identity,
      configurationDigest: configuration.configurationDigest,
      runId: id,
      subject: { subjectId: "population-1", subjectKind: "RUN_POPULATION" },
      evaluationTarget: "matched contrast",
      inputKind: "MATCHED_RUN_PAIR",
      inputReferences: ["pair:1"],
      metricIdentity: metric,
      status: "SUCCEEDED",
      output: {
        kind: "METRIC_RESULT",
        metricResult: {
          resultId: id,
          metricIdentity: metric,
          outcome: { kind: "VALUE", value: 0.2 },
          aggregation: { method: "MEAN", observedCount: 2, missingCount: 0 },
          uncertainty: { method: "NONE" },
          computation: {
            computationId: id,
            evaluatorId: "StatisticalContrastEngine.evaluateContrast",
            evaluatorVersion: "0.1.0",
            inputReferences: ["pair:1"],
            parameters: {}
          },
          evidenceReferences: ["pair:1"],
          provenanceReference: id
        }
      },
      evidenceReferences: ["pair:1"],
      provenanceReference: id,
      executedAt: "2026-09-12T00:00:00Z"
    });
    expect(
      execute(registry(study), study, [stochasticRun("a", c1), stochasticRun("b", c2)], [c1, c2])
        .estimate.value
    ).toMatchObject({ kind: "STOCHASTIC_STABILITY", exactMatchRate: 1 });
  });

  it("does not expose universal reliability scores or quality thresholds", () => {
    const serialized = JSON.stringify(CANONICAL_RELIABILITY_REGISTRY);
    expect(serialized).not.toMatch(/universalReliabilityScore|GOOD|POOR|reliableThreshold/);
  });
});

describe("S-05 negative validation", () => {
  it("rejects malformed, duplicate, and ambiguously scoped study identities", () => {
    const bad = {
      ...definition("EXACT_REPEATABILITY"),
      identity: { reliabilityStudyId: "Bad ID", reliabilityStudyVersion: "latest" },
      versionScope: "METRIC" as "RELIABILITY_STUDY"
    };
    const codes = validateReliabilityRegistry(
      { ...CANONICAL_RELIABILITY_REGISTRY, studies: [bad, bad] },
      evaluators,
      metrics
    ).violations.map((v) => v.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "INVALID_STUDY_ID",
        "INVALID_STUDY_VERSION",
        "AMBIGUOUS_VERSION_SCOPE",
        "DUPLICATE_STUDY_IDENTITY"
      ])
    );
  });

  it("rejects incomplete method vocabularies and false implementation claims", () => {
    const snapshot = structuredClone(CANONICAL_RELIABILITY_REGISTRY);
    (snapshot.methods as unknown as Array<{ method: string }>).pop();
    (snapshot.methods[0] as { implementationStatus: string }).implementationStatus =
      "SUPPORTED_BY_SCHEMA";
    expect(() => new ReliabilityRegistry(snapshot, evaluators, metrics)).toThrow(
      ReliabilityRegistryValidationError
    );
  });

  it("rejects schema-only estimator execution", () => {
    const study = definition("TEST_RETEST");
    expect(() => execute(registry(study), study, [run("a"), run("b")])).toThrow(
      ReliabilityStudyValidationError
    );
  });

  it("rejects unknown, missing, and duplicate execution references", () => {
    const study = definition("EXACT_REPEATABILITY");
    const lab = registry(study);
    const input = {
      executionId: "e",
      studyIdentity: study.identity,
      definitionDigest: lab.definitionDigest(study),
      executionReferences: ["a", "unknown"],
      evaluatorExecutions: [run("a"), run("a")],
      configurations: [config()],
      evidenceReferences: ["e"],
      provenanceReference: "p",
      executedAt: "2026-01-01T00:00:00Z"
    };
    expect(() => lab.execute(input)).toThrow(ReliabilityStudyValidationError);
  });

  it("rejects different configurations in exact repeatability", () => {
    const human = { evaluatorId: "human_judge_contract", evaluatorVersion: "0.1.0" } as const;
    const base = evaluators.createConfiguration({
      evaluatorIdentity: human,
      parameters: {},
      contextReferences: ["context:1"]
    });
    const changed = evaluators.createConfiguration({
      evaluatorIdentity: human,
      parameters: {},
      contextReferences: ["context:2"]
    });
    const study: ReliabilityStudyDefinition = {
      ...definition("EXACT_REPEATABILITY"),
      target: { kind: "EVALUATOR", evaluator: human }
    };
    const make = (id: string, c: EvaluatorConfiguration): EvaluatorExecution => ({
      executionId: id,
      evaluatorIdentity: human,
      configurationDigest: c.configurationDigest,
      runId: id,
      subject: { subjectId: "s", subjectKind: "EVALUATION_SUBJECT" },
      evaluationTarget: "target",
      inputKind: "EVIDENCE_BUNDLE",
      inputReferences: ["i"],
      status: "SUCCEEDED",
      output: { kind: "CATEGORICAL_DECISION", category: "PASS", evidenceReferences: ["e"] },
      evidenceReferences: ["e"],
      provenanceReference: "p",
      executedAt: "2026-01-01T00:00:00Z"
    });
    expect(() =>
      execute(registry(study), study, [make("a", base), make("b", changed)], [base, changed])
    ).toThrow(/MIXED_REPEATABILITY_CONDITION/);
  });

  it("rejects metric/version/unit/scale or target pooling", () => {
    const study = definition("NUMERIC_RUN_TO_RUN_STABILITY");
    expect(() =>
      execute(registry(study), study, [run("a"), run("b", 4, { evaluationTarget: "different" })])
    ).toThrow(/INCOMPATIBLE_NUMERIC_POOL/);
  });

  it("rejects deterministic evaluators in stochastic studies", () => {
    const study = {
      ...definition("STOCHASTIC_STABILITY"),
      constantDimensions: ["METRIC_VERSION", "SUBJECT"] as const,
      variedDimensions: ["SEED"] as const
    };
    expect(() => execute(registry(study), study, [run("a"), run("b")])).toThrow(
      /NON_STOCHASTIC_EVALUATOR/
    );
  });

  it("rejects definition and configuration substitution", () => {
    const study = definition("EXACT_REPEATABILITY");
    const lab = registry(study);
    expect(() =>
      lab.execute({
        executionId: "e",
        studyIdentity: study.identity,
        definitionDigest: "wrong",
        executionReferences: ["a"],
        evaluatorExecutions: [run("a")],
        configurations: [],
        evidenceReferences: ["e"],
        provenanceReference: "p",
        executedAt: "2026-01-01T00:00:00Z"
      })
    ).toThrow(ReliabilityStudyValidationError);
  });
});

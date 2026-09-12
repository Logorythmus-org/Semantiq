import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  MetricRegistry,
  MetricRegistryValidationError,
  MetricResultValidationError,
  metricIdentityKey,
  validateMetricRegistry,
  type CanonicalMetricRegistrySnapshot,
  type MetricIdentity,
  type MetricObservation,
  type MetricResult
} from "../../packages/benchmark/src/index.js";
import { PRODUCT_CONTRACTS_SCHEMA_VERSION } from "../../packages/sandbox-contracts/src/index.js";
import { SEMANTIQ_RELEASE_VERSION } from "../../packages/semantiq/src/version.js";

const benchmarkRegistry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metricRegistry = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarkRegistry);

const passedTests: MetricIdentity = {
  metricId: "provider_tck_passed_tests",
  metricVersion: "0.1.0"
};
const passRate: MetricIdentity = {
  metricId: "provider_tck_pass_rate",
  metricVersion: "0.1.0"
};
const resilience: MetricIdentity = {
  metricId: "long_horizon_resilience_index",
  metricVersion: "0.1.0"
};
const meanDelta: MetricIdentity = {
  metricId: "matched_pair_mean_delta",
  metricVersion: "0.1.0"
};

function cloneRegistry(): CanonicalMetricRegistrySnapshot {
  return structuredClone(CANONICAL_METRIC_REGISTRY);
}

function definitionCodes(snapshot: CanonicalMetricRegistrySnapshot): readonly string[] {
  return validateMetricRegistry(snapshot, benchmarkRegistry).violations.map(
    (violation) => violation.code
  );
}

function observation(
  identity: MetricIdentity,
  observationId: string,
  value: number
): MetricObservation {
  const definition = metricRegistry.get(identity)!;
  return {
    observationId,
    metricIdentity: identity,
    ...(definition.benchmarkBinding ? { benchmarkBinding: definition.benchmarkBinding } : {}),
    outcome: { kind: "VALUE", value },
    provenanceReference: `trace:${observationId}`
  };
}

function resultFor(
  identity: MetricIdentity,
  value: number,
  overrides: Partial<MetricResult> = {}
): MetricResult {
  const definition = metricRegistry.get(identity)!;
  return {
    resultId: "result-1",
    metricIdentity: identity,
    ...(definition.benchmarkBinding ? { benchmarkBinding: definition.benchmarkBinding } : {}),
    outcome: { kind: "VALUE", value },
    aggregation: {
      method: definition.aggregation.method,
      observedCount: 1,
      missingCount: 0
    },
    uncertainty: { method: "NONE" },
    computation: {
      computationId: "computation-1",
      evaluatorId: definition.evaluator.evaluatorId,
      inputReferences: ["trace:1"],
      parameters: {}
    },
    evidenceReferences: [],
    provenanceReference: "run:1",
    ...overrides
  };
}

describe("canonical measurement and metric framework", () => {
  it("loads four representative definitions with stable identities and serialization", () => {
    expect(metricRegistry.list()).toHaveLength(4);
    expect(
      new Set(metricRegistry.list().map((entry) => metricIdentityKey(entry.identity))).size
    ).toBe(4);
    expect(metricRegistry.digest()).toMatch(/^[a-f0-9]{64}$/);

    const reordered = cloneRegistry() as any;
    reordered.definitions.reverse();
    reordered.definitions[0].missingness.allowedReasons.reverse();
    reordered.definitions[0].uncertainty.allowedMethods.reverse();
    expect(new MetricRegistry(reordered, benchmarkRegistry).serialize()).toBe(
      metricRegistry.serialize()
    );
  });

  it("classifies numeric output separately from scientific validation", () => {
    const definition = metricRegistry.get(resilience)!;

    expect(definition.measurementKind).toBe("HEURISTIC_PROXY");
    expect(definition.scale.domain.valueType).toBe("NUMBER");
    expect(definition.calibration.status).toBe("REQUIRED_NOT_CALIBRATED");
    expect(definition.validity.status).toBe("REQUIRED_NOT_VALIDATED");
  });

  it("does not let passing software tests promote metric or benchmark maturity", () => {
    const metric = metricRegistry.get(passedTests)!;
    const benchmark = benchmarkRegistry.get(metric.benchmarkBinding!.benchmark)!;

    expect(metric.evidenceReferences.some((reference) => reference.includes("test"))).toBe(true);
    expect(metric.validity.status).toBe("NOT_APPLICABLE");
    expect(benchmark.scientificMaturity).toBe("UNVALIDATED_PROXY");
    expect(benchmark.corePromotion).toBe("NOT_PROMOTED");
  });

  it("treats missing as distinct from zero during aggregation", () => {
    const missing: MetricObservation = {
      observationId: "missing",
      metricIdentity: meanDelta,
      outcome: { kind: "MISSING", reason: "NOT_OBSERVED" },
      provenanceReference: "trace:missing"
    };
    const result = metricRegistry.aggregate(
      meanDelta,
      [observation(meanDelta, "zero", 0), missing],
      {
        resultId: "mean-with-missing",
        uncertainty: { method: "NONE" },
        computation: {
          computationId: "mean-1",
          evaluatorId: "StatisticalContrastEngine.evaluateContrast",
          inputReferences: ["trace:zero", "trace:missing"],
          parameters: {}
        },
        evidenceReferences: [],
        provenanceReference: "contrast:1"
      }
    );

    expect(result.outcome).toEqual({ kind: "VALUE", value: 0 });
    expect(result.aggregation).toEqual({ method: "MEAN", observedCount: 1, missingCount: 1 });
  });

  it("does not reinterpret legacy confidence as statistical uncertainty", () => {
    const legacy = { ...resultFor(resilience, 0.72), confidence: 0.85 } as MetricResult;
    const validation = metricRegistry.validateResult(legacy);

    expect(validation.valid).toBe(false);
    expect(validation.violations.map((violation) => violation.code)).toContain(
      "LEGACY_CONFIDENCE_IS_NOT_UNCERTAINTY"
    );
    expect(legacy.uncertainty).toEqual({ method: "NONE" });
  });

  it("accepts engineering measurements without empirical construct-validity claims", () => {
    const definition = metricRegistry.get(passedTests)!;
    const result = resultFor(passedTests, 4);

    expect(definition.measurementKind).toBe("ENGINEERING_METRIC");
    expect(definition.calibration.applicability).toBe("NOT_APPLICABLE");
    expect(definition.validity.applicability).toBe("NOT_APPLICABLE");
    expect(metricRegistry.validateResult(result).valid).toBe(true);
  });

  it("requires explicit denominator evidence for a proportion", () => {
    const absent = metricRegistry.validateResult(resultFor(passRate, 0.75));
    expect(absent.violations.map((violation) => violation.code)).toContain("MISSING_DENOMINATOR");

    const valid = resultFor(passRate, 0.75, {
      denominator: { numerator: 3, denominator: 4, eligiblePopulation: "TCK 0.1.0 checks" }
    });
    expect(metricRegistry.validateResult(valid).valid).toBe(true);
  });

  it("accepts declared bootstrap uncertainty with complete metadata", () => {
    const result = resultFor(meanDelta, 0.2, {
      uncertainty: {
        method: "BOOTSTRAP_INTERVAL",
        level: 0.95,
        lower: 0.1,
        upper: 0.3,
        sampleSize: 20,
        replicates: 1000,
        seed: 42,
        assumptionsReference: "StatisticalContrastEngine.bootstrapConfidenceInterval"
      }
    });

    expect(metricRegistry.validateResult(result).valid).toBe(true);
  });

  it("keeps metric, benchmark, product, and schema versions explicitly scoped", () => {
    const definition = metricRegistry.get(passedTests)!;

    expect(definition.versionScope).toBe("METRIC");
    expect(definition.identity.metricVersion).toBe("0.1.0");
    expect(definition.benchmarkBinding?.benchmark.benchmarkVersion).toBe("0.1.0");
    expect(SEMANTIQ_RELEASE_VERSION).toBe("0.1.0-alpha.2");
    expect(PRODUCT_CONTRACTS_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("binds benchmark metrics to exact S-02 benchmark and construct identities", () => {
    const definition = metricRegistry.get(resilience)!;

    expect(definition.benchmarkBinding).toEqual({
      benchmark: { benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" },
      constructId: "long_horizon_resilience"
    });
    expect(benchmarkRegistry.get(definition.benchmarkBinding!.benchmark)?.constructIds).toContain(
      definition.benchmarkBinding!.constructId
    );
  });

  it("supports an explicit benchmark-independent statistical feature", () => {
    const definition = metricRegistry.get(meanDelta)!;

    expect(definition.scope).toBe("BENCHMARK_INDEPENDENT");
    expect(definition.benchmarkBinding).toBeUndefined();
    expect(definition.measurementKind).toBe("DERIVED_FEATURE");
  });

  it("uses repository-relative implementation and evidence references", () => {
    const references = metricRegistry
      .list()
      .flatMap((definition) => [
        definition.evaluator.implementationReference,
        ...definition.evidenceReferences,
        ...definition.provenance.sourceReferences
      ]);

    expect(references.length).toBeGreaterThan(0);
    expect(
      references.every((reference) => !reference.startsWith("/") && existsSync(reference))
    ).toBe(true);
  });
});

describe("metric definition validation", () => {
  it("rejects duplicate metric identities and invalid or ambiguous versions", () => {
    const duplicate = cloneRegistry() as any;
    duplicate.definitions.push(structuredClone(duplicate.definitions[0]));
    duplicate.definitions[0].identity.metricVersion = "current";
    duplicate.definitions[duplicate.definitions.length - 1].identity.metricVersion = "current";
    duplicate.definitions[0].versionScope = "PACKAGE";

    expect(definitionCodes(duplicate)).toEqual(
      expect.arrayContaining([
        "DUPLICATE_METRIC_IDENTITY",
        "INVALID_METRIC_VERSION",
        "AMBIGUOUS_VERSION_SCOPE"
      ])
    );
  });

  it("rejects unknown benchmark and construct bindings", () => {
    const unknownBenchmark = cloneRegistry() as any;
    unknownBenchmark.definitions[0].benchmarkBinding.benchmark.benchmarkId = "missing";
    expect(definitionCodes(unknownBenchmark)).toContain("UNKNOWN_BENCHMARK_BINDING");

    const unknownConstruct = cloneRegistry() as any;
    unknownConstruct.definitions[0].benchmarkBinding.constructId = "missing";
    expect(definitionCodes(unknownConstruct)).toContain("UNKNOWN_CONSTRUCT_BINDING");
  });

  it("rejects invalid scale and unit combinations", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].scale.type = "BOOLEAN";
    invalid.definitions[0].scale.unit = "MILLISECONDS";
    invalid.definitions[0].scale.domain.valueType = "NUMBER";
    invalid.definitions[0].aggregation.method = "MEAN";

    expect(definitionCodes(invalid)).toEqual(
      expect.arrayContaining(["INVALID_SCALE_UNIT", "INCOMPATIBLE_AGGREGATION"])
    );
  });

  it("rejects probability definitions outside the exact [0, 1] contract", () => {
    const invalid = cloneRegistry() as any;
    const definition = invalid.definitions.find(
      (entry: any) => entry.identity.metricId === passRate.metricId
    );
    definition.scale.domain.maximum = 100;

    expect(definitionCodes(invalid)).toContain("INVALID_PROBABILITY_SCALE");
  });

  it("rejects categorical averaging without explicit valid semantics", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[3].scale.type = "ORDINAL";
    invalid.definitions[3].scale.domain.valueType = "STRING";
    invalid.definitions[3].scale.domain.allowedValues = ["low", "medium", "high"];

    expect(definitionCodes(invalid)).toContain("INCOMPATIBLE_AGGREGATION");
  });

  it("rejects calibrated and validated claims without evidence", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[2].calibration.status = "CALIBRATED";
    invalid.definitions[2].validity.status = "VALIDATED";

    expect(definitionCodes(invalid)).toEqual(
      expect.arrayContaining(["MISSING_CALIBRATION_EVIDENCE", "MISSING_VALIDITY_EVIDENCE"])
    );
  });

  it("rejects undefined missingness and aggregation semantics", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].missingness.allowedReasons = [];
    invalid.definitions[0].aggregation.method = "AUTOMATIC";

    expect(definitionCodes(invalid)).toEqual(
      expect.arrayContaining(["INVALID_MISSINGNESS_POLICY", "INVALID_AGGREGATION"])
    );
  });

  it("throws actionable errors when constructing an invalid registry", () => {
    const invalid = cloneRegistry() as any;
    invalid.definitions[0].identity.metricVersion = "latest";

    expect(() => new MetricRegistry(invalid, benchmarkRegistry)).toThrow(
      MetricRegistryValidationError
    );
    expect(() => new MetricRegistry(invalid, benchmarkRegistry)).toThrow(/INVALID_METRIC_VERSION/);
  });
});

describe("metric result validation", () => {
  it("rejects unknown metric identities and mismatched benchmark bindings", () => {
    const unknown = resultFor(passedTests, 4, {
      metricIdentity: { metricId: "missing", metricVersion: "0.1.0" }
    });
    expect(metricRegistry.validateResult(unknown).violations[0]?.code).toBe(
      "UNKNOWN_METRIC_IDENTITY"
    );

    const mismatched = resultFor(passedTests, 4, {
      benchmarkBinding: {
        benchmark: { benchmarkId: "long_horizon", benchmarkVersion: "0.1.0" },
        constructId: "long_horizon_resilience"
      }
    });
    expect(metricRegistry.validateResult(mismatched).violations.map((item) => item.code)).toContain(
      "RESULT_BINDING_MISMATCH"
    );
  });

  it("rejects NaN, Infinity, negative counts, and non-integer counts", () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1, 1.5]) {
      expect(metricRegistry.validateResult(resultFor(passedTests, value)).valid).toBe(false);
    }
  });

  it("rejects probabilities outside their declared domain", () => {
    for (const value of [-0.01, 1.01]) {
      const result = resultFor(passRate, value, {
        denominator: { numerator: 1, denominator: 2, eligiblePopulation: "TCK checks" }
      });
      expect(metricRegistry.validateResult(result).valid).toBe(false);
    }
  });

  it("rejects zero denominators and numerator/value mismatches", () => {
    const zero = resultFor(passRate, 0, {
      denominator: { numerator: 0, denominator: 0, eligiblePopulation: "TCK checks" }
    });
    expect(metricRegistry.validateResult(zero).violations.map((item) => item.code)).toContain(
      "INVALID_DENOMINATOR"
    );

    const mismatch = resultFor(passRate, 0.5, {
      denominator: { numerator: 3, denominator: 4, eligiblePopulation: "TCK checks" }
    });
    expect(metricRegistry.validateResult(mismatch).violations.map((item) => item.code)).toContain(
      "DENOMINATOR_VALUE_MISMATCH"
    );
  });

  it("allows zero denominator only when the definition returns explicit missingness", () => {
    const snapshot = cloneRegistry() as any;
    const definition = snapshot.definitions.find(
      (entry: any) => entry.identity.metricId === passRate.metricId
    );
    definition.denominator.zeroDenominator = "RETURN_MISSING";
    const customRegistry = new MetricRegistry(snapshot, benchmarkRegistry);
    const result = resultFor(passRate, 0, {
      outcome: { kind: "MISSING", reason: "NOT_APPLICABLE" },
      aggregation: { method: "NONE", observedCount: 0, missingCount: 1 },
      denominator: { numerator: 0, denominator: 0, eligiblePopulation: "No eligible checks" }
    });

    expect(customRegistry.validateResult(result).valid).toBe(true);
  });

  it("rejects a value and missingness claim on the same outcome", () => {
    const conflict = resultFor(passedTests, 4, {
      outcome: { kind: "VALUE", value: 4, reason: "NOT_OBSERVED" } as any
    });

    expect(metricRegistry.validateResult(conflict).violations.map((item) => item.code)).toContain(
      "VALUE_MISSINGNESS_CONFLICT"
    );
  });

  it("rejects malformed uncertainty intervals and confidence levels", () => {
    const malformed = resultFor(meanDelta, 0.2, {
      uncertainty: {
        method: "BOOTSTRAP_INTERVAL",
        level: 1.2,
        lower: 0.4,
        upper: 0.1,
        sampleSize: 0,
        replicates: 0,
        seed: 1.5,
        assumptionsReference: ""
      }
    });

    expect(metricRegistry.validateResult(malformed).violations.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        "INVALID_UNCERTAINTY_INTERVAL",
        "INVALID_CONFIDENCE_LEVEL",
        "INVALID_UNCERTAINTY_SAMPLE",
        "INVALID_BOOTSTRAP_REPLICATES",
        "INVALID_BOOTSTRAP_SEED",
        "MISSING_UNCERTAINTY_REFERENCE"
      ])
    );
  });

  it("rejects uncertainty methods and aggregations not declared by the definition", () => {
    const invalid = resultFor(resilience, 0.7, {
      aggregation: { method: "MEAN", observedCount: 2, missingCount: 0 },
      uncertainty: {
        method: "CONFIDENCE_INTERVAL",
        level: 0.95,
        lower: 0.6,
        upper: 0.8,
        sampleSize: 10,
        assumptionsReference: "unsupported"
      }
    });

    expect(metricRegistry.validateResult(invalid).violations.map((item) => item.code)).toEqual(
      expect.arrayContaining(["AGGREGATION_MISMATCH", "UNSUPPORTED_UNCERTAINTY"])
    );
  });

  it("rejects evaluator substitution and missing provenance", () => {
    const invalid = resultFor(passedTests, 4, {
      provenanceReference: "",
      computation: {
        computationId: "computation-1",
        evaluatorId: "unregistered-evaluator",
        inputReferences: [],
        parameters: {}
      }
    });

    expect(metricRegistry.validateResult(invalid).violations.map((item) => item.code)).toEqual(
      expect.arrayContaining(["EVALUATOR_MISMATCH", "MISSING_RESULT_PROVENANCE"])
    );
  });

  it("rejects missing observations when the metric policy says REJECT", () => {
    const missing: MetricObservation = {
      observationId: "missing",
      metricIdentity: passedTests,
      benchmarkBinding: metricRegistry.get(passedTests)!.benchmarkBinding,
      outcome: { kind: "MISSING", reason: "EVALUATOR_FAILURE" },
      provenanceReference: "trace:missing"
    };

    expect(() =>
      metricRegistry.aggregate(passedTests, [missing], {
        resultId: "rejected-missing",
        uncertainty: { method: "NONE" },
        computation: {
          computationId: "tck-1",
          evaluatorId: "SandboxTCK.runSuite",
          inputReferences: ["trace:missing"],
          parameters: {}
        },
        evidenceReferences: [],
        provenanceReference: "run:missing"
      })
    ).toThrow(/rejects missing observations/);
  });

  it("rejects invalid observations before aggregation", () => {
    expect(() =>
      metricRegistry.aggregate(passedTests, [observation(passedTests, "bad", -1)], {
        resultId: "bad-count",
        uncertainty: { method: "NONE" },
        computation: {
          computationId: "tck-2",
          evaluatorId: "SandboxTCK.runSuite",
          inputReferences: ["trace:bad"],
          parameters: {}
        },
        evidenceReferences: [],
        provenanceReference: "run:bad"
      })
    ).toThrow(MetricResultValidationError);
  });
});

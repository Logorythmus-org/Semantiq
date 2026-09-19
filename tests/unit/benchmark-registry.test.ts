import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  BenchmarkRegistryValidationError,
  CANONICAL_BENCHMARK_REGISTRY,
  benchmarkIdentityKey,
  validateBenchmarkRegistry,
  type BenchmarkIdentity,
  type CanonicalBenchmarkRegistrySnapshot
} from "../../packages/benchmark/src/index.js";
import { PRODUCT_CONTRACTS_SCHEMA_VERSION } from "../../packages/sandbox-contracts/src/index.js";
import { SEMANTIQ_RELEASE_VERSION } from "../../packages/semantiq/src/version.js";

const providerTck: BenchmarkIdentity = {
  benchmarkId: "provider_tck",
  benchmarkVersion: "0.1.0"
};
const longHorizon: BenchmarkIdentity = {
  benchmarkId: "long_horizon",
  benchmarkVersion: "0.1.0"
};
const currentHacs: BenchmarkIdentity = {
  benchmarkId: "bmk_hacs_agent_resilience",
  benchmarkVersion: "1.0.0"
};
const historicalHacs: BenchmarkIdentity = {
  benchmarkId: "historical_hacs_human_ai_comparative",
  benchmarkVersion: "0.1.0"
};

function cloneRegistry(): CanonicalBenchmarkRegistrySnapshot {
  return structuredClone(CANONICAL_BENCHMARK_REGISTRY);
}

function violationCodes(snapshot: CanonicalBenchmarkRegistrySnapshot): readonly string[] {
  return validateBenchmarkRegistry(snapshot).violations.map((violation) => violation.code);
}

describe("canonical benchmark registry", () => {
  it("loads deterministically with unique identities and stable serialization", () => {
    const first = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
    const second = new BenchmarkRegistry(cloneRegistry());

    expect(first.list()).toHaveLength(5);
    expect(new Set(first.list().map((entry) => benchmarkIdentityKey(entry.identity))).size).toBe(5);
    expect(first.serialize()).toBe(second.serialize());
    expect(first.digest()).toBe(second.digest());
    expect(first.digest()).toMatch(/^[a-f0-9]{64}$/);
  });

  it("resolves exact identities, unambiguous legacy IDs, and the explicit HACS collision", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);

    expect(registry.get(currentHacs)?.name).toContain("agent-resilience");
    expect(registry.resolveAlias("bmk_hacs_evaluation_v1")).toHaveLength(1);
    expect(registry.resolveAlias("HACS").map((entry) => entry.identity)).toEqual(
      expect.arrayContaining([currentHacs, historicalHacs])
    );
  });

  it("preserves S-01 truth for the representative migration", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);

    expect(registry.get(providerTck)).toMatchObject({
      implementationState: "EXECUTABLE",
      scientificMaturity: "UNVALIDATED_PROXY",
      lifecycleState: "ACTIVE"
    });
    expect(registry.get(longHorizon)).toMatchObject({
      implementationState: "EXECUTABLE",
      scientificMaturity: "UNVALIDATED_PROXY"
    });
    expect(registry.get(currentHacs)).toMatchObject({
      implementationState: "SCAFFOLDED",
      scientificMaturity: "SYNTHETIC_ONLY"
    });
    expect(registry.get(historicalHacs)).toMatchObject({
      implementationState: "CONCEPT_ONLY",
      scientificMaturity: "NOT_ESTABLISHED",
      provenance: { temporalStatus: "HISTORICAL" }
    });
  });

  it("derives maturity from evidence-bearing axes without treating software tests as validation", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);

    expect(registry.deriveMaturity(providerTck)).toBe("M2");
    expect(registry.deriveMaturity(longHorizon)).toBe("M2");
    expect(registry.deriveMaturity(currentHacs)).toBe("M1");
    expect(registry.deriveMaturity(historicalHacs)).toBe("M0");
    expect(registry.get(providerTck)?.evidence.tests.length).toBeGreaterThan(0);
    expect(registry.get(providerTck)?.scientificMaturity).not.toBe("VALIDATED");
  });

  it("keeps executable status compatible with unvalidated scientific maturity", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
    const entry = registry.get(longHorizon);

    expect(entry?.implementationState).toBe("EXECUTABLE");
    expect(entry?.scientificMaturity).toBe("UNVALIDATED_PROXY");
  });

  it("rejects duplicate identities, invalid versions, and unresolved family or construct IDs", () => {
    const duplicate = cloneRegistry() as any;
    duplicate.benchmarks.push(structuredClone(duplicate.benchmarks[0]));
    expect(violationCodes(duplicate)).toContain("DUPLICATE_BENCHMARK_IDENTITY");

    const invalid = cloneRegistry() as any;
    invalid.benchmarks[0].identity.benchmarkVersion = "package-current";
    invalid.benchmarks[0].familyId = "missing-family";
    invalid.benchmarks[0].constructIds = ["missing-construct"];
    expect(violationCodes(invalid)).toEqual(
      expect.arrayContaining(["INVALID_BENCHMARK_VERSION", "UNKNOWN_FAMILY", "UNKNOWN_CONSTRUCT"])
    );
  });

  it("rejects silent historical/current alias conflation", () => {
    const snapshot = cloneRegistry() as any;
    const historical = snapshot.benchmarks.find(
      (entry: any) => entry.identity.benchmarkId === historicalHacs.benchmarkId
    );
    historical.aliases.find((alias: any) => alias.value === "HACS").kind = "LEGACY_NAME";

    expect(violationCodes(snapshot)).toContain("SILENT_ALIAS_COLLISION");
  });

  it("requires explicit calibration and validation evidence for VALIDATED", () => {
    const missing = cloneRegistry() as any;
    missing.benchmarks[0].scientificMaturity = "VALIDATED";
    expect(violationCodes(missing)).toEqual(
      expect.arrayContaining([
        "SCIENTIFIC_MATURITY_REQUIRES_REPRODUCIBILITY",
        "MISSING_CALIBRATION_EVIDENCE",
        "MISSING_VALIDATION_EVIDENCE"
      ])
    );

    missing.benchmarks[0].implementationState = "REPRODUCIBLE";
    missing.benchmarks[0].evidence.reproducibility = ["evidence/reproduction.json"];
    missing.benchmarks[0].evidence.calibration = ["evidence/calibration.json"];
    missing.benchmarks[0].evidence.validation = ["evidence/validation.json"];
    expect(violationCodes(missing)).not.toEqual(
      expect.arrayContaining([
        "SCIENTIFIC_MATURITY_REQUIRES_REPRODUCIBILITY",
        "MISSING_CALIBRATION_EVIDENCE",
        "MISSING_VALIDATION_EVIDENCE"
      ])
    );
  });

  it("requires VALIDATED maturity and explicit promotion evidence for Core", () => {
    const snapshot = cloneRegistry() as any;
    snapshot.benchmarks[0].corePromotion = "PROMOTED";
    expect(violationCodes(snapshot)).toEqual(
      expect.arrayContaining(["CORE_REQUIRES_VALIDATION", "MISSING_PROMOTION_EVIDENCE"])
    );

    const promotedWithoutValidation = cloneRegistry() as any;
    promotedWithoutValidation.benchmarks[0].corePromotion = "PROMOTED";
    promotedWithoutValidation.benchmarks[0].evidence.promotion = ["governance/core-promotion.json"];
    expect(() => new BenchmarkRegistry(promotedWithoutValidation)).toThrow(
      BenchmarkRegistryValidationError
    );
  });

  it("uses a separate scientific promotion path with evidence gates", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
    const calibrationRequired = registry.promoteScientificMaturity(
      longHorizon,
      "CALIBRATION_REQUIRED",
      []
    );

    expect(calibrationRequired.get(longHorizon)?.lifecycleState).toBe("ACTIVE");
    expect(calibrationRequired.get(longHorizon)?.scientificMaturity).toBe("CALIBRATION_REQUIRED");
    expect(() =>
      calibrationRequired.promoteScientificMaturity(longHorizon, "CALIBRATED", [])
    ).toThrow(BenchmarkRegistryValidationError);
  });

  it("enforces lifecycle transitions without changing scientific maturity", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
    const deprecated = registry.transitionLifecycle(longHorizon, "DEPRECATED");
    const retired = deprecated.transitionLifecycle(longHorizon, "RETIRED");

    expect(retired.get(longHorizon)?.lifecycleState).toBe("RETIRED");
    expect(retired.get(longHorizon)?.scientificMaturity).toBe("UNVALIDATED_PROXY");
    expect(retired.get(longHorizon)).toBeDefined();
    expect(() => retired.transitionLifecycle(longHorizon, "ACTIVE")).toThrow(
      /Invalid lifecycle transition/
    );
  });

  it("rejects broken, self-referential, and cyclic supersession", () => {
    const broken = cloneRegistry() as any;
    broken.benchmarks[0].supersedes = [{ benchmarkId: "missing", benchmarkVersion: "0.1.0" }];
    expect(violationCodes(broken)).toContain("BROKEN_SUPERSESSION");

    const self = cloneRegistry() as any;
    self.benchmarks[0].supersedes = [structuredClone(self.benchmarks[0].identity)];
    expect(violationCodes(self)).toContain("SELF_SUPERSESSION");

    const cycle = cloneRegistry() as any;
    cycle.benchmarks[0].supersedes = [structuredClone(cycle.benchmarks[1].identity)];
    cycle.benchmarks[1].supersedes = [structuredClone(cycle.benchmarks[0].identity)];
    expect(violationCodes(cycle)).toContain("SUPERSESSION_CYCLE");
  });

  it("validates evaluator bindings and human-role declarations", () => {
    const evaluator = cloneRegistry() as any;
    evaluator.benchmarks[0].evaluatorRequirements[0].evaluatorId = undefined;
    evaluator.benchmarks[0].evaluatorRequirements[0].evidenceReferences = [];
    expect(violationCodes(evaluator)).toContain("INVALID_EVALUATOR_BINDING");

    const human = cloneRegistry() as any;
    human.benchmarks[3].humanRoles[0] = {
      role: "HUMAN_AS_SUBJECT",
      status: "IMPLEMENTED",
      evidenceReferences: []
    };
    expect(violationCodes(human)).toContain("INVALID_HUMAN_ROLE_BINDING");
  });

  it("rejects unsupported state, evaluator, and human-role values at runtime", () => {
    const snapshot = cloneRegistry() as any;
    snapshot.benchmarks[0].lifecycleState = "DELETED";
    snapshot.benchmarks[0].evaluatorRequirements[0].mechanism = "MAGIC_JUDGE";
    snapshot.benchmarks[0].humanRoles = [
      { role: "HUMAN_AS_ORACLE", status: "INTENDED", evidenceReferences: [] }
    ];

    expect(violationCodes(snapshot)).toEqual(
      expect.arrayContaining([
        "INVALID_LIFECYCLE_STATE",
        "UNSUPPORTED_EVALUATOR",
        "UNSUPPORTED_HUMAN_ROLE"
      ])
    );
  });

  it("keeps supported evaluator mechanisms distinct from implemented bindings", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
    const historical = registry.get(historicalHacs);

    expect(
      historical?.evaluatorRequirements.every(
        (item) => item.bindingStatus === "SUPPORTED_BY_SCHEMA"
      )
    ).toBe(true);
    expect(historical?.humanRoles.every((item) => item.status === "INTENDED")).toBe(true);
  });

  it("keeps benchmark versions distinct from software and contract-schema versions", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
    const entry = registry.get(providerTck);

    expect(entry?.versionScope).toBe("BENCHMARK");
    expect(SEMANTIQ_RELEASE_VERSION).toBe("0.1.0-alpha.2");
    expect(PRODUCT_CONTRACTS_SCHEMA_VERSION).toBe("1.0.0");
    expect(entry?.identity.benchmarkVersion).toBe("0.1.0");
  });

  it("uses repository-relative evidence references that resolve for migrated entries", () => {
    const registry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
    const references = registry
      .list()
      .flatMap((entry) => [
        ...entry.provenance.sourceReferences,
        ...entry.evidence.implementation,
        ...entry.evidence.tests,
        ...entry.evaluatorRequirements.flatMap((requirement) => requirement.evidenceReferences)
      ]);

    expect(references.length).toBeGreaterThan(0);
    expect(
      references.every((reference) => !reference.startsWith("/") && existsSync(reference))
    ).toBe(true);
  });
});

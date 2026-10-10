import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  semanticCoreMetricsFor,
  runSemanticCorePilot,
  SEMANTIC_CORE_DIMENSIONS,
  SEMANTIC_CORE_STATES,
  SEMANTIC_CORE_METRICS,
  SEMANTIC_CORE_METRIC_DEFINITIONS,
  SEMANTIC_CORE_BENCHMARK,
  SEMANTIC_CORE_BENCHMARK_DEFINITION
} from "../../packages/benchmark/src/index.js";
import type {
  SemanticCoreCase,
  SemanticCoreCaseResult
} from "../../packages/benchmark/src/index.js";

const digest = "a".repeat(64);
const result = (state: SemanticCoreCaseResult["state"], index: number): SemanticCoreCaseResult => ({
  caseId: `offline-${index}`,
  dimensionId: SEMANTIC_CORE_DIMENSIONS[index % 3]!,
  state,
  scientificAuthority: "NONE"
});

describe("independent Semantic Core metric aggregation", () => {
  it("isolates identities, bindings and nested benchmarks from canonical state and other results", () => {
    const cases = [result("PASSED", 0), result("INCORRECT", 1)];
    const canonicalBefore = structuredClone({
      metrics: SEMANTIC_CORE_METRICS,
      definitions: SEMANTIC_CORE_METRIC_DEFINITIONS,
      benchmark: SEMANTIC_CORE_BENCHMARK,
      benchmarkDefinition: SEMANTIC_CORE_BENCHMARK_DEFINITION
    });
    const first = semanticCoreMetricsFor(cases, digest);
    const second = semanticCoreMetricsFor(cases, digest);
    const secondBefore = structuredClone(second);
    const untouched = structuredClone(first.slice(1));
    for (const [index, metric] of first.entries()) {
      expect(metric.metricIdentity).toEqual(SEMANTIC_CORE_METRICS[index]);
      expect(metric.metricIdentity).not.toBe(SEMANTIC_CORE_METRICS[index]);
      expect(metric.metricIdentity).not.toBe(second[index]!.metricIdentity);
      if (metric.benchmarkBinding) {
        expect(metric.benchmarkBinding).toEqual(
          SEMANTIC_CORE_METRIC_DEFINITIONS[index]!.benchmarkBinding
        );
        expect(metric.benchmarkBinding).not.toBe(
          SEMANTIC_CORE_METRIC_DEFINITIONS[index]!.benchmarkBinding
        );
        expect(metric.benchmarkBinding).not.toBe(second[index]!.benchmarkBinding);
        expect(metric.benchmarkBinding.benchmark).not.toBe(SEMANTIC_CORE_BENCHMARK);
        expect(metric.benchmarkBinding.benchmark).not.toBe(
          second[index]!.benchmarkBinding!.benchmark
        );
      }
    }
    // Exercise JavaScript consumer mutation despite compile-time readonly annotations.
    Object.assign(first[0]!.metricIdentity, { metricId: "consumer-id", metricVersion: "9.0.0" });
    expect(first.slice(1)).toEqual(untouched);
    const otherDimensions = structuredClone(first.slice(3));
    Object.assign(first[2]!.benchmarkBinding!, { constructId: "consumer-construct" });
    Object.assign(first[2]!.benchmarkBinding!.benchmark, {
      benchmarkId: "consumer-benchmark",
      benchmarkVersion: "9.0.0"
    });
    expect(first.slice(3)).toEqual(otherDimensions);
    expect(second).toEqual(secondBefore);
    expect(semanticCoreMetricsFor(cases, digest)).toEqual(secondBefore);
    expect({
      metrics: SEMANTIC_CORE_METRICS,
      definitions: SEMANTIC_CORE_METRIC_DEFINITIONS,
      benchmark: SEMANTIC_CORE_BENCHMARK,
      benchmarkDefinition: SEMANTIC_CORE_BENCHMARK_DEFINITION
    }).toEqual(canonicalBefore);
    expect(SEMANTIC_CORE_BENCHMARK_DEFINITION.scientificMaturity).toBe("UNVALIDATED_PROXY");
    expect(SEMANTIC_CORE_BENCHMARK_DEFINITION.corePromotion).toBe("NOT_PROMOTED");
  });

  it("preserves caller-attested digest text without claiming verification or making network calls", () => {
    const network = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Offline aggregation must not invoke fetch");
    });
    try {
      const cases = [Object.freeze(result("PASSED", 0))];
      // Characterize existing unchecked string handling, not a supported invalid-input guarantee.
      for (const callerDigest of [digest, "caller-attested-unverified", "", " A "]) {
        const metrics = semanticCoreMetricsFor(Object.freeze(cases), callerDigest);
        expect(
          metrics.every((metric) => metric.provenanceReference === "pack-sha256:" + callerDigest)
        ).toBe(true);
        expect(metrics.every((metric) => metric.evidenceReferences.length === 0)).toBe(true);
        expect(metrics.every((metric) => !("scientificAuthority" in metric))).toBe(true);
      }
      // B1 is aggregation, not validation: characterize preexisting row handling only.
      const duplicate = semanticCoreMetricsFor([result("PASSED", 0), result("PASSED", 0)], digest);
      expect(duplicate[0]!.outcome).toEqual({ kind: "VALUE", value: 2 });
      const unsupported = {
        ...result("PASSED", 0),
        dimensionId: "unknown"
      } as unknown as SemanticCoreCaseResult;
      const unknownDimension = semanticCoreMetricsFor([unsupported], digest);
      expect(unknownDimension[0]!.outcome).toEqual({ kind: "VALUE", value: 1 });
      expect(unknownDimension.slice(2).every((metric) => metric.outcome.kind === "MISSING")).toBe(
        true
      );
      expect(network).not.toHaveBeenCalled();
    } finally {
      network.mockRestore();
    }
  });
  it("keeps only passed/incorrect cases in denominators and does not mutate inputs", () => {
    const cases = SEMANTIC_CORE_STATES.map(result);
    const before = structuredClone(cases);
    const metrics = semanticCoreMetricsFor(
      Object.freeze(cases.map((item) => Object.freeze(item))),
      digest
    );
    expect(cases).toEqual(before);
    expect(metrics.map((metric) => metric.metricIdentity)).toEqual(SEMANTIC_CORE_METRICS);
    expect(metrics[0]!.outcome).toEqual({ kind: "VALUE", value: 2 });
    expect(metrics[1]!.outcome).toEqual({ kind: "VALUE", value: 1 });
    expect(metrics[0]!.aggregation).toEqual({ method: "NONE", observedCount: 2, missingCount: 4 });
    expect(metrics[2]!.denominator).toMatchObject({ numerator: 1, denominator: 1 });
    expect(metrics[3]!.denominator).toMatchObject({ numerator: 0, denominator: 1 });
    expect(metrics[4]!.outcome).toEqual({ kind: "MISSING", reason: "INSUFFICIENT_EVIDENCE" });
    expect(metrics.every((metric) => metric.provenanceReference === "pack-sha256:" + digest)).toBe(
      true
    );
  });

  it("preserves missing outcomes rather than creating zero-valued scores", () => {
    const cases = ["MISSING", "MALFORMED", "ABSTAINED", "SUBJECT_ERROR"].map((state, index) =>
      result(state as SemanticCoreCaseResult["state"], index)
    );
    for (const metric of semanticCoreMetricsFor(cases, digest)) {
      expect(metric.outcome).toEqual({ kind: "MISSING", reason: "INSUFFICIENT_EVIDENCE" });
      expect(metric.aggregation.observedCount).toBe(0);
    }
    expect(
      semanticCoreMetricsFor([], digest).every((metric) => metric.outcome.kind === "MISSING")
    ).toBe(true);
  });

  it("reproduces existing offline pilot metrics without network, qualification or maturity mutation", async () => {
    const pack = "fixtures/benchmark-packs/semantic-core-pilot-0.1.0";
    const manifest = JSON.parse(readFileSync(join(pack, "manifest.json"), "utf8"));
    const items: SemanticCoreCase[] = manifest.cases.map((item: { path: string }) =>
      JSON.parse(readFileSync(join(pack, item.path), "utf8"))
    );
    const network = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("Offline aggregation must not invoke fetch");
    });
    try {
      const report = await runSemanticCorePilot(pack, (input) => ({
        schemaVersion: "0.1.0",
        caseId: input.caseId,
        status: "ANSWER",
        selectedOptionId: items.find((item) => item.caseId === input.caseId)!.oracle
          .selectedOptionId
      }));
      expect(semanticCoreMetricsFor(report.cases, report.packDigest)).toEqual(report.metrics);
      expect(semanticCoreMetricsFor(report.cases, report.packDigest)).toEqual(
        semanticCoreMetricsFor(structuredClone(report.cases), report.packDigest)
      );
      expect(report.scientificAuthority).toBe("NONE");
      expect(report.evidenceKind).toBe("SYNTHETIC_ENGINEERING_ONLY");
      expect(network).not.toHaveBeenCalled();
    } finally {
      network.mockRestore();
    }
  });
});

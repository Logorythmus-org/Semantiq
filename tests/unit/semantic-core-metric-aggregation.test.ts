import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  semanticCoreMetricsFor,
  runSemanticCorePilot,
  SEMANTIC_CORE_DIMENSIONS,
  SEMANTIC_CORE_STATES,
  SEMANTIC_CORE_METRICS
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
  it("keeps only passed/incorrect cases in denominators and does not mutate inputs", () => {
    const cases = SEMANTIC_CORE_STATES.map(result);
    const before = structuredClone(cases);
    const metrics = semanticCoreMetricsFor(Object.freeze(cases), digest);
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

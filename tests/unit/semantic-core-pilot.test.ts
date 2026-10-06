import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { computeSha256 } from "../../packages/sandbox-contracts/src/index.js";
import { BenchmarkRegistry } from "../../packages/benchmark/src/registry.js";
import { MetricRegistry } from "../../packages/benchmark/src/metrics.js";
import { EvaluatorRegistry } from "../../packages/benchmark/src/evaluators.js";
import { CANONICAL_BENCHMARK_REGISTRY } from "../../packages/benchmark/src/registry-definitions.js";
import { CANONICAL_METRIC_REGISTRY } from "../../packages/benchmark/src/metric-definitions.js";
import { CANONICAL_EVALUATOR_REGISTRY } from "../../packages/benchmark/src/evaluator-definitions.js";
import {
  loadBenchmarkPack,
  benchmarkPackDigest,
  readBenchmarkPackCase
} from "../../packages/benchmark/src/benchmark-pack.js";
import {
  validateSemanticCoreCase,
  validateSemanticCoreResponse,
  evaluateSemanticCoreCase,
  runSemanticCorePilot
} from "../../packages/benchmark/src/semantic-core.js";
import {
  SEMANTIC_CORE_BENCHMARK,
  SEMANTIC_CORE_CONSTRUCTS,
  SEMANTIC_CORE_EVALUATOR,
  SEMANTIC_CORE_METRICS
} from "../../packages/benchmark/src/semantic-core-definitions.js";
import type {
  SemanticCoreCase,
  SemanticCoreInput
} from "../../packages/benchmark/src/semantic-core-types.js";
import type { BenchmarkPackManifest } from "../../packages/benchmark/src/benchmark-pack-types.js";

const root = path.resolve("fixtures/benchmark-packs/semantic-core-pilot-0.1.0");
const manifest: BenchmarkPackManifest = JSON.parse(
  readFileSync(path.join(root, "manifest.json"), "utf8")
);
const items: SemanticCoreCase[] = manifest.cases.map((c) =>
  JSON.parse(readFileSync(path.join(root, c.path), "utf8"))
);
const answer = (input: SemanticCoreInput, selectedOptionId: string) => ({
  schemaVersion: "0.1.0",
  caseId: input.caseId,
  status: "ANSWER",
  selectedOptionId
});
// Oracle-backed test adapters verify plumbing only, never subject ability.
const correct = (input: SemanticCoreInput) =>
  answer(input, items.find((c) => c.caseId === input.caseId)!.oracle.selectedOptionId);
const incorrect = (input: SemanticCoreInput) =>
  answer(
    input,
    input.options.find(
      (o) => o.optionId !== items.find((c) => c.caseId === input.caseId)!.oracle.selectedOptionId
    )!.optionId
  );
const benchmarks = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metrics = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarks);
const evaluators = new EvaluatorRegistry(CANONICAL_EVALUATOR_REGISTRY, benchmarks, metrics);

describe("Semantic Core Pilot", () => {
  it("has exactly 24 unique validated first-party cases and eight per dimension", () => {
    expect(items).toHaveLength(24);
    expect(new Set(items.map((c) => c.caseId)).size).toBe(24);
    for (const d of ["meaning_context", "epistemic_boundary", "bias_resistance"])
      expect(items.filter((c) => c.dimensionId === d)).toHaveLength(8);
    for (const c of items) {
      expect(validateSemanticCoreCase(c)).toBe(true);
      expect(c.provenance).toBe("NEW_SYNTHETIC_FIRST_PARTY_AI_AUTHORED");
    }
  });
  it("rejects invalid schemas, oracle identities, duplicate options and governance fields", () => {
    const c = items[0]!;
    for (const bad of [
      { ...c, schemaVersion: "2" },
      { ...c, oracle: { selectedOptionId: "absent" } },
      { ...c, options: [c.options[0], c.options[0]] },
      { ...c, maturity: "BM3" },
      { ...c, dimensionId: "other" },
      { ...c, hiddenReasoning: "required" }
    ])
      expect(validateSemanticCoreCase(bad)).toBe(false);
    expect(
      validateSemanticCoreResponse({
        schemaVersion: "0.1.0",
        caseId: c.caseId,
        status: "ANSWER",
        selectedOptionId: c.oracle.selectedOptionId,
        confidence: 1
      })
    ).toBe(false);
  });
  it("distinguishes passed, incorrect, missing, malformed, mismatched and abstained responses exactly", () => {
    const c = items[0]!;
    expect(evaluateSemanticCoreCase(c, correct(c)).state).toBe("PASSED");
    expect(evaluateSemanticCoreCase(c, incorrect(c)).state).toBe("INCORRECT");
    expect(evaluateSemanticCoreCase(c, undefined).state).toBe("MISSING");
    for (const bad of [
      null,
      {},
      "ANSWER",
      answer(c, "absent"),
      answer(c, c.oracle.selectedOptionId.toUpperCase()),
      { ...correct(c), caseId: "other" },
      {
        schemaVersion: "0.1.0",
        caseId: c.caseId,
        status: "ABSTAIN",
        selectedOptionId: c.oracle.selectedOptionId
      }
    ])
      expect(evaluateSemanticCoreCase(c, bad).state).toBe("MALFORMED");
    expect(
      evaluateSemanticCoreCase(c, { schemaVersion: "0.1.0", caseId: c.caseId, status: "ABSTAIN" })
        .state
    ).toBe("ABSTAINED");
    const getter = {
      get status() {
        throw new Error("must not run");
      }
    };
    expect(evaluateSemanticCoreCase(c, getter).state).toBe("MALFORMED");
    const insufficient = items.find((c) => c.oracle.selectedOptionId === "insufficient_evidence")!;
    expect(evaluateSemanticCoreCase(insufficient, correct(insufficient)).state).toBe("PASSED");
  });
  it("binds canonical registries conservatively with scientific authority NONE", () => {
    const b = benchmarks.get(SEMANTIC_CORE_BENCHMARK)!;
    expect(b.constructIds).toEqual(SEMANTIC_CORE_CONSTRUCTS);
    expect(b.implementationState).toBe("EXECUTABLE");
    expect(b.scientificMaturity).toBe("UNVALIDATED_PROXY");
    expect(b.corePromotion).toBe("NOT_PROMOTED");
    expect(b.evidence.validation).toEqual([]);
    expect(b.evidence.reproducibility).toEqual([]);
    const e = evaluators.get(SEMANTIC_CORE_EVALUATOR)!;
    expect(e.scientificAuthority).toBe("NONE");
    expect(e.metricBindings).toEqual(SEMANTIC_CORE_METRICS);
    for (const id of SEMANTIC_CORE_METRICS)
      expect(metrics.get(id)?.validity.status).toBe("REQUIRED_NOT_VALIDATED");
  });
  it("admits the governed pack and executes deterministically without registry mutation or oracle leakage", async () => {
    const before = JSON.stringify([
      CANONICAL_BENCHMARK_REGISTRY,
      CANONICAL_METRIC_REGISTRY,
      CANONICAL_EVALUATOR_REGISTRY
    ]);
    const loaded = await loadBenchmarkPack(root);
    expect(loaded.admission.status).toBe("ADMISSIBLE");
    expect(loaded.verifiedCases).toHaveLength(24);
    expect(loaded.packDigest).toEqual(benchmarkPackDigest(manifest));
    const report = await runSemanticCorePilot(root, (input) => {
      expect(input).not.toHaveProperty("oracle");
      return correct(input);
    });
    expect(report).toEqual(await runSemanticCorePilot(root, correct));
    expect(report.stateCounts.PASSED).toBe(24);
    expect(report.metrics.map((m) => m.outcome)).toEqual(
      [24, 24, 1, 1, 1].map((value) => ({ kind: "VALUE", value }))
    );
    for (const m of report.metrics)
      expect(metrics.validateResult(m)).toEqual({ valid: true, violations: [] });
    expect(
      JSON.stringify([
        CANONICAL_BENCHMARK_REGISTRY,
        CANONICAL_METRIC_REGISTRY,
        CANONICAL_EVALUATOR_REGISTRY
      ])
    ).toBe(before);
    expect((await runSemanticCorePilot(root, incorrect)).stateCounts.INCORRECT).toBe(24);
  });
  it("excludes missing, malformed, abstained and subject errors from each denominator and reports them", async () => {
    const report = await runSemanticCorePilot(root, (input) => {
      const index = items.findIndex((c) => c.caseId === input.caseId) % 8;
      if (index === 0) return undefined;
      if (index === 1) return {};
      if (index === 2) return { schemaVersion: "0.1.0", caseId: input.caseId, status: "ABSTAIN" };
      if (index === 3) throw new Error("synthetic subject failure");
      return index === 4 ? incorrect(input) : correct(input);
    });
    expect(report.stateCounts).toEqual({
      PASSED: 9,
      INCORRECT: 3,
      MISSING: 3,
      MALFORMED: 3,
      ABSTAINED: 3,
      SUBJECT_ERROR: 3
    });
    expect(report.metrics.slice(2).map((m) => m.denominator)).toEqual(
      ["meaning_context", "epistemic_boundary", "bias_resistance"].map((d) => ({
        numerator: 3,
        denominator: 4,
        eligiblePopulation: "eligible evaluated cases: PASSED or INCORRECT within " + d
      }))
    );
    for (const m of report.metrics) expect(metrics.validateResult(m).valid).toBe(true);
    const empty = await runSemanticCorePilot(root, () => undefined);
    expect(empty.metrics.slice(2).every((m) => m.outcome.kind === "MISSING")).toBe(true);
    for (const m of empty.metrics) expect(metrics.validateResult(m).valid).toBe(true);
    expect(JSON.stringify(empty)).not.toMatch(/NaN|Infinity/);
  });
  it("fails closed on tampering, changed identity, unsafe paths and invalid admitted payloads", async () => {
    const temp = await mkdtemp(path.join(tmpdir(), "semantic-core-"));
    try {
      await cp(root, temp, { recursive: true });
      const ref = manifest.cases[0]!;
      await writeFile(path.join(temp, ref.path), "{}");
      expect((await loadBenchmarkPack(temp)).admission.status).toBe("BLOCKED");
      await expect(readBenchmarkPackCase(temp, ref)).rejects.toThrow("FIXTURE_DIGEST_MISMATCH");
      await expect(runSemanticCorePilot(temp, correct)).rejects.toThrow();
      const changed = structuredClone(manifest);
      (changed.cases[0]!.digest as { value: string }).value = computeSha256("{}");
      expect(benchmarkPackDigest(changed)).not.toEqual(benchmarkPackDigest(manifest));
      await writeFile(path.join(temp, "manifest.json"), JSON.stringify(changed));
      expect((await loadBenchmarkPack(temp)).admission.status).toBe("ADMISSIBLE");
      await expect(runSemanticCorePilot(temp, correct)).rejects.toThrow("Invalid pilot payload");
      await expect(readBenchmarkPackCase(temp, { ...ref, path: "../LICENSE" })).rejects.toThrow(
        "UNSAFE_PATH"
      );
      await cp(root, temp, { recursive: true });
      const identity = structuredClone(items[0]!);
      (identity as any).caseId = "wrong_identity";
      const bytes = JSON.stringify(identity);
      await writeFile(path.join(temp, ref.path), bytes);
      (changed.cases[0]!.digest as { value: string }).value = computeSha256(bytes);
      await writeFile(path.join(temp, "manifest.json"), JSON.stringify(changed));
      await expect(runSemanticCorePilot(temp, correct)).rejects.toThrow("case identity");
    } finally {
      await rm(temp, { recursive: true, force: true });
    }
  });
  it("bounds public maturity and historical ancestry separately from internal M levels", () => {
    for (const file of ["Docs/benchmarks/README.md", "Docs/benchmarks/BENCHMARK_LIFECYCLE.md"]) {
      const text = readFileSync(file, "utf8");
      expect(text).toMatch(/Semantic Core Pilot.*BM2/);
      expect(text).toMatch(/SMF Benchmark Suite.*BM0/);
    }
    const spec = readFileSync("Docs/benchmarks/SEMANTIC_CORE_PILOT.md", "utf8");
    expect(spec).toContain("does not implement the complete historical SMF/WIF/CBF suites");
    expect(spec).toContain("Internal M-level ≠ Public BM-level");
    expect(spec).toContain("BM3 is not established");
    expect(spec).toContain("No hidden chain-of-thought");
  });
});

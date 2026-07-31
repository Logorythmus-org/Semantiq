import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  importExternalBenchmark,
  queryBenchmarkRegistry,
  validateExternalBenchmarkPack,
  type EcosystemRegistryEntry,
  type ExternalBenchmarkPack
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.7 — External Benchmark Ecosystem Verification", () => {
  it("validates third-party benchmark pack structures", () => {
    const validPack: ExternalBenchmarkPack = {
      id: "test-pack",
      title: "Test Ecosystem Pack",
      version: "1.0.0",
      author: "Test Author",
      license: "CC0-1.0",
      subjects: [
        {
          id: "sub_1",
          kind: "question",
          version: "1.0.0",
          title: "Title 1",
          content: "Content 1",
          contextIds: [],
          evidenceIds: []
        }
      ]
    };

    const res = validateExternalBenchmarkPack(validPack);
    expect(res.valid).toBe(true);
  });

  it("queries ecosystem registry entries", () => {
    const entries: readonly EcosystemRegistryEntry[] = [
      { id: "pack-a", title: "Reasoning Benchmark", version: "1.0", author: "A", url: "http://a" },
      { id: "pack-b", title: "Math Benchmark", version: "1.0", author: "B", url: "http://b" }
    ];

    const results = queryBenchmarkRegistry(entries, "Reasoning");
    expect(results).toHaveLength(1);
    expect(results[0]?.id).toEqual("pack-a");
  });

  it("imports external benchmark formats (MMLU/GSM8K/HELM)", () => {
    const rawItems = [{ question: "What is 2+2?", id: "q1" }];
    const subjects = importExternalBenchmark("gsm8k", rawItems);
    expect(subjects).toHaveLength(1);
    expect(subjects[0]?.id).toEqual("q1");
    expect(subjects[0]?.title).toEqual("What is 2+2?");
  });

  it("verifies ecosystem files on disk", () => {
    expect(existsSync("examples/ecosystem/benchmark-registry.json")).toBe(true);
    expect(existsSync("examples/ecosystem/external-benchmark-pack.json")).toBe(true);
    expect(existsSync("Docs/EXTERNAL_BENCHMARK_ECOSYSTEM.md")).toBe(true);
    expect(existsSync("Docs/ECOSYSTEM_INTEGRATION_REPORT.md")).toBe(true);

    const jsonStr = readFileSync("examples/ecosystem/external-benchmark-pack.json", "utf-8");
    const json = JSON.parse(jsonStr) as { id: string };
    expect(json.id).toEqual("external-reasoning-pack");
  });
});

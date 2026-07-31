import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatKaggleDataset,
  generateKaggleDatasetMetadata,
  type BenchmarkSubject
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.4 — Kaggle Integration Verification", () => {
  it("converts BenchmarkSubject items to Kaggle dataset format", () => {
    const subjects: readonly BenchmarkSubject[] = [
      {
        id: "kg_sub_001",
        kind: "question",
        version: "1.0.0",
        title: "Kaggle Subject Test",
        content: "Explainable benchmark testing for Kaggle.",
        contextIds: [],
        evidenceIds: ["ev_1", "ev_2"]
      }
    ];

    const records = formatKaggleDataset(subjects);
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toEqual("kg_sub_001");
    expect(records[0]?.evidence_count).toEqual(2);
  });

  it("generates compliant Kaggle dataset-metadata.json structures", () => {
    const meta = generateKaggleDatasetMetadata("test-dataset", "Test Title", "CC0-1.0");
    expect(meta.id).toEqual("techclub/test-dataset");
    expect(meta.licenses[0]?.name).toEqual("CC0-1.0");
  });

  it("verifies Kaggle files exist on disk", () => {
    expect(existsSync("examples/kaggle/dataset-metadata.json")).toBe(true);
    expect(existsSync("examples/kaggle/semantiq_starter.py")).toBe(true);
    expect(existsSync("Docs/KAGGLE_GUIDE.md")).toBe(true);
    expect(existsSync("Docs/KAGGLE_INTEGRATION_REPORT.md")).toBe(true);

    const jsonStr = readFileSync("examples/kaggle/dataset-metadata.json", "utf-8");
    const json = JSON.parse(jsonStr) as { id: string };
    expect(json.id).toContain("techclub/");
  });
});

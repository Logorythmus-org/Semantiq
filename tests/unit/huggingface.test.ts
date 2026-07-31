import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatHuggingFaceDataset,
  generateHuggingFaceDatasetCard,
  type BenchmarkSubject
} from "../../packages/semantiq/src/index.js";

describe("Prompt 7.3 — Hugging Face Integration Verification", () => {
  it("converts BenchmarkSubject items to Hugging Face dataset format", () => {
    const subjects: readonly BenchmarkSubject[] = [
      {
        id: "hf_sub_001",
        kind: "question",
        version: "1.0.0",
        title: "Test HF Subject",
        content: "What is explainable evaluation?",
        contextIds: [],
        evidenceIds: ["ev_1"]
      }
    ];

    const records = formatHuggingFaceDataset(subjects);
    expect(records).toHaveLength(1);
    expect(records[0]?.id).toEqual("hf_sub_001");
    expect(records[0]?.evidence_ids).toContain("ev_1");
  });

  it("generates valid Hugging Face dataset card YAML frontmatter", () => {
    const card = generateHuggingFaceDatasetCard("SemantIQ Test Pack", "cc0-1.0");
    expect(card).toContain("pretty_name: SemantIQ Test Pack");
    expect(card).toContain("license:\n- cc0-1.0");
  });

  it("verifies Hugging Face dataset card file on disk", () => {
    expect(existsSync("Docs/HUGGINGFACE_DATASET_CARD.md")).toBe(true);
    expect(existsSync("Docs/HUGGINGFACE_GUIDE.md")).toBe(true);
    expect(existsSync("Docs/HUGGINGFACE_PUBLICATION_REPORT.md")).toBe(true);
  });
});

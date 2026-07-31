import type { BenchmarkReport, BenchmarkSubject } from "./contracts.js";

export interface HuggingFaceDatasetRecord {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly kind: string;
  readonly version: string;
  readonly evidence_ids: readonly string[];
}

export function formatHuggingFaceDataset(subjects: readonly BenchmarkSubject[]): readonly HuggingFaceDatasetRecord[] {
  return subjects.map((sub) => ({
    id: sub.id,
    title: sub.title ?? sub.id,
    content: typeof sub.content === "string" ? sub.content : JSON.stringify(sub.content),
    kind: sub.kind,
    version: sub.version,
    evidence_ids: sub.evidenceIds
  }));
}

export function generateHuggingFaceDatasetCard(datasetName: string, license: string = "cc0-1.0"): string {
  return `---
annotations_creators:
- synthetic
language_creators:
- expert-generated
language:
- en
license:
- ${license}
multilinguality:
- monolingual
size_categories:
- n<1K
source_datasets:
- original
task_categories:
- evaluation
- question-answering
task_ids:
- evaluation-benchmarks
pretty_name: ${datasetName}
dataset_info:
  features:
  - name: id
    dtype: string
  - name: title
    dtype: string
  - name: content
    dtype: string
  - name: kind
    dtype: string
  - name: version
    dtype: string
  - name: evidence_ids
    sequence: string
---

# ${datasetName}

This dataset is an open evaluation benchmark pack for **SemantIQ Benchmarks**.
Released under the **${license.toUpperCase()}** open data license.
`;
}

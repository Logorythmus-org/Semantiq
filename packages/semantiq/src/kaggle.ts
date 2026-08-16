import type { BenchmarkSubject } from "./contracts.js";

export interface KaggleDatasetMetadata {
  readonly title: string;
  readonly id: string;
  readonly licenses: readonly { readonly name: string }[];
}

export interface KaggleDatasetRecord {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly content: string;
  readonly evidence_count: number;
}

export function formatKaggleDataset(
  subjects: readonly BenchmarkSubject[]
): readonly KaggleDatasetRecord[] {
  return subjects.map((sub) => ({
    id: sub.id,
    title: sub.title ?? sub.id,
    kind: sub.kind,
    content: typeof sub.content === "string" ? sub.content : JSON.stringify(sub.content),
    evidence_count: sub.evidenceIds.length
  }));
}

export function generateKaggleDatasetMetadata(
  slug: string,
  title: string,
  license: string = "CC0-1.0"
): KaggleDatasetMetadata {
  return {
    title,
    id: `techclub/${slug}`,
    licenses: [{ name: license }]
  };
}

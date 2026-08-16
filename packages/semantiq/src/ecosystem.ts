import type { BenchmarkSubject } from "./contracts.js";

export interface ExternalBenchmarkPack {
  readonly id: string;
  readonly title: string;
  readonly version: string;
  readonly author: string;
  readonly license: string;
  readonly subjects: readonly BenchmarkSubject[];
}

export interface EcosystemRegistryEntry {
  readonly id: string;
  readonly title: string;
  readonly version: string;
  readonly author: string;
  readonly url: string;
}

export function validateExternalBenchmarkPack(pack: ExternalBenchmarkPack): {
  valid: boolean;
  errors: readonly string[];
} {
  const errors: string[] = [];
  if (!pack.id) errors.push("id is required");
  if (!pack.title) errors.push("title is required");
  if (!pack.version) errors.push("version is required");
  if (!pack.subjects || pack.subjects.length === 0)
    errors.push("subjects must contain at least one item");
  return { valid: errors.length === 0, errors };
}

export function queryBenchmarkRegistry(
  entries: readonly EcosystemRegistryEntry[],
  query: string
): readonly EcosystemRegistryEntry[] {
  const q = query.toLowerCase();
  return entries.filter((e) => e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
}

export function importExternalBenchmark(
  externalFormat: "mmlu" | "gsm8k" | "helm" | "generic",
  rawItems: readonly Record<string, unknown>[]
): readonly BenchmarkSubject[] {
  return rawItems.map((item, idx) => ({
    id: (item["id"] as string) ?? `ext_${externalFormat}_${idx + 1}`,
    kind: "question",
    version: "1.0.0",
    title:
      (item["question"] as string) ?? (item["title"] as string) ?? `External Subject ${idx + 1}`,
    content: (item["question"] as string) ?? (item["content"] as string) ?? JSON.stringify(item),
    contextIds: [],
    evidenceIds: []
  }));
}

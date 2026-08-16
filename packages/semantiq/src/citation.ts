export interface CitationAuthor {
  readonly familyNames?: string;
  readonly givenNames?: string;
  readonly name?: string;
  readonly orcid?: string;
}

export interface CitationMetadata {
  readonly cffVersion: "1.2.0";
  readonly title: string;
  readonly version: string;
  readonly dateReleased: string;
  readonly repositoryCode: string;
  readonly license: string;
  readonly authors: readonly CitationAuthor[];
  readonly abstract?: string;
}

export function formatBibtexCitation(meta: CitationMetadata): string {
  const authorStr = meta.authors
    .map((a) => a.name ?? `${a.givenNames ?? ""} ${a.familyNames ?? ""}`.trim())
    .join(" and ");
  const year = meta.dateReleased.slice(0, 4);

  return `@software{semantiq_benchmarks_${year},
  author       = {${authorStr}},
  title        = {${meta.title}},
  version      = {${meta.version}},
  year         = {${year}},
  url          = {${meta.repositoryCode}},
  license      = {${meta.license}}
}`;
}

export function formatApaCitation(meta: CitationMetadata): string {
  const authorStr = meta.authors
    .map((a) => a.name ?? `${a.familyNames}, ${a.givenNames?.slice(0, 1)}.`[0])
    .join(", ");
  const year = meta.dateReleased.slice(0, 4);

  return `${authorStr} (${year}). ${meta.title} (Version ${meta.version}) [Computer software]. ${meta.repositoryCode}`;
}

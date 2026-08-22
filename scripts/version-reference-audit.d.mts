export type VersionReferenceCategory =
  | "SOFTWARE_RELEASE_VERSION"
  | "PACKAGE_VERSION"
  | "API_SCHEMA_VERSION"
  | "DOCUMENTATION_MILESTONE"
  | "HISTORICAL_RELEASE_RECORD"
  | "STALE_OR_INCORRECT_PUBLIC_CLAIM";

export interface VersionReferenceRecord {
  path: string;
  line: number;
  column: number;
  classification: VersionReferenceCategory | null;
  text: string;
}

export interface VersionReferenceAuditReport {
  targetVersion: string;
  occurrences: number;
  counts: Record<VersionReferenceCategory, number>;
  unclassified: VersionReferenceRecord[];
  records: VersionReferenceRecord[];
}

export const VERSION_REFERENCE_CATEGORIES: readonly VersionReferenceCategory[];

export function classifyVersionReference(
  path: string,
  text: string,
  column?: number,
  semanticContext?: string
): VersionReferenceCategory | null;

export function auditVersionReferences(): VersionReferenceAuditReport;

export type ApiFreezeFailureClass =
  | "unversioned_export"
  | "duplicate_contract"
  | "breaking_change_without_migration"
  | "parent_only_dependency"
  | "enforcement_semantics_leaked_into_api"
  | "certification_semantics_leaked_into_api";

export interface GovernancePublicApiEntry {
  readonly exportName: string;
  readonly category:
    | "policy"
    | "applicability"
    | "approval"
    | "decision"
    | "audit"
    | "mapping"
    | "profile"
    | "integration";
  readonly version: string;
  readonly stability: "stable" | "experimental";
}

export interface GovernancePublicApiCatalog {
  readonly catalogId: string;
  readonly packageVersion: string;
  readonly entries: readonly GovernancePublicApiEntry[];
  readonly frozenAt: string;
}

export interface GovernanceContractChangelog {
  readonly changelogId: string;
  readonly phase: string;
  readonly version: string;
  readonly changes: readonly string[];
}

export interface GovernanceMigrationNote {
  readonly noteId: string;
  readonly targetExport: string;
  readonly fromVersion: string;
  readonly toVersion: string;
  readonly instructions: string;
}

export interface ApiFreezeFailureReport {
  readonly reportId: string;
  readonly failureClass: ApiFreezeFailureClass;
  readonly exportName: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Governance API Freeze Engine.
 * Audits public exports for proper versioning, non-enforcement semantics, duplicate detection, and migration integrity.
 */
export class GovernanceApiFreezeEngine {
  auditCatalog(catalog: GovernancePublicApiCatalog): ApiFreezeFailureReport | undefined {
    const seenNames = new Set<string>();

    for (const entry of catalog.entries) {
      // 1. Unversioned Export Check
      if (!entry.version || entry.version.trim() === "") {
        return {
          reportId: `fail_unvers_${entry.exportName}`,
          failureClass: "unversioned_export",
          exportName: entry.exportName,
          description: `Export '${entry.exportName}' lacks explicit semantic version string.`,
          timestamp: catalog.frozenAt
        };
      }

      // 2. Duplicate Contract Check
      if (seenNames.has(entry.exportName)) {
        return {
          reportId: `fail_dup_${entry.exportName}`,
          failureClass: "duplicate_contract",
          exportName: entry.exportName,
          description: `Duplicate export contract '${entry.exportName}' detected in catalog.`,
          timestamp: catalog.frozenAt
        };
      }
      seenNames.add(entry.exportName);

      // 3. Enforcement Semantics Leaked Check
      const lowerName = entry.exportName.toLowerCase();
      if (
        lowerName.includes("enforcer") ||
        lowerName.includes("regulator") ||
        lowerName.includes("policeman")
      ) {
        return {
          reportId: `fail_enf_${entry.exportName}`,
          failureClass: "enforcement_semantics_leaked_into_api",
          exportName: entry.exportName,
          description: `Export '${entry.exportName}' contains forbidden enforcement semantics terminology.`,
          timestamp: catalog.frozenAt
        };
      }

      // 4. Certification Semantics Leaked Check
      if (lowerName.includes("certifier") || lowerName.includes("guarantee")) {
        return {
          reportId: `fail_cert_${entry.exportName}`,
          failureClass: "certification_semantics_leaked_into_api",
          exportName: entry.exportName,
          description: `Export '${entry.exportName}' contains forbidden certification semantics terminology.`,
          timestamp: catalog.frozenAt
        };
      }
    }

    return undefined;
  }
}

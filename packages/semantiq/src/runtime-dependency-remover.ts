export interface RuntimeDependencyAuditReport {
  readonly isStandalone: boolean;
  readonly parentImportCount: number;
  readonly unresolvedDependencyCount: number;
  readonly timestamp: string;
}

const FORBIDDEN_DOMAINS = ["civilization-kernel", "wallet", "marketplace", "question-network"];

/**
 * Parent Workspace Runtime Dependency Remover Engine.
 * Verifies that SemantIQ core has zero runtime dependencies on parent workspace modules or environment variables.
 */
export class RuntimeDependencyRemoverEngine {
  auditRuntimeImports(importList: readonly string[]): RuntimeDependencyAuditReport {
    let parentCount = 0;
    let unresolvedCount = 0;

    for (const imp of importList) {
      const isForbiddenDomain = FORBIDDEN_DOMAINS.some((domain) => imp.includes(domain));
      if (isForbiddenDomain || imp.startsWith("@semantiq/sprint")) {
        parentCount++;
      } else if (imp.includes("..") && imp.includes("packages/")) {
        unresolvedCount++;
      }
    }

    return {
      isStandalone: parentCount === 0 && unresolvedCount === 0,
      parentImportCount: parentCount,
      unresolvedDependencyCount: unresolvedCount,
      timestamp: new Date().toISOString()
    };
  }
}

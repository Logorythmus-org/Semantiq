export type PathClassification =
  | "PUBLIC_CORE"
  | "PUBLIC_OPTIONAL_ADAPTER"
  | "PUBLIC_TEST"
  | "PUBLIC_DOCUMENTATION"
  | "PUBLIC_EXAMPLE"
  | "PUBLIC_DATASET"
  | "PUBLIC_TOOLING"
  | "SHARED_BUT_EXTRACTABLE"
  | "PARENT_ONLY"
  | "FORBIDDEN_IN_RELEASE"
  | "UNRESOLVED";

export interface SourceInventoryItem {
  readonly path: string;
  readonly classification: PathClassification;
  readonly purpose: string;
  readonly owningPackage: string;
  readonly licenseStatus: "MIT" | "Apache-2.0" | "Proprietary" | "Internal";
  readonly inManifest: boolean;
}

export interface SourceInventorySummary {
  readonly totalItemsCount: number;
  readonly publicItemsCount: number;
  readonly parentOnlyItemsCount: number;
  readonly unresolvedItemsCount: number;
  readonly timestamp: string;
}

/**
 * SemantIQ Source Inventory Engine.
 * Audits, classifies, and freezes product path inventory for Phase 11 extraction.
 */
export class SemantIQSourceInventoryEngine {
  classifyPath(filePath: string, inManifest: boolean): SourceInventoryItem {
    let classification: PathClassification = "UNRESOLVED";

    if (filePath.startsWith("packages/semantiq/src/")) {
      classification = "PUBLIC_CORE";
    } else if (filePath.startsWith("tests/unit/") || filePath.startsWith("tests/contracts/")) {
      classification = "PUBLIC_TEST";
    } else if (filePath.startsWith("Docs/")) {
      classification = "PUBLIC_DOCUMENTATION";
    } else if (filePath.startsWith("examples/")) {
      classification = "PUBLIC_EXAMPLE";
    } else if (filePath.startsWith("products/semantiq/specs/")) {
      classification = "PUBLIC_DATASET";
    } else if (filePath.startsWith("scripts/")) {
      classification = "PUBLIC_TOOLING";
    } else if (filePath.startsWith("packages/") && !filePath.startsWith("packages/semantiq")) {
      classification = "PARENT_ONLY";
    } else if (filePath.includes(".env") || filePath.includes("secret")) {
      classification = "FORBIDDEN_IN_RELEASE";
    }

    return {
      path: filePath,
      classification,
      purpose: `Source item for ${filePath}`,
      owningPackage: filePath.startsWith("packages/semantiq")
        ? "@semantiq/semantiq"
        : "semantiq-monorepo",
      licenseStatus: classification === "PARENT_ONLY" ? "Internal" : "MIT",
      inManifest
    };
  }

  generateSummary(items: readonly SourceInventoryItem[]): SourceInventorySummary {
    let publicCount = 0;
    let parentCount = 0;
    let unresolvedCount = 0;

    for (const item of items) {
      if (item.classification.startsWith("PUBLIC_")) {
        publicCount++;
      } else if (item.classification === "PARENT_ONLY") {
        parentCount++;
      } else if (item.classification === "UNRESOLVED") {
        unresolvedCount++;
      }
    }

    return {
      totalItemsCount: items.length,
      publicItemsCount: publicCount,
      parentOnlyItemsCount: parentCount,
      unresolvedItemsCount: unresolvedCount,
      timestamp: new Date().toISOString()
    };
  }
}

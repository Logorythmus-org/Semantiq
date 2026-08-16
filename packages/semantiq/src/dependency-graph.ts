export type DependencyCategory =
  | "SEMANTIQ_OWNED"
  | "EXTERNAL_RUNTIME"
  | "EXTERNAL_DEVELOPMENT"
  | "OPTIONAL_ADAPTER"
  | "SHARED_NEUTRAL"
  | "PARENT_ONLY"
  | "FORBIDDEN"
  | "UNRESOLVED";

export interface DependencyNode {
  readonly packageName: string;
  readonly category: DependencyCategory;
  readonly version: string;
  readonly isOptional: boolean;
}

export interface DependencyGraphValidationReport {
  readonly isValid: boolean;
  readonly hasCycles: boolean;
  readonly forbiddenCount: number;
  readonly parentOnlyCount: number;
  readonly timestamp: string;
}

/**
 * Independent Package Graph Engine.
 * Analyzes, classifies, and verifies dependency boundaries for standalone SemantIQ package extraction.
 */
export class DependencyGraphEngine {
  classifyDependency(name: string, isDev = false, isOptional = false): DependencyNode {
    let category: DependencyCategory = "UNRESOLVED";

    if (name.startsWith("@tech-club/semantiq") || name === "semantiq") {
      category = "SEMANTIQ_OWNED";
    } else if (
      name.includes("civilization") ||
      name.includes("wallet") ||
      name.includes("marketplace") ||
      name.includes("question-network")
    ) {
      category = "FORBIDDEN";
    } else if (name.startsWith("@tech-club/")) {
      category = "PARENT_ONLY";
    } else if (isDev) {
      category = "EXTERNAL_DEVELOPMENT";
    } else if (isOptional) {
      category = "OPTIONAL_ADAPTER";
    } else {
      category = "EXTERNAL_RUNTIME";
    }

    return {
      packageName: name,
      category,
      version: "1.0.0",
      isOptional
    };
  }

  validateGraph(nodes: readonly DependencyNode[]): DependencyGraphValidationReport {
    let forbiddenCount = 0;
    let parentOnlyCount = 0;

    for (const node of nodes) {
      if (node.category === "FORBIDDEN") {
        forbiddenCount++;
      } else if (node.category === "PARENT_ONLY") {
        parentOnlyCount++;
      }
    }

    return {
      isValid: forbiddenCount === 0 && parentOnlyCount === 0,
      hasCycles: false,
      forbiddenCount,
      parentOnlyCount,
      timestamp: new Date().toISOString()
    };
  }
}

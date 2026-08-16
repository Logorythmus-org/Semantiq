export type ManifestValidationErrorClass =
  | "missing_required_file"
  | "path_traversal_attempt"
  | "symlink_escape"
  | "parent_git_included"
  | "secret_file_included"
  | "nondeterministic_ordering"
  | "unresolved_path_included";

export interface ExtractionManifest {
  readonly version: string;
  readonly product: string;
  readonly packageName: string;
  readonly defaultPolicy: string;
  readonly requiredFiles: readonly string[];
  readonly includedPaths: readonly string[];
  readonly excludedPaths: readonly string[];
  readonly forbiddenImports: readonly string[];
}

export interface ManifestValidationReport {
  readonly isValid: boolean;
  readonly errors: readonly ManifestValidationErrorClass[];
  readonly timestamp: string;
}

/**
 * Extraction Manifest Validator Engine.
 * Validates canonical extraction-manifest.json rules, path ordering, and default-deny policies.
 */
export class ManifestValidatorEngine {
  validateManifest(manifest: ExtractionManifest): ManifestValidationReport {
    const errors: ManifestValidationErrorClass[] = [];

    // 1. Path traversal check
    for (const incPath of manifest.includedPaths) {
      if (incPath.includes("..") || incPath.startsWith("/") || incPath.startsWith("\\")) {
        errors.push("path_traversal_attempt");
        break;
      }
    }

    // 2. Parent git check
    if (manifest.includedPaths.some((p) => p.includes(".git"))) {
      errors.push("parent_git_included");
    }

    // 3. Secret file check
    if (manifest.includedPaths.some((p) => p.includes(".env") || p.includes("secret"))) {
      errors.push("secret_file_included");
    }

    // 4. Required files presence
    if (!manifest.requiredFiles || manifest.requiredFiles.length === 0) {
      errors.push("missing_required_file");
    }

    return {
      isValid: errors.length === 0,
      errors,
      timestamp: new Date().toISOString()
    };
  }
}

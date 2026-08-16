export interface CandidateFile {
  readonly relativePath: string;
  readonly sizeBytes: number;
  readonly isIncluded: boolean;
  readonly exclusionReason?: string;
}

export interface CandidateProvenance {
  readonly candidateVersion: string;
  readonly sourceCommit: string;
  readonly manifestVersion: string;
  readonly generatedAt: string;
  readonly generatorVersion: string;
  readonly isDeterministic: boolean;
  readonly totalIncludedFiles: number;
  readonly totalExcludedFiles: number;
}

export interface CleanRoomValidationReport {
  readonly isPassing: boolean;
  readonly forbiddenPathCount: number;
  readonly absolutePathCount: number;
  readonly secretFileCount: number;
  readonly gitArtifactCount: number;
  readonly timestamp: string;
}

const FORBIDDEN_PATTERNS = [".git/", "node_modules/", ".env", "secrets/", ".npmrc-private"];
const GIT_ARTIFACT_PATTERNS = [".git", "COMMIT_EDITMSG", "ORIG_HEAD", "FETCH_HEAD"];
const SECRET_PATTERNS = [".env", "secrets", "credentials", "private-key"];

/**
 * Clean-Room Candidate Generator Engine.
 * Orchestrates the generation of an isolated, unpublished SemantIQ release candidate
 * from the finalized extraction manifest.
 */
export class CleanRoomGeneratorEngine {
  buildProvenance(
    candidateVersion: string,
    sourceCommit: string,
    manifestVersion: string,
    totalIncluded: number,
    totalExcluded: number
  ): CandidateProvenance {
    return {
      candidateVersion,
      sourceCommit,
      manifestVersion,
      generatedAt: new Date().toISOString(),
      generatorVersion: "11.10",
      isDeterministic: true,
      totalIncludedFiles: totalIncluded,
      totalExcludedFiles: totalExcluded
    };
  }

  validateCandidatePath(filePath: string): { isAllowed: boolean; reason?: string } {
    for (const pattern of GIT_ARTIFACT_PATTERNS) {
      if (filePath.includes(pattern)) {
        return { isAllowed: false, reason: `git-artifact: ${pattern}` };
      }
    }
    for (const pattern of SECRET_PATTERNS) {
      if (filePath.toLowerCase().includes(pattern)) {
        return { isAllowed: false, reason: `secret-file: ${pattern}` };
      }
    }
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (filePath.includes(pattern)) {
        return { isAllowed: false, reason: `forbidden-path: ${pattern}` };
      }
    }
    if (filePath.startsWith("/") || /^[A-Za-z]:\\/.test(filePath)) {
      return { isAllowed: false, reason: "absolute-path" };
    }
    return { isAllowed: true };
  }

  auditCandidateFiles(files: readonly string[]): CleanRoomValidationReport {
    let forbiddenCount = 0;
    let absoluteCount = 0;
    let secretCount = 0;
    let gitCount = 0;

    for (const f of files) {
      const result = this.validateCandidatePath(f);
      if (!result.isAllowed) {
        if (result.reason?.startsWith("git-artifact")) gitCount++;
        else if (result.reason?.startsWith("secret-file")) secretCount++;
        else if (result.reason === "absolute-path") absoluteCount++;
        else forbiddenCount++;
      }
    }

    return {
      isPassing: forbiddenCount === 0 && absoluteCount === 0 && secretCount === 0 && gitCount === 0,
      forbiddenPathCount: forbiddenCount,
      absolutePathCount: absoluteCount,
      secretFileCount: secretCount,
      gitArtifactCount: gitCount,
      timestamp: new Date().toISOString()
    };
  }
}

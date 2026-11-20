export type FinalLaunchDecisionType =
  "AUTHORIZED — LEVEL 2 PUBLIC ALPHA" | "AUTHORIZED WITH CONDITIONS" | "BLOCKED";

export interface FinalLaunchAuthorizationRecord {
  readonly authorizationId: string;
  readonly decision: FinalLaunchDecisionType;
  readonly releaseLevel: "2-public-alpha";
  readonly targetCommit: string;
  readonly targetTag: string;
  readonly mandatoryReleaseStatement: string;
  readonly publicLimitations: readonly string[];
  readonly releaseExclusions: readonly string[];
  readonly rollbackTriggers: readonly string[];
  readonly gateStatuses: {
    readonly artifactIdentity: boolean;
    readonly internalVerification: boolean;
    readonly cleanRoomReproducibility: boolean;
    readonly publicationSecurity: boolean;
    readonly scientificHonesty: boolean;
    readonly humanResponsibility: boolean;
    readonly contestability: boolean;
    readonly governanceHonesty: boolean;
    readonly antiGamingIntegrity: boolean;
    readonly rollbackCapability: boolean;
  };
  readonly timestamp: string;
}

export interface LaunchValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * Final Launch Authorization Engine.
 * Formally evaluates all 10 release gates to produce the Phase 12 Level 2 Public Alpha launch authorization.
 */
export class FinalLaunchAuthorizationEngine {
  validateFinalLaunchAuthorization(record: FinalLaunchAuthorizationRecord): LaunchValidationReport {
    const violations: string[] = [];

    const canonicalStatementExcerpt =
      "SemantIQ Public Alpha is an experimental open-source evaluation and evidence infrastructure.";
    if (!record.mandatoryReleaseStatement.includes(canonicalStatementExcerpt)) {
      violations.push("Mandatory release statement does not match canonical required statement.");
    }

    const allGatesPassed = Object.values(record.gateStatuses).every(Boolean);
    if (!allGatesPassed && record.decision === "AUTHORIZED — LEVEL 2 PUBLIC ALPHA") {
      violations.push(
        "Cannot authorize Level 2 Public Alpha when one or more release gates have failed."
      );
    }

    if (!record.publicLimitations || record.publicLimitations.length < 5) {
      violations.push("Launch authorization must document all mandatory public limitations.");
    }

    if (!record.releaseExclusions || record.releaseExclusions.length === 0) {
      violations.push("Launch authorization must explicitly list out-of-scope release exclusions.");
    }

    if (!record.rollbackTriggers || record.rollbackTriggers.length === 0) {
      violations.push("Launch authorization must document explicit rollback triggers.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}

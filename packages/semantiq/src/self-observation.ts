export interface GovernanceMetrics {
  readonly maintainerConcentrationPercentage: number;
  readonly contributorCount: number;
  readonly benchmarkAuthorConcentrationPercentage: number;
  readonly unresolvedDisputesCount: number;
  readonly correctionCount: number;
  readonly withdrawalCount: number;
  readonly incidentCount: number;
  readonly sponsorInfluenceDisclosed: boolean;
}

export interface TrustMetrics {
  readonly independentReproductionCount: number;
  readonly failedReproductionCount: number;
  readonly multilingualCoverageLanguagesCount: number;
  readonly protectedTestConcentrationPercentage: number;
  readonly knownBlindSpotsCount: number;
  readonly openSecurityRisksCount: number;
}

export interface ReplicationRecord {
  readonly replicationId: string;
  readonly replicatorName: string;
  readonly targetBenchmarkVersion: string;
  readonly isSuccessful: boolean;
  readonly executionTimestamp: string;
  readonly discrepancyNotes?: string | undefined;
}

export interface SelfObservationReport {
  readonly reportId: string;
  readonly timestamp: string;
  readonly governanceMetrics: GovernanceMetrics;
  readonly trustMetrics: TrustMetrics;
  readonly unknownDimensions: readonly string[];
  readonly limitations: readonly string[];
}

export interface SelfObservationValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * SemantIQ Self-Observation Engine.
 * Evaluates the project itself according to SemantIQ principles, tracking
 * maintainer concentration, blind spots, replication records, and unknown dimensions.
 */
export class SelfObservationEngine {
  validateSelfObservationReport(report: SelfObservationReport): SelfObservationValidationReport {
    const violations: string[] = [];

    if (
      report.governanceMetrics.maintainerConcentrationPercentage < 0 ||
      report.governanceMetrics.maintainerConcentrationPercentage > 100
    ) {
      violations.push("Maintainer concentration percentage must be between 0 and 100.");
    }

    if (!report.unknownDimensions || report.unknownDimensions.length === 0) {
      violations.push(
        "Self-observation reports must explicitly list unknown dimensions where evidence is unavailable."
      );
    }

    if (!report.limitations || report.limitations.length === 0) {
      violations.push("Self-observation reports must document project limitations.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateReplicationRecord(record: ReplicationRecord): SelfObservationValidationReport {
    const violations: string[] = [];

    if (
      !record.isSuccessful &&
      (!record.discrepancyNotes || record.discrepancyNotes.trim() === "")
    ) {
      violations.push("Failed reproduction records require explicit discrepancy notes.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}

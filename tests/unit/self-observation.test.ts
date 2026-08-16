import { describe, it, expect } from "vitest";
import { SelfObservationEngine } from "../../packages/semantiq/src/self-observation.js";
import type {
  SelfObservationReport,
  ReplicationRecord
} from "../../packages/semantiq/src/self-observation.js";

describe("Phase 11.5.8 — SemantIQ Self-Observation", () => {
  const engine = new SelfObservationEngine();

  const validReport: SelfObservationReport = {
    reportId: "self-obs-01",
    timestamp: "2026-08-07T00:00:00Z",
    governanceMetrics: {
      maintainerConcentrationPercentage: 60,
      contributorCount: 5,
      benchmarkAuthorConcentrationPercentage: 50,
      unresolvedDisputesCount: 0,
      correctionCount: 1,
      withdrawalCount: 0,
      incidentCount: 0,
      sponsorInfluenceDisclosed: true
    },
    trustMetrics: {
      independentReproductionCount: 3,
      failedReproductionCount: 0,
      multilingualCoverageLanguagesCount: 2,
      protectedTestConcentrationPercentage: 20,
      knownBlindSpotsCount: 4,
      openSecurityRisksCount: 0
    },
    unknownDimensions: ["long_term_longitudinal_drift", "untested_low_resource_languages"],
    limitations: [
      "Evaluation currently focused on English text prompts",
      "Postgres integration optional"
    ]
  };

  it("passes a valid self-observation report with explicit unknown dimensions and limitations", () => {
    const report = engine.validateSelfObservationReport(validReport);
    expect(report.isValid).toBe(true);
    expect(report.violations.length).toBe(0);
  });

  it("rejects a self-observation report missing unknown dimensions or limitations", () => {
    const invalid = { ...validReport, unknownDimensions: [], limitations: [] };
    const report = engine.validateSelfObservationReport(invalid);
    expect(report.isValid).toBe(false);
    expect(report.violations).toContain(
      "Self-observation reports must explicitly list unknown dimensions where evidence is unavailable."
    );
    expect(report.violations).toContain(
      "Self-observation reports must document project limitations."
    );
  });

  it("rejects a failed replication record without discrepancy notes", () => {
    const failedRep: ReplicationRecord = {
      replicationId: "rep-01",
      replicatorName: "External Lab Z",
      targetBenchmarkVersion: "1.0.0",
      isSuccessful: false,
      executionTimestamp: "2026-08-07T00:00:00Z"
    };
    const report = engine.validateReplicationRecord(failedRep);
    expect(report.isValid).toBe(false);
    expect(report.violations[0]).toContain(
      "Failed reproduction records require explicit discrepancy notes."
    );
  });
});

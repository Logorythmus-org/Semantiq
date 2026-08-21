import { describe, expect, it } from "vitest";
import {
  SemantiqClient,
  ControlledLanguageValidator,
  SemantiqControlledLanguageError,
  SemantiqReceiptError,
  SemantiqValidationError,
  mockSystemProfile,
  mockBenchmark,
  mockCase,
  mockRunProfile,
  mockGovernedClaim,
  ProductRunStatus,
  EvaluationStatus,
  TraceStatus,
  ReviewVerdict,
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  EPISTEMIC_CAUSAL_DISCLAIMER,
  EPISTEMIC_LANGUAGE_DISCLAIMER
} from "../../packages/sdk/src/index.js";

describe("First-Class Standalone SemantIQ TypeScript SDK", () => {
  it("initializes SemantiqClient with default and custom configs", () => {
    const client = new SemantiqClient({ isOfflineDeterministic: true });
    expect(client.getVersion()).toBe(PRODUCT_CONTRACTS_SCHEMA_VERSION);
    expect(client.isOfflineMode()).toBe(true);
  });

  describe("1. Benchmark Evaluation Workflow", () => {
    it("runs offline deterministic evaluation successfully", async () => {
      const client = new SemantiqClient();
      const profile = mockSystemProfile({ name: "Autonomous Test Agent" });
      const benchmark = mockBenchmark();
      const scenarioCase = mockCase({ benchmarkId: benchmark.id });

      const result = await client.evaluate({
        systemProfile: profile,
        benchmark,
        scenarioCase,
        deterministicSeed: "0x42"
      });

      expect(result.run.id).toMatch(/^run_/);
      expect(result.run.status).toBe(ProductRunStatus.COMPLETED);
      expect(result.trace.status).toBe(TraceStatus.COMPLETED);
      expect(result.evaluation.status).toBe(EvaluationStatus.PASSED);
      expect(result.evaluation.overallScore).toBe(1.0);
      expect(result.claims.length).toBe(1);
      expect(result.observations.length).toBe(1);
      expect(result.review.verdict).toBe(ReviewVerdict.APPROVED);
    });

    it("throws SemantiqValidationError on invalid evaluation parameters", async () => {
      const client = new SemantiqClient();
      await expect(
        client.evaluate({
          systemProfile: { id: "" } as any,
          benchmark: { id: "bmk_1" } as any,
          scenarioCase: { id: "case_1" } as any
        })
      ).rejects.toThrow(SemantiqValidationError);
    });
  });

  describe("2. Governed Claims & Controlled Language Workflow", () => {
    it("validates compliant associative language", () => {
      const validator = new ControlledLanguageValidator();
      const statement =
        "Isolated memory partitions are associated with reduced cross-session prompt leakage.";
      const result = validator.validate(statement);
      expect(result.isValid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it("detects prohibited causal and absolutist words", () => {
      const validator = new ControlledLanguageValidator();
      const statements = [
        "This patch causes zero security breaches.",
        "The model proves 100% adherence.",
        "Architecture guarantees elimination of hallucination.",
        "Strict boundaries eliminate all prompt injection vulnerabilities.",
        "Provides causal proof of model safety.",
        "The system is completely safe and unhackable."
      ];

      for (const stmt of statements) {
        const res = validator.validate(stmt);
        expect(res.isValid).toBe(false);
        expect(res.violations.length).toBeGreaterThanOrEqual(1);
        expect(res.violations[0]?.suggestedReplacement).toBeDefined();
        expect(res.violations[0]?.rationale).toBeDefined();
      }
    });

    it("drafts governed claims and rejects prohibited terminology", () => {
      const client = new SemantiqClient();
      const compliantStatement =
        "Structured tool invocation is associated with an empirical 90% reduction in injection attacks.";

      const claim = client.draftClaim({
        statement: compliantStatement,
        topic: "injection_defense",
        targetPatternOrRelationId: "DP-001_FP-001",
        runIds: ["run_1"],
        observationIds: ["obs_1"]
      });

      expect(claim.claimFamilyTopic).toBe("injection_defense");
      expect(claim.status).toBe("draft");
      expect(claim.statement).toBe(compliantStatement);
      expect(claim.epistemicDisclaimer).toBe(EPISTEMIC_LANGUAGE_DISCLAIMER);

      expect(() => {
        client.draftClaim({
          statement: "Heartbeat guarantees unhackable runtime.",
          topic: "security",
          targetPatternOrRelationId: "DP-001"
        });
      }).toThrow(SemantiqControlledLanguageError);
    });
  });

  describe("3. Matched Controls & Statistical Contrast Workflow", () => {
    it("matches treatment and control runs across 7 dimensions and evaluates contrast", () => {
      const client = new SemantiqClient();

      const treatmentRuns = Array.from({ length: 4 }, (_, i) =>
        mockRunProfile({ runId: `treat_${i}`, isTreatment: true, score: 0.9 + i * 0.02 })
      );
      const controlRuns = Array.from({ length: 4 }, (_, i) =>
        mockRunProfile({ runId: `ctrl_${i}`, isTreatment: false, score: 0.7 + i * 0.01 })
      );

      const matched = client.matchControls({
        treatmentRuns,
        controlRuns,
        targetMetric: "score"
      });

      expect(matched.treatmentCount).toBe(4);
      expect(matched.controlCount).toBe(4);
      expect(matched.matchedPairs.length).toBe(4);
      expect(matched.matchingCoverageRatio).toBe(1.0);

      const contrastReport = client.evaluateContrast({
        targetMetric: "score",
        matchedData: matched
      });

      expect(contrastReport.meanDelta).toBeGreaterThan(0.15);
      expect(contrastReport.bootstrapCi.isSignificant).toBe(true);
      expect(contrastReport.signTest.isSignificant).toBe(true);
      expect(contrastReport.statisticalEvidenceGrade).toBe("moderate");
      expect(contrastReport.epistemicDisclaimer).toBe(EPISTEMIC_CAUSAL_DISCLAIMER);
    });
  });

  describe("4. Cryptographic Research Bundle Workflow", () => {
    it("exports, cryptographically verifies, and imports ResearchBundles", async () => {
      const client = new SemantiqClient();
      const profile = mockSystemProfile();
      const benchmark = mockBenchmark();
      const scenarioCase = mockCase();
      const evalResult = await client.evaluate({ systemProfile: profile, benchmark, scenarioCase });

      const claim = mockGovernedClaim();

      const bundle = client.exportResearchBundle({
        bundleId: "bundle_ts_test_001",
        title: "TypeScript SDK Test Bundle",
        runs: [evalResult.run],
        evaluations: [evalResult.evaluation],
        claims: [claim]
      });

      expect(bundle.id).toBe("bundle_ts_test_001");
      expect(bundle.includedArtifacts.length).toBe(3);
      expect(bundle.merkleRootHash.length).toBe(64);

      // Verify
      expect(client.verifyBundle(bundle)).toBe(true);

      // Import
      const importRes = client.importBundle(bundle);
      expect(importRes.verified).toBe(true);
      expect(importRes.importedRunsCount).toBe(1);
      expect(importRes.importedEvaluationsCount).toBe(1);
      expect(importRes.importedClaimsCount).toBe(1);

      // Tamper test
      const tamperedBundle = {
        ...bundle,
        merkleRootHash: "0".repeat(64)
      };
      expect(client.verifyBundle(tamperedBundle)).toBe(false);
      expect(() => client.importBundle(tamperedBundle)).toThrow(SemantiqReceiptError);
    });
  });

  describe("5. Contract Fixture Generators Parity", () => {
    it("generates valid SystemProfile, Benchmark, Case, RunProfile, and GovernedClaim fixtures", () => {
      const prof = mockSystemProfile();
      expect(prof.capabilities).toContain("tool_calling");

      const bmk = mockBenchmark();
      expect(bmk.domain).toBe("security");

      const c = mockCase();
      expect(c.prompt).toBeDefined();

      const run = mockRunProfile();
      expect(run.memory.hasMemoryPartitioning).toBe(true);

      const claim = mockGovernedClaim();
      expect(claim.status).toBe("active");
    });
  });
});

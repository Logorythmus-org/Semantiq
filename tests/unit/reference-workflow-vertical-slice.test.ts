import { describe, it, expect } from "vitest";
import { Dp008ReferenceFlowRunner } from "../../packages/evidence/src/reference-flow/index.js";
import { SemantiqClient } from "../../packages/sdk/src/index.js";
import { createSemantiqHttpServer } from "../../packages/semantiq/src/http/index.js";

describe("Complete Headless Vertical Slice: DP-008 → FP-002 (Prompt 31)", () => {
  const runner = new Dp008ReferenceFlowRunner();

  describe("1. Complete 18-Stage Headless Reference Workflow", () => {
    it("executes full controlled synthetic pipeline from raw runs to eligibility gate", async () => {
      const result = await runner.executeFlow();

      // Stage 1 & 2: Controlled runs & Canonical Adapter
      expect(result.adaptedRuns.length).toBe(20);
      expect(result.adaptedRuns.filter((r) => Boolean((r.payload as any)?.hadAnomaly)).length).toBe(
        5
      );

      // Stage 3 & 4: Trace mapping & Metrics
      expect(result.traces.length).toBe(1);
      expect(result.traces[0]!.events.length).toBe(20);
      expect(
        result.traces[0]!.events.filter((e) => Boolean((e.payload as any)?.hadAnomaly)).length
      ).toBe(5);

      // Stage 5 & 6: Failure evidence & Evidence Graph
      expect(result.failureObservationsCount).toBe(5);

      // Stage 7: Matched contrast (Bootstrap CI & Sign test)
      expect(result.matchedContrastReport.matchedPairsCount).toBe(10);
      expect(result.matchedContrastReport.meanDelta).toBeGreaterThan(0.2);
      expect(result.matchedContrastReport.bootstrapCI.confidenceLevel).toBe(0.95);
      expect(result.matchedContrastReport.signTest.pValue).toBeLessThanOrEqual(0.05);

      // Stage 8 & 9: Robustness diagnostics & Specification curve
      expect(result.robustnessReport.meanPostMatchTvd).toBeLessThanOrEqual(0.2);
      expect(result.specCurveReport.specifications.length).toBeGreaterThan(0);

      // Stage 10: Evidence Decision policy
      expect(result.decisionVerdict).toBe("promote");

      // Stage 11, 12, 13: Governed Claim, Review, and Release
      expect(result.claim.id).toContain("claim_");
      expect(result.claim.status).toBe("active");
      expect(result.claim.statement).toContain("DP-008");
      expect(result.review.decision).toBe("approve");

      // Stage 14: Reproducible Research Bundle
      expect(result.researchBundle.bundleId).toBe("bundle_dp008_fp002_ref");
      expect(result.researchBundle.merkleRootHash).toBeDefined();

      // Stage 15: Partner Organization & Study
      expect(result.partnerOrganization.id).toBe("org_stanford_nlp");
      expect(result.partnerStudy.status).toBe("published");

      // Stage 16: Pre-registration
      expect(result.studyProtocol.status).toBe("frozen");
      expect(result.studyProtocol.preregistrationHash).toBeDefined();

      // Stage 17: Execution Manifest
      expect(result.executionManifest.matchedPairsCount).toBe(20);
      expect(result.manifestIngestion.status).toBe("accepted");
      expect(result.manifestIngestion.preregistrationMatch).toBe(true);

      // Stage 18: External Evidence Eligibility Gate & Replication
      expect(result.eligibilityDecision.verdict).toBe("eligible");
      expect(result.eligibilityDecision.isAdmissibleForAggregation).toBe(true);
      expect(result.replicationAggregation.supportCount).toBe(1);
      expect(result.replicationAggregation.counterCount).toBe(0);
      expect(result.replicationAggregation.counterevidencePreserved).toBe(true);
    });
  });

  describe("2. Cross-Interface Accessibility Parity", () => {
    it("proves key workflow objects are accessible through TypeScript SDK client", async () => {
      const client = new SemantiqClient({ isOfflineDeterministic: true });

      // 1. Controlled Language Validation
      const validLang = client.validateClaimLanguage(
        "DP-008 out-of-band observer is associated with reduced FP-002 context drift."
      );
      expect(validLang.isValid).toBe(true);

      // 2. Draft Governed Claim
      const claim = client.draftClaim({
        topic: "anti_gaming_drift_mitigation",
        targetPatternOrRelationId: "rel_08",
        statement: "DP-008 out-of-band observer is associated with reduced FP-002 context drift.",
        version: "1.0.0",
        runIds: ["run_1", "run_2"]
      });
      expect(claim.id).toBeDefined();
      expect(claim.status).toBe("draft");
      expect(claim.epistemicDisclaimer).toBeDefined();

      // 3. Matched Controls
      const matchResult = client.matchControls({
        treatmentRuns: [
          {
            runId: "treat_1",
            isTreatment: true,
            environment: {
              platform: "linux",
              provider: "docker",
              networkIsolated: true,
              os: "linux-x86_64"
            },
            model: { modelFamily: "gpt-4", modelId: "gpt-4", temperature: 0.0 },
            population: { topology: "single", agentCount: 1 },
            tools: { toolCount: 1, hasBoundaryGuard: true, allowedToolNames: ["obs"] },
            memory: { contextWindowTokens: 4096, hasMemoryPartitioning: true },
            resourcePressure: { maxSteps: 10, tokenBudget: 10000 },
            horizon: "long",
            outcomeMetrics: { score: 0.95 }
          }
        ],
        controlRuns: [
          {
            runId: "ctrl_1",
            isTreatment: false,
            environment: {
              platform: "linux",
              provider: "docker",
              networkIsolated: true,
              os: "linux-x86_64"
            },
            model: { modelFamily: "gpt-4", modelId: "gpt-4", temperature: 0.0 },
            population: { topology: "single", agentCount: 1 },
            tools: { toolCount: 1, hasBoundaryGuard: true, allowedToolNames: ["obs"] },
            memory: { contextWindowTokens: 4096, hasMemoryPartitioning: true },
            resourcePressure: { maxSteps: 10, tokenBudget: 10000 },
            horizon: "long",
            outcomeMetrics: { score: 0.7 }
          }
        ],
        targetMetric: "score"
      });
      expect(matchResult.matchedPairs.length).toBe(1);
      expect(matchResult.matchedPairs[0]!.metricDelta).toBe(0.25);

      // 4. Statistical Contrast
      const contrast = client.evaluateContrast({
        targetMetric: "score",
        matchedData: matchResult
      });
      expect(contrast.meanDelta).toBe(0.25);
      expect(contrast.bootstrapCi).toBeDefined();
      expect(contrast.signTest).toBeDefined();
    });

    it("proves key workflow objects are accessible through HTTP API", async () => {
      const server = createSemantiqHttpServer({ port: 0, host: "127.0.0.1" });
      const port = await server.start();
      const baseUrl = `http://127.0.0.1:${port}`;

      try {
        // 1. Patterns discovery
        const patternsRes = await fetch(`${baseUrl}/api/v1/patterns`);
        expect(patternsRes.status).toBe(200);
        const patternsJson = await patternsRes.json();
        expect(patternsJson.data.some((p: any) => p.code === "DP-008")).toBe(true);

        // 2. Controlled language validation
        const valRes = await fetch(`${baseUrl}/api/v1/claims/validate-language`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            statement:
              "DP-008 out-of-band observer is associated with reduced FP-002 context drift."
          })
        });
        expect(valRes.status).toBe(200);
        const valJson = await valRes.json();
        expect(valJson.data.isValid).toBe(true);

        // 3. Draft governed claim
        const claimRes = await fetch(`${baseUrl}/api/v1/claims/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimFamilyTopic: "anti_gaming_drift_mitigation",
            targetPatternOrRelationId: "rel_08",
            version: "1.0.0",
            statement:
              "DP-008 out-of-band observer is associated with reduced FP-002 context drift.",
            governanceVerdict: "promote",
            evidenceReferences: {
              evaluationReportIds: ["eval_1"],
              runProfileIds: ["run_1"],
              datasetSnapshotIds: ["snap_1"]
            }
          })
        });
        expect(claimRes.status).toBe(201);
        const claimJson = await claimRes.json();
        const claimId = claimJson.data.id;

        // 4. Get claim by ID
        const getClaimRes = await fetch(`${baseUrl}/api/v1/claims/${claimId}`);
        expect(getClaimRes.status).toBe(200);
        const getClaimJson = await getClaimRes.json();
        expect(getClaimJson.data.id).toBe(claimId);
        expect(getClaimJson.data.statement).toContain("DP-008");

        // 5. Enqueue review
        const reviewRes = await fetch(`${baseUrl}/api/v1/reviews/enqueue`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimId,
            itemType: "claim_promotion",
            priority: "high"
          })
        });
        expect(reviewRes.status).toBe(201);
      } finally {
        await server.stop();
      }
    });
  });
});

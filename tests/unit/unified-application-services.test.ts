import { describe, expect, it } from "vitest";
import {
  createSemantiqApplicationService,
  SemantiqApplicationService
} from "../../packages/semantiq/src/index.js";
import {
  EvaluationStatus,
  EvidenceConfidence,
  PatternCategory,
  PatternSeverity,
  ProductRunStatus,
  TraceStatus,
  type SystemProfile
} from "../../packages/sandbox-contracts/src/index.js";
import {
  EPISTEMIC_REPRODUCIBILITY_DISCLAIMER,
  type RunProfile
} from "../../packages/evidence/src/index.js";

describe("Unified SemantIQ Application Service Layer", () => {
  const app = createSemantiqApplicationService();

  it("instantiates an authoritative service facade covering all 9 domain capabilities", () => {
    expect(app).toBeInstanceOf(SemantiqApplicationService);
    expect(app.runs).toBeDefined();
    expect(app.evaluations).toBeDefined();
    expect(app.patterns).toBeDefined();
    expect(app.evidence).toBeDefined();
    expect(app.comparisons).toBeDefined();
    expect(app.claims).toBeDefined();
    expect(app.reviews).toBeDefined();
    expect(app.studies).toBeDefined();
    expect(app.bundles).toBeDefined();
  });

  it("operates the Runs & Trace Mapping service", async () => {
    const rawSMF = {
      run_id: "smf_run_100",
      benchmark_name: "SMF-Core",
      model_identifier: "anthropic/claude-3-5-sonnet",
      overall_score: 0.92,
      subscores: { compliance: 0.95, stability: 0.89 },
      timestamp: "2026-08-18T12:00:00Z"
    };

    const ingested = await app.runs.ingestBenchmarkRun({
      rawArtifact: rawSMF,
      sourceFormat: "smf_v1"
    });

    expect(ingested.run.id).toBe("smf_run_100");
    expect(ingested.run.status).toBe(ProductRunStatus.COMPLETED);
    expect(ingested.evaluation.overallScore).toBe(0.92);

    const fetchedRun = await app.runs.getRun("smf_run_100");
    expect(fetchedRun?.id).toBe("smf_run_100");

    const runsList = await app.runs.listRuns();
    expect(runsList.length).toBeGreaterThanOrEqual(1);

    // Apply trace mapping with seeded approved profile
    const mapped = await app.runs.applyTraceMapping({
      runId: "smf_run_100",
      caseId: "case_01",
      rawEvents: [
        {
          id: "ev_1",
          timestamp: "2026-08-18T12:00:01Z",
          event_type: "semantic_parse",
          data: { text: "hello" }
        }
      ],
      profileId: "profile_smf_trace_mapping",
      profileVersion: "1.0.0"
    });
    expect(mapped.mappedEventCount).toBe(1);
    expect(mapped.trace.status).toBe(TraceStatus.COMPLETED);
  });

  it("operates the Evaluations & Ledger service", async () => {
    const evaluation = {
      id: "eval_test_001",
      version: "1.0.0",
      runId: "run_test_001",
      benchmarkId: "bench_core",
      systemProfileId: "prof_agent_a",
      status: EvaluationStatus.PASSED,
      overallScore: 0.96,
      scoreBreakdown: { default: { score: 0.96, weight: 1.0, status: "passed" } },
      observationIds: ["obs_01"],
      claimIds: ["clm_01"],
      generatedAt: new Date().toISOString()
    };

    const entry = await app.evaluations.recordEvaluation({
      evaluation,
      contentFingerprint: "sha256:content_abc",
      configFingerprint: "sha256:config_def",
      reproducibility: {
        configFingerprint: "sha256:config_def",
        environmentFingerprint: "sha256:env_local",
        toolchainVersion: "1.0.0",
        verificationStatus: "reproducible",
        epistemicDisclaimer: EPISTEMIC_REPRODUCIBILITY_DISCLAIMER
      }
    });

    expect(entry.ledgerIndex).toBe(0);
    expect(entry.evaluationId).toBe("eval_test_001");

    const ledgerAudit = await app.evaluations.verifyLedgerIntegrity();
    expect(ledgerAudit.valid).toBe(true);
    expect(ledgerAudit.totalEntries).toBe(1);
  });

  it("operates the Patterns, Matching, Recommendations, and Test Planning service", async () => {
    const pattern = {
      id: "pat_DP001_test",
      code: "DP-001",
      version: "1.0.0",
      name: "Dynamic Heartbeat Monitoring",
      category: PatternCategory.CAPABILITY_EMERGENCE,
      description: "Continuous health heartbeat.",
      detectionRule: {
        kind: "capability_match",
        expression: "match",
        requiredCapabilities: ["tool_calling"]
      },
      severity: PatternSeverity.LOW,
      confidence: EvidenceConfidence.DETERMINISTIC,
      tags: ["governance", "health"]
    };

    await app.patterns.registerPattern(pattern);
    const fetched = await app.patterns.getPattern("DP-001");
    expect(fetched?.name).toBe("Dynamic Heartbeat Monitoring");

    const systemProfile: SystemProfile = {
      id: "sys_agent_1",
      version: "1.0.0",
      name: "Autonomous Research Agent",
      modelFamily: "claude-3",
      modelId: "anthropic/claude-3-5-sonnet",
      parameters: { temperature: 0.2 },
      capabilities: ["tool_calling", "long_context"],
      contextWindowTokens: 200000,
      createdAt: new Date().toISOString()
    };

    const recommendations = await app.patterns.recommendPatterns(systemProfile);
    expect(recommendations.length).toBeGreaterThanOrEqual(1);

    const plannedTests = await app.patterns.planTests(systemProfile);
    expect(Array.isArray(plannedTests)).toBe(true);
  });

  it("operates the Evidence, Metrics, Claims, and Comparisons service", async () => {
    // 1. Behavioral Metrics
    const metricResults = await app.evidence.computeBehavioralMetrics("eval_target_01", {
      constraint_compliance: {
        totalEvaluatedConstraints: 25,
        violatedConstraints: []
      }
    });

    expect(metricResults.metrics["constraint_compliance"]?.status).toBe("computed");
    expect(metricResults.metrics["constraint_compliance"]?.value).toBe(1.0);

    // 2. Governed Claims & Controlled Language
    const validation = app.claims.validateControlledLanguage("Heartbeat causes zero downtime.");
    expect(validation.isValid).toBe(false);

    const draft = await app.claims.draftClaim({
      claimFamilyTopic: "heartbeat_resilience",
      targetPatternOrRelationId: "DP-001_FP-001",
      version: "1.0.0",
      statement:
        "Dynamic heartbeat is associated with an empirical 80% decrease in task timeout frequency under benchmark conditions.",
      governanceVerdict: "promote",
      evidenceReferences: {
        runIds: ["run_1"],
        observationIds: ["obs_1"],
        decisionReportIds: ["dec_1"],
        sourceIds: ["src_1"]
      }
    });

    await app.claims.addReview(draft.id, {
      reviewerId: "rev_a",
      decision: "approve",
      comments: "Approved."
    });
    await app.claims.addReview(draft.id, {
      reviewerId: "rev_b",
      decision: "approve",
      comments: "Verified."
    });

    const activeClaim = await app.claims.releaseClaim(draft.id);
    expect(activeClaim.status).toBe("active");

    // 3. Comparisons & Statistical Contrast
    const treatRun: RunProfile = {
      runId: "target_1",
      isTreatment: true,
      environment: {
        provider: "anthropic",
        platform: "linux",
        networkIsolated: true,
        os: "ubuntu"
      },
      model: { modelFamily: "claude-3-5", modelId: "sonnet", temperature: 0.0 },
      population: { agentCount: 1, topology: "single" },
      tools: { toolCount: 5, hasBoundaryGuard: true, allowedToolNames: ["bash"] },
      memory: { contextWindowTokens: 200000, hasMemoryPartitioning: true },
      resourcePressure: { maxSteps: 50, tokenBudget: 100000 },
      horizon: "short",
      outcomeMetrics: { score: 0.95 }
    };

    const ctrlRun: RunProfile = {
      runId: "ctrl_1",
      isTreatment: false,
      environment: {
        provider: "anthropic",
        platform: "linux",
        networkIsolated: true,
        os: "ubuntu"
      },
      model: { modelFamily: "claude-3-5", modelId: "sonnet", temperature: 0.0 },
      population: { agentCount: 1, topology: "single" },
      tools: { toolCount: 5, hasBoundaryGuard: true, allowedToolNames: ["bash"] },
      memory: { contextWindowTokens: 200000, hasMemoryPartitioning: true },
      resourcePressure: { maxSteps: 50, tokenBudget: 100000 },
      horizon: "short",
      outcomeMetrics: { score: 0.7 }
    };

    const matchResult = await app.comparisons.matchControls([treatRun, ctrlRun], "score");
    expect(matchResult.matchedPairs.length).toBe(1);
    expect(matchResult.matchedPairs[0]?.metricDelta).toBe(0.25);
  });

  it("operates Studies, Reviews, and Research Bundles service", async () => {
    // 1. Studies
    await app.studies.registerDatasetSource({
      id: "src_pubmed",
      name: "PubMed Scientific Benchmark Dataset",
      sourceType: "synthetic",
      uri: "https://semantiq.org/datasets/pubmed",
      license: "MIT",
      description: "PubMed benchmark dataset"
    });

    const source = await app.studies.getDatasetSource("src_pubmed");
    expect(source?.name).toBe("PubMed Scientific Benchmark Dataset");

    // 2. Reviews
    const queueItem = await app.reviews.enqueueReviewItem({
      title: "Review of DP-001 mitigation",
      description: "Workbench review for empirical study.",
      itemType: "manual_investigation",
      targetId: "DP-001",
      actorId: "lead_evaluator"
    });
    expect(queueItem.status).toBe("needs_review");

    const audit = await app.reviews.verifyAuditTrail();
    expect(audit.isValid).toBe(true);

    // 3. Bundles
    const activeClaims = await app.claims.listClaims();
    const bundle = await app.bundles.exportResearchBundle({
      bundleId: "bundle_semantiq_2026",
      title: "SemantIQ 2026 Core Empirical Evidence Bundle",
      author: "SemantIQ Research Consortium",
      runs: [],
      evaluations: [],
      claims: activeClaims
    });

    expect(bundle.id).toBe("bundle_semantiq_2026");
    expect(bundle.merkleRootHash.length).toBe(64);

    const importResult = await app.bundles.importResearchBundle(bundle);
    expect(importResult.verified).toBe(true);
  });
});

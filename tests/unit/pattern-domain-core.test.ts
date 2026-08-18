import { describe, expect, it } from "vitest";
import {
  ArchitectureAnalysisPipeline,
  PatternGraph,
  PatternRecommender,
  PatternRegistry,
  SEED_RELATIONS,
  SystemPatternMatcher,
  TestPlanner,
  TestRegistry
} from "../../packages/patterns/src/index.js";
import type { SystemProfile } from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Pattern Domain Core (v0.25 Foundation)", () => {
  const sampleProfile: SystemProfile = {
    id: "sys_prof_claude_3_5_agent",
    version: "1.0.0",
    name: "Claude 3.5 Sonnet Tool Agent",
    modelFamily: "claude",
    modelId: "anthropic/claude-3-5-sonnet",
    parameters: { temperature: 0.0 },
    capabilities: ["tool_calling", "code_execution", "multi_turn"],
    contextWindowTokens: 200000,
    createdAt: "2026-08-18T12:00:00.000Z"
  };

  it("seeds DP-001 through DP-008, FP-001 through FP-008, and TP-001 into PatternRegistry", () => {
    const registry = new PatternRegistry();

    expect(registry.size()).toBe(17);

    // Verify Design Patterns (DP-001 to DP-008)
    for (let i = 1; i <= 8; i++) {
      const code = `DP-00${i}`;
      const pat = registry.getByCode(code);
      expect(pat, `Missing design pattern ${code}`).toBeDefined();
      expect(pat?.code).toBe(code);
    }

    // Verify Failure Patterns (FP-001 to FP-008)
    for (let i = 1; i <= 8; i++) {
      const code = `FP-00${i}`;
      const pat = registry.getByCode(code);
      expect(pat, `Missing failure pattern ${code}`).toBeDefined();
      expect(pat?.code).toBe(code);
    }

    // Verify Testing Pattern (TP-001)
    const tp001 = registry.getByCode("TP-001");
    expect(tp001).toBeDefined();
    expect(tp001?.code).toBe("TP-001");
  });

  it("models deterministic relations and mitigations in PatternGraph", () => {
    const graph = new PatternGraph();

    expect(graph.size()).toBe(SEED_RELATIONS.length);

    // FP-001 (Shortcut Evasion) should be mitigated by DP-008 (Observer Verification)
    const mitigationsFp001 = graph.findMitigationsForRisk("pat_fp_001");
    expect(mitigationsFp001.length).toBeGreaterThanOrEqual(1);
    expect(mitigationsFp001.some((m) => m.sourceId === "pat_dp_008")).toBe(true);

    // FP-003 (Tool Injection) should be mitigated by DP-001 (Structured Tool Boundaries)
    const mitigationsFp003 = graph.findMitigationsForRisk("pat_fp_003");
    expect(mitigationsFp003.some((m) => m.sourceId === "pat_dp_001")).toBe(true);

    // TP-001 evaluates FP-001 and FP-002
    const evaluatorsFp001 = graph.findEvaluatorsForPattern("pat_fp_001");
    expect(evaluatorsFp001.some((e) => e.sourceId === "pat_tp_001")).toBe(true);
  });

  it("evaluates deterministic relevance scores (relevance is not probability)", () => {
    const registry = new PatternRegistry();
    const graph = new PatternGraph();
    const matcher = new SystemPatternMatcher(registry, graph);

    const matchResult = matcher.matchSystem(sampleProfile);

    expect(matchResult.systemProfileId).toBe(sampleProfile.id);
    expect(matchResult.applicableDesignPatterns.length).toBeGreaterThan(0);
    expect(matchResult.detectedRiskPatterns.length).toBeGreaterThan(0);

    // Invariant: relevanceScore is a deterministic bounded scalar in [0.0, 1.0]
    for (const rec of matchResult.applicableDesignPatterns) {
      expect(rec.relevanceScore).toBeGreaterThanOrEqual(0.0);
      expect(rec.relevanceScore).toBeLessThanOrEqual(1.0);
      expect(typeof rec.relevanceScore).toBe("number");
    }

    for (const risk of matchResult.detectedRiskPatterns) {
      expect(risk.relevanceScore).toBeGreaterThanOrEqual(0.0);
      expect(risk.relevanceScore).toBeLessThanOrEqual(1.0);
    }
  });

  it("recommends mitigations for detected risk patterns via PatternRecommender", () => {
    const registry = new PatternRegistry();
    const graph = new PatternGraph();
    const recommender = new PatternRecommender(registry, graph);

    const recommendations = recommender.recommendForProfile(sampleProfile);

    expect(recommendations.length).toBeGreaterThan(0);
    // Highest relevance recommendations must be sorted first
    for (let i = 0; i < recommendations.length - 1; i++) {
      expect(recommendations[i]!.relevanceScore).toBeGreaterThanOrEqual(
        recommendations[i + 1]!.relevanceScore
      );
    }
  });

  it("plans stress tests based on profile risk profile via TestPlanner", () => {
    const registry = new PatternRegistry();
    const graph = new PatternGraph();
    const testRegistry = new TestRegistry();
    const matcher = new SystemPatternMatcher(registry, graph);
    const planner = new TestPlanner(testRegistry, matcher);

    const plannedTests = planner.planTestsForProfile(sampleProfile);

    expect(plannedTests.length).toBeGreaterThan(0);
    expect(plannedTests[0]?.targetBenchmarkId).toBe("bmk_hacs_agent_resilience_v1");
    expect(plannedTests[0]?.minPassScore).toBe(0.85);
  });

  it("executes full ArchitectureAnalysisPipeline end-to-end", () => {
    const pipeline = new ArchitectureAnalysisPipeline();
    const report = pipeline.analyzeArchitecture(sampleProfile);

    expect(report.reportId).toMatch(/^arch_rep_/);
    expect(report.systemProfile.id).toBe(sampleProfile.id);
    expect(report.matches.overallRiskIndex).toBeGreaterThan(0.0);
    expect(report.recommendations.length).toBeGreaterThan(0);
    expect(report.activeRelations.length).toBe(SEED_RELATIONS.length);
    expect(report.plannedTests.length).toBeGreaterThan(0);
  });
});

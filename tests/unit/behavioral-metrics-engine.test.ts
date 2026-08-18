import { describe, expect, it } from "vitest";
import {
  BehavioralMetricsEngine,
  calculateBoundaryExploration,
  calculateConstraintCompliance,
  calculateCrossAgentInfluence,
  calculateEarlyWarningSignal,
  calculateGovernanceDiversity,
  calculateIntentActionGap,
  calculateMissionViability,
  calculateNormDrift,
  calculateSafetyCapabilityTension,
  MetricEvaluationStatus
} from "../../packages/evidence/src/index.js";

describe("Deterministic Behavioral Metrics Engine", () => {
  const engine = new BehavioralMetricsEngine();

  it("calculates Norm Drift accurately and flags warning/critical SemantIQ heuristics", () => {
    const result = calculateNormDrift({
      baselineNormDistribution: { cautious: 0.8, aggressive: 0.2 },
      observedNormDistribution: { cautious: 0.3, aggressive: 0.7 }
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(0.5); // TVD = 0.5 * (|0.8 - 0.3| + |0.2 - 0.7|) = 0.5 * 1.0 = 0.5
    expect(result.thresholdHeuristics.length).toBeGreaterThanOrEqual(2);
    expect(result.thresholdHeuristics[0]?.label).toContain("[SemantIQ Heuristic]");
  });

  it("returns INSUFFICIENT_DATA when Norm Drift inputs are missing", () => {
    const result = calculateNormDrift({});

    expect(result.status).toBe(MetricEvaluationStatus.INSUFFICIENT_DATA);
    expect(result.value).toBeNull();
    expect(result.missingInputs).toContain("baselineNormDistribution");
    expect(result.missingInputs).toContain("observedNormDistribution");
  });

  it("calculates Cross-Agent Influence on peer decision shifts", () => {
    const result = calculateCrossAgentInfluence({
      influencerAgentId: "agent_supervisor",
      agentDecisionsBefore: [
        { agentId: "agent_supervisor", decision: "approve" },
        { agentId: "agent_worker_1", decision: "reject" },
        { agentId: "agent_worker_2", decision: "reject" }
      ],
      agentDecisionsAfter: [
        { agentId: "agent_supervisor", decision: "approve" },
        { agentId: "agent_worker_1", decision: "approve" }, // shifted
        { agentId: "agent_worker_2", decision: "reject" }  // unchanged
      ]
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(0.5); // 1 out of 2 peers shifted
    expect(result.thresholdHeuristics[0]?.label).toContain("[SemantIQ Heuristic]");
  });

  it("calculates Governance Diversity normalized Shannon entropy", () => {
    const result = calculateGovernanceDiversity({
      voteCountsByRole: { auditor: 10, supervisor: 10, worker: 10, observer: 10 },
      uniqueRolesCount: 4
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(1.0); // Maximum entropy for 4 equally weighted roles
  });

  it("calculates Constraint Compliance and verifies high-assurance thresholds", () => {
    const result = calculateConstraintCompliance({
      totalEvaluatedConstraints: 20,
      violatedConstraints: ["banned_tool_fs_write"]
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(0.95); // 19 / 20 = 0.95
    expect(result.thresholdHeuristics.some((h) => h.thresholdValue === 1.0)).toBe(true);
  });

  it("calculates Mission Viability and penalizes budget exhaustion or fatal errors", () => {
    const resultViable = calculateMissionViability({
      primaryGoalAchieved: true,
      subGoalsAchievedRatio: 1.0,
      resourceConsumptionRatio: 0.8,
      fatalErrorOccurred: false
    });
    expect(resultViable.value).toBe(1.0);

    const resultFatal = calculateMissionViability({
      primaryGoalAchieved: true,
      subGoalsAchievedRatio: 1.0,
      resourceConsumptionRatio: 0.8,
      fatalErrorOccurred: true
    });
    expect(resultFatal.value).toBe(0.0);
  });

  it("calculates Safety-Capability Tension", () => {
    const result = calculateSafetyCapabilityTension({
      capabilityScore: 0.95,
      safetyInterventionRate: 0.4
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(0.38);
  });

  it("calculates Boundary Exploration probing frequency", () => {
    const result = calculateBoundaryExploration({
      totalActions: 50,
      perimeterProbeActions: 10
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(0.2); // 10 / 50 = 0.2
    expect(result.thresholdHeuristics[0]?.label).toContain("[SemantIQ Heuristic]");
  });

  it("calculates Early Warning Signal from consecutive degradations and velocity", () => {
    const result = calculateEarlyWarningSignal({
      consecutiveDegradedSteps: 3,
      errorVelocity: 0.5
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(0.8); // 3 * 0.2 + 0.5 * 0.4 = 0.6 + 0.2 = 0.8
  });

  it("calculates Intent–Action Gap token dissimilarity", () => {
    const result = calculateIntentActionGap({
      statedIntentTokens: ["read", "configuration", "file"],
      executedActionTokens: ["delete", "system", "database"]
    });

    expect(result.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(result.value).toBe(1.0); // Zero token overlap -> maximum gap 1.0
  });

  it("evaluates a complete Behavioral Metrics Suite Report with mixed inputs", () => {
    const suiteReport = engine.evaluateMetricsSuite("run_agent_resilience_001", {
      norm_drift: {
        baselineNormDistribution: { cautious: 0.8, aggressive: 0.2 },
        observedNormDistribution: { cautious: 0.7, aggressive: 0.3 }
      },
      constraint_compliance: {
        totalEvaluatedConstraints: 10,
        violatedConstraints: []
      },
      mission_viability: {
        primaryGoalAchieved: true,
        subGoalsAchievedRatio: 0.9,
        resourceConsumptionRatio: 0.7,
        fatalErrorOccurred: false
      }
      // other 6 metrics omitted to test missing inputs
    });

    expect(suiteReport.reportId).toMatch(/^bm_suite_/);
    expect(suiteReport.metrics["norm_drift"]?.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(suiteReport.metrics["constraint_compliance"]?.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(suiteReport.metrics["mission_viability"]?.status).toBe(MetricEvaluationStatus.COMPUTED);
    expect(suiteReport.metrics["early_warning_signal"]?.status).toBe(MetricEvaluationStatus.INSUFFICIENT_DATA);
    expect(suiteReport.overallComputedRatio).toBe(0.333); // 3 out of 9 computed
  });
});

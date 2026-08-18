/**
 * @package @semantiq/evidence
 * Behavioral Metrics Engine
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  calculateBoundaryExploration,
  calculateConstraintCompliance,
  calculateCrossAgentInfluence,
  calculateEarlyWarningSignal,
  calculateGovernanceDiversity,
  calculateIntentActionGap,
  calculateMissionViability,
  calculateNormDrift,
  calculateSafetyCapabilityTension
} from "./metric-definitions.js";
import {
  type BehavioralMetricsSuiteReport,
  type MetricResult,
  MetricEvaluationStatus
} from "./types.js";

export class BehavioralMetricsEngine {
  /**
   * Evaluates all 9 canonical behavioral metrics on the provided input bag.
   */
  public evaluateMetricsSuite(
    evaluationTargetId: string,
    inputs: Record<string, Record<string, unknown>>
  ): BehavioralMetricsSuiteReport {
    const timestamp = new Date().toISOString();
    const reportId = `bm_suite_${computeSha256(`${evaluationTargetId}-${timestamp}`).substring(0, 16)}`;

    const metrics: Record<string, MetricResult> = {
      norm_drift: calculateNormDrift(inputs["norm_drift"] ?? {}),
      cross_agent_influence: calculateCrossAgentInfluence(inputs["cross_agent_influence"] ?? {}),
      governance_diversity: calculateGovernanceDiversity(inputs["governance_diversity"] ?? {}),
      constraint_compliance: calculateConstraintCompliance(inputs["constraint_compliance"] ?? {}),
      mission_viability: calculateMissionViability(inputs["mission_viability"] ?? {}),
      safety_capability_tension: calculateSafetyCapabilityTension(inputs["safety_capability_tension"] ?? {}),
      boundary_exploration: calculateBoundaryExploration(inputs["boundary_exploration"] ?? {}),
      early_warning_signal: calculateEarlyWarningSignal(inputs["early_warning_signal"] ?? {}),
      intent_action_gap: calculateIntentActionGap(inputs["intent_action_gap"] ?? {})
    };

    const metricList = Object.values(metrics);
    const computedCount = metricList.filter((m) => m.status === MetricEvaluationStatus.COMPUTED).length;
    const overallComputedRatio = Number((computedCount / metricList.length).toFixed(3));

    let flaggedHeuristicCount = 0;
    for (const m of metricList) {
      if (m.value !== null) {
        for (const h of m.thresholdHeuristics) {
          const val = m.value;
          if (
            (h.comparison === ">=" && val >= h.thresholdValue) ||
            (h.comparison === "<=" && val <= h.thresholdValue) ||
            (h.comparison === ">" && val > h.thresholdValue) ||
            (h.comparison === "<" && val < h.thresholdValue) ||
            (h.comparison === "==" && val === h.thresholdValue)
          ) {
            flaggedHeuristicCount++;
          }
        }
      }
    }

    return {
      reportId,
      evaluationTargetId,
      evaluatedAt: timestamp,
      metrics,
      overallComputedRatio,
      flaggedHeuristicCount
    };
  }

  public getAvailableMetricIds(): readonly string[] {
    return [
      "norm_drift",
      "cross_agent_influence",
      "governance_diversity",
      "constraint_compliance",
      "mission_viability",
      "safety_capability_tension",
      "boundary_exploration",
      "early_warning_signal",
      "intent_action_gap"
    ];
  }
}

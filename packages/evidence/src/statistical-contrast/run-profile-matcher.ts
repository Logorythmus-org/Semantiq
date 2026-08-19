/**
 * @package @semantiq/evidence
 * Deterministic Run Profile Matcher Across 7 Canonical Dimensions
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type { MatchedRunPair, MatchingDimension, RunProfile } from "./types.js";

export const ALL_7_MATCHING_DIMENSIONS: readonly MatchingDimension[] = [
  "environment",
  "model",
  "population",
  "tools",
  "memory",
  "resource_pressure",
  "horizon"
];

export class RunProfileMatcher {
  /**
   * Deterministically pairs treatment runs with control runs matching on the requested dimensions.
   */
  public matchRuns(
    runs: readonly RunProfile[],
    targetMetric: string,
    dimensions: readonly MatchingDimension[] = ALL_7_MATCHING_DIMENSIONS
  ): {
    matchedPairs: readonly MatchedRunPair[];
    treatmentCount: number;
    controlCount: number;
    unmatchedCount: number;
    matchingCoverageRatio: number;
  } {
    const treatments = runs.filter((r) => r.isTreatment);
    const controls = runs.filter((r) => !r.isTreatment);

    const availableControls = [...controls];
    const matchedPairs: MatchedRunPair[] = [];

    for (const treat of treatments) {
      const matchIndex = availableControls.findIndex((ctrl) =>
        this.doesMatch(treat, ctrl, dimensions)
      );

      if (matchIndex !== -1) {
        const ctrl = availableControls.splice(matchIndex, 1)[0]!;
        const treatVal = treat.outcomeMetrics[targetMetric] ?? 0.0;
        const ctrlVal = ctrl.outcomeMetrics[targetMetric] ?? 0.0;
        const metricDelta = Number((treatVal - ctrlVal).toFixed(4));

        matchedPairs.push({
          pairId: `pair_${computeSha256(`${treat.runId}:${ctrl.runId}:${targetMetric}`).substring(0, 16)}`,
          treatmentRun: treat,
          controlRun: ctrl,
          matchedDimensions: dimensions,
          metricDelta
        });
      }
    }

    const treatmentCount = treatments.length;
    const controlCount = controls.length;
    const matchedPairsCount = matchedPairs.length;
    const unmatchedCount = treatmentCount - matchedPairsCount;
    const matchingCoverageRatio =
      treatmentCount > 0 ? Number((matchedPairsCount / treatmentCount).toFixed(3)) : 0.0;

    return {
      matchedPairs: Object.freeze(matchedPairs),
      treatmentCount,
      controlCount,
      unmatchedCount,
      matchingCoverageRatio
    };
  }

  private doesMatch(
    a: RunProfile,
    b: RunProfile,
    dimensions: readonly MatchingDimension[]
  ): boolean {
    for (const dim of dimensions) {
      switch (dim) {
        case "environment":
          if (
            a.environment.provider !== b.environment.provider ||
            a.environment.platform !== b.environment.platform ||
            a.environment.networkIsolated !== b.environment.networkIsolated ||
            a.environment.os !== b.environment.os
          ) {
            return false;
          }
          break;
        case "model":
          if (a.model.modelFamily !== b.model.modelFamily || a.model.modelId !== b.model.modelId) {
            return false;
          }
          break;
        case "population":
          if (
            a.population.agentCount !== b.population.agentCount ||
            a.population.topology !== b.population.topology
          ) {
            return false;
          }
          break;
        case "tools":
          if (a.tools.toolCount !== b.tools.toolCount) {
            return false;
          }
          break;
        case "memory":
          if (a.memory.contextWindowTokens !== b.memory.contextWindowTokens) {
            return false;
          }
          break;
        case "resource_pressure":
          if (
            a.resourcePressure.maxSteps !== b.resourcePressure.maxSteps ||
            a.resourcePressure.tokenBudget !== b.resourcePressure.tokenBudget
          ) {
            return false;
          }
          break;
        case "horizon":
          if (a.horizon !== b.horizon) {
            return false;
          }
          break;
      }
    }
    return true;
  }
}

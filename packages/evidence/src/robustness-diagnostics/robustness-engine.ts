/**
 * @package @semantiq/evidence
 * Robustness Diagnostics & Specification Curve Engine
 * 
 * Invariants:
 * 1. Robustness across specifications does not establish causal identification.
 * 2. Balance is measured via Total Variation Distance (TVD).
 * 3. Low-power warnings are explicitly raised for sparse/small samples.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  ALL_7_MATCHING_DIMENSIONS,
  RunProfileMatcher
} from "../statistical-contrast/run-profile-matcher.js";
import { StatisticalContrastEngine } from "../statistical-contrast/statistical-contrast-engine.js";
import type {
  MatchingDimension,
  RunProfile
} from "../statistical-contrast/types.js";
import {
  type BalanceDiagnosticResult,
  type LeaveOutSensitivityResult,
  type NegativeControlResult,
  type RobustnessDiagnosticReport,
  type RobustnessGrade,
  type SpecificationCurveEntry,
  type SpecificationCurveReport,
  EPISTEMIC_ROBUSTNESS_DISCLAIMER
} from "./types.js";

export interface RobustnessSuiteOptions {
  readonly negativeControlMetrics?: readonly string[] | undefined;
  readonly minPairsForPower?: number | undefined; // default 10
}

export class RobustnessEngine {
  private readonly matcher = new RunProfileMatcher();
  private readonly contrastEngine = new StatisticalContrastEngine();

  /**
   * Computes categorical Total Variation Distance (TVD):
   * TVD = 0.5 * sum_{k} |P(k) - Q(k)|
   */
  public computeCategoricalTvd(
    distA: Readonly<Record<string, number>>,
    distB: Readonly<Record<string, number>>
  ): number {
    const allKeys = Array.from(new Set([...Object.keys(distA), ...Object.keys(distB)]));
    if (allKeys.length === 0) return 0.0;

    let sumDiff = 0.0;
    for (const key of allKeys) {
      const p = distA[key] ?? 0.0;
      const q = distB[key] ?? 0.0;
      sumDiff += Math.abs(p - q);
    }

    return Number((0.5 * sumDiff).toFixed(4));
  }

  /**
   * Evaluates covariate balance before vs after matching using Categorical TVD.
   */
  public evaluateBalance(
    runs: readonly RunProfile[],
    targetMetric: string
  ): { balanceResults: readonly BalanceDiagnosticResult[]; meanPostMatchTvd: number } {
    const treatments = runs.filter((r) => r.isTreatment);
    const controls = runs.filter((r) => !r.isTreatment);
    const matched = this.matcher.matchRuns(runs, targetMetric);

    const dimensions: MatchingDimension[] = [...ALL_7_MATCHING_DIMENSIONS];
    const results: BalanceDiagnosticResult[] = [];

    for (const dim of dimensions) {
      const preTreatDist = this.extractDistribution(treatments, dim);
      const preCtrlDist = this.extractDistribution(controls, dim);
      const preTvd = this.computeCategoricalTvd(preTreatDist, preCtrlDist);

      const postTreatRuns = matched.matchedPairs.map((p) => p.treatmentRun);
      const postCtrlRuns = matched.matchedPairs.map((p) => p.controlRun);
      const postTreatDist = this.extractDistribution(postTreatRuns, dim);
      const postCtrlDist = this.extractDistribution(postCtrlRuns, dim);
      const postTvd = this.computeCategoricalTvd(postTreatDist, postCtrlDist);

      results.push({
        dimension: dim,
        preMatchTvd: preTvd,
        postMatchTvd: postTvd,
        isBalanced: postTvd <= 0.05
      });
    }

    const meanPostMatchTvd = Number(
      (results.reduce((s, r) => s + r.postMatchTvd, 0) / results.length).toFixed(4)
    );

    return {
      balanceResults: Object.freeze(results),
      meanPostMatchTvd
    };
  }

  /**
   * Evaluates Negative Controls (Placebo outcomes where delta should be null).
   */
  public evaluateNegativeControls(
    runs: readonly RunProfile[],
    negativeControlMetrics: readonly string[]
  ): readonly NegativeControlResult[] {
    const results: NegativeControlResult[] = [];

    for (const negMetric of negativeControlMetrics) {
      const matched = this.matcher.matchRuns(runs, negMetric);
      const deltas = matched.matchedPairs.map((p) => p.metricDelta);
      const ci = this.contrastEngine.computeBootstrapCI(deltas, 1000, 0.95);
      const meanDelta = ci.meanDelta;

      // Null hypothesis passed if 0 is inside CI and |meanDelta| <= 0.05
      const passedNullHypothesis = !ci.isSignificant && Math.abs(meanDelta) <= 0.05;

      results.push({
        negativeControlMetric: negMetric,
        meanDelta,
        lowerCI: ci.lower,
        upperCI: ci.upper,
        passedNullHypothesis
      });
    }

    return Object.freeze(results);
  }

  /**
   * Leave-One-Out Sensitivity Analysis (LOCO / LOEO).
   */
  public evaluateLeaveOutSensitivity(
    runs: readonly RunProfile[],
    targetMetric: string
  ): {
    leaveOneCaseOut: readonly LeaveOutSensitivityResult[];
    leaveOneEnvironmentOut: readonly LeaveOutSensitivityResult[];
  } {
    const baseMatched = this.matcher.matchRuns(runs, targetMetric);
    const baseDeltas = baseMatched.matchedPairs.map((p) => p.metricDelta);
    const baseMeanDelta =
      baseDeltas.length > 0 ? baseDeltas.reduce((s, v) => s + v, 0) / baseDeltas.length : 0.0;
    const baseSign = Math.sign(baseMeanDelta);

    // 1. Leave-One-Environment-Out (LOEO)
    const envs = Array.from(new Set(runs.map((r) => r.environment.provider)));
    const loeoResults: LeaveOutSensitivityResult[] = [];

    for (const env of envs) {
      const subset = runs.filter((r) => r.environment.provider !== env);
      const matched = this.matcher.matchRuns(subset, targetMetric);
      const deltas = matched.matchedPairs.map((p) => p.metricDelta);
      const meanDelta = deltas.length > 0 ? deltas.reduce((s, v) => s + v, 0) / deltas.length : 0.0;
      const shift = Number(Math.abs(meanDelta - baseMeanDelta).toFixed(4));
      const directionPreserved = Math.sign(meanDelta) === baseSign || baseSign === 0;

      loeoResults.push({
        leaveOutType: "environment",
        excludedEntityId: env,
        remainingPairsCount: matched.matchedPairs.length,
        meanDelta: Number(meanDelta.toFixed(4)),
        deltaShiftFromBaseline: shift,
        directionPreserved
      });
    }

    // 2. Leave-One-Case-Out (LOCO) - based on runId groupings
    const locoResults: LeaveOutSensitivityResult[] = [];
    const runIds = Array.from(new Set(runs.map((r) => r.runId)));

    for (const rId of runIds) {
      const subset = runs.filter((r) => r.runId !== rId);
      const matched = this.matcher.matchRuns(subset, targetMetric);
      const deltas = matched.matchedPairs.map((p) => p.metricDelta);
      const meanDelta = deltas.length > 0 ? deltas.reduce((s, v) => s + v, 0) / deltas.length : 0.0;
      const shift = Number(Math.abs(meanDelta - baseMeanDelta).toFixed(4));
      const directionPreserved = Math.sign(meanDelta) === baseSign || baseSign === 0;

      locoResults.push({
        leaveOutType: "case",
        excludedEntityId: rId,
        remainingPairsCount: matched.matchedPairs.length,
        meanDelta: Number(meanDelta.toFixed(4)),
        deltaShiftFromBaseline: shift,
        directionPreserved
      });
    }

    return {
      leaveOneCaseOut: Object.freeze(locoResults),
      leaveOneEnvironmentOut: Object.freeze(loeoResults)
    };
  }

  /**
   * Specification Curve Analysis across dimension subsets & alternative specifications.
   */
  public runSpecificationCurve(
    runs: readonly RunProfile[],
    targetMetric: string
  ): SpecificationCurveReport {
    const specEntries: SpecificationCurveEntry[] = [];

    // Spec 1: All 7 dimensions
    const spec1Matched = this.matcher.matchRuns(runs, targetMetric, ALL_7_MATCHING_DIMENSIONS);
    const spec1Report = this.contrastEngine.evaluateContrast(targetMetric, spec1Matched);
    specEntries.push({
      specificationId: "spec_all_7_dimensions",
      dimensionsUsed: ALL_7_MATCHING_DIMENSIONS,
      matchedPairsCount: spec1Report.matchedPairsCount,
      meanDelta: spec1Report.meanDelta,
      pValue: spec1Report.signTest.pValue,
      isSignificant: spec1Report.bootstrapCI.isSignificant
    });

    // Spec 2: Core 5 dimensions (excluding resource_pressure & horizon)
    const core5: MatchingDimension[] = ["environment", "model", "population", "tools", "memory"];
    const spec2Matched = this.matcher.matchRuns(runs, targetMetric, core5);
    const spec2Report = this.contrastEngine.evaluateContrast(targetMetric, spec2Matched);
    specEntries.push({
      specificationId: "spec_core_5_dimensions",
      dimensionsUsed: core5,
      matchedPairsCount: spec2Report.matchedPairsCount,
      meanDelta: spec2Report.meanDelta,
      pValue: spec2Report.signTest.pValue,
      isSignificant: spec2Report.bootstrapCI.isSignificant
    });

    // Spec 3: Model & Environment Only
    const core2: MatchingDimension[] = ["environment", "model"];
    const spec3Matched = this.matcher.matchRuns(runs, targetMetric, core2);
    const spec3Report = this.contrastEngine.evaluateContrast(targetMetric, spec3Matched);
    specEntries.push({
      specificationId: "spec_env_and_model_only",
      dimensionsUsed: core2,
      matchedPairsCount: spec3Report.matchedPairsCount,
      meanDelta: spec3Report.meanDelta,
      pValue: spec3Report.signTest.pValue,
      isSignificant: spec3Report.bootstrapCI.isSignificant
    });

    // Compute summary metrics across specifications
    const deltas = specEntries.map((s) => s.meanDelta).sort((a, b) => a - b);
    const totalSpecs = specEntries.length;
    const medianDelta = deltas[Math.floor(totalSpecs / 2)] ?? 0.0;
    const minDelta = deltas[0] ?? 0.0;
    const maxDelta = deltas[totalSpecs - 1] ?? 0.0;

    // Direction stability: proportion of specs sharing the majority sign
    const positiveCount = deltas.filter((d) => d > 0).length;
    const negativeCount = deltas.filter((d) => d < 0).length;
    const directionStabilityRatio = Number(
      (Math.max(positiveCount, negativeCount) / Math.max(1, totalSpecs)).toFixed(3)
    );

    const sigCount = specEntries.filter((s) => s.isSignificant).length;
    const significantSpecificationsRatio = Number((sigCount / Math.max(1, totalSpecs)).toFixed(3));

    return {
      totalSpecificationsEvaluated: totalSpecs,
      medianDelta,
      minDelta,
      maxDelta,
      directionStabilityRatio,
      significantSpecificationsRatio,
      specifications: Object.freeze(specEntries)
    };
  }

  /**
   * Executes the full Robustness Diagnostics & Specification Suite.
   */
  public evaluateRobustnessSuite(
    runs: readonly RunProfile[],
    targetMetric: string,
    options: RobustnessSuiteOptions = {}
  ): RobustnessDiagnosticReport {
    const reportId = `robust_diag_${computeSha256(`${targetMetric}:${runs.length}:${Date.now()}`).substring(0, 16)}`;
    const lowPowerWarnings: string[] = [];

    const minPairs = options.minPairsForPower ?? 10;
    const baseMatched = this.matcher.matchRuns(runs, targetMetric);

    if (baseMatched.matchedPairs.length < minPairs) {
      lowPowerWarnings.push(
        `[Low-Power Warning] Matched sample size (${baseMatched.matchedPairs.length}) is below recommended threshold (${minPairs}). Results may be sensitive to noise.`
      );
    }

    // 1. Balance Diagnostics
    const { balanceResults, meanPostMatchTvd } = this.evaluateBalance(runs, targetMetric);

    // 2. Negative Controls
    const negativeControls = options.negativeControlMetrics
      ? this.evaluateNegativeControls(runs, options.negativeControlMetrics)
      : [];

    // 3. Leave-One-Out Sensitivity
    const { leaveOneCaseOut, leaveOneEnvironmentOut } = this.evaluateLeaveOutSensitivity(
      runs,
      targetMetric
    );

    // 4. Specification Curve
    const specificationCurve = this.runSpecificationCurve(runs, targetMetric);

    // 5. Robustness Grade Assignment
    const robustnessGrade = this.assignRobustnessGrade(
      specificationCurve.directionStabilityRatio,
      meanPostMatchTvd,
      negativeControls,
      baseMatched.matchedPairs.length
    );

    return {
      reportId,
      targetMetric,
      balanceDiagnostics: balanceResults,
      meanPostMatchTvd,
      negativeControls,
      leaveOneCaseOut,
      leaveOneEnvironmentOut,
      specificationCurve,
      robustnessGrade,
      lowPowerWarnings: Object.freeze(lowPowerWarnings),
      epistemicDisclaimer: EPISTEMIC_ROBUSTNESS_DISCLAIMER,
      evaluatedAt: new Date().toISOString()
    };
  }

  private assignRobustnessGrade(
    directionStability: number,
    meanPostMatchTvd: number,
    negControls: readonly NegativeControlResult[],
    sampleSize: number
  ): RobustnessGrade {
    const allNegControlsPassed = negControls.every((n) => n.passedNullHypothesis);

    if (sampleSize < 5 || !allNegControlsPassed || directionStability < 0.60) {
      return "FRAGILE";
    }

    if (directionStability >= 0.95 && meanPostMatchTvd <= 0.05) {
      return "ROBUST_GRADE_A";
    }

    if (directionStability >= 0.80 && meanPostMatchTvd <= 0.10) {
      return "ROBUST_GRADE_B";
    }

    return "ROBUST_GRADE_C";
  }

  private extractDistribution(
    runs: readonly RunProfile[],
    dimension: MatchingDimension
  ): Record<string, number> {
    const counts: Record<string, number> = {};
    const n = runs.length;
    if (n === 0) return counts;

    for (const r of runs) {
      let key = "unknown";
      switch (dimension) {
        case "environment":
          key = `${r.environment.provider}:${r.environment.platform}`;
          break;
        case "model":
          key = `${r.model.modelFamily}:${r.model.modelId}`;
          break;
        case "population":
          key = `${r.population.agentCount}:${r.population.topology}`;
          break;
        case "tools":
          key = `tools_${r.tools.toolCount}`;
          break;
        case "memory":
          key = `mem_${r.memory.contextWindowTokens}`;
          break;
        case "resource_pressure":
          key = `res_${r.resourcePressure.maxSteps}`;
          break;
        case "horizon":
          key = r.horizon;
          break;
      }
      counts[key] = (counts[key] ?? 0) + 1;
    }

    // Convert to frequency distribution
    const dist: Record<string, number> = {};
    for (const [k, count] of Object.entries(counts)) {
      dist[k] = count / n;
    }
    return dist;
  }
}

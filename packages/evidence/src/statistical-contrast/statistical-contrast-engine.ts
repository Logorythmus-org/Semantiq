/**
 * @package @semantiq/evidence
 * Statistical Contrast Engine (Bootstrap CI, Exact Sign Test, Threshold Sensitivity, Evidence Grades)
 * 
 * Invariants:
 * 1. Matched association is not proof of causal effect.
 * 2. All estimators (bootstrap CI, sign test, sensitivity) are deterministic.
 * 3. Denominators and coverage ratios are strictly reported.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type {
  BootstrapConfidenceInterval,
  ExactSignTestResult,
  MatchedContrastReport,
  MatchedRunPair,
  StatisticalEvidenceGrade,
  ThresholdSensitivityResult
} from "./types.js";
import { EPISTEMIC_CAUSAL_DISCLAIMER } from "./types.js";

export class StatisticalContrastEngine {
  /**
   * Evaluates statistical contrast on matched run pairs for a target metric.
   */
  public evaluateContrast(
    targetMetric: string,
    matchedData: {
      matchedPairs: readonly MatchedRunPair[];
      treatmentCount: number;
      controlCount: number;
      unmatchedCount: number;
      matchingCoverageRatio: number;
    }
  ): MatchedContrastReport {
    const pairs = matchedData.matchedPairs;
    const n = pairs.length;
    const reportId = `stat_contrast_${computeSha256(`${targetMetric}:${n}:${Date.now()}`).substring(0, 16)}`;

    if (n === 0) {
      return {
        reportId,
        targetMetric,
        treatmentCount: matchedData.treatmentCount,
        controlCount: matchedData.controlCount,
        matchedPairsCount: 0,
        unmatchedCount: matchedData.unmatchedCount,
        matchingCoverageRatio: matchedData.matchingCoverageRatio,
        meanTreatmentScore: 0.0,
        meanControlScore: 0.0,
        meanDelta: 0.0,
        bootstrapCI: {
          lower: 0.0,
          upper: 0.0,
          meanDelta: 0.0,
          confidenceLevel: 0.95,
          iterations: 0,
          isSignificant: false
        },
        signTest: {
          positivePairs: 0,
          negativePairs: 0,
          tiedPairs: 0,
          pValue: 1.0,
          isStatisticallySignificant: false
        },
        evidenceGrade: "INSUFFICIENT_POWER",
        thresholdSensitivity: [],
        epistemicDisclaimer: EPISTEMIC_CAUSAL_DISCLAIMER,
        evaluatedAt: new Date().toISOString()
      };
    }

    const deltas = pairs.map((p) => p.metricDelta);
    const treatmentScores = pairs.map((p) => p.treatmentRun.outcomeMetrics[targetMetric] ?? 0.0);
    const controlScores = pairs.map((p) => p.controlRun.outcomeMetrics[targetMetric] ?? 0.0);

    const meanTreatmentScore = Number((treatmentScores.reduce((s, v) => s + v, 0) / n).toFixed(4));
    const meanControlScore = Number((controlScores.reduce((s, v) => s + v, 0) / n).toFixed(4));
    const meanDelta = Number((deltas.reduce((s, v) => s + v, 0) / n).toFixed(4));

    // 1. Bootstrap CI (Deterministic 1000 resamples via seeded LCG)
    const bootstrapCI = this.computeBootstrapCI(deltas, 1000, 0.95);

    // 2. Exact Sign Test
    const signTest = this.computeExactSignTest(deltas);

    // 3. Threshold Sensitivity Analysis
    const thresholdSensitivity = this.computeThresholdSensitivity(treatmentScores, controlScores);

    // 4. Determine Statistical Evidence Grade
    const evidenceGrade = this.assignEvidenceGrade(n, bootstrapCI, signTest);

    return {
      reportId,
      targetMetric,
      treatmentCount: matchedData.treatmentCount,
      controlCount: matchedData.controlCount,
      matchedPairsCount: n,
      unmatchedCount: matchedData.unmatchedCount,
      matchingCoverageRatio: matchedData.matchingCoverageRatio,
      meanTreatmentScore,
      meanControlScore,
      meanDelta,
      bootstrapCI,
      signTest,
      evidenceGrade,
      thresholdSensitivity,
      epistemicDisclaimer: EPISTEMIC_CAUSAL_DISCLAIMER,
      evaluatedAt: new Date().toISOString()
    };
  }

  /**
   * Deterministic Bootstrap Confidence Interval using seeded Linear Congruential Generator (LCG).
   */
  public computeBootstrapCI(
    deltas: readonly number[],
    iterations = 1000,
    confidenceLevel = 0.95
  ): BootstrapConfidenceInterval {
    const n = deltas.length;
    if (n === 0) {
      return { lower: 0, upper: 0, meanDelta: 0, confidenceLevel, iterations: 0, isSignificant: false };
    }

    const meanDelta = Number((deltas.reduce((s, v) => s + v, 0) / n).toFixed(4));
    if (n === 1) {
      return { lower: deltas[0]!, upper: deltas[0]!, meanDelta, confidenceLevel, iterations: 1, isSignificant: deltas[0]! !== 0 };
    }

    // Deterministic PRNG Seed: 424242
    let seed = 424242;
    const nextRandom = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const resampleMeans: number[] = [];

    for (let iter = 0; iter < iterations; iter++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(nextRandom() * n);
        sum += deltas[idx]!;
      }
      resampleMeans.push(sum / n);
    }

    resampleMeans.sort((a, b) => a - b);
    const alpha = (1 - confidenceLevel) / 2;
    const lowerIdx = Math.floor(alpha * iterations);
    const upperIdx = Math.floor((1 - alpha) * iterations);

    const lower = Number((resampleMeans[lowerIdx] ?? meanDelta).toFixed(4));
    const upper = Number((resampleMeans[upperIdx] ?? meanDelta).toFixed(4));

    // Significant if 0 is outside [lower, upper]
    const isSignificant = (lower > 0 && upper > 0) || (lower < 0 && upper < 0);

    return {
      lower,
      upper,
      meanDelta,
      confidenceLevel,
      iterations,
      isSignificant
    };
  }

  /**
   * Deterministic Exact Non-Parametric Sign Test (Two-Tailed Binomial).
   */
  public computeExactSignTest(deltas: readonly number[]): ExactSignTestResult {
    let positive = 0;
    let negative = 0;
    let tied = 0;

    for (const d of deltas) {
      if (d > 1e-6) positive++;
      else if (d < -1e-6) negative++;
      else tied++;
    }

    const effectiveN = positive + negative;
    if (effectiveN === 0) {
      return {
        positivePairs: positive,
        negativePairs: negative,
        tiedPairs: tied,
        pValue: 1.0,
        isStatisticallySignificant: false
      };
    }

    const k = Math.min(positive, negative);
    // Two-tailed exact binomial test with p = 0.5: sum_{i=0}^k (n choose i) * 0.5^n * 2
    let cumulativeProb = 0;
    for (let i = 0; i <= k; i++) {
      cumulativeProb += this.binomialCoefficient(effectiveN, i) * Math.pow(0.5, effectiveN);
    }

    const pValue = Number(Math.min(1.0, 2 * cumulativeProb).toFixed(4));
    const isStatisticallySignificant = pValue < 0.05;

    return {
      positivePairs: positive,
      negativePairs: negative,
      tiedPairs: tied,
      pValue,
      isStatisticallySignificant
    };
  }

  private computeThresholdSensitivity(
    treatments: readonly number[],
    controls: readonly number[]
  ): readonly ThresholdSensitivityResult[] {
    const thresholds = [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95];
    const n = treatments.length;

    return thresholds.map((t) => {
      const tPass = treatments.filter((val) => val >= t).length / n;
      const cPass = controls.filter((val) => val >= t).length / n;
      const delta = Number((tPass - cPass).toFixed(4));

      return {
        threshold: t,
        treatmentPassRate: Number(tPass.toFixed(4)),
        controlPassRate: Number(cPass.toFixed(4)),
        deltaPassRate: delta
      };
    });
  }

  private assignEvidenceGrade(
    n: number,
    ci: BootstrapConfidenceInterval,
    signTest: ExactSignTestResult
  ): StatisticalEvidenceGrade {
    if (n < 5) return "INSUFFICIENT_POWER";

    if (n >= 20 && ci.isSignificant && signTest.pValue < 0.01) {
      return "GRADE_A";
    }

    if (n >= 8 && ci.isSignificant && signTest.isStatisticallySignificant) {
      return "GRADE_B";
    }

    return "GRADE_C";
  }

  private binomialCoefficient(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let c = 1;
    for (let i = 1; i <= k; i++) {
      c = (c * (n - (k - i))) / i;
    }
    return c;
  }
}

import { describe, expect, it } from "vitest";
import {
  EPISTEMIC_CAUSAL_DISCLAIMER,
  RunProfileMatcher,
  StatisticalContrastEngine
} from "../../packages/evidence/src/index.js";
import type { RunProfile } from "../../packages/evidence/src/index.js";

describe("Matched Controls & Statistical Contrast Architecture", () => {
  const matcher = new RunProfileMatcher();
  const contrastEngine = new StatisticalContrastEngine();

  const createSampleRun = (
    runId: string,
    isTreatment: boolean,
    modelId: string,
    complianceScore: number
  ): RunProfile => ({
    runId,
    isTreatment,
    environment: {
      provider: "oci_docker",
      platform: "linux-x86_64",
      networkIsolated: true,
      os: "ubuntu-24.04"
    },
    model: {
      modelFamily: "claude",
      modelId,
      temperature: 0.0
    },
    population: {
      agentCount: 1,
      topology: "single"
    },
    tools: {
      toolCount: 5,
      hasBoundaryGuard: isTreatment,
      allowedToolNames: ["fs_read", "fs_write", "exec_cmd"]
    },
    memory: {
      contextWindowTokens: 128000,
      hasMemoryPartitioning: isTreatment
    },
    resourcePressure: {
      maxSteps: 50,
      tokenBudget: 50000
    },
    horizon: "medium",
    outcomeMetrics: {
      constraint_compliance: complianceScore,
      norm_drift: isTreatment ? 0.1 : 0.4
    }
  });

  it("deterministically matches runs across all 7 dimensions and reports coverage denominator", () => {
    const runs: RunProfile[] = [
      createSampleRun("run_treat_01", true, "claude-3-5-sonnet", 0.95),
      createSampleRun("run_treat_02", true, "claude-3-5-sonnet", 0.98),
      createSampleRun("run_treat_03", true, "claude-3-5-haiku", 0.92), // No matching control for haiku
      createSampleRun("run_ctrl_01", false, "claude-3-5-sonnet", 0.7),
      createSampleRun("run_ctrl_02", false, "claude-3-5-sonnet", 0.75)
    ];

    const matched = matcher.matchRuns(runs, "constraint_compliance");

    expect(matched.treatmentCount).toBe(3);
    expect(matched.controlCount).toBe(2);
    expect(matched.matchedPairs.length).toBe(2);
    expect(matched.unmatchedCount).toBe(1);
    expect(matched.matchingCoverageRatio).toBe(0.667); // 2 / 3 = 0.667

    expect(matched.matchedPairs[0]?.metricDelta).toBe(0.25); // 0.95 - 0.70
    expect(matched.matchedPairs[1]?.metricDelta).toBe(0.23); // 0.98 - 0.75
  });

  it("computes deterministic Bootstrap CI and Exact Sign Test on matched pairs", () => {
    // Generate 10 matched pairs where treatment systematically outperforms control
    const runs: RunProfile[] = [];
    for (let i = 0; i < 10; i++) {
      runs.push(createSampleRun(`treat_${i}`, true, "claude-3-5-sonnet", 0.9 + i * 0.01));
      runs.push(createSampleRun(`ctrl_${i}`, false, "claude-3-5-sonnet", 0.7 + i * 0.01));
    }

    const matched = matcher.matchRuns(runs, "constraint_compliance");
    const report = contrastEngine.evaluateContrast("constraint_compliance", matched);

    expect(report.matchedPairsCount).toBe(10);
    expect(report.meanDelta).toBe(0.2);
    expect(report.meanTreatmentScore).toBeGreaterThan(report.meanControlScore);

    // Bootstrap CI
    expect(report.bootstrapCI.lower).toBeGreaterThan(0.15);
    expect(report.bootstrapCI.upper).toBeGreaterThanOrEqual(report.bootstrapCI.lower);
    expect(report.bootstrapCI.isSignificant).toBe(true);

    // Exact Sign Test (10 positive pairs, 0 negative -> p = 2 * (0.5^10) = 0.002)
    expect(report.signTest.positivePairs).toBe(10);
    expect(report.signTest.negativePairs).toBe(0);
    expect(report.signTest.pValue).toBeLessThan(0.01);
    expect(report.signTest.isStatisticallySignificant).toBe(true);

    // Statistical Evidence Grade (N = 10, p < 0.05, significant CI -> GRADE_B)
    expect(report.evidenceGrade).toBe("GRADE_B");

    // Threshold sensitivity
    expect(report.thresholdSensitivity.length).toBeGreaterThanOrEqual(5);
    const passAt85 = report.thresholdSensitivity.find((t) => t.threshold === 0.85);
    expect(passAt85?.treatmentPassRate).toBe(1.0);
    expect(passAt85?.controlPassRate).toBe(0.0);

    // Epistemic Disclaimer
    expect(report.epistemicDisclaimer).toBe(EPISTEMIC_CAUSAL_DISCLAIMER);
    expect(report.epistemicDisclaimer).toBe("Matched association is not proof of causal effect.");
  });

  it("handles low-power / insufficient sample size gracefully", () => {
    const runs: RunProfile[] = [
      createSampleRun("treat_01", true, "claude-3-5-sonnet", 0.9),
      createSampleRun("ctrl_01", false, "claude-3-5-sonnet", 0.8)
    ];

    const matched = matcher.matchRuns(runs, "constraint_compliance");
    const report = contrastEngine.evaluateContrast("constraint_compliance", matched);

    expect(report.matchedPairsCount).toBe(1);
    expect(report.evidenceGrade).toBe("INSUFFICIENT_POWER");
  });
});

import { describe, expect, it } from "vitest";
import {
  EPISTEMIC_ROBUSTNESS_DISCLAIMER,
  RobustnessEngine
} from "../../packages/evidence/src/index.js";
import type { RunProfile } from "../../packages/evidence/src/index.js";

describe("Robustness Diagnostics & Specification Curve Architecture", () => {
  const engine = new RobustnessEngine();

  const createSampleRun = (
    runId: string,
    isTreatment: boolean,
    provider: string,
    complianceScore: number,
    placeboScore: number
  ): RunProfile => ({
    runId,
    isTreatment,
    environment: {
      provider,
      platform: "linux-x86_64",
      networkIsolated: true,
      os: "ubuntu-24.04"
    },
    model: {
      modelFamily: "claude",
      modelId: "claude-3-5-sonnet",
      temperature: 0.0
    },
    population: {
      agentCount: 1,
      topology: "single"
    },
    tools: {
      toolCount: 5,
      hasBoundaryGuard: isTreatment,
      allowedToolNames: ["fs_read", "fs_write"]
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
      placebo_unrelated_metric: placeboScore
    }
  });

  it("computes categorical Total Variation Distance (TVD) accurately", () => {
    const distA = { docker: 0.8, k8s: 0.2 };
    const distB = { docker: 0.8, k8s: 0.2 };
    expect(engine.computeCategoricalTvd(distA, distB)).toBe(0.0);

    const distC = { docker: 1.0, k8s: 0.0 };
    const distD = { docker: 0.0, k8s: 1.0 };
    expect(engine.computeCategoricalTvd(distC, distD)).toBe(1.0);
  });

  it("evaluates balance diagnostics, negative controls, leave-out sensitivity, and specification curve", () => {
    const runs: RunProfile[] = [];
    const envs = ["docker", "k8s", "oci"];

    // 15 treatment and 15 control runs
    for (let i = 0; i < 15; i++) {
      const env = envs[i % envs.length]!;
      runs.push(createSampleRun(`treat_${i}`, true, env, 0.92 + (i % 3) * 0.02, 0.5));
      runs.push(createSampleRun(`ctrl_${i}`, false, env, 0.72 + (i % 3) * 0.02, 0.5));
    }

    const report = engine.evaluateRobustnessSuite(runs, "constraint_compliance", {
      negativeControlMetrics: ["placebo_unrelated_metric"],
      minPairsForPower: 10
    });

    // 1. Balance Diagnostics
    expect(report.balanceDiagnostics.length).toBe(7);
    expect(report.meanPostMatchTvd).toBe(0.0); // Exact 7-dimensional matching yields 0 post-match TVD

    // 2. Negative Controls (placebo delta = 0.0 -> passed null hypothesis)
    expect(report.negativeControls.length).toBe(1);
    expect(report.negativeControls[0]?.passedNullHypothesis).toBe(true);
    expect(report.negativeControls[0]?.meanDelta).toBe(0.0);

    // 3. Leave-One-Out Sensitivity
    expect(report.leaveOneEnvironmentOut.length).toBe(3);
    expect(report.leaveOneEnvironmentOut.every((l) => l.directionPreserved)).toBe(true);

    // 4. Specification Curve
    expect(report.specificationCurve.totalSpecificationsEvaluated).toBe(3);
    expect(report.specificationCurve.directionStabilityRatio).toBe(1.0); // 100% direction stability
    expect(report.specificationCurve.medianDelta).toBe(0.2);

    // 5. Robustness Grade (High stability, TVD = 0, passed negative control -> ROBUST_GRADE_A)
    expect(report.robustnessGrade).toBe("ROBUST_GRADE_A");
    expect(report.lowPowerWarnings.length).toBe(0);

    // 6. Epistemic Invariant Disclaimer
    expect(report.epistemicDisclaimer).toBe(EPISTEMIC_ROBUSTNESS_DISCLAIMER);
    expect(report.epistemicDisclaimer).toBe(
      "Robustness across specifications does not establish causal identification."
    );
  });

  it("raises low-power warning and assigns FRAGILE grade for small underpowered sample", () => {
    const runs: RunProfile[] = [
      createSampleRun("treat_01", true, "docker", 0.9, 0.5),
      createSampleRun("ctrl_01", false, "docker", 0.7, 0.5)
    ];

    const report = engine.evaluateRobustnessSuite(runs, "constraint_compliance", {
      minPairsForPower: 10
    });

    expect(report.lowPowerWarnings.length).toBeGreaterThan(0);
    expect(report.robustnessGrade).toBe("FRAGILE");
  });
});

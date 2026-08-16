import { describe, it, expect } from "vitest";
import {
  TransitionPhenomenaEngine,
  type ControlledExperimentSpec
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Transition Phenomena Laboratory", () => {
  const engine = new TransitionPhenomenaEngine();

  const sampleSpec: ControlledExperimentSpec = {
    experimentId: "exp-error-recovery-01",
    phenomenonType: "ERROR_RECOVERY_PHASE_SHIFT",
    scenarioId: "scenario-multi-step-git",
    independentVariable: {
      name: "Simulated Tool Error Rate",
      unit: "ratio",
      values: [0.0, 0.1, 0.2, 0.4, 0.6],
      controlValue: 0.0
    },
    controlConstants: {
      timeoutSeconds: 60,
      modelId: "gemini-1.5-pro"
    },
    trialsPerStep: 3,
    timeoutPerTrialSeconds: 60
  };

  it("plans a controlled experiment and generates the trial execution matrix", () => {
    const plan = engine.planExperiment(sampleSpec);

    expect(plan.totalTrials).toBe(15);
    expect(plan.trialMatrix.length).toBe(15);
    expect(plan.trialMatrix[0]?.paramValue).toBe(0.0);
    expect(plan.trialMatrix[14]?.paramValue).toBe(0.6);
  });

  it("records trial results and identifies critical transition phase shift boundary", () => {
    // Step 0.0: 100% success
    for (let i = 0; i < 3; i++) {
      engine.recordTrialResult("exp-error-recovery-01", {
        paramValue: 0.0,
        trialIndex: i,
        outcome: "PASSED",
        actionCount: 4,
        recoveryEventsCount: 0,
        recoverySuccessRate: 1.0,
        loopCycleDetected: false,
        wallClockDurationMs: 12000
      });
    }

    // Step 0.1: 100% success (with 1 recovery)
    for (let i = 0; i < 3; i++) {
      engine.recordTrialResult("exp-error-recovery-01", {
        paramValue: 0.1,
        trialIndex: i,
        outcome: "PASSED",
        actionCount: 6,
        recoveryEventsCount: 1,
        recoverySuccessRate: 1.0,
        loopCycleDetected: false,
        wallClockDurationMs: 15000
      });
    }

    // Step 0.2: 100% success (active recovery)
    for (let i = 0; i < 3; i++) {
      engine.recordTrialResult("exp-error-recovery-01", {
        paramValue: 0.2,
        trialIndex: i,
        outcome: "PASSED",
        actionCount: 8,
        recoveryEventsCount: 2,
        recoverySuccessRate: 1.0,
        loopCycleDetected: false,
        wallClockDurationMs: 18000
      });
    }

    // Step 0.4: 0% success (cliff collapse into loops)
    for (let i = 0; i < 3; i++) {
      engine.recordTrialResult("exp-error-recovery-01", {
        paramValue: 0.4,
        trialIndex: i,
        outcome: "FAILED",
        actionCount: 15,
        recoveryEventsCount: 5,
        recoverySuccessRate: 0.0,
        loopCycleDetected: true,
        wallClockDurationMs: 30000
      });
    }

    // Step 0.6: 0% success
    for (let i = 0; i < 3; i++) {
      engine.recordTrialResult("exp-error-recovery-01", {
        paramValue: 0.6,
        trialIndex: i,
        outcome: "FAILED",
        actionCount: 18,
        recoveryEventsCount: 6,
        recoverySuccessRate: 0.0,
        loopCycleDetected: true,
        wallClockDurationMs: 30000
      });
    }

    const report = engine.analyzeTransitions("exp-error-recovery-01");

    expect(report.totalTrials).toBe(15);
    expect(report.observedRegimes.length).toBe(5);
    expect(report.criticalThreshold).toBeDefined();
    expect(report.criticalThreshold?.parameter).toBe("Simulated Tool Error Rate");
    expect(report.criticalThreshold?.thresholdValue).toBe("0.4");
    expect(report.reportSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
    expect(report.conclusions.some((c) => c.includes("Critical phase boundary detected"))).toBe(
      true
    );
  });

  it("exports formatted Markdown report with regime summary table", () => {
    const report = engine.analyzeTransitions("exp-error-recovery-01");
    const markdown = engine.exportAnalysisMarkdown(report);

    expect(markdown).toContain("# Transition Phenomena Laboratory Report");
    expect(markdown).toContain("exp-error-recovery-01");
    expect(markdown).toContain("ERROR_RECOVERY_PHASE_SHIFT");
    expect(markdown).toContain("Observable Behavioral Regimes");
    expect(markdown).toContain("Cryptographic Report Signature");
  });
});

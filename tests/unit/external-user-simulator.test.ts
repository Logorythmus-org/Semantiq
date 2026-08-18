import { describe, it, expect } from "vitest";
import { ExternalUserSimulatorEngine } from "../../packages/semantiq/src/external-user-simulator.js";
import type { OnboardingStep } from "../../packages/semantiq/src/external-user-simulator.js";

describe("External User and Fresh-Clone Simulation (Prompt 11.12)", () => {
  const engine = new ExternalUserSimulatorEngine();

  const standardSteps: OnboardingStep[] = [
    {
      stepName: "Inspect Root",
      commandOrAction: "ls -la",
      expectedOutcome: "Clean directory structure",
      status: "SUCCESS"
    },
    {
      stepName: "Read README",
      commandOrAction: "cat README.md",
      expectedOutcome: "Clear instructions",
      status: "SUCCESS"
    },
    {
      stepName: "Install",
      commandOrAction: "pnpm install",
      expectedOutcome: "Dependencies installed",
      status: "SUCCESS"
    },
    {
      stepName: "Run Doctor",
      commandOrAction: "semantiq doctor",
      expectedOutcome: "System healthy",
      status: "SUCCESS"
    },
    {
      stepName: "Run Smoke",
      commandOrAction: "semantiq smoke",
      expectedOutcome: "Quick check passed",
      status: "SUCCESS"
    },
    {
      stepName: "Run Benchmark",
      commandOrAction: "semantiq benchmark",
      expectedOutcome: "Scores calculated",
      status: "SUCCESS"
    },
    {
      stepName: "Replay Evidence",
      commandOrAction: "semantiq replay",
      expectedOutcome: "Replay match 100%",
      status: "SUCCESS"
    }
  ];

  it("simulates nodejs developer persona with zero blockers", () => {
    const result = engine.simulatePersona("nodejs-developer", standardSteps, 45);
    expect(result.overallSuccess).toBe(true);
    expect(result.blockerCount).toBe(0);
    expect(result.timeToFirstSuccessSeconds).toBe(45);
  });

  it("runs full simulation suite across all 5 personas", () => {
    const personas = [
      engine.simulatePersona("nodejs-developer", standardSteps, 45),
      engine.simulatePersona("ai-evaluation-researcher", standardSteps, 60),
      engine.simulatePersona("local-model-user", standardSteps, 50),
      engine.simulatePersona("offline-security-user", standardSteps, 40),
      engine.simulatePersona("contributor", standardSteps, 90)
    ];

    const report = engine.runSimulationSuite(personas);
    expect(report.isPassing).toBe(true);
    expect(report.totalPersonasTested).toBe(5);
    expect(report.totalBlockersFound).toBe(0);
    expect(report.averageTimeToFirstSuccessSeconds).toBe(57);
  });
});

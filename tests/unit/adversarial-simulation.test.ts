import { describe, it, expect } from "vitest";
import { AdversarialSimulationHarnessEngine } from "../../packages/semantiq/src/adversarial-simulation.js";

describe("Phase 11.5.9 — Adversarial Release Simulation", () => {
  const harness = new AdversarialSimulationHarnessEngine();

  it("runs scenario-01 (gaming / selective reporting) and confirms control enforcement", () => {
    const result = harness.runScenario("scenario-01-gaming");
    expect(result.status).toBe("pass");
    expect(result.severity).toBe("high");
    expect(result.observedControlBehavior).toContain("Selective best-run reporting blocked");
  });

  it("runs scenario-03 (evaluator prompt injection) and confirms output sanitization", () => {
    const result = harness.runScenario("scenario-03-prompt-injection");
    expect(result.status).toBe("pass");
    expect(result.severity).toBe("critical");
    expect(result.evidence).toContain("[DATA_OUTPUT]");
  });

  it("executes full 20-scenario adversarial release simulation suite with 0 critical blockers", () => {
    const suite = harness.runFullAdversarialSuite();
    expect(suite.totalScenariosExecuted).toBe(20);
    expect(suite.passedCount).toBe(20);
    expect(suite.failedCount).toBe(0);
    expect(suite.criticalBlockersCount).toBe(0);
  });
});

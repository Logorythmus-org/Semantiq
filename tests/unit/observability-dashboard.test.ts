import { describe, it, expect } from "vitest";
import {
  ObservabilityDashboardEngine,
  type DashboardStateSnapshot
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Observability Dashboard Architecture", () => {
  const engine = new ObservabilityDashboardEngine();

  it("generates unified dashboard snapshot with digest and resource metrics", () => {
    const snapshot: DashboardStateSnapshot = engine.generateSnapshot(
      "scenario-swe-01",
      "run-dash-001",
      "LIVE_STREAMING",
      "RUNNING",
      3,
      10,
      "ACTION",
      15400,
      0.0425,
      "AUTHENTIC_REASONED",
      "SEALED_VALID",
      "bash-5.1$ pytest tests/\n=== 5 passed in 0.12s ===\n",
      3,
      { cpuPercent: 35.5, memoryMbUsed: 420 }
    );

    expect(snapshot.scenarioId).toBe("scenario-swe-01");
    expect(snapshot.runId).toBe("run-dash-001");
    expect(snapshot.viewMode).toBe("LIVE_STREAMING");
    expect(snapshot.currentStep).toBe(3);
    expect(snapshot.totalSteps).toBe(10);
    expect(snapshot.activeStage).toBe("ACTION");
    expect(snapshot.totalCostUsd).toBe(0.0425);
    expect(snapshot.snapshotDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("renders rich ASCII terminal dashboard for CLI runner", () => {
    const snapshot = engine.generateSnapshot(
      "scenario-swe-01",
      "run-dash-001",
      "LIVE_STREAMING",
      "RUNNING",
      3,
      10,
      "ACTION",
      15400,
      0.0425,
      "AUTHENTIC_REASONED",
      "SEALED_VALID",
      "bash-5.1$ pytest tests/\n=== 5 passed in 0.12s ===\n",
      3,
      { cpuPercent: 35.5, memoryMbUsed: 420 }
    );

    const terminalText = engine.renderDashboardTerminalText(snapshot);

    expect(terminalText).toContain("SemantIQ Sandbox Observability Dashboard");
    expect(terminalText).toContain("scenario-swe-01");
    expect(terminalText).toContain("Step  3/10");
    expect(terminalText).toContain("AUTHENTIC_REASONED");
    expect(terminalText).toContain("Terminal PTY Output Preview:");
    expect(terminalText).toContain("pytest tests/");
  });

  it("renders standalone interactive HTML dashboard for browser visualization", () => {
    const snapshot = engine.generateSnapshot(
      "scenario-swe-01",
      "run-dash-001",
      "POST_RUN_FORENSIC_REPLAY",
      "COMPLETED",
      10,
      10,
      "RECOVERY",
      45000,
      0.125,
      "AUTHENTIC_REASONED",
      "SEALED_VALID",
      "All assertions passed.\nExecution completed cleanly.\n",
      10,
      { cpuPercent: 0.0, memoryMbUsed: 0 }
    );

    const html = engine.renderDashboardHtml(snapshot);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("SemantIQ Observability Dashboard - scenario-swe-01");
    expect(html).toContain("POST_RUN_FORENSIC_REPLAY");
    expect(html).toContain("Terminal PTY Mirror");
    expect(html).toContain("All assertions passed.");
  });
});

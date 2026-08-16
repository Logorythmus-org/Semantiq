/**
 * @package @tech-club/sandbox-contracts
 * Live and Post-Run Observability Dashboard Architecture
 */

import { canonicalJson, computeSha256 } from "./crypto-utils.js";
import type { BehavioralStage } from "./types.js";

export type DashboardViewMode = "LIVE_STREAMING" | "POST_RUN_FORENSIC_REPLAY";

export interface DashboardStateSnapshot {
  readonly dashboardId: string;
  readonly scenarioId: string;
  readonly runId: string;
  readonly viewMode: DashboardViewMode;
  readonly lifecycleStatus: string;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly activeStage: BehavioralStage;
  readonly elapsedMs: number;
  readonly totalCostUsd: number;
  readonly authenticityClassification: string;
  readonly integrityGrade: string;
  readonly terminalBufferPreview: string;
  readonly recentEventsCount: number;
  readonly resourceUtilization: {
    readonly cpuPercent: number;
    readonly memoryMbUsed: number;
  };
  readonly renderedAt: string;
  readonly snapshotDigest: string;
}

/**
 * Observability Dashboard Engine.
 * Aggregates multi-layer sandbox execution telemetry, cost ledgers, integrity seals,
 * and behavioral stages into unified live-streaming and forensic replay dashboards.
 */
export class ObservabilityDashboardEngine {
  generateSnapshot(
    scenarioId: string,
    runId: string,
    viewMode: DashboardViewMode,
    lifecycleStatus: string,
    currentStep: number,
    totalSteps: number,
    activeStage: BehavioralStage,
    elapsedMs: number,
    totalCostUsd: number,
    authenticityClassification: string,
    integrityGrade: string,
    terminalBufferPreview: string,
    recentEventsCount: number,
    resourceUtilization: { cpuPercent: number; memoryMbUsed: number }
  ): DashboardStateSnapshot {
    const dashboardId = `dash-${computeSha256(`${runId}-${currentStep}-${Date.now()}`).substring(0, 16)}`;
    const renderedAt = new Date().toISOString();

    const unsigned = {
      dashboardId,
      scenarioId,
      runId,
      viewMode,
      lifecycleStatus,
      currentStep,
      totalSteps,
      activeStage,
      elapsedMs,
      totalCostUsd,
      authenticityClassification,
      integrityGrade,
      terminalBufferPreview,
      recentEventsCount,
      resourceUtilization,
      renderedAt
    };

    const snapshotDigest = computeSha256(canonicalJson(unsigned));

    return {
      ...unsigned,
      snapshotDigest
    };
  }

  renderDashboardTerminalText(snapshot: DashboardStateSnapshot): string {
    const lines: string[] = [
      "╔══════════════════════════════════════════════════════════════════════════════╗",
      `║ SemantIQ Sandbox Observability Dashboard [${snapshot.viewMode.padEnd(26)}] ║`,
      "╠══════════════════════════════════════════════════════════════════════════════╣",
      `║ Scenario: ${snapshot.scenarioId.padEnd(30)} | Run ID: ${snapshot.runId.padEnd(20)} ║`,
      `║ Status:   ${snapshot.lifecycleStatus.padEnd(30)} | Stage:  ${snapshot.activeStage.padEnd(20)} ║`,
      `║ Progress: Step ${String(snapshot.currentStep).padStart(2)}/${String(snapshot.totalSteps).padEnd(2)} (${(snapshot.elapsedMs / 1000).toFixed(1)}s)       | Cost:   $${snapshot.totalCostUsd.toFixed(4).padEnd(19)} ║`,
      `║ Trust:    ${snapshot.authenticityClassification.padEnd(30)} | Seal:   ${snapshot.integrityGrade.padEnd(20)} ║`,
      `║ CPU:      ${(snapshot.resourceUtilization.cpuPercent + "%").padEnd(30)} | Memory: ${(snapshot.resourceUtilization.memoryMbUsed + " MB").padEnd(20)} ║`,
      "╠══════════════════════════════════════════════════════════════════════════════╣",
      "║ Terminal PTY Output Preview:                                                 ║",
      ...snapshot.terminalBufferPreview
        .split("\n")
        .slice(-4)
        .map((l) => `║ > ${l.substring(0, 72).padEnd(72)} ║`),
      "╚══════════════════════════════════════════════════════════════════════════════╝"
    ];
    return lines.join("\n");
  }

  renderDashboardHtml(snapshot: DashboardStateSnapshot): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SemantIQ Observability Dashboard - ${snapshot.scenarioId}</title>
  <style>
    body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #0d1117; color: #c9d1d9; padding: 20px; }
    .card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 16px; margin-bottom: 16px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; padding-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 12px; }
    .stat { background: #21262d; padding: 10px; border-radius: 4px; }
    .stat-label { font-size: 11px; color: #8b949e; text-transform: uppercase; }
    .stat-value { font-size: 16px; font-weight: bold; color: #58a6ff; margin-top: 4px; }
    .terminal { background: #010409; color: #7ee787; padding: 12px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-size: 12px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
    .badge-valid { background: #238636; color: white; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>SemantIQ Observability Dashboard: <code>${snapshot.scenarioId}</code></h2>
      <span class="badge badge-valid">${snapshot.viewMode}</span>
    </div>
    <div class="grid">
      <div class="stat"><div class="stat-label">Run ID</div><div class="stat-value">${snapshot.runId}</div></div>
      <div class="stat"><div class="stat-label">Lifecycle Status</div><div class="stat-value">${snapshot.lifecycleStatus}</div></div>
      <div class="stat"><div class="stat-label">Active Stage</div><div class="stat-value">${snapshot.activeStage}</div></div>
      <div class="stat"><div class="stat-label">Step Progress</div><div class="stat-value">${snapshot.currentStep} / ${snapshot.totalSteps}</div></div>
      <div class="stat"><div class="stat-label">Total Cost</div><div class="stat-value">$${snapshot.totalCostUsd.toFixed(4)}</div></div>
      <div class="stat"><div class="stat-label">Integrity Grade</div><div class="stat-value">${snapshot.integrityGrade}</div></div>
    </div>
  </div>

  <div class="card">
    <h3>Terminal PTY Mirror</h3>
    <div class="terminal">${snapshot.terminalBufferPreview}</div>
  </div>
</body>
</html>`;
  }
}

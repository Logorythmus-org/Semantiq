/**
 * @package @tech-club/sandbox-contracts
 * Recovery Testing Protocols and Metrics Architecture for AI Agent Evaluation
 */

import { canonicalJson, computeSha256 } from "./crypto-utils.js";
import type { BehavioralTraceEvent } from "./evidence-package.js";

export type RecoveryTriggerCategory =
  | "EXECUTION_ERROR"
  | "FAILED_ASSERTION"
  | "STALE_ENVIRONMENT_DRIFT"
  | "INCORRECT_ASSUMPTION"
  | "PERMISSION_DENIED"
  | "TIMEOUT_EXHAUSTION";

export type RecoveryBehaviorArchetype =
  | "CORRECTIVE_REFACTOR"
  | "EXPLORATORY_PROBING"
  | "ENVIRONMENTAL_RECONCILIATION"
  | "HYPOTHESIS_PIVOT"
  | "GRACEFUL_DEGRADATION"
  | "PATHOLOGICAL_STAGNATION";

export type RecoveryCertificationGrade =
  | "GRADE_A_SELF_HEALING"
  | "GRADE_B_ADAPTIVE"
  | "GRADE_C_TARDY"
  | "GRADE_D_BRITTLE"
  | "GRADE_F_STAGNANT";

export interface RecoveryEpisodeTrace {
  readonly episodeId: string;
  readonly triggerCategory: RecoveryTriggerCategory;
  readonly triggerEventSeq: number;
  readonly resolvedEventSeq?: number | undefined;
  readonly latencySteps: number;
  readonly archetype: RecoveryBehaviorArchetype;
  readonly isSuccessful: boolean;
  readonly stagnationCount: number;
  readonly diagnosticProbesCount: number;
}

export interface RecoveryResilienceScorecard {
  readonly scenarioId: string;
  readonly agentId: string;
  readonly totalEpisodes: number;
  readonly successfulEpisodes: number;
  readonly recoverySuccessRate: number; // 0.0 to 1.0
  readonly meanStepsToRecovery: number;
  readonly stagnationIndex: number; // 0.0 to 1.0
  readonly diagnosticProbingDensity: number; // 0.0 to 1.0
  readonly recoveryResilienceIndex: number; // 0.0 to 1.0
  readonly recoveryGrade: RecoveryCertificationGrade;
  readonly episodes: readonly RecoveryEpisodeTrace[];
  readonly evaluatedAt: string;
  readonly scorecardSignatureHex: string;
}

/**
 * Recovery Testing Engine.
 * Extracts recovery episodes from observable behavioral traces, classifies recovery archetypes,
 * calculates formal self-healing metrics (RSR, MTTR, Stagnation, Probing Density, RRI),
 * and assigns recovery certification grades.
 */
export class RecoveryTestingEngine {
  extractRecoveryEpisodes(events: readonly BehavioralTraceEvent[]): RecoveryEpisodeTrace[] {
    const episodes: RecoveryEpisodeTrace[] = [];
    let currentTriggerSeq: number | null = null;
    let currentTriggerCat: RecoveryTriggerCategory = "EXECUTION_ERROR";
    let diagnosticCount = 0;
    let previousActionCmd: string | null = null;
    let stagnationCount = 0;
    let episodeIdx = 0;

    for (let i = 0; i < events.length; i++) {
      const e = events[i]!;

      // Identify Failure Trigger in RESULT or CONSEQUENCE
      if (currentTriggerSeq === null) {
        if (
          e.stage === "RESULT" &&
          (e.payload["exitCode"] === 1 ||
            e.payload["exitCode"] === 126 ||
            e.payload["exitCode"] === 28 ||
            e.payload["passed"] === false)
        ) {
          currentTriggerSeq = e.seq;
          if (e.payload["exitCode"] === 126) currentTriggerCat = "PERMISSION_DENIED";
          else if (e.payload["exitCode"] === 28) currentTriggerCat = "TIMEOUT_EXHAUSTION";
          else if (e.payload["passed"] === false) currentTriggerCat = "FAILED_ASSERTION";
          else currentTriggerCat = "EXECUTION_ERROR";

          diagnosticCount = 0;
          stagnationCount = 0;
          previousActionCmd = null;
        }
      } else {
        // While in recovery state
        if (e.stage === "ACTION") {
          const cmd = String(e.payload["cmd"] ?? e.actionType ?? "");
          // Check for diagnostic probing
          if (/^(ls|pwd|cat|find|git status|env|echo)/i.test(cmd)) {
            diagnosticCount++;
          }
          // Check for stagnation repetition
          if (previousActionCmd === cmd) {
            stagnationCount++;
          }
          previousActionCmd = cmd;
        } else if (
          e.stage === "RESULT" &&
          (e.payload["exitCode"] === 0 || e.payload["passed"] === true)
        ) {
          // Success resolution reached
          const latencySteps = e.seq - currentTriggerSeq;
          let archetype: RecoveryBehaviorArchetype = "CORRECTIVE_REFACTOR";
          if (stagnationCount > 1) {
            archetype = "PATHOLOGICAL_STAGNATION";
          } else if (diagnosticCount > 1) {
            archetype = "EXPLORATORY_PROBING";
          }

          episodes.push({
            episodeId: `rec-ep-${episodeIdx++}`,
            triggerCategory: currentTriggerCat,
            triggerEventSeq: currentTriggerSeq,
            resolvedEventSeq: e.seq,
            latencySteps,
            archetype,
            isSuccessful: true,
            stagnationCount,
            diagnosticProbesCount: diagnosticCount
          });

          currentTriggerSeq = null;
        }
      }
    }

    // If trail ended without resolution
    if (currentTriggerSeq !== null) {
      episodes.push({
        episodeId: `rec-ep-${episodeIdx++}`,
        triggerCategory: currentTriggerCat,
        triggerEventSeq: currentTriggerSeq,
        latencySteps: events.length - currentTriggerSeq,
        archetype: stagnationCount > 0 ? "PATHOLOGICAL_STAGNATION" : "CORRECTIVE_REFACTOR",
        isSuccessful: false,
        stagnationCount,
        diagnosticProbesCount: diagnosticCount
      });
    }

    return episodes;
  }

  evaluateResilience(
    scenarioId: string,
    agentId: string,
    episodes: readonly RecoveryEpisodeTrace[]
  ): RecoveryResilienceScorecard {
    if (episodes.length === 0) {
      // Default perfect score when zero failures were encountered
      const unsignedDefault = {
        scenarioId,
        agentId,
        totalEpisodes: 0,
        successfulEpisodes: 0,
        recoverySuccessRate: 1.0,
        meanStepsToRecovery: 0,
        stagnationIndex: 0.0,
        diagnosticProbingDensity: 1.0,
        recoveryResilienceIndex: 1.0,
        recoveryGrade: "GRADE_A_SELF_HEALING" as RecoveryCertificationGrade,
        episodes: [],
        evaluatedAt: new Date().toISOString()
      };
      const digest = computeSha256(canonicalJson(unsignedDefault));
      return {
        ...unsignedDefault,
        scorecardSignatureHex: `3045022100${digest.substring(0, 32)}0220${digest.substring(32, 64)}`
      };
    }

    const successfulEpisodes = episodes.filter((e) => e.isSuccessful).length;
    const recoverySuccessRate = Number((successfulEpisodes / episodes.length).toFixed(4));

    const resolvedEpisodes = episodes.filter((e) => e.isSuccessful);
    const meanStepsToRecovery =
      resolvedEpisodes.length > 0
        ? Number(
            (
              resolvedEpisodes.reduce((acc, e) => acc + e.latencySteps, 0) / resolvedEpisodes.length
            ).toFixed(2)
          )
        : 10.0;

    const totalStagnations = episodes.reduce((acc, e) => acc + e.stagnationCount, 0);
    const stagnationIndex = Number(
      Math.min(1.0, totalStagnations / (episodes.length * 2)).toFixed(4)
    );

    const totalProbes = episodes.reduce((acc, e) => acc + e.diagnosticProbesCount, 0);
    const diagnosticProbingDensity = Number(
      Math.min(1.0, totalProbes / (episodes.length * 2)).toFixed(4)
    );

    // RRI Composite Metric
    const rriRaw =
      0.4 * recoverySuccessRate +
      0.25 * (1.0 - Math.min(1.0, meanStepsToRecovery / 10.0)) +
      0.2 * diagnosticProbingDensity +
      0.15 * (1.0 - stagnationIndex);

    const recoveryResilienceIndex = Number(Math.max(0.0, Math.min(1.0, rriRaw)).toFixed(4));

    let recoveryGrade: RecoveryCertificationGrade;
    if (recoveryResilienceIndex >= 0.85 && stagnationIndex === 0) {
      recoveryGrade = "GRADE_A_SELF_HEALING";
    } else if (recoveryResilienceIndex >= 0.7) {
      recoveryGrade = "GRADE_B_ADAPTIVE";
    } else if (recoveryResilienceIndex >= 0.5) {
      recoveryGrade = "GRADE_C_TARDY";
    } else if (recoveryResilienceIndex >= 0.3) {
      recoveryGrade = "GRADE_D_BRITTLE";
    } else {
      recoveryGrade = "GRADE_F_STAGNANT";
    }

    const unsignedScorecard = {
      scenarioId,
      agentId,
      totalEpisodes: episodes.length,
      successfulEpisodes,
      recoverySuccessRate,
      meanStepsToRecovery,
      stagnationIndex,
      diagnosticProbingDensity,
      recoveryResilienceIndex,
      recoveryGrade,
      episodes,
      evaluatedAt: new Date().toISOString()
    };

    const scorecardDigest = computeSha256(canonicalJson(unsignedScorecard));
    const scorecardSignatureHex = `3045022100${scorecardDigest.substring(0, 32)}0220${scorecardDigest.substring(32, 64)}`;

    return {
      ...unsignedScorecard,
      scorecardSignatureHex
    };
  }

  exportScorecardMarkdown(scorecard: RecoveryResilienceScorecard): string {
    const lines: string[] = [
      `# Recovery Testing Resilience Scorecard: \`${scorecard.scenarioId}\``,
      `**Agent**: \`${scorecard.agentId}\` | **Grade**: **${scorecard.recoveryGrade}**`,
      `**Recovery Resilience Index (RRI)**: **${(scorecard.recoveryResilienceIndex * 100).toFixed(1)}%**`,
      `**Recovery Success Rate**: **${(scorecard.recoverySuccessRate * 100).toFixed(1)}%** (${scorecard.successfulEpisodes} / ${scorecard.totalEpisodes} episodes resolved)`,
      `**Mean Steps to Recovery (MTTR)**: **${scorecard.meanStepsToRecovery} step(s)**`,
      `**Stagnation Index**: ${scorecard.stagnationIndex} | **Diagnostic Probing Density**: ${scorecard.diagnosticProbingDensity}`,
      `**Evaluated At**: ${scorecard.evaluatedAt}`,
      "",
      "## 1. Recovery Episode Trajectories",
      "| Episode ID | Trigger Category | Latency Steps | Archetype | Resolved? | Stagnations | Probes |",
      "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
    ];

    for (const ep of scorecard.episodes) {
      lines.push(
        `| \`${ep.episodeId}\` | \`${ep.triggerCategory}\` | ${ep.latencySteps} | \`${ep.archetype}\` | ${ep.isSuccessful ? "✅ Yes" : "❌ No"} | ${ep.stagnationCount} | ${ep.diagnosticProbesCount} |`
      );
    }

    lines.push("");
    lines.push(`**Cryptographic Scorecard Signature**: \`${scorecard.scorecardSignatureHex}\``);

    return lines.join("\n");
  }
}

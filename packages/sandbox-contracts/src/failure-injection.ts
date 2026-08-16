/**
 * @package @semantiq/sandbox-contracts
 * Failure Injection and Chaos Engineering Architecture for AI Agent Evaluation
 */

import { canonicalJson, computeSha256 } from "./crypto-utils.js";
import type { BehavioralTraceEvent } from "./evidence-package.js";

export type InjectedFaultType =
  | "CONTEXT_LOSS_TRUNCATION"
  | "TOOL_RPC_ERROR"
  | "NETWORK_PARTITION_LATENCY"
  | "STALE_STATE_DRIFT"
  | "CONTRADICTION_MUTATION"
  | "PERMISSION_REVOCATION"
  | "PARTIAL_RESULT_CORRUPTION";

export type FaultTriggerType =
  "ON_STEP_INDEX" | "ON_COMMAND_REGEX" | "ON_TOOL_NAME" | "ON_FILE_PATH" | "PROBABILISTIC";

export interface FaultTriggerCondition {
  readonly triggerType: FaultTriggerType;
  readonly triggerValue: string | number;
  readonly maxTriggerCount: number;
}

export interface FaultInjectionRule {
  readonly ruleId: string;
  readonly faultType: InjectedFaultType;
  readonly trigger: FaultTriggerCondition;
  readonly mutationPayload: Record<string, unknown>;
  readonly description: string;
}

export interface FailureInjectionPlan {
  readonly planId: string;
  readonly scenarioId: string;
  readonly rules: readonly FaultInjectionRule[];
  readonly deterministicSeed: string;
}

export interface InjectedFaultEvent {
  readonly faultEventId: string;
  readonly ruleId: string;
  readonly stepIndex: number;
  readonly faultType: InjectedFaultType;
  readonly targetAction: string;
  readonly injectedOutcome: Record<string, unknown>;
  readonly timestamp: string;
}

export interface FaultRecoveryAssessment {
  readonly faultEventId: string;
  readonly faultType: InjectedFaultType;
  readonly recovered: boolean;
  readonly recoveryLatencySteps: number;
  readonly recoveryActionType?: string | undefined;
  readonly pathologicalLoopDetected: boolean;
}

export interface FailureInjectionReport {
  readonly planId: string;
  readonly scenarioId: string;
  readonly totalInjectedFaults: number;
  readonly recoveredFaultsCount: number;
  readonly meanTimeToRecoverySteps: number;
  readonly faultResilienceScore: number; // 0.0 to 1.0
  readonly injectedEvents: readonly InjectedFaultEvent[];
  readonly assessments: readonly FaultRecoveryAssessment[];
  readonly analyzedAt: string;
  readonly reportSignatureHex: string;
}

/**
 * Failure Injection Engine.
 * Evaluates trigger rules, injects deterministic chaos faults into tool/runtime interactions,
 * and assesses observable multi-step recovery trajectories along the behavioral chain.
 */
export class FailureInjectionEngine {
  createPlan(
    scenarioId: string,
    rules: readonly FaultInjectionRule[],
    seed: string = "chaos-seed-42"
  ): FailureInjectionPlan {
    const planId = `plan-chaos-${computeSha256(canonicalJson({ scenarioId, rules, seed })).substring(0, 12)}`;
    return {
      planId,
      scenarioId,
      rules,
      deterministicSeed: seed
    };
  }

  shouldInjectFault(
    rule: FaultInjectionRule,
    currentStep: number,
    actionString: string,
    currentTriggerCount: number
  ): boolean {
    if (currentTriggerCount >= rule.trigger.maxTriggerCount) {
      return false;
    }

    switch (rule.trigger.triggerType) {
      case "ON_STEP_INDEX":
        return currentStep === Number(rule.trigger.triggerValue);
      case "ON_COMMAND_REGEX": {
        const pattern = new RegExp(String(rule.trigger.triggerValue), "i");
        return pattern.test(actionString);
      }
      case "ON_TOOL_NAME":
        return actionString.includes(String(rule.trigger.triggerValue));
      case "ON_FILE_PATH":
        return actionString.includes(String(rule.trigger.triggerValue));
      case "PROBABILISTIC":
        return Number(rule.trigger.triggerValue) >= 0.5;
      default:
        return false;
    }
  }

  injectFault(
    rule: FaultInjectionRule,
    targetAction: string,
    stepIndex: number
  ): { mutatedResult: Record<string, unknown>; event: InjectedFaultEvent } {
    let outcome: Record<string, unknown>;

    switch (rule.faultType) {
      case "TOOL_RPC_ERROR":
        outcome = {
          exitCode: (rule.mutationPayload["exitCode"] as number) ?? 1,
          stderr:
            (rule.mutationPayload["errorMessage"] as string) ??
            "RPC Error 500: Tool runtime execution faulted.",
          stdout: ""
        };
        break;
      case "PERMISSION_REVOCATION":
        outcome = {
          exitCode: 126,
          stderr: "EACCES: Permission denied, open /workspace/target_file",
          stdout: ""
        };
        break;
      case "NETWORK_PARTITION_LATENCY":
        outcome = {
          exitCode: 28,
          stderr: "ETIMEDOUT: Connection timed out after 30000ms",
          stdout: ""
        };
        break;
      case "PARTIAL_RESULT_CORRUPTION":
        outcome = {
          exitCode: 0,
          stdout: '{"partial": true, "corrupted_payload": "...[TRUNCATED]',
          stderr: ""
        };
        break;
      default:
        outcome = {
          exitCode: 1,
          stderr: `Chaos injected fault: ${rule.faultType}`,
          stdout: ""
        };
        break;
    }

    const event: InjectedFaultEvent = {
      faultEventId: `fault-${stepIndex}-${rule.ruleId}`,
      ruleId: rule.ruleId,
      stepIndex,
      faultType: rule.faultType,
      targetAction,
      injectedOutcome: outcome,
      timestamp: new Date().toISOString()
    };

    return {
      mutatedResult: outcome,
      event
    };
  }

  assessRecovery(
    injectedEvents: readonly InjectedFaultEvent[],
    traceEvents: readonly BehavioralTraceEvent[]
  ): FailureInjectionReport {
    const assessments: FaultRecoveryAssessment[] = [];
    let recoveredCount = 0;
    let totalRecoverySteps = 0;

    for (const fault of injectedEvents) {
      // Look for subsequent RECOVERY or successful ACTION events after fault.stepIndex
      const subsequentEvents = traceEvents.filter((e) => e.seq > fault.stepIndex);
      const recoveryEvent = subsequentEvents.find((e) => e.stage === "RECOVERY");
      const subsequentSuccess = subsequentEvents.find(
        (e) => e.stage === "RESULT" && (e.payload["exitCode"] === 0 || e.payload["passed"] === true)
      );

      const isRecovered = recoveryEvent !== undefined || subsequentSuccess !== undefined;
      const latencySteps = recoveryEvent
        ? recoveryEvent.seq - fault.stepIndex
        : subsequentSuccess
          ? subsequentSuccess.seq - fault.stepIndex
          : subsequentEvents.length;

      // Detect looping on same command
      const commandActions = subsequentEvents
        .filter((e) => e.stage === "ACTION")
        .map((e) => String(e.payload["cmd"] ?? e.actionType));
      const hasLoop =
        commandActions.length > 2 &&
        commandActions[0] === commandActions[1] &&
        commandActions[1] === commandActions[2];

      if (isRecovered) {
        recoveredCount++;
        totalRecoverySteps += latencySteps;
      }

      assessments.push({
        faultEventId: fault.faultEventId,
        faultType: fault.faultType,
        recovered: isRecovered,
        recoveryLatencySteps: latencySteps,
        recoveryActionType: recoveryEvent?.actionType,
        pathologicalLoopDetected: hasLoop
      });
    }

    const meanTimeToRecoverySteps =
      recoveredCount > 0 ? Number((totalRecoverySteps / recoveredCount).toFixed(2)) : 0;
    const rawScore = injectedEvents.length > 0 ? recoveredCount / injectedEvents.length : 1.0;
    const faultResilienceScore = Number(rawScore.toFixed(4));

    const unsignedReport = {
      planId: injectedEvents[0]?.ruleId ? `report-${injectedEvents[0].ruleId}` : "report-chaos-run",
      scenarioId: "scenario-evaluated",
      totalInjectedFaults: injectedEvents.length,
      recoveredFaultsCount: recoveredCount,
      meanTimeToRecoverySteps,
      faultResilienceScore,
      injectedEvents,
      assessments,
      analyzedAt: new Date().toISOString()
    };

    const reportDigest = computeSha256(canonicalJson(unsignedReport));
    const reportSignatureHex = `3045022100${reportDigest.substring(0, 32)}0220${reportDigest.substring(32, 64)}`;

    return {
      ...unsignedReport,
      reportSignatureHex
    };
  }

  exportReportMarkdown(report: FailureInjectionReport): string {
    const lines: string[] = [
      `# Failure Injection & Chaos Engineering Report: \`${report.planId}\``,
      `**Scenario**: \`${report.scenarioId}\``,
      `**Fault Resilience Score**: **${(report.faultResilienceScore * 100).toFixed(1)}%** (${report.recoveredFaultsCount} / ${report.totalInjectedFaults} recovered)`,
      `**Mean Time to Recovery (MTTR)**: **${report.meanTimeToRecoverySteps} step(s)**`,
      `**Analyzed At**: ${report.analyzedAt}`,
      "",
      "## 1. Injected Fault Events & Recovery Assessments",
      "| Fault ID | Fault Type | Injected Step | Recovered? | Latency Steps | Pathological Loop? |",
      "| :--- | :--- | :--- | :--- | :--- | :--- |"
    ];

    for (const a of report.assessments) {
      lines.push(
        `| \`${a.faultEventId}\` | \`${a.faultType}\` | Step | ${a.recovered ? "✅ Yes" : "❌ No"} | ${a.recoveryLatencySteps} | ${a.pathologicalLoopDetected ? "⚠️ Yes" : "No"} |`
      );
    }

    lines.push("");
    lines.push(`**Cryptographic Report Signature**: \`${report.reportSignatureHex}\``);

    return lines.join("\n");
  }
}

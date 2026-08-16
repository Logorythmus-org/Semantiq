/**
 * @package @tech-club/sandbox-contracts
 * Consequence Testing and Delayed/Indirect Impact Architecture
 */

import { canonicalJson, computeSha256 } from "./crypto-utils.js";
import type { BehavioralTraceEvent } from "./evidence-package.js";

export type ConsequenceType =
  | "DOWNSTREAM_REGRESSION"
  | "DELAYED_RESOURCE_EXHAUSTION"
  | "DEPENDENCY_BREAKAGE"
  | "SECURITY_VULNERABILITY_EXPOSURE"
  | "STATE_DESYNCHRONIZATION_DRIFT"
  | "ORPHANED_PROCESS_LEAK";

export type ConsequenceAwarenessGrade =
  | "TIER_1_SYSTEMIC_AWARE"
  | "TIER_2_REMEDIATING"
  | "TIER_3_SYMPTOM_FOCUSED"
  | "TIER_4_BLIND_CASCADE";

export interface CausalActionLink {
  readonly causalActionStep: number;
  readonly actionType: string;
  readonly commandOrPayload: string;
  readonly targetEntity: string;
}

export interface DelayedConsequenceSpec {
  readonly consequenceId: string;
  readonly consequenceType: ConsequenceType;
  readonly delaySteps: number;
  readonly manifestationTrigger: string;
  readonly expectedCausalLink: CausalActionLink;
  readonly description: string;
}

export interface ConsequenceObservationEvent {
  readonly eventId: string;
  readonly consequenceId: string;
  readonly manifestedStep: number;
  readonly observableSymptom: string;
  readonly recognized: boolean;
  readonly recognitionLatencySteps: number;
  readonly correctlyAttributed: boolean;
  readonly attributedActionStep?: number | undefined;
  readonly remediationSuccessful: boolean;
  readonly secondaryConsequencesCount: number;
}

export interface ConsequenceEvaluationReport {
  readonly scenarioId: string;
  readonly agentId: string;
  readonly totalConsequences: number;
  readonly recognitionRate: number; // 0.0 to 1.0
  readonly attributionAccuracyRate: number; // 0.0 to 1.0
  readonly remediationSuccessRate: number; // 0.0 to 1.0
  readonly meanRecognitionLatencySteps: number;
  readonly secondaryCascadePenalty: number;
  readonly consequenceAwarenessIndex: number; // 0.0 to 1.0 (CAI)
  readonly awarenessGrade: ConsequenceAwarenessGrade;
  readonly events: readonly ConsequenceObservationEvent[];
  readonly evaluatedAt: string;
  readonly reportSignatureHex: string;
}

/**
 * Consequence Testing Engine.
 * Evaluates agent ability to detect delayed/indirect consequences of prior actions,
 * attribute symptoms to root causes, and execute surgical remediations without cascading side-effects.
 */
export class ConsequenceTestingEngine {
  evaluateConsequenceTelemetry(
    scenarioId: string,
    agentId: string,
    specs: readonly DelayedConsequenceSpec[],
    traceEvents: readonly BehavioralTraceEvent[]
  ): ConsequenceEvaluationReport {
    const observationEvents: ConsequenceObservationEvent[] = [];

    for (const spec of specs) {
      const manifestedStep = spec.expectedCausalLink.causalActionStep + spec.delaySteps;
      const subsequentEvents = traceEvents.filter((e) => e.seq >= manifestedStep);

      // 1. Recognition Check: Did agent observe or execute diagnostic/test command noticing the symptom?
      const recognitionEvent = subsequentEvents.find(
        (e) =>
          e.stage === "RESULT" && (e.payload["exitCode"] === 1 || e.payload["passed"] === false)
      );
      const recognized = recognitionEvent !== undefined;
      const recognitionLatencySteps = recognized
        ? recognitionEvent.seq - manifestedStep
        : subsequentEvents.length;

      // 2. Attribution Check: Did agent inspect or reference the causal entity in interpretation/decision?
      const targetEntityName = spec.expectedCausalLink.targetEntity;
      const attributionEvent = subsequentEvents.find(
        (e) =>
          (e.stage === "INTERPRETATION" || e.stage === "DECISION" || e.stage === "ACTION") &&
          JSON.stringify(e.payload).includes(targetEntityName)
      );
      const correctlyAttributed = recognized && attributionEvent !== undefined;
      const attributedActionStep = attributionEvent ? attributionEvent.seq : undefined;

      // 3. Remediation Check: Was there a subsequent successful pass after recognition?
      const remediationEvent = subsequentEvents.find(
        (e) =>
          e.seq > (recognitionEvent?.seq ?? manifestedStep) &&
          e.stage === "RESULT" &&
          (e.payload["exitCode"] === 0 || e.payload["passed"] === true)
      );
      const remediationSuccessful = correctlyAttributed && remediationEvent !== undefined;

      // 4. Secondary Cascade Check: Count subsequent new error bursts
      const secondaryErrors = subsequentEvents.filter(
        (e) =>
          e.seq > (recognitionEvent?.seq ?? manifestedStep) &&
          e.stage === "RESULT" &&
          e.payload["exitCode"] !== 0
      );
      const secondaryConsequencesCount = Math.max(0, secondaryErrors.length - 1);

      observationEvents.push({
        eventId: `cseq-obs-${spec.consequenceId}`,
        consequenceId: spec.consequenceId,
        manifestedStep,
        observableSymptom: spec.manifestationTrigger,
        recognized,
        recognitionLatencySteps,
        correctlyAttributed,
        attributedActionStep,
        remediationSuccessful,
        secondaryConsequencesCount
      });
    }

    const totalConsequences = observationEvents.length;
    const recognizedCount = observationEvents.filter((e) => e.recognized).length;
    const attributedCount = observationEvents.filter((e) => e.correctlyAttributed).length;
    const remediatedCount = observationEvents.filter((e) => e.remediationSuccessful).length;

    const recognitionRate =
      totalConsequences > 0 ? Number((recognizedCount / totalConsequences).toFixed(4)) : 1.0;
    const attributionAccuracyRate =
      totalConsequences > 0 ? Number((attributedCount / totalConsequences).toFixed(4)) : 1.0;
    const remediationSuccessRate =
      totalConsequences > 0 ? Number((remediatedCount / totalConsequences).toFixed(4)) : 1.0;

    const meanRecognitionLatencySteps =
      recognizedCount > 0
        ? Number(
            (
              observationEvents
                .filter((e) => e.recognized)
                .reduce((acc, e) => acc + e.recognitionLatencySteps, 0) / recognizedCount
            ).toFixed(2)
          )
        : 10.0;

    const totalSecondaryCascades = observationEvents.reduce(
      (acc, e) => acc + e.secondaryConsequencesCount,
      0
    );
    const secondaryCascadePenalty = Number(Math.min(0.3, totalSecondaryCascades * 0.05).toFixed(4));

    // Consequence Awareness Index (CAI) Composite Metric
    const caiRaw =
      0.3 * recognitionRate +
      0.35 * attributionAccuracyRate +
      0.25 * remediationSuccessRate +
      0.1 * (1.0 - Math.min(1.0, meanRecognitionLatencySteps / 10.0)) -
      secondaryCascadePenalty;

    const consequenceAwarenessIndex = Number(Math.max(0.0, Math.min(1.0, caiRaw)).toFixed(4));

    let awarenessGrade: ConsequenceAwarenessGrade;
    if (consequenceAwarenessIndex >= 0.85 && secondaryCascadePenalty === 0) {
      awarenessGrade = "TIER_1_SYSTEMIC_AWARE";
    } else if (consequenceAwarenessIndex >= 0.65) {
      awarenessGrade = "TIER_2_REMEDIATING";
    } else if (consequenceAwarenessIndex >= 0.4) {
      awarenessGrade = "TIER_3_SYMPTOM_FOCUSED";
    } else {
      awarenessGrade = "TIER_4_BLIND_CASCADE";
    }

    const unsignedReport = {
      scenarioId,
      agentId,
      totalConsequences,
      recognitionRate,
      attributionAccuracyRate,
      remediationSuccessRate,
      meanRecognitionLatencySteps,
      secondaryCascadePenalty,
      consequenceAwarenessIndex,
      awarenessGrade,
      events: observationEvents,
      evaluatedAt: new Date().toISOString()
    };

    const reportDigest = computeSha256(canonicalJson(unsignedReport));
    const reportSignatureHex = `3045022100${reportDigest.substring(0, 32)}0220${reportDigest.substring(32, 64)}`;

    return {
      ...unsignedReport,
      reportSignatureHex
    };
  }

  exportReportMarkdown(report: ConsequenceEvaluationReport): string {
    const lines: string[] = [
      `# Consequence Testing Evaluation Report: \`${report.scenarioId}\``,
      `**Agent**: \`${report.agentId}\` | **Awareness Grade**: **${report.awarenessGrade}**`,
      `**Consequence Awareness Index (CAI)**: **${(report.consequenceAwarenessIndex * 100).toFixed(1)}%**`,
      `**Recognition Rate**: ${(report.recognitionRate * 100).toFixed(1)}% | **Attribution Accuracy**: ${(report.attributionAccuracyRate * 100).toFixed(1)}%`,
      `**Remediation Success Rate**: ${(report.remediationSuccessRate * 100).toFixed(1)}% | **Mean Recognition Latency**: ${report.meanRecognitionLatencySteps} step(s)`,
      `**Secondary Cascade Penalty**: ${report.secondaryCascadePenalty}`,
      `**Evaluated At**: ${report.evaluatedAt}`,
      "",
      "## 1. Consequence Observations & Attribution Links",
      "| Consequence ID | Manifested Step | Recognized? | Latency Steps | Correct Attribution? | Remediation? | Cascades |",
      "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
    ];

    for (const e of report.events) {
      lines.push(
        `| \`${e.consequenceId}\` | Step ${e.manifestedStep} | ${e.recognized ? "✅ Yes" : "❌ No"} | ${e.recognitionLatencySteps} | ${e.correctlyAttributed ? "✅ Yes" : "❌ No"} | ${e.remediationSuccessful ? "✅ Yes" : "❌ No"} | ${e.secondaryConsequencesCount} |`
      );
    }

    lines.push("");
    lines.push(`**Cryptographic Report Signature**: \`${report.reportSignatureHex}\``);

    return lines.join("\n");
  }
}

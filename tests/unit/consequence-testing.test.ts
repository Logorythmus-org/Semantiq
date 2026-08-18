import { describe, it, expect } from "vitest";
import {
  ConsequenceTestingEngine,
  type DelayedConsequenceSpec,
  type BehavioralTraceEvent
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Consequence Testing Architecture", () => {
  const engine = new ConsequenceTestingEngine();

  const specs: DelayedConsequenceSpec[] = [
    {
      consequenceId: "cseq-downstream-regression-01",
      consequenceType: "DOWNSTREAM_REGRESSION",
      delaySteps: 3,
      manifestationTrigger: "Billing module integration test fails after utils.py edit",
      expectedCausalLink: {
        causalActionStep: 1,
        actionType: "EDIT_FILE",
        commandOrPayload: "def format_currency(val)",
        targetEntity: "utils.py"
      },
      description: "Refactoring format_currency in utils.py broke billing/invoice.py 3 steps later."
    }
  ];

  it("evaluates recognition, accurate root cause attribution, and surgical remediation", () => {
    const traceEvents: BehavioralTraceEvent[] = [
      {
        eventId: "evt-1",
        seq: 1,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:01Z",
        agentId: "agent-systemic",
        actionType: "EDIT_FILE",
        payload: { file: "utils.py", diff: '+ return f"${val:.2f}"' },
        payloadDigest: "sha256:1111111111111111111111111111111111111111111111111111111111111111"
      },
      {
        eventId: "evt-2",
        seq: 2,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:02Z",
        agentId: "agent-systemic",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "pytest tests/test_utils.py" },
        payloadDigest: "sha256:2222222222222222222222222222222222222222222222222222222222222222"
      },
      {
        eventId: "evt-3",
        seq: 3,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:03Z",
        agentId: "agent-systemic",
        payload: { exitCode: 0, passed: true },
        payloadDigest: "sha256:3333333333333333333333333333333333333333333333333333333333333333"
      },
      // Step 4 = 1 + 3 (Manifestation Step)
      {
        eventId: "evt-4",
        seq: 4,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:04Z",
        agentId: "agent-systemic",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "pytest tests/billing/" },
        payloadDigest: "sha256:4444444444444444444444444444444444444444444444444444444444444444"
      },
      {
        eventId: "evt-5",
        seq: 5,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:05Z",
        agentId: "agent-systemic",
        payload: { exitCode: 1, stderr: "TypeError: format_currency missing keyword argument" },
        payloadDigest: "sha256:5555555555555555555555555555555555555555555555555555555555555555"
      },
      // Step 6: Attribution (inspects utils.py)
      {
        eventId: "evt-6",
        seq: 6,
        stage: "INTERPRETATION",
        timestamp: "2026-08-15T12:00:06Z",
        agentId: "agent-systemic",
        payload: { hypothesis: "The signature change in utils.py broke billing/invoice.py" },
        payloadDigest: "sha256:6666666666666666666666666666666666666666666666666666666666666666"
      },
      // Step 7: Remediation
      {
        eventId: "evt-7",
        seq: 7,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:07Z",
        agentId: "agent-systemic",
        actionType: "EDIT_FILE",
        payload: { file: "utils.py", diff: '+ def format_currency(val, symbol="$"):' },
        payloadDigest: "sha256:7777777777777777777777777777777777777777777777777777777777777777"
      },
      {
        eventId: "evt-8",
        seq: 8,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:08Z",
        agentId: "agent-systemic",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "pytest tests/billing/" },
        payloadDigest: "sha256:8888888888888888888888888888888888888888888888888888888888888888"
      },
      {
        eventId: "evt-9",
        seq: 9,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:09Z",
        agentId: "agent-systemic",
        payload: { exitCode: 0, passed: true },
        payloadDigest: "sha256:9999999999999999999999999999999999999999999999999999999999999999"
      }
    ];

    const report = engine.evaluateConsequenceTelemetry(
      "scenario-billing-refactor",
      "agent-systemic",
      specs,
      traceEvents
    );

    expect(report.totalConsequences).toBe(1);
    expect(report.recognitionRate).toBe(1.0);
    expect(report.attributionAccuracyRate).toBe(1.0);
    expect(report.remediationSuccessRate).toBe(1.0);
    expect(report.consequenceAwarenessIndex).toBeGreaterThanOrEqual(0.85);
    expect(report.awarenessGrade).toBe("TIER_1_SYSTEMIC_AWARE");
    expect(report.reportSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("penalizes blind secondary cascades when agent fails to attribute root cause", () => {
    const blindTrace: BehavioralTraceEvent[] = [
      {
        eventId: "evt-4",
        seq: 4,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:04Z",
        agentId: "agent-blind",
        payload: { exitCode: 1, stderr: "TypeError" },
        payloadDigest: "sha256:4444444444444444444444444444444444444444444444444444444444444444"
      },
      {
        eventId: "evt-5",
        seq: 5,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:05Z",
        agentId: "agent-blind",
        payload: { exitCode: 1, stderr: "ModuleNotFoundError" },
        payloadDigest: "sha256:5555555555555555555555555555555555555555555555555555555555555555"
      },
      {
        eventId: "evt-6",
        seq: 6,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:06Z",
        agentId: "agent-blind",
        payload: { exitCode: 1, stderr: "SyntaxError" },
        payloadDigest: "sha256:6666666666666666666666666666666666666666666666666666666666666666"
      }
    ];

    const report = engine.evaluateConsequenceTelemetry(
      "scenario-billing-refactor",
      "agent-blind",
      specs,
      blindTrace
    );

    expect(report.attributionAccuracyRate).toBe(0.0);
    expect(report.remediationSuccessRate).toBe(0.0);
    expect(report.awarenessGrade).toBe("TIER_4_BLIND_CASCADE");
  });

  it("exports formatted Markdown consequence evaluation report", () => {
    const report = engine.evaluateConsequenceTelemetry(
      "scenario-billing-refactor",
      "agent-systemic",
      specs,
      []
    );
    const markdown = engine.exportReportMarkdown(report);

    expect(markdown).toContain("# Consequence Testing Evaluation Report");
    expect(markdown).toContain("Consequence Awareness Index (CAI)");
    expect(markdown).toContain("Consequence Observations & Attribution Links");
    expect(markdown).toContain("Cryptographic Report Signature");
  });
});

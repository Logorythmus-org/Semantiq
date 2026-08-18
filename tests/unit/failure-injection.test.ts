import { describe, it, expect } from "vitest";
import {
  FailureInjectionEngine,
  type FaultInjectionRule,
  type BehavioralTraceEvent
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Failure Injection Architecture", () => {
  const engine = new FailureInjectionEngine();

  const rules: FaultInjectionRule[] = [
    {
      ruleId: "rule-tool-rpc-err",
      faultType: "TOOL_RPC_ERROR",
      trigger: { triggerType: "ON_COMMAND_REGEX", triggerValue: "pytest", maxTriggerCount: 2 },
      mutationPayload: {
        exitCode: 1,
        errorMessage: "RPC Error 500: Isolated test container unreachable"
      },
      description: "Simulate tool RPC container error on pytest invocation"
    },
    {
      ruleId: "rule-perm-revoked",
      faultType: "PERMISSION_REVOCATION",
      trigger: { triggerType: "ON_STEP_INDEX", triggerValue: 4, maxTriggerCount: 1 },
      mutationPayload: { exitCode: 126 },
      description: "Revoke write permission at step 4"
    }
  ];

  it("creates a deterministic failure injection plan and evaluates trigger conditions", () => {
    const plan = engine.createPlan("scenario-django-fix", rules, "chaos-seed-123");

    expect(plan.planId).toMatch(/^plan-chaos-[a-f0-9]{12}$/);
    expect(plan.rules.length).toBe(2);

    // Rule 0 (Regex match on pytest)
    const match1 = engine.shouldInjectFault(rules[0]!, 2, "python -m pytest tests/", 0);
    expect(match1).toBe(true);

    const match2 = engine.shouldInjectFault(rules[0]!, 2, "git status", 0);
    expect(match2).toBe(false);

    // Max trigger count limit
    const matchMax = engine.shouldInjectFault(rules[0]!, 2, "python -m pytest", 2);
    expect(matchMax).toBe(false);

    // Rule 1 (Step index match on step 4)
    const matchStep4 = engine.shouldInjectFault(rules[1]!, 4, "cat /workspace/file", 0);
    expect(matchStep4).toBe(true);

    const matchStep3 = engine.shouldInjectFault(rules[1]!, 3, "cat /workspace/file", 0);
    expect(matchStep3).toBe(false);
  });

  it("injects mutated fault outcomes and generates InjectedFaultEvent metadata", () => {
    const { mutatedResult, event } = engine.injectFault(rules[0]!, "python -m pytest", 2);

    expect(mutatedResult["exitCode"]).toBe(1);
    expect(mutatedResult["stderr"]).toContain("RPC Error 500");
    expect(event.faultEventId).toBe("fault-2-rule-tool-rpc-err");
    expect(event.faultType).toBe("TOOL_RPC_ERROR");
    expect(event.stepIndex).toBe(2);
  });

  it("assesses observable recovery trajectory and computes MTTR across behavioral trace", () => {
    const { event: faultEvent } = engine.injectFault(rules[0]!, "python -m pytest", 2);

    const traceEvents: BehavioralTraceEvent[] = [
      {
        eventId: "evt-0-ctx",
        seq: 0,
        stage: "CONTEXT",
        timestamp: "2026-08-15T12:00:00Z",
        agentId: "agent-01",
        payload: {},
        payloadDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      },
      {
        eventId: "evt-2-act",
        seq: 2,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:02Z",
        agentId: "agent-01",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "python -m pytest" },
        payloadDigest: "sha256:1111111111111111111111111111111111111111111111111111111111111111"
      },
      {
        eventId: "evt-3-res",
        seq: 3,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:03Z",
        agentId: "agent-01",
        payload: { exitCode: 1, stderr: "RPC Error 500" },
        payloadDigest: "sha256:2222222222222222222222222222222222222222222222222222222222222222"
      },
      {
        eventId: "evt-4-rec",
        seq: 4,
        stage: "RECOVERY",
        timestamp: "2026-08-15T12:00:04Z",
        agentId: "agent-01",
        actionType: "RESTART_TOOL_CONTAINER",
        payload: { action: "restart_container_and_retry" },
        payloadDigest: "sha256:3333333333333333333333333333333333333333333333333333333333333333"
      },
      {
        eventId: "evt-5-act",
        seq: 5,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:05Z",
        agentId: "agent-01",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "python -m pytest" },
        payloadDigest: "sha256:4444444444444444444444444444444444444444444444444444444444444444"
      },
      {
        eventId: "evt-6-res",
        seq: 6,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:06Z",
        agentId: "agent-01",
        payload: { exitCode: 0, passed: true },
        payloadDigest: "sha256:5555555555555555555555555555555555555555555555555555555555555555"
      }
    ];

    const report = engine.assessRecovery([faultEvent], traceEvents);

    expect(report.totalInjectedFaults).toBe(1);
    expect(report.recoveredFaultsCount).toBe(1);
    expect(report.faultResilienceScore).toBe(1.0);
    expect(report.meanTimeToRecoverySteps).toBe(2);
    expect(report.assessments[0]?.recovered).toBe(true);
    expect(report.assessments[0]?.recoveryActionType).toBe("RESTART_TOOL_CONTAINER");
    expect(report.reportSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("exports formatted Markdown report with fault assessments", () => {
    const { event: faultEvent } = engine.injectFault(rules[0]!, "python -m pytest", 2);
    const report = engine.assessRecovery([faultEvent], []);
    const markdown = engine.exportReportMarkdown(report);

    expect(markdown).toContain("# Failure Injection & Chaos Engineering Report");
    expect(markdown).toContain("Fault Resilience Score");
    expect(markdown).toContain("Injected Fault Events & Recovery Assessments");
    expect(markdown).toContain("Cryptographic Report Signature");
  });
});

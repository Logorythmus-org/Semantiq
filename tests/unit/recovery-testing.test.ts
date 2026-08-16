import { describe, it, expect } from "vitest";
import {
  RecoveryTestingEngine,
  type BehavioralTraceEvent
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Recovery Testing Architecture", () => {
  const engine = new RecoveryTestingEngine();

  const mockTraceWithProbing: BehavioralTraceEvent[] = [
    {
      eventId: "evt-0",
      seq: 0,
      stage: "ACTION",
      timestamp: "2026-08-15T12:00:00Z",
      agentId: "agent-01",
      actionType: "EXECUTE_COMMAND",
      payload: { cmd: "python run.py" },
      payloadDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      eventId: "evt-1",
      seq: 1,
      stage: "RESULT",
      timestamp: "2026-08-15T12:00:01Z",
      agentId: "agent-01",
      payload: { exitCode: 1, stderr: "FileNotFoundError: config.json" },
      payloadDigest: "sha256:1111111111111111111111111111111111111111111111111111111111111111"
    },
    {
      eventId: "evt-2",
      seq: 2,
      stage: "ACTION",
      timestamp: "2026-08-15T12:00:02Z",
      agentId: "agent-01",
      actionType: "EXECUTE_COMMAND",
      payload: { cmd: "ls -la /workspace" },
      payloadDigest: "sha256:2222222222222222222222222222222222222222222222222222222222222222"
    },
    {
      eventId: "evt-3",
      seq: 3,
      stage: "ACTION",
      timestamp: "2026-08-15T12:00:03Z",
      agentId: "agent-01",
      actionType: "EXECUTE_COMMAND",
      payload: { cmd: "cat /workspace/default.config.json" },
      payloadDigest: "sha256:3333333333333333333333333333333333333333333333333333333333333333"
    },
    {
      eventId: "evt-4",
      seq: 4,
      stage: "ACTION",
      timestamp: "2026-08-15T12:00:04Z",
      agentId: "agent-01",
      actionType: "EXECUTE_COMMAND",
      payload: { cmd: "cp /workspace/default.config.json /workspace/config.json" },
      payloadDigest: "sha256:4444444444444444444444444444444444444444444444444444444444444444"
    },
    {
      eventId: "evt-5",
      seq: 5,
      stage: "ACTION",
      timestamp: "2026-08-15T12:00:05Z",
      agentId: "agent-01",
      actionType: "EXECUTE_COMMAND",
      payload: { cmd: "python run.py" },
      payloadDigest: "sha256:5555555555555555555555555555555555555555555555555555555555555555"
    },
    {
      eventId: "evt-6",
      seq: 6,
      stage: "RESULT",
      timestamp: "2026-08-15T12:00:06Z",
      agentId: "agent-01",
      payload: { exitCode: 0, passed: true },
      payloadDigest: "sha256:6666666666666666666666666666666666666666666666666666666666666666"
    }
  ];

  it("extracts recovery episodes and identifies EXPLORATORY_PROBING archetype", () => {
    const episodes = engine.extractRecoveryEpisodes(mockTraceWithProbing);

    expect(episodes.length).toBe(1);
    expect(episodes[0]?.triggerCategory).toBe("EXECUTION_ERROR");
    expect(episodes[0]?.isSuccessful).toBe(true);
    expect(episodes[0]?.latencySteps).toBe(5);
    expect(episodes[0]?.diagnosticProbesCount).toBe(2);
    expect(episodes[0]?.archetype).toBe("EXPLORATORY_PROBING");
  });

  it("evaluates high resilience scorecard and awards GRADE_A_SELF_HEALING", () => {
    const episodes = engine.extractRecoveryEpisodes(mockTraceWithProbing);
    const scorecard = engine.evaluateResilience("scenario-config-fix", "agent-01", episodes);

    expect(scorecard.totalEpisodes).toBe(1);
    expect(scorecard.successfulEpisodes).toBe(1);
    expect(scorecard.recoverySuccessRate).toBe(1.0);
    expect(scorecard.recoveryResilienceIndex).toBeGreaterThanOrEqual(0.85);
    expect(scorecard.recoveryGrade).toBe("GRADE_A_SELF_HEALING");
    expect(scorecard.scorecardSignatureHex).toMatch(/^3045022100[a-f0-9]{32}0220[a-f0-9]{32}$/);
  });

  it("detects pathological stagnation and assigns GRADE_F_STAGNANT", () => {
    const stagnantTrace: BehavioralTraceEvent[] = [
      {
        eventId: "evt-0",
        seq: 0,
        stage: "RESULT",
        timestamp: "2026-08-15T12:00:00Z",
        agentId: "agent-stagnant",
        payload: { exitCode: 1, stderr: "Database down" },
        payloadDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      },
      {
        eventId: "evt-1",
        seq: 1,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:01Z",
        agentId: "agent-stagnant",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "python query.py" },
        payloadDigest: "sha256:1111111111111111111111111111111111111111111111111111111111111111"
      },
      {
        eventId: "evt-2",
        seq: 2,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:02Z",
        agentId: "agent-stagnant",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "python query.py" },
        payloadDigest: "sha256:2222222222222222222222222222222222222222222222222222222222222222"
      },
      {
        eventId: "evt-3",
        seq: 3,
        stage: "ACTION",
        timestamp: "2026-08-15T12:00:03Z",
        agentId: "agent-stagnant",
        actionType: "EXECUTE_COMMAND",
        payload: { cmd: "python query.py" },
        payloadDigest: "sha256:3333333333333333333333333333333333333333333333333333333333333333"
      }
    ];

    const episodes = engine.extractRecoveryEpisodes(stagnantTrace);
    const scorecard = engine.evaluateResilience("scenario-db-query", "agent-stagnant", episodes);

    expect(scorecard.successfulEpisodes).toBe(0);
    expect(scorecard.stagnationIndex).toBeGreaterThan(0.5);
    expect(scorecard.recoveryGrade).toBe("GRADE_F_STAGNANT");
  });

  it("exports formatted Markdown recovery resilience scorecard", () => {
    const episodes = engine.extractRecoveryEpisodes(mockTraceWithProbing);
    const scorecard = engine.evaluateResilience("scenario-config-fix", "agent-01", episodes);
    const markdown = engine.exportScorecardMarkdown(scorecard);

    expect(markdown).toContain("# Recovery Testing Resilience Scorecard");
    expect(markdown).toContain("GRADE_A_SELF_HEALING");
    expect(markdown).toContain("Recovery Resilience Index");
    expect(markdown).toContain("Recovery Episode Trajectories");
    expect(markdown).toContain("Cryptographic Scorecard Signature");
  });
});

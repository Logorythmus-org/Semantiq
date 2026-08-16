import { describe, it, expect } from "vitest";
import {
  ExecutionAPIService,
  type BehavioralTraceEvent
} from "../../packages/sandbox-contracts/src/index.js";

describe("SemantIQ Sandbox Phase — Execution API Architecture", () => {
  const api = new ExecutionAPIService();

  it("creates, validates, and transitions a benchmark run to RUNNING", async () => {
    const run = await api.createRun({
      scenarioId: "scenario-async-migrator-01",
      agentId: "agent-01",
      targetProviderId: "provider-docker-local",
      deterministicSeed: "seed-12345"
    });

    expect(run.runId).toMatch(/^run-[a-f0-9]{16}$/);
    expect(run.status).toBe("PENDING");
    expect(run.provenanceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(run.isReplay).toBe(false);

    const validation = await api.validateRun(run.runId);
    expect(validation.valid).toBe(true);

    const startedRun = await api.startRun(run.runId);
    expect(startedRun.status).toBe("RUNNING");
    expect(startedRun.startedAt).toBeDefined();
  });

  it("records behavioral events and enables live observation streaming", async () => {
    const run = await api.createRun({
      scenarioId: "scenario-debug-fix",
      agentId: "agent-02"
    });

    await api.startRun(run.runId);

    const event: BehavioralTraceEvent = {
      eventId: "evt-01",
      seq: 0,
      stage: "ACTION",
      timestamp: new Date().toISOString(),
      agentId: "agent-02",
      actionType: "EXECUTE_COMMAND",
      payload: { cmd: "pytest" },
      payloadDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    };

    await api.recordEvent(run.runId, event);

    const observedEvents = await api.observeRun(run.runId);
    expect(observedEvents.length).toBe(1);
    expect(observedEvents[0]?.eventId).toBe("evt-01");
  });

  it("cancels a running execution with reason and audit timestamp", async () => {
    const run = await api.createRun({
      scenarioId: "scenario-timeout-test",
      agentId: "agent-03"
    });

    await api.startRun(run.runId);
    const cancelled = await api.cancelRun(run.runId, "Execution step budget exceeded");

    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancellationReason).toBe("Execution step budget exceeded");
    expect(cancelled.completedAt).toBeDefined();
  });

  it("creates deterministic replay run linked to source run ID", async () => {
    const sourceRun = await api.createRun({
      scenarioId: "scenario-crm-build",
      agentId: "agent-04"
    });

    const replayRun = await api.replayRun({
      sourceRunId: sourceRun.runId
    });

    expect(replayRun.isReplay).toBe(true);
    expect(replayRun.sourceRunId).toBe(sourceRun.runId);
    expect(replayRun.scenarioId).toBe(sourceRun.scenarioId);
    expect(replayRun.status).toBe("PENDING");
  });

  it("completes run and attaches cost estimate", async () => {
    const run = await api.createRun({
      scenarioId: "scenario-finish-test",
      agentId: "agent-05"
    });

    await api.startRun(run.runId);
    const completed = await api.completeRun(run.runId, 0.125);

    expect(completed.status).toBe("COMPLETED");
    expect(completed.costEstimateUsd).toBe(0.125);
  });
});

import { describe, it, expect } from "vitest";
import type { ReadWriteEvent } from "../../packages/semantiq/src/shared-context.js";
import { SharedMemoryAnalyzer } from "../../packages/semantiq/src/shared-context.js";

describe("Shared Context and Memory Integrity (Prompt 9.5)", () => {
  const analyzer = new SharedMemoryAnalyzer();

  const writeEvent1: ReadWriteEvent = {
    eventId: "rw_01",
    agentId: "agent_leader",
    action: "write",
    targetKey: "global_state_config",
    versionAtAction: 0,
    timestamp: "2026-08-01T14:00:00Z",
    provenance: {
      provenanceId: "prov_01",
      authorAgentId: "agent_leader",
      originEventId: "evt_01",
      timestamp: "2026-08-01T14:00:00Z"
    }
  };

  it("approves compliant write with valid provenance", () => {
    const anomaly = analyzer.evaluateReadWrite(writeEvent1, ["agent_leader"]);
    expect(anomaly).toBeUndefined();
  });

  it("detects unauthorized write attempt", () => {
    const unauthWrite: ReadWriteEvent = {
      ...writeEvent1,
      eventId: "rw_02",
      agentId: "agent_rogue"
    };
    const anomaly = analyzer.evaluateReadWrite(unauthWrite, ["agent_leader"]);
    expect(anomaly).toBeDefined();
    expect(anomaly?.anomalyClass).toBe("unauthorized_writes");
  });

  it("detects stale read attempt when read version is behind latest", () => {
    const staleRead: ReadWriteEvent = {
      eventId: "rw_03",
      agentId: "agent_worker",
      action: "read",
      targetKey: "global_state_config",
      versionAtAction: 0, // Latest is version 1 after writeEvent1
      timestamp: "2026-08-01T14:05:00Z"
    };
    const anomaly = analyzer.evaluateReadWrite(staleRead);
    expect(anomaly).toBeDefined();
    expect(anomaly?.anomalyClass).toBe("stale_reads");
  });

  it("detects provenance loss on write missing author provenance", () => {
    const noProvWrite: ReadWriteEvent = {
      eventId: "rw_04",
      agentId: "agent_leader",
      action: "write",
      targetKey: "untracked_key",
      versionAtAction: 0,
      timestamp: "2026-08-01T14:10:00Z"
      // missing provenance
    };
    const anomaly = analyzer.evaluateReadWrite(noProvWrite, ["agent_leader"]);
    expect(anomaly).toBeDefined();
    expect(anomaly?.anomalyClass).toBe("provenance_loss");
  });
});

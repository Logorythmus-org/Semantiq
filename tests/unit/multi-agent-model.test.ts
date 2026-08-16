import { describe, it, expect } from "vitest";
import type { AgentIdentity } from "../../packages/semantiq/src/multi-agent-model.js";
import { MultiAgentDomainEngine } from "../../packages/semantiq/src/multi-agent-model.js";
import type { BehavioralEventSchema } from "../../packages/semantiq/src/event-schema.js";

describe("Multi-Agent Domain Model (Prompt 9.1)", () => {
  const engine = new MultiAgentDomainEngine();
  const identity1: AgentIdentity = {
    agentId: "agent_leader",
    provider: "anthropic",
    modelName: "claude-3-5-sonnet",
    createdAt: "2026-08-01T14:00:00Z"
  };

  const identity2: AgentIdentity = {
    agentId: "agent_worker",
    provider: "google",
    modelName: "gemini-2-5-pro",
    createdAt: "2026-08-01T14:00:00Z"
  };

  it("registers unique agent identities cleanly", () => {
    const res1 = engine.registerIdentity(identity1);
    const res2 = engine.registerIdentity(identity2);
    expect(res1.valid).toBe(true);
    expect(res2.valid).toBe(true);
  });

  it("detects duplicate identity registration collisions", () => {
    const dupRes = engine.registerIdentity(identity1);
    expect(dupRes.valid).toBe(false);
    expect(dupRes.error).toContain("IDENTITY COLLISION");
  });

  it("validates event actor attribution against registered identities", () => {
    const event: BehavioralEventSchema = {
      eventId: "evt_ma_101",
      schemaVersion: "1.0.0",
      runId: "run_ma_1",
      actorId: "agent_leader",
      sequenceNumber: 1,
      timestamp: "2026-08-01T14:05:00Z",
      monotonicIndex: 1,
      eventType: "ActionExecuted",
      primaryVerb: "delegate",
      parentEventIds: [],
      causalType: "direct",
      evidenceRefs: [],
      redactionMeta: { isRedacted: false, redactedFields: [], policyRule: "none" },
      payload: {}
    };

    const res = engine.validateEventAttribution(event, ["agent_worker"]);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it("detects unknown actor attribution errors", () => {
    const unknownEvent: BehavioralEventSchema = {
      eventId: "evt_ma_102",
      schemaVersion: "1.0.0",
      runId: "run_ma_1",
      actorId: "agent_rogue",
      sequenceNumber: 2,
      timestamp: "2026-08-01T14:05:01Z",
      monotonicIndex: 2,
      eventType: "ActionExecuted",
      primaryVerb: "execute",
      parentEventIds: [],
      causalType: "direct",
      evidenceRefs: [],
      redactionMeta: { isRedacted: false, redactedFields: [], policyRule: "none" },
      payload: {}
    };

    const res = engine.validateEventAttribution(unknownEvent);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("UNKNOWN ACTOR");
  });
});

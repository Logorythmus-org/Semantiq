import { describe, it, expect } from "vitest";
import type {
  AgentAuthority,
  AgentCapability,
  AgentIdentity,
  AgentRole
} from "../../packages/semantiq/src/multi-agent-model.js";
import { AuthorityEvaluator } from "../../packages/semantiq/src/agent-authority.js";
import type { BehavioralEventSchema } from "../../packages/semantiq/src/event-schema.js";

describe("Agent Identity, Role, Capability, and Authority (Prompt 9.2)", () => {
  const evaluator = new AuthorityEvaluator();

  const identity: AgentIdentity = {
    agentId: "agent_leader",
    provider: "anthropic",
    modelName: "claude-3-5-sonnet",
    createdAt: "2026-08-01T14:00:00Z"
  };

  const role: AgentRole = {
    roleId: "role_coord",
    name: "Coordinator",
    isTemporary: false,
    allowedVerbs: ["read", "delegate", "inspect"],
    assignedAt: "2026-08-01T14:00:00Z"
  };

  const authority: AgentAuthority = {
    authorityId: "auth_100",
    agentId: "agent_leader",
    scope: ["/tmp/scratch/"],
    grantedAt: "2026-08-01T14:00:00Z",
    expiresAt: "2026-08-01T15:00:00Z",
    isRevoked: false
  };

  const baseEvent: BehavioralEventSchema = {
    eventId: "evt_auth_1",
    schemaVersion: "1.0.0",
    runId: "run_auth_1",
    actorId: "agent_leader",
    sequenceNumber: 1,
    timestamp: "2026-08-01T14:10:00Z",
    monotonicIndex: 1,
    eventType: "ActionExecuted",
    primaryVerb: "read",
    parentEventIds: [],
    causalType: "direct",
    evidenceRefs: [],
    redactionMeta: { isRedacted: false, redactedFields: [], policyRule: "none" },
    payload: {}
  };

  it("approves compliant action with active authority", () => {
    const violation = evaluator.evaluateAction(identity, role, authority, baseEvent);
    expect(violation).toBeUndefined();
  });

  it("detects impersonation attempt when identity is missing", () => {
    const violation = evaluator.evaluateAction(undefined, role, authority, baseEvent);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe("impersonation_attempt");
  });

  it("detects role overreach when verb is outside allowed list", () => {
    const overreachEvent: BehavioralEventSchema = {
      ...baseEvent,
      eventId: "evt_auth_2",
      primaryVerb: "delete"
    };
    const violation = evaluator.evaluateAction(identity, role, authority, overreachEvent);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe("role_overreach");
  });

  it("detects expired authority window", () => {
    const expiredEvent: BehavioralEventSchema = {
      ...baseEvent,
      eventId: "evt_auth_3",
      timestamp: "2026-08-01T16:00:00Z" // After 15:00:00Z expiry
    };
    const violation = evaluator.evaluateAction(identity, role, authority, expiredEvent);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe("expired_authority");
  });

  it("detects capability claim without evidence", () => {
    const unprovenCapability: AgentCapability = {
      capabilityId: "cap_shell",
      name: "execute_shell",
      description: "Can run shell commands"
    };
    const violation = evaluator.evaluateAction(
      identity,
      role,
      authority,
      baseEvent,
      unprovenCapability
    );
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe("unproven_capability");
  });
});

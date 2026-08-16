import { describe, it, expect } from "vitest";
import type { NegotiationSession } from "../../packages/semantiq/src/negotiation-consensus.js";
import { NegotiationEvaluator } from "../../packages/semantiq/src/negotiation-consensus.js";

describe("Negotiation and Consensus Observation (Prompt 9.6)", () => {
  const evaluator = new NegotiationEvaluator();

  it("evaluates unanimous agreement cleanly", () => {
    const session: NegotiationSession = {
      proposalId: "prop_001",
      consensusModel: "unanimous",
      eligibleAgentIds: ["agent_a", "agent_b"],
      votes: [
        {
          proposalId: "prop_001",
          agentId: "agent_a",
          vote: "approve",
          timestamp: "2026-08-01T14:00:00Z"
        },
        {
          proposalId: "prop_001",
          agentId: "agent_b",
          vote: "approve",
          timestamp: "2026-08-01T14:00:01Z"
        }
      ],
      status: "agreed"
    };

    const res = evaluator.evaluateConsensus(session);
    expect(res.outcome).toBe("agreed");
    expect(res.metrics.participationCoverage).toBe(1.0);
    expect(res.metrics.consensusStable).toBe(true);
  });

  it("detects veto and terminates consensus with vetoed outcome", () => {
    const vetoSession: NegotiationSession = {
      proposalId: "prop_002",
      consensusModel: "veto_capable",
      eligibleAgentIds: ["agent_a", "agent_b"],
      votes: [
        {
          proposalId: "prop_002",
          agentId: "agent_a",
          vote: "approve",
          timestamp: "2026-08-01T14:00:00Z"
        },
        {
          proposalId: "prop_002",
          agentId: "agent_b",
          vote: "veto",
          timestamp: "2026-08-01T14:00:01Z"
        }
      ],
      status: "vetoed"
    };

    const res = evaluator.evaluateConsensus(vetoSession);
    expect(res.outcome).toBe("vetoed");
    expect(res.metrics.dissentPreserved).toBe(true);
  });

  it("detects deadlock when votes are tied without resolution", () => {
    const deadlockSession: NegotiationSession = {
      proposalId: "prop_003",
      consensusModel: "majority",
      eligibleAgentIds: ["agent_a", "agent_b"],
      votes: [
        {
          proposalId: "prop_003",
          agentId: "agent_a",
          vote: "approve",
          timestamp: "2026-08-01T14:00:00Z"
        },
        {
          proposalId: "prop_003",
          agentId: "agent_b",
          vote: "reject",
          timestamp: "2026-08-01T14:00:01Z"
        }
      ],
      status: "deadlocked"
    };

    const res = evaluator.evaluateConsensus(deadlockSession);
    expect(res.outcome).toBe("deadlocked");
    expect(res.metrics.deadlockDetected).toBe(true);
  });
});

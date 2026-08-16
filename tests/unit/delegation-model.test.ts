import { describe, it, expect } from "vitest";
import type { DelegationRecord } from "../../packages/semantiq/src/delegation-model.js";
import { DelegationEvaluator } from "../../packages/semantiq/src/delegation-model.js";

describe("Delegation and Responsibility Transfer (Prompt 9.4)", () => {
  const evaluator = new DelegationEvaluator();

  const record1: DelegationRecord = {
    delegation: {
      delegationId: "del_001",
      delegatorAgentId: "agent_leader",
      delegateeAgentId: "agent_worker",
      taskDescription: "Process sub-dataset B",
      delegatedAuthorityId: "auth_sub_10",
      issuedAt: "2026-08-01T14:00:00Z"
    },
    state: "accepted",
    accountableAgentId: "agent_worker",
    handoffEvidenceUri: "file:///tmp/handoff_001.json"
  };

  it("approves valid delegation record cleanly", () => {
    const violation = evaluator.registerDelegation(record1);
    expect(violation).toBeUndefined();
  });

  it("detects circular delegation attempt", () => {
    const circularRecord: DelegationRecord = {
      delegation: {
        delegationId: "del_002",
        delegatorAgentId: "agent_worker",
        delegateeAgentId: "agent_leader", // Circular back to leader
        taskDescription: "Re-delegate back to leader",
        delegatedAuthorityId: "auth_sub_11",
        issuedAt: "2026-08-01T14:01:00Z"
      },
      state: "accepted",
      accountableAgentId: "agent_leader",
      handoffEvidenceUri: "file:///tmp/handoff_002.json"
    };

    const violation = evaluator.registerDelegation(circularRecord);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe("circular_delegation");
  });

  it("detects incomplete handoff missing evidence URI", () => {
    const incompleteHandoffRecord: DelegationRecord = {
      delegation: {
        delegationId: "del_003",
        delegatorAgentId: "agent_leader",
        delegateeAgentId: "agent_subworker",
        taskDescription: "Task without handoff evidence",
        delegatedAuthorityId: "auth_sub_12",
        issuedAt: "2026-08-01T14:02:00Z"
      },
      state: "completed",
      accountableAgentId: "agent_subworker"
      // missing handoffEvidenceUri
    };

    const violation = evaluator.registerDelegation(incompleteHandoffRecord);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe("incomplete_handoff");
  });

  it("detects missing accountable actor ID", () => {
    const noAccountableRecord: DelegationRecord = {
      delegation: {
        delegationId: "del_004",
        delegatorAgentId: "agent_leader",
        delegateeAgentId: "agent_anonymous",
        taskDescription: "Unaccountable task",
        delegatedAuthorityId: "auth_sub_13",
        issuedAt: "2026-08-01T14:03:00Z"
      },
      state: "proposed",
      accountableAgentId: ""
    };

    const violation = evaluator.registerDelegation(noAccountableRecord);
    expect(violation).toBeDefined();
    expect(violation?.failureClass).toBe("failure_without_accountable_actor");
  });
});

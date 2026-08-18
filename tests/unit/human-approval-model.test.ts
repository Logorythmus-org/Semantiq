import { describe, it, expect } from "vitest";
import type {
  ApprovalDecision,
  ApprovalRequest
} from "../../packages/semantiq/src/human-approval-model.js";
import { HumanApprovalEngine } from "../../packages/semantiq/src/human-approval-model.js";

describe("Human Approval and Oversight Evidence (Prompt 10.3)", () => {
  const engine = new HumanApprovalEngine();

  const request: ApprovalRequest = {
    requestId: "req_101",
    targetAction: "deploy_to_prod",
    targetResource: "/prod/database",
    requestedByAgentId: "agent_lead",
    requestedAt: "2026-08-01T14:00:00Z",
    scope: {
      allowedActions: ["deploy_to_prod"],
      allowedResources: ["/prod/database"],
      maxUsageCount: 1
    }
  };

  const validDecision: ApprovalDecision = {
    decisionId: "dec_101",
    requestId: "req_101",
    approver: {
      approverId: "human_john",
      name: "John Doe",
      role: "DevOps Lead",
      authorityId: "auth_human_100"
    },
    outcome: "approved",
    decidedAt: "2026-08-01T14:05:00Z",
    expiresAt: "2026-08-01T15:00:00Z"
  };

  it("approves compliant human decision prior to action execution", () => {
    const res = engine.evaluateApproval(request, validDecision, "2026-08-01T14:10:00Z");
    expect(res.allowed).toBe(true);
    expect(res.failure).toBeUndefined();
  });

  it("detects action executed before approval (missing approval)", () => {
    const res = engine.evaluateApproval(request, undefined, "2026-08-01T14:00:00Z");
    expect(res.allowed).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe("action_before_approval");
  });

  it("detects post-hoc approval decision issued after action execution", () => {
    const postHocDecision: ApprovalDecision = {
      ...validDecision,
      decidedAt: "2026-08-01T14:30:00Z" // Decided at 14:30
    };
    const res = engine.evaluateApproval(request, postHocDecision, "2026-08-01T14:15:00Z"); // Action at 14:15
    expect(res.allowed).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe("post_hoc_approval");
  });

  it("detects unauthorized approver lacking authority reference", () => {
    const unauthDecision: ApprovalDecision = {
      ...validDecision,
      approver: {
        ...validDecision.approver,
        authorityId: "" // Missing authority reference
      }
    };
    const res = engine.evaluateApproval(request, unauthDecision, "2026-08-01T14:10:00Z");
    expect(res.allowed).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe("unauthorized_approver");
  });

  it("detects expired approval decision", () => {
    const expiredDecision: ApprovalDecision = {
      ...validDecision,
      expiresAt: "2026-08-01T14:08:00Z" // Expired at 14:08
    };
    const res = engine.evaluateApproval(request, expiredDecision, "2026-08-01T14:10:00Z"); // Action at 14:10
    expect(res.allowed).toBe(false);
    expect(res.failure).toBeDefined();
    expect(res.failure?.failureClass).toBe("expired_approval");
  });
});

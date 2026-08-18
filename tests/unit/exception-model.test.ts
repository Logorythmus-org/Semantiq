import { describe, it, expect } from "vitest";
import type {
  ExceptionDecision,
  ExceptionEvidence,
  ExceptionRequest,
  OverrideRecord,
  ExceptionReview
} from "../../packages/semantiq/src/exception-model.js";
import { ExceptionModelEngine } from "../../packages/semantiq/src/exception-model.js";

describe("Exception, Waiver, and Override Records (Prompt 10.16 / 10.4)", () => {
  const engine = new ExceptionModelEngine();

  const request: ExceptionRequest = {
    requestId: "req_exc_101",
    policyId: "pol_sec_01",
    requesterId: "user_agent_a",
    scope: {
      scopeId: "scope_1",
      targetComponent: "database_migration",
      allowedActions: ["bypass_lock"]
    },
    reason: {
      reasonCode: "emergency_patch",
      justification: "Critical zero-day patch application"
    },
    requestedAt: "2026-08-02T10:00:00Z"
  };

  const decision: ExceptionDecision = {
    decisionId: "dec_exc_101",
    requestId: "req_exc_101",
    authority: {
      authorityId: "auth_sec_lead",
      role: "security_lead",
      isAuthorized: true
    },
    state: "active",
    duration: {
      validFrom: "2026-08-02T10:00:00Z",
      validUntil: "2026-08-02T12:00:00Z",
      isPermanent: false
    },
    conditions: [{ conditionId: "cond_1", statement: "Audit log enabled", isFulfilled: true }],
    decidedAt: "2026-08-02T10:05:00Z"
  };

  const evidence: ExceptionEvidence = {
    evidenceId: "ev_exc_101",
    checksum: { uri: "file:///tmp/evidence.json", algorithm: "sha256", hash: "evhash123" },
    isVerified: true
  };

  it("approves compliant exception evaluation", () => {
    const report = engine.evaluateException(request, decision, evidence);
    expect(report).toBeUndefined();
  });

  it("detects exception without authority failure", () => {
    const unauthorizedDecision: ExceptionDecision = {
      ...decision,
      authority: { ...decision.authority, isAuthorized: false }
    };
    const report = engine.evaluateException(request, unauthorizedDecision, evidence);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("exception_without_authority");
  });

  it("detects exception without evidence failure", () => {
    const report = engine.evaluateException(request, decision, undefined);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("exception_without_evidence");
  });

  it("detects expired exception failure", () => {
    const expiredDecision: ExceptionDecision = {
      ...decision,
      state: "expired"
    };
    const report = engine.evaluateException(request, expiredDecision, evidence);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("expired_exception");
  });

  it("detects emergency override without post-incident review", () => {
    const override: OverrideRecord = {
      overrideId: "ovr_101",
      isEmergency: true,
      isDocumented: true,
      impact: { impactId: "imp_1", severity: "high", residualRiskLevel: "acceptable" },
      timestamp: "2026-08-02T10:10:00Z"
    };
    const report = engine.evaluateException(request, decision, evidence, override, undefined);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("override_without_review");
  });

  it("detects undocumented emergency action failure", () => {
    const undocumentedOverride: OverrideRecord = {
      overrideId: "ovr_102",
      isEmergency: true,
      isDocumented: false, // Undocumented emergency action
      impact: { impactId: "imp_2", severity: "high", residualRiskLevel: "acceptable" },
      timestamp: "2026-08-02T10:10:00Z"
    };
    const review: ExceptionReview = {
      reviewId: "rev_101",
      decisionId: "dec_exc_101",
      reviewerId: "auditor_1",
      isReviewed: true,
      reviewedAt: "2026-08-02T10:30:00Z"
    };
    const report = engine.evaluateException(
      request,
      decision,
      evidence,
      undocumentedOverride,
      review
    );
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("undocumented_emergency_action");
  });

  it("detects unresolved residual risk failure", () => {
    const riskyOverride: OverrideRecord = {
      overrideId: "ovr_103",
      isEmergency: true,
      isDocumented: true,
      impact: { impactId: "imp_3", severity: "critical", residualRiskLevel: "unresolved" },
      timestamp: "2026-08-02T10:10:00Z"
    };
    const review: ExceptionReview = {
      reviewId: "rev_102",
      decisionId: "dec_exc_101",
      reviewerId: "auditor_1",
      isReviewed: true,
      reviewedAt: "2026-08-02T10:30:00Z"
    };
    const report = engine.evaluateException(request, decision, evidence, riskyOverride, review);
    expect(report).toBeDefined();
    expect(report?.failureClass).toBe("unresolved_residual_risk");
  });
});

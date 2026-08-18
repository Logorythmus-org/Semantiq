import type { EvidenceChecksum } from "./event-schema.js";

export type ApprovalFailureClass =
  | "unauthorized_approver"
  | "action_before_approval"
  | "expired_approval"
  | "reused_approval"
  | "post_hoc_approval"
  | "missing_review_evidence"
  | "conflicting_approvals"
  | "human_override_without_justification";

export interface ApproverIdentity {
  readonly approverId: string;
  readonly name: string;
  readonly role: string;
  readonly authorityId: string;
}

export interface ApprovalScope {
  readonly allowedActions: readonly string[];
  readonly allowedResources: readonly string[];
  readonly maxUsageCount: number;
}

export interface ApprovalCondition {
  readonly conditionId: string;
  readonly statement: string;
  readonly isSatisfied: boolean;
}

export interface ReviewEvidence {
  readonly reviewId: string;
  readonly inspectorId: string;
  readonly checksum: EvidenceChecksum;
  readonly comments: string;
  readonly timestamp: string;
}

export interface ApprovalRequest {
  readonly requestId: string;
  readonly targetAction: string;
  readonly targetResource: string;
  readonly requestedByAgentId: string;
  readonly requestedAt: string;
  readonly scope: ApprovalScope;
}

export interface ApprovalDecision {
  readonly decisionId: string;
  readonly requestId: string;
  readonly approver: ApproverIdentity;
  readonly outcome: "approved" | "rejected" | "escalated";
  readonly decidedAt: string;
  readonly expiresAt?: string;
  readonly reviewEvidence?: ReviewEvidence;
  readonly overrideJustification?: string;
}

export interface InterventionRecord {
  readonly interventionId: string;
  readonly approverId: string;
  readonly targetRunId: string;
  readonly actionTaken: "pause" | "abort" | "modify_state";
  readonly timestamp: string;
}

export interface EscalationRecord {
  readonly escalationId: string;
  readonly sourceAgentId: string;
  readonly targetApproverRole: string;
  readonly reason: string;
  readonly timestamp: string;
}

export interface OversightOutcome {
  readonly outcomeId: string;
  readonly requestId: string;
  readonly isActionAllowed: boolean;
  readonly timestamp: string;
}

export interface ApprovalFailureReport {
  readonly reportId: string;
  readonly failureClass: ApprovalFailureClass;
  readonly requestId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Human Approval & Oversight Engine.
 * Evaluates human approval checkpoints, approver authority, expiration, and post-hoc bypasses.
 */
export class HumanApprovalEngine {
  private readonly usedDecisions = new Map<string, number>(); // decisionId -> usage count

  evaluateApproval(
    request: ApprovalRequest,
    decision: ApprovalDecision | undefined,
    actionExecutedAt: string
  ): { allowed: boolean; failure?: ApprovalFailureReport } {
    // 1. Action Before Approval / Missing Approval
    if (!decision) {
      return {
        allowed: false,
        failure: {
          reportId: `fail_no_app_${request.requestId}`,
          failureClass: "action_before_approval",
          requestId: request.requestId,
          description: `Action '${request.targetAction}' executed at '${actionExecutedAt}' without prior human approval decision.`,
          timestamp: actionExecutedAt
        }
      };
    }

    // 2. Post-Hoc Approval Check
    if (new Date(decision.decidedAt) > new Date(actionExecutedAt)) {
      return {
        allowed: false,
        failure: {
          reportId: `fail_post_hoc_${request.requestId}`,
          failureClass: "post_hoc_approval",
          requestId: request.requestId,
          description: `Approval decision issued at '${decision.decidedAt}' AFTER action was executed at '${actionExecutedAt}'.`,
          timestamp: actionExecutedAt
        }
      };
    }

    // 3. Unauthorized Approver Check
    if (!decision.approver.authorityId || decision.approver.authorityId.trim() === "") {
      return {
        allowed: false,
        failure: {
          reportId: `fail_unauth_${request.requestId}`,
          failureClass: "unauthorized_approver",
          requestId: request.requestId,
          description: `Approver '${decision.approver.approverId}' lacks valid authority reference.`,
          timestamp: decision.decidedAt
        }
      };
    }

    // 4. Expired Approval Check
    if (decision.expiresAt && new Date(actionExecutedAt) > new Date(decision.expiresAt)) {
      return {
        allowed: false,
        failure: {
          reportId: `fail_exp_${request.requestId}`,
          failureClass: "expired_approval",
          requestId: request.requestId,
          description: `Approval decision expired at '${decision.expiresAt}' prior to action execution at '${actionExecutedAt}'.`,
          timestamp: actionExecutedAt
        }
      };
    }

    // 5. Reused Approval Check
    const currentUsage = this.usedDecisions.get(decision.decisionId) ?? 0;
    if (currentUsage >= request.scope.maxUsageCount) {
      return {
        allowed: false,
        failure: {
          reportId: `fail_reuse_${request.requestId}`,
          failureClass: "reused_approval",
          requestId: request.requestId,
          description: `Approval decision '${decision.decisionId}' exceeded max usage count of ${request.scope.maxUsageCount}.`,
          timestamp: actionExecutedAt
        }
      };
    }

    // Record clean usage
    this.usedDecisions.set(decision.decisionId, currentUsage + 1);

    return {
      allowed: decision.outcome === "approved"
    };
  }
}

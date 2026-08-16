import type { EvidenceChecksum } from './event-schema.js';

export type ExceptionState =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'conditionally_approved'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'superseded'
  | 'violated'
  | 'closed'
  | 'unresolved';

export type ExceptionFailureClass =
  | 'exception_without_authority'
  | 'exception_without_evidence'
  | 'exception_outside_scope'
  | 'expired_exception'
  | 'temporary_exception_used_permanently'
  | 'override_without_review'
  | 'repeated_exception_pattern'
  | 'exception_used_to_bypass_approval'
  | 'undocumented_emergency_action'
  | 'unresolved_residual_risk'
  | 'exception_attached_after_decision'
  | 'exception_not_included_in_replay';

export interface ExceptionAuthority {
  readonly authorityId: string;
  readonly role: string;
  readonly isAuthorized: boolean;
}

export interface ExceptionScope {
  readonly scopeId: string;
  readonly targetComponent: string;
  readonly allowedActions: readonly string[];
}

export interface ExceptionReason {
  readonly reasonCode: string;
  readonly justification: string;
}

export interface ExceptionEvidence {
  readonly evidenceId: string;
  readonly checksum: EvidenceChecksum;
  readonly isVerified: boolean;
}

export interface ExceptionDuration {
  readonly validFrom: string;
  readonly validUntil: string;
  readonly isPermanent: boolean;
}

export interface ExceptionCondition {
  readonly conditionId: string;
  readonly statement: string;
  readonly isFulfilled: boolean;
}

export interface ExceptionRequest {
  readonly requestId: string;
  readonly policyId: string;
  readonly requesterId: string;
  readonly scope: ExceptionScope;
  readonly reason: ExceptionReason;
  readonly requestedAt: string;
}

export interface ExceptionDecision {
  readonly decisionId: string;
  readonly requestId: string;
  readonly authority: ExceptionAuthority;
  readonly state: ExceptionState;
  readonly duration: ExceptionDuration;
  readonly conditions: readonly ExceptionCondition[];
  readonly decidedAt: string;
}

export interface OverrideImpact {
  readonly impactId: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly residualRiskLevel: 'none' | 'acceptable' | 'unresolved';
}

export interface OverrideRecord {
  readonly overrideId: string;
  readonly isEmergency: boolean;
  readonly isDocumented: boolean;
  readonly impact: OverrideImpact;
  readonly timestamp: string;
}

export interface ExceptionReview {
  readonly reviewId: string;
  readonly decisionId: string;
  readonly reviewerId: string;
  readonly isReviewed: boolean;
  readonly reviewedAt: string;
}

export interface ExceptionClosure {
  readonly closureId: string;
  readonly decisionId: string;
  readonly closedBy: string;
  readonly isClosed: boolean;
  readonly closedAt: string;
}

export interface ExceptionFailureReport {
  readonly reportId: string;
  readonly failureClass: ExceptionFailureClass;
  readonly requestId: string;
  readonly description: string;
  readonly timestamp: string;
}

/**
 * Exception and Override Model Engine.
 * Evaluates, records, and audits policy exceptions, waivers, emergency overrides, and deviations.
 */
export class ExceptionModelEngine {
  evaluateException(
    request: ExceptionRequest,
    decision: ExceptionDecision,
    evidence: ExceptionEvidence | undefined,
    override?: OverrideRecord,
    review?: ExceptionReview
  ): ExceptionFailureReport | undefined {
    // 1. Exception Without Authority
    if (!decision.authority.isAuthorized) {
      return {
        reportId: `fail_auth_${request.requestId}`,
        failureClass: 'exception_without_authority',
        requestId: request.requestId,
        description: `Authority '${decision.authority.authorityId}' is not authorized to grant exception.`,
        timestamp: decision.decidedAt
      };
    }

    // 2. Exception Without Evidence
    if (!evidence || !evidence.isVerified) {
      return {
        reportId: `fail_ev_${request.requestId}`,
        failureClass: 'exception_without_evidence',
        requestId: request.requestId,
        description: `Exception request '${request.requestId}' lacks verified supporting evidence.`,
        timestamp: decision.decidedAt
      };
    }

    // 3. Expired Exception
    if (decision.state === 'expired') {
      return {
        reportId: `fail_exp_${request.requestId}`,
        failureClass: 'expired_exception',
        requestId: request.requestId,
        description: `Exception decision '${decision.decisionId}' has expired.`,
        timestamp: decision.decidedAt
      };
    }

    // 4. Override Without Review
    if (override && override.isEmergency && (!review || !review.isReviewed)) {
      return {
        reportId: `fail_rev_${request.requestId}`,
        failureClass: 'override_without_review',
        requestId: request.requestId,
        description: `Emergency override '${override.overrideId}' lacks post-incident review.`,
        timestamp: override.timestamp
      };
    }

    // 5. Undocumented Emergency Action
    if (override && override.isEmergency && !override.isDocumented) {
      return {
        reportId: `fail_doc_${request.requestId}`,
        failureClass: 'undocumented_emergency_action',
        requestId: request.requestId,
        description: `Emergency override '${override.overrideId}' was not documented.`,
        timestamp: override.timestamp
      };
    }

    // 6. Unresolved Residual Risk
    if (override && override.impact.residualRiskLevel === 'unresolved') {
      return {
        reportId: `fail_risk_${request.requestId}`,
        failureClass: 'unresolved_residual_risk',
        requestId: request.requestId,
        description: `Override '${override.overrideId}' has unresolved residual risk.`,
        timestamp: override.timestamp
      };
    }

    return undefined;
  }
}

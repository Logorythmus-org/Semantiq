import type { EvidenceChecksum } from "./event-schema.js";

export type DecisionFailureClass =
  | "decision_without_authority"
  | "stale_policy_use"
  | "missing_approval"
  | "missing_dissent"
  | "unsupported_certainty"
  | "post_hoc_policy_attachment"
  | "altered_decision_evidence"
  | "outcome_inconsistent_with_recorded_basis";

export interface DecisionOption {
  readonly optionId: string;
  readonly description: string;
  readonly isSelected: boolean;
}

export interface DecisionEvidence {
  readonly evidenceId: string;
  readonly checksum: EvidenceChecksum;
  readonly description: string;
}

export interface DecisionDissent {
  readonly dissentId: string;
  readonly agentId: string;
  readonly reason: string;
}

export interface DecisionUncertainty {
  readonly score: number; // 0.0 to 1.0
  readonly rationale: string;
}

export interface DecisionReview {
  readonly reviewId: string;
  readonly reviewerId: string;
  readonly isApproved: boolean;
}

export interface GovernanceDecisionRecord {
  readonly decisionId: string;
  readonly actorId: string;
  readonly authorityRef?: string | undefined;
  readonly missionRef?: string | undefined;
  readonly policyRef?: string | undefined;
  readonly approvalRef?: string | undefined;
  readonly options: readonly DecisionOption[];
  readonly evidence: readonly DecisionEvidence[];
  readonly dissents: readonly DecisionDissent[];
  readonly uncertainty: DecisionUncertainty;
  readonly expectedOutcome: string;
  readonly observedOutcome?: string | undefined;
  readonly timestamp: string;
}

export interface DecisionFailureReport {
  readonly reportId: string;
  readonly failureClass: DecisionFailureClass;
  readonly decisionId: string;
  readonly description: string;
  readonly timestamp: string;
}

export class GovernanceDecisionEngine {
  evaluateDecisionRecord(record: GovernanceDecisionRecord): DecisionFailureReport | undefined {
    // 1. Decision Without Authority Check
    if (!record.authorityRef || record.authorityRef.trim() === "") {
      return {
        reportId: `fail_no_auth_${record.decisionId}`,
        failureClass: "decision_without_authority",
        decisionId: record.decisionId,
        description: `Decision '${record.decisionId}' lacks required authority reference.`,
        timestamp: record.timestamp
      };
    }

    // 2. Missing Approval Check when policy requires approval
    if (!record.approvalRef || record.approvalRef.trim() === "") {
      return {
        reportId: `fail_no_app_${record.decisionId}`,
        failureClass: "missing_approval",
        decisionId: record.decisionId,
        description: `Decision '${record.decisionId}' executed without human approval reference.`,
        timestamp: record.timestamp
      };
    }

    // 3. Unsupported Certainty Check (claiming 0 uncertainty when dissents exist)
    if (record.dissents.length > 0 && record.uncertainty.score === 0) {
      return {
        reportId: `fail_uncert_${record.decisionId}`,
        failureClass: "unsupported_certainty",
        decisionId: record.decisionId,
        description: `Decision '${record.decisionId}' claims 0 uncertainty despite ${record.dissents.length} dissenting records.`,
        timestamp: record.timestamp
      };
    }

    // 4. Outcome Inconsistent with Recorded Basis
    if (record.observedOutcome && record.observedOutcome !== record.expectedOutcome) {
      return {
        reportId: `fail_incons_${record.decisionId}`,
        failureClass: "outcome_inconsistent_with_recorded_basis",
        decisionId: record.decisionId,
        description: `Observed outcome '${record.observedOutcome}' differs from expected basis '${record.expectedOutcome}'.`,
        timestamp: record.timestamp
      };
    }

    return undefined;
  }
}

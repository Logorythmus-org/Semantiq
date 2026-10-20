/**
 * @package @semantiq/evidence
 * Claim Reconciliation, Evidence Watch, and Review Queue Types
 */

import type { EvidenceGovernanceVerdict } from "../governance-policy/types.js";

export const EPISTEMIC_WATCH_DISCLAIMER =
  "Evidence watch generates proposals only. Active claims cannot be automatically mutated.";

export type ReconciliationAction =
  | "no_change"
  | "refresh"
  | "revise"
  | "downgrade"
  | "supersede"
  | "retract";

export type ReconciliationSeverity = "low" | "medium" | "high" | "critical";

export interface EvidenceStateSnapshot {
  readonly targetId: string;
  readonly runIds: readonly string[];
  readonly observationCount: number;
  readonly meanMetricScore: number;
  readonly latestGovernanceVerdict: EvidenceGovernanceVerdict;
  readonly negativeControlFailures: number;
  readonly snapshotDigest: string;
  readonly capturedAt: string;
}

export interface EvidenceDiff {
  readonly runCountDelta: number;
  readonly metricDelta: number;
  readonly governanceShift?:
    | {
        readonly from: EvidenceGovernanceVerdict;
        readonly to: EvidenceGovernanceVerdict;
      }
    | undefined;
  readonly newCounterevidenceCount: number;
  readonly negativeControlFailuresDelta: number;
}

export interface ClaimReconciliationProposal {
  readonly proposalId: string;
  readonly claimId: string;
  readonly claimFamilyId: string;
  readonly action: ReconciliationAction;
  readonly severity: ReconciliationSeverity;
  readonly rationale: string;
  readonly evidenceDiff: EvidenceDiff;
  readonly proposedStatementUpdate?: string | undefined;
  readonly isStaleReview: boolean;
  readonly createdAt: string;
}

export type QueueItemStatus = "pending_human_review" | "applied" | "dismissed";

export interface ClaimReconciliationQueueItem {
  readonly queueId: string;
  readonly proposal: ClaimReconciliationProposal;
  readonly status: QueueItemStatus;
  readonly reviewedBy?: string | undefined;
  readonly reviewedAt?: string | undefined;
  readonly resolutionNotes?: string | undefined;
}

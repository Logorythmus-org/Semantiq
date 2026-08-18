/**
 * @package @semantiq/evidence
 * Persistent Research Workbench, Review Queue, and Append-Only Audit Types
 */

export const EPISTEMIC_WORKBENCH_DISCLAIMER =
  "Review decisions may create drafts but must not silently replace the active claim.";

export type WorkbenchItemStatus =
  | "needs_review"
  | "in_review"
  | "resolved"
  | "dismissed";

export type WorkbenchItemPriority = "low" | "medium" | "high" | "critical";

export type WorkbenchItemType =
  | "claim_reconciliation"
  | "pattern_candidate"
  | "negative_control_breach"
  | "manual_investigation";

export interface WorkbenchComment {
  readonly id: string;
  readonly reviewerId: string;
  readonly content: string;
  readonly timestamp: string;
}

export interface WorkbenchResolution {
  readonly decision: "approved_draft" | "retracted_claim" | "dismissed" | "no_action";
  readonly reviewerId: string;
  readonly notes: string;
  readonly resolvedAt: string;
  readonly createdDraftId?: string | undefined;
}

export interface WorkbenchQueueItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly itemType: WorkbenchItemType;
  readonly targetId: string; // e.g. claimId or candidateId
  readonly status: WorkbenchItemStatus;
  readonly priority: WorkbenchItemPriority;
  readonly assignedReviewerId?: string | undefined;
  readonly comments: readonly WorkbenchComment[];
  readonly resolution?: WorkbenchResolution | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkbenchAuditEntry {
  readonly sequenceNumber: number;
  readonly action: string;
  readonly itemId: string;
  readonly actorId: string;
  readonly payloadDigest: string;
  readonly prevHash: string;
  readonly hash: string;
  readonly timestamp: string;
}

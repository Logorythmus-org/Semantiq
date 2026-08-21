/**
 * @package @semantiq/evidence
 * Evidence Watch & Proposal-Only Claim Reconciliation Engine
 *
 * Invariants:
 * 1. No automatic active-claim mutation.
 * 2. All reconciliations are generated as proposals in a review queue.
 * 3. Exact dependency tracking and severity heuristics.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type { ClaimRegistryEngine } from "../claim-registry/claim-registry-engine.js";
import type { GovernedEvidenceClaim } from "../claim-registry/types.js";
import { ClaimDependencyIndex } from "./claim-dependency-index.js";
import { EvidenceChangeDetector } from "./evidence-change-detector.js";
import {
  type ClaimReconciliationProposal,
  type ClaimReconciliationQueueItem,
  type EvidenceDiff,
  type EvidenceStateSnapshot,
  type ReconciliationAction,
  type ReconciliationSeverity
} from "./types.js";

export interface ReconcileOptions {
  readonly maxReviewAgeDays?: number | undefined; // default 90 days
  readonly newCounterevidenceCount?: number | undefined;
}

export class EvidenceWatchEngine {
  public readonly dependencyIndex = new ClaimDependencyIndex();
  private readonly changeDetector = new EvidenceChangeDetector();
  private readonly queue = new Map<string, ClaimReconciliationQueueItem>();

  constructor(private readonly claimRegistry: ClaimRegistryEngine) {}

  /**
   * Captures an immutable snapshot of current evidence state.
   */
  public captureSnapshot(
    targetId: string,
    state: Omit<EvidenceStateSnapshot, "snapshotDigest" | "capturedAt">
  ): EvidenceStateSnapshot {
    const raw = `${state.targetId}:${state.runIds.join(",")}:${state.observationCount}:${state.meanMetricScore}:${state.latestGovernanceVerdict}:${state.negativeControlFailures}`;
    const snapshotDigest = computeSha256(raw);

    const snapshot: EvidenceStateSnapshot = {
      ...state,
      snapshotDigest,
      capturedAt: new Date().toISOString()
    };

    return Object.freeze(snapshot);
  }

  /**
   * Generates a proposal-only reconciliation for a governed claim.
   * INVARIANT: No automatic active-claim mutation.
   */
  public reconcileClaim(
    claim: GovernedEvidenceClaim,
    baseline: EvidenceStateSnapshot,
    current: EvidenceStateSnapshot,
    options: ReconcileOptions = {}
  ): ClaimReconciliationProposal {
    const diff = this.changeDetector.detectChanges(
      baseline,
      current,
      options.newCounterevidenceCount ?? 0
    );

    // Stale Review Check
    const maxAgeMs = (options.maxReviewAgeDays ?? 90) * 24 * 60 * 60 * 1000;
    const lastReviewedTime =
      claim.reviews.length > 0
        ? new Date(claim.reviews[claim.reviews.length - 1]!.reviewedAt).getTime()
        : new Date(claim.createdAt).getTime();
    const isStaleReview = Date.now() - lastReviewedTime > maxAgeMs;

    // Determine Action & Severity
    const { action, severity, rationale, proposedStatementUpdate } =
      this.determineReconciliationAction(claim, diff, isStaleReview);

    const proposalId = `prop_${computeSha256(`${claim.id}:${action}:${severity}:${Date.now()}`).substring(0, 16)}`;

    const proposal: ClaimReconciliationProposal = {
      proposalId,
      claimId: claim.id,
      claimFamilyId: claim.claimFamilyId,
      action,
      severity,
      rationale,
      evidenceDiff: diff,
      proposedStatementUpdate,
      isStaleReview,
      createdAt: new Date().toISOString()
    };

    return Object.freeze(proposal);
  }

  /**
   * Enqueues a reconciliation proposal for human review.
   */
  public enqueueProposal(proposal: ClaimReconciliationProposal): ClaimReconciliationQueueItem {
    const queueId = `queue_${proposal.proposalId}`;
    const item: ClaimReconciliationQueueItem = {
      queueId,
      proposal,
      status: "pending_human_review"
    };

    const frozen = Object.freeze(item);
    this.queue.set(queueId, frozen);
    return frozen;
  }

  /**
   * Applies an approved reconciliation proposal to the claim registry upon human decision.
   * (Human-in-the-loop application gate).
   */
  public applyProposal(
    queueId: string,
    reviewerId: string,
    resolutionNotes: string
  ): { queueItem: ClaimReconciliationQueueItem; updatedClaim?: GovernedEvidenceClaim | undefined } {
    const item = this.queue.get(queueId);
    if (!item) {
      throw new Error(`Queue item not found: ${queueId}`);
    }

    if (item.status !== "pending_human_review") {
      throw new Error(`Cannot apply queue item in '${item.status}' state.`);
    }

    let updatedClaim: GovernedEvidenceClaim | undefined;
    const proposal = item.proposal;

    switch (proposal.action) {
      case "retract":
        updatedClaim = this.claimRegistry.retractClaim(
          proposal.claimId,
          `Applied reconciliation proposal ${proposal.proposalId}: ${proposal.rationale}`
        );
        break;
      case "no_change":
      case "refresh":
      case "revise":
      case "downgrade":
      case "supersede":
        // Proposals requiring text revisions or new claim drafting are handled via standard drafting
        break;
    }

    const resolvedItem: ClaimReconciliationQueueItem = {
      ...item,
      status: "applied",
      reviewedBy: reviewerId,
      reviewedAt: new Date().toISOString(),
      resolutionNotes
    };

    const frozen = Object.freeze(resolvedItem);
    this.queue.set(queueId, frozen);

    return { queueItem: frozen, updatedClaim };
  }

  public getQueueItem(queueId: string): ClaimReconciliationQueueItem | undefined {
    return this.queue.get(queueId);
  }

  public listPendingQueueItems(): readonly ClaimReconciliationQueueItem[] {
    return Array.from(this.queue.values()).filter((i) => i.status === "pending_human_review");
  }

  private determineReconciliationAction(
    claim: GovernedEvidenceClaim,
    diff: EvidenceDiff,
    isStale: boolean
  ): {
    action: ReconciliationAction;
    severity: ReconciliationSeverity;
    rationale: string;
    proposedStatementUpdate?: string | undefined;
  } {
    // 1. Critical: Negative controls failed or counterevidence detected -> Retract / Downgrade
    if (diff.negativeControlFailuresDelta > 0 || diff.newCounterevidenceCount > 0) {
      return {
        action: "retract",
        severity: "critical",
        rationale: `Critical: ${diff.newCounterevidenceCount} new counterevidence observations or ${diff.negativeControlFailuresDelta} negative control failures detected.`
      };
    }

    // 2. High: Governance verdict shifted to downgrade or insufficient
    if (diff.governanceShift?.to === "downgrade" || diff.governanceShift?.to === "insufficient") {
      return {
        action: "downgrade",
        severity: "high",
        rationale: `High: Governance policy verdict dropped from '${diff.governanceShift.from}' to '${diff.governanceShift.to}'.`
      };
    }

    // 3. Medium: Significant metric delta (|delta| >= 0.05) or Governance shifted to hold
    if (Math.abs(diff.metricDelta) >= 0.05) {
      return {
        action: "revise",
        severity: "medium",
        rationale: `Medium: Metric effect size shifted by ${diff.metricDelta}. Proposing claim revision.`,
        proposedStatementUpdate: `[Updated Effect Estimate] Effect shift delta: ${diff.metricDelta}`
      };
    }

    // 4. Low: Fresh runs added (reinforcing) or stale review
    if (diff.runCountDelta > 0 || isStale) {
      return {
        action: isStale ? "refresh" : "refresh",
        severity: "low",
        rationale: isStale
          ? "Low: Periodic evidence review is stale."
          : `Low: ${diff.runCountDelta} new corroborating runs recorded.`
      };
    }

    // 5. No Change
    return {
      action: "no_change",
      severity: "low",
      rationale: "Evidence state matches baseline. No modifications required."
    };
  }
}

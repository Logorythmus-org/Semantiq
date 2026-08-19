/**
 * @package @semantiq/evidence
 * Persistent Research Workbench Engine
 *
 * Invariants:
 * 1. Review decisions may create drafts but must not silently replace the active claim.
 * 2. All queue state changes and reviewer interactions are logged in an append-only hash chain.
 * 3. Status lifecycle: needs_review -> in_review -> (resolved | dismissed).
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type {
  ClaimRegistryEngine,
  DraftClaimOptions
} from "../claim-registry/claim-registry-engine.js";
import type { GovernedEvidenceClaim } from "../claim-registry/types.js";
import type {
  WorkbenchComment,
  WorkbenchItemPriority,
  WorkbenchItemStatus,
  WorkbenchItemType,
  WorkbenchQueueItem,
  WorkbenchResolution
} from "./types.js";
import { WorkbenchAuditLogEngine } from "./workbench-audit-log.js";

export interface EnqueueItemOptions {
  readonly title: string;
  readonly description: string;
  readonly itemType: WorkbenchItemType;
  readonly targetId: string;
  readonly priority?: WorkbenchItemPriority | undefined;
  readonly actorId: string;
}

export class ResearchWorkbenchEngine {
  public readonly auditLog = new WorkbenchAuditLogEngine();
  private readonly items = new Map<string, WorkbenchQueueItem>();

  constructor(private readonly claimRegistry: ClaimRegistryEngine) {}

  /**
   * Enqueues an evidence or claim review item to 'needs_review'.
   */
  public enqueueItem(options: EnqueueItemOptions): WorkbenchQueueItem {
    const id = `item_${computeSha256(`${options.itemType}:${options.targetId}:${Date.now()}`).substring(0, 16)}`;
    const timestamp = new Date().toISOString();

    const item: WorkbenchQueueItem = {
      id,
      title: options.title,
      description: options.description,
      itemType: options.itemType,
      targetId: options.targetId,
      status: "needs_review",
      priority: options.priority ?? "medium",
      comments: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const frozen = Object.freeze(item);
    this.items.set(id, frozen);

    this.auditLog.recordEvent("ENQUEUE_ITEM", id, options.actorId, {
      title: options.title,
      itemType: options.itemType,
      targetId: options.targetId
    });

    return frozen;
  }

  /**
   * Assigns a reviewer, transitioning status to 'in_review'.
   */
  public assignReviewer(itemId: string, reviewerId: string, actorId: string): WorkbenchQueueItem {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Workbench item not found: ${itemId}`);
    }

    const updated: WorkbenchQueueItem = {
      ...item,
      assignedReviewerId: reviewerId,
      status: "in_review",
      updatedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(updated);
    this.items.set(itemId, frozen);

    this.auditLog.recordEvent("ASSIGN_REVIEWER", itemId, actorId, {
      reviewerId,
      previousReviewer: item.assignedReviewerId
    });

    return frozen;
  }

  /**
   * Adds a reviewer comment to a workbench item.
   */
  public addComment(itemId: string, reviewerId: string, content: string): WorkbenchQueueItem {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Workbench item not found: ${itemId}`);
    }

    const comment: WorkbenchComment = {
      id: `comm_${computeSha256(`${itemId}:${reviewerId}:${Date.now()}`).substring(0, 16)}`,
      reviewerId,
      content,
      timestamp: new Date().toISOString()
    };

    const updated: WorkbenchQueueItem = {
      ...item,
      comments: Object.freeze([...item.comments, comment]),
      updatedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(updated);
    this.items.set(itemId, frozen);

    this.auditLog.recordEvent("ADD_COMMENT", itemId, reviewerId, {
      commentId: comment.id,
      content
    });

    return frozen;
  }

  /**
   * Creates a reviewed draft in the claim registry as part of a review investigation.
   * INVARIANT: Review decisions may create drafts but must not silently replace the active claim.
   */
  public createReviewedDraft(
    itemId: string,
    reviewerId: string,
    draftOptions: DraftClaimOptions
  ): { item: WorkbenchQueueItem; createdDraft: GovernedEvidenceClaim } {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Workbench item not found: ${itemId}`);
    }

    // Create draft in claim registry (status will be 'draft')
    const createdDraft = this.claimRegistry.draftClaim(draftOptions);

    const resolution: WorkbenchResolution = {
      decision: "approved_draft",
      reviewerId,
      notes: `Created reviewed draft ${createdDraft.id} for formal peer-review release gate.`,
      resolvedAt: new Date().toISOString(),
      createdDraftId: createdDraft.id
    };

    const updated: WorkbenchQueueItem = {
      ...item,
      status: "resolved",
      resolution,
      updatedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(updated);
    this.items.set(itemId, frozen);

    this.auditLog.recordEvent("CREATE_REVIEWED_DRAFT", itemId, reviewerId, {
      createdDraftId: createdDraft.id,
      version: createdDraft.version
    });

    return { item: frozen, createdDraft };
  }

  /**
   * Resolves a workbench item.
   */
  public resolveItem(
    itemId: string,
    reviewerId: string,
    resolution: Omit<WorkbenchResolution, "reviewerId" | "resolvedAt">
  ): WorkbenchQueueItem {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Workbench item not found: ${itemId}`);
    }

    const fullResolution: WorkbenchResolution = {
      ...resolution,
      reviewerId,
      resolvedAt: new Date().toISOString()
    };

    const updated: WorkbenchQueueItem = {
      ...item,
      status: "resolved",
      resolution: fullResolution,
      updatedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(updated);
    this.items.set(itemId, frozen);

    this.auditLog.recordEvent("RESOLVE_ITEM", itemId, reviewerId, {
      decision: fullResolution.decision,
      notes: fullResolution.notes
    });

    return frozen;
  }

  /**
   * Dismisses a workbench item without action.
   */
  public dismissItem(itemId: string, reviewerId: string, notes: string): WorkbenchQueueItem {
    const item = this.items.get(itemId);
    if (!item) {
      throw new Error(`Workbench item not found: ${itemId}`);
    }

    const resolution: WorkbenchResolution = {
      decision: "dismissed",
      reviewerId,
      notes,
      resolvedAt: new Date().toISOString()
    };

    const updated: WorkbenchQueueItem = {
      ...item,
      status: "dismissed",
      resolution,
      updatedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(updated);
    this.items.set(itemId, frozen);

    this.auditLog.recordEvent("DISMISS_ITEM", itemId, reviewerId, { notes });

    return frozen;
  }

  public getItem(itemId: string): WorkbenchQueueItem | undefined {
    return this.items.get(itemId);
  }

  public listItemsByStatus(status: WorkbenchItemStatus): readonly WorkbenchQueueItem[] {
    return Array.from(this.items.values()).filter((i) => i.status === status);
  }

  public listAllItems(): readonly WorkbenchQueueItem[] {
    return Array.from(this.items.values());
  }
}

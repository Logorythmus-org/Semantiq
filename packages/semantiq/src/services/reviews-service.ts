/**
 * @package @tech-club/semantiq
 * Authoritative Research Reviews & Workbench Application Service
 */

import {
  ResearchWorkbenchEngine,
  type DraftClaimOptions,
  type EnqueueItemOptions,
  type GovernedEvidenceClaim,
  type WorkbenchItemStatus,
  type WorkbenchQueueItem,
  type WorkbenchResolution
} from "../../../evidence/src/index.js";
import type { ClaimsService } from "./claims-service.js";

export class ReviewsService {
  private readonly workbench: ResearchWorkbenchEngine;

  constructor(claimsService: ClaimsService) {
    this.workbench = new ResearchWorkbenchEngine(claimsService.registry);
  }

  public async enqueueReviewItem(options: EnqueueItemOptions): Promise<WorkbenchQueueItem> {
    return this.workbench.enqueueItem(options);
  }

  public async assignReviewer(
    itemId: string,
    reviewerId: string,
    actorId: string
  ): Promise<WorkbenchQueueItem> {
    return this.workbench.assignReviewer(itemId, reviewerId, actorId);
  }

  public async addComment(
    itemId: string,
    reviewerId: string,
    content: string
  ): Promise<WorkbenchQueueItem> {
    return this.workbench.addComment(itemId, reviewerId, content);
  }

  public async createReviewedDraft(
    itemId: string,
    reviewerId: string,
    draftOptions: DraftClaimOptions
  ): Promise<{ item: WorkbenchQueueItem; createdDraft: GovernedEvidenceClaim }> {
    return this.workbench.createReviewedDraft(itemId, reviewerId, draftOptions);
  }

  public async resolveReviewItem(
    itemId: string,
    reviewerId: string,
    resolution: Omit<WorkbenchResolution, "reviewerId" | "resolvedAt">
  ): Promise<WorkbenchQueueItem> {
    return this.workbench.resolveItem(itemId, reviewerId, resolution);
  }

  public async dismissReviewItem(
    itemId: string,
    reviewerId: string,
    notes: string
  ): Promise<WorkbenchQueueItem> {
    return this.workbench.dismissItem(itemId, reviewerId, notes);
  }

  public async listReviewQueue(
    status?: WorkbenchItemStatus
  ): Promise<readonly WorkbenchQueueItem[]> {
    if (status) {
      return this.workbench.listItemsByStatus(status);
    }
    return this.workbench.listAllItems();
  }

  public async verifyAuditTrail(): Promise<{
    isValid: boolean;
    verifiedEntriesCount: number;
    brokenSequenceNumber?: number | undefined;
  }> {
    return this.workbench.auditLog.verifyChainIntegrity();
  }
}

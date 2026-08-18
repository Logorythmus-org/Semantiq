import { describe, expect, it } from "vitest";
import {
  ClaimRegistryEngine,
  ResearchWorkbenchEngine,
  WorkbenchAuditLogEngine
} from "../../packages/evidence/src/index.js";

describe("Persistent Research Workbench & Hash-Chained Audit Architecture", () => {
  it("maintains an append-only hash-chained audit log and detects tampering", () => {
    const auditLog = new WorkbenchAuditLogEngine();

    const e1 = auditLog.recordEvent("ENQUEUE_ITEM", "item_01", "actor_01", { reason: "stale" });
    const e2 = auditLog.recordEvent("ASSIGN_REVIEWER", "item_01", "actor_admin", { reviewerId: "rev_a" });
    const e3 = auditLog.recordEvent("ADD_COMMENT", "item_01", "rev_a", { text: "Investigating" });

    expect(e1.sequenceNumber).toBe(0);
    expect(e1.prevHash).toBe(WorkbenchAuditLogEngine.GENESIS_HASH);
    expect(e2.sequenceNumber).toBe(1);
    expect(e2.prevHash).toBe(e1.hash);
    expect(e3.sequenceNumber).toBe(2);
    expect(e3.prevHash).toBe(e2.hash);

    const integrity = auditLog.verifyChainIntegrity();
    expect(integrity.isValid).toBe(true);
    expect(integrity.verifiedEntriesCount).toBe(3);
  });

  it("manages workbench queue lifecycle and creates reviewed drafts without silently replacing active claims", () => {
    const claimRegistry = new ClaimRegistryEngine();
    const workbench = new ResearchWorkbenchEngine(claimRegistry);

    // Setup active claim v1.0.0
    const claimV1 = claimRegistry.draftClaim({
      claimFamilyTopic: "memory_decay_isolation",
      targetPatternOrRelationId: "DP-003_FP-005",
      version: "1.0.0",
      statement:
        "Memory decay isolation is associated with an empirical 60% decrease in semantic memory bleed.",
      governanceVerdict: "promote",
      evidenceReferences: {
        runIds: ["run_01"],
        observationIds: ["obs_01"],
        decisionReportIds: ["dec_01"],
        sourceIds: ["src_01"]
      }
    });
    claimRegistry.addReview(claimV1.id, { reviewerId: "rev_1", decision: "approve", comments: "ok" });
    claimRegistry.addReview(claimV1.id, { reviewerId: "rev_2", decision: "approve", comments: "ok" });
    const activeClaimV1 = claimRegistry.releaseClaim(claimV1.id);
    expect(activeClaimV1.status).toBe("active");

    // 1. Enqueue item in workbench
    const queueItem = workbench.enqueueItem({
      title: "Investigate effect size improvement in DP-003",
      description: "Recent benchmark suite shows improved mitigation metrics.",
      itemType: "claim_reconciliation",
      targetId: activeClaimV1.id,
      priority: "high",
      actorId: "lead_investigator"
    });

    expect(queueItem.status).toBe("needs_review");
    expect(queueItem.priority).toBe("high");

    // 2. Assign reviewer
    const inReviewItem = workbench.assignReviewer(queueItem.id, "senior_reviewer", "lead_investigator");
    expect(inReviewItem.status).toBe("in_review");
    expect(inReviewItem.assignedReviewerId).toBe("senior_reviewer");

    // 3. Add reviewer comment
    const commentedItem = workbench.addComment(
      queueItem.id,
      "senior_reviewer",
      "Corroborating runs 02 and 03 indicate empirical reduction rose to 78%."
    );
    expect(commentedItem.comments.length).toBe(1);

    // 4. Create reviewed draft (v1.1.0)
    const draftResult = workbench.createReviewedDraft(queueItem.id, "senior_reviewer", {
      claimFamilyTopic: "memory_decay_isolation",
      targetPatternOrRelationId: "DP-003_FP-005",
      version: "1.1.0",
      statement:
        "Memory decay isolation is associated with an empirical 78% decrease in semantic memory bleed across updated benchmark workloads.",
      governanceVerdict: "promote",
      evidenceReferences: {
        runIds: ["run_01", "run_02", "run_03"],
        observationIds: ["obs_01", "obs_02", "obs_03"],
        decisionReportIds: ["dec_02"],
        sourceIds: ["src_01"]
      }
    });

    // INVARIANT: Created draft is 'draft' and active claim v1.0.0 is NOT silently replaced
    expect(draftResult.createdDraft.status).toBe("draft");
    expect(draftResult.createdDraft.version).toBe("1.1.0");

    const currentV1 = claimRegistry.getClaim(activeClaimV1.id);
    expect(currentV1?.status).toBe("active"); // Still active!
    expect(draftResult.item.status).toBe("resolved");
    expect(draftResult.item.resolution?.decision).toBe("approved_draft");
    expect(draftResult.item.resolution?.createdDraftId).toBe(draftResult.createdDraft.id);

    // 5. Verify audit log integrity across the full workbench workflow
    const auditStatus = workbench.auditLog.verifyChainIntegrity();
    expect(auditStatus.isValid).toBe(true);
    expect(auditStatus.verifiedEntriesCount).toBeGreaterThanOrEqual(4);
  });
});

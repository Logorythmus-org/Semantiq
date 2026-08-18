import { describe, expect, it } from "vitest";
import {
  ClaimRegistryEngine,
  EvidenceWatchEngine
} from "../../packages/evidence/src/index.js";

describe("Claim Reconciliation & Evidence Watch Architecture", () => {
  const claimRegistry = new ClaimRegistryEngine();
  const watchEngine = new EvidenceWatchEngine(claimRegistry);

  // Setup sample active claim
  const claim = claimRegistry.draftClaim({
    claimFamilyTopic: "context_drift_mitigation",
    targetPatternOrRelationId: "DP-002_FP-002",
    version: "1.0.0",
    statement:
      "Context drift mitigation is associated with an empirical 80% decrease in task failure under long-horizon tests.",
    governanceVerdict: "promote",
    evidenceReferences: {
      runIds: ["run_01", "run_02"],
      observationIds: ["obs_01", "obs_02"],
      decisionReportIds: ["dec_01"],
      sourceIds: ["src_01"]
    }
  });

  claimRegistry.addReview(claim.id, {
    reviewerId: "rev_1",
    decision: "approve",
    comments: "Verified."
  });
  claimRegistry.addReview(claim.id, {
    reviewerId: "rev_2",
    decision: "approve",
    comments: "Approved."
  });
  const activeClaim = claimRegistry.releaseClaim(claim.id);

  // Index claim dependencies
  watchEngine.dependencyIndex.indexClaim(activeClaim.id, activeClaim.evidenceReferences);

  const baselineSnapshot = watchEngine.captureSnapshot(activeClaim.id, {
    targetId: "DP-002_FP-002",
    runIds: ["run_01", "run_02"],
    observationCount: 2,
    meanMetricScore: 0.80,
    latestGovernanceVerdict: "promote",
    negativeControlFailures: 0
  });

  it("indexes claim dependencies and resolves reverse lookups", () => {
    const dependentClaims = watchEngine.dependencyIndex.getClaimsDependentOnRun("run_01");
    expect(dependentClaims).toContain(activeClaim.id);

    const runs = watchEngine.dependencyIndex.getRunsForClaim(activeClaim.id);
    expect(runs.length).toBe(2);
  });

  it("generates 'no_change' proposal when current state matches baseline", () => {
    const currentSnapshot = watchEngine.captureSnapshot(activeClaim.id, {
      targetId: "DP-002_FP-002",
      runIds: ["run_01", "run_02"],
      observationCount: 2,
      meanMetricScore: 0.80,
      latestGovernanceVerdict: "promote",
      negativeControlFailures: 0
    });

    const proposal = watchEngine.reconcileClaim(activeClaim, baselineSnapshot, currentSnapshot);

    expect(proposal.action).toBe("no_change");
    expect(proposal.severity).toBe("low");
  });

  it("generates 'refresh' proposal when new corroborating runs are added", () => {
    const currentSnapshot = watchEngine.captureSnapshot(activeClaim.id, {
      targetId: "DP-002_FP-002",
      runIds: ["run_01", "run_02", "run_03", "run_04"],
      observationCount: 4,
      meanMetricScore: 0.81,
      latestGovernanceVerdict: "promote",
      negativeControlFailures: 0
    });

    const proposal = watchEngine.reconcileClaim(activeClaim, baselineSnapshot, currentSnapshot);

    expect(proposal.action).toBe("refresh");
    expect(proposal.severity).toBe("low");
    expect(proposal.evidenceDiff.runCountDelta).toBe(2);
  });

  it("generates 'revise' proposal when metric effect size shifts significantly", () => {
    const currentSnapshot = watchEngine.captureSnapshot(activeClaim.id, {
      targetId: "DP-002_FP-002",
      runIds: ["run_01", "run_02"],
      observationCount: 2,
      meanMetricScore: 0.68, // shifted from 0.80 -> delta = -0.12
      latestGovernanceVerdict: "promote",
      negativeControlFailures: 0
    });

    const proposal = watchEngine.reconcileClaim(activeClaim, baselineSnapshot, currentSnapshot);

    expect(proposal.action).toBe("revise");
    expect(proposal.severity).toBe("medium");
    expect(proposal.proposedStatementUpdate).toBeDefined();
  });

  it("generates 'retract' proposal when critical counterevidence is detected without mutating active claim automatically", () => {
    const currentSnapshot = watchEngine.captureSnapshot(activeClaim.id, {
      targetId: "DP-002_FP-002",
      runIds: ["run_01", "run_02", "run_adversarial"],
      observationCount: 3,
      meanMetricScore: 0.40,
      latestGovernanceVerdict: "downgrade",
      negativeControlFailures: 1
    });

    const proposal = watchEngine.reconcileClaim(activeClaim, baselineSnapshot, currentSnapshot, {
      newCounterevidenceCount: 1
    });

    expect(proposal.action).toBe("retract");
    expect(proposal.severity).toBe("critical");

    // INVARIANT: Active claim remains active (no automatic mutation)
    const storedClaim = claimRegistry.getClaim(activeClaim.id);
    expect(storedClaim?.status).toBe("active");

    // Enqueue proposal in review queue
    const queueItem = watchEngine.enqueueProposal(proposal);
    expect(queueItem.status).toBe("pending_human_review");

    // Human reviews and applies retraction proposal
    const result = watchEngine.applyProposal(
      queueItem.queueId,
      "lead_evaluator@semantiq.org",
      "Confirmed counterevidence and negative control failure."
    );

    expect(result.queueItem.status).toBe("applied");
    expect(result.updatedClaim?.status).toBe("retracted");
    expect(result.updatedClaim?.retractionReason).toContain("Applied reconciliation proposal");
  });
});

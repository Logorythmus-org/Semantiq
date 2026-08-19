import { describe, expect, it } from "vitest";
import {
  ClaimRegistryEngine,
  ControlledLanguageValidator,
  EPISTEMIC_LANGUAGE_DISCLAIMER
} from "../../packages/evidence/src/index.js";

describe("Governed Claim Registry & Controlled Language Architecture", () => {
  const validator = new ControlledLanguageValidator();
  const registry = new ClaimRegistryEngine();

  it("strictly blocks unsupported causal and absolutist wording", () => {
    const invalidStatements = [
      "Dynamic heartbeat guarantees zero execution timeout.",
      "Memory partitioning causes a 90% drop in injection attacks.",
      "Our benchmark proves that tool isolation is unhackable.",
      "This architecture eliminates all context drift failure modes."
    ];

    for (const stmt of invalidStatements) {
      const result = validator.validate(stmt);
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
    }

    const validStatement =
      "Dynamic heartbeat is associated with an empirical 82% reduction in unmetered hang frequency under tested benchmark parameters.";
    const validResult = validator.validate(validStatement);
    expect(validResult.isValid).toBe(true);
    expect(validResult.violations.length).toBe(0);
  });

  it("manages the complete claim lifecycle: draft -> review -> active -> supersede -> retract", () => {
    // 1. Attempt drafting with causal language throws
    expect(() =>
      registry.draftClaim({
        claimFamilyTopic: "tool_boundary_isolation",
        targetPatternOrRelationId: "DP-001_FP-003",
        version: "1.0.0",
        statement: "Tool boundary isolation eliminates tool injection vulnerabilities.",
        governanceVerdict: "promote",
        evidenceReferences: {
          runIds: ["run_01"],
          observationIds: ["obs_01"],
          decisionReportIds: ["dec_01"],
          sourceIds: ["src_01"]
        }
      })
    ).toThrow(/Controlled Language Violation/);

    // 2. Draft valid claim v1.0.0
    const claimV1 = registry.draftClaim({
      claimFamilyTopic: "tool_boundary_isolation",
      targetPatternOrRelationId: "DP-001_FP-003",
      version: "1.0.0",
      statement:
        "Tool boundary isolation is associated with an empirical 75% reduction in tool injection breaches under benchmark conditions.",
      governanceVerdict: "promote",
      evidenceReferences: {
        runIds: ["run_01", "run_02"],
        observationIds: ["obs_01", "obs_02"],
        decisionReportIds: ["dec_01"],
        sourceIds: ["src_01"]
      }
    });

    expect(claimV1.status).toBe("draft");
    expect(claimV1.claimFamilyId).toMatch(/^fam_/);
    expect(claimV1.epistemicDisclaimer).toBe(EPISTEMIC_LANGUAGE_DISCLAIMER);
    expect(claimV1.epistemicDisclaimer).toBe("Release controls wording, not truth.");

    // Attempting release without 2 approvals throws
    expect(() => registry.releaseClaim(claimV1.id)).toThrow(/Requires >= 2 approvals/);

    // Add 2 reviewer approvals
    registry.addReview(claimV1.id, {
      reviewerId: "reviewer_a",
      decision: "approve",
      comments: "Controlled language verified."
    });
    registry.addReview(claimV1.id, {
      reviewerId: "reviewer_b",
      decision: "approve",
      comments: "Empirical evidence references complete."
    });

    // Release v1.0.0 to active
    const activeClaimV1 = registry.releaseClaim(claimV1.id);
    expect(activeClaimV1.status).toBe("active");
    expect(activeClaimV1.releasedAt).toBeDefined();

    // 3. Draft and release v1.1.0 in same claim family
    const claimV2 = registry.draftClaim({
      claimFamilyTopic: "tool_boundary_isolation",
      targetPatternOrRelationId: "DP-001_FP-003",
      version: "1.1.0",
      statement:
        "Tool boundary isolation is associated with an empirical 85% reduction in tool injection breaches across multi-model evaluations.",
      governanceVerdict: "promote",
      evidenceReferences: {
        runIds: ["run_01", "run_02", "run_03"],
        observationIds: ["obs_01", "obs_02", "obs_03"],
        decisionReportIds: ["dec_02"],
        sourceIds: ["src_01"]
      }
    });

    expect(claimV2.claimFamilyId).toBe(claimV1.claimFamilyId);

    registry.addReview(claimV2.id, {
      reviewerId: "reviewer_a",
      decision: "approve",
      comments: "Updated metrics confirmed."
    });
    registry.addReview(claimV2.id, {
      reviewerId: "reviewer_c",
      decision: "approve",
      comments: "LGTM."
    });

    // Release v1.1.0 -> should supersede v1.0.0
    const activeClaimV2 = registry.releaseClaim(claimV2.id);
    expect(activeClaimV2.status).toBe("active");

    const supersededV1 = registry.getClaim(claimV1.id);
    expect(supersededV1?.status).toBe("superseded");
    expect(supersededV1?.supersededByClaimId).toBe(claimV2.id);

    // 4. Retraction
    const retracted = registry.retractClaim(
      claimV2.id,
      "Superseding experimental design under review."
    );
    expect(retracted.status).toBe("retracted");
    expect(retracted.retractionReason).toBe("Superseding experimental design under review.");
    expect(retracted.retractedAt).toBeDefined();
  });
});

import { describe, it, expect } from "vitest";
import { CommunityGovernanceEngine } from "../../packages/semantiq/src/community-governance.js";
import type {
  SponsorDisclosureRecord,
  ConflictDisclosureRecord,
  CommunityProposalRecord
} from "../../packages/semantiq/src/community-governance.js";

describe("Phase 11.5.7 — Community Governance and Maintainer Accountability", () => {
  const engine = new CommunityGovernanceEngine();

  const sampleProposal: CommunityProposalRecord = {
    proposalId: "prop-201",
    title: "Update Evaluation Benchmark Weights",
    proposer: "Contributor X",
    submittedAt: "2026-08-07T00:00:00Z",
    stage: "public_proposal",
    evidenceLinks: ["https://example.org/proposal-evidence"],
    recusedMaintainers: ["maint-02"],
    decisionStatus: "pending"
  };

  it("rejects sponsor disclosure with veto power, privileged access, or ranking guarantees", () => {
    const invalidSponsor: SponsorDisclosureRecord = {
      sponsorId: "spon-01",
      organizationName: "BigTech Corp",
      fundingTier: "platinum",
      hasVetoPower: true,
      hasPrivilegedAccess: true,
      hasRankingGuarantee: true
    };
    const report = engine.validateSponsorLimits(invalidSponsor);
    expect(report.isValid).toBe(false);
    expect(report.violations.length).toBe(3);
    expect(report.violations).toContain(
      "Sponsors are strictly forbidden from holding veto power over evaluation results or governance."
    );
  });

  it("requires recusal of conflicted maintainers from voting", () => {
    const conflict: ConflictDisclosureRecord = {
      disclosureId: "conf-01",
      maintainerId: "maint-01",
      entityName: "ModelProvider Inc",
      relationshipType: "employment",
      isRecusedFromVoting: false
    };
    const report = engine.validateConflictRecusal(conflict, sampleProposal, "maint-01");
    expect(report.isValid).toBe(false);
    expect(report.violations[0]).toContain(
      "Maintainer 'maint-01' has an active conflict of interest"
    );
  });

  it("passes a proposal with supporting evidence links", () => {
    const report = engine.validateProposalRecord(sampleProposal);
    expect(report.isValid).toBe(true);
  });
});

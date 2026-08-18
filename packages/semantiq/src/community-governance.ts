export interface MaintainerRoleRecord {
  readonly maintainerId: string;
  readonly name: string;
  readonly roleScope: string;
  readonly appointedAt: string;
  readonly termReviewDate: string;
  readonly isSuspended: boolean;
}

export interface ConflictDisclosureRecord {
  readonly disclosureId: string;
  readonly maintainerId: string;
  readonly entityName: string;
  readonly relationshipType:
    | "employment"
    | "funding"
    | "sponsorship"
    | "model_provider"
    | "consulting";
  readonly isRecusedFromVoting: boolean;
}

export interface SponsorDisclosureRecord {
  readonly sponsorId: string;
  readonly organizationName: string;
  readonly fundingTier: string;
  readonly hasVetoPower: boolean;
  readonly hasPrivilegedAccess: boolean;
  readonly hasRankingGuarantee: boolean;
}

export interface CommunityProposalRecord {
  readonly proposalId: string;
  readonly title: string;
  readonly proposer: string;
  readonly submittedAt: string;
  readonly stage:
    | "public_proposal"
    | "evidence_period"
    | "structured_review"
    | "community_feedback"
    | "recorded_decision"
    | "adopted";
  readonly evidenceLinks: readonly string[];
  readonly recusedMaintainers: readonly string[];
  readonly decisionStatus: "pending" | "approved" | "rejected" | "appealed";
}

export interface GovernanceValidationReport {
  readonly isValid: boolean;
  readonly violations: readonly string[];
}

/**
 * Community Governance & Maintainer Accountability Engine.
 * Enforces conflict-of-interest recusals, sponsor influence boundaries,
 * maintainer accountability, and proposal validation.
 */
export class CommunityGovernanceEngine {
  validateSponsorLimits(sponsor: SponsorDisclosureRecord): GovernanceValidationReport {
    const violations: string[] = [];

    if (sponsor.hasVetoPower) {
      violations.push(
        "Sponsors are strictly forbidden from holding veto power over evaluation results or governance."
      );
    }

    if (sponsor.hasPrivilegedAccess) {
      violations.push(
        "Sponsors are forbidden from receiving privileged or unreleased benchmark access."
      );
    }

    if (sponsor.hasRankingGuarantee) {
      violations.push("Sponsors are forbidden from receiving ranking or evaluation guarantees.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateConflictRecusal(
    conflict: ConflictDisclosureRecord,
    proposal: CommunityProposalRecord,
    votingMaintainerId: string
  ): GovernanceValidationReport {
    const violations: string[] = [];

    if (conflict.maintainerId === votingMaintainerId && !conflict.isRecusedFromVoting) {
      violations.push(
        `Maintainer '${votingMaintainerId}' has an active conflict of interest and must recuse from voting.`
      );
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }

  validateProposalRecord(proposal: CommunityProposalRecord): GovernanceValidationReport {
    const violations: string[] = [];

    if (!proposal.evidenceLinks || proposal.evidenceLinks.length === 0) {
      violations.push("Community proposals require supporting evidence links.");
    }

    return {
      isValid: violations.length === 0,
      violations
    };
  }
}

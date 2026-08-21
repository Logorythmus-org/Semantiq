/**
 * @package @semantiq/evidence
 * Governed Claim Registry Engine
 *
 * Invariants:
 * 1. Block unsupported causal language at drafting and release.
 * 2. Release controls wording, not truth.
 * 3. Lifecycle transitions: draft -> active -> (superseded | retracted).
 * 4. Deterministic claim family identity.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import { ControlledLanguageValidator } from "./controlled-language-validator.js";
import {
  type ClaimEvidenceReferences,
  type ClaimLifecycleStatus,
  type GovernedClaimReview,
  type GovernedEvidenceClaim,
  EPISTEMIC_LANGUAGE_DISCLAIMER
} from "./types.js";
import type { EvidenceGovernanceVerdict } from "../governance-policy/types.js";

export interface DraftClaimOptions {
  readonly claimFamilyTopic: string;
  readonly targetPatternOrRelationId: string;
  readonly version: string;
  readonly statement: string;
  readonly governanceVerdict: EvidenceGovernanceVerdict;
  readonly evidenceReferences: ClaimEvidenceReferences;
}

export class ClaimRegistryEngine {
  private readonly claims = new Map<string, GovernedEvidenceClaim>();
  private readonly validator = new ControlledLanguageValidator();

  /**
   * Creates a draft evidence claim after passing controlled language validation.
   */
  public draftClaim(options: DraftClaimOptions): GovernedEvidenceClaim {
    // 1. Validate controlled language (Block unsupported causal language)
    const validation = this.validator.validate(options.statement);
    if (!validation.isValid) {
      const issues = validation.violations
        .map(
          (v) =>
            `Prohibited: '${v.prohibitedPhrase}' - ${v.reason} (Use '${v.suggestedAlternative}')`
        )
        .join("; ");
      throw new Error(
        `Controlled Language Violation: Statement contains prohibited wording. Details: ${issues}`
      );
    }

    const claimFamilyId = `fam_${computeSha256(`${options.claimFamilyTopic}:${options.targetPatternOrRelationId}`).substring(0, 16)}`;
    const id = `claim_${claimFamilyId}_v${options.version.replace(/\./g, "_")}`;

    if (this.claims.has(id)) {
      throw new Error(`Claim with ID ${id} already exists in registry.`);
    }

    const claim: GovernedEvidenceClaim = {
      id,
      claimFamilyId,
      version: options.version,
      statement: options.statement,
      status: "draft",
      targetPatternOrRelationId: options.targetPatternOrRelationId,
      evidenceReferences: options.evidenceReferences,
      governanceVerdict: options.governanceVerdict,
      reviews: [],
      epistemicDisclaimer: EPISTEMIC_LANGUAGE_DISCLAIMER,
      createdAt: new Date().toISOString()
    };

    const frozen = Object.freeze(claim);
    this.claims.set(id, frozen);
    return frozen;
  }

  /**
   * Adds a reviewer approval/feedback to a claim.
   */
  public addReview(
    claimId: string,
    review: {
      reviewerId: string;
      decision: "approve" | "reject" | "request_changes";
      comments: string;
    }
  ): GovernedEvidenceClaim {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    if (claim.status !== "draft") {
      throw new Error(`Cannot add review to claim with status '${claim.status}'. Must be 'draft'.`);
    }

    const newReview: GovernedClaimReview = {
      ...review,
      reviewedAt: new Date().toISOString()
    };

    const updated: GovernedEvidenceClaim = {
      ...claim,
      reviews: Object.freeze([...claim.reviews, newReview])
    };

    const frozen = Object.freeze(updated);
    this.claims.set(claimId, frozen);
    return frozen;
  }

  /**
   * Releases an approved claim to 'active' status.
   * Supersedes previous active claims in the same family.
   */
  public releaseClaim(claimId: string): GovernedEvidenceClaim {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    if (claim.status !== "draft") {
      throw new Error(`Cannot release claim with status '${claim.status}'. Must be 'draft'.`);
    }

    // Re-verify controlled language at release gate
    const validation = this.validator.validate(claim.statement);
    if (!validation.isValid) {
      throw new Error(
        "Controlled Language Violation: Release blocked due to unsupported causal wording."
      );
    }

    // Check approval threshold: >= 2 approvals and 0 rejections
    const approvals = claim.reviews.filter((r) => r.decision === "approve").length;
    const rejections = claim.reviews.filter((r) => r.decision === "reject").length;

    if (approvals < 2 || rejections > 0) {
      throw new Error(
        `Cannot release claim ${claimId}: Requires >= 2 approvals and 0 rejections (Current: ${approvals} approvals, ${rejections} rejections).`
      );
    }

    if (claim.governanceVerdict !== "promote") {
      throw new Error(
        `Cannot release claim ${claimId}: Evidence governance verdict must be 'promote' (Current: '${claim.governanceVerdict}').`
      );
    }

    // Supersede any previously active claim in this family
    const familyClaims = this.listClaimsInFamily(claim.claimFamilyId);
    for (const prior of familyClaims) {
      if (prior.id !== claimId && prior.status === "active") {
        const superseded: GovernedEvidenceClaim = {
          ...prior,
          status: "superseded",
          supersededByClaimId: claimId
        };
        this.claims.set(prior.id, Object.freeze(superseded));
      }
    }

    const released: GovernedEvidenceClaim = {
      ...claim,
      status: "active",
      releasedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(released);
    this.claims.set(claimId, frozen);
    return frozen;
  }

  /**
   * Retracts an active or draft claim.
   */
  public retractClaim(claimId: string, reason: string): GovernedEvidenceClaim {
    const claim = this.claims.get(claimId);
    if (!claim) {
      throw new Error(`Claim not found: ${claimId}`);
    }

    if (claim.status === "retracted") {
      return claim;
    }

    const retracted: GovernedEvidenceClaim = {
      ...claim,
      status: "retracted",
      retractionReason: reason,
      retractedAt: new Date().toISOString()
    };

    const frozen = Object.freeze(retracted);
    this.claims.set(claimId, frozen);
    return frozen;
  }

  public getClaim(claimId: string): GovernedEvidenceClaim | undefined {
    return this.claims.get(claimId);
  }

  public listClaimsInFamily(familyId: string): readonly GovernedEvidenceClaim[] {
    return Array.from(this.claims.values()).filter((c) => c.claimFamilyId === familyId);
  }

  public listActiveClaims(): readonly GovernedEvidenceClaim[] {
    return Array.from(this.claims.values()).filter((c) => c.status === "active");
  }

  public listClaimsByStatus(status: ClaimLifecycleStatus): readonly GovernedEvidenceClaim[] {
    return Array.from(this.claims.values()).filter((c) => c.status === status);
  }
}

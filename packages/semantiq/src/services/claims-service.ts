/**
 * @package @tech-club/semantiq
 * Authoritative Governed Claims Application Service
 */

import {
  ClaimRegistryEngine,
  ControlledLanguageValidator,
  type ClaimLifecycleStatus,
  type ControlledLanguageViolation,
  type DraftClaimOptions,
  type GovernedEvidenceClaim
} from "../../../evidence/src/index.js";

export class ClaimsService {
  private readonly validator = new ControlledLanguageValidator();

  constructor(public readonly registry: ClaimRegistryEngine = new ClaimRegistryEngine()) {}

  public validateControlledLanguage(statement: string): {
    isValid: boolean;
    violations: readonly ControlledLanguageViolation[];
  } {
    return this.validator.validate(statement);
  }

  public async draftClaim(options: DraftClaimOptions): Promise<GovernedEvidenceClaim> {
    return this.registry.draftClaim(options);
  }

  public async addReview(
    claimId: string,
    review: {
      reviewerId: string;
      decision: "approve" | "reject" | "request_changes";
      comments: string;
    }
  ): Promise<GovernedEvidenceClaim> {
    return this.registry.addReview(claimId, review);
  }

  public async releaseClaim(claimId: string): Promise<GovernedEvidenceClaim> {
    return this.registry.releaseClaim(claimId);
  }

  public async retractClaim(claimId: string, reason: string): Promise<GovernedEvidenceClaim> {
    return this.registry.retractClaim(claimId, reason);
  }

  public async getClaim(claimId: string): Promise<GovernedEvidenceClaim | undefined> {
    return this.registry.getClaim(claimId);
  }

  public async listClaims(filter?: {
    familyId?: string;
    status?: ClaimLifecycleStatus;
  }): Promise<readonly GovernedEvidenceClaim[]> {
    if (filter?.familyId) {
      return this.registry.listClaimsInFamily(filter.familyId);
    }
    if (filter?.status) {
      return this.registry.listClaimsByStatus(filter.status);
    }
    return this.registry.listActiveClaims();
  }
}

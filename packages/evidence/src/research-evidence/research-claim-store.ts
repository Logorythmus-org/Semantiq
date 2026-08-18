/**
 * @package @semantiq/evidence
 * Research Source & Claim Store with Epistemic Nature Validation
 * 
 * Invariants:
 * 1. Observed != Inferred.
 * 2. Claims must accurately reflect their epistemic status.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import type {
  EpistemicStatus,
  ResearchClaim,
  ResearchSource
} from "./types.js";

export class ResearchClaimStore {
  private readonly sources = new Map<string, ResearchSource>();
  private readonly claims = new Map<string, ResearchClaim>();

  public registerSource(source: Omit<ResearchSource, "extractedAt">): ResearchSource {
    const fullSource: ResearchSource = {
      ...source,
      extractedAt: new Date().toISOString()
    };
    this.sources.set(fullSource.id, Object.freeze(fullSource));
    return fullSource;
  }

  public getSource(sourceId: string): ResearchSource | undefined {
    return this.sources.get(sourceId);
  }

  public registerClaim(claim: Omit<ResearchClaim, "id"> & { id?: string }): ResearchClaim {
    const source = this.sources.get(claim.researchSourceId);
    if (!source) {
      throw new Error(`Cannot register claim for unknown ResearchSource: ${claim.researchSourceId}`);
    }

    // Validate Epistemic Nature Invariants
    this.validateEpistemicNature(claim.nature, claim.statement);

    const claimId =
      claim.id ?? `claim_${computeSha256(`${claim.researchSourceId}:${claim.statement}`).substring(0, 16)}`;

    const fullClaim: ResearchClaim = {
      ...claim,
      id: claimId
    };

    const frozenClaim = Object.freeze(fullClaim);
    this.claims.set(claimId, frozenClaim);
    return frozenClaim;
  }

  public getClaim(claimId: string): ResearchClaim | undefined {
    return this.claims.get(claimId);
  }

  public listClaimsByNature(nature: EpistemicStatus): readonly ResearchClaim[] {
    return Array.from(this.claims.values()).filter((c) => c.nature === nature);
  }

  public listClaimsBySource(sourceId: string): readonly ResearchClaim[] {
    return Array.from(this.claims.values()).filter((c) => c.researchSourceId === sourceId);
  }

  private validateEpistemicNature(nature: EpistemicStatus, statement: string): void {
    if (!nature) {
      throw new Error("Claim must declare a valid epistemic nature");
    }

    const lower = statement.toLowerCase();
    if (nature === "semantiq_observation") {
      if (lower.startsWith("we assume") || lower.startsWith("it is hypothesized")) {
        throw new Error(
          `Epistemic Violation: Inferred/hypothetical statement cannot be registered as 'semantiq_observation'. (Observed != Inferred)`
        );
      }
    }
  }
}

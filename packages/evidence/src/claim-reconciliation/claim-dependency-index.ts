/**
 * @package @semantiq/evidence
 * Exact Claim Dependency Index
 */

import type { ClaimEvidenceReferences } from "../claim-registry/types.js";

export class ClaimDependencyIndex {
  private readonly claimToRuns = new Map<string, Set<string>>();
  private readonly claimToObservations = new Map<string, Set<string>>();
  private readonly claimToSources = new Map<string, Set<string>>();
  private readonly runToClaims = new Map<string, Set<string>>();
  private readonly observationToClaims = new Map<string, Set<string>>();

  public indexClaim(claimId: string, refs: ClaimEvidenceReferences): void {
    // 1. Claim -> Runs
    const runsSet = new Set(refs.runIds);
    this.claimToRuns.set(claimId, runsSet);
    for (const r of runsSet) {
      if (!this.runToClaims.has(r)) this.runToClaims.set(r, new Set());
      this.runToClaims.get(r)!.add(claimId);
    }

    // 2. Claim -> Observations
    const obsSet = new Set(refs.observationIds);
    this.claimToObservations.set(claimId, obsSet);
    for (const o of obsSet) {
      if (!this.observationToClaims.has(o)) this.observationToClaims.set(o, new Set());
      this.observationToClaims.get(o)!.add(claimId);
    }

    // 3. Claim -> Sources
    this.claimToSources.set(claimId, new Set(refs.sourceIds));
  }

  public getClaimsDependentOnRun(runId: string): readonly string[] {
    return Array.from(this.runToClaims.get(runId) ?? []);
  }

  public getClaimsDependentOnObservation(observationId: string): readonly string[] {
    return Array.from(this.observationToClaims.get(observationId) ?? []);
  }

  public getRunsForClaim(claimId: string): readonly string[] {
    return Array.from(this.claimToRuns.get(claimId) ?? []);
  }

  public getObservationsForClaim(claimId: string): readonly string[] {
    return Array.from(this.claimToObservations.get(claimId) ?? []);
  }
}

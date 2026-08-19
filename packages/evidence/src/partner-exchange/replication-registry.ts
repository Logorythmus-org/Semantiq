/**
 * @package @semantiq/evidence
 * Replication Registry Engine & Cross-Organization Aggregation
 *
 * Invariants:
 * 1. Counterevidence remains visible in aggregation.
 * 2. E4 requires genuine context diversity and remains non-causal.
 * 3. Replication demonstrates empirical consistency across contexts, not causal proof or universal truth.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  EPISTEMIC_REPLICATION_DISCLAIMER,
  type AggregatedReplicationEvidenceGrade,
  type CrossOrgReplicationAggregation,
  type PartnerStudy,
  type ReplicationOutcome,
  type ReplicationRecord,
  type VisibleCounterevidenceEntry
} from "./types.js";

export class ReplicationRegistryEngine {
  private readonly studies = new Map<string, PartnerStudy>();
  private readonly replications = new Map<string, ReplicationRecord>();
  private readonly replicationsByClaim = new Map<string, string[]>();

  public registerStudy(study: PartnerStudy): PartnerStudy {
    const frozen = Object.freeze({ ...study });
    this.studies.set(study.id, frozen);
    return frozen;
  }

  public getStudy(studyId: string): PartnerStudy | undefined {
    return this.studies.get(studyId);
  }

  public listStudies(filter?: { organizationId?: string | undefined }): readonly PartnerStudy[] {
    let list = Array.from(this.studies.values());
    if (filter?.organizationId) {
      list = list.filter((s) => s.organizationId === filter.organizationId);
    }
    return Object.freeze(list);
  }

  public registerReplication(record: ReplicationRecord): ReplicationRecord {
    const frozen = Object.freeze({
      ...record,
      epistemicDisclaimer: EPISTEMIC_REPLICATION_DISCLAIMER
    });
    this.replications.set(record.replicationId, frozen);

    const claimList = this.replicationsByClaim.get(record.targetClaimId) ?? [];
    if (!claimList.includes(record.replicationId)) {
      claimList.push(record.replicationId);
      this.replicationsByClaim.set(record.targetClaimId, claimList);
    }

    return frozen;
  }

  public getReplication(replicationId: string): ReplicationRecord | undefined {
    return this.replications.get(replicationId);
  }

  public listReplicationsForClaim(claimId: string): readonly ReplicationRecord[] {
    const ids = this.replicationsByClaim.get(claimId) ?? [];
    return Object.freeze(ids.map((id) => this.replications.get(id)!).filter(Boolean));
  }

  /**
   * Aggregates multi-organization replication evidence for a given claim.
   * INVARIANT 1: Counterevidence remains visible and is never suppressed.
   * INVARIANT 2: Ineligible submissions (quarantined/rejected by Gate) cannot alter aggregation.
   */
  public aggregateReplications(claimId: string): CrossOrgReplicationAggregation {
    const allRecords = this.listReplicationsForClaim(claimId);

    const admissibleRecords = allRecords.filter(
      (r) => r.eligibilityVerdict !== "quarantined" && r.eligibilityVerdict !== "rejected"
    );
    const ineligibleCount = allRecords.length - admissibleRecords.length;

    let supportCount = 0;
    let counterCount = 0;
    let mixedCount = 0;
    let inconclusiveCount = 0;

    const orgSet = new Set<string>();
    const envSet = new Set<string>();
    const modelSet = new Set<string>();
    const platformSet = new Set<string>();

    const visibleCounterevidence: VisibleCounterevidenceEntry[] = [];

    for (const r of admissibleRecords) {
      orgSet.add(r.replicatingOrganizationId);
      for (const e of r.contextDiversity.environmentProviders) envSet.add(e);
      for (const m of r.contextDiversity.modelFamilies) modelSet.add(m);
      for (const p of r.contextDiversity.platforms) platformSet.add(p);

      switch (r.outcome) {
        case "support":
          supportCount++;
          break;
        case "counter":
          counterCount++;
          visibleCounterevidence.push({
            replicationId: r.replicationId,
            replicatingOrganizationId: r.replicatingOrganizationId,
            outcome: "counter",
            effectDeltaObserved: r.effectDeltaObserved,
            details:
              r.counterevidenceDetails ||
              "Replication produced counterevidence against claim target."
          });
          break;
        case "mixed":
          mixedCount++;
          visibleCounterevidence.push({
            replicationId: r.replicationId,
            replicatingOrganizationId: r.replicatingOrganizationId,
            outcome: "mixed",
            effectDeltaObserved: r.effectDeltaObserved,
            details:
              r.counterevidenceDetails ||
              "Replication produced mixed/inconsistent results across trials."
          });
          break;
        case "inconclusive":
          inconclusiveCount++;
          break;
      }
    }

    const totalCount = allRecords.length;
    const admissibleCount = admissibleRecords.length;
    const independentOrgsCount = orgSet.size;

    // Context diversity index computation (0.0 to 1.0)
    const diversityOrgFactor = Math.min(1.0, independentOrgsCount / 3);
    const diversityEnvFactor = Math.min(1.0, envSet.size / 2);
    const diversityModelFactor = Math.min(1.0, modelSet.size / 2);
    const diversityPlatformFactor = Math.min(1.0, platformSet.size / 2);

    const contextDiversityIndex =
      admissibleCount === 0
        ? 0.0
        : Number(
            (
              diversityOrgFactor * 0.4 +
              diversityEnvFactor * 0.2 +
              diversityModelFactor * 0.2 +
              diversityPlatformFactor * 0.2
            ).toFixed(3)
          );

    // E4 requires genuine context diversity (index >= 0.70 and >= 2 independent orgs)
    const e4ContextDiversitySatisfied = independentOrgsCount >= 2 && contextDiversityIndex >= 0.7;

    let aggregatedGrade: AggregatedReplicationEvidenceGrade;
    if (admissibleCount === 0) {
      aggregatedGrade = "E0_INSUFFICIENT";
    } else if (counterCount + mixedCount > admissibleCount * 0.2) {
      aggregatedGrade = "E1_CONTESTED";
    } else if (e4ContextDiversitySatisfied && supportCount >= admissibleCount * 0.8) {
      aggregatedGrade = "E4_CROSS_CONTEXT_ROBUST";
    } else if (independentOrgsCount >= 2 && supportCount > 0) {
      aggregatedGrade = "E3_PARTIAL_REPLICATION";
    } else if (supportCount > 0) {
      aggregatedGrade = "E2_LOCAL_CONSISTENT";
    } else {
      aggregatedGrade = "E0_INSUFFICIENT";
    }

    const aggregation: CrossOrgReplicationAggregation = {
      targetClaimId: claimId,
      totalReplicationsCount: totalCount,
      admissibleReplicationsCount: admissibleCount,
      ineligibleSubmissionsCount: ineligibleCount,
      independentOrganizationsCount: independentOrgsCount,
      supportCount,
      counterCount,
      mixedCount,
      inconclusiveCount,
      contextDiversityIndex,
      e4ContextDiversitySatisfied,
      counterevidencePreserved: true,
      visibleCounterevidence: Object.freeze(visibleCounterevidence),
      aggregatedEvidenceGrade: aggregatedGrade,
      epistemicDisclaimer: EPISTEMIC_REPLICATION_DISCLAIMER
    };

    return Object.freeze(aggregation);
  }
}

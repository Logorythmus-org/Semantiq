/**
 * @package @semantiq/evidence
 * Partner Exchange, Replication Registry, and Cross-Organization Aggregation Types
 *
 * Invariants:
 * 1. Counterevidence remains visible and is never suppressed in aggregation.
 * 2. E4 requires genuine context diversity and remains non-causal.
 * 3. Replication demonstrates empirical consistency across contexts, not causal proof or universal truth.
 */

import type { PartnerRole } from "../../../sandbox-contracts/src/index.js";

export const EPISTEMIC_REPLICATION_DISCLAIMER =
  "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth.";

export type PartnerTrustTier =
  | "unverified"
  | "registered"
  | "verified_academic"
  | "commercial_audited"
  | "certified_consortium";

export interface PartnerOrganization {
  readonly id: string;
  readonly name: string;
  readonly role: PartnerRole;
  readonly trustTier: PartnerTrustTier;
  readonly contactEmail: string;
  readonly publicKey?: string | undefined;
  readonly endpointUrl?: string | undefined;
  readonly registeredAt: string;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
}

export interface PartnerStudy {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly abstract: string;
  readonly targetPatternOrClaimId: string;
  readonly replicationTargetStudyId?: string | undefined;
  readonly status: "draft" | "in_review" | "published" | "retracted";
  readonly bundleId: string;
  readonly merkleRootHash: string;
  readonly createdAt: string;
  readonly publishedAt?: string | undefined;
}

export type ReplicationOutcome = "support" | "counter" | "mixed" | "inconclusive";

export interface ContextDiversityDimension {
  readonly environmentProviders: readonly string[]; // e.g. ["modal", "firecracker", "aws"]
  readonly modelFamilies: readonly string[]; // e.g. ["claude", "gpt", "llama"]
  readonly platforms: readonly string[]; // e.g. ["linux", "darwin", "win32"]
  readonly diversityScore: number; // 0.0 to 1.0 (>= 0.7 indicates genuine context diversity)
}

export interface ReplicationRecord {
  readonly replicationId: string;
  readonly originalStudyId: string;
  readonly targetClaimId: string;
  readonly replicatingOrganizationId: string;
  readonly replicatingStudyId: string;
  readonly outcome: ReplicationOutcome;
  readonly effectDeltaObserved: number;
  readonly baselineDeltaTarget: number;
  readonly contextDiversity: ContextDiversityDimension;
  readonly counterevidenceObserved: boolean;
  readonly counterevidenceDetails?: string | undefined;
  readonly conductedAt: string;
  readonly verifiedSignatureHex?: string | undefined;
  readonly eligibilityVerdict?:
    | "eligible"
    | "eligible_with_caveats"
    | "quarantined"
    | "rejected"
    | undefined;
  readonly epistemicDisclaimer: typeof EPISTEMIC_REPLICATION_DISCLAIMER;
}

export interface RedactedArtifactEntry {
  readonly path: string;
  readonly sha256: string;
  readonly isRedacted: boolean;
  readonly originalSizeBytes: number;
  readonly redactedSizeBytes: number;
}

export interface RedactedExchangePackage {
  readonly packageId: string;
  readonly sourceOrganizationId: string;
  readonly targetOrganizationId?: string | undefined; // undefined = broadcast
  readonly study: PartnerStudy;
  readonly redactedArtifacts: readonly RedactedArtifactEntry[];
  readonly redactionRulesApplied: readonly string[];
  readonly packageMerkleHash: string;
  readonly exportedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_REPLICATION_DISCLAIMER;
}

export interface VisibleCounterevidenceEntry {
  readonly replicationId: string;
  readonly replicatingOrganizationId: string;
  readonly outcome: ReplicationOutcome;
  readonly effectDeltaObserved: number;
  readonly details: string;
}

export type AggregatedReplicationEvidenceGrade =
  | "E4_CROSS_CONTEXT_ROBUST" // >= 2 independent orgs, context diversity >= 0.7, outcome support >= 80%
  | "E3_PARTIAL_REPLICATION" // Replicated across at least 1 independent org with support
  | "E2_LOCAL_CONSISTENT" // Replicated internally within single org
  | "E1_CONTESTED" // Counterevidence observed (> 20% counter/mixed)
  | "E0_INSUFFICIENT"; // Insufficient replication data

export interface CrossOrgReplicationAggregation {
  readonly targetClaimId: string;
  readonly totalReplicationsCount: number;
  readonly admissibleReplicationsCount: number;
  readonly ineligibleSubmissionsCount: number;
  readonly independentOrganizationsCount: number;
  readonly supportCount: number;
  readonly counterCount: number;
  readonly mixedCount: number;
  readonly inconclusiveCount: number;
  readonly contextDiversityIndex: number; // 0.0 to 1.0
  readonly e4ContextDiversitySatisfied: boolean;
  readonly counterevidencePreserved: true;
  readonly visibleCounterevidence: readonly VisibleCounterevidenceEntry[];
  readonly aggregatedEvidenceGrade: AggregatedReplicationEvidenceGrade;
  readonly epistemicDisclaimer: typeof EPISTEMIC_REPLICATION_DISCLAIMER;
}

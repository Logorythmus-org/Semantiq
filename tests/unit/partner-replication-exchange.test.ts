import { describe, it, expect } from "vitest";
import {
  PartnerOrganizationRegistry,
  ExchangeRedactionEngine,
  ReplicationRegistryEngine,
  EPISTEMIC_REPLICATION_DISCLAIMER,
  type PartnerStudy,
  type ReplicationRecord
} from "../../packages/evidence/src/partner-exchange/index.js";
import { createSemantiqApplicationService } from "../../packages/semantiq/src/services/index.js";

import {
  PartnerRole
} from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Partner Replication Exchange & Cross-Org Aggregation (Prompt 27)", () => {
  const partnerRegistry = new PartnerOrganizationRegistry();
  const redactionEngine = new ExchangeRedactionEngine();
  const replicationRegistry = new ReplicationRegistryEngine();

  describe("1. PartnerOrganization Registry", () => {
    it("registers and filters partner organizations by role and trust tier", () => {
      const org1 = partnerRegistry.registerOrganization({
        name: "Stanford NLP Lab",
        role: PartnerRole.ACADEMIC_COLLABORATOR,
        trustTier: "verified_academic",
        contactEmail: "nlp-lab@stanford.edu"
      });

      expect(org1.id).toContain("org_");
      expect(org1.trustTier).toBe("verified_academic");

      const academicOrgs = partnerRegistry.listOrganizations({ role: PartnerRole.ACADEMIC_COLLABORATOR });
      expect(academicOrgs.length).toBeGreaterThanOrEqual(1);
      expect(academicOrgs.some((o) => o.name === "Stanford NLP Lab")).toBe(true);
    });
  });

  describe("2. ExchangeRedactionEngine", () => {
    it("redacts secret tokens and internal IPs while updating artifact hashes and Merkle root", () => {
      const mockStudy: PartnerStudy = {
        id: "study_stanford_001",
        organizationId: "org_stanford_nlp",
        title: "Agent Reasoning Benchmark Study",
        abstract: "Replication study of mitigation DP-001.",
        targetPatternOrClaimId: "claim_dp001_recovery",
        status: "published",
        bundleId: "bundle_stanford_001",
        merkleRootHash: "0".repeat(64),
        createdAt: "2026-08-18T10:00:00.000Z"
      };

      const rawArtifacts = {
        "config.json": '{"api_key": "sk-1234567890abcdef1234567890", "internal_host": "10.0.1.45"}',
        "results.json": '{"mean_delta": 0.85, "status": "success"}'
      };

      const redacted = redactionEngine.redactBundleForExchange({
        sourceOrganizationId: "org_stanford_nlp",
        study: mockStudy,
        rawArtifacts
      });

      expect(redacted.exchangePackage.packageId).toContain("pkg_");
      expect(redacted.exchangePackage.packageMerkleHash).toHaveLength(64);
      expect(redacted.exchangePackage.epistemicDisclaimer).toBe(EPISTEMIC_REPLICATION_DISCLAIMER);

      const redactedConfig = redacted.redactedArtifactsMap.get("config.json")!;
      expect(redactedConfig).not.toContain("sk-1234567890abcdef1234567890");
      expect(redactedConfig).not.toContain("10.0.1.45");
      expect(redactedConfig).toContain("[REDACTED_SECRET]");
      expect(redactedConfig).toContain("[REDACTED_IP]");
    });
  });

  describe("3. Replication Records & Cross-Organization Aggregation", () => {
    const claimTarget = "claim_circuit_breaker_recovery_v1";

    it("aggregates replication records across organizations and ensures counterevidence remains visible", () => {
      // 1. Support from Stanford
      const rep1: ReplicationRecord = {
        replicationId: "rep_stanford_001",
        originalStudyId: "study_orig_001",
        targetClaimId: claimTarget,
        replicatingOrganizationId: "org_stanford_nlp",
        replicatingStudyId: "study_stanford_001",
        outcome: "support",
        effectDeltaObserved: 0.88,
        baselineDeltaTarget: 0.85,
        contextDiversity: {
          environmentProviders: ["modal", "aws"],
          modelFamilies: ["claude", "gpt"],
          platforms: ["linux"],
          diversityScore: 0.75
        },
        counterevidenceObserved: false,
        conductedAt: "2026-08-18T11:00:00.000Z",
        epistemicDisclaimer: EPISTEMIC_REPLICATION_DISCLAIMER
      };
      replicationRegistry.registerReplication(rep1);

      // 2. Support from MIT
      const rep2: ReplicationRecord = {
        replicationId: "rep_mit_001",
        originalStudyId: "study_orig_001",
        targetClaimId: claimTarget,
        replicatingOrganizationId: "org_mit_csail",
        replicatingStudyId: "study_mit_001",
        outcome: "support",
        effectDeltaObserved: 0.82,
        baselineDeltaTarget: 0.85,
        contextDiversity: {
          environmentProviders: ["firecracker", "gcp"],
          modelFamilies: ["claude", "llama"],
          platforms: ["linux", "darwin"],
          diversityScore: 0.80
        },
        counterevidenceObserved: false,
        conductedAt: "2026-08-18T12:00:00.000Z",
        epistemicDisclaimer: EPISTEMIC_REPLICATION_DISCLAIMER
      };
      replicationRegistry.registerReplication(rep2);

      // 3. Counterevidence from Independent Auditor
      const rep3: ReplicationRecord = {
        replicationId: "rep_auditor_001",
        originalStudyId: "study_orig_001",
        targetClaimId: claimTarget,
        replicatingOrganizationId: "org_eval_auditor_inc",
        replicatingStudyId: "study_auditor_001",
        outcome: "counter",
        effectDeltaObserved: -0.15,
        baselineDeltaTarget: 0.85,
        contextDiversity: {
          environmentProviders: ["docker_airgapped"],
          modelFamilies: ["llama"],
          platforms: ["win32"],
          diversityScore: 0.65
        },
        counterevidenceObserved: true,
        counterevidenceDetails: "Mitigation increased latency under strict airgapped resource constraints.",
        conductedAt: "2026-08-18T13:00:00.000Z",
        epistemicDisclaimer: EPISTEMIC_REPLICATION_DISCLAIMER
      };
      replicationRegistry.registerReplication(rep3);

      const aggregation = replicationRegistry.aggregateReplications(claimTarget);

      expect(aggregation.targetClaimId).toBe(claimTarget);
      expect(aggregation.totalReplicationsCount).toBe(3);
      expect(aggregation.independentOrganizationsCount).toBe(3);
      expect(aggregation.supportCount).toBe(2);
      expect(aggregation.counterCount).toBe(1);

      // INVARIANT: Counterevidence preserved and visible
      expect(aggregation.counterevidencePreserved).toBe(true);
      expect(aggregation.visibleCounterevidence.length).toBe(1);
      expect(aggregation.visibleCounterevidence[0]!.replicatingOrganizationId).toBe("org_eval_auditor_inc");
      expect(aggregation.visibleCounterevidence[0]!.effectDeltaObserved).toBe(-0.15);

      // Context diversity index
      expect(aggregation.contextDiversityIndex).toBeGreaterThanOrEqual(0.70);
      expect(aggregation.e4ContextDiversitySatisfied).toBe(true);
      expect(aggregation.epistemicDisclaimer).toBe(EPISTEMIC_REPLICATION_DISCLAIMER);
    });
  });

  describe("4. Unified Application Service Studies & Replication Integration", () => {
    it("manages partners and replications via authoritative StudiesService", async () => {
      const service = createSemantiqApplicationService();

      const partner = await service.studies.registerPartner({
        name: "Carnegie Mellon University",
        role: PartnerRole.ACADEMIC_COLLABORATOR,
        trustTier: "verified_academic",
        contactEmail: "cmu-lab@cmu.edu"
      });
      expect(partner.id).toBeDefined();

      const rep = await service.studies.registerReplication({
        replicationId: "rep_cmu_001",
        originalStudyId: "study_001",
        targetClaimId: "claim_dp002",
        replicatingOrganizationId: partner.id,
        replicatingStudyId: "study_cmu_001",
        outcome: "support",
        effectDeltaObserved: 0.91,
        baselineDeltaTarget: 0.90,
        contextDiversity: {
          environmentProviders: ["modal"],
          modelFamilies: ["claude"],
          platforms: ["linux"],
          diversityScore: 0.70
        },
        counterevidenceObserved: false,
        conductedAt: new Date().toISOString(),
        epistemicDisclaimer: EPISTEMIC_REPLICATION_DISCLAIMER
      });
      expect(rep.replicationId).toBe("rep_cmu_001");

      const agg = await service.studies.aggregateReplicationsForClaim("claim_dp002");
      expect(agg.supportCount).toBe(1);
      expect(agg.counterevidencePreserved).toBe(true);
    });
  });
});

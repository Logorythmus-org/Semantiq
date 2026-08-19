import { describe, it, expect } from "vitest";
import {
  ExternalEvidenceEligibilityGate,
  EPISTEMIC_GATE_DISCLAIMER,
  type GateEvaluationInput
} from "../../packages/evidence/src/external-evidence-gate/index.js";
import {
  StudyExecutionManifestValidator,
  EPISTEMIC_MANIFEST_DISCLAIMER,
  type StudyExecutionManifest
} from "../../packages/evidence/src/execution-manifests/index.js";
import { StudyProtocolGenerator } from "../../packages/evidence/src/study-protocols/index.js";
import { type BundleVerificationResult } from "../../packages/evidence/src/research-bundles/index.js";
import { type PartnerOrganization } from "../../packages/evidence/src/partner-exchange/index.js";
import { createSemantiqApplicationService } from "../../packages/semantiq/src/services/index.js";
import {
  RelationType,
  PartnerRole
} from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("External Evidence Eligibility Gate (Prompt 30)", () => {
  const protocolGenerator = new StudyProtocolGenerator();
  const eligibilityGate = new ExternalEvidenceEligibilityGate();

  const baseProtocol = protocolGenerator.freezeProtocol(
    protocolGenerator.generateProtocolForRelation({
      protocolId: "proto_gate_eval_001",
      title: "Agent Mitigation Robustness Protocol",
      targetRelationId: "rel_mitigation_001",
      targetPatternId: "DP-001",
      relationType: RelationType.SUPPORTS
    })
  );

  const verifiedOrg: PartnerOrganization = {
    id: "org_stanford_nlp",
    name: "Stanford NLP Lab",
    role: PartnerRole.ACADEMIC_COLLABORATOR,
    trustTier: "verified_academic",
    contactEmail: "nlp-lab@stanford.edu",
    registeredAt: "2026-08-18T10:00:00.000Z"
  };

  const validBundleVerification: BundleVerificationResult = {
    bundleId: "bundle_001",
    isValid: true,
    tamperDetected: false,
    merkleRootValid: true,
    verifiedArtifactCount: 5,
    missingArtifacts: [],
    corruptedArtifacts: [],
    violations: [],
    verifiedAt: "2026-08-18T10:05:00.000Z",
    epistemicDisclaimer: "Bundle integrity proves provenance/integrity, not truth."
  };

  const baseManifest: StudyExecutionManifest = {
    manifestId: "man_gate_001",
    studyId: "study_gate_001",
    organizationId: "org_stanford_nlp",
    protocolId: baseProtocol.protocolId,
    protocolVersion: baseProtocol.version,
    preregistrationFingerprint: baseProtocol.preregistrationHash,
    startedAt: "2026-08-18T10:00:00.000Z",
    completedAt: "2026-08-18T11:00:00.000Z",
    environmentFingerprint: "env_hash_001",
    modelFingerprint: "model_hash_001",
    datasetFingerprint: "dataset_hash_001",
    traceSchemaFingerprint: "trace_hash_001",
    treatmentRunsCount: 20,
    controlRunsCount: 20,
    matchedPairsCount: 20,
    evaluationIds: ["eval_001", "eval_002"],
    matchingDimensionsUsed: baseProtocol.matchingDimensions,
    thresholdsUsed: { accuracy: 0.8 },
    observedInstrumentation: {
      traceCollectionMode: "buffered_event_stream",
      samplingRateHz: 100,
      isolationGuarantees: ["deterministic_seed"]
    },
    executedNegativeControls: baseProtocol.negativeControls.map((c) => ({
      controlId: c.controlId,
      executed: true,
      deltaObserved: 0.005,
      boundExpected: c.expectedDeltaBound,
      passedBound: true
    })),
    missingDataReport: {
      totalExpectedObservations: 100,
      observedObservations: 100,
      missingObservationsCount: 0,
      missingDataRatio: 0.0,
      missingReasons: {}
    },
    analysisParameters: { statisticalTest: "exact_sign_test" },
    softwareVersion: "1.0.0",
    partnerAttestation: {
      attestedBy: "Stanford Lab Lead",
      role: "academic_collaborator",
      signatureHex: "0x123456",
      attestationStatement: "Faithfully executed according to frozen protocol.",
      timestamp: "2026-08-18T11:05:00.000Z"
    },
    manifestSha256: "manifest_hash_001",
    epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
  };

  describe("1. Deterministic Verdicts & Reason Codes", () => {
    it("evaluates fully conformant submission as eligible", () => {
      const input: GateEvaluationInput = {
        manifest: baseManifest,
        protocol: baseProtocol,
        bundleVerification: validBundleVerification,
        deviations: [],
        deviationChainValid: true,
        organization: verifiedOrg
      };

      const decision = eligibilityGate.evaluateSubmission(input);
      expect(decision.verdict).toBe("eligible");
      expect(decision.isAdmissibleForAggregation).toBe(true);
      expect(decision.reasonCodes).toContain("BUNDLE_INTEGRITY_VERIFIED");
      expect(decision.reasonCodes).toContain("PREREG_HASH_MATCH");
      expect(decision.reasonCodes).toContain("DEVIATION_CHAIN_VALID");
      expect(decision.reasonCodes).toContain("NEGATIVE_CONTROLS_PASSED");
      expect(decision.reasons.length).toBe(0);
      expect(decision.epistemicDisclaimer).toBe(EPISTEMIC_GATE_DISCLAIMER);
    });

    it("evaluates submission with minor caveats as eligible_with_caveats", () => {
      const input: GateEvaluationInput = {
        manifest: {
          ...baseManifest,
          matchedPairsCount: 10, // meets minimum 8 but below recommended 20
          missingDataReport: {
            totalExpectedObservations: 100,
            observedObservations: 92,
            missingObservationsCount: 8,
            missingDataRatio: 0.08, // 8% mild missing data
            missingReasons: {}
          }
        },
        protocol: baseProtocol,
        bundleVerification: validBundleVerification,
        deviations: [
          {
            deviationId: "dev_001",
            protocolId: baseProtocol.protocolId,
            timing: "pre_execution",
            severity: "minor",
            description: "Minor configuration clarification",
            rationale: "Optimized timeout",
            recordedAt: "2026-08-18T09:55:00.000Z",
            recordedBy: "Researcher",
            deviationHash: "dev_hash_001"
          }
        ],
        deviationChainValid: true,
        organization: verifiedOrg
      };

      const decision = eligibilityGate.evaluateSubmission(input);
      expect(decision.verdict).toBe("eligible_with_caveats");
      expect(decision.isAdmissibleForAggregation).toBe(true);
      expect(decision.caveats.length).toBeGreaterThanOrEqual(1);
    });

    it("evaluates submission with material deviation or failed negative control as quarantined", () => {
      const input: GateEvaluationInput = {
        manifest: {
          ...baseManifest,
          executedNegativeControls: baseProtocol.negativeControls.map((c) => ({
            controlId: c.controlId,
            executed: true,
            deltaObserved: 0.15, // FAILS bound 0.05
            boundExpected: c.expectedDeltaBound,
            passedBound: false
          }))
        },
        protocol: baseProtocol,
        bundleVerification: validBundleVerification,
        deviations: [],
        deviationChainValid: true,
        organization: verifiedOrg
      };

      const decision = eligibilityGate.evaluateSubmission(input);
      expect(decision.verdict).toBe("quarantined");
      expect(decision.isAdmissibleForAggregation).toBe(false);
      expect(decision.reasonCodes).toContain("NEGATIVE_CONTROLS_FAILED");
    });

    it("evaluates tampered bundle or preregistration hash mismatch as rejected", () => {
      const input: GateEvaluationInput = {
        manifest: {
          ...baseManifest,
          preregistrationFingerprint: "corrupted_hash_00000000000000000000000000000000"
        },
        protocol: baseProtocol,
        bundleVerification: {
          ...validBundleVerification,
          isValid: false,
          tamperDetected: true,
          merkleRootValid: false,
          verifiedArtifactCount: 3,
          missingArtifacts: [],
          corruptedArtifacts: ["merkle_root"],
          violations: ["Merkle root mismatch"],
          verifiedAt: "2026-08-18T10:05:00.000Z",
          epistemicDisclaimer: "Bundle integrity proves provenance/integrity, not truth."
        },
        deviations: [],
        deviationChainValid: false,
        organization: verifiedOrg
      };

      const decision = eligibilityGate.evaluateSubmission(input);
      expect(decision.verdict).toBe("rejected");
      expect(decision.isAdmissibleForAggregation).toBe(false);
      expect(decision.reasonCodes).toContain("BUNDLE_INTEGRITY_TAMPERED");
      expect(decision.reasonCodes).toContain("PREREG_HASH_MISMATCH");
      expect(decision.reasonCodes).toContain("DEVIATION_CHAIN_BROKEN");
    });
  });

  describe("2. Crucial Invariant: Ineligible Evidence Cannot Alter Aggregation", () => {
    it("proves quarantined and rejected evidence is excluded from aggregation while remaining stored", async () => {
      const service = createSemantiqApplicationService();

      const targetClaimId = "claim_robustness_test_001";

      // 1. Register an eligible supporting replication record
      await service.studies.registerReplication({
        replicationId: "rep_eligible_support_001",
        originalStudyId: "study_orig_001",
        targetClaimId,
        replicatingOrganizationId: "org_mit_csail",
        replicatingStudyId: "study_rep_001",
        outcome: "support",
        effectDeltaObserved: 0.25,
        baselineDeltaTarget: 0.2,
        contextDiversity: {
          environmentProviders: ["docker_local"],
          modelFamilies: ["gpt-4"],
          platforms: ["linux"],
          diversityScore: 0.8
        },
        counterevidenceObserved: false,
        conductedAt: "2026-08-18T10:00:00.000Z",
        eligibilityVerdict: "eligible",
        epistemicDisclaimer:
          "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth."
      });

      // 2. Register an eligible_with_caveats supporting replication record
      await service.studies.registerReplication({
        replicationId: "rep_eligible_caveats_002",
        originalStudyId: "study_orig_001",
        targetClaimId,
        replicatingOrganizationId: "org_cmu_sei",
        replicatingStudyId: "study_rep_002",
        outcome: "support",
        effectDeltaObserved: 0.22,
        baselineDeltaTarget: 0.2,
        contextDiversity: {
          environmentProviders: ["podman_rootless"],
          modelFamilies: ["claude-3"],
          platforms: ["darwin"],
          diversityScore: 0.8
        },
        counterevidenceObserved: false,
        conductedAt: "2026-08-18T11:00:00.000Z",
        eligibilityVerdict: "eligible_with_caveats",
        epistemicDisclaimer:
          "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth."
      });

      // 3. Register a QUARANTINED counterevidence record (e.g. material deviation / failed negative control)
      await service.studies.registerReplication({
        replicationId: "rep_quarantined_counter_003",
        originalStudyId: "study_orig_001",
        targetClaimId,
        replicatingOrganizationId: "org_unverified_lab",
        replicatingStudyId: "study_rep_003",
        outcome: "counter",
        effectDeltaObserved: -0.1,
        baselineDeltaTarget: 0.2,
        contextDiversity: {
          environmentProviders: ["unverified_cloud"],
          modelFamilies: ["llama-3"],
          platforms: ["windows"],
          diversityScore: 0.5
        },
        counterevidenceObserved: true,
        counterevidenceDetails: "Failed negative controls and omitted matching dimensions",
        conductedAt: "2026-08-18T12:00:00.000Z",
        eligibilityVerdict: "quarantined",
        epistemicDisclaimer:
          "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth."
      });

      // 4. Register a REJECTED counterevidence record (tampered bundle / falsified hash)
      await service.studies.registerReplication({
        replicationId: "rep_rejected_counter_004",
        originalStudyId: "study_orig_001",
        targetClaimId,
        replicatingOrganizationId: "org_malicious",
        replicatingStudyId: "study_rep_004",
        outcome: "counter",
        effectDeltaObserved: -0.5,
        baselineDeltaTarget: 0.2,
        contextDiversity: {
          environmentProviders: ["host_raw"],
          modelFamilies: ["custom_model"],
          platforms: ["unknown"],
          diversityScore: 0.2
        },
        counterevidenceObserved: true,
        counterevidenceDetails: "Tampered bundle Merkle root",
        conductedAt: "2026-08-18T13:00:00.000Z",
        eligibilityVerdict: "rejected",
        epistemicDisclaimer:
          "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth."
      });

      // 5. Aggregate Replications
      const aggregation = await service.studies.aggregateReplicationsForClaim(targetClaimId);

      // Verify that ineligible submissions did NOT corrupt aggregation metrics:
      expect(aggregation.totalReplicationsCount).toBe(4);
      expect(aggregation.admissibleReplicationsCount).toBe(2);
      expect(aggregation.ineligibleSubmissionsCount).toBe(2);
      expect(aggregation.supportCount).toBe(2); // Only the 2 eligible records
      expect(aggregation.counterCount).toBe(0); // Quarantined and rejected counter records are excluded from math!
      expect(aggregation.aggregatedEvidenceGrade).toBe("E4_CROSS_CONTEXT_ROBUST");

      // Verify that all 4 records remain stored, inspectable, and auditable
      const allStored = await service.studies.listReplicationsForClaim(targetClaimId);
      expect(allStored.length).toBe(4);
      expect(allStored.some((r) => r.replicationId === "rep_quarantined_counter_003")).toBe(true);
      expect(allStored.some((r) => r.replicationId === "rep_rejected_counter_004")).toBe(true);
    });
  });

  describe("3. StudiesService Eligibility Gate Integration", () => {
    it("evaluates and records eligibility decisions in service ledger", async () => {
      const service = createSemantiqApplicationService();

      const decision = await service.studies.evaluateEvidenceEligibility({
        manifest: baseManifest,
        protocol: baseProtocol,
        bundleVerification: validBundleVerification,
        deviations: [],
        deviationChainValid: true,
        organization: verifiedOrg
      });

      expect(decision.verdict).toBe("eligible");

      const fetched = await service.studies.getEligibilityDecision(decision.decisionId);
      expect(fetched?.decisionId).toBe(decision.decisionId);

      const list = await service.studies.listEligibilityDecisions({
        organizationId: "org_stanford_nlp"
      });
      expect(list.length).toBeGreaterThanOrEqual(1);
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  StudyExecutionManifestValidator,
  StudyExecutionManifestRegistry,
  EPISTEMIC_MANIFEST_DISCLAIMER,
  type StudyExecutionManifest
} from "../../packages/evidence/src/execution-manifests/index.js";
import {
  StudyProtocolGenerator
} from "../../packages/evidence/src/study-protocols/index.js";
import { createSemantiqApplicationService } from "../../packages/semantiq/src/services/index.js";
import { RelationType } from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Study Execution Manifest & Ingestion (Prompt 29)", () => {
  const protocolGenerator = new StudyProtocolGenerator();
  const manifestValidator = new StudyExecutionManifestValidator();
  const manifestRegistry = new StudyExecutionManifestRegistry();

  const baseProtocol = protocolGenerator.freezeProtocol(
    protocolGenerator.generateProtocolForRelation({
      protocolId: "proto_mitigation_eval_001",
      title: "Agent Mitigation Robustness Protocol",
      targetRelationId: "rel_mitigation_001",
      targetPatternId: "DP-001",
      relationType: RelationType.SUPPORTS
    })
  );

  describe("1. Manifest Validation & Ingestion Statuses", () => {
    it("accepts conformant execution manifest meeting all protocol requirements", () => {
      const validManifest: StudyExecutionManifest = {
        manifestId: "man_exec_001",
        studyId: "study_exec_001",
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
        thresholdsUsed: { accuracy: 0.80 },
        observedInstrumentation: {
          traceCollectionMode: "buffered_event_stream",
          samplingRateHz: 100,
          isolationGuarantees: ["deterministic_seed"]
        },
        executedNegativeControls: baseProtocol.negativeControls.map((c) => ({
          controlId: c.controlId,
          executed: true,
          deltaObserved: 0.01,
          boundExpected: c.expectedDeltaBound,
          passedBound: true
        })),
        missingDataReport: {
          totalExpectedObservations: 100,
          observedObservations: 98,
          missingObservationsCount: 2,
          missingDataRatio: 0.02,
          missingReasons: {}
        },
        analysisParameters: { statisticalTest: "exact_sign_test" },
        softwareVersion: "1.0.0",
        partnerAttestation: {
          attestedBy: "Dr. Lead Investigator",
          role: "academic_collaborator",
          signatureHex: "0x1234567890abcdef",
          attestationStatement: "I attest that this execution faithfully followed the pre-registered protocol.",
          timestamp: "2026-08-18T11:05:00.000Z"
        },
        manifestSha256: "manifest_hash_001",
        epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
      };

      const result = manifestValidator.validateAndIngestManifest(validManifest, baseProtocol);
      expect(result.status).toBe("accepted");
      expect(result.preregistrationMatch).toBe(true);
      expect(result.matchingDimensionsMatch).toBe(true);
      expect(result.negativeControlsPassed).toBe(true);
      expect(result.samplePowerSatisfied).toBe(true);
      expect(result.adherenceScore).toBe(1.0);
      expect(result.epistemicDisclaimer).toBe(EPISTEMIC_MANIFEST_DISCLAIMER);
    });

    it("flags manifest when sample power is minimum or mild missing data occurs", () => {
      const flaggedManifest: StudyExecutionManifest = {
        manifestId: "man_exec_flagged_001",
        studyId: "study_exec_002",
        organizationId: "org_mit_csail",
        protocolId: baseProtocol.protocolId,
        protocolVersion: baseProtocol.version,
        preregistrationFingerprint: baseProtocol.preregistrationHash,
        startedAt: "2026-08-18T10:00:00.000Z",
        completedAt: "2026-08-18T11:00:00.000Z",
        environmentFingerprint: "env_hash_001",
        modelFingerprint: "model_hash_001",
        datasetFingerprint: "dataset_hash_001",
        traceSchemaFingerprint: "trace_hash_001",
        treatmentRunsCount: 10,
        controlRunsCount: 10,
        matchedPairsCount: 10, // meets minimum 8 but below recommended 20
        evaluationIds: ["eval_003"],
        matchingDimensionsUsed: baseProtocol.matchingDimensions,
        thresholdsUsed: { accuracy: 0.80 },
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
          observedObservations: 92,
          missingObservationsCount: 8,
          missingDataRatio: 0.08, // 8% missing data
          missingReasons: {}
        },
        analysisParameters: {},
        softwareVersion: "1.0.0",
        partnerAttestation: {
          attestedBy: "MIT Lead",
          role: "academic_collaborator",
          attestationStatement: "Execution verified.",
          timestamp: "2026-08-18T11:05:00.000Z"
        },
        manifestSha256: "manifest_hash_002",
        epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
      };

      const result = manifestValidator.validateAndIngestManifest(flaggedManifest, baseProtocol);
      expect(result.status).toBe("flagged");
      expect(result.flags.length).toBeGreaterThanOrEqual(1);
    });

    it("quarantines manifest when required matching dimension is omitted or negative control fails", () => {
      const quarantinedManifest: StudyExecutionManifest = {
        manifestId: "man_exec_quarantined_001",
        studyId: "study_exec_003",
        organizationId: "org_partner_gamma",
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
        evaluationIds: ["eval_004"],
        matchingDimensionsUsed: ["environment", "model"], // omitted tools, memory, resource_pressure
        thresholdsUsed: {},
        observedInstrumentation: {
          traceCollectionMode: "buffered_event_stream",
          samplingRateHz: 100,
          isolationGuarantees: []
        },
        executedNegativeControls: baseProtocol.negativeControls.map((c) => ({
          controlId: c.controlId,
          executed: true,
          deltaObserved: 0.15, // FAILS bound 0.05
          boundExpected: c.expectedDeltaBound,
          passedBound: false
        })),
        missingDataReport: {
          totalExpectedObservations: 100,
          observedObservations: 100,
          missingObservationsCount: 0,
          missingDataRatio: 0.0,
          missingReasons: {}
        },
        analysisParameters: {},
        softwareVersion: "1.0.0",
        partnerAttestation: {
          attestedBy: "Partner Gamma Auditor",
          role: "audit_partner",
          attestationStatement: "Claims full compliance despite omissions.",
          timestamp: "2026-08-18T11:05:00.000Z"
        },
        manifestSha256: "manifest_hash_003",
        epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
      };

      // Invariant: Attestation alone DOES NOT promote evidence or bypass quarantine
      const result = manifestValidator.validateAndIngestManifest(quarantinedManifest, baseProtocol);
      expect(result.status).toBe("quarantined");
      expect(result.violations.some((v) => v.includes("Missing required matching dimension"))).toBe(true);
      expect(result.violations.some((v) => v.includes("failed bound"))).toBe(true);
    });

    it("rejects manifest with preregistration fingerprint mismatch", () => {
      const rejectedManifest: StudyExecutionManifest = {
        manifestId: "man_exec_rejected_001",
        studyId: "study_exec_004",
        organizationId: "org_untrusted",
        protocolId: baseProtocol.protocolId,
        protocolVersion: baseProtocol.version,
        preregistrationFingerprint: "falsified_hash_000000000000000000000000000000000000000000000000000000",
        startedAt: "2026-08-18T10:00:00.000Z",
        completedAt: "2026-08-18T11:00:00.000Z",
        environmentFingerprint: "env_001",
        modelFingerprint: "mod_001",
        datasetFingerprint: "data_001",
        traceSchemaFingerprint: "trace_001",
        treatmentRunsCount: 20,
        controlRunsCount: 20,
        matchedPairsCount: 20,
        evaluationIds: [],
        matchingDimensionsUsed: baseProtocol.matchingDimensions,
        thresholdsUsed: {},
        observedInstrumentation: {
          traceCollectionMode: "buffered_event_stream",
          samplingRateHz: 100,
          isolationGuarantees: []
        },
        executedNegativeControls: [],
        missingDataReport: {
          totalExpectedObservations: 100,
          observedObservations: 100,
          missingObservationsCount: 0,
          missingDataRatio: 0.0,
          missingReasons: {}
        },
        analysisParameters: {},
        softwareVersion: "1.0.0",
        partnerAttestation: {
          attestedBy: "Untrusted Operator",
          role: "benchmark_contributor",
          attestationStatement: "Signed.",
          timestamp: "2026-08-18T11:05:00.000Z"
        },
        manifestSha256: "manifest_hash_004",
        epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
      };

      const result = manifestValidator.validateAndIngestManifest(rejectedManifest, baseProtocol);
      expect(result.status).toBe("rejected");
      expect(result.preregistrationMatch).toBe(false);
      expect(result.violations.some((v) => v.includes("Preregistration hash mismatch"))).toBe(true);
    });
  });

  describe("2. Unified Application Service Execution Manifest Integration", () => {
    it("ingests and queries execution manifests via StudiesService", async () => {
      const service = createSemantiqApplicationService();

      const protocol = await service.studies.generateStudyProtocol({
        title: "Service Manifest Ingestion Protocol",
        targetRelationId: "rel_manifest_srv_001",
        targetPatternId: "DP-001"
      });
      const frozenProtocol = await service.studies.freezeStudyProtocol(protocol);

      const manifest: StudyExecutionManifest = {
        manifestId: "man_srv_001",
        studyId: "study_srv_001",
        organizationId: "org_stanford_nlp",
        protocolId: frozenProtocol.protocolId,
        protocolVersion: frozenProtocol.version,
        preregistrationFingerprint: frozenProtocol.preregistrationHash,
        startedAt: "2026-08-18T10:00:00.000Z",
        completedAt: "2026-08-18T11:00:00.000Z",
        environmentFingerprint: "env_001",
        modelFingerprint: "mod_001",
        datasetFingerprint: "data_001",
        traceSchemaFingerprint: "trace_001",
        treatmentRunsCount: 20,
        controlRunsCount: 20,
        matchedPairsCount: 20,
        evaluationIds: ["eval_srv_001"],
        matchingDimensionsUsed: frozenProtocol.matchingDimensions,
        thresholdsUsed: {},
        observedInstrumentation: {
          traceCollectionMode: "buffered_event_stream",
          samplingRateHz: 100,
          isolationGuarantees: []
        },
        executedNegativeControls: frozenProtocol.negativeControls.map((c) => ({
          controlId: c.controlId,
          executed: true,
          deltaObserved: 0.01,
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
        analysisParameters: {},
        softwareVersion: "1.0.0",
        partnerAttestation: {
          attestedBy: "Service Test Lead",
          role: "academic_collaborator",
          attestationStatement: "Fully compliant.",
          timestamp: "2026-08-18T11:05:00.000Z"
        },
        manifestSha256: "hash_srv_001",
        epistemicDisclaimer: EPISTEMIC_MANIFEST_DISCLAIMER
      };

      const ingestionResult = await service.studies.ingestExecutionManifest(manifest, frozenProtocol);
      expect(ingestionResult.status).toBe("accepted");

      const fetched = await service.studies.getExecutionManifest("man_srv_001");
      expect(fetched?.manifestId).toBe("man_srv_001");

      const list = await service.studies.listExecutionManifests({ status: "accepted" });
      expect(list.length).toBeGreaterThanOrEqual(1);
    });
  });
});

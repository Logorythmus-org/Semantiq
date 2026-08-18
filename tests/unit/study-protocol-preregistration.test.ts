import { describe, it, expect } from "vitest";
import {
  StudyProtocolGenerator,
  ProtocolDeviationLedger,
  EPISTEMIC_PREREGISTRATION_DISCLAIMER
} from "../../packages/evidence/src/study-protocols/index.js";
import { createSemantiqApplicationService } from "../../packages/semantiq/src/services/index.js";
import { RelationType } from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Study Design & Pre-registration Protocols (Prompt 28)", () => {
  const generator = new StudyProtocolGenerator();
  const ledger = new ProtocolDeviationLedger();

  describe("1. Deterministic Study Protocol Generation & Pre-registration Freezing", () => {
    it("deterministically generates complete study protocol with all required components", () => {
      const protocol = generator.generateProtocolForRelation({
        title: "Mitigation Circuit Breaker Efficacy Protocol",
        targetRelationId: "rel_mitigation_supports_safety",
        targetPatternId: "DP-001",
        relationType: RelationType.SUPPORTS,
        primaryMetric: "recovery_rate",
        targetEffectDelta: 0.25
      });

      expect(protocol.protocolId).toContain("proto_");
      expect(protocol.researchQuestion).toContain("DP-001");
      expect(protocol.exposureDefinition.treatmentCondition).toContain("DP-001 active");
      expect(protocol.outcomeDefinition.primaryMetric).toBe("recovery_rate");
      expect(protocol.matchingDimensions).toContain("environment");
      expect(protocol.matchingDimensions).toContain("model");
      expect(protocol.metrics.length).toBeGreaterThanOrEqual(3);
      expect(protocol.negativeControls.length).toBeGreaterThanOrEqual(2);
      expect(protocol.sampleGuidance.minimumPairsRequired).toBe(8);
      expect(protocol.status).toBe("draft");
      expect(protocol.preregistrationHash).toHaveLength(64);
      expect(protocol.epistemicDisclaimer).toBe(EPISTEMIC_PREREGISTRATION_DISCLAIMER);
    });

    it("freezes protocol and computes immutable timestamped preregistration hash", () => {
      const draft = generator.generateProtocolForRelation({
        title: "Anti-Gaming Robustness Protocol",
        targetRelationId: "rel_evaluates_anti_gaming",
        targetPatternId: "TP-002"
      });

      const frozen = generator.freezeProtocol(draft);
      expect(frozen.status).toBe("frozen");
      expect(frozen.frozenAt).toBeDefined();
      expect(frozen.preregistrationHash).toHaveLength(64);
      expect(frozen.preregistrationHash).not.toBe(draft.preregistrationHash);
    });
  });

  describe("2. Append-Only Deviation Ledger & Evidence Level Capping", () => {
    it("maintains cryptographic hash chain across recorded deviations", () => {
      const protocol = generator.freezeProtocol(
        generator.generateProtocolForRelation({
          protocolId: "proto_dev_chain_001",
          title: "Hash Chain Verification Protocol",
          targetRelationId: "rel_001",
          targetPatternId: "DP-002"
        })
      );
      ledger.registerProtocol(protocol);

      const dev1 = ledger.recordDeviation({
        protocolId: "proto_dev_chain_001",
        timing: "pre_execution",
        severity: "minor",
        description: "Clarified token limit parameters before runs.",
        rationale: "Align with model provider limits.",
        recordedBy: "auditor_alice"
      });
      expect(dev1.previousDeviationHash).toBe("GENESIS_DEVIATION_HASH");

      const dev2 = ledger.recordDeviation({
        protocolId: "proto_dev_chain_001",
        timing: "during_execution",
        severity: "material",
        description: "Dropped 1 non-responsive tool endpoint.",
        rationale: "Network outage on third-party tool sandbox.",
        recordedBy: "auditor_alice"
      });
      expect(dev2.previousDeviationHash).toBe(dev1.deviationHash);

      const isValidChain = ledger.verifyDeviationChain("proto_dev_chain_001");
      expect(isValidChain).toBe(true);
    });

    it("caps evidence level to CAP_E2_LOCAL_CONSISTENT when material deviations occur during execution", () => {
      const protocol = generator.freezeProtocol(
        generator.generateProtocolForRelation({
          protocolId: "proto_cap_001",
          title: "Material Deviation Cap Protocol",
          targetRelationId: "rel_002",
          targetPatternId: "DP-003"
        })
      );
      ledger.registerProtocol(protocol);

      ledger.recordDeviation({
        protocolId: "proto_cap_001",
        timing: "during_execution",
        severity: "material",
        description: "Switched secondary metric threshold due to server variance.",
        rationale: "Mitigate timeout issues.",
        recordedBy: "lead_researcher"
      });

      const summary = ledger.evaluateEvidenceCap("proto_cap_001");
      expect(summary.evidenceLevelCap).toBe("CAP_E2_LOCAL_CONSISTENT");
      expect(summary.materialDeviationsCount).toBe(1);
      expect(summary.capReason).toContain("material deviation");
    });

    it("caps evidence level to CAP_E1_CONTESTED when critical deviation occurs or protocol was not frozen", () => {
      // 1. Unfrozen draft protocol
      const draftProtocol = generator.generateProtocolForRelation({
        protocolId: "proto_unfrozen_001",
        title: "Unfrozen Protocol Test",
        targetRelationId: "rel_003",
        targetPatternId: "DP-004"
      });
      ledger.registerProtocol(draftProtocol);

      const summary1 = ledger.evaluateEvidenceCap("proto_unfrozen_001");
      expect(summary1.evidenceLevelCap).toBe("CAP_E1_CONTESTED");
      expect(summary1.capReason).toContain("not frozen");

      // 2. Critical deviation on frozen protocol
      const frozenProtocol = generator.freezeProtocol(
        generator.generateProtocolForRelation({
          protocolId: "proto_critical_001",
          title: "Critical Deviation Test",
          targetRelationId: "rel_004",
          targetPatternId: "DP-005"
        })
      );
      ledger.registerProtocol(frozenProtocol);

      ledger.recordDeviation({
        protocolId: "proto_critical_001",
        timing: "post_hoc",
        severity: "critical",
        description: "Post-hoc exclusion of 40% failing cases from outcome analysis.",
        rationale: "Unanticipated edge cases.",
        recordedBy: "external_auditor"
      });

      const summary2 = ledger.evaluateEvidenceCap("proto_critical_001");
      expect(summary2.evidenceLevelCap).toBe("CAP_E1_CONTESTED");
      expect(summary2.criticalDeviationsCount).toBe(1);
      expect(summary2.capReason).toContain("critical deviation");
    });
  });

  describe("3. Unified Application Service Protocol Integration", () => {
    it("generates, freezes, records deviations, and evaluates protocol caps via StudiesService", async () => {
      const service = createSemantiqApplicationService();

      const protocol = await service.studies.generateStudyProtocol({
        title: "Service Protocol Workflow",
        targetRelationId: "rel_service_001",
        targetPatternId: "DP-001"
      });
      expect(protocol.status).toBe("draft");

      const frozen = await service.studies.freezeStudyProtocol(protocol);
      expect(frozen.status).toBe("frozen");

      await service.studies.recordProtocolDeviation({
        protocolId: frozen.protocolId,
        timing: "pre_execution",
        severity: "minor",
        description: "Minor prompt formatting normalization.",
        rationale: "Pre-execution cleanup.",
        recordedBy: "auditor"
      });

      const execSummary = await service.studies.evaluateProtocolExecution(frozen.protocolId);
      expect(execSummary.evidenceLevelCap).toBe("NO_CAP");
      expect(execSummary.preregistrationFrozen).toBe(true);
    });
  });
});

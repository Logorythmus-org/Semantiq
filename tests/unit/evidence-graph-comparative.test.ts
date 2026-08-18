import { describe, expect, it } from "vitest";
import {
  EPISTEMIC_ABSENCE_DISCLAIMER,
  EvidenceGraphEngine,
  RelationStrengthLevel
} from "../../packages/evidence/src/index.js";
import {
  EvidenceConfidence,
  RelationType
} from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Cross-Run Evidence Graph & Comparative Query Architecture", () => {
  const engine = new EvidenceGraphEngine();

  it("handles unobserved relations as 'no_observation' and R0 strength without treating absence as counterevidence", () => {
    const result = engine.executeComparativeQuery({
      sourceId: "DP-001",
      targetId: "FP-003",
      relationType: RelationType.REFUTES
    });

    expect(result.status).toBe("no_observation");
    expect(result.strength).toBe(RelationStrengthLevel.R0);
    expect(result.strengthScore).toBe(0.0);
    expect(result.supportingObservationsCount).toBe(0);
    expect(result.refutingObservationsCount).toBe(0);
    expect(result.epistemicDisclaimer).toBe(EPISTEMIC_ABSENCE_DISCLAIMER);
    expect(result.epistemicDisclaimer).toBe("Absence of observation is not counterevidence.");
  });

  it("calculates R1 strength for single case observation", () => {
    engine.addObservation({
      relationId: "rel_DP-001_FP-003",
      sourceId: "DP-001",
      targetId: "FP-003",
      relationType: RelationType.REFUTES,
      polarity: "SUPPORTS", // Observation supports that DP-001 refutes FP-003
      runId: "run_001",
      caseId: "case_01",
      modelId: "model_claude_35",
      environmentId: "env_docker_linux",
      confidence: EvidenceConfidence.EMPIRICAL
    });

    const result = engine.executeComparativeQuery({
      sourceId: "DP-001",
      targetId: "FP-003"
    });

    expect(result.status).toBe("supported");
    expect(result.strength).toBe(RelationStrengthLevel.R1);
    expect(result.strengthScore).toBe(0.25);
    expect(result.supportingObservationsCount).toBe(1);
    expect(result.refutingObservationsCount).toBe(0);
  });

  it("calculates R2 strength for multi-case observation in single environment", () => {
    engine.addObservation({
      relationId: "rel_DP-001_FP-003",
      sourceId: "DP-001",
      targetId: "FP-003",
      relationType: RelationType.REFUTES,
      polarity: "SUPPORTS",
      runId: "run_002",
      caseId: "case_02",
      modelId: "model_claude_35",
      environmentId: "env_docker_linux",
      confidence: EvidenceConfidence.EMPIRICAL
    });

    const result = engine.executeComparativeQuery({
      sourceId: "DP-001",
      targetId: "FP-003"
    });

    expect(result.status).toBe("supported");
    expect(result.strength).toBe(RelationStrengthLevel.R2);
    expect(result.strengthScore).toBe(0.5);
    expect(result.supportingObservationsCount).toBe(2);
  });

  it("calculates R3 strength across multiple cases and multiple environments/models", () => {
    engine.addObservation({
      relationId: "rel_DP-001_FP-003",
      sourceId: "DP-001",
      targetId: "FP-003",
      relationType: RelationType.REFUTES,
      polarity: "SUPPORTS",
      runId: "run_003",
      caseId: "case_03",
      modelId: "model_gpt4o",
      environmentId: "env_k8s_container",
      confidence: EvidenceConfidence.EMPIRICAL
    });

    const result = engine.executeComparativeQuery({
      sourceId: "DP-001",
      targetId: "FP-003"
    });

    expect(result.status).toBe("supported");
    expect(result.strength).toBe(RelationStrengthLevel.R3);
    expect(result.strengthScore).toBe(0.75);
    expect(result.caseMatrix.coverageSummary.uniqueModelsCount).toBe(2);
    expect(result.caseMatrix.coverageSummary.uniqueEnvironmentsCount).toBe(2);
  });

  it("calculates R4 deterministic strength across >= 3 models and >= 3 environments", () => {
    engine.addObservation({
      relationId: "rel_DP-001_FP-003",
      sourceId: "DP-001",
      targetId: "FP-003",
      relationType: RelationType.REFUTES,
      polarity: "SUPPORTS",
      runId: "run_004",
      caseId: "case_04",
      modelId: "model_gemini_pro",
      environmentId: "env_baremetal_linux",
      confidence: EvidenceConfidence.DETERMINISTIC
    });

    const result = engine.executeComparativeQuery({
      sourceId: "DP-001",
      targetId: "FP-003"
    });

    expect(result.status).toBe("supported");
    expect(result.strength).toBe(RelationStrengthLevel.R4);
    expect(result.strengthScore).toBe(1.0);
    expect(result.caseMatrix.coverageSummary.uniqueModelsCount).toBe(3);
    expect(result.caseMatrix.coverageSummary.uniqueEnvironmentsCount).toBe(3);
  });

  it("detects mixed relation status when counterevidence is observed", () => {
    engine.addObservation({
      relationId: "rel_DP-001_FP-003",
      sourceId: "DP-001",
      targetId: "FP-003",
      relationType: RelationType.REFUTES,
      polarity: "REFUTES", // Counterevidence: DP-001 did NOT refute FP-003 in this case
      runId: "run_counter_01",
      caseId: "case_adversarial_01",
      modelId: "model_test",
      environmentId: "env_docker_linux",
      confidence: EvidenceConfidence.EMPIRICAL
    });

    const result = engine.executeComparativeQuery({
      sourceId: "DP-001",
      targetId: "FP-003"
    });

    expect(result.status).toBe("mixed");
    expect(result.supportingObservationsCount).toBe(4);
    expect(result.refutingObservationsCount).toBe(1);
  });
});

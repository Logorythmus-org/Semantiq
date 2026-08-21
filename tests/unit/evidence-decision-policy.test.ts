import { describe, expect, it } from "vitest";
import {
  EPISTEMIC_GOVERNANCE_DISCLAIMER,
  EvidenceDecisionPolicy,
  RelationStrengthLevel
} from "../../packages/evidence/src/index.js";

describe("Deterministic Evidence Governance Decision Policy", () => {
  const policy = new EvidenceDecisionPolicy("1.0.0");

  it("evaluates verdict 'promote' when statistical, robustness, and stability criteria are robustly met", () => {
    const decision = policy.evaluate({
      targetId: "DP-001_FP-003",
      statisticalGrade: "GRADE_A",
      pairCount: 15,
      robustnessGrade: "ROBUST_GRADE_A",
      specificationStability: 0.98,
      usableSpecifications: 3,
      lowPowerFraction: 0.0,
      negativeControlFailures: 0,
      relationStatus: "supported",
      relationStrength: RelationStrengthLevel.R3
    });

    expect(decision.verdict).toBe("promote");
    expect(decision.confidenceScore).toBeGreaterThanOrEqual(0.85);
    expect(decision.blockingReasons.length).toBe(0);
    expect(decision.ruleEvaluations.every((r) => r.passed)).toBe(true);
    expect(decision.epistemicDisclaimer).toBe(EPISTEMIC_GOVERNANCE_DISCLAIMER);
    expect(decision.epistemicDisclaimer).toBe(
      "Promotion indicates evidence-governance strength, not scientific proof."
    );
  });

  it("evaluates verdict 'hold' when evidence is promising but sample size or stability is intermediate", () => {
    const decision = policy.evaluate({
      targetId: "DP-002_FP-004",
      statisticalGrade: "GRADE_C",
      pairCount: 6,
      robustnessGrade: "ROBUST_GRADE_B",
      specificationStability: 0.8,
      usableSpecifications: 2,
      lowPowerFraction: 0.1,
      negativeControlFailures: 0,
      relationStatus: "supported"
    });

    expect(decision.verdict).toBe("hold");
    expect(decision.confidenceScore).toBe(0.6);
    expect(decision.recommendations.length).toBeGreaterThan(0);
  });

  it("evaluates verdict 'downgrade' when negative controls fail or counterevidence dominates", () => {
    const decision = policy.evaluate({
      targetId: "DP-003_FP-005",
      statisticalGrade: "GRADE_B",
      pairCount: 12,
      robustnessGrade: "FRAGILE",
      specificationStability: 0.4,
      usableSpecifications: 2,
      lowPowerFraction: 0.0,
      negativeControlFailures: 1, // Failed placebo test
      relationStatus: "counterevidence_only"
    });

    expect(decision.verdict).toBe("downgrade");
    expect(decision.blockingReasons.length).toBeGreaterThanOrEqual(1);
    expect(decision.ruleEvaluations.find((r) => r.ruleId === "POL-002")?.passed).toBe(false);
  });

  it("evaluates verdict 'insufficient' when pair count is low or power fraction is deficient", () => {
    const decision = policy.evaluate({
      targetId: "DP-004_FP-006",
      statisticalGrade: "INSUFFICIENT_POWER",
      pairCount: 2,
      robustnessGrade: "FRAGILE",
      specificationStability: 0.0,
      usableSpecifications: 1,
      lowPowerFraction: 0.8,
      negativeControlFailures: 0
    });

    expect(decision.verdict).toBe("insufficient");
    expect(decision.confidenceScore).toBe(0.1);
    expect(decision.blockingReasons).toContain(
      "Insufficient sample size or power to draw evidence conclusions."
    );
  });
});

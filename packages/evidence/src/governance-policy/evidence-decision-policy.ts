/**
 * @package @semantiq/evidence
 * Deterministic Versioned Evidence Decision Policy
 *
 * Invariants:
 * 1. Promotion = evidence-governance strength, not scientific proof.
 * 2. Decision logic is strictly deterministic and version-tracked.
 * 3. All rule evaluations and blocking reasons are transparently recorded.
 */

import { computeSha256 } from "../../../sandbox-contracts/src/index.js";
import {
  type EvidenceGovernanceDecision,
  type EvidenceGovernanceInputs,
  type EvidenceGovernanceVerdict,
  type PolicyRuleEvaluation,
  EPISTEMIC_GOVERNANCE_DISCLAIMER
} from "./types.js";

export class EvidenceDecisionPolicy {
  public static readonly CURRENT_POLICY_VERSION = "1.0.0";

  constructor(public readonly version: string = EvidenceDecisionPolicy.CURRENT_POLICY_VERSION) {}

  /**
   * Deterministically evaluates evidence inputs to produce a governance verdict:
   * 'promote' | 'hold' | 'downgrade' | 'insufficient'
   */
  public evaluate(inputs: EvidenceGovernanceInputs): EvidenceGovernanceDecision {
    const rules: PolicyRuleEvaluation[] = [];
    const blockingReasons: string[] = [];
    const recommendations: string[] = [];

    // Rule 1: Sample Power & Adequacy
    const isSampleAdequate =
      inputs.pairCount >= 5 &&
      inputs.lowPowerFraction <= 0.4 &&
      inputs.statisticalGrade !== "INSUFFICIENT_POWER";
    rules.push({
      ruleId: "POL-001",
      ruleName: "Sample Adequacy",
      passed: isSampleAdequate,
      requirement: "pairCount >= 5 and lowPowerFraction <= 0.40",
      observed: `pairCount=${inputs.pairCount}, lowPowerFraction=${inputs.lowPowerFraction}, grade=${inputs.statisticalGrade}`,
      isHardBlocker: true
    });
    if (!isSampleAdequate) {
      blockingReasons.push("Insufficient sample size or power to draw evidence conclusions.");
      recommendations.push("Collect additional matched runs across target cases and environments.");
    }

    // Rule 2: Negative Control Integrity
    const passedNegativeControls = inputs.negativeControlFailures === 0;
    rules.push({
      ruleId: "POL-002",
      ruleName: "Negative Control Validity",
      passed: passedNegativeControls,
      requirement: "negativeControlFailures === 0",
      observed: `negativeControlFailures=${inputs.negativeControlFailures}`,
      isHardBlocker: true
    });
    if (!passedNegativeControls) {
      blockingReasons.push(
        `Failed ${inputs.negativeControlFailures} negative control tests (placebo metrics detected false positive shift).`
      );
      recommendations.push("Investigate confounders causing placebo metric divergence.");
    }

    // Rule 3: Counterevidence Non-Dominance
    const noCounterevidenceDominance =
      inputs.relationStatus !== "counterevidence_only" && inputs.robustnessGrade !== "FRAGILE";
    rules.push({
      ruleId: "POL-003",
      ruleName: "Counterevidence Absence",
      passed: noCounterevidenceDominance,
      requirement: "relationStatus != 'counterevidence_only' and robustnessGrade != 'FRAGILE'",
      observed: `relationStatus=${inputs.relationStatus ?? "unspecified"}, robustnessGrade=${inputs.robustnessGrade}`,
      isHardBlocker: true
    });
    if (!noCounterevidenceDominance) {
      blockingReasons.push("Empirical counterevidence or fragile robustness detected.");
      recommendations.push("Review failure traces where hypothesis was refuted.");
    }

    // Rule 4: Statistical Evidence Strength
    const isStatisticallyStrong =
      inputs.statisticalGrade === "GRADE_A" || inputs.statisticalGrade === "GRADE_B";
    rules.push({
      ruleId: "POL-004",
      ruleName: "Statistical Grade",
      passed: isStatisticallyStrong,
      requirement: "statisticalGrade in ['GRADE_A', 'GRADE_B']",
      observed: `statisticalGrade=${inputs.statisticalGrade}`,
      isHardBlocker: false
    });
    if (!isStatisticallyStrong) {
      recommendations.push(
        "Increase matched cohort power to achieve statistical GRADE_A or GRADE_B."
      );
    }

    // Rule 5: Robustness & Direction Stability
    const isRobustAndStable =
      (inputs.robustnessGrade === "ROBUST_GRADE_A" ||
        inputs.robustnessGrade === "ROBUST_GRADE_B") &&
      inputs.specificationStability >= 0.85 &&
      inputs.usableSpecifications >= 2;
    rules.push({
      ruleId: "POL-005",
      ruleName: "Specification Curve Stability",
      passed: isRobustAndStable,
      requirement:
        "robustness in ['ROBUST_GRADE_A', 'ROBUST_GRADE_B'], stability >= 0.85, usableSpecs >= 2",
      observed: `robustness=${inputs.robustnessGrade}, stability=${inputs.specificationStability}, usableSpecs=${inputs.usableSpecifications}`,
      isHardBlocker: false
    });
    if (!isRobustAndStable) {
      recommendations.push(
        "Run additional specification variations to verify stability across configurations."
      );
    }

    // Determine Verdict
    let verdict: EvidenceGovernanceVerdict = "hold";
    let confidenceScore = 0.5;

    if (!isSampleAdequate) {
      verdict = "insufficient";
      confidenceScore = 0.1;
    } else if (!passedNegativeControls || !noCounterevidenceDominance) {
      verdict = "downgrade";
      confidenceScore = 0.8;
    } else if (
      isStatisticallyStrong &&
      isRobustAndStable &&
      inputs.pairCount >= 10 &&
      (inputs.statisticalGrade === "GRADE_A" || inputs.robustnessGrade === "ROBUST_GRADE_A")
    ) {
      verdict = "promote";
      confidenceScore = 0.95;
    } else if (isStatisticallyStrong && isRobustAndStable) {
      verdict = "promote";
      confidenceScore = 0.85;
    } else {
      verdict = "hold";
      confidenceScore = 0.6;
    }

    const decisionId = `dec_${computeSha256(`${inputs.targetId}:${this.version}:${verdict}:${Date.now()}`).substring(0, 16)}`;

    return {
      decisionId,
      targetId: inputs.targetId,
      policyVersion: this.version,
      verdict,
      confidenceScore,
      ruleEvaluations: Object.freeze(rules),
      blockingReasons: Object.freeze(blockingReasons),
      recommendations: Object.freeze(recommendations),
      epistemicDisclaimer: EPISTEMIC_GOVERNANCE_DISCLAIMER,
      evaluatedAt: new Date().toISOString()
    };
  }
}

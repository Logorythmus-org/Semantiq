/**
 * @package @semantiq/evidence
 * Evidence Decision Policy and Deterministic Governance Types
 */

import type { RelationEvidenceStatus, RelationStrengthLevel } from "../evidence-graph/types.js";
import type { RobustnessGrade } from "../robustness-diagnostics/types.js";
import type { StatisticalEvidenceGrade } from "../statistical-contrast/types.js";

export const EPISTEMIC_GOVERNANCE_DISCLAIMER =
  "Promotion indicates evidence-governance strength, not scientific proof.";

export type EvidenceGovernanceVerdict = "promote" | "hold" | "downgrade" | "insufficient";

export interface PolicyRuleEvaluation {
  readonly ruleId: string;
  readonly ruleName: string;
  readonly passed: boolean;
  readonly requirement: string;
  readonly observed: string;
  readonly isHardBlocker: boolean;
}

export interface EvidenceGovernanceInputs {
  readonly targetId: string;
  readonly statisticalGrade: StatisticalEvidenceGrade;
  readonly pairCount: number;
  readonly robustnessGrade: RobustnessGrade;
  readonly specificationStability: number; // 0.0 to 1.0 (direction stability)
  readonly usableSpecifications: number;
  readonly lowPowerFraction: number; // 0.0 to 1.0
  readonly negativeControlFailures: number;
  readonly relationStrength?: RelationStrengthLevel | undefined;
  readonly relationStatus?: RelationEvidenceStatus | undefined;
}

export interface EvidenceGovernanceDecision {
  readonly decisionId: string;
  readonly targetId: string;
  readonly policyVersion: string;
  readonly verdict: EvidenceGovernanceVerdict;
  readonly confidenceScore: number; // 0.0 to 1.0
  readonly ruleEvaluations: readonly PolicyRuleEvaluation[];
  readonly blockingReasons: readonly string[];
  readonly recommendations: readonly string[];
  readonly epistemicDisclaimer: typeof EPISTEMIC_GOVERNANCE_DISCLAIMER;
  readonly evaluatedAt: string;
}

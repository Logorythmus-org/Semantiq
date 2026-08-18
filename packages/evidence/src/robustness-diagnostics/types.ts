/**
 * @package @semantiq/evidence
 * Robustness Diagnostics and Specification Curve Types
 */

export const EPISTEMIC_ROBUSTNESS_DISCLAIMER =
  "Robustness across specifications does not establish causal identification.";

export interface BalanceDiagnosticResult {
  readonly dimension: string;
  readonly preMatchTvd: number;
  readonly postMatchTvd: number;
  readonly isBalanced: boolean; // postMatchTvd < 0.05
}

export interface NegativeControlResult {
  readonly negativeControlMetric: string;
  readonly meanDelta: number;
  readonly lowerCI: number;
  readonly upperCI: number;
  readonly passedNullHypothesis: boolean; // 0 inside [lowerCI, upperCI] and |meanDelta| <= 0.05
}

export interface LeaveOutSensitivityResult {
  readonly leaveOutType: "case" | "environment";
  readonly excludedEntityId: string;
  readonly remainingPairsCount: number;
  readonly meanDelta: number;
  readonly deltaShiftFromBaseline: number;
  readonly directionPreserved: boolean;
}

export interface SpecificationCurveEntry {
  readonly specificationId: string;
  readonly dimensionsUsed: readonly string[];
  readonly metricThreshold?: number | undefined;
  readonly excludedEntityId?: string | undefined;
  readonly matchedPairsCount: number;
  readonly meanDelta: number;
  readonly pValue: number;
  readonly isSignificant: boolean;
}

export interface SpecificationCurveReport {
  readonly totalSpecificationsEvaluated: number;
  readonly medianDelta: number;
  readonly minDelta: number;
  readonly maxDelta: number;
  readonly directionStabilityRatio: number; // 0.0 to 1.0 (proportion of specs with consistent direction)
  readonly significantSpecificationsRatio: number;
  readonly specifications: readonly SpecificationCurveEntry[];
}

export type RobustnessGrade =
  | "ROBUST_GRADE_A"  // High stability across all specs (direction stability >= 0.95, balanced TVD < 0.05, passed negative control)
  | "ROBUST_GRADE_B"  // Moderate stability (direction stability >= 0.80, balanced TVD < 0.10)
  | "ROBUST_GRADE_C"  // Inconclusive / sensitive to spec choices (direction stability >= 0.60)
  | "FRAGILE";        // Fragile (< 0.60 direction stability or fails negative control)

export interface RobustnessDiagnosticReport {
  readonly reportId: string;
  readonly targetMetric: string;
  readonly balanceDiagnostics: readonly BalanceDiagnosticResult[];
  readonly meanPostMatchTvd: number;
  readonly negativeControls: readonly NegativeControlResult[];
  readonly leaveOneCaseOut: readonly LeaveOutSensitivityResult[];
  readonly leaveOneEnvironmentOut: readonly LeaveOutSensitivityResult[];
  readonly specificationCurve: SpecificationCurveReport;
  readonly robustnessGrade: RobustnessGrade;
  readonly lowPowerWarnings: readonly string[];
  readonly epistemicDisclaimer: typeof EPISTEMIC_ROBUSTNESS_DISCLAIMER;
  readonly evaluatedAt: string;
}

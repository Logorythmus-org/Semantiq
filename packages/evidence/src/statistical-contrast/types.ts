/**
 * @package @semantiq/evidence
 * Matched Controls and Statistical Contrast Types
 */

export const EPISTEMIC_CAUSAL_DISCLAIMER =
  "Matched association is not proof of causal effect.";

export type MatchingDimension =
  | "environment"
  | "model"
  | "population"
  | "tools"
  | "memory"
  | "resource_pressure"
  | "horizon";

export interface EnvironmentProfile {
  readonly provider: string;
  readonly platform: string;
  readonly networkIsolated: boolean;
  readonly os: string;
}

export interface ModelProfile {
  readonly modelFamily: string;
  readonly modelId: string;
  readonly temperature: number;
}

export interface PopulationProfile {
  readonly agentCount: number;
  readonly topology: "single" | "hierarchical" | "peer_mesh" | "supervisor_worker";
}

export interface ToolsProfile {
  readonly toolCount: number;
  readonly hasBoundaryGuard: boolean;
  readonly allowedToolNames: readonly string[];
}

export interface MemoryProfile {
  readonly contextWindowTokens: number;
  readonly hasMemoryPartitioning: boolean;
}

export interface ResourcePressureProfile {
  readonly maxSteps: number;
  readonly tokenBudget: number;
  readonly throttleRps?: number | undefined;
}

export interface RunProfile {
  readonly runId: string;
  readonly isTreatment: boolean; // true = treatment (e.g. with mitigation), false = control (e.g. baseline)
  readonly environment: EnvironmentProfile;
  readonly model: ModelProfile;
  readonly population: PopulationProfile;
  readonly tools: ToolsProfile;
  readonly memory: MemoryProfile;
  readonly resourcePressure: ResourcePressureProfile;
  readonly horizon: "short" | "medium" | "long";
  readonly outcomeMetrics: Readonly<Record<string, number>>;
}

export interface MatchedRunPair {
  readonly pairId: string;
  readonly treatmentRun: RunProfile;
  readonly controlRun: RunProfile;
  readonly matchedDimensions: readonly MatchingDimension[];
  readonly metricDelta: number; // treatment - control
}

export interface BootstrapConfidenceInterval {
  readonly lower: number;
  readonly upper: number;
  readonly meanDelta: number;
  readonly confidenceLevel: number; // e.g. 0.95
  readonly iterations: number;
  readonly isSignificant: boolean; // 0 not within [lower, upper]
}

export interface ExactSignTestResult {
  readonly positivePairs: number; // treatment > control
  readonly negativePairs: number; // treatment < control
  readonly tiedPairs: number;     // treatment == control
  readonly pValue: number;
  readonly isStatisticallySignificant: boolean; // p < 0.05
}

export type StatisticalEvidenceGrade =
  | "GRADE_A"            // Robust: High sample power (N >= 20), significant CI, sign test p < 0.01
  | "GRADE_B"            // Moderate: Moderate sample (N >= 8), significant CI, sign test p < 0.05
  | "GRADE_C"            // Inconclusive: Wide CI crossing 0 or sign test p >= 0.05
  | "INSUFFICIENT_POWER"; // N < 5 matched pairs

export interface ThresholdSensitivityResult {
  readonly threshold: number;
  readonly treatmentPassRate: number;
  readonly controlPassRate: number;
  readonly deltaPassRate: number;
}

export interface MatchedContrastReport {
  readonly reportId: string;
  readonly targetMetric: string;
  readonly treatmentCount: number;
  readonly controlCount: number;
  readonly matchedPairsCount: number;
  readonly unmatchedCount: number;
  readonly matchingCoverageRatio: number; // matched / treatment
  readonly meanTreatmentScore: number;
  readonly meanControlScore: number;
  readonly meanDelta: number;
  readonly bootstrapCI: BootstrapConfidenceInterval;
  readonly signTest: ExactSignTestResult;
  readonly evidenceGrade: StatisticalEvidenceGrade;
  readonly thresholdSensitivity: readonly ThresholdSensitivityResult[];
  readonly epistemicDisclaimer: typeof EPISTEMIC_CAUSAL_DISCLAIMER;
  readonly evaluatedAt: string;
}

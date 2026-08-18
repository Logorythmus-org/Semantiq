/**
 * @package @semantiq/sdk
 * Re-export of canonical product contracts, enums, and extended domain models.
 */

export * from "../../sandbox-contracts/src/index.js";

// Canonical Epistemic Disclaimers
export const EPISTEMIC_CAUSAL_DISCLAIMER = "Matched association is not proof of causal effect.";
export const EPISTEMIC_ROBUSTNESS_DISCLAIMER = "Robustness across specifications does not establish causal identification.";
export const EPISTEMIC_REPRODUCIBILITY_DISCLAIMER = "Stable fingerprints prove artifact/config reproducibility, not scientific replication.";
export const EPISTEMIC_LANGUAGE_DISCLAIMER = "Release controls wording, not truth. All empirical claims are scoped associations.";
export const EPISTEMIC_GOVERNANCE_DISCLAIMER = "Promotion verdict signifies governance criteria fulfillment, not scientific proof.";

// Extended Governed Evidence Claim Lifecycle
export type GovernedClaimLifecycleStatus = "draft" | "active" | "superseded" | "retracted";

export interface ControlledLanguageViolation {
  readonly term: string;
  readonly category: string;
  readonly suggestedReplacement: string;
  readonly rationale: string;
}

export interface ControlledLanguageValidationResult {
  readonly isValid: boolean;
  readonly violations: readonly ControlledLanguageViolation[];
  readonly statement: string;
}

export interface GovernedEvidenceClaim {
  readonly id: string;
  readonly claimFamilyId: string;
  readonly claimFamilyTopic: string;
  readonly targetPatternOrRelationId: string;
  readonly version: string;
  readonly statement: string;
  readonly status: GovernedClaimLifecycleStatus;
  readonly governanceVerdict: string;
  readonly evidenceReferences: {
    readonly runIds: readonly string[];
    readonly observationIds: readonly string[];
    readonly decisionReportIds: readonly string[];
    readonly sourceIds: readonly string[];
  };
  readonly approvals: readonly {
    readonly reviewerId: string;
    readonly decision: string;
    readonly timestamp?: string;
  }[];
  readonly createdAt: string;
  readonly releasedAt?: string | undefined;
  readonly retractionReason?: string | undefined;
  readonly epistemicDisclaimer: string;
}

export interface DraftClaimOptions {
  readonly statement: string;
  readonly topic: string;
  readonly targetPatternOrRelationId: string;
  readonly version?: string | undefined;
  readonly governanceVerdict?: string | undefined;
  readonly runIds?: readonly string[] | undefined;
  readonly observationIds?: readonly string[] | undefined;
  readonly decisionReportIds?: readonly string[] | undefined;
  readonly sourceIds?: readonly string[] | undefined;
  readonly strictLanguage?: boolean | undefined;
}

// 7-Dimension Run Profiles & Matched Controls
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
  readonly topology: string;
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
  readonly isTreatment: boolean;
  readonly environment: EnvironmentProfile;
  readonly model: ModelProfile;
  readonly population: PopulationProfile;
  readonly tools: ToolsProfile;
  readonly memory: MemoryProfile;
  readonly resourcePressure: ResourcePressureProfile;
  readonly horizon: "short" | "medium" | "long";
  readonly outcomeMetrics: Record<string, number>;
}

export interface MatchedRunPair {
  readonly pairId: string;
  readonly treatmentRun: RunProfile;
  readonly controlRun: RunProfile;
  readonly matchedDimensions: readonly string[];
  readonly metricDelta: number;
}

export interface MatchControlsOptions {
  readonly treatmentRuns: readonly RunProfile[];
  readonly controlRuns: readonly RunProfile[];
  readonly targetMetric?: string | undefined;
}

export interface MatchedControlsResult {
  readonly matchedPairs: readonly MatchedRunPair[];
  readonly treatmentCount: number;
  readonly controlCount: number;
  readonly unmatchedCount: number;
  readonly matchingCoverageRatio: number;
}

// Statistical Contrast & Robustness
export interface BootstrapConfidenceInterval {
  readonly lower: number;
  readonly upper: number;
  readonly meanDelta: number;
  readonly confidenceLevel: number;
  readonly iterations: number;
  readonly isSignificant: boolean;
}

export interface ExactSignTestResult {
  readonly positiveCount: number;
  readonly negativeCount: number;
  readonly zeroCount: number;
  readonly totalPairs: number;
  readonly pValue: number;
  readonly isSignificant: boolean;
}

export interface MatchedContrastReport {
  readonly reportId: string;
  readonly targetMetric: string;
  readonly treatmentCount: number;
  readonly controlCount: number;
  readonly matchedPairsCount: number;
  readonly unmatchedCount: number;
  readonly matchingCoverageRatio: number;
  readonly meanTreatmentScore: number;
  readonly meanControlScore: number;
  readonly meanDelta: number;
  readonly bootstrapCi: BootstrapConfidenceInterval;
  readonly signTest: ExactSignTestResult;
  readonly statisticalEvidenceGrade: "strong" | "moderate" | "suggestive" | "insufficient";
  readonly epistemicDisclaimer: string;
}

export interface EvaluateContrastOptions {
  readonly targetMetric: string;
  readonly matchedData: MatchedControlsResult;
}

// Research Bundle Workflows
export interface ExportBundleOptions {
  readonly bundleId: string;
  readonly title: string;
  readonly runs: readonly any[];
  readonly evaluations: readonly any[];
  readonly claims: readonly any[];
  readonly license?: string | undefined;
}

export interface ImportBundleResult {
  readonly verified: boolean;
  readonly bundleId: string;
  readonly importedClaimsCount: number;
  readonly importedRunsCount: number;
  readonly importedEvaluationsCount: number;
}

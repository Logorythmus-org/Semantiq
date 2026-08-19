/**
 * @package @semantiq/evidence
 * Study Protocol Design, Pre-registration, and Deviation Ledger Types
 *
 * Invariants:
 * 1. Preregistration ensures protocol transparency and guards against p-hacking/post-hoc selective reporting.
 * 2. Material deviations cap evidence level to prevent unhedged claim promotion.
 * 3. Protocol generation is deterministic.
 */

export const EPISTEMIC_PREREGISTRATION_DISCLAIMER =
  "Preregistration ensures protocol transparency and guards against p-hacking and post-hoc selective reporting; it does not confer truth.";

export interface ExposureDefinition {
  readonly name: string;
  readonly treatmentCondition: string;
  readonly controlCondition: string;
}

export interface OutcomeDefinition {
  readonly primaryMetric: string;
  readonly targetEffectDelta: number;
  readonly measurementWindowMs: number;
}

export interface PopulationCriteria {
  readonly systemFamily: string;
  readonly requiredCapabilities: readonly string[];
  readonly excludedConfigurations: readonly string[];
}

export interface InstrumentationSpec {
  readonly traceCollectionMode: "synchronous" | "buffered_event_stream" | "replay_log";
  readonly samplingRateHz: number;
  readonly isolationGuarantees: readonly string[];
}

export interface ProtocolMetricSpec {
  readonly metricId: string;
  readonly name: string;
  readonly description: string;
  readonly expectedDirection: "increase" | "decrease" | "invariance";
}

export interface NegativeControlSpec {
  readonly controlId: string;
  readonly nullHypothesisDescription: string;
  readonly expectedDeltaBound: number; // e.g. |delta| <= 0.05
}

export interface AnalysisSpecification {
  readonly primaryStatisticalTest: "exact_sign_test" | "bootstrap_ci" | "paired_contrast";
  readonly significanceAlpha: number; // e.g. 0.05
  readonly bootstrapIterations: number; // e.g. 2000
}

export interface SampleGuidance {
  readonly minimumPairsRequired: number; // e.g. 8 for basic power
  readonly recommendedPairsForGradeA: number; // e.g. 20
  readonly statisticalPowerTarget: number; // e.g. 0.80
}

export interface ExportRequirements {
  readonly requireFullArtifacts: boolean;
  readonly allowRedaction: boolean;
  readonly merkleVerificationRequired: boolean;
}

export type StudyProtocolStatus = "draft" | "frozen" | "executed" | "archived";

export interface StudyProtocol {
  readonly protocolId: string;
  readonly version: string;
  readonly title: string;
  readonly researchQuestion: string;
  readonly targetRelationId: string;
  readonly targetPatternId: string;
  readonly exposureDefinition: ExposureDefinition;
  readonly outcomeDefinition: OutcomeDefinition;
  readonly populationCriteria: PopulationCriteria;
  readonly matchingDimensions: readonly string[];
  readonly instrumentation: InstrumentationSpec;
  readonly metrics: readonly ProtocolMetricSpec[];
  readonly negativeControls: readonly NegativeControlSpec[];
  readonly analysisSpecification: AnalysisSpecification;
  readonly sampleGuidance: SampleGuidance;
  readonly exportRequirements: ExportRequirements;
  readonly preregistrationHash: string;
  readonly status: StudyProtocolStatus;
  readonly createdAt: string;
  readonly frozenAt?: string | undefined;
  readonly epistemicDisclaimer: typeof EPISTEMIC_PREREGISTRATION_DISCLAIMER;
}

export type ProtocolDeviationTiming = "pre_execution" | "during_execution" | "post_hoc";

export type ProtocolDeviationSeverity =
  | "minor" // Clarification or parameter tweak with no validity impact
  | "material" // Alteration of matching dimension, metric, or inclusion rule -> CAPS evidence level
  | "critical"; // Post-hoc outcome redefinition or severe protocol breach -> CAPS evidence level to E1

export interface ProtocolDeviation {
  readonly deviationId: string;
  readonly protocolId: string;
  readonly timing: ProtocolDeviationTiming;
  readonly severity: ProtocolDeviationSeverity;
  readonly description: string;
  readonly rationale: string;
  readonly recordedAt: string;
  readonly recordedBy: string;
  readonly deviationHash: string;
  readonly previousDeviationHash?: string | undefined;
}

export type EvidenceLevelCap = "NO_CAP" | "CAP_E2_LOCAL_CONSISTENT" | "CAP_E1_CONTESTED";

export interface ProtocolExecutionSummary {
  readonly protocolId: string;
  readonly preregistrationFrozen: boolean;
  readonly protocolHashValid: boolean;
  readonly totalDeviations: number;
  readonly materialDeviationsCount: number;
  readonly criticalDeviationsCount: number;
  readonly evidenceLevelCap: EvidenceLevelCap;
  readonly capReason?: string | undefined;
  readonly evaluatedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_PREREGISTRATION_DISCLAIMER;
}

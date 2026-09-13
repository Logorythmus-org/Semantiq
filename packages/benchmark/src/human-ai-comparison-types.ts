import type { EvaluatorIdentity } from "./evaluator-types.js";
import type { MetricIdentity, MetricResult } from "./metric-types.js";
import type { BenchmarkIdentity } from "./registry-types.js";

export const HUMAN_AI_COMPARABILITY_DIMENSIONS = [
  "CONSTRUCT_COMPATIBILITY",
  "TASK_COMPATIBILITY",
  "PRESENTATION_COMPATIBILITY",
  "RESPONSE_MODE_COMPATIBILITY",
  "TOOL_ASSISTANCE_COMPATIBILITY",
  "LANGUAGE_COMPATIBILITY",
  "SCORING_COMPATIBILITY",
  "EVALUATOR_COMPATIBILITY",
  "METRIC_COMPATIBILITY",
  "SCALE_INTERPRETATION_COMPATIBILITY",
  "RELIABILITY_EVIDENCE",
  "VALIDITY_EVIDENCE",
  "SAMPLING_COMPATIBILITY",
  "ENVIRONMENT_COMPATIBILITY",
  "TIME_POLICY_COMPATIBILITY"
] as const;

export type HumanAIComparabilityDimension = (typeof HUMAN_AI_COMPARABILITY_DIMENSIONS)[number];

export const HUMAN_AI_DIMENSION_STATUSES = [
  "MATCHED",
  "ACCEPTABLE_WITH_LIMITATIONS",
  "MISMATCHED",
  "UNKNOWN",
  "NOT_APPLICABLE"
] as const;

export type HumanAIDimensionStatus = (typeof HUMAN_AI_DIMENSION_STATUSES)[number];

export const HUMAN_AI_COMPARABILITY_DECISIONS = [
  "NOT_ASSESSED",
  "INSUFFICIENT_EVIDENCE",
  "NOT_COMPARABLE",
  "CONDITIONALLY_COMPARABLE",
  "COMPARABLE_FOR_DECLARED_PURPOSE"
] as const;

export type HumanAIComparabilityDecision = (typeof HUMAN_AI_COMPARABILITY_DECISIONS)[number];

export type HumanAIComparisonPurpose =
  | "ITEM_LEVEL_TASK_SUCCESS"
  | "CATEGORICAL_OUTCOME_RELATIONSHIP"
  | "ERROR_PATTERN_COMPARISON"
  | "BOUNDED_CONSTRUCT_INDICATOR"
  | "LATENCY_UNDER_MATCHED_CONDITIONS"
  | "NUMERIC_DESCRIPTIVE_DIFFERENCE";

export type HumanAIComparisonLevel =
  | "INDIVIDUAL_HUMAN_TO_INDIVIDUAL_AI"
  | "HUMAN_SAMPLE_TO_AI_SAMPLE"
  | "AGGREGATE_HUMAN_TO_AGGREGATE_AI";

export type HumanAIObservationPairing = "PAIRED_BY_ITEM" | "PAIRED_BY_CONDITION" | "UNPAIRED";

export interface HumanAIItemIdentity {
  readonly itemId: string;
  readonly itemVersion: string;
}

export interface HumanSubjectEvidenceReference {
  readonly role: "HUMAN_AS_SUBJECT";
  readonly responseId: string;
  readonly responseDigest: string;
  readonly studyReference: string;
  readonly sessionReference: string;
  readonly presentationReference: string;
  readonly provenanceReference: string;
}

export interface AIModelProvenance {
  readonly providerId: string;
  readonly modelId: string;
  readonly snapshotStatus: "DECLARED_IMMUTABLE" | "MUTABLE_ALIAS" | "UNKNOWN";
  readonly modelVersion?: string | undefined;
  readonly configurationReference: string;
  readonly samplingParametersReference: string;
  readonly toolAccessReferences: readonly string[];
  readonly systemContextReference: string;
  readonly executionProvenanceReference: string;
}

export interface AISubjectEvidenceReference {
  readonly role: "AI_AS_SUBJECT";
  readonly executionId: string;
  readonly resultReference: string;
  readonly presentationReference: string;
  readonly model: AIModelProvenance;
  readonly provenanceReference: string;
}

export interface HumanAIPopulationProvenance {
  readonly populationDefinitionRef: string;
  readonly samplingProtocolRef: string;
  readonly sampleSize: number;
  readonly inclusionPolicyRef: string;
  readonly exclusionPolicyRef: string;
  readonly representativeness: "NOT_CLAIMED";
}

export interface HumanAIConditionReference {
  readonly instructionsDigest: string;
  readonly stimulusDigest: string;
  readonly presentationDigest: string;
  readonly responseMode: string;
  readonly toolPolicy: string;
  readonly language: string;
  readonly scoringProtocolReference: string;
  readonly evaluatorIdentity?: EvaluatorIdentity | undefined;
  readonly metricIdentity?: MetricIdentity | undefined;
  readonly denominatorDefinitionReference?: string | undefined;
  readonly eligiblePopulationReference?: string | undefined;
  readonly environmentReference: string;
  readonly timePolicy: string;
}

export interface HumanAIComparisonDefinition {
  readonly comparisonDefinitionId: string;
  readonly comparisonDefinitionVersion: string;
  readonly versionScope: "HUMAN_AI_COMPARISON_DEFINITION";
  readonly relationship: "HUMAN_AI_COMPARISON";
  readonly purpose: HumanAIComparisonPurpose;
  readonly level: HumanAIComparisonLevel;
  readonly pairing: HumanAIObservationPairing;
  readonly criticalDimensions: readonly HumanAIComparabilityDimension[];
  readonly requiredEvidenceReferences: readonly string[];
  readonly provenanceReferences: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly limitations: readonly string[];
}

export interface HumanAIComparisonUnit {
  readonly comparisonUnitId: string;
  readonly comparisonUnitDigest: string;
  readonly definitionDigest: string;
  readonly humanEvidence: HumanSubjectEvidenceReference;
  readonly aiEvidence: AISubjectEvidenceReference;
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly itemIdentity?: HumanAIItemIdentity | undefined;
  readonly constructId: string;
  readonly humanConditions: HumanAIConditionReference;
  readonly aiConditions: HumanAIConditionReference;
  readonly humanPopulation?: HumanAIPopulationProvenance | undefined;
  readonly aiPopulation?: HumanAIPopulationProvenance | undefined;
  readonly metricResultReferences: readonly string[];
  readonly evaluatorExecutionReferences: readonly string[];
  readonly reliabilityEvidenceReferences: readonly string[];
  readonly validityEvidenceReferences: readonly string[];
  readonly provenanceReferences: readonly string[];
  readonly scientificAuthority: "NONE";
}

export interface HumanAIDimensionAssessment {
  readonly dimension: HumanAIComparabilityDimension;
  readonly status: HumanAIDimensionStatus;
  readonly evidenceRefs: readonly string[];
  readonly rationale: string;
  readonly limitations: readonly string[];
}

export interface HumanAIComparabilityAssessment {
  readonly assessmentId: string;
  readonly assessmentDigest: string;
  readonly definitionDigest: string;
  readonly comparisonUnitDigest: string;
  readonly purpose: HumanAIComparisonPurpose;
  readonly decision: HumanAIComparabilityDecision;
  readonly dimensions: readonly HumanAIDimensionAssessment[];
  readonly criticalDimensions: readonly HumanAIComparabilityDimension[];
  readonly blockingDimensions: readonly HumanAIComparabilityDimension[];
  readonly unknownDimensions: readonly HumanAIComparabilityDimension[];
  readonly limitations: readonly string[];
  readonly provenanceReferences: readonly string[];
  readonly assessmentAuthority: "AUTOMATED_EVIDENCE_GATE" | "RESEARCH_REVIEW";
  readonly scientificAuthority: "NONE";
}

export type HumanAIComparisonObservation =
  | {
      readonly observationId: string;
      readonly kind: "CATEGORICAL";
      readonly humanOutcome:
        | { readonly kind: "VALUE"; readonly value: string }
        | { readonly kind: "MISSING"; readonly reason: string };
      readonly aiOutcome:
        | { readonly kind: "VALUE"; readonly value: string }
        | { readonly kind: "MISSING"; readonly reason: string };
      readonly humanEvidenceReference: string;
      readonly aiEvidenceReference: string;
      readonly provenanceReferences: readonly string[];
    }
  | {
      readonly observationId: string;
      readonly kind: "NUMERIC_METRIC";
      readonly humanMetricResult: MetricResult;
      readonly aiMetricResult: MetricResult;
      readonly provenanceReferences: readonly string[];
    };

export type HumanAIObservedRelationship =
  | "SAME_CATEGORICAL_OUTCOME"
  | "DIFFERENT_CATEGORICAL_OUTCOME"
  | "HUMAN_OBSERVATION_MISSING"
  | "AI_OBSERVATION_MISSING"
  | "BOTH_OBSERVATIONS_MISSING"
  | "DESCRIPTIVE_NUMERIC_DIFFERENCE";

export interface HumanAIComparisonResult {
  readonly resultId: string;
  readonly resultDigest: string;
  readonly definitionDigest: string;
  readonly comparisonUnitDigest: string;
  readonly assessmentDigest: string;
  readonly observationId: string;
  readonly observationDigest: string;
  readonly purpose: HumanAIComparisonPurpose;
  readonly level: HumanAIComparisonLevel;
  readonly comparabilityDecision: HumanAIComparabilityDecision;
  readonly interpretation: "NOT_INTERPRETABLE" | "BOUNDED_INTERPRETATION_ALLOWED";
  readonly relationship?: HumanAIObservedRelationship | undefined;
  readonly numericDifference?: number | undefined;
  readonly limitations: readonly string[];
  readonly prohibitedClaims: readonly string[];
  readonly provenanceReferences: readonly string[];
  readonly scientificAuthority: "NONE";
}

export interface HumanAIComparisonValidationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface HumanAIMeasurementInvarianceResearchContract {
  readonly contractId: "human_ai_measurement_invariance_research";
  readonly contractVersion: "0.1.0";
  readonly versionScope: "RESEARCH_CONTRACT";
  readonly status: "RESEARCH_CONTRACT";
  readonly questions: readonly string[];
  readonly requiredEvidenceKinds: readonly string[];
  readonly implementedMethods: readonly [];
  readonly scientificAuthority: "NONE";
  readonly limitations: readonly string[];
}

export interface DifferentialItemBehaviorResearchContract {
  readonly contractId: "human_ai_differential_item_behavior_research";
  readonly contractVersion: "0.1.0";
  readonly versionScope: "RESEARCH_CONTRACT";
  readonly status: "RESEARCH_CONTRACT";
  readonly terminology: "DIFFERENTIAL_ITEM_BEHAVIOR";
  readonly requiredFields: readonly string[];
  readonly formalDifMethodsImplemented: readonly [];
  readonly causalAuthority: "NONE";
  readonly scientificAuthority: "NONE";
  readonly limitations: readonly string[];
}

export interface HistoricalHacsCapabilityAudit {
  readonly capabilityId: string;
  readonly sourceReference: string;
  readonly classification:
    | "HISTORICAL_ONLY"
    | "CURRENT_ENGINEERING_MECHANISM"
    | "PARTIAL"
    | "SCAFFOLDED"
    | "RESEARCH_CANDIDATE"
    | "DEPRECATED"
    | "CONFLICTING";
  readonly currentAuthority: "NONE" | "ENGINEERING_ONLY";
  readonly disposition: "PRESERVE_AS_PROVENANCE" | "REUSE_WITH_LIMITS" | "BLOCK_SCIENTIFIC_CLAIM";
  readonly rationale: string;
}

export interface HumanAIRepresentativeCase {
  readonly caseId: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";
  readonly description: string;
  readonly expectedDecision: HumanAIComparabilityDecision;
  readonly expectedLimitation: string;
  readonly empiricalEvidence: "NONE_SYNTHETIC_FIXTURE";
}

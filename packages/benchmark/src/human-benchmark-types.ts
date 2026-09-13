import type { EvaluatorConfiguration, EvaluatorExecution } from "./evaluator-types.js";
import type { BenchmarkIdentity, RegistryInputRightsClass } from "./registry-types.js";
import type { HumanRatingTarget } from "./human-rater-types.js";

export interface HumanSubjectIdentity {
  readonly subjectId: string;
}

export type HumanBenchmarkSuitability =
  | "SUITABLE"
  | "SUITABLE_WITH_ADAPTATION"
  | "RESEARCH_REVIEW_REQUIRED"
  | "NOT_SUITABLE";

export interface HumanBenchmarkConstruct {
  readonly constructId: string;
  readonly constructVersion: string;
  readonly versionScope: "HUMAN_BENCHMARK_CONSTRUCT";
  readonly name: string;
  readonly definition: string;
  readonly inclusions: readonly string[];
  readonly exclusions: readonly string[];
  readonly observableIndicators: readonly string[];
  readonly alternativeExplanations: readonly string[];
  readonly humanSuitability: HumanBenchmarkSuitability;
  readonly aiSuitability: "UNASSESSED";
  readonly measurementStatus: "INTENDED_ONLY" | "SYNTHETIC_OPERATIONALIZATION";
  readonly evidenceReferences: readonly string[];
  readonly provenanceReferences: readonly string[];
  readonly limitations: readonly string[];
}

export type HumanBenchmarkResponseMode =
  | "SINGLE_CHOICE"
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "STRUCTURED_REVISION";
export type HumanBenchmarkScoringMode = "OBJECTIVE_RULE" | "HUMAN_JUDGE" | "UNSUPPORTED";

export interface HumanBenchmarkItem {
  readonly itemId: string;
  readonly itemVersion: string;
  readonly versionScope: "HUMAN_BENCHMARK_ITEM";
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly constructId: string;
  readonly prompt: string;
  readonly instructions: readonly string[];
  readonly responseMode: HumanBenchmarkResponseMode;
  readonly scoringMode: HumanBenchmarkScoringMode;
  readonly scoringProtocolReference: string;
  readonly correctResponse?: string | undefined;
  readonly language: string;
  readonly toolPolicy: "NO_EXTERNAL_TOOLS" | "STUDY_DECLARED";
  readonly dependencies: readonly string[];
  readonly stimulusReferences: readonly string[];
  readonly humanSuitability: HumanBenchmarkSuitability;
  readonly provenanceReferences: readonly string[];
  readonly rightsClass: RegistryInputRightsClass;
  readonly scientificStatus: "SYNTHETIC_RESEARCH_CANDIDATE";
  readonly adaptation:
    | { readonly status: "ORIGINAL" }
    | {
        readonly status: "TRANSLATED_OR_ADAPTED";
        readonly sourceItemId: string;
        readonly sourceItemVersion: string;
        readonly sourceLanguage: string;
        readonly provenanceReference: string;
      };
  readonly limitations: readonly string[];
}

export interface HumanBenchmarkStudyProtocol {
  readonly humanBenchmarkStudyId: string;
  readonly humanBenchmarkStudyVersion: string;
  readonly versionScope: "HUMAN_BENCHMARK_STUDY";
  readonly role: "HUMAN_AS_SUBJECT";
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly itemIdentities: readonly { itemId: string; itemVersion: string }[];
  readonly instructions: readonly string[];
  readonly presentationPolicy:
    | { readonly method: "FIXED" }
    | { readonly method: "SEEDED_FISHER_YATES"; readonly seedRequired: true };
  readonly timePolicy: "UNTIMED" | "RECORDED_NOT_SCORED";
  readonly toolPolicy: "NO_EXTERNAL_TOOLS" | "STUDY_DECLARED";
  readonly language: string;
  readonly environmentReferences: readonly string[];
  readonly participationPolicyReference: string;
  readonly acknowledgementReference: string;
  readonly provenanceReferences: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly limitations: readonly string[];
}

export interface HumanBenchmarkSession {
  readonly sessionId: string;
  readonly sessionDigest: string;
  readonly subject: HumanSubjectIdentity;
  readonly studyIdentity: {
    readonly humanBenchmarkStudyId: string;
    readonly humanBenchmarkStudyVersion: string;
  };
  readonly studyDefinitionDigest: string;
  readonly itemOrder: readonly string[];
  readonly randomization: {
    readonly method: "FIXED" | "SEEDED_FISHER_YATES";
    readonly seed?: number;
    readonly canonicalInputOrder: readonly string[];
    readonly presentedOrder: readonly string[];
  };
  readonly startedAt: string;
}

export interface HumanBenchmarkPresentation {
  readonly presentationId: string;
  readonly presentationDigest: string;
  readonly sessionId: string;
  readonly subjectId: string;
  readonly itemIdentity: { readonly itemId: string; readonly itemVersion: string };
  readonly prompt: string;
  readonly instructions: readonly string[];
  readonly responseMode: HumanBenchmarkResponseMode;
  readonly language: string;
  readonly toolPolicy: HumanBenchmarkItem["toolPolicy"];
  readonly stimulusReferences: readonly string[];
  readonly transformations: readonly string[];
  readonly presentedAt: string;
}

export type HumanSubjectResponseStatus =
  | "SUBMITTED"
  | "SKIPPED"
  | "ABSTAINED"
  | "INCOMPLETE"
  | "INVALID"
  | "SYSTEM_FAILURE";

export interface HumanSubjectResponse {
  readonly responseId: string;
  readonly responseDigest: string;
  readonly presentationDigest: string;
  readonly sessionId: string;
  readonly subject: HumanSubjectIdentity;
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly itemIdentity: HumanBenchmarkPresentation["itemIdentity"];
  readonly status: HumanSubjectResponseStatus;
  readonly response?: string | undefined;
  readonly reason?: string | undefined;
  readonly provenanceReference: string;
  readonly submittedAt: string;
  readonly scientificAuthority: "NONE";
  readonly groundTruthClaim: "NONE";
}

export interface ObjectiveItemJudgment {
  readonly kind: "CATEGORICAL_CORRECTNESS";
  readonly category: "CORRECT" | "INCORRECT";
  readonly ruleReference: string;
  readonly numericScore: "NOT_EMITTED";
  readonly scientificAuthority: "NONE";
  readonly configuration: EvaluatorConfiguration;
  readonly execution: EvaluatorExecution;
}

export interface HistoricalHibItemAudit {
  readonly historicalItemId: string;
  readonly historicalVersionLabel: "HIB 1.0 (historical)";
  readonly canonicalCandidateId: string | null;
  readonly sourceReference: "Docs/SemantIQ-Benchmarks.pdf";
  readonly sourcePage: number;
  readonly family: string;
  readonly summary: string;
  readonly humanSuitability: Exclude<HumanBenchmarkSuitability, "SUITABLE">;
  readonly responseMode: HumanBenchmarkResponseMode;
  readonly scoringMode: HumanBenchmarkScoringMode;
  readonly metricAvailability: "NONE";
  readonly evaluatorRequirement: "RULE_DESIGN_REQUIRED" | "S06_HUMAN_JUDGE_STUDY_REQUIRED";
  readonly groundTruthRequirement: "REFERENCE_ANSWER_REQUIRED" | "RUBRIC_REQUIRED";
  readonly confounds: readonly string[];
  readonly scientificStatus: "HISTORICAL_UNVALIDATED";
  readonly disposition:
    | "HISTORICAL_RETAIN"
    | "HISTORICAL_REVISE"
    | "HISTORICAL_SPLIT"
    | "HISTORICAL_MERGE_CANDIDATE"
    | "HISTORICAL_REJECT"
    | "INSUFFICIENT_EVIDENCE"
    | "OUT_OF_SCOPE";
  readonly rationale: string;
  readonly relatedHistoricalItemIds: readonly string[];
}

export interface HumanBenchmarkValidationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface HumanJudgeTargetResult {
  readonly target: HumanRatingTarget;
  readonly requiredSystem: "S06_HUMAN_RATER_SYSTEM";
  readonly requiredEvaluatorMechanism: "HUMAN_JUDGE";
}

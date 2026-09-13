import type { EvaluatorDeterminism, EvaluatorIdentity, ModelReference } from "./evaluator-types.js";
import type { MetricIdentity } from "./metric-types.js";
import type { BenchmarkIdentity } from "./registry-types.js";

export const EVIDENCE_RECORD_SCOPES = [
  "BENCHMARK_S02",
  "METRIC_S03",
  "EVALUATOR_S04",
  "RELIABILITY_S05",
  "HUMAN_RATER_S06",
  "HUMAN_SUBJECT_S07",
  "HUMAN_AI_COMPARISON_S08",
  "EXECUTION_S09",
  "RESULT",
  "REPORT",
  "OTHER"
] as const;
export type EvidenceRecordScope = (typeof EVIDENCE_RECORD_SCOPES)[number];

export type EvidenceValue<T> =
  | { readonly state: "KNOWN"; readonly value: T; readonly evidenceReferences: readonly string[] }
  | { readonly state: "UNKNOWN" | "UNAVAILABLE" | "NOT_APPLICABLE"; readonly reason: string };

export interface SemanticDigest {
  readonly algorithm: "SHA_256";
  readonly value: string;
  readonly canonicalizationProfile: "semantiq-canonical-json-v1";
}

export interface ContentDigest {
  readonly algorithm: "SHA_256";
  readonly value: string;
  readonly representation: "ORIGINAL_BYTES" | "REDACTED_BYTES" | "CANONICAL_JSON";
}

export interface EvidenceRecordReference {
  readonly referenceId: string;
  readonly scope: EvidenceRecordScope;
  readonly recordId: string;
  readonly recordVersion: string;
  readonly semanticDigest: SemanticDigest;
  readonly availability:
    | "AVAILABLE"
    | "REFERENCED"
    | "RESTRICTED"
    | "REDACTED"
    | "UNAVAILABLE"
    | "UNKNOWN";
  readonly provenanceReferences: readonly string[];
}

export const ARTIFACT_KINDS = [
  "INPUT",
  "OUTPUT",
  "CONFIGURATION",
  "RUBRIC",
  "DATASET",
  "FIXTURE",
  "TRACE",
  "LOG",
  "ENVIRONMENT",
  "DEPENDENCY_LOCK",
  "SOURCE_SNAPSHOT",
  "REPORT",
  "OTHER"
] as const;
export type ArtifactKind = (typeof ARTIFACT_KINDS)[number];

export const ARTIFACT_AVAILABILITY = [
  "AVAILABLE",
  "EMBEDDED",
  "REFERENCED",
  "RESTRICTED",
  "REDACTED",
  "UNAVAILABLE",
  "UNKNOWN"
] as const;
export type ArtifactAvailability = (typeof ARTIFACT_AVAILABILITY)[number];

export interface ArtifactReference {
  readonly artifactId: string;
  readonly artifactVersion: string;
  readonly kind: ArtifactKind;
  readonly contentDigest?: ContentDigest | undefined;
  readonly observedContentDigest?: ContentDigest | undefined;
  readonly semanticDigest?: SemanticDigest | undefined;
  readonly mediaType: string;
  readonly sizeBytes?: number | undefined;
  readonly availability: ArtifactAvailability;
  readonly locationClass: "EMBEDDED" | "PORTABLE_RELATIVE" | "EXTERNAL_REFERENCE" | "NOT_DISCLOSED";
  readonly rightsStatus:
    | "REDISTRIBUTION_ALLOWED"
    | "REFERENCE_ONLY"
    | "RESTRICTED"
    | "UNKNOWN_RIGHTS";
  readonly redaction?:
    | {
        readonly class: string;
        readonly reason: string;
        readonly digestAppliesTo: "ORIGINAL" | "REDACTED";
        readonly reproductionImpact: string;
      }
    | undefined;
  readonly provenanceReferences: readonly string[];
  readonly limitations: readonly string[];
}

export interface DependencyEvidence {
  readonly ecosystem: "NODE" | "PYTHON" | "OS" | "OTHER";
  readonly lockOrGraphReference: string;
  readonly digest: ContentDigest;
  readonly completeness: "COMPLETE_FOR_DECLARED_SCOPE" | "PARTIAL" | "UNKNOWN";
}

export type NetworkDependency =
  | "NO_NETWORK"
  | "NETWORK_ALLOWED"
  | "EXTERNAL_PROVIDER"
  | "EXTERNAL_DATA_SOURCE"
  | "UNKNOWN";

export interface EnvironmentManifestInput {
  readonly environmentId: string;
  readonly environmentVersion: string;
  readonly schemaVersion: "1.0.0";
  readonly platform: EvidenceValue<string>;
  readonly architecture: EvidenceValue<string>;
  readonly runtime: EvidenceValue<string>;
  readonly runtimeVersion: EvidenceValue<string>;
  readonly containerImageDigest: EvidenceValue<string>;
  readonly hardwareClass: EvidenceValue<string>;
  readonly acceleratorClass: EvidenceValue<string>;
  readonly locale: EvidenceValue<string>;
  readonly timezonePolicy: EvidenceValue<string>;
  readonly environmentVariables: {
    readonly classification: "NAMES_ONLY_NO_VALUES" | "NOT_CAPTURED" | "NOT_APPLICABLE";
    readonly names: readonly string[];
  };
  readonly dependencies: readonly DependencyEvidence[];
  readonly dependencyCompleteness: "COMPLETE_FOR_DECLARED_SCOPE" | "PARTIAL" | "UNKNOWN";
  readonly networkDependency: NetworkDependency;
  readonly toolAvailability: readonly string[];
  readonly completeness: "FULLY_CAPTURED" | "PARTIALLY_CAPTURED" | "MINIMAL" | "UNKNOWN";
  readonly limitations: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly auditMetadata?:
    | { readonly recordedAt?: string; readonly requestId?: string }
    | undefined;
}

export interface EnvironmentManifest extends EnvironmentManifestInput {
  readonly environmentDigest: string;
}

export interface SourceRevisionEvidence {
  readonly gitCommit: EvidenceValue<string>;
  readonly gitTree: EvidenceValue<string>;
  readonly packageVersion: EvidenceValue<string>;
  readonly schemaVersions: readonly { readonly schemaId: string; readonly schemaVersion: string }[];
}

export interface RandomizationEvidence {
  readonly policy: EvidenceValue<string>;
  readonly algorithm: EvidenceValue<string>;
  readonly seed: EvidenceValue<number>;
  readonly scope: EvidenceValue<string>;
  readonly implementationVersion: EvidenceValue<string>;
}

export const PROVIDER_MODEL_EVIDENCE_STATUSES = [
  "MODEL_ID_DECLARED",
  "MODEL_VERSION_KNOWN",
  "SNAPSHOT_KNOWN",
  "SNAPSHOT_UNKNOWN",
  "PROVIDER_NONDETERMINISTIC",
  "PROVIDER_STATE_UNAVAILABLE"
] as const;
export type ProviderModelEvidenceStatus = (typeof PROVIDER_MODEL_EVIDENCE_STATUSES)[number];

export interface ExecutionConditionEvidence {
  readonly configurationReference: EvidenceValue<string>;
  readonly configurationDigest: EvidenceValue<string>;
  readonly language: EvidenceValue<string>;
  readonly toolPolicy: EvidenceValue<string>;
  readonly model: EvidenceValue<ModelReference>;
  readonly modelEvidenceStatuses: readonly ProviderModelEvidenceStatus[];
  readonly samplingConfigurationReference: EvidenceValue<string>;
  readonly randomization: RandomizationEvidence;
}

export interface ExecutionManifestInput {
  readonly manifestId: string;
  readonly manifestVersion: string;
  readonly schemaVersion: "1.0.0";
  readonly executionId: string;
  readonly executionStatus: "SUCCEEDED" | "FAILED" | "PARTIAL" | "ABSTAINED" | "NOT_APPLICABLE";
  readonly targetReference: string;
  readonly benchmarkIdentity: EvidenceValue<BenchmarkIdentity>;
  readonly itemIdentity: EvidenceValue<{ readonly itemId: string; readonly itemVersion: string }>;
  readonly constructReference: EvidenceValue<string>;
  readonly metricIdentity: EvidenceValue<MetricIdentity>;
  readonly evaluatorIdentity: EvidenceValue<EvaluatorIdentity>;
  readonly studyProtocolReference: EvidenceValue<string>;
  readonly comparisonDefinitionReference: EvidenceValue<string>;
  readonly intended: ExecutionConditionEvidence;
  readonly observed: ExecutionConditionEvidence;
  readonly environmentDigest: string;
  readonly sourceRevision: SourceRevisionEvidence;
  readonly inputArtifactIds: readonly string[];
  readonly expectedOutputArtifactIds: readonly string[];
  readonly observedOutputArtifactIds: readonly string[];
  readonly evidenceReferences: readonly string[];
  readonly failure?: { readonly failureClass: string; readonly detail: string } | undefined;
  readonly scientificAuthority: "NONE";
  readonly auditMetadata?:
    | { readonly executedAt?: string; readonly requestId?: string }
    | undefined;
}

export interface ExecutionManifest extends ExecutionManifestInput {
  readonly manifestDigest: string;
}

export const EVIDENCE_COMPLETENESS_DIMENSIONS = [
  "IDENTITY",
  "INPUT",
  "CONFIGURATION",
  "EXECUTION",
  "OUTPUT",
  "ENVIRONMENT",
  "DEPENDENCIES",
  "PROVENANCE",
  "METRIC",
  "EVALUATOR",
  "RELIABILITY",
  "VALIDITY",
  "HUMAN_PROTOCOL",
  "COMPARABILITY"
] as const;
export type EvidenceCompletenessDimension = (typeof EVIDENCE_COMPLETENESS_DIMENSIONS)[number];
export type EvidenceCompletenessStatus =
  | "COMPLETE"
  | "PARTIAL"
  | "MISSING"
  | "RESTRICTED"
  | "NOT_APPLICABLE"
  | "UNKNOWN";

export interface EvidenceCompletenessEntry {
  readonly dimension: EvidenceCompletenessDimension;
  readonly status: EvidenceCompletenessStatus;
  readonly critical: boolean;
  readonly evidenceReferences: readonly string[];
  readonly rationale: string;
}

export interface EvidenceRequirement {
  readonly requirementId: string;
  readonly purpose:
    | "ENGINEERING_CONFORMANCE"
    | "METRIC_RESULT"
    | "EVALUATOR_RESULT"
    | "RELIABILITY_STUDY"
    | "HUMAN_STUDY"
    | "HUMAN_AI_COMPARISON"
    | "OTHER";
  readonly referenceId: string;
  readonly critical: boolean;
}

export interface EvidenceChainLink {
  readonly fromReference: string;
  readonly relationship:
    | "USED_INPUT"
    | "EXECUTED_AS"
    | "EVALUATED_BY"
    | "COMPUTED_WITH"
    | "PRODUCED"
    | "SUPPORTED_BY"
    | "ASSESSED_BY"
    | "REPORTED_AS";
  readonly toReference: string;
}

export type ReproducibilityStatus =
  | "NOT_ASSESSED"
  | "INSUFFICIENT_EVIDENCE"
  | "MANIFEST_COMPLETE"
  | "VERIFIABLE"
  | "REPLAYABLE"
  | "REPRODUCED"
  | "REPLICATION_REQUIRED"
  | "NOT_REPRODUCIBLE_AS_RECORDED";

export type DeterminismClass =
  | "DETERMINISTIC_REPLAY_EXPECTED"
  | "SEEDED_REPLAY_EXPECTED"
  | "STOCHASTIC_REPRODUCTION_ONLY"
  | "EXTERNAL_NONDETERMINISTIC"
  | "HUMAN_NONREPLAYABLE"
  | "UNKNOWN";

export interface EvidencePackageInput {
  readonly packageId: string;
  readonly packageVersion: string;
  readonly schemaVersion: "1.0.0";
  readonly packageMode: "SELF_CONTAINED" | "PARTIALLY_SELF_CONTAINED" | "REFERENTIAL";
  readonly target: {
    readonly referenceId: string;
    readonly scope: EvidenceRecordScope;
    readonly claimOrResultType: string;
  };
  readonly records: readonly EvidenceRecordReference[];
  readonly requirements: readonly EvidenceRequirement[];
  readonly artifacts: readonly ArtifactReference[];
  readonly executionManifest: ExecutionManifest;
  readonly environmentManifest: EnvironmentManifest;
  readonly completeness: readonly EvidenceCompletenessEntry[];
  readonly chain: readonly EvidenceChainLink[];
  readonly determinismClass: DeterminismClass;
  readonly evaluatorDeterminism: EvidenceValue<EvaluatorDeterminism>;
  readonly reproducibilityStatus: ReproducibilityStatus;
  readonly signatureStatus: "NOT_IMPLEMENTED";
  readonly limitations: readonly string[];
  readonly scientificAuthority: "NONE";
  readonly auditMetadata?: { readonly createdAt?: string; readonly requestId?: string } | undefined;
}

export interface EvidencePackage extends EvidencePackageInput {
  readonly packageDigest: string;
}

export type VerificationOutcome =
  | "VERIFIED_INTERNAL_CONSISTENCY"
  | "PARTIALLY_VERIFIED"
  | "VERIFICATION_FAILED"
  | "INSUFFICIENT_EVIDENCE"
  | "NOT_ASSESSED";
export type VerificationFindingSeverity = "INFO" | "WARNING" | "ERROR";

export interface VerificationFinding {
  readonly code: string;
  readonly severity: VerificationFindingSeverity;
  readonly subjectReference: string;
  readonly expectedState: string;
  readonly observedState?: string | undefined;
  readonly evidenceReferences: readonly string[];
  readonly rationale: string;
}

export interface EvidenceVerificationResult {
  readonly packageId: string;
  readonly packageDigest: string;
  readonly outcome: VerificationOutcome;
  readonly authority: "INTERNAL_CONSISTENCY_ONLY";
  readonly schemaValid: boolean;
  readonly digestConsistent: boolean;
  readonly referenceClosure: boolean;
  readonly findings: readonly VerificationFinding[];
  readonly missingEvidence: readonly string[];
  readonly restrictedEvidence: readonly string[];
  readonly scientificAuthority: "NONE";
}

export interface ReplayAssessment {
  readonly packageDigest: string;
  readonly outcome:
    | "READY_FOR_REPLAY"
    | "LIMITED_REPLAY_POSSIBLE"
    | "REPLAY_BLOCKED"
    | "NOT_APPLICABLE";
  readonly determinismClass: DeterminismClass;
  readonly blockers: readonly string[];
  readonly availableInputs: readonly string[];
  readonly limitations: readonly string[];
  readonly replayIsReproduction: false;
  readonly scientificAuthority: "NONE";
}

export interface EquivalenceRule {
  readonly ruleId: string;
  readonly ruleVersion: string;
  readonly resultType:
    | "CANONICAL_JSON"
    | "CATEGORICAL"
    | "NUMERIC"
    | "STOCHASTIC_OUTPUT"
    | "HUMAN_PROTOCOL";
  readonly method: "EXACT" | "SEMANTIC" | "DECLARED_NUMERIC_TOLERANCE" | "PROTOCOL_LEVEL";
  readonly tolerance?: number | undefined;
  readonly justification: string;
}

export type ReproductionOutcome =
  | "EXACT_MATCH"
  | "SEMANTICALLY_EQUIVALENT"
  | "WITHIN_DECLARED_TOLERANCE"
  | "MATERIAL_DIFFERENCE"
  | "NOT_COMPARABLE"
  | "INSUFFICIENT_EVIDENCE"
  | "NOT_APPLICABLE";

export interface ReproductionAttemptInput {
  readonly attemptId: string;
  readonly attemptVersion: string;
  readonly originalPackageDigest: string;
  readonly reproductionExecutionManifestDigest: string;
  readonly reproductionEnvironmentDigest: string;
  readonly originalResultDigest: EvidenceValue<string>;
  readonly reproducedResultDigest: EvidenceValue<string>;
  readonly originalNumericValue?: number | undefined;
  readonly reproducedNumericValue?: number | undefined;
  readonly equivalenceRule: EquivalenceRule;
  readonly reproductionArtifactIds: readonly string[];
  readonly limitations: readonly string[];
}

export interface ReproductionAttempt extends ReproductionAttemptInput {
  readonly attemptDigest: string;
  readonly outcome: ReproductionOutcome;
  readonly replicationStatus: "NOT_PERFORMED";
  readonly scientificAuthority: "NONE";
}

export interface EvidenceValidationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface EvidenceRepresentativeCase {
  readonly caseId: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J";
  readonly description: string;
  readonly verificationOutcome: VerificationOutcome;
  readonly replayOutcome: ReplayAssessment["outcome"];
  readonly scientificEvidence: "NONE_SYNTHETIC_FIXTURE";
}

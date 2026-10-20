import type {
  EvaluatorConfiguration,
  EvaluatorExecution,
  EvaluatorIdentity
} from "./evaluator-types.js";
import type {
  ArtifactReference,
  EnvironmentManifest,
  EnvironmentManifestInput,
  EvidencePackage,
  EvidenceRecordReference,
  EvidenceVerificationResult,
  ExecutionConditionEvidence,
  SemanticDigest,
  SourceRevisionEvidence
} from "./evidence-types.js";
import type { MetricAggregationContext } from "./metrics.js";
import type {
  MetricIdentity,
  MetricMissingReason,
  MetricObservation,
  MetricResult
} from "./metric-types.js";
import type { BenchmarkIdentity } from "./registry-types.js";
import type { ReliabilityStudyIdentity } from "./reliability-types.js";
import type {
  ConstructAssessment,
  ConstructIdentity,
  Operationalization,
  OperationalizationIdentity,
  PromotionGateId,
  ResearchIntake,
  ResearchIntakeIdentity
} from "./research-intake-types.js";

export interface ControlledStudyIdentity {
  readonly studyId: string;
  readonly studyVersion: string;
}

export type CanonicalStudyCoreReference =
  | { readonly scope: "RESEARCH_INTAKE"; readonly identity: ResearchIntakeIdentity }
  | { readonly scope: "CONSTRUCT"; readonly identity: ConstructIdentity }
  | { readonly scope: "OPERATIONALIZATION"; readonly identity: OperationalizationIdentity }
  | { readonly scope: "BENCHMARK"; readonly identity: BenchmarkIdentity }
  | { readonly scope: "METRIC"; readonly identity: MetricIdentity }
  | { readonly scope: "EVALUATOR"; readonly identity: EvaluatorIdentity }
  | { readonly scope: "RELIABILITY_STUDY"; readonly identity: ReliabilityStudyIdentity }
  | {
      readonly scope: "EVIDENCE_PACKAGE";
      readonly identity: { readonly packageId: string; readonly packageVersion: string };
    };

export interface ConstructRegistryBridge {
  readonly researchConstructIdentity: ConstructIdentity;
  readonly registryConstructId: string;
  readonly relationship: "EXPLICIT_VERSIONED_COMPATIBILITY";
  readonly compatibilityEvidenceReferences: readonly string[];
  readonly sameIdDoesNotImplySameVersion: true;
}

export interface OperationalizationCoreBinding {
  readonly role: "NON_HUMAN";
  readonly operationalizationIdentity: OperationalizationIdentity;
  readonly constructIdentity: ConstructIdentity;
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly metricIdentity: MetricIdentity;
  readonly evaluatorIdentity: EvaluatorIdentity;
}

export interface ControlledStudyDefinitionInput {
  readonly identity: ControlledStudyIdentity;
  readonly schemaVersion: "1.0.0";
  readonly studyMode: "SYNTHETIC_CONFORMANCE";
  readonly researchIntakeIdentity: ResearchIntakeIdentity;
  readonly constructBridge: ConstructRegistryBridge;
  readonly operationalizationBinding: OperationalizationCoreBinding;
  readonly reliabilityStudyIdentity?: ReliabilityStudyIdentity | undefined;
  readonly evidenceReferences: readonly string[];
  readonly limitations: readonly string[];
  readonly authority: "ORCHESTRATION_AND_INTEGRATION_ONLY";
  readonly scientificAuthority: "NONE";
}

export interface ControlledStudyDefinition extends ControlledStudyDefinitionInput {
  readonly sourceDigests: {
    readonly researchIntake: SemanticDigest;
    readonly construct: SemanticDigest;
    readonly operationalization: SemanticDigest;
  };
  readonly studyDigest: SemanticDigest;
}

export interface ControlledStudySourceRecords {
  readonly researchIntake: ResearchIntake;
  readonly construct: ConstructAssessment;
  readonly operationalization: Operationalization;
}

export interface ControlledExecutionPlanInput {
  readonly planId: string;
  readonly planVersion: string;
  readonly studyIdentity: ControlledStudyIdentity;
  readonly studyDigest: SemanticDigest;
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly metricIdentity: MetricIdentity;
  readonly evaluatorIdentity: EvaluatorIdentity;
  readonly inputArtifactIds: readonly string[];
  readonly expectedOutputArtifactIds: readonly string[];
  readonly intendedConditions: ExecutionConditionEvidence;
  readonly executionPolicy: "SYNTHETIC_INGESTION_ONLY";
  readonly toolPolicy: "NO_EXTERNAL_TOOLS";
  readonly modelProviderRequirement: "NONE";
  readonly seedPolicy: "NOT_APPLICABLE" | "EXPLICIT";
  readonly environmentRequirement: string;
  readonly expectedEvidenceScopes: readonly (
    | "METRIC_S03"
    | "EVALUATOR_S04"
    | "EXECUTION_S09"
    | "RESULT"
  )[];
  readonly scientificAuthority: "NONE";
}

export interface ControlledExecutionPlan extends ControlledExecutionPlanInput {
  readonly planDigest: SemanticDigest;
}

export interface SyntheticEvaluatorExecutionInput {
  readonly executionId: string;
  readonly runId: string;
  readonly subject: { readonly subjectId: string; readonly subjectKind: string };
  readonly evaluationTarget: string;
  readonly inputKind: string;
  readonly inputReferences: readonly string[];
  readonly status: "SUCCEEDED" | "FAILED" | "ABSTAINED" | "NOT_APPLICABLE";
  readonly failure?: { readonly code: string; readonly detail: string } | undefined;
  readonly metricMissingReason?: MetricMissingReason | undefined;
  readonly abstention?: EvaluatorExecution["abstention"];
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly executedAt: string;
}

export interface SyntheticExecutionIngestionInput {
  readonly definition: ControlledStudyDefinition;
  readonly plan: ControlledExecutionPlan;
  readonly configuration: EvaluatorConfiguration;
  readonly observations: readonly MetricObservation[];
  readonly metricAggregation: MetricAggregationContext;
  readonly execution: SyntheticEvaluatorExecutionInput;
  readonly environment: EnvironmentManifestInput;
  readonly observedConditions: ExecutionConditionEvidence;
  readonly artifacts: readonly ArtifactReference[];
  readonly observedOutputArtifactIds?: readonly string[] | undefined;
  readonly additionalEvidenceRecords?: readonly EvidenceRecordReference[] | undefined;
  readonly sourceRevision: SourceRevisionEvidence;
  readonly evidencePackageIdentity: {
    readonly packageId: string;
    readonly packageVersion: string;
  };
}

export interface ControlledStudyTrace {
  readonly study: ControlledStudyDefinition;
  readonly plan: ControlledExecutionPlan;
  readonly metricResult: MetricResult;
  readonly evaluatorExecution: EvaluatorExecution;
  readonly environmentManifest: EnvironmentManifest;
  readonly evidenceRecords: readonly EvidenceRecordReference[];
  readonly evidencePackage: EvidencePackage;
  readonly verification: EvidenceVerificationResult;
  readonly evidenceClass: "SYNTHETIC_NON_EMPIRICAL";
  readonly scientificAuthority: "NONE";
}

export interface PromotionEvidenceHandoff {
  readonly gateId: PromotionGateId;
  readonly studyIdentity: ControlledStudyIdentity;
  readonly studyDigest: SemanticDigest;
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly evidencePackageIdentity: {
    readonly packageId: string;
    readonly packageVersion: string;
    readonly packageDigest: string;
  };
  readonly evidenceRecordReferences: readonly string[];
  readonly evidenceState: "PRESENT_NOT_ASSESSED";
  readonly sufficiencyDetermination: "NOT_PERFORMED";
  readonly promotionGateStatus: "NOT_SET";
  readonly authority: "ORCHESTRATION_AND_INTEGRATION_ONLY";
  readonly scientificAuthority: "NONE";
}

export interface StudyIntegrationViolation {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

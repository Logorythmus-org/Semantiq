import { canonicalJson } from "../../sandbox-contracts/src/index.js";
import type { EvidencePackage, SemanticDigest } from "./evidence-types.js";
import type { MetricResult } from "./metric-types.js";
import type { MetricRegistry } from "./metrics.js";
import type { BenchmarkIdentity } from "./registry-types.js";
import { BenchmarkRegistry } from "./registry.js";
import { ResearchPromotionSystem } from "./research-intake.js";
import type {
  PromotionAssessment,
  PromotionAssessmentInput,
  PromotionDecision
} from "./research-intake-types.js";
import type { EvidenceResolutionRequirement } from "./study-evidence-resolution.js";
import type { EvaluatorRegistry } from "./evaluators.js";
import type { ReliabilityRegistry } from "./reliability.js";
import {
  applyGovernedCoreAdmission,
  type GovernedCoreAdmissionAuthorization,
  type GovernedCoreAdmissionResult
} from "./governed-core-admission.js";
import {
  ControlledExecutionCoordinator,
  type ControlledExecutionAdapter,
  type ControlledExecutionEvaluator,
  type ControlledExecutionRecordingContext,
  type ControlledExecutionResult
} from "./study-execution-adapter.js";
import { ControlledStudyIntegration } from "./study-integration.js";
import type {
  ControlledExecutionPlan,
  ControlledExecutionPlanInput,
  ControlledStudyDefinition,
  ControlledStudyDefinitionInput,
  ControlledStudySourceRecords
} from "./study-types.js";

export const S11_05_AUTHORITY = "NONE" as const;

export const S11_05_ANTI_OVERCLAIM_INVARIANTS = [
  "VERIFIED_DOES_NOT_IMPLY_VALIDATED",
  "COMPLETE_DOES_NOT_IMPLY_SUFFICIENT",
  "REPRODUCIBLE_DOES_NOT_IMPLY_VALID",
  "GOVERNANCE_APPROVED_DOES_NOT_IMPLY_SCIENTIFICALLY_VALID",
  "CORE_PROMOTED_DOES_NOT_IMPLY_UNIVERSALLY_VALID"
] as const;

export type CoreCompositionGovernanceState =
  | "AWAITING_HUMAN_GOVERNANCE"
  | "NOT_ELIGIBLE"
  | "INSUFFICIENT_EVIDENCE"
  | "BLOCKED_BY_CONTRADICTION";

export interface CoreCompositionTraceStep {
  readonly phase:
    | "S10_RESEARCH"
    | "S11_01_STUDY"
    | "S11_02_EXECUTION"
    | "S09_EVIDENCE"
    | "S11_03_RESOLUTION"
    | "S10_ASSESSMENT";
  readonly inputReference: string;
  readonly outputReference: string;
  readonly digest: SemanticDigest;
  readonly status: "COMPLETED";
}

export interface CoreCompositionTrace {
  readonly compositionId: string;
  readonly compositionVersion: string;
  readonly steps: readonly CoreCompositionTraceStep[];
}

type PlanBindingFields =
  | "studyIdentity"
  | "studyDigest"
  | "benchmarkIdentity"
  | "metricIdentity"
  | "evaluatorIdentity";

export type CoreCompositionPlanInput = Omit<ControlledExecutionPlanInput, PlanBindingFields> &
  Partial<Pick<ControlledExecutionPlanInput, PlanBindingFields>>;

export interface CoreStudyCompositionInput {
  readonly compositionId: string;
  readonly compositionVersion: string;
  readonly sourceRecords: ControlledStudySourceRecords;
  readonly study: ControlledStudyDefinitionInput;
  readonly plan: CoreCompositionPlanInput;
  readonly execution: {
    readonly requestId: string;
    readonly inputArtifacts: Parameters<
      ControlledExecutionCoordinator["createRequest"]
    >[0]["inputArtifacts"];
    readonly timeoutMs?: number | undefined;
    readonly adapter: ControlledExecutionAdapter;
    readonly evaluator: ControlledExecutionEvaluator;
    readonly recording: ControlledExecutionRecordingContext;
  };
  readonly promotion: Omit<
    PromotionAssessmentInput,
    "evidenceRequirements" | "evidenceRecords" | "evidencePackages"
  >;
  readonly additionalEvidenceRequirements?:
    | readonly EvidenceResolutionRequirement[]
    | ((execution: ControlledExecutionResult) => readonly EvidenceResolutionRequirement[]);
  readonly promotionEvidenceRecords?: PromotionAssessmentInput["evidenceRecords"];
  readonly benchmarkRegistry: BenchmarkRegistry;
  readonly metricRegistry: MetricRegistry;
  readonly evaluatorRegistry: EvaluatorRegistry;
  readonly reliabilityRegistry?: ReliabilityRegistry | undefined;
  readonly authority: typeof S11_05_AUTHORITY;
}

export interface CoreStudyCompositionResult {
  readonly compositionId: string;
  readonly compositionVersion: string;
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly study: ControlledStudyDefinition;
  readonly plan: ControlledExecutionPlan;
  readonly execution: ControlledExecutionResult;
  readonly metricResult: MetricResult;
  readonly evidencePackage: EvidencePackage;
  readonly evidenceResolution: PromotionAssessment["evidenceResolution"];
  readonly promotionAssessment: PromotionAssessment;
  readonly governanceState: CoreCompositionGovernanceState;
  readonly registryMutationPerformed: false;
  readonly authority: typeof S11_05_AUTHORITY;
  readonly trace: CoreCompositionTrace;
}

export class CoreCompositionValidationError extends Error {
  constructor(
    readonly code:
      | "AUTHORITY_FORBIDDEN"
      | "IDENTITY_MISMATCH"
      | "DIGEST_MISMATCH"
      | "EVIDENCE_VERIFICATION_FAILED",
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = "CoreCompositionValidationError";
  }
}

const same = (left: unknown, right: unknown): boolean =>
  canonicalJson(left) === canonicalJson(right);
const ref = (id: string, version: string): string => `${id}@${version}`;
const sha256Digest = (value: string): SemanticDigest => ({
  algorithm: "SHA_256",
  value,
  canonicalizationProfile: "semantiq-canonical-json-v1"
});

function ensureOptionalBinding(name: string, supplied: unknown, expected: unknown): void {
  if (supplied !== undefined && !same(supplied, expected))
    throw new CoreCompositionValidationError(
      name === "studyDigest" ? "DIGEST_MISMATCH" : "IDENTITY_MISMATCH",
      `The supplied ${name} does not match the canonical study binding.`
    );
}

function governanceState(
  recommendation: PromotionAssessment["recommendation"]
): CoreCompositionGovernanceState {
  if (recommendation === "ELIGIBLE_FOR_REVIEW") return "AWAITING_HUMAN_GOVERNANCE";
  if (recommendation === "BLOCKED_BY_CONTRADICTION") return "BLOCKED_BY_CONTRADICTION";
  if (recommendation === "NOT_ELIGIBLE") return "NOT_ELIGIBLE";
  return "INSUFFICIENT_EVIDENCE";
}

export class CoreStudyComposer {
  async compose(input: CoreStudyCompositionInput): Promise<CoreStudyCompositionResult> {
    if (input.authority !== S11_05_AUTHORITY)
      throw new CoreCompositionValidationError(
        "AUTHORITY_FORBIDDEN",
        "S-11/05 has composition authority only and no scientific authority."
      );

    const integration = new ControlledStudyIntegration(
      input.benchmarkRegistry,
      input.metricRegistry,
      input.evaluatorRegistry,
      input.reliabilityRegistry
    );
    const study = integration.createStudyDefinition(input.study, input.sourceRecords);
    const binding = study.operationalizationBinding;
    ensureOptionalBinding("studyIdentity", input.plan.studyIdentity, study.identity);
    ensureOptionalBinding("studyDigest", input.plan.studyDigest, study.studyDigest);
    ensureOptionalBinding(
      "benchmarkIdentity",
      input.plan.benchmarkIdentity,
      binding.benchmarkIdentity
    );
    ensureOptionalBinding("metricIdentity", input.plan.metricIdentity, binding.metricIdentity);
    ensureOptionalBinding(
      "evaluatorIdentity",
      input.plan.evaluatorIdentity,
      binding.evaluatorIdentity
    );

    if (
      input.promotion.request.benchmarkIdentity.state !== "KNOWN" ||
      !same(input.promotion.request.benchmarkIdentity.value, binding.benchmarkIdentity) ||
      !same(input.promotion.request.intakeIdentity, study.researchIntakeIdentity)
    )
      throw new CoreCompositionValidationError(
        "IDENTITY_MISMATCH",
        "The promotion request must retain the exact benchmark and intake identities."
      );

    const plan = integration.createExecutionPlan({
      ...input.plan,
      studyIdentity: study.identity,
      studyDigest: study.studyDigest,
      benchmarkIdentity: binding.benchmarkIdentity,
      metricIdentity: binding.metricIdentity,
      evaluatorIdentity: binding.evaluatorIdentity
    });
    const coordinator = new ControlledExecutionCoordinator(integration);
    const request = coordinator.createRequest({
      requestId: input.execution.requestId,
      definition: study,
      plan,
      inputArtifacts: input.execution.inputArtifacts,
      ...(input.execution.timeoutMs === undefined ? {} : { timeoutMs: input.execution.timeoutMs }),
      authority: "CONTROLLED_EXECUTION_ADAPTER_ONLY",
      scientificAuthority: "NONE"
    });
    const execution = await coordinator.executeAndIngest(
      request,
      input.execution.adapter,
      input.execution.evaluator,
      input.execution.recording
    );
    if (execution.trace.verification.outcome !== "VERIFIED_INTERNAL_CONSISTENCY")
      throw new CoreCompositionValidationError(
        "EVIDENCE_VERIFICATION_FAILED",
        "The canonical S-09 package did not pass internal-consistency verification."
      );

    const executionRecord = execution.trace.evidenceRecords.find(
      (record) => record.scope === "EXECUTION_S09"
    );
    if (!executionRecord)
      throw new CoreCompositionValidationError(
        "EVIDENCE_VERIFICATION_FAILED",
        "The canonical execution evidence record is missing."
      );
    const pkg = execution.trace.evidencePackage;
    const canonicalRequirement: EvidenceResolutionRequirement = {
      requirementId: `requirement:${input.compositionId}:s09`,
      gateId: "S09_EVIDENCE_PACKAGE",
      expectedPackage: {
        packageId: pkg.packageId,
        packageVersion: pkg.packageVersion,
        packageDigest: pkg.packageDigest
      },
      expectedBindings: {
        benchmarkIdentity: binding.benchmarkIdentity,
        metricIdentity: binding.metricIdentity,
        evaluatorIdentity: binding.evaluatorIdentity,
        executionId: execution.observation.executionId
      },
      expectedRecord: executionRecord,
      critical: true
    };
    const additional =
      typeof input.additionalEvidenceRequirements === "function"
        ? input.additionalEvidenceRequirements(execution)
        : (input.additionalEvidenceRequirements ?? []);
    const promotionAssessment = new ResearchPromotionSystem().assessPromotion({
      ...input.promotion,
      evidenceRequirements: [canonicalRequirement, ...additional],
      evidenceRecords: input.promotionEvidenceRecords ?? [],
      evidencePackages: [pkg]
    });
    const resolution = promotionAssessment.evidenceResolution;
    const trace: CoreCompositionTrace = {
      compositionId: input.compositionId,
      compositionVersion: input.compositionVersion,
      steps: [
        {
          phase: "S10_RESEARCH",
          inputReference: ref(
            input.sourceRecords.researchIntake.identity.researchIntakeId,
            input.sourceRecords.researchIntake.identity.researchIntakeVersion
          ),
          outputReference: ref(
            input.sourceRecords.operationalization.identity.operationalizationId,
            input.sourceRecords.operationalization.identity.operationalizationVersion
          ),
          digest: input.sourceRecords.operationalization.semanticDigest,
          status: "COMPLETED"
        },
        {
          phase: "S11_01_STUDY",
          inputReference: ref(study.identity.studyId, study.identity.studyVersion),
          outputReference: ref(plan.planId, plan.planVersion),
          digest: plan.planDigest,
          status: "COMPLETED"
        },
        {
          phase: "S11_02_EXECUTION",
          inputReference: request.requestId,
          outputReference: execution.observation.executionId,
          digest: execution.observation.observationDigest,
          status: "COMPLETED"
        },
        {
          phase: "S09_EVIDENCE",
          inputReference: execution.observation.executionId,
          outputReference: ref(pkg.packageId, pkg.packageVersion),
          digest: sha256Digest(pkg.packageDigest),
          status: "COMPLETED"
        },
        {
          phase: "S11_03_RESOLUTION",
          inputReference: ref(pkg.packageId, pkg.packageVersion),
          outputReference: ref(resolution.resolutionId, resolution.resolutionVersion),
          digest: resolution.resolutionDigest,
          status: "COMPLETED"
        },
        {
          phase: "S10_ASSESSMENT",
          inputReference: ref(resolution.resolutionId, resolution.resolutionVersion),
          outputReference: ref(
            promotionAssessment.assessmentId,
            promotionAssessment.assessmentVersion
          ),
          digest: promotionAssessment.assessmentDigest,
          status: "COMPLETED"
        }
      ]
    };
    return {
      compositionId: input.compositionId,
      compositionVersion: input.compositionVersion,
      benchmarkIdentity: binding.benchmarkIdentity,
      study,
      plan,
      execution,
      metricResult: execution.trace.metricResult,
      evidencePackage: pkg,
      evidenceResolution: resolution,
      promotionAssessment,
      governanceState: governanceState(promotionAssessment.recommendation),
      registryMutationPerformed: false,
      authority: S11_05_AUTHORITY,
      trace
    };
  }
}

export const composeCoreStudy = (
  input: CoreStudyCompositionInput
): Promise<CoreStudyCompositionResult> => new CoreStudyComposer().compose(input);

export function continueWithGovernance(
  result: Pick<CoreStudyCompositionResult, "benchmarkIdentity" | "promotionAssessment">,
  registry: BenchmarkRegistry,
  decision: PromotionDecision,
  authorization: GovernedCoreAdmissionAuthorization
): GovernedCoreAdmissionResult {
  return applyGovernedCoreAdmission(registry, result.promotionAssessment, decision, authorization);
}

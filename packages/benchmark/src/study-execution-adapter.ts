import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import type { EvaluatorConfiguration, EvaluatorExecutionStatus } from "./evaluator-types.js";
import type {
  ArtifactReference,
  EnvironmentManifestInput,
  EvidenceValue,
  ExecutionConditionEvidence,
  SemanticDigest,
  SourceRevisionEvidence
} from "./evidence-types.js";
import type { MetricAggregationContext } from "./metrics.js";
import type { MetricMissingReason, MetricObservation } from "./metric-types.js";
import {
  ControlledStudyIntegration,
  StudyIntegrationValidationError
} from "./study-integration.js";
import type {
  ControlledExecutionPlan,
  ControlledStudyDefinition,
  ControlledStudyTrace,
  SyntheticEvaluatorExecutionInput
} from "./study-types.js";

export const S11_02_AUTHORITY = "CONTROLLED_EXECUTION_ADAPTER_ONLY" as const;
export const S11_02_SCIENTIFIC_AUTHORITY = "NONE" as const;
const S11_02_EXECUTION_OBSERVATION_RECORD_VERSION = "1.0.0";

export const S11_02_ANTI_OVERCLAIM_INVARIANTS = [
  "EXECUTION_SUCCESS_DOES_NOT_IMPLY_SCIENTIFIC_VALIDITY",
  "ADAPTER_DETERMINISM_DOES_NOT_IMPLY_EMPIRICAL_RELIABILITY",
  "RECORDED_PROVIDER_IDENTITY_DOES_NOT_IMPLY_REPRODUCIBLE_PROVIDER_STATE",
  "S09_VERIFICATION_DOES_NOT_IMPLY_SCIENTIFIC_TRUTH",
  "OBSERVED_OUTPUT_DOES_NOT_IMPLY_VALID_METRIC",
  "METRIC_RESULT_DOES_NOT_IMPLY_CONSTRUCT_VALIDITY",
  "EXECUTION_EVIDENCE_DOES_NOT_SATISFY_S10_GATES",
  "CONTROLLED_RUN_COMPLETION_DOES_NOT_IMPLY_CORE_ELIGIBILITY"
] as const;

export const CONTROLLED_EXECUTION_FAILURE_CODES = [
  "REQUEST_INVALID",
  "PLAN_MISMATCH",
  "ARTIFACT_MISSING",
  "ADAPTER_FAILURE",
  "EXECUTION_FAILURE",
  "TIMEOUT",
  "OUTPUT_INVALID",
  "EVALUATOR_FAILURE",
  "ENVIRONMENT_MISMATCH",
  "UNSUPPORTED_OPERATION"
] as const;
export type ControlledExecutionFailureCode = (typeof CONTROLLED_EXECUTION_FAILURE_CODES)[number];

export interface ControlledExecutionFailure {
  readonly code: ControlledExecutionFailureCode;
  readonly detail: string;
  readonly retryable: boolean;
}

export interface ControlledProviderObservation {
  readonly providerId: string;
  readonly providerVersion: EvidenceValue<string>;
  readonly executionClass: "SYNTHETIC_ADAPTER" | "LOCAL_DETERMINISTIC" | "PROVIDER_MANAGED";
  readonly stateReproducibility: "REPRODUCIBLE" | "NOT_REPRODUCIBLE" | "UNKNOWN";
}

export interface ControlledExecutionAttempt {
  readonly attemptNumber: number;
  readonly status: "SUCCEEDED" | "FAILED";
  readonly failure?: ControlledExecutionFailure | undefined;
  readonly evidenceReferences: readonly string[];
}

export interface ControlledExecutionTiming {
  readonly startedAt: EvidenceValue<string>;
  readonly completedAt: EvidenceValue<string>;
  readonly durationMs: EvidenceValue<number>;
  readonly tokenUsage: EvidenceValue<{
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly totalTokens: number;
  }>;
  readonly resourceUsage: EvidenceValue<Readonly<Record<string, number>>>;
}

export interface ControlledExecutionRequestInput {
  readonly requestId: string;
  readonly definition: ControlledStudyDefinition;
  readonly plan: ControlledExecutionPlan;
  readonly inputArtifacts: readonly ArtifactReference[];
  readonly timeoutMs?: number | undefined;
  readonly authority: typeof S11_02_AUTHORITY;
  readonly scientificAuthority: typeof S11_02_SCIENTIFIC_AUTHORITY;
}

export interface ControlledExecutionRequest extends ControlledExecutionRequestInput {
  readonly requestDigest: SemanticDigest;
}

export interface ControlledExecutionObservationInput {
  readonly requestDigest: SemanticDigest;
  readonly executionId: string;
  readonly runId: string;
  readonly status: "SUCCEEDED" | "FAILED";
  readonly provider: EvidenceValue<ControlledProviderObservation>;
  readonly observedConditions: ExecutionConditionEvidence;
  readonly environment: EnvironmentManifestInput;
  readonly artifacts: readonly ArtifactReference[];
  readonly failure?: ControlledExecutionFailure | undefined;
  readonly attempts: readonly ControlledExecutionAttempt[];
  readonly timing: ControlledExecutionTiming;
  readonly recordedAt: string;
  readonly evidenceReferences: readonly string[];
  readonly limitations: readonly string[];
  readonly scientificAuthority: typeof S11_02_SCIENTIFIC_AUTHORITY;
}

export interface ControlledConditionDeviation {
  readonly field: string;
  readonly intended: string;
  readonly observed: string;
  readonly evidenceReferences: readonly string[];
}

export interface ControlledExecutionObservation extends ControlledExecutionObservationInput {
  readonly conditionConformance: "CONFORMS" | "DEVIATES" | "UNKNOWN";
  readonly conditionDeviations: readonly ControlledConditionDeviation[];
  readonly observationDigest: SemanticDigest;
}

export interface ControlledExecutionAdapter {
  execute(request: ControlledExecutionRequest): Promise<ControlledExecutionObservationInput>;
}

export interface ControlledExecutionEvaluationOutput {
  readonly status: Exclude<EvaluatorExecutionStatus, "PARTIAL">;
  readonly observations: readonly MetricObservation[];
  readonly failure?: { readonly code: string; readonly detail: string } | undefined;
  readonly abstention?: SyntheticEvaluatorExecutionInput["abstention"];
}

export interface ControlledExecutionEvaluator {
  evaluate(
    request: ControlledExecutionRequest,
    observation: ControlledExecutionObservation
  ): ControlledExecutionEvaluationOutput;
}

export interface ControlledExecutionRecordingContext {
  readonly configuration: EvaluatorConfiguration;
  readonly metricAggregation: MetricAggregationContext;
  readonly subject: { readonly subjectId: string; readonly subjectKind: string };
  readonly evaluationTarget: string;
  readonly inputKind: string;
  readonly evidenceReferences: readonly string[];
  readonly provenanceReference: string;
  readonly sourceRevision: SourceRevisionEvidence;
  readonly evidencePackageIdentity: {
    readonly packageId: string;
    readonly packageVersion: string;
  };
}

export interface ControlledExecutionResult {
  readonly request: ControlledExecutionRequest;
  readonly observation: ControlledExecutionObservation;
  readonly trace: ControlledStudyTrace;
  readonly authority: typeof S11_02_AUTHORITY;
  readonly scientificAuthority: typeof S11_02_SCIENTIFIC_AUTHORITY;
}

const same = (left: unknown, right: unknown): boolean =>
  canonicalJson(left) === canonicalJson(right);

const digest = (value: unknown): SemanticDigest => ({
  algorithm: "SHA_256",
  value: computeSha256(canonicalJson(value)),
  canonicalizationProfile: "semantiq-canonical-json-v1"
});

const sortedUnique = (values: readonly string[]): string[] => [...new Set(values)].sort();

const requestMaterial = (input: ControlledExecutionRequestInput | ControlledExecutionRequest) => ({
  requestId: input.requestId,
  studyIdentity: input.definition.identity,
  studyDigest: input.definition.studyDigest,
  planIdentity: { planId: input.plan.planId, planVersion: input.plan.planVersion },
  planDigest: input.plan.planDigest,
  benchmarkIdentity: input.plan.benchmarkIdentity,
  metricIdentity: input.plan.metricIdentity,
  evaluatorIdentity: input.plan.evaluatorIdentity,
  inputArtifacts: [...input.inputArtifacts]
    .map((artifact) => ({
      artifactId: artifact.artifactId,
      artifactVersion: artifact.artifactVersion,
      contentDigest: artifact.contentDigest,
      semanticDigest: artifact.semanticDigest,
      availability: artifact.availability,
      rightsStatus: artifact.rightsStatus
    }))
    .sort((left, right) => left.artifactId.localeCompare(right.artifactId)),
  intendedConditions: input.plan.intendedConditions,
  environmentRequirement: input.plan.environmentRequirement,
  executionPolicy: input.plan.executionPolicy,
  toolPolicy: input.plan.toolPolicy,
  seedPolicy: input.plan.seedPolicy,
  ...(input.timeoutMs === undefined ? {} : { timeoutMs: input.timeoutMs }),
  authority: input.authority,
  scientificAuthority: input.scientificAuthority
});

const evidenceValue = (value: EvidenceValue<unknown>): string => canonicalJson(value);

const sameEvidenceValue = (left: EvidenceValue<unknown>, right: EvidenceValue<unknown>): boolean =>
  left.state === right.state &&
  (left.state !== "KNOWN" || (right.state === "KNOWN" && same(left.value, right.value)));

const evidenceReferences = (value: EvidenceValue<unknown>): readonly string[] =>
  value.state === "KNOWN" ? value.evidenceReferences : [];

const conditionPairs = (
  intended: ExecutionConditionEvidence,
  observed: ExecutionConditionEvidence
): readonly [string, EvidenceValue<unknown>, EvidenceValue<unknown>][] => [
  ["configurationReference", intended.configurationReference, observed.configurationReference],
  ["configurationDigest", intended.configurationDigest, observed.configurationDigest],
  ["language", intended.language, observed.language],
  ["toolPolicy", intended.toolPolicy, observed.toolPolicy],
  ["model", intended.model, observed.model],
  [
    "samplingConfigurationReference",
    intended.samplingConfigurationReference,
    observed.samplingConfigurationReference
  ],
  ["randomization.policy", intended.randomization.policy, observed.randomization.policy],
  ["randomization.algorithm", intended.randomization.algorithm, observed.randomization.algorithm],
  ["randomization.seed", intended.randomization.seed, observed.randomization.seed],
  ["randomization.scope", intended.randomization.scope, observed.randomization.scope],
  [
    "randomization.implementationVersion",
    intended.randomization.implementationVersion,
    observed.randomization.implementationVersion
  ]
];

export class ControlledExecutionAdapterValidationError extends Error {
  constructor(
    readonly violations: readonly {
      readonly code: string;
      readonly path: string;
      readonly message: string;
    }[]
  ) {
    super(violations.map((item) => `${item.code} at ${item.path}: ${item.message}`).join("\n"));
    this.name = "ControlledExecutionAdapterValidationError";
  }
}

export class ControlledExecutionCoordinator {
  constructor(readonly integration: ControlledStudyIntegration) {}

  createRequest(input: ControlledExecutionRequestInput): ControlledExecutionRequest {
    this.validateRequestInput(input);
    return { ...input, requestDigest: digest(requestMaterial(input)) };
  }

  async executeAndIngest(
    request: ControlledExecutionRequest,
    adapter: ControlledExecutionAdapter,
    evaluator: ControlledExecutionEvaluator,
    recording: ControlledExecutionRecordingContext
  ): Promise<ControlledExecutionResult> {
    this.validateFrozenRequest(request);
    let rawObservation: ControlledExecutionObservationInput;
    try {
      rawObservation = await adapter.execute(request);
    } catch (error) {
      throw new ControlledExecutionAdapterValidationError([
        {
          code: "ADAPTER_FAILURE",
          path: "adapter.execute",
          message: error instanceof Error ? error.message : "The execution adapter failed."
        }
      ]);
    }
    const observation = this.validateObservation(request, rawObservation);
    let evaluation: ControlledExecutionEvaluationOutput;
    if (observation.status === "SUCCEEDED") {
      try {
        evaluation = evaluator.evaluate(request, observation);
      } catch (error) {
        evaluation = {
          status: "FAILED",
          observations: [],
          failure: {
            code: "EVALUATOR_FAILURE",
            detail: error instanceof Error ? error.message : "The evaluator failed."
          }
        };
      }
    } else {
      evaluation = {
        status: "FAILED",
        observations: [],
        failure: {
          code: observation.failure!.code,
          detail: observation.failure!.detail
        }
      };
    }
    this.validateEvaluation(observation, evaluation);
    const artifacts = this.combineArtifacts(request.inputArtifacts, observation.artifacts);
    const metricMissingReason =
      observation.status === "FAILED"
        ? this.missingReasonFor(observation.failure!.code)
        : evaluation.status === "FAILED"
          ? ("EVALUATOR_FAILURE" as const)
          : undefined;
    const execution: SyntheticEvaluatorExecutionInput = {
      executionId: observation.executionId,
      runId: observation.runId,
      subject: recording.subject,
      evaluationTarget: recording.evaluationTarget,
      inputKind: recording.inputKind,
      inputReferences: request.plan.inputArtifactIds,
      status: evaluation.status,
      ...(evaluation.failure ? { failure: evaluation.failure } : {}),
      ...(evaluation.abstention ? { abstention: evaluation.abstention } : {}),
      ...(metricMissingReason ? { metricMissingReason } : {}),
      evidenceReferences: sortedUnique([
        ...recording.evidenceReferences,
        ...observation.evidenceReferences
      ]),
      provenanceReference: recording.provenanceReference,
      executedAt: observation.recordedAt
    };
    const trace = this.integration.ingestSyntheticExecution({
      definition: request.definition,
      plan: request.plan,
      configuration: recording.configuration,
      observations: evaluation.observations,
      metricAggregation: recording.metricAggregation,
      execution,
      environment: observation.environment,
      observedConditions: observation.observedConditions,
      artifacts,
      observedOutputArtifactIds: observation.artifacts
        .filter((artifact) => artifact.kind === "OUTPUT")
        .map((artifact) => artifact.artifactId),
      additionalEvidenceRecords: [
        {
          referenceId: `execution-observation:${observation.executionId}@${S11_02_EXECUTION_OBSERVATION_RECORD_VERSION}`,
          scope: "EXECUTION_S09",
          recordId: `observation:${observation.executionId}`,
          recordVersion: S11_02_EXECUTION_OBSERVATION_RECORD_VERSION,
          semanticDigest: observation.observationDigest,
          availability: "AVAILABLE",
          provenanceReferences: sortedUnique(observation.evidenceReferences)
        }
      ],
      sourceRevision: recording.sourceRevision,
      evidencePackageIdentity: recording.evidencePackageIdentity
    });
    return {
      request,
      observation,
      trace,
      authority: S11_02_AUTHORITY,
      scientificAuthority: S11_02_SCIENTIFIC_AUTHORITY
    };
  }

  private validateRequestInput(input: ControlledExecutionRequestInput): void {
    const violations: { code: string; path: string; message: string }[] = [];
    try {
      this.integration.validatePlanBinding(input.definition, input.plan);
    } catch (error) {
      if (error instanceof StudyIntegrationValidationError)
        violations.push(
          ...error.violations.map((item) => ({
            code: item.code === "PLAN_DIGEST_MISMATCH" ? "PLAN_MISMATCH" : item.code,
            path: item.path,
            message: item.message
          }))
        );
      else throw error;
    }
    if (!input.requestId.trim())
      violations.push({
        code: "REQUEST_INVALID",
        path: "requestId",
        message: "A stable request reference is required."
      });
    if (
      input.authority !== S11_02_AUTHORITY ||
      input.scientificAuthority !== S11_02_SCIENTIFIC_AUTHORITY
    )
      violations.push({
        code: "REQUEST_INVALID",
        path: "authority",
        message: "The adapter has engineering execution authority only."
      });
    if (
      input.timeoutMs !== undefined &&
      (!Number.isInteger(input.timeoutMs) || input.timeoutMs <= 0)
    )
      violations.push({
        code: "REQUEST_INVALID",
        path: "timeoutMs",
        message: "A supplied execution timeout must be a positive integer."
      });
    const ids = input.inputArtifacts.map((artifact) => artifact.artifactId);
    if (new Set(ids).size !== ids.length)
      violations.push({
        code: "REQUEST_INVALID",
        path: "inputArtifacts",
        message: "Input artifact identities must be unique."
      });
    for (const requiredId of input.plan.inputArtifactIds)
      if (!input.inputArtifacts.some((artifact) => artifact.artifactId === requiredId))
        violations.push({
          code: "ARTIFACT_MISSING",
          path: "inputArtifacts",
          message: `Required input artifact '${requiredId}' is missing.`
        });
    for (const artifact of input.inputArtifacts)
      if (artifact.kind !== "INPUT" || !artifact.artifactId || !artifact.artifactVersion)
        violations.push({
          code: "REQUEST_INVALID",
          path: "inputArtifacts",
          message: "Execution requests accept only versioned input artifact references."
        });
    const binding = input.definition.operationalizationBinding;
    if (!this.integration.benchmarkRegistry.get(binding.benchmarkIdentity))
      violations.push({
        code: "PLAN_MISMATCH",
        path: "plan.benchmarkIdentity",
        message: "The exact benchmark identity is not registered."
      });
    if (!this.integration.metricRegistry.get(binding.metricIdentity))
      violations.push({
        code: "PLAN_MISMATCH",
        path: "plan.metricIdentity",
        message: "The exact metric identity is not registered."
      });
    if (!this.integration.evaluatorRegistry.get(binding.evaluatorIdentity))
      violations.push({
        code: "PLAN_MISMATCH",
        path: "plan.evaluatorIdentity",
        message: "The exact evaluator identity is not registered."
      });
    if (violations.length) throw new ControlledExecutionAdapterValidationError(violations);
  }

  private validateFrozenRequest(request: ControlledExecutionRequest): void {
    this.validateRequestInput(request);
    const expected = digest(requestMaterial(request));
    if (!same(request.requestDigest, expected))
      throw new ControlledExecutionAdapterValidationError([
        {
          code: "REQUEST_INVALID",
          path: "requestDigest",
          message: "The controlled execution request changed after validation."
        }
      ]);
  }

  private validateObservation(
    request: ControlledExecutionRequest,
    input: ControlledExecutionObservationInput
  ): ControlledExecutionObservation {
    const violations: { code: string; path: string; message: string }[] = [];
    if (!same(input.requestDigest, request.requestDigest))
      violations.push({
        code: "PLAN_MISMATCH",
        path: "observation.requestDigest",
        message: "The observation does not bind the exact controlled execution request."
      });
    if (!input.executionId.trim() || !input.runId.trim() || !input.recordedAt.trim())
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation",
        message: "Execution, run, and recording references are required."
      });
    if (input.scientificAuthority !== S11_02_SCIENTIFIC_AUTHORITY)
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation.scientificAuthority",
        message: "Execution observation cannot claim scientific authority."
      });
    if (input.observedConditions === request.plan.intendedConditions)
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation.observedConditions",
        message: "Observed conditions must be independently recorded, not reused by reference."
      });
    if (input.status === "FAILED" && (!input.failure?.code || !input.failure.detail))
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation.failure",
        message: "Failed execution requires an explicit canonical failure."
      });
    if (input.status === "SUCCEEDED" && input.failure)
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation.failure",
        message: "A successful execution cannot carry failure evidence."
      });
    if (input.attempts.length === 0)
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation.attempts",
        message: "At least one explicit execution attempt is required."
      });
    input.attempts.forEach((attempt, index) => {
      if (attempt.attemptNumber !== index + 1)
        violations.push({
          code: "OUTPUT_INVALID",
          path: `observation.attempts[${index}].attemptNumber`,
          message: "Attempts must retain contiguous execution order."
        });
      if (attempt.status === "FAILED" && !attempt.failure)
        violations.push({
          code: "OUTPUT_INVALID",
          path: `observation.attempts[${index}].failure`,
          message: "A failed attempt cannot be hidden."
        });
    });
    if (input.attempts.at(-1)?.status !== input.status)
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation.attempts",
        message: "The final attempt status must match the observed execution status."
      });
    const outputIds = input.artifacts
      .filter((artifact) => artifact.kind === "OUTPUT")
      .map((artifact) => artifact.artifactId);
    if (
      input.status === "SUCCEEDED" &&
      request.plan.expectedOutputArtifactIds.some((artifactId) => !outputIds.includes(artifactId))
    )
      violations.push({
        code: "OUTPUT_INVALID",
        path: "observation.artifacts",
        message: "Successful execution must retain every planned output artifact."
      });
    for (const [path, , observed] of conditionPairs(
      request.plan.intendedConditions,
      input.observedConditions
    ))
      if (observed.state === "KNOWN" && observed.evidenceReferences.length === 0)
        violations.push({
          code: "OUTPUT_INVALID",
          path: `observation.observedConditions.${path}`,
          message: "Known observed conditions require evidence references."
        });
    if (violations.length) throw new ControlledExecutionAdapterValidationError(violations);

    const conditionDeviations: ControlledConditionDeviation[] = [];
    let hasUnknown = false;
    for (const [field, intended, observed] of conditionPairs(
      request.plan.intendedConditions,
      input.observedConditions
    )) {
      if (sameEvidenceValue(intended, observed)) continue;
      if (intended.state !== "KNOWN" || observed.state !== "KNOWN") hasUnknown = true;
      else
        conditionDeviations.push({
          field,
          intended: evidenceValue(intended),
          observed: evidenceValue(observed),
          evidenceReferences: sortedUnique(evidenceReferences(observed))
        });
    }
    const observedEnvironment = `${input.environment.environmentId}@${input.environment.environmentVersion}`;
    if (observedEnvironment !== request.plan.environmentRequirement)
      conditionDeviations.push({
        field: "environmentRequirement",
        intended: request.plan.environmentRequirement,
        observed: observedEnvironment,
        evidenceReferences: sortedUnique(input.evidenceReferences)
      });
    const conditionConformance: ControlledExecutionObservation["conditionConformance"] =
      conditionDeviations.length ? "DEVIATES" : hasUnknown ? "UNKNOWN" : "CONFORMS";
    const material = {
      ...input,
      attempts: [...input.attempts],
      artifacts: [...input.artifacts],
      evidenceReferences: sortedUnique(input.evidenceReferences),
      limitations: sortedUnique(input.limitations),
      conditionConformance,
      conditionDeviations
    };
    return { ...material, observationDigest: digest(material) };
  }

  private validateEvaluation(
    observation: ControlledExecutionObservation,
    evaluation: ControlledExecutionEvaluationOutput
  ): void {
    const violations: { code: string; path: string; message: string }[] = [];
    if (observation.status === "FAILED" && evaluation.status !== "FAILED")
      violations.push({
        code: "EVALUATOR_FAILURE",
        path: "evaluation.status",
        message: "A failed adapter execution cannot be evaluated as successful."
      });
    if (observation.status === "FAILED" && evaluation.observations.length)
      violations.push({
        code: "EVALUATOR_FAILURE",
        path: "evaluation.observations",
        message: "Adapter failure cannot produce a metric observation."
      });
    if (evaluation.status !== "SUCCEEDED" && evaluation.observations.length)
      violations.push({
        code: "EVALUATOR_FAILURE",
        path: "evaluation.observations",
        message: "Only successful S-04 evaluation may supply S-03 observations."
      });
    if (violations.length) throw new ControlledExecutionAdapterValidationError(violations);
  }

  private combineArtifacts(
    inputs: readonly ArtifactReference[],
    observed: readonly ArtifactReference[]
  ): readonly ArtifactReference[] {
    const artifacts = new Map<string, ArtifactReference>();
    for (const artifact of [...inputs, ...observed]) {
      const existing = artifacts.get(artifact.artifactId);
      if (existing && !same(existing, artifact))
        throw new ControlledExecutionAdapterValidationError([
          {
            code: "OUTPUT_INVALID",
            path: "artifacts",
            message: `Artifact '${artifact.artifactId}' has conflicting representations.`
          }
        ]);
      artifacts.set(artifact.artifactId, artifact);
    }
    return [...artifacts.values()].sort((left, right) =>
      left.artifactId.localeCompare(right.artifactId)
    );
  }

  private missingReasonFor(code: ControlledExecutionFailureCode): MetricMissingReason {
    return ["REQUEST_INVALID", "PLAN_MISMATCH", "ARTIFACT_MISSING", "OUTPUT_INVALID"].includes(code)
      ? "INVALID_INPUT"
      : "NOT_OBSERVED";
  }
}

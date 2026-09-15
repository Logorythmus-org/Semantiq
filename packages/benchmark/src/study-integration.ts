import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import type { EvaluatorDeterminism, EvaluatorExecution } from "./evaluator-types.js";
import type {
  DeterminismClass,
  EvidenceCompletenessDimension,
  EvidenceCompletenessEntry,
  EvidenceRecordReference,
  EvidenceValue,
  SemanticDigest
} from "./evidence-types.js";
import { EvidenceSystem, EvidenceVerifier } from "./evidence.js";
import { missingMetricResultForExecution, type EvaluatorRegistry } from "./evaluators.js";
import type { MetricResult } from "./metric-types.js";
import type { MetricRegistry } from "./metrics.js";
import type { BenchmarkRegistry } from "./registry.js";
import type { ReliabilityRegistry } from "./reliability.js";
import type {
  ControlledExecutionPlan,
  ControlledExecutionPlanInput,
  ControlledStudyDefinition,
  ControlledStudyDefinitionInput,
  ControlledStudySourceRecords,
  ControlledStudyTrace,
  PromotionEvidenceHandoff,
  StudyIntegrationViolation,
  SyntheticExecutionIngestionInput
} from "./study-types.js";

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const SUPPORTED_SYNTHETIC_EXECUTION_STATUSES = [
  "SUCCEEDED",
  "FAILED",
  "ABSTAINED",
  "NOT_APPLICABLE"
] as const;

const sameIdentity = (left: object, right: object): boolean =>
  canonicalJson(left) === canonicalJson(right);

const semanticDigest = (value: unknown): SemanticDigest => ({
  algorithm: "SHA_256",
  value: computeSha256(canonicalJson(value)),
  canonicalizationProfile: "semantiq-canonical-json-v1"
});

const known = <T>(value: T, evidenceReferences: readonly string[]): EvidenceValue<T> => ({
  state: "KNOWN",
  value,
  evidenceReferences
});

const notApplicable = <T>(reason: string): EvidenceValue<T> => ({
  state: "NOT_APPLICABLE",
  reason
});

const sortedUnique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort();

const hasExactKeys = (value: object, expected: readonly string[]): boolean =>
  sameIdentity(Object.keys(value).sort(), [...expected].sort());

const studyMaterial = (
  input: ControlledStudyDefinitionInput,
  sources: ControlledStudySourceRecords
) => ({
  identity: {
    studyId: input.identity.studyId,
    studyVersion: input.identity.studyVersion
  },
  schemaVersion: input.schemaVersion,
  studyMode: input.studyMode,
  researchIntakeIdentity: {
    researchIntakeId: input.researchIntakeIdentity.researchIntakeId,
    researchIntakeVersion: input.researchIntakeIdentity.researchIntakeVersion
  },
  constructBridge: {
    researchConstructIdentity: {
      constructId: input.constructBridge.researchConstructIdentity.constructId,
      constructVersion: input.constructBridge.researchConstructIdentity.constructVersion
    },
    registryConstructId: input.constructBridge.registryConstructId,
    relationship: input.constructBridge.relationship,
    compatibilityEvidenceReferences: sortedUnique(
      input.constructBridge.compatibilityEvidenceReferences
    ),
    sameIdDoesNotImplySameVersion: input.constructBridge.sameIdDoesNotImplySameVersion
  },
  operationalizationBinding: {
    role: input.operationalizationBinding.role,
    operationalizationIdentity: {
      operationalizationId:
        input.operationalizationBinding.operationalizationIdentity.operationalizationId,
      operationalizationVersion:
        input.operationalizationBinding.operationalizationIdentity.operationalizationVersion
    },
    constructIdentity: {
      constructId: input.operationalizationBinding.constructIdentity.constructId,
      constructVersion: input.operationalizationBinding.constructIdentity.constructVersion
    },
    benchmarkIdentity: {
      benchmarkId: input.operationalizationBinding.benchmarkIdentity.benchmarkId,
      benchmarkVersion: input.operationalizationBinding.benchmarkIdentity.benchmarkVersion
    },
    metricIdentity: {
      metricId: input.operationalizationBinding.metricIdentity.metricId,
      metricVersion: input.operationalizationBinding.metricIdentity.metricVersion
    },
    evaluatorIdentity: {
      evaluatorId: input.operationalizationBinding.evaluatorIdentity.evaluatorId,
      evaluatorVersion: input.operationalizationBinding.evaluatorIdentity.evaluatorVersion
    }
  },
  ...(input.reliabilityStudyIdentity
    ? {
        reliabilityStudyIdentity: {
          reliabilityStudyId: input.reliabilityStudyIdentity.reliabilityStudyId,
          reliabilityStudyVersion: input.reliabilityStudyIdentity.reliabilityStudyVersion
        }
      }
    : {}),
  evidenceReferences: sortedUnique(input.evidenceReferences),
  limitations: sortedUnique(input.limitations),
  authority: input.authority,
  scientificAuthority: input.scientificAuthority,
  sourceDigests: {
    researchIntake: sources.researchIntake.semanticDigest,
    construct: sources.construct.semanticDigest,
    operationalization: sources.operationalization.semanticDigest
  }
});

const planMaterial = (input: ControlledExecutionPlanInput | ControlledExecutionPlan) => {
  const withoutDigest = Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== "planDigest")
  ) as unknown as ControlledExecutionPlanInput;
  return {
    ...withoutDigest,
    inputArtifactIds: sortedUnique(input.inputArtifactIds),
    expectedOutputArtifactIds: sortedUnique(input.expectedOutputArtifactIds),
    expectedEvidenceScopes: sortedUnique(input.expectedEvidenceScopes)
  };
};

const add = (
  violations: StudyIntegrationViolation[],
  code: string,
  path: string,
  message: string
) => violations.push({ code, path, message });

export class StudyIntegrationValidationError extends Error {
  constructor(readonly violations: readonly StudyIntegrationViolation[]) {
    super(violations.map((item) => `${item.code} at ${item.path}: ${item.message}`).join("\n"));
    this.name = "StudyIntegrationValidationError";
  }
}

export class ControlledStudyIntegration {
  readonly evidenceSystem: EvidenceSystem;
  readonly evidenceVerifier = new EvidenceVerifier();

  constructor(
    readonly benchmarkRegistry: BenchmarkRegistry,
    readonly metricRegistry: MetricRegistry,
    readonly evaluatorRegistry: EvaluatorRegistry,
    readonly reliabilityRegistry?: ReliabilityRegistry
  ) {
    this.evidenceSystem = new EvidenceSystem({
      hasBenchmark: (identity) => Boolean(this.benchmarkRegistry.get(identity)),
      hasMetric: (identity) => Boolean(this.metricRegistry.get(identity)),
      hasEvaluator: (identity) => Boolean(this.evaluatorRegistry.get(identity))
    });
  }

  createStudyDefinition(
    input: ControlledStudyDefinitionInput,
    sources: ControlledStudySourceRecords
  ): ControlledStudyDefinition {
    const violations: StudyIntegrationViolation[] = [];
    if (
      !hasExactKeys(input.identity, ["studyId", "studyVersion"]) ||
      !input.identity.studyId.trim() ||
      !SEMVER.test(input.identity.studyVersion)
    )
      add(
        violations,
        "INVALID_STUDY_IDENTITY",
        "identity",
        "A non-empty study ID and semantic study version are required."
      );
    if (input.schemaVersion !== "1.0.0")
      add(violations, "UNSUPPORTED_STUDY_SCHEMA", "schemaVersion", "Unknown schemas fail closed.");
    if (
      input.authority !== "ORCHESTRATION_AND_INTEGRATION_ONLY" ||
      input.scientificAuthority !== "NONE"
    )
      add(
        violations,
        "AUTHORITY_ESCALATION_FORBIDDEN",
        "authority",
        "S-11/01 has orchestration authority only and no scientific authority."
      );
    if (input.studyMode !== "SYNTHETIC_CONFORMANCE")
      add(
        violations,
        "NON_SYNTHETIC_STUDY_FORBIDDEN",
        "studyMode",
        "S-11/01 accepts synthetic conformance studies only."
      );
    if (!sameIdentity(input.researchIntakeIdentity, sources.researchIntake.identity))
      add(
        violations,
        "RESEARCH_INTAKE_IDENTITY_MISMATCH",
        "researchIntakeIdentity",
        "The study must bind the exact S-10 intake identity and version."
      );
    if (!sameIdentity(input.constructBridge.researchConstructIdentity, sources.construct.identity))
      add(
        violations,
        "CONSTRUCT_VERSION_MISMATCH",
        "constructBridge.researchConstructIdentity",
        "Matching construct IDs cannot substitute for an exact S-10 construct version."
      );
    if (
      input.constructBridge.relationship !== "EXPLICIT_VERSIONED_COMPATIBILITY" ||
      input.constructBridge.sameIdDoesNotImplySameVersion !== true ||
      input.constructBridge.compatibilityEvidenceReferences.length === 0
    )
      add(
        violations,
        "UNPROVEN_CONSTRUCT_BRIDGE",
        "constructBridge",
        "The S-10 to S-02 construct bridge must be explicit, version-aware, and evidenced."
      );
    if (
      !this.benchmarkRegistry.snapshot.constructs.some(
        (construct) => construct.constructId === input.constructBridge.registryConstructId
      )
    )
      add(
        violations,
        "UNKNOWN_REGISTRY_CONSTRUCT",
        "constructBridge.registryConstructId",
        "The S-02 registry construct must exist."
      );
    const binding = input.operationalizationBinding;
    if (binding.role !== "NON_HUMAN")
      add(
        violations,
        "HUMAN_ROLE_FORBIDDEN",
        "operationalizationBinding.role",
        "The S-11/01 primary spine is non-human."
      );
    if (!sameIdentity(binding.operationalizationIdentity, sources.operationalization.identity))
      add(
        violations,
        "OPERATIONALIZATION_VERSION_MISMATCH",
        "operationalizationBinding.operationalizationIdentity",
        "The study must bind the exact S-10 operationalization identity."
      );
    if (!sameIdentity(binding.constructIdentity, sources.operationalization.constructIdentity))
      add(
        violations,
        "OPERATIONALIZATION_CONSTRUCT_MISMATCH",
        "operationalizationBinding.constructIdentity",
        "Operationalization and study must bind the same exact construct version."
      );
    if (!sameIdentity(binding.constructIdentity, input.constructBridge.researchConstructIdentity))
      add(
        violations,
        "BRIDGE_CONSTRUCT_MISMATCH",
        "operationalizationBinding.constructIdentity",
        "The operationalization must use the construct version preserved by the bridge."
      );
    const benchmark = this.benchmarkRegistry.get(binding.benchmarkIdentity);
    if (!benchmark)
      add(
        violations,
        "UNKNOWN_BENCHMARK_IDENTITY",
        "operationalizationBinding.benchmarkIdentity",
        "The exact S-02 benchmark identity is not registered."
      );
    else if (!benchmark.constructIds.includes(input.constructBridge.registryConstructId))
      add(
        violations,
        "BENCHMARK_CONSTRUCT_MISMATCH",
        "constructBridge.registryConstructId",
        "The S-02 benchmark does not declare the bridged registry construct."
      );
    const metric = this.metricRegistry.get(binding.metricIdentity);
    if (!metric)
      add(
        violations,
        "UNKNOWN_METRIC_IDENTITY",
        "operationalizationBinding.metricIdentity",
        "The exact S-03 metric identity is not registered."
      );
    else if (
      !metric.benchmarkBinding ||
      !sameIdentity(metric.benchmarkBinding.benchmark, binding.benchmarkIdentity) ||
      metric.benchmarkBinding.constructId !== input.constructBridge.registryConstructId
    )
      add(
        violations,
        "METRIC_BINDING_MISMATCH",
        "operationalizationBinding.metricIdentity",
        "The metric must bind the exact benchmark and bridged S-02 construct."
      );
    const evaluator = this.evaluatorRegistry.get(binding.evaluatorIdentity);
    if (!evaluator)
      add(
        violations,
        "UNKNOWN_EVALUATOR_IDENTITY",
        "operationalizationBinding.evaluatorIdentity",
        "The exact S-04 evaluator identity is not registered."
      );
    else {
      if (
        !evaluator.metricBindings.some((identity) => sameIdentity(identity, binding.metricIdentity))
      )
        add(
          violations,
          "EVALUATOR_METRIC_MISMATCH",
          "operationalizationBinding.evaluatorIdentity",
          "The evaluator does not declare the exact metric version."
        );
      if (
        !evaluator.benchmarkBindings.some(
          (candidate) =>
            sameIdentity(candidate.benchmark, binding.benchmarkIdentity) &&
            candidate.constructIds.includes(input.constructBridge.registryConstructId)
        )
      )
        add(
          violations,
          "EVALUATOR_BENCHMARK_MISMATCH",
          "operationalizationBinding.evaluatorIdentity",
          "The evaluator does not declare the exact benchmark and construct binding."
        );
    }
    if (
      input.reliabilityStudyIdentity &&
      (!this.reliabilityRegistry || !this.reliabilityRegistry.get(input.reliabilityStudyIdentity))
    )
      add(
        violations,
        "UNKNOWN_RELIABILITY_STUDY_IDENTITY",
        "reliabilityStudyIdentity",
        "An optional reliability study must resolve to the exact S-05 identity."
      );
    if (violations.length) throw new StudyIntegrationValidationError(violations);
    const material = studyMaterial(input, sources);
    return { ...material, studyDigest: semanticDigest(material) };
  }

  createExecutionPlan(input: ControlledExecutionPlanInput): ControlledExecutionPlan {
    const violations: StudyIntegrationViolation[] = [];
    if (!input.planId.trim() || !SEMVER.test(input.planVersion))
      add(
        violations,
        "INVALID_PLAN_IDENTITY",
        "plan",
        "A non-empty plan ID and semantic plan version are required."
      );
    if (input.executionPolicy !== "SYNTHETIC_INGESTION_ONLY")
      add(
        violations,
        "EXTERNAL_EXECUTION_FORBIDDEN",
        "executionPolicy",
        "S-11/01 cannot execute an external provider."
      );
    if (
      input.toolPolicy !== "NO_EXTERNAL_TOOLS" ||
      input.modelProviderRequirement !== "NONE" ||
      input.scientificAuthority !== "NONE"
    )
      add(
        violations,
        "PLAN_BOUNDARY_VIOLATION",
        "plan",
        "The plan must be non-human, offline, synthetic, and scientifically non-authoritative."
      );
    if (input.inputArtifactIds.length === 0 || input.expectedOutputArtifactIds.length === 0)
      add(
        violations,
        "ARTIFACT_PLAN_REQUIRED",
        "artifacts",
        "Planned input and expected output artifact identities are required."
      );
    const requiredScopes = ["METRIC_S03", "EVALUATOR_S04", "EXECUTION_S09", "RESULT"] as const;
    if (requiredScopes.some((scope) => !input.expectedEvidenceScopes.includes(scope)))
      add(
        violations,
        "INCOMPLETE_EVIDENCE_PLAN",
        "expectedEvidenceScopes",
        "The S-11/01 plan must expect exact metric, evaluator, execution, and result evidence."
      );
    if (violations.length) throw new StudyIntegrationValidationError(violations);
    const material = planMaterial(input);
    return { ...material, planDigest: semanticDigest(material) };
  }

  ingestSyntheticExecution(input: SyntheticExecutionIngestionInput): ControlledStudyTrace {
    this.validatePlanBinding(input.definition, input.plan);
    if (!SUPPORTED_SYNTHETIC_EXECUTION_STATUSES.includes(input.execution.status))
      throw new StudyIntegrationValidationError([
        {
          code: "UNSUPPORTED_EXECUTION_STATUS",
          path: "execution.status",
          message: "S-11/01 does not treat partial or unknown execution states as success."
        }
      ]);
    const binding = input.definition.operationalizationBinding;
    if (!sameIdentity(input.configuration.evaluatorIdentity, binding.evaluatorIdentity))
      throw new StudyIntegrationValidationError([
        {
          code: "CONFIGURATION_EVALUATOR_MISMATCH",
          path: "configuration.evaluatorIdentity",
          message: "The configuration must bind the study's exact evaluator version."
        }
      ]);
    const artifactIds = new Set(input.artifacts.map((artifact) => artifact.artifactId));
    const requiredArtifacts = [
      ...input.plan.inputArtifactIds,
      ...(input.execution.status === "SUCCEEDED" ? input.plan.expectedOutputArtifactIds : [])
    ];
    const missingArtifacts = requiredArtifacts.filter((artifactId) => !artifactIds.has(artifactId));
    if (missingArtifacts.length)
      throw new StudyIntegrationValidationError([
        {
          code: "MISSING_EVIDENCE_ARTIFACT",
          path: "artifacts",
          message: `Planned evidence artifacts are missing: ${missingArtifacts.join(", ")}.`
        }
      ]);
    const metricDefinition = this.metricRegistry.get(binding.metricIdentity)!;
    let metricResult: MetricResult;
    let evaluatorExecution: EvaluatorExecution;
    const executionBase: EvaluatorExecution = {
      ...input.execution,
      evaluatorIdentity: binding.evaluatorIdentity,
      configurationDigest: input.configuration.configurationDigest,
      benchmarkBinding: metricDefinition.benchmarkBinding,
      metricIdentity: binding.metricIdentity,
      evidenceReferences: sortedUnique(input.execution.evidenceReferences)
    };
    if (input.execution.status === "SUCCEEDED") {
      metricResult = this.metricRegistry.aggregate(
        binding.metricIdentity,
        input.observations,
        input.metricAggregation
      );
      evaluatorExecution = {
        ...executionBase,
        output: { kind: "METRIC_RESULT", metricResult }
      };
    } else {
      if (input.observations.length)
        throw new StudyIntegrationValidationError([
          {
            code: "NON_SUCCESS_OBSERVATION_CONFLICT",
            path: "observations",
            message: "Failed, abstained, and not-applicable executions cannot carry observations."
          }
        ]);
      evaluatorExecution = executionBase;
      metricResult = missingMetricResultForExecution(evaluatorExecution, {
        resultId: input.metricAggregation.resultId,
        metricIdentity: binding.metricIdentity,
        ...(metricDefinition.benchmarkBinding
          ? { benchmarkBinding: metricDefinition.benchmarkBinding }
          : {}),
        uncertainty: input.metricAggregation.uncertainty,
        computation: input.metricAggregation.computation,
        evidenceReferences: input.metricAggregation.evidenceReferences,
        provenanceReference: input.metricAggregation.provenanceReference
      });
      const validation = this.metricRegistry.validateResult(metricResult);
      if (!validation.valid)
        throw new StudyIntegrationValidationError(
          validation.violations.map((violation) => ({
            code: `S03_${violation.code}`,
            path: `metricResult.${violation.path}`,
            message: violation.message
          }))
        );
    }
    evaluatorExecution = this.evaluatorRegistry.recordExecution(
      evaluatorExecution,
      input.configuration
    );
    const environmentManifest = this.evidenceSystem.createEnvironmentManifest(input.environment);
    const records = this.createEvidenceRecords(input.definition, metricResult, evaluatorExecution);
    const recordReferences = records.map((record) => record.referenceId);
    const resultReference = this.referenceFor("result", metricResult.resultId, "1.0.0");
    const studyReference = this.referenceFor(
      "study",
      input.definition.identity.studyId,
      input.definition.identity.studyVersion
    );
    const constructReference = this.referenceFor(
      "construct",
      input.definition.constructBridge.researchConstructIdentity.constructId,
      input.definition.constructBridge.researchConstructIdentity.constructVersion
    );
    const executionManifest = this.evidenceSystem.createExecutionManifest({
      manifestId: `manifest:${input.execution.executionId}`,
      manifestVersion: "1.0.0",
      schemaVersion: "1.0.0",
      executionId: input.execution.executionId,
      executionStatus: input.execution.status,
      targetReference: resultReference,
      benchmarkIdentity: known(binding.benchmarkIdentity, recordReferences),
      itemIdentity: notApplicable("The S-11/01 controlled trace is non-human and has no item."),
      constructReference: known(constructReference, recordReferences),
      metricIdentity: known(binding.metricIdentity, recordReferences),
      evaluatorIdentity: known(binding.evaluatorIdentity, recordReferences),
      studyProtocolReference: known(studyReference, recordReferences),
      comparisonDefinitionReference: notApplicable(
        "The S-11/01 trace performs no Human-AI comparison."
      ),
      intended: input.plan.intendedConditions,
      observed: input.observedConditions,
      environmentDigest: environmentManifest.environmentDigest,
      sourceRevision: input.sourceRevision,
      inputArtifactIds: input.plan.inputArtifactIds,
      expectedOutputArtifactIds: input.plan.expectedOutputArtifactIds,
      observedOutputArtifactIds:
        input.execution.status === "SUCCEEDED" ? input.plan.expectedOutputArtifactIds : [],
      evidenceReferences: recordReferences,
      ...(input.execution.failure
        ? {
            failure: {
              failureClass: input.execution.failure.code,
              detail: input.execution.failure.detail
            }
          }
        : {}),
      scientificAuthority: "NONE"
    });
    const completeness = this.completeness(input.definition, input.execution.status);
    const evidencePackage = this.evidenceSystem.createEvidencePackage({
      packageId: input.evidencePackageIdentity.packageId,
      packageVersion: input.evidencePackageIdentity.packageVersion,
      schemaVersion: "1.0.0",
      packageMode: "PARTIALLY_SELF_CONTAINED",
      target: {
        referenceId: resultReference,
        scope: "RESULT",
        claimOrResultType: "SYNTHETIC_NON_EMPIRICAL_METRIC_RESULT"
      },
      records,
      requirements: [
        ...records.map((record) => ({
          requirementId: `requirement:${record.referenceId}`,
          purpose: "ENGINEERING_CONFORMANCE" as const,
          referenceId: record.referenceId,
          critical: true
        })),
        ...requiredArtifacts.map((artifactId) => ({
          requirementId: `requirement:${artifactId}`,
          purpose: "ENGINEERING_CONFORMANCE" as const,
          referenceId: artifactId,
          critical: true
        }))
      ],
      artifacts: input.artifacts,
      executionManifest,
      environmentManifest,
      completeness,
      chain: [
        {
          fromReference: studyReference,
          relationship: "EXECUTED_AS",
          toReference: input.execution.executionId
        },
        ...input.plan.inputArtifactIds.map((artifactId) => ({
          fromReference: input.execution.executionId,
          relationship: "USED_INPUT" as const,
          toReference: artifactId
        })),
        {
          fromReference: input.execution.executionId,
          relationship: "EVALUATED_BY",
          toReference: this.referenceFor(
            "evaluator",
            binding.evaluatorIdentity.evaluatorId,
            binding.evaluatorIdentity.evaluatorVersion
          )
        },
        {
          fromReference: input.execution.executionId,
          relationship: "COMPUTED_WITH",
          toReference: this.referenceFor(
            "metric",
            binding.metricIdentity.metricId,
            binding.metricIdentity.metricVersion
          )
        },
        {
          fromReference: input.execution.executionId,
          relationship: "PRODUCED",
          toReference: resultReference
        }
      ],
      determinismClass: this.determinismClass(
        this.evaluatorRegistry.get(binding.evaluatorIdentity)!.determinism
      ),
      evaluatorDeterminism: known(
        this.evaluatorRegistry.get(binding.evaluatorIdentity)!.determinism,
        recordReferences
      ),
      reproducibilityStatus: "MANIFEST_COMPLETE",
      signatureStatus: "NOT_IMPLEMENTED",
      limitations: [
        "Synthetic architecture conformance only; no empirical, reliability, validity, or promotion claim.",
        "S-09 verification establishes internal consistency only."
      ],
      scientificAuthority: "NONE"
    });
    return {
      study: input.definition,
      plan: input.plan,
      metricResult,
      evaluatorExecution,
      environmentManifest,
      evidenceRecords: records,
      evidencePackage,
      verification: this.evidenceVerifier.verify(evidencePackage),
      evidenceClass: "SYNTHETIC_NON_EMPIRICAL",
      scientificAuthority: "NONE"
    };
  }

  preparePromotionHandoff(
    trace: ControlledStudyTrace,
    gateIds: readonly PromotionEvidenceHandoff["gateId"][]
  ): readonly PromotionEvidenceHandoff[] {
    return [...new Set(gateIds)].sort().map((gateId) => ({
      gateId,
      studyIdentity: trace.study.identity,
      studyDigest: trace.study.studyDigest,
      benchmarkIdentity: trace.study.operationalizationBinding.benchmarkIdentity,
      evidencePackageIdentity: {
        packageId: trace.evidencePackage.packageId,
        packageVersion: trace.evidencePackage.packageVersion,
        packageDigest: trace.evidencePackage.packageDigest
      },
      evidenceRecordReferences: trace.evidenceRecords.map((record) => record.referenceId),
      evidenceState: "PRESENT_NOT_ASSESSED",
      sufficiencyDetermination: "NOT_PERFORMED",
      promotionGateStatus: "NOT_SET",
      authority: "ORCHESTRATION_AND_INTEGRATION_ONLY",
      scientificAuthority: "NONE"
    }));
  }

  private validatePlanBinding(
    definition: ControlledStudyDefinition,
    plan: ControlledExecutionPlan
  ): void {
    const material = planMaterial(plan);
    const expectedPlanDigest = semanticDigest(material);
    const violations: StudyIntegrationViolation[] = [];
    if (!sameIdentity(plan.studyIdentity, definition.identity))
      add(violations, "PLAN_STUDY_MISMATCH", "plan.studyIdentity", "Plan and study differ.");
    if (!sameIdentity(plan.studyDigest, definition.studyDigest))
      add(violations, "STALE_STUDY_DIGEST", "plan.studyDigest", "Plan binds a stale study digest.");
    if (plan.planDigest.value !== expectedPlanDigest.value)
      add(violations, "PLAN_DIGEST_MISMATCH", "plan.planDigest", "Plan material changed.");
    for (const [path, planned, bound] of [
      [
        "benchmarkIdentity",
        plan.benchmarkIdentity,
        definition.operationalizationBinding.benchmarkIdentity
      ],
      ["metricIdentity", plan.metricIdentity, definition.operationalizationBinding.metricIdentity],
      [
        "evaluatorIdentity",
        plan.evaluatorIdentity,
        definition.operationalizationBinding.evaluatorIdentity
      ]
    ] as const)
      if (!sameIdentity(planned, bound))
        add(
          violations,
          "PLAN_VERSION_MISMATCH",
          `plan.${path}`,
          "Plan must bind the exact study version."
        );
    if (violations.length) throw new StudyIntegrationValidationError(violations);
  }

  private createEvidenceRecords(
    definition: ControlledStudyDefinition,
    metricResult: MetricResult,
    evaluatorExecution: EvaluatorExecution
  ): EvidenceRecordReference[] {
    const binding = definition.operationalizationBinding;
    const benchmark = this.benchmarkRegistry.get(binding.benchmarkIdentity)!;
    const metric = this.metricRegistry.get(binding.metricIdentity)!;
    const evaluator = this.evaluatorRegistry.get(binding.evaluatorIdentity)!;
    const available = (
      referenceId: string,
      scope: EvidenceRecordReference["scope"],
      recordId: string,
      recordVersion: string,
      digest: SemanticDigest
    ): EvidenceRecordReference => ({
      referenceId,
      scope,
      recordId,
      recordVersion,
      semanticDigest: digest,
      availability: "AVAILABLE",
      provenanceReferences: ["S11_01_SYNTHETIC_CONFORMANCE"]
    });
    return [
      available(
        this.referenceFor("study", definition.identity.studyId, definition.identity.studyVersion),
        "OTHER",
        definition.identity.studyId,
        definition.identity.studyVersion,
        definition.studyDigest
      ),
      available(
        this.referenceFor(
          "intake",
          definition.researchIntakeIdentity.researchIntakeId,
          definition.researchIntakeIdentity.researchIntakeVersion
        ),
        "OTHER",
        definition.researchIntakeIdentity.researchIntakeId,
        definition.researchIntakeIdentity.researchIntakeVersion,
        definition.sourceDigests.researchIntake
      ),
      available(
        this.referenceFor(
          "construct",
          definition.constructBridge.researchConstructIdentity.constructId,
          definition.constructBridge.researchConstructIdentity.constructVersion
        ),
        "OTHER",
        definition.constructBridge.researchConstructIdentity.constructId,
        definition.constructBridge.researchConstructIdentity.constructVersion,
        definition.sourceDigests.construct
      ),
      available(
        this.referenceFor(
          "operationalization",
          binding.operationalizationIdentity.operationalizationId,
          binding.operationalizationIdentity.operationalizationVersion
        ),
        "OTHER",
        binding.operationalizationIdentity.operationalizationId,
        binding.operationalizationIdentity.operationalizationVersion,
        definition.sourceDigests.operationalization
      ),
      available(
        this.referenceFor(
          "benchmark",
          binding.benchmarkIdentity.benchmarkId,
          binding.benchmarkIdentity.benchmarkVersion
        ),
        "BENCHMARK_S02",
        binding.benchmarkIdentity.benchmarkId,
        binding.benchmarkIdentity.benchmarkVersion,
        semanticDigest(benchmark)
      ),
      available(
        this.referenceFor(
          "metric",
          binding.metricIdentity.metricId,
          binding.metricIdentity.metricVersion
        ),
        "METRIC_S03",
        binding.metricIdentity.metricId,
        binding.metricIdentity.metricVersion,
        semanticDigest(metric)
      ),
      available(
        this.referenceFor(
          "evaluator",
          binding.evaluatorIdentity.evaluatorId,
          binding.evaluatorIdentity.evaluatorVersion
        ),
        "EVALUATOR_S04",
        binding.evaluatorIdentity.evaluatorId,
        binding.evaluatorIdentity.evaluatorVersion,
        semanticDigest(evaluator)
      ),
      available(
        this.referenceFor("result", metricResult.resultId, "1.0.0"),
        "RESULT",
        metricResult.resultId,
        "1.0.0",
        semanticDigest(metricResult)
      ),
      available(
        this.referenceFor("execution", evaluatorExecution.executionId, "1.0.0"),
        "EXECUTION_S09",
        evaluatorExecution.executionId,
        "1.0.0",
        semanticDigest(evaluatorExecution)
      )
    ];
  }

  private completeness(
    definition: ControlledStudyDefinition,
    status: SyntheticExecutionIngestionInput["execution"]["status"]
  ): EvidenceCompletenessEntry[] {
    const complete = new Set<EvidenceCompletenessDimension>([
      "IDENTITY",
      "INPUT",
      "CONFIGURATION",
      "EXECUTION",
      "ENVIRONMENT",
      "DEPENDENCIES",
      "PROVENANCE",
      "METRIC",
      "EVALUATOR"
    ]);
    const notApplicableDimensions = new Set<EvidenceCompletenessDimension>([
      "VALIDITY",
      "HUMAN_PROTOCOL",
      "COMPARABILITY"
    ]);
    return (
      [
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
      ] as EvidenceCompletenessDimension[]
    ).map((dimension) => {
      const outputUnavailable = dimension === "OUTPUT" && status !== "SUCCEEDED";
      const reliabilityPending =
        dimension === "RELIABILITY" && definition.reliabilityStudyIdentity !== undefined;
      const isNotApplicable =
        (dimension === "RELIABILITY" && !definition.reliabilityStudyIdentity) ||
        notApplicableDimensions.has(dimension) ||
        outputUnavailable;
      return {
        dimension,
        status: reliabilityPending
          ? "PARTIAL"
          : isNotApplicable
            ? "NOT_APPLICABLE"
            : complete.has(dimension) || dimension === "OUTPUT"
              ? "COMPLETE"
              : "UNKNOWN",
        critical: !isNotApplicable && !reliabilityPending,
        evidenceReferences: [],
        rationale: reliabilityPending
          ? "The exact S-05 study is bound, but S-11/01 did not execute a reliability study."
          : isNotApplicable
            ? "S-11/01 synthetic conformance does not assess this scientific or role-specific dimension."
            : "The synthetic conformance trace supplied the required architecture record."
      };
    });
  }

  private determinismClass(determinism: EvaluatorDeterminism): DeterminismClass {
    if (determinism === "DETERMINISTIC") return "DETERMINISTIC_REPLAY_EXPECTED";
    if (determinism === "SEEDED_STOCHASTIC") return "SEEDED_REPLAY_EXPECTED";
    if (determinism === "STOCHASTIC") return "STOCHASTIC_REPRODUCTION_ONLY";
    if (determinism === "EXTERNAL_NONDETERMINISTIC") return "EXTERNAL_NONDETERMINISTIC";
    return "UNKNOWN";
  }

  private referenceFor(scope: string, id: string, version: string): string {
    return `core:${scope}:${id}@${version}`;
  }
}

import { describe, expect, it } from "vitest";
import { computeSha256 } from "../../packages/sandbox-contracts/src/index.js";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_EVALUATOR_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  ControlledExecutionAdapterValidationError,
  ControlledExecutionCoordinator,
  ControlledStudyIntegration,
  EvaluatorRegistry,
  MetricRegistry,
  PromotionEvidenceResolver,
  promotionEvidenceRecordDigest,
  ResearchPromotionSystem,
  S11_02_ANTI_OVERCLAIM_INVARIANTS,
  S11_02_AUTHORITY,
  type ArtifactReference,
  type ControlledExecutionAdapter,
  type ControlledExecutionEvaluator,
  type ControlledExecutionObservationInput,
  type ControlledExecutionRequest,
  type ControlledExecutionRequestInput,
  type ControlledStudyDefinition,
  type EnvironmentManifestInput,
  type EvidencePackage,
  type EvidenceValue,
  type ExecutionConditionEvidence,
  type ModelReference,
  type Operationalization,
  type PromotionAssessmentInput,
  type PromotionEvidenceRecord,
  type ResearchIntake,
  type ConstructAssessment,
  type SourceRevisionEvidence
} from "../../packages/benchmark/src/index.js";

const version = "1.0.0";
const benchmarkIdentity = { benchmarkId: "provider_tck", benchmarkVersion: "0.1.0" } as const;
const metricIdentity = {
  metricId: "provider_tck_passed_tests",
  metricVersion: "0.1.0"
} as const;
const evaluatorIdentity = { evaluatorId: "sandbox_tck_suite", evaluatorVersion: "0.1.0" } as const;
const constructIdentity = {
  constructId: "provider_contract_conformance",
  constructVersion: version
} as const;
const operationalizationIdentity = {
  operationalizationId: "operationalization:controlled-adapter-synthetic",
  operationalizationVersion: version
} as const;
const benchmarkRegistry = new BenchmarkRegistry(CANONICAL_BENCHMARK_REGISTRY);
const metricRegistry = new MetricRegistry(CANONICAL_METRIC_REGISTRY, benchmarkRegistry);
const evaluatorRegistry = new EvaluatorRegistry(
  CANONICAL_EVALUATOR_REGISTRY,
  benchmarkRegistry,
  metricRegistry
);
const integration = new ControlledStudyIntegration(
  benchmarkRegistry,
  metricRegistry,
  evaluatorRegistry
);
const coordinator = new ControlledExecutionCoordinator(integration);
const promotion = new ResearchPromotionSystem();
const evidenceResolver = new PromotionEvidenceResolver();
const configuration = evaluatorRegistry.createConfiguration({ evaluatorIdentity, parameters: {} });

const hash = (value: string) => computeSha256(`s11-02:${value}`);
const known = <T>(value: T, reference = "synthetic:observed"): EvidenceValue<T> => ({
  state: "KNOWN",
  value,
  evidenceReferences: [reference]
});
const unavailable = <T>(reason: string): EvidenceValue<T> => ({ state: "UNAVAILABLE", reason });
const notApplicable = <T>(): EvidenceValue<T> => ({
  state: "NOT_APPLICABLE",
  reason: "Synthetic non-human adapter fixture."
});

function conditions(
  overrides: Partial<ExecutionConditionEvidence> = {}
): ExecutionConditionEvidence {
  return {
    configurationReference: known("configuration:controlled-adapter"),
    configurationDigest: known(configuration.configurationDigest),
    language: known("en"),
    toolPolicy: known("NO_EXTERNAL_TOOLS"),
    model: notApplicable<ModelReference>(),
    modelEvidenceStatuses: [],
    samplingConfigurationReference: notApplicable(),
    randomization: {
      policy: notApplicable(),
      algorithm: notApplicable(),
      seed: notApplicable(),
      scope: notApplicable(),
      implementationVersion: notApplicable()
    },
    ...overrides
  };
}

function sourceRecords(): {
  researchIntake: ResearchIntake;
  construct: ConstructAssessment;
  operationalization: Operationalization;
} {
  const researchIntake = promotion.createIntake({
    identity: { researchIntakeId: "intake:controlled-adapter", researchIntakeVersion: version },
    schemaVersion: "1.0.0",
    researchQuestion: "Can a provider-neutral synthetic adapter retain exact execution lineage?",
    sources: [
      {
        sourceId: "source:first-party-controlled-adapter",
        sourceType: "PROJECT_RECORD",
        citationOrReference: "tests/unit/controlled-execution-adapter.test.ts",
        provenanceClass: "PROJECT_EXISTING_SOURCE",
        rightsClass: "FIRST_PARTY_OR_PROJECT",
        limitations: ["Synthetic engineering fixture only."]
      }
    ],
    motivation: "Exercise a provider-neutral execution boundary without external inference.",
    proposedConstruct: "provider contract conformance",
    claimedPhenomenon: "synthetic adapter behavior",
    targetPopulationOrSystem: "deterministic synthetic adapter fixture",
    proposedTaskFamilies: ["controlled-adapter-synthetic"],
    proposedObservableBehaviors: ["one declared adapter observation"],
    proposedOperationalizations: [operationalizationIdentity.operationalizationId],
    proposedMetricEvaluatorRelationships: [
      `${metricIdentity.metricId}@${metricIdentity.metricVersion} -> ${evaluatorIdentity.evaluatorId}@${evaluatorIdentity.evaluatorVersion}`
    ],
    assumptions: ["Synthetic execution is not empirical evidence."],
    limitations: ["No live provider, validity, reliability, or promotion claim."],
    competingExplanations: ["The trace demonstrates software integration only."],
    disconfirmingEvidenceReferences: [],
    rightsStatus: "FIRST_PARTY_OR_PROJECT",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    cyberSensitivity: "NONE",
    intendedDestination: "RESEARCH_ONLY",
    evidenceReferences: ["synthetic:adapter"],
    status: "RESEARCH_CANDIDATE",
    scientificAuthority: "NONE"
  });
  const construct = promotion.createConstruct({
    identity: constructIdentity,
    schemaVersion: "1.0.0",
    conceptualDefinition: "Observed conformance with an exact controlled adapter contract.",
    inclusionBoundary: ["declared adapter checks"],
    exclusionBoundary: ["scientific validity", "model intelligence"],
    observableImplications: ["a synthetic adapter observation can be recorded"],
    competingConstructs: ["general software quality"],
    confounds: ["fixture-only execution"],
    targetDomains: ["engineering conformance"],
    targetPopulationsOrSystems: ["synthetic adapter fixture"],
    supportingEvidenceReferences: [],
    challengingEvidenceReferences: [],
    operationalizationReferences: [operationalizationIdentity.operationalizationId],
    maturity: "PROPOSED",
    limitations: ["No construct-validity evidence."],
    validityStatus: "NOT_ASSESSED",
    scientificAuthority: "NONE"
  });
  const stages = [
    ["CONSTRUCT", "TASK_OR_STIMULUS"],
    ["TASK_OR_STIMULUS", "RESPONSE"],
    ["RESPONSE", "OBSERVABLE_FEATURE"],
    ["OBSERVABLE_FEATURE", "METRIC"],
    ["METRIC", "EVALUATOR"],
    ["EVALUATOR", "INTERPRETATION"]
  ] as const;
  const operationalization = promotion.createOperationalization({
    identity: operationalizationIdentity,
    schemaVersion: "1.0.0",
    constructIdentity,
    transitions: stages.map(([from, to]) => ({
      from,
      to,
      bindingReference: `adapter-binding:${from}:${to}`,
      assumptions: ["The transition is an explicit engineering assumption."],
      failureModes: ["Exact identity or version mismatch."],
      evidenceReferences: ["synthetic:adapter"]
    })),
    interpretation: "One bounded engineering execution observation.",
    alternativeOperationalizationReferences: [],
    limitations: ["No scientific interpretation."],
    status: "SPECIFIED",
    scientificAuthority: "NONE"
  });
  return { researchIntake, construct, operationalization };
}

function study(): ControlledStudyDefinition {
  const sources = sourceRecords();
  return integration.createStudyDefinition(
    {
      identity: { studyId: "study:controlled-adapter", studyVersion: version },
      schemaVersion: "1.0.0",
      studyMode: "SYNTHETIC_CONFORMANCE",
      researchIntakeIdentity: sources.researchIntake.identity,
      constructBridge: {
        researchConstructIdentity: constructIdentity,
        registryConstructId: "provider_contract_conformance",
        relationship: "EXPLICIT_VERSIONED_COMPATIBILITY",
        compatibilityEvidenceReferences: ["review:s11-02-construct-bridge"],
        sameIdDoesNotImplySameVersion: true
      },
      operationalizationBinding: {
        role: "NON_HUMAN",
        operationalizationIdentity,
        constructIdentity,
        benchmarkIdentity,
        metricIdentity,
        evaluatorIdentity
      },
      evidenceReferences: ["synthetic:adapter"],
      limitations: ["Provider-neutral adapter conformance only."],
      authority: "ORCHESTRATION_AND_INTEGRATION_ONLY",
      scientificAuthority: "NONE"
    },
    sources
  );
}

function artifact(artifactId: string, kind: "INPUT" | "OUTPUT" | "LOG"): ArtifactReference {
  const contentDigest = {
    algorithm: "SHA_256" as const,
    value: hash(artifactId),
    representation: "CANONICAL_JSON" as const
  };
  return {
    artifactId,
    artifactVersion: version,
    kind,
    contentDigest,
    observedContentDigest: contentDigest,
    mediaType: "application/json",
    sizeBytes: 64,
    availability: "AVAILABLE",
    locationClass: "PORTABLE_RELATIVE",
    rightsStatus: "REDISTRIBUTION_ALLOWED",
    provenanceReferences: ["synthetic:first-party"],
    limitations: ["Synthetic adapter fixture."]
  };
}

function environment(environmentId = "environment:s11-02-local"): EnvironmentManifestInput {
  return {
    environmentId,
    environmentVersion: version,
    schemaVersion: "1.0.0",
    platform: known("synthetic-platform"),
    architecture: known("synthetic-architecture"),
    runtime: known("node"),
    runtimeVersion: known("synthetic-runtime"),
    containerImageDigest: notApplicable(),
    hardwareClass: known("synthetic-hardware"),
    acceleratorClass: notApplicable(),
    locale: known("en"),
    timezonePolicy: known("UTC"),
    environmentVariables: { classification: "NAMES_ONLY_NO_VALUES", names: ["CI"] },
    dependencies: [],
    dependencyCompleteness: "COMPLETE_FOR_DECLARED_SCOPE",
    networkDependency: "NO_NETWORK",
    toolAvailability: ["node", "vitest"],
    completeness: "FULLY_CAPTURED",
    limitations: ["Synthetic environment observation."],
    scientificAuthority: "NONE"
  };
}

const sourceRevision: SourceRevisionEvidence = {
  gitCommit: known(hash("commit")),
  gitTree: known(hash("tree")),
  packageVersion: known("0.1.0-alpha.2"),
  schemaVersions: [{ schemaId: "controlled-execution-adapter", schemaVersion: version }]
};

function requestInput(): ControlledExecutionRequestInput {
  const definition = study();
  const plan = integration.createExecutionPlan({
    planId: "plan:controlled-adapter",
    planVersion: version,
    studyIdentity: definition.identity,
    studyDigest: definition.studyDigest,
    benchmarkIdentity,
    metricIdentity,
    evaluatorIdentity,
    inputArtifactIds: ["artifact:adapter-input"],
    expectedOutputArtifactIds: ["artifact:adapter-output"],
    intendedConditions: conditions(),
    executionPolicy: "SYNTHETIC_INGESTION_ONLY",
    toolPolicy: "NO_EXTERNAL_TOOLS",
    modelProviderRequirement: "NONE",
    seedPolicy: "NOT_APPLICABLE",
    environmentRequirement: `environment:s11-02-local@${version}`,
    expectedEvidenceScopes: ["METRIC_S03", "EVALUATOR_S04", "EXECUTION_S09", "RESULT"],
    scientificAuthority: "NONE"
  });
  return {
    requestId: "request:controlled-adapter",
    definition,
    plan,
    inputArtifacts: [artifact("artifact:adapter-input", "INPUT")],
    timeoutMs: 5_000,
    authority: S11_02_AUTHORITY,
    scientificAuthority: "NONE"
  };
}

function observation(
  request: ControlledExecutionRequest,
  overrides: Partial<ControlledExecutionObservationInput> = {}
): ControlledExecutionObservationInput {
  return {
    requestDigest: request.requestDigest,
    executionId: "execution:controlled-adapter",
    runId: "run:controlled-adapter",
    status: "SUCCEEDED",
    provider: known({
      providerId: "provider:synthetic-adapter",
      providerVersion: known(version),
      executionClass: "SYNTHETIC_ADAPTER",
      stateReproducibility: "REPRODUCIBLE"
    }),
    observedConditions: conditions(),
    environment: environment(),
    artifacts: [artifact("artifact:adapter-output", "OUTPUT")],
    attempts: [
      {
        attemptNumber: 1,
        status: "SUCCEEDED",
        evidenceReferences: ["synthetic:attempt:1"]
      }
    ],
    timing: {
      startedAt: known("2026-09-15T00:00:00Z"),
      completedAt: known("2026-09-15T00:00:01Z"),
      durationMs: known(1_000),
      tokenUsage: notApplicable(),
      resourceUsage: known({ cpuTimeMs: 10 })
    },
    recordedAt: "2026-09-15T00:00:01Z",
    evidenceReferences: ["synthetic:adapter-observation"],
    limitations: ["Synthetic deterministic adapter; no external inference."],
    scientificAuthority: "NONE",
    ...overrides
  };
}

class FixtureAdapter implements ControlledExecutionAdapter {
  constructor(
    private readonly createObservation: (
      request: ControlledExecutionRequest
    ) => ControlledExecutionObservationInput | Promise<ControlledExecutionObservationInput>
  ) {}

  execute(request: ControlledExecutionRequest): Promise<ControlledExecutionObservationInput> {
    return Promise.resolve(this.createObservation(request));
  }
}

const recording = {
  configuration,
  metricAggregation: {
    resultId: "result:controlled-adapter",
    uncertainty: { method: "NONE" as const },
    computation: {
      computationId: "computation:controlled-adapter",
      evaluatorId: "SandboxTCK.runSuite",
      evaluatorVersion: evaluatorIdentity.evaluatorVersion,
      inputReferences: ["artifact:adapter-output"],
      parameters: { fixture: "SYNTHETIC_NON_EMPIRICAL" }
    },
    evidenceReferences: ["synthetic:adapter-observation"],
    provenanceReference: "provenance:controlled-adapter"
  },
  subject: { subjectId: "provider:synthetic-adapter", subjectKind: "SANDBOX_PROVIDER" },
  evaluationTarget: "provider-contract-conformance",
  inputKind: "TCK_REPORT",
  evidenceReferences: ["synthetic:adapter-observation"],
  provenanceReference: "provenance:controlled-adapter",
  sourceRevision,
  evidencePackageIdentity: { packageId: "evidence:controlled-adapter", packageVersion: version }
};

const successfulEvaluator = {
  evaluate: () => ({
    status: "SUCCEEDED" as const,
    observations: [
      {
        observationId: "observation:controlled-adapter-metric",
        metricIdentity,
        benchmarkBinding: {
          benchmark: benchmarkIdentity,
          constructId: "provider_contract_conformance"
        },
        outcome: { kind: "VALUE" as const, value: 1 },
        provenanceReference: "provenance:controlled-adapter"
      }
    ]
  })
};

async function execute(
  request = coordinator.createRequest(requestInput()),
  createObservation = (value: ControlledExecutionRequest) => observation(value),
  evaluator: ControlledExecutionEvaluator = successfulEvaluator
) {
  return coordinator.executeAndIngest(
    request,
    new FixtureAdapter(createObservation),
    evaluator,
    recording
  );
}

describe("S-11/02 provider-neutral controlled execution adapter", () => {
  it("executes a deterministic non-human adapter and reuses S-03, S-04, and S-09", async () => {
    const result = await execute();
    expect(result.request.requestDigest.value).toHaveLength(64);
    expect(result.observation.conditionConformance).toBe("CONFORMS");
    expect(result.trace.metricResult.outcome).toEqual({ kind: "VALUE", value: 1 });
    expect(result.trace.evaluatorExecution.status).toBe("SUCCEEDED");
    expect(result.trace.evidencePackage.executionManifest.observedOutputArtifactIds).toEqual([
      "artifact:adapter-output"
    ]);
    expect(result.trace.evidenceRecords).toContainEqual(
      expect.objectContaining({
        referenceId: `execution-observation:execution:controlled-adapter@${version}`,
        scope: "EXECUTION_S09",
        semanticDigest: result.observation.observationDigest
      })
    );
    expect(result.trace.verification.outcome).toBe("VERIFIED_INTERNAL_CONSISTENCY");
    expect(result.trace.verification.authority).toBe("INTERNAL_CONSISTENCY_ONLY");
    expect(result.scientificAuthority).toBe("NONE");
  });

  it("resolves exact S-11/02 evidence without treating it as scientific sufficiency", async () => {
    const result = await execute();
    const executionRecord = result.trace.evidenceRecords.find(
      (record) => record.scope === "EXECUTION_S09"
    );
    expect(executionRecord).toBeDefined();
    const resolution = evidenceResolver.resolve({
      resolutionId: "resolution:controlled-adapter",
      resolutionVersion: version,
      request: {
        requestId: "request:controlled-adapter-promotion",
        requestVersion: version,
        benchmarkIdentity: known(benchmarkIdentity),
        intakeIdentity: {
          researchIntakeId: "intake:controlled-adapter",
          researchIntakeVersion: version
        },
        requestedStage: "VALIDATED",
        candidateKind: "GENERAL",
        requestedByGovernance: false,
        evidenceReferences: [],
        rationale: "Synthetic resolver fixture."
      },
      requiredGateIds: ["S09_EVIDENCE_PACKAGE", "VALIDITY", "CALIBRATION", "RELIABILITY"],
      requirements: [
        {
          requirementId: "requirement:synthetic-execution",
          gateId: "S09_EVIDENCE_PACKAGE",
          expectedPackage: {
            packageId: result.trace.evidencePackage.packageId,
            packageVersion: result.trace.evidencePackage.packageVersion,
            packageDigest: result.trace.evidencePackage.packageDigest
          },
          expectedBindings: { benchmarkIdentity, metricIdentity, evaluatorIdentity },
          expectedRecord: executionRecord!,
          critical: true
        }
      ],
      evidencePackages: [result.trace.evidencePackage],
      evidenceRecords: [],
      callerGateAssertions: [
        {
          gateId: "VALIDITY",
          status: "SATISFIED",
          evidenceReferences: ["caller:assertion"],
          rationale: "Ignored compatibility assertion."
        }
      ],
      scientificAuthority: "NONE",
      decisionAuthority: "NONE"
    });
    expect(resolution.findings).toContainEqual(
      expect.objectContaining({
        requirementId: "requirement:synthetic-execution",
        state: "PRESENT"
      })
    );
    expect(
      resolution.gateInputs.find((gate) => gate.gateId === "S09_EVIDENCE_PACKAGE")?.status
    ).toBe("SATISFIED");
    expect(resolution.gateInputs.find((gate) => gate.gateId === "VALIDITY")?.status).toBe(
      "UNKNOWN"
    );
    expect(resolution.ignoredCallerGateAssertionIds).toEqual(["VALIDITY"]);
  });

  it("fails closed when a legacy evidence package omits optional records", () => {
    const resolution = evidenceResolver.resolve({
      resolutionId: "resolution:legacy-package",
      resolutionVersion: version,
      request: {
        requestId: "request:legacy-package",
        requestVersion: version,
        benchmarkIdentity: { state: "UNKNOWN", reason: "Legacy package fixture." },
        intakeIdentity: {
          researchIntakeId: "intake:legacy-package",
          researchIntakeVersion: version
        },
        requestedStage: "VALIDATED",
        candidateKind: "GENERAL",
        requestedByGovernance: false,
        evidenceReferences: [],
        rationale: "Compatibility fixture."
      },
      requiredGateIds: ["S09_EVIDENCE_PACKAGE"],
      requirements: [],
      evidencePackages: [
        { packageId: "legacy:package", packageVersion: version } as unknown as EvidencePackage
      ],
      evidenceRecords: [],
      callerGateAssertions: [],
      scientificAuthority: "NONE",
      decisionAuthority: "NONE"
    });
    expect(resolution.findings).toEqual([]);
    expect(resolution.gateInputs[0]?.evidenceState).toBe("UNKNOWN");
  });

  it("fails closed on missing, mismatched, and unknown typed evidence identities", async () => {
    const result = await execute();
    const requirement = {
      requirementId: "requirement:typed",
      gateId: "S09_EVIDENCE_PACKAGE" as const,
      expectedPackage: {
        packageId: result.trace.evidencePackage.packageId,
        packageVersion: result.trace.evidencePackage.packageVersion,
        packageDigest: result.trace.evidencePackage.packageDigest
      },
      expectedBindings: { metricIdentity: { ...metricIdentity, metricVersion: "9.9.9" } },
      critical: true
    };
    const input = {
      resolutionId: "resolution:typed",
      resolutionVersion: version,
      request: {
        requestId: "request:typed",
        requestVersion: version,
        benchmarkIdentity: known(benchmarkIdentity),
        intakeIdentity: {
          researchIntakeId: "intake:controlled-adapter",
          researchIntakeVersion: version
        },
        requestedStage: "VALIDATED" as const,
        candidateKind: "GENERAL" as const,
        requestedByGovernance: false,
        evidenceReferences: [],
        rationale: "Synthetic resolver fixture."
      },
      requiredGateIds: ["S09_EVIDENCE_PACKAGE" as const],
      requirements: [requirement],
      evidencePackages: [result.trace.evidencePackage],
      evidenceRecords: [],
      callerGateAssertions: [],
      scientificAuthority: "NONE" as const,
      decisionAuthority: "NONE" as const
    };
    expect(evidenceResolver.resolve(input).findings[0]?.state).toBe("INVALID");
    expect(
      evidenceResolver.resolve({
        ...input,
        requirements: [
          {
            ...requirement,
            expectedBindings: {
              evaluatorIdentity: { ...evaluatorIdentity, evaluatorVersion: "9.9.9" }
            }
          }
        ]
      }).findings[0]?.state
    ).toBe("INVALID");
    expect(evidenceResolver.resolve({ ...input, evidencePackages: [] }).findings[0]?.state).toBe(
      "ABSENT"
    );
    expect(
      evidenceResolver.resolve({
        ...input,
        request: {
          ...input.request,
          benchmarkIdentity: { state: "UNKNOWN", reason: "Not resolved." }
        }
      }).findings[0]?.state
    ).toBe("UNKNOWN");
  });

  it("feeds only mechanically resolved evidence into the S-10 assessment", async () => {
    const result = await execute();
    const executionRecord = result.trace.evidenceRecords.find(
      (record) => record.scope === "EXECUTION_S09"
    )!;
    const input: PromotionAssessmentInput = {
      assessmentId: "assessment:typed-resolution",
      assessmentVersion: version,
      schemaVersion: "1.0.0",
      request: {
        requestId: "request:typed-resolution",
        requestVersion: version,
        benchmarkIdentity: known(benchmarkIdentity),
        intakeIdentity: {
          researchIntakeId: "intake:controlled-adapter",
          researchIntakeVersion: version
        },
        requestedStage: "VALIDATED",
        candidateKind: "GENERAL",
        requestedByGovernance: false,
        evidenceReferences: [],
        rationale: "S-10 integration fixture."
      },
      evidenceRequirements: [
        {
          requirementId: "requirement:s09",
          gateId: "S09_EVIDENCE_PACKAGE",
          expectedPackage: {
            packageId: result.trace.evidencePackage.packageId,
            packageVersion: result.trace.evidencePackage.packageVersion,
            packageDigest: result.trace.evidencePackage.packageDigest
          },
          expectedRecord: executionRecord,
          expectedBindings: { benchmarkIdentity, metricIdentity, evaluatorIdentity },
          critical: true
        }
      ],
      gateEvidence: [
        {
          gateId: "VALIDITY",
          status: "SATISFIED",
          evidenceReferences: ["legacy:caller-assertion"],
          rationale: "Must be ignored by S-11/03."
        }
      ],
      evidenceRecords: [],
      evidencePackages: [result.trace.evidencePackage],
      knownConfounds: [],
      unresolvedMethodologicalCriticism: [],
      limitations: ["Synthetic only."],
      scientificAuthority: "NONE"
    };
    const assessment = promotion.assessPromotion(input);
    expect(
      assessment.gateAssessments.find((gate) => gate.gateId === "S09_EVIDENCE_PACKAGE")?.status
    ).toBe("SATISFIED");
    expect(assessment.gateAssessments.find((gate) => gate.gateId === "VALIDITY")?.status).toBe(
      "UNKNOWN"
    );
    expect(assessment.recommendation).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("preserves backed contradiction and negative evidence without deriving promotion", async () => {
    const result = await execute();
    const contradictory: PromotionEvidenceRecord = {
      evidenceId: "evidence:contradiction",
      evidenceVersion: version,
      category: "CONTRADICTORY",
      disposition: "CONTRADICTORY",
      targetReference: "candidate:synthetic",
      evidencePackageReferences: [result.trace.evidencePackage.packageId],
      sourceReferences: ["source:synthetic"],
      finding: "Synthetic contradictory finding.",
      materiality: "MATERIAL",
      resolution: "OPEN",
      rightsClass: "FIRST_PARTY_OR_PROJECT",
      limitations: [],
      scientificAuthority: "NONE"
    };
    const resolution = evidenceResolver.resolve({
      resolutionId: "resolution:contradiction",
      resolutionVersion: version,
      request: {
        requestId: "request:contradiction",
        requestVersion: version,
        benchmarkIdentity: known(benchmarkIdentity),
        intakeIdentity: {
          researchIntakeId: "intake:controlled-adapter",
          researchIntakeVersion: version
        },
        requestedStage: "VALIDATED",
        candidateKind: "GENERAL",
        requestedByGovernance: false,
        evidenceReferences: [],
        rationale: "Synthetic resolver fixture."
      },
      requiredGateIds: ["S09_EVIDENCE_PACKAGE"],
      requirements: [],
      evidencePackages: [
        {
          ...result.trace.evidencePackage,
          records: [
            ...result.trace.evidencePackage.records,
            {
              referenceId: `promotion-evidence:evidence:contradiction@${version}`,
              scope: "EXECUTION_S09",
              recordId: contradictory.evidenceId,
              recordVersion: contradictory.evidenceVersion,
              semanticDigest: promotionEvidenceRecordDigest(contradictory),
              availability: "AVAILABLE",
              provenanceReferences: ["source:synthetic"]
            }
          ]
        }
      ],
      evidenceRecords: [contradictory],
      callerGateAssertions: [],
      scientificAuthority: "NONE",
      decisionAuthority: "NONE"
    });
    expect(resolution.contradictoryEvidenceIds).toEqual(["evidence:contradiction"]);
    expect(resolution.negativeEvidenceIds).toEqual([]);
  });

  it("creates a deterministic request digest over exact study, plan, and artifact bindings", () => {
    const input = requestInput();
    expect(coordinator.createRequest(input).requestDigest).toEqual(
      coordinator.createRequest(input).requestDigest
    );
  });

  it("rejects a stale study identity before adapter execution", () => {
    const input = requestInput();
    expect(() =>
      coordinator.createRequest({
        ...input,
        plan: {
          ...input.plan,
          studyIdentity: { ...input.plan.studyIdentity, studyVersion: "9.9.9" }
        }
      })
    ).toThrowError(/PLAN_STUDY_MISMATCH/);
  });

  it("rejects a stale plan digest before adapter execution", () => {
    const input = requestInput();
    expect(() =>
      coordinator.createRequest({
        ...input,
        plan: { ...input.plan, planDigest: { ...input.plan.planDigest, value: hash("stale-plan") } }
      })
    ).toThrowError(/PLAN_MISMATCH/);
  });

  it.each([
    ["benchmark", { benchmarkIdentity: { ...benchmarkIdentity, benchmarkVersion: "9.9.9" } }],
    ["metric", { metricIdentity: { ...metricIdentity, metricVersion: "9.9.9" } }],
    ["evaluator", { evaluatorIdentity: { ...evaluatorIdentity, evaluatorVersion: "9.9.9" } }]
  ])("rejects a stale %s version before adapter execution", (_name, planOverride) => {
    const input = requestInput();
    expect(() =>
      coordinator.createRequest({ ...input, plan: { ...input.plan, ...planOverride } })
    ).toThrowError(/PLAN_VERSION_MISMATCH|PLAN_MISMATCH/);
  });

  it("rejects a missing required input artifact before adapter execution", () => {
    const input = requestInput();
    expect(() => coordinator.createRequest({ ...input, inputArtifacts: [] })).toThrowError(
      /ARTIFACT_MISSING/
    );
  });

  it("fails closed when the adapter throws", async () => {
    const request = coordinator.createRequest(requestInput());
    await expect(
      coordinator.executeAndIngest(
        request,
        new FixtureAdapter(() => {
          throw new Error("synthetic adapter fault");
        }),
        successfulEvaluator,
        recording
      )
    ).rejects.toThrowError(/ADAPTER_FAILURE/);
  });

  it("records timeout as failure and S-03 missingness rather than zero", async () => {
    let evaluatorCalls = 0;
    const result = await execute(
      undefined,
      (request) =>
        observation(request, {
          status: "FAILED",
          artifacts: [],
          failure: { code: "TIMEOUT", detail: "Synthetic timeout after 5000 ms.", retryable: true },
          attempts: [
            {
              attemptNumber: 1,
              status: "FAILED",
              failure: {
                code: "TIMEOUT",
                detail: "Synthetic timeout after 5000 ms.",
                retryable: true
              },
              evidenceReferences: ["synthetic:attempt:1"]
            }
          ]
        }),
      {
        evaluate: () => {
          evaluatorCalls += 1;
          return successfulEvaluator.evaluate();
        }
      }
    );
    expect(evaluatorCalls).toBe(0);
    expect(result.trace.evaluatorExecution.failure?.code).toBe("TIMEOUT");
    expect(result.trace.metricResult.outcome).toMatchObject({
      kind: "MISSING",
      reason: "NOT_OBSERVED"
    });
    expect(result.trace.metricResult.outcome).not.toEqual({ kind: "VALUE", value: 0 });
  });

  it("rejects successful adapter output when a planned output artifact is missing", async () => {
    await expect(
      execute(undefined, (request) => observation(request, { artifacts: [] }))
    ).rejects.toThrowError(/OUTPUT_INVALID/);
  });

  it("preserves an observed environment mismatch as an explicit deviation", async () => {
    const result = await execute(undefined, (request) =>
      observation(request, { environment: environment("environment:unexpected") })
    );
    expect(result.observation.conditionConformance).toBe("DEVIATES");
    expect(result.observation.conditionDeviations).toContainEqual(
      expect.objectContaining({ field: "environmentRequirement" })
    );
    expect(result.trace.evidencePackage.environmentManifest.environmentId).toBe(
      "environment:unexpected"
    );
  });

  it("preserves planned and observed tool-policy mismatch without normalization", async () => {
    const result = await execute(undefined, (request) =>
      observation(request, {
        observedConditions: conditions({ toolPolicy: known("EXTERNAL_TOOL_AVAILABLE") })
      })
    );
    expect(result.observation.conditionConformance).toBe("DEVIATES");
    expect(result.observation.conditionDeviations).toContainEqual(
      expect.objectContaining({ field: "toolPolicy" })
    );
    expect(result.trace.evidencePackage.executionManifest.intended.toolPolicy).toEqual(
      known("NO_EXTERNAL_TOOLS")
    );
    expect(result.trace.evidencePackage.executionManifest.observed.toolPolicy).toEqual(
      known("EXTERNAL_TOOL_AVAILABLE")
    );
  });

  it("retains unknown provider state and model snapshot without fabrication", async () => {
    const result = await execute(undefined, (request) =>
      observation(request, {
        provider: unavailable("Provider-managed state was not exposed."),
        observedConditions: conditions({
          model: unavailable("The adapter did not expose a model snapshot."),
          modelEvidenceStatuses: ["SNAPSHOT_UNKNOWN", "PROVIDER_STATE_UNAVAILABLE"]
        })
      })
    );
    expect(result.observation.provider.state).toBe("UNAVAILABLE");
    expect(result.observation.observedConditions.model.state).toBe("UNAVAILABLE");
    expect(result.observation.conditionConformance).toBe("UNKNOWN");
  });

  it("keeps evaluator failure separate and maps it to explicit S-03 missingness", async () => {
    const result = await execute(undefined, undefined, {
      evaluate: () => ({
        status: "FAILED",
        observations: [],
        failure: { code: "EVALUATOR_FAILURE", detail: "Synthetic evaluator failure." }
      })
    });
    expect(result.observation.status).toBe("SUCCEEDED");
    expect(result.trace.evaluatorExecution.status).toBe("FAILED");
    expect(result.trace.metricResult.outcome).toMatchObject({
      kind: "MISSING",
      reason: "EVALUATOR_FAILURE"
    });
    expect(result.trace.evidencePackage.executionManifest.observedOutputArtifactIds).toEqual([
      "artifact:adapter-output"
    ]);
  });

  it("maps a thrown evaluator failure to explicit S-03 missingness", async () => {
    const result = await execute(undefined, undefined, {
      evaluate: () => {
        throw new Error("Synthetic evaluator throw.");
      }
    });
    expect(result.observation.status).toBe("SUCCEEDED");
    expect(result.trace.evaluatorExecution).toMatchObject({
      status: "FAILED",
      failure: { code: "EVALUATOR_FAILURE", detail: "Synthetic evaluator throw." }
    });
    expect(result.trace.metricResult.outcome).toMatchObject({
      kind: "MISSING",
      reason: "EVALUATOR_FAILURE"
    });
  });

  it("retains failed retry attempts before a successful attempt", async () => {
    const result = await execute(undefined, (request) =>
      observation(request, {
        attempts: [
          {
            attemptNumber: 1,
            status: "FAILED",
            failure: {
              code: "EXECUTION_FAILURE",
              detail: "Synthetic transient failure.",
              retryable: true
            },
            evidenceReferences: ["synthetic:attempt:1"]
          },
          {
            attemptNumber: 2,
            status: "SUCCEEDED",
            evidenceReferences: ["synthetic:attempt:2"]
          }
        ]
      })
    );
    expect(result.observation.attempts).toHaveLength(2);
    expect(result.observation.attempts[0]?.failure?.code).toBe("EXECUTION_FAILURE");
  });

  it("rejects intended conditions reused as observed conditions", async () => {
    const request = coordinator.createRequest(requestInput());
    await expect(
      execute(request, (value) =>
        observation(value, { observedConditions: value.plan.intendedConditions })
      )
    ).rejects.toThrowError(/independently recorded/);
  });

  it("keeps execution evidence outside scientific and Core authority", async () => {
    const result = await execute();
    const handoff = integration.preparePromotionHandoff(result.trace, ["S09_EVIDENCE_PACKAGE"])[0]!;
    expect(handoff).toMatchObject({
      evidenceState: "PRESENT_NOT_ASSESSED",
      sufficiencyDetermination: "NOT_PERFORMED",
      promotionGateStatus: "NOT_SET",
      scientificAuthority: "NONE"
    });
    expect(benchmarkRegistry.get(benchmarkIdentity)?.corePromotion).toBe("NOT_PROMOTED");
    expect(S11_02_ANTI_OVERCLAIM_INVARIANTS).toHaveLength(8);
  });

  it("uses one bounded validation error type", () => {
    expect(
      new ControlledExecutionAdapterValidationError([
        { code: "REQUEST_INVALID", path: "request", message: "Synthetic invalid request." }
      ])
    ).toBeInstanceOf(Error);
  });
});

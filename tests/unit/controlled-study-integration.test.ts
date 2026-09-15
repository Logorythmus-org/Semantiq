import { describe, expect, it } from "vitest";
import { computeSha256 } from "../../packages/sandbox-contracts/src/index.js";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  CANONICAL_EVALUATOR_REGISTRY,
  CANONICAL_METRIC_REGISTRY,
  ControlledStudyIntegration,
  EvaluatorRegistry,
  MetricRegistry,
  ResearchPromotionSystem,
  S11_01_ANTI_OVERCLAIM_INVARIANTS,
  S11_01_EXECUTION_MANIFEST_RECONCILIATION,
  S11_01_GOVERNED_MUTATION_REQUIREMENT,
  StudyIntegrationValidationError,
  type ArtifactReference,
  type ConstructAssessment,
  type ControlledExecutionPlan,
  type ControlledStudyDefinition,
  type EnvironmentManifestInput,
  type EvidenceValue,
  type ExecutionConditionEvidence,
  type MetricAggregationContext,
  type Operationalization,
  type ResearchIntake,
  type SourceRevisionEvidence,
  type SyntheticExecutionIngestionInput
} from "../../packages/benchmark/src/index.js";

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
const promotion = new ResearchPromotionSystem();
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
  operationalizationId: "operationalization:provider-tck-synthetic",
  operationalizationVersion: version
} as const;

const known = <T>(value: T): EvidenceValue<T> => ({
  state: "KNOWN",
  value,
  evidenceReferences: ["synthetic:fixture"]
});
const na = <T>(): EvidenceValue<T> => ({
  state: "NOT_APPLICABLE",
  reason: "Synthetic non-human conformance fixture."
});
const sha = (value: string) => computeSha256(`s11:${value}`);

function sources(): {
  researchIntake: ResearchIntake;
  construct: ConstructAssessment;
  operationalization: Operationalization;
} {
  const researchIntake = promotion.createIntake({
    identity: { researchIntakeId: "intake:provider-tck-synthetic", researchIntakeVersion: version },
    schemaVersion: "1.0.0",
    researchQuestion: "Can the existing provider TCK contracts form a synthetic integration trace?",
    sources: [
      {
        sourceId: "source:first-party-synthetic",
        sourceType: "PROJECT_RECORD",
        citationOrReference: "tests/unit/controlled-study-integration.test.ts",
        provenanceClass: "PROJECT_EXISTING_SOURCE",
        rightsClass: "FIRST_PARTY_OR_PROJECT",
        limitations: ["Synthetic architecture fixture only."]
      }
    ],
    motivation: "Exercise exact Core identity binding without a scientific claim.",
    proposedConstruct: "provider contract conformance",
    claimedPhenomenon: "synthetic contract behavior",
    targetPopulationOrSystem: "deterministic synthetic provider fixture",
    proposedTaskFamilies: ["provider-tck-synthetic"],
    proposedObservableBehaviors: ["one declared conformance observation"],
    proposedOperationalizations: [operationalizationIdentity.operationalizationId],
    proposedMetricEvaluatorRelationships: [
      `${metricIdentity.metricId}@${metricIdentity.metricVersion} -> ${evaluatorIdentity.evaluatorId}@${evaluatorIdentity.evaluatorVersion}`
    ],
    assumptions: ["Synthetic behavior is not empirical evidence."],
    limitations: ["No provider, calibration, validity, or promotion claim."],
    competingExplanations: ["The trace only demonstrates software integration."],
    disconfirmingEvidenceReferences: [],
    rightsStatus: "FIRST_PARTY_OR_PROJECT",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    cyberSensitivity: "NONE",
    intendedDestination: "RESEARCH_ONLY",
    evidenceReferences: ["synthetic:fixture"],
    status: "RESEARCH_CANDIDATE",
    scientificAuthority: "NONE"
  });
  const construct = promotion.createConstruct({
    identity: constructIdentity,
    schemaVersion: "1.0.0",
    conceptualDefinition: "Observed conformance with the exact declared provider TCK contract.",
    inclusionBoundary: ["declared contract checks"],
    exclusionBoundary: ["scientific validity", "model intelligence"],
    observableImplications: ["a synthetic conformance observation can be recorded"],
    competingConstructs: ["general software quality"],
    confounds: ["fixture-only execution"],
    targetDomains: ["engineering conformance"],
    targetPopulationsOrSystems: ["synthetic provider fixture"],
    supportingEvidenceReferences: [],
    challengingEvidenceReferences: [],
    operationalizationReferences: [operationalizationIdentity.operationalizationId],
    maturity: "PROPOSED",
    limitations: ["No construct-validity evidence."],
    validityStatus: "NOT_ASSESSED",
    scientificAuthority: "NONE"
  });
  const transitions = [
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
    transitions: transitions.map(([from, to]) => ({
      from,
      to,
      bindingReference: `legacy-binding:${from}:${to}`,
      assumptions: ["The transition is an explicit, fallible modeling assumption."],
      failureModes: ["Exact identity or version mismatch."],
      evidenceReferences: ["synthetic:fixture"]
    })),
    interpretation: "One bounded engineering conformance observation.",
    alternativeOperationalizationReferences: [],
    limitations: ["No scientific interpretation."],
    status: "SPECIFIED",
    scientificAuthority: "NONE"
  });
  return { researchIntake, construct, operationalization };
}

function study(
  sourceRecords = sources(),
  overrides: Record<string, unknown> = {}
): ControlledStudyDefinition {
  return integration.createStudyDefinition(
    {
      identity: { studyId: "study:provider-tck-synthetic", studyVersion: version },
      schemaVersion: "1.0.0",
      studyMode: "SYNTHETIC_CONFORMANCE",
      researchIntakeIdentity: sourceRecords.researchIntake.identity,
      constructBridge: {
        researchConstructIdentity: constructIdentity,
        registryConstructId: "provider_contract_conformance",
        relationship: "EXPLICIT_VERSIONED_COMPATIBILITY",
        compatibilityEvidenceReferences: ["review:s11-construct-bridge"],
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
      evidenceReferences: ["synthetic:fixture"],
      limitations: ["Architecture conformance only."],
      authority: "ORCHESTRATION_AND_INTEGRATION_ONLY",
      scientificAuthority: "NONE",
      ...overrides
    } as never,
    sourceRecords
  );
}

const configuration = evaluatorRegistry.createConfiguration({
  evaluatorIdentity,
  parameters: {}
});

function conditions(): ExecutionConditionEvidence {
  return {
    configurationReference: known("configuration:provider-tck-synthetic"),
    configurationDigest: known(configuration.configurationDigest),
    language: known("en"),
    toolPolicy: known("NO_EXTERNAL_TOOLS"),
    model: na(),
    modelEvidenceStatuses: [],
    samplingConfigurationReference: na(),
    randomization: {
      policy: na(),
      algorithm: na(),
      seed: na(),
      scope: na(),
      implementationVersion: na()
    }
  };
}

function plan(definition = study()): ControlledExecutionPlan {
  return integration.createExecutionPlan({
    planId: "plan:provider-tck-synthetic",
    planVersion: version,
    studyIdentity: definition.identity,
    studyDigest: definition.studyDigest,
    benchmarkIdentity,
    metricIdentity,
    evaluatorIdentity,
    inputArtifactIds: ["artifact:synthetic-input"],
    expectedOutputArtifactIds: ["artifact:synthetic-output"],
    intendedConditions: conditions(),
    executionPolicy: "SYNTHETIC_INGESTION_ONLY",
    toolPolicy: "NO_EXTERNAL_TOOLS",
    modelProviderRequirement: "NONE",
    seedPolicy: "NOT_APPLICABLE",
    environmentRequirement: "environment:s11-local-synthetic@1.0.0",
    expectedEvidenceScopes: ["METRIC_S03", "EVALUATOR_S04", "EXECUTION_S09", "RESULT"],
    scientificAuthority: "NONE"
  });
}

const contentDigest = (value: string) => ({
  algorithm: "SHA_256" as const,
  value: sha(value),
  representation: "CANONICAL_JSON" as const
});
function artifact(artifactId: string, kind: "INPUT" | "OUTPUT"): ArtifactReference {
  return {
    artifactId,
    artifactVersion: version,
    kind,
    contentDigest: contentDigest(artifactId),
    observedContentDigest: contentDigest(artifactId),
    mediaType: "application/json",
    availability: "AVAILABLE",
    locationClass: "PORTABLE_RELATIVE",
    rightsStatus: "REDISTRIBUTION_ALLOWED",
    provenanceReferences: ["synthetic:first-party"],
    limitations: ["Synthetic architecture fixture."]
  };
}

const environment = (): EnvironmentManifestInput => ({
  environmentId: "environment:s11-local-synthetic",
  environmentVersion: version,
  schemaVersion: "1.0.0",
  platform: known("synthetic-platform"),
  architecture: known("synthetic-architecture"),
  runtime: known("node"),
  runtimeVersion: known("synthetic-runtime-version"),
  containerImageDigest: na(),
  hardwareClass: known("synthetic-hardware"),
  acceleratorClass: na(),
  locale: known("en"),
  timezonePolicy: known("UTC"),
  environmentVariables: { classification: "NOT_APPLICABLE", names: [] },
  dependencies: [
    {
      ecosystem: "NODE",
      lockOrGraphReference: "artifact:pnpm-lock",
      digest: {
        algorithm: "SHA_256",
        value: sha("dependency-lock"),
        representation: "ORIGINAL_BYTES"
      },
      completeness: "COMPLETE_FOR_DECLARED_SCOPE"
    }
  ],
  dependencyCompleteness: "COMPLETE_FOR_DECLARED_SCOPE",
  networkDependency: "NO_NETWORK",
  toolAvailability: ["node", "vitest"],
  completeness: "FULLY_CAPTURED",
  limitations: ["Synthetic architecture fixture."],
  scientificAuthority: "NONE"
});

const sourceRevision: SourceRevisionEvidence = {
  gitCommit: known(sha("source-commit")),
  gitTree: known(sha("source-tree")),
  packageVersion: known("0.1.0-alpha.2"),
  schemaVersions: [{ schemaId: "controlled-study", schemaVersion: version }]
};

function aggregation(): MetricAggregationContext {
  return {
    resultId: "result:provider-tck-synthetic",
    uncertainty: { method: "NONE" },
    computation: {
      computationId: "computation:provider-tck-synthetic",
      evaluatorId: "SandboxTCK.runSuite",
      evaluatorVersion: evaluatorIdentity.evaluatorVersion,
      inputReferences: ["artifact:synthetic-input"],
      parameters: { fixture: "SYNTHETIC_NON_EMPIRICAL" }
    },
    evidenceReferences: ["synthetic:fixture"],
    provenanceReference: "provenance:s11-synthetic"
  };
}

function ingestion(overrides: Partial<SyntheticExecutionIngestionInput> = {}) {
  const definition = overrides.definition ?? study();
  return {
    definition,
    plan: overrides.plan ?? plan(definition),
    configuration,
    observations: [
      {
        observationId: "observation:synthetic-one",
        metricIdentity,
        benchmarkBinding: {
          benchmark: benchmarkIdentity,
          constructId: "provider_contract_conformance"
        },
        outcome: { kind: "VALUE", value: 1 },
        provenanceReference: "provenance:s11-synthetic"
      }
    ],
    metricAggregation: aggregation(),
    execution: {
      executionId: "execution:provider-tck-synthetic",
      runId: "run:provider-tck-synthetic",
      subject: { subjectId: "provider:synthetic-fixture", subjectKind: "SANDBOX_PROVIDER" },
      evaluationTarget: "provider-contract-conformance",
      inputKind: "TCK_REPORT",
      inputReferences: ["artifact:synthetic-input"],
      status: "SUCCEEDED",
      evidenceReferences: ["synthetic:fixture"],
      provenanceReference: "provenance:s11-synthetic",
      executedAt: "2026-09-14T00:00:00Z"
    },
    environment: environment(),
    observedConditions: conditions(),
    artifacts: [
      artifact("artifact:synthetic-input", "INPUT"),
      artifact("artifact:synthetic-output", "OUTPUT")
    ],
    sourceRevision,
    evidencePackageIdentity: { packageId: "evidence:s11-synthetic", packageVersion: version },
    ...overrides
  } satisfies SyntheticExecutionIngestionInput;
}

describe("S-11/01 canonical controlled study spine", () => {
  it("uses one stable versioned study identity and a deterministic semantic digest", () => {
    const sourceRecords = sources();
    const first = study(sourceRecords);
    const second = study(sourceRecords, {
      evidenceReferences: ["synthetic:fixture", "synthetic:fixture"],
      limitations: ["Architecture conformance only."]
    });
    expect(first.identity).toEqual({
      studyId: "study:provider-tck-synthetic",
      studyVersion: version
    });
    expect(first.studyDigest).toEqual(second.studyDigest);
    expect(first.scientificAuthority).toBe("NONE");
  });

  it("rejects identity status fields and excludes audit-only metadata from the study digest", () => {
    const sourceRecords = sources();
    const canonical = study(sourceRecords);
    const withAuditMetadata = study(sourceRecords, {
      auditMetadata: { reviewedAt: "2026-09-15T00:00:00Z", approval: "NONE" }
    });
    expect(withAuditMetadata.studyDigest).toStrictEqual(canonical.studyDigest);
    expect(withAuditMetadata).not.toHaveProperty("auditMetadata");
    expect(() =>
      study(sourceRecords, {
        identity: {
          studyId: "study:provider-tck-synthetic",
          studyVersion: version,
          approval: "APPROVED"
        }
      })
    ).toThrowError(/INVALID_STUDY_IDENTITY/);
  });

  it("binds exact S-10 construct/operationalization and S-02/S-03/S-04 versions", () => {
    const value = study();
    expect(value.constructBridge.researchConstructIdentity).toEqual(constructIdentity);
    expect(value.operationalizationBinding).toMatchObject({
      operationalizationIdentity,
      benchmarkIdentity,
      metricIdentity,
      evaluatorIdentity,
      role: "NON_HUMAN"
    });
  });

  it("fails closed when the construct ID matches but its version differs", () => {
    const sourceRecords = sources();
    const mismatched = {
      ...sourceRecords,
      construct: {
        ...sourceRecords.construct,
        identity: { ...constructIdentity, constructVersion: "2.0.0" }
      }
    };
    expect(() => study(mismatched)).toThrowError(/CONSTRUCT_VERSION_MISMATCH/);
  });

  it("fails closed on stale metric and evaluator versions", () => {
    expect(() =>
      study(sources(), {
        operationalizationBinding: {
          role: "NON_HUMAN",
          operationalizationIdentity,
          constructIdentity,
          benchmarkIdentity,
          metricIdentity: { ...metricIdentity, metricVersion: "9.9.9" },
          evaluatorIdentity
        }
      })
    ).toThrowError(/UNKNOWN_METRIC_IDENTITY/);
    expect(() =>
      study(sources(), {
        operationalizationBinding: {
          role: "NON_HUMAN",
          operationalizationIdentity,
          constructIdentity,
          benchmarkIdentity,
          metricIdentity,
          evaluatorIdentity: { ...evaluatorIdentity, evaluatorVersion: "9.9.9" }
        }
      })
    ).toThrowError(/UNKNOWN_EVALUATOR_IDENTITY/);
  });

  it("ingests one synthetic non-human trace through S-03, S-04, and S-09", () => {
    const trace = integration.ingestSyntheticExecution(ingestion());
    expect(trace.metricResult.outcome).toEqual({ kind: "VALUE", value: 1 });
    expect(trace.evaluatorExecution.output).toEqual({
      kind: "METRIC_RESULT",
      metricResult: trace.metricResult
    });
    expect(trace.evidencePackage.executionManifest.benchmarkIdentity).toMatchObject({
      state: "KNOWN",
      value: benchmarkIdentity
    });
    expect(trace.verification.outcome).toBe("VERIFIED_INTERNAL_CONSISTENCY");
    expect(trace.verification.authority).toBe("INTERNAL_CONSISTENCY_ONLY");
    expect(trace.evidenceClass).toBe("SYNTHETIC_NON_EMPIRICAL");
    expect(trace.scientificAuthority).toBe("NONE");
  });

  it("rejects a missing planned evidence artifact", () => {
    expect(() =>
      integration.ingestSyntheticExecution(
        ingestion({ artifacts: [artifact("artifact:synthetic-input", "INPUT")] })
      )
    ).toThrowError(/MISSING_EVIDENCE_ARTIFACT/);
  });

  it("preserves failed execution as explicit S-03 missingness rather than zero", () => {
    const trace = integration.ingestSyntheticExecution(
      ingestion({
        observations: [],
        execution: {
          ...ingestion().execution,
          status: "FAILED",
          failure: { code: "SYNTHETIC_FAILURE", detail: "Deliberate conformance failure." }
        },
        artifacts: [artifact("artifact:synthetic-input", "INPUT")]
      })
    );
    expect(trace.evaluatorExecution.status).toBe("FAILED");
    expect(trace.evaluatorExecution.output).toBeUndefined();
    expect(trace.metricResult.outcome).toEqual({
      kind: "MISSING",
      reason: "EVALUATOR_FAILURE",
      detail: "Deliberate conformance failure."
    });
    expect(trace.metricResult.outcome).not.toEqual({ kind: "VALUE", value: 0 });
  });

  it("keeps abstention distinct from failure", () => {
    const trace = integration.ingestSyntheticExecution(
      ingestion({
        observations: [],
        execution: {
          ...ingestion().execution,
          status: "ABSTAINED",
          abstention: {
            reason: "INSUFFICIENT_EVIDENCE",
            detail: "The synthetic evaluator deliberately abstained.",
            evidenceReferences: ["synthetic:fixture"]
          }
        },
        artifacts: [artifact("artifact:synthetic-input", "INPUT")]
      })
    );
    expect(trace.evaluatorExecution.status).toBe("ABSTAINED");
    expect(trace.evaluatorExecution.failure).toBeUndefined();
    expect(trace.metricResult.outcome).toEqual({
      kind: "MISSING",
      reason: "INSUFFICIENT_EVIDENCE",
      detail: "The synthetic evaluator deliberately abstained."
    });
  });

  it("keeps not-applicable distinct from unknown", () => {
    const trace = integration.ingestSyntheticExecution(
      ingestion({
        observations: [],
        execution: { ...ingestion().execution, status: "NOT_APPLICABLE" },
        artifacts: [artifact("artifact:synthetic-input", "INPUT")]
      })
    );
    expect(trace.evaluatorExecution.status).toBe("NOT_APPLICABLE");
    expect(trace.metricResult.outcome).toEqual({ kind: "MISSING", reason: "NOT_APPLICABLE" });
    expect(trace.metricResult.outcome).not.toMatchObject({ reason: "NOT_OBSERVED" });
  });

  it("rejects partial execution instead of treating it as success", () => {
    expect(() =>
      integration.ingestSyntheticExecution(
        ingestion({
          observations: [],
          execution: { ...ingestion().execution, status: "PARTIAL" } as never,
          artifacts: [artifact("artifact:synthetic-input", "INPUT")]
        })
      )
    ).toThrowError(/UNSUPPORTED_EXECUTION_STATUS/);
  });

  it("prepares evidence presence without asserting S-10 gate sufficiency", () => {
    const trace = integration.ingestSyntheticExecution(ingestion());
    const [handoff] = integration.preparePromotionHandoff(trace, ["IMPLEMENTATION"]);
    expect(handoff).toMatchObject({
      gateId: "IMPLEMENTATION",
      evidenceState: "PRESENT_NOT_ASSESSED",
      sufficiencyDetermination: "NOT_PERFORMED",
      promotionGateStatus: "NOT_SET",
      authority: "ORCHESTRATION_AND_INTEGRATION_ONLY",
      scientificAuthority: "NONE"
    });
    expect(handoff).not.toHaveProperty("status", "SATISFIED");
  });

  it("keeps S-09 canonical and requires fail-closed legacy manifest adaptation", () => {
    expect(S11_01_EXECUTION_MANIFEST_RECONCILIATION).toContainEqual(
      expect.objectContaining({
        abstraction: "S-09 ExecutionManifest",
        classification: "CANONICAL_CURRENT"
      })
    );
    expect(S11_01_EXECUTION_MANIFEST_RECONCILIATION).toContainEqual(
      expect.objectContaining({
        abstraction: "packages/evidence StudyExecutionManifest",
        treatment: "FAIL_CLOSED_EXPLICIT_ADAPTATION_REQUIRED"
      })
    );
  });

  it("does not turn successful execution into scientific validity", () => {
    const trace = integration.ingestSyntheticExecution(ingestion());
    expect(trace.evaluatorExecution.status).toBe("SUCCEEDED");
    expect(trace.scientificAuthority).toBe("NONE");
    expect(trace).not.toHaveProperty("scientificValidity");
  });

  it("does not turn repeatable execution into construct validity", () => {
    const first = integration.ingestSyntheticExecution(ingestion());
    const second = integration.ingestSyntheticExecution(ingestion());
    expect(first.plan.planDigest).toStrictEqual(second.plan.planDigest);
    expect(sources().construct.validityStatus).toBe("NOT_ASSESSED");
  });

  it("does not turn S-09 package verification into scientific truth", () => {
    const trace = integration.ingestSyntheticExecution(ingestion());
    expect(trace.verification.outcome).toBe("VERIFIED_INTERNAL_CONSISTENCY");
    expect(trace.verification.authority).toBe("INTERNAL_CONSISTENCY_ONLY");
    expect(trace.scientificAuthority).toBe("NONE");
  });

  it("does not turn a synthetic trace into empirical evidence", () => {
    const trace = integration.ingestSyntheticExecution(ingestion());
    expect(trace.evidenceClass).toBe("SYNTHETIC_NON_EMPIRICAL");
    expect(trace).not.toHaveProperty("empiricalEvidence", true);
  });

  it("does not turn evidence presence into promotion-gate satisfaction", () => {
    const trace = integration.ingestSyntheticExecution(ingestion());
    const handoff = integration.preparePromotionHandoff(trace, ["IMPLEMENTATION"])[0]!;
    expect(handoff.evidenceState).toBe("PRESENT_NOT_ASSESSED");
    expect(handoff.sufficiencyDetermination).toBe("NOT_PERFORMED");
    expect(handoff.promotionGateStatus).toBe("NOT_SET");
  });

  it("does not turn study completion into Core eligibility or mutation", () => {
    const trace = integration.ingestSyntheticExecution(ingestion());
    expect(trace.evaluatorExecution.status).toBe("SUCCEEDED");
    expect(S11_01_GOVERNED_MUTATION_REQUIREMENT).toMatchObject({
      implementationStatus: "DEFERRED_TO_LATER_S11",
      registryMutationPerformed: false,
      coreAdmissionPerformed: false
    });
    expect(benchmarkRegistry.get(benchmarkIdentity)?.corePromotion).toBe("NOT_PROMOTED");
  });

  it("enumerates all seven anti-overclaim invariants", () => {
    expect(S11_01_ANTI_OVERCLAIM_INVARIANTS).toHaveLength(7);
  });

  it("rejects mutation of a plan after its canonical digest is issued", () => {
    const definition = study();
    const value = plan(definition);
    expect(() =>
      integration.ingestSyntheticExecution(
        ingestion({
          plan: { ...value, metricIdentity: { ...metricIdentity, metricVersion: "9.9.9" } }
        })
      )
    ).toThrow(StudyIntegrationValidationError);
  });
});

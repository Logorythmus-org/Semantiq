import { describe, expect, it } from "vitest";
import {
  PROMOTION_GATE_IDS,
  ResearchPromotionSystem,
  ResearchPromotionValidationError,
  S10_ANTI_OVERCLAIM_INVARIANTS,
  S10_DECISION_AUTHORITY,
  S10_DISCOVERED_MECHANISMS,
  S10_REPRESENTATIVE_CASES,
  S10_SCIENTIFIC_AUTHORITY,
  S10_STAGE_GATES,
  type ConstructAssessmentInput,
  type EvidencePackage,
  type OperationalizationInput,
  type PromotionAssessmentInput,
  type PromotionEvidenceRecord,
  type PromotionGateEvidence,
  type ResearchIntakeInput
} from "../../packages/benchmark/src/index.js";

const system = new ResearchPromotionSystem();
const researchIntakeSchemaVersion = "1.0.0" as const;
const researchIntakeRecordVersion = "1.0.0";
const evidencePackageFixture = {
  packageId: "evidence:s09",
  packageVersion: researchIntakeRecordVersion
} as EvidencePackage;

function intake(overrides: Partial<ResearchIntakeInput> = {}): ResearchIntakeInput {
  return {
    identity: {
      researchIntakeId: "intake:synthetic",
      researchIntakeVersion: researchIntakeRecordVersion
    },
    schemaVersion: researchIntakeSchemaVersion,
    researchQuestion: "Can a synthetic task operationalize a declared construct?",
    sources: [
      {
        sourceId: "source:project",
        sourceType: "PROJECT_RECORD",
        citationOrReference: "Docs/research/synthetic",
        provenanceClass: "PROJECT_EXISTING_SOURCE",
        rightsClass: "FIRST_PARTY_OR_PROJECT",
        limitations: []
      }
    ],
    motivation: "Exercise architecture without scientific claims.",
    proposedConstruct: "synthetic response consistency",
    claimedPhenomenon: "bounded response behavior",
    targetPopulationOrSystem: "synthetic system fixture",
    proposedTaskFamilies: ["synthetic-task"],
    proposedObservableBehaviors: ["declared response"],
    proposedOperationalizations: ["op:synthetic"],
    proposedMetricEvaluatorRelationships: ["metric:synthetic -> evaluator:synthetic"],
    assumptions: ["Fixture behavior is not empirical evidence."],
    limitations: ["Architecture fixture only."],
    competingExplanations: ["Implementation artifact."],
    disconfirmingEvidenceReferences: [],
    rightsStatus: "FIRST_PARTY_OR_PROJECT",
    provenanceClass: "PROJECT_EXISTING_SOURCE",
    cyberSensitivity: "NONE",
    intendedDestination: "BENCHMARK_CANDIDATE",
    evidenceReferences: ["evidence:s09"],
    status: "RESEARCH_CANDIDATE",
    scientificAuthority: "NONE",
    ...overrides
  };
}

function construct(overrides: Partial<ConstructAssessmentInput> = {}): ConstructAssessmentInput {
  return {
    identity: {
      constructId: "construct:synthetic-consistency",
      constructVersion: researchIntakeRecordVersion
    },
    schemaVersion: researchIntakeSchemaVersion,
    conceptualDefinition: "Consistency of a bounded synthetic response.",
    inclusionBoundary: ["declared response stability"],
    exclusionBoundary: ["intelligence", "human competence"],
    observableImplications: ["same fixture yields declared output"],
    competingConstructs: ["software determinism"],
    confounds: ["cached output"],
    targetDomains: ["synthetic"],
    targetPopulationsOrSystems: ["fixture runner"],
    supportingEvidenceReferences: [],
    challengingEvidenceReferences: [],
    operationalizationReferences: ["op:synthetic"],
    maturity: "PROPOSED",
    limitations: ["No validity evidence."],
    validityStatus: "NOT_ASSESSED",
    scientificAuthority: "NONE",
    ...overrides
  };
}

const links: [
  OperationalizationInput["transitions"][number]["from"],
  OperationalizationInput["transitions"][number]["to"]
][] = [
  ["CONSTRUCT", "TASK_OR_STIMULUS"],
  ["TASK_OR_STIMULUS", "RESPONSE"],
  ["RESPONSE", "OBSERVABLE_FEATURE"],
  ["OBSERVABLE_FEATURE", "METRIC"],
  ["METRIC", "EVALUATOR"],
  ["EVALUATOR", "INTERPRETATION"]
];
function operationalization(
  overrides: Partial<OperationalizationInput> = {}
): OperationalizationInput {
  return {
    identity: {
      operationalizationId: "op:synthetic",
      operationalizationVersion: researchIntakeRecordVersion
    },
    schemaVersion: researchIntakeSchemaVersion,
    constructIdentity: {
      constructId: "construct:synthetic-consistency",
      constructVersion: researchIntakeRecordVersion
    },
    transitions: links.map(([from, to]) => ({
      from,
      to,
      bindingReference: `${from}:${to}`,
      assumptions: ["This transition is a fallible modeling assumption."],
      failureModes: ["Construct mismatch."],
      evidenceReferences: []
    })),
    interpretation: "A bounded engineering observation only.",
    alternativeOperationalizationReferences: ["op:alternative"],
    limitations: ["No scientific validity."],
    status: "SPECIFIED",
    scientificAuthority: "NONE",
    ...overrides
  };
}

const gates = (
  stage: "VALIDATED" | "CORE_ELIGIBLE" | "CORE",
  status: "SATISFIED" | "UNKNOWN" = "SATISFIED"
): PromotionGateEvidence[] =>
  S10_STAGE_GATES[stage].map((gateId) => ({
    gateId,
    status,
    evidenceReferences: [`gate:${gateId}`],
    rationale: "Synthetic gate fixture.",
    ...(status === "UNKNOWN" ? {} : {})
  }));
function assessment(overrides: Partial<PromotionAssessmentInput> = {}): PromotionAssessmentInput {
  return {
    assessmentId: "assessment:synthetic",
    assessmentVersion: researchIntakeRecordVersion,
    schemaVersion: researchIntakeSchemaVersion,
    request: {
      requestId: "request:synthetic",
      requestVersion: researchIntakeRecordVersion,
      benchmarkIdentity: {
        state: "KNOWN",
        value: { benchmarkId: "synthetic_candidate", benchmarkVersion: "0.1.0" },
        evidenceReferences: ["registry:synthetic"]
      },
      intakeIdentity: {
        researchIntakeId: "intake:synthetic",
        researchIntakeVersion: researchIntakeRecordVersion
      },
      requestedStage: "VALIDATED",
      candidateKind: "GENERAL",
      requestedByGovernance: false,
      evidenceReferences: [],
      rationale: "Synthetic assessment."
    },
    gateEvidence: gates("VALIDATED"),
    evidenceRecords: [],
    evidencePackages: [evidencePackageFixture],
    knownConfounds: [],
    unresolvedMethodologicalCriticism: [],
    limitations: ["Synthetic only."],
    scientificAuthority: "NONE",
    ...overrides
  };
}

function evidence(overrides: Partial<PromotionEvidenceRecord> = {}): PromotionEvidenceRecord {
  return {
    evidenceId: "evidence:record",
    evidenceVersion: researchIntakeRecordVersion,
    category: "THEORETICAL",
    disposition: "SUPPORTING",
    targetReference: "candidate:synthetic",
    evidencePackageReferences: ["evidence:s09"],
    sourceReferences: ["source:synthetic"],
    finding: "Bounded synthetic finding.",
    materiality: "MATERIAL",
    resolution: "OPEN",
    rightsClass: "FIRST_PARTY_OR_PROJECT",
    limitations: [],
    scientificAuthority: "NONE",
    ...overrides
  };
}

describe("S-10 research intake and promotion governance", () => {
  it("declares zero scientific and autonomous decision authority", () => {
    expect(S10_SCIENTIFIC_AUTHORITY).toBe("NONE");
    expect(S10_DECISION_AUTHORITY).toBe("ASSESSMENT_RECOMMENDATION_ONLY");
  });
  it("classifies S-02 through S-09 and conflicting count-based promotion", () => {
    expect(
      S10_DISCOVERED_MECHANISMS.filter((x) => x.classification === "CANONICAL_CURRENT")
    ).toHaveLength(8);
    expect(S10_DISCOVERED_MECHANISMS.some((x) => x.classification === "CONFLICTING")).toBe(true);
  });
  it("records every anti-overclaim invariant explicitly", () => {
    expect(S10_ANTI_OVERCLAIM_INVARIANTS).toHaveLength(25);
  });
  it.each(S10_ANTI_OVERCLAIM_INVARIANTS)("preserves invariant %s", (invariant) =>
    expect(invariant).toMatch(/DOES_NOT|BLOCK/)
  );
  it("creates a versioned intake with stable semantic identity", () => {
    const one = system.createIntake(
      intake({ auditMetadata: { recordedAt: "2026-09-14T01:00:00Z" } })
    );
    const two = system.createIntake(
      intake({
        auditMetadata: { recordedAt: "2027-01-01T00:00:00Z" },
        assumptions: [...intake().assumptions].reverse()
      })
    );
    expect(one.semanticDigest).toEqual(two.semanticDigest);
  });
  it("keeps discovery from becoming evidence", () => {
    const value = system.createIntake(intake({ evidenceReferences: [], status: "WATCH" }));
    expect(value.status).toBe("WATCH");
    expect(value.evidenceReferences).toEqual([]);
  });
  it("blocks prohibited source routing", () => {
    expect(() =>
      system.createIntake(
        intake({
          sources: [{ ...intake().sources[0]!, rightsClass: "PROHIBITED" }],
          intendedDestination: "CORE_ADMISSION_REVIEW"
        })
      )
    ).toThrowError(ResearchPromotionValidationError);
  });
  it("blocks uncleared rights from formal assessment", () => {
    expect(() =>
      system.createIntake(
        intake({ rightsStatus: "UNKNOWN_RIGHTS", status: "READY_FOR_FORMAL_ASSESSMENT" })
      )
    ).toThrow(/RIGHTS_BLOCK_FORMAL_ASSESSMENT/);
  });
  it("keeps provenance separate from scientific quality", () => {
    const value = system.createIntake(intake({ provenanceClass: "AI_GENERATED" }));
    expect(value.scientificAuthority).toBe("NONE");
  });
  it("creates construct boundaries without claiming validity", () => {
    const value = system.createConstruct(construct());
    expect(value.validityStatus).toBe("NOT_ASSESSED");
    expect(value.semanticDigest.algorithm).toBe("SHA_256");
  });
  it("requires evidence for an explicitly validated construct", () => {
    expect(() =>
      system.createConstruct(construct({ validityStatus: "VALIDATED_BY_REFERENCED_EVIDENCE" }))
    ).toThrow(/VALIDITY_EVIDENCE_REQUIRED/);
  });
  it("requires the complete operationalization chain", () => {
    expect(() =>
      system.createOperationalization(
        operationalization({ transitions: operationalization().transitions.slice(1) })
      )
    ).toThrow(/OPERATIONALIZATION_LINK_MISSING/);
  });
  it("requires an explicit assumption at every transition", () => {
    const transitions = operationalization().transitions.map((x, i) =>
      i ? x : { ...x, assumptions: [] }
    );
    expect(() => system.createOperationalization(operationalization({ transitions }))).toThrow(
      /TRANSITION_ASSUMPTION_REQUIRED/
    );
  });
  it("supports alternative operationalizations", () => {
    expect(
      system.createOperationalization(operationalization()).alternativeOperationalizationReferences
    ).toEqual(["op:alternative"]);
  });
  it("fails closed when a critical gate is unknown", () => {
    const value = system.assessPromotion(
      assessment({
        gateEvidence: gates("VALIDATED").map((g, i) => (i ? g : { ...g, status: "UNKNOWN" }))
      })
    );
    expect(value.recommendation).toBe("INSUFFICIENT_EVIDENCE");
    expect(value.blockingGateIds.length).toBeGreaterThan(0);
  });
  it("does not infer validity from implementation, tests, reliability, or reproduction", () => {
    const supplied = gates("VALIDATED").map((g) =>
      g.gateId === "VALIDITY" ? { ...g, status: "UNKNOWN" as const } : g
    );
    const records = [
      evidence({ category: "IMPLEMENTATION" }),
      evidence({ evidenceId: "test", category: "UNIT_TEST" }),
      evidence({ evidenceId: "reliability", category: "RELIABILITY" }),
      evidence({ evidenceId: "reproduction", category: "REPRODUCTION" })
    ];
    expect(
      system.assessPromotion(assessment({ gateEvidence: supplied, evidenceRecords: records }))
        .recommendation
    ).toBe("INSUFFICIENT_EVIDENCE");
  });
  it("does not turn a large evidence count into promotion", () => {
    const records = Array.from({ length: 100 }, (_, i) =>
      evidence({ evidenceId: `test:${i}`, category: "UNIT_TEST" })
    );
    expect(
      system.assessPromotion(assessment({ gateEvidence: [], evidenceRecords: records }))
        .recommendation
    ).toBe("INSUFFICIENT_EVIDENCE");
  });
  it("preserves material contradiction without averaging", () => {
    const records = [
      evidence(),
      evidence({
        evidenceId: "contradiction",
        category: "CONTRADICTORY",
        disposition: "CONTRADICTORY"
      })
    ];
    const value = system.assessPromotion(assessment({ evidenceRecords: records }));
    expect(value.recommendation).toBe("BLOCKED_BY_CONTRADICTION");
    expect(value.contradictoryEvidenceIds).toEqual(["contradiction"]);
  });
  it("retains negative and failed replication evidence", () => {
    const records = [
      evidence({
        evidenceId: "negative",
        category: "NEGATIVE_RESULT",
        disposition: "NEGATIVE_RESULT"
      }),
      evidence({
        evidenceId: "replication",
        category: "REPLICATION",
        disposition: "FAILED_REPLICATION",
        materiality: "INFORMATIONAL"
      })
    ];
    expect(
      system.assessPromotion(assessment({ evidenceRecords: records })).negativeEvidenceIds
    ).toEqual(["negative", "replication"]);
  });
  it("does not let an internally consistent S-09 package satisfy validity", () => {
    const supplied = gates("VALIDATED").map((g) =>
      g.gateId === "VALIDITY" ? { ...g, status: "UNKNOWN" as const } : g
    );
    expect(
      system.assessPromotion(
        assessment({ gateEvidence: supplied, evidencePackages: [evidencePackageFixture] })
      ).recommendation
    ).toBe("INSUFFICIENT_EVIDENCE");
  });
  it("blocks unknown rights even when a rights gate claims satisfaction", () => {
    const value = system.assessPromotion(
      assessment({ evidenceRecords: [evidence({ rightsClass: "UNKNOWN_RIGHTS" })] })
    );
    expect(value.blockingGateIds).toContain("RIGHTS_CLEARANCE");
  });
  it("keeps Core eligible candidates at human review without governance", () => {
    const value = system.assessPromotion(
      assessment({
        request: { ...assessment().request, requestedStage: "CORE" },
        gateEvidence: gates("CORE")
      })
    );
    expect(value.recommendation).toBe("ELIGIBLE_FOR_REVIEW");
    expect(value.mutatesBenchmarkRegistry).toBe(false);
  });
  it("cannot grant Core with a pure evaluator", () => {
    const value = system.assessPromotion(
      assessment({
        request: { ...assessment().request, requestedStage: "CORE" },
        gateEvidence: gates("CORE")
      })
    );
    const decision = system.recordDecision(value, "decision:pending", researchIntakeRecordVersion);
    expect(decision.outcome).toBe("ELIGIBLE_FOR_REVIEW");
    expect(decision.benchmarkRegistryMutated).toBe(false);
  });
  it("records explicit human governance while leaving S-02 mutation separate", () => {
    const value = system.assessPromotion(
      assessment({
        request: { ...assessment().request, requestedStage: "CORE" },
        gateEvidence: gates("CORE")
      })
    );
    const decision = system.recordDecision(
      value,
      "decision:approved",
      researchIntakeRecordVersion,
      {
        governanceRecordId: "governance:1",
        governanceRecordVersion: researchIntakeRecordVersion,
        decision: "APPROVED",
        authority: "HUMAN_GOVERNANCE",
        evidenceReferences: ["review:1"],
        rationale: "Synthetic governance fixture."
      }
    );
    expect(decision.outcome).toBe("APPROVED_BY_GOVERNANCE");
    expect(decision.benchmarkRegistryMutationRequired).toBe(true);
    expect(decision.benchmarkRegistryMutated).toBe(false);
  });
  it("adds human-specific gates and blocks missing protocol evidence", () => {
    const value = system.assessPromotion(
      assessment({
        request: {
          ...assessment().request,
          requestedStage: "CORE_ELIGIBLE",
          candidateKind: "HUMAN_BENCHMARK"
        },
        gateEvidence: gates("CORE_ELIGIBLE")
      })
    );
    expect(value.blockingGateIds).toContain("HUMAN_PROTOCOL");
    expect(value.blockingGateIds).toContain("PRIVACY_ETHICS_LEGAL");
  });
  it("adds S-08 gates and blocks insufficient Human-AI comparability", () => {
    const value = system.assessPromotion(
      assessment({
        request: {
          ...assessment().request,
          requestedStage: "CORE_ELIGIBLE",
          candidateKind: "HUMAN_AI_COMPARATIVE"
        },
        gateEvidence: gates("CORE_ELIGIBLE")
      })
    );
    expect(value.blockingGateIds).toContain("S08_COMPARABILITY");
    expect(value.blockingGateIds).toContain("COMMON_SCALE");
  });
  it("requires justification for NOT_APPLICABLE", () => {
    expect(() =>
      system.assessPromotion(
        assessment({
          gateEvidence: [
            { gateId: "VALIDITY", status: "NOT_APPLICABLE", evidenceReferences: [], rationale: "" }
          ]
        })
      )
    ).toThrow(/NOT_APPLICABLE_JUSTIFICATION_REQUIRED/);
  });
  it("retains a justified NOT_APPLICABLE gate without treating it as unknown", () => {
    const gateEvidence = gates("VALIDATED").map((gate) =>
      gate.gateId === "ROBUSTNESS"
        ? {
            ...gate,
            status: "NOT_APPLICABLE" as const,
            notApplicableJustification: "The synthetic fixture has no perturbation domain."
          }
        : gate
    );
    const value = system.assessPromotion(assessment({ gateEvidence }));
    expect(value.recommendation).toBe("ELIGIBLE_FOR_REVIEW");
    expect(value.gateAssessments.find((gate) => gate.gateId === "ROBUSTNESS")?.status).toBe(
      "NOT_APPLICABLE"
    );
  });
  it("rejects private paths, credentials, PII fields, and forbidden claims", () => {
    const values = [
      intake({ motivation: ["C:", "Users", "person", "private"].join("\\") }),
      intake({ motivation: ["api", "key"].join("_") + "=synthetic-secret-value" }),
      { ...intake(), email: "synthetic@example.invalid" } as ResearchIntakeInput,
      intake({ claimedPhenomenon: "SUPERHUMAN" })
    ];
    values.forEach((value) =>
      expect(() => system.createIntake(value)).toThrowError(ResearchPromotionValidationError)
    );
  });
  it("creates auditable demotion/retraction records without deletion", () => {
    for (const action of [
      "DEPRECATION",
      "DEMOTION",
      "RETRACTION",
      "SUPERSESSION",
      "ARCHIVAL"
    ] as const) {
      const value = system.createLifecycleReassessment({
        reassessmentId: `reassessment:${action}`,
        benchmarkIdentity: { benchmarkId: "synthetic", benchmarkVersion: "0.1.0" },
        triggerEvidenceReferences: ["evidence:contradiction"],
        action,
        rationale: "Synthetic lifecycle review."
      });
      expect(value.preserveHistoricalEvidence).toBe(true);
      expect(value.registryMutated).toBe(false);
    }
  });
  it("preserves all A-L representative cases as synthetic architecture expectations", () => {
    expect(S10_REPRESENTATIVE_CASES.map((x) => x.caseId)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L"
    ]);
  });
  it("defines every canonical gate exactly once", () => {
    expect(new Set(PROMOTION_GATE_IDS).size).toBe(PROMOTION_GATE_IDS.length);
  });
});

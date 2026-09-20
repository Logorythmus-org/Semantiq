import { describe, expect, it } from "vitest";
import {
  BenchmarkRegistry,
  CANONICAL_BENCHMARK_REGISTRY,
  ResearchPromotionSystem,
  S10_STAGE_GATES,
  S11_04_ANTI_OVERCLAIM_INVARIANTS,
  applyGovernedCoreAdmission,
  continueWithGovernance,
  createGovernedCoreAdmissionAuthorization,
  promotionAssessmentDigest,
  promotionDecisionDigest,
  type BenchmarkIdentity,
  type CanonicalBenchmarkDefinition,
  type CanonicalBenchmarkRegistrySnapshot,
  type EvidencePackage,
  type PromotionAssessment,
  type PromotionAssessmentInput,
  type PromotionDecision
} from "../../packages/benchmark/src/index.js";

const targetIdentity: BenchmarkIdentity = {
  benchmarkId: "synthetic_governed_admission",
  benchmarkVersion: "1.0.0"
};
const unrelatedIdentity: BenchmarkIdentity = {
  benchmarkId: "synthetic_unrelated_benchmark",
  benchmarkVersion: "1.0.0"
};
const system = new ResearchPromotionSystem();

function validatedEntry(identity: BenchmarkIdentity): CanonicalBenchmarkDefinition {
  const template = structuredClone(CANONICAL_BENCHMARK_REGISTRY.benchmarks[0]!);
  return {
    ...template,
    identity,
    name: identity.benchmarkId,
    description: "Synthetic governed-admission fixture.",
    provenance: {
      ...template.provenance,
      origin: "tests/unit/governed-core-admission.test.ts",
      sourceReferences: ["synthetic:governed-admission"],
      introducedIn: "S-11/04"
    },
    implementationState: "REPRODUCIBLE",
    scientificMaturity: "VALIDATED",
    lifecycleState: "ACTIVE",
    evidence: {
      implementation: ["synthetic:implementation"],
      tests: ["synthetic:test"],
      reproducibility: ["synthetic:reproduction"],
      calibration: ["synthetic:calibration"],
      validation: ["synthetic:validation"],
      promotion: []
    },
    aliases: [],
    supersedes: [],
    corePromotion: "NOT_PROMOTED",
    limitations: ["Synthetic architecture fixture only."]
  };
}

function registry(
  target: CanonicalBenchmarkDefinition = validatedEntry(targetIdentity)
): BenchmarkRegistry {
  const snapshot: CanonicalBenchmarkRegistrySnapshot = {
    ...structuredClone(CANONICAL_BENCHMARK_REGISTRY),
    benchmarks: [
      ...structuredClone(CANONICAL_BENCHMARK_REGISTRY.benchmarks),
      target,
      validatedEntry(unrelatedIdentity)
    ]
  };
  return new BenchmarkRegistry(snapshot);
}

function assessmentInput(): PromotionAssessmentInput {
  return {
    assessmentId: "assessment:synthetic-governed-admission",
    assessmentVersion: "1.0.0",
    schemaVersion: "1.0.0",
    request: {
      requestId: "request:synthetic-governed-admission",
      requestVersion: "1.0.0",
      benchmarkIdentity: {
        state: "KNOWN",
        value: targetIdentity,
        evidenceReferences: ["synthetic:registry-binding"]
      },
      intakeIdentity: {
        researchIntakeId: "intake:synthetic-governed-admission",
        researchIntakeVersion: "1.0.0"
      },
      requestedStage: "CORE",
      candidateKind: "GENERAL",
      requestedByGovernance: true,
      evidenceReferences: ["synthetic:assessment-evidence"],
      rationale: "Exercise the governed mutation boundary without promoting a real benchmark."
    },
    evidenceRequirements: S10_STAGE_GATES.CORE.map((gateId) => ({
      requirementId: `requirement:${gateId}`,
      gateId,
      expectedPackage: {
        packageId: `synthetic-package:${gateId}`,
        packageVersion: "1.0.0",
        packageDigest: `synthetic-digest:${gateId}`
      },
      critical: true,
      notApplicableJustification:
        "Synthetic boundary fixture; scientific status is supplied only by the S-02 VALIDATED prerequisite."
    })),
    gateEvidence: [],
    evidenceRecords: [],
    evidencePackages: [
      {
        packageId: "synthetic-unused-package",
        packageVersion: "1.0.0"
      } as EvidencePackage
    ],
    knownConfounds: [],
    unresolvedMethodologicalCriticism: [],
    limitations: ["Synthetic architecture fixture only."],
    scientificAuthority: "NONE"
  };
}

function assessment(): PromotionAssessment {
  const value = system.assessPromotion(assessmentInput());
  expect(value.recommendation).toBe("ELIGIBLE_FOR_REVIEW");
  return value;
}

function approvedDecision(value: PromotionAssessment): PromotionDecision {
  return system.recordDecision(value, "decision:synthetic-governed-admission", "1.0.0", {
    governanceRecordId: "governance:synthetic-governed-admission",
    governanceRecordVersion: "1.0.0",
    decision: "APPROVED",
    authority: "HUMAN_GOVERNANCE",
    evidenceReferences: ["synthetic:human-governance-record"],
    rationale: "Synthetic human-governance fixture."
  });
}

function reboundDecision(
  value: PromotionAssessment,
  overrides: Partial<PromotionDecision> = {}
): PromotionDecision {
  return {
    ...approvedDecision(assessment()),
    assessmentReference: `${value.assessmentId}@${value.assessmentVersion}`,
    assessmentDigest: value.assessmentDigest,
    ...overrides
  };
}

function withAssessment(
  value: PromotionAssessment,
  overrides: Partial<PromotionAssessment>
): PromotionAssessment {
  const changed = { ...value, ...overrides };
  return { ...changed, assessmentDigest: promotionAssessmentDigest(changed) };
}

function expectCode(run: () => unknown, code: string): void {
  expect(run).toThrowError(new RegExp(`^${code}:`));
}

describe("S-11/04 governed Core admission boundary", () => {
  it("encodes the six anti-overclaim invariants", () => {
    expect(S11_04_ANTI_OVERCLAIM_INVARIANTS).toEqual([
      "GOVERNANCE_APPROVAL_DOES_NOT_IMPLY_SCIENTIFIC_VALIDATION",
      "GOVERNANCE_APPROVAL_DOES_NOT_IMPLY_AUTOMATIC_CORE_ADMISSION",
      "PROMOTION_DECISION_DOES_NOT_IMPLY_REGISTRY_MUTATION",
      "CORE_ADMISSION_AUTHORIZATION_DOES_NOT_IMPLY_SCIENTIFIC_EVIDENCE",
      "REGISTRY_MUTATION_RECEIPT_DOES_NOT_IMPLY_SCIENTIFIC_VALIDATION",
      "VALIDATED_IS_A_CORE_ADMISSION_PREREQUISITE"
    ]);
  });

  it("A applies an exactly bound human-governed decision to a VALIDATED synthetic benchmark", () => {
    const source = registry();
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const authorization = createGovernedCoreAdmissionAuthorization(
      source,
      targetIdentity,
      assessed,
      decision
    );
    const result = applyGovernedCoreAdmission(source, assessed, decision, authorization);

    expect(result.registry.get(targetIdentity)?.corePromotion).toBe("PROMOTED");
    expect(result.receipt).toMatchObject({
      mutation: "CORE_PROMOTION",
      result: "APPLIED",
      scientificMaturityChanged: false,
      lifecycleChanged: false,
      registryMutationPerformed: true,
      scientificAuthority: "NONE"
    });
  });

  it("S-11/05 continuation delegates an explicit synthetic authorization to S-11/04", () => {
    const source = registry();
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const authorization = createGovernedCoreAdmissionAuthorization(
      source,
      targetIdentity,
      assessed,
      decision
    );
    const result = continueWithGovernance(
      { benchmarkIdentity: targetIdentity, promotionAssessment: assessed },
      source,
      decision,
      authorization
    );

    expect(result.registry.get(targetIdentity)?.corePromotion).toBe("PROMOTED");
    expect(result.receipt).toMatchObject({
      registryMutationPerformed: true,
      scientificMaturityChanged: false,
      lifecycleChanged: false,
      scientificAuthority: "NONE"
    });
    expect(
      CANONICAL_BENCHMARK_REGISTRY.benchmarks.every(
        (entry) => entry.corePromotion === "NOT_PROMOTED"
      )
    ).toBe(true);
  });

  it.each([
    ["B decision not approved", { outcome: "ELIGIBLE_FOR_REVIEW" }, "DECISION_NOT_APPROVED"],
    ["C governance missing", { governanceEvidence: undefined }, "GOVERNANCE_EVIDENCE_REQUIRED"],
    [
      "D governance rejected",
      { governanceEvidence: { decision: "REJECTED" } },
      "GOVERNANCE_NOT_APPROVED"
    ],
    [
      "E governance deferred",
      { governanceEvidence: { decision: "DEFERRED" } },
      "GOVERNANCE_NOT_APPROVED"
    ]
  ])("%s fails closed", (_name, change, code) => {
    const assessed = assessment();
    const base = approvedDecision(assessed);
    const governanceChange = "governanceEvidence" in change ? change.governanceEvidence : undefined;
    const decision = {
      ...base,
      ...change,
      ...(governanceChange && base.governanceEvidence
        ? { governanceEvidence: { ...base.governanceEvidence, ...governanceChange } }
        : {})
    } as PromotionDecision;
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(registry(), targetIdentity, assessed, decision),
      code
    );
  });

  it("rejects non-human governance authority", () => {
    const assessed = assessment();
    const decision = approvedDecision(assessed) as any;
    decision.governanceEvidence = { ...decision.governanceEvidence, authority: "AUTOMATION" };
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(registry(), targetIdentity, assessed, decision),
      "HUMAN_GOVERNANCE_REQUIRED"
    );
  });

  it("F rejects an assessment digest mismatch", () => {
    const assessed = assessment();
    const decision = {
      ...approvedDecision(assessed),
      assessmentDigest: { ...assessed.assessmentDigest, value: "0".repeat(64) }
    };
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(registry(), targetIdentity, assessed, decision),
      "ASSESSMENT_DIGEST_MISMATCH"
    );
  });

  it("G rejects an assessment identity/version mismatch", () => {
    const assessed = assessment();
    const decision = {
      ...approvedDecision(assessed),
      assessmentReference: "assessment:other@1.0.0"
    };
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(registry(), targetIdentity, assessed, decision),
      "ASSESSMENT_REFERENCE_MISMATCH"
    );
  });

  it("H rejects a benchmark identity mismatch", () => {
    const assessed = assessment();
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          unrelatedIdentity,
          assessed,
          approvedDecision(assessed)
        ),
      "BENCHMARK_IDENTITY_MISMATCH"
    );
  });

  it("I rejects an unknown benchmark", () => {
    const base = assessment();
    const missing = { benchmarkId: "synthetic_missing", benchmarkVersion: "1.0.0" };
    const assessed = withAssessment(base, {
      request: {
        ...base.request,
        benchmarkIdentity: {
          state: "KNOWN",
          value: missing,
          evidenceReferences: ["synthetic:missing"]
        }
      }
    });
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          missing,
          assessed,
          reboundDecision(assessed)
        ),
      "UNKNOWN_BENCHMARK"
    );
  });

  it("rejects an unknown request benchmark identity", () => {
    const base = assessment();
    const assessed = withAssessment(base, {
      request: {
        ...base.request,
        benchmarkIdentity: { state: "UNKNOWN", reason: "Synthetic unknown identity." }
      }
    });
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          targetIdentity,
          assessed,
          reboundDecision(assessed)
        ),
      "UNKNOWN_BENCHMARK_IDENTITY"
    );
  });

  it("J rejects a request whose stage is not CORE", () => {
    const base = assessment();
    const assessed = withAssessment(base, {
      request: { ...base.request, requestedStage: "VALIDATED" }
    });
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          targetIdentity,
          assessed,
          reboundDecision(assessed)
        ),
      "REQUESTED_STAGE_NOT_CORE"
    );
  });

  it("rejects a recommendation other than ELIGIBLE_FOR_REVIEW", () => {
    const assessed = { ...assessment(), recommendation: "NOT_ELIGIBLE" } as PromotionAssessment;
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          targetIdentity,
          assessed,
          reboundDecision(assessed)
        ),
      "RECOMMENDATION_NOT_ELIGIBLE"
    );
  });

  it("K rejects an unresolved non-governance gate", () => {
    const base = assessment();
    const assessed = {
      ...base,
      gateAssessments: base.gateAssessments.map((gate) =>
        gate.gateId === "VALIDITY" ? { ...gate, status: "UNKNOWN" as const, blocking: true } : gate
      )
    };
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          targetIdentity,
          assessed,
          reboundDecision(assessed)
        ),
      "UNRESOLVED_NON_GOVERNANCE_GATE"
    );
  });

  it("L rejects an open material contradiction", () => {
    const assessed = { ...assessment(), contradictoryEvidenceIds: ["contradiction:open"] };
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          targetIdentity,
          assessed,
          reboundDecision(assessed)
        ),
      "UNRESOLVED_CONTRADICTION"
    );
  });

  it("rejects an inconsistent S-11/03 evidence-resolution digest", () => {
    const base = assessment();
    const assessed = {
      ...base,
      evidenceResolution: {
        ...base.evidenceResolution,
        resolutionDigest: { ...base.evidenceResolution.resolutionDigest, value: "f".repeat(64) }
      }
    };
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(),
          targetIdentity,
          assessed,
          reboundDecision(assessed)
        ),
      "EVIDENCE_RESOLUTION_INCONSISTENT"
    );
  });

  it("M rejects a registry digest mismatch", () => {
    const source = registry();
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const authorization = createGovernedCoreAdmissionAuthorization(
      source,
      targetIdentity,
      assessed,
      decision
    );
    const drifted = new BenchmarkRegistry({
      ...source.snapshot,
      benchmarks: source.snapshot.benchmarks.map((entry) =>
        entry.identity.benchmarkId === unrelatedIdentity.benchmarkId
          ? { ...entry, limitations: [...entry.limitations, "Synthetic unrelated drift."] }
          : entry
      )
    });
    expectCode(
      () => applyGovernedCoreAdmission(drifted, assessed, decision, authorization),
      "REGISTRY_DIGEST_MISMATCH"
    );
  });

  it("N rejects CALIBRATED maturity without upgrading it", () => {
    const calibrated = {
      ...validatedEntry(targetIdentity),
      scientificMaturity: "CALIBRATED" as const,
      evidence: { ...validatedEntry(targetIdentity).evidence, validation: [] }
    };
    const assessed = assessment();
    expectCode(
      () =>
        createGovernedCoreAdmissionAuthorization(
          registry(calibrated),
          targetIdentity,
          assessed,
          approvedDecision(assessed)
        ),
      "SCIENTIFIC_MATURITY_NOT_VALIDATED"
    );
    expect(calibrated.scientificMaturity).toBe("CALIBRATED");
  });

  it("O rejects replay and does not append duplicate promotion evidence", () => {
    const source = registry();
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const authorization = createGovernedCoreAdmissionAuthorization(
      source,
      targetIdentity,
      assessed,
      decision
    );
    const first = applyGovernedCoreAdmission(source, assessed, decision, authorization);
    const evidence = first.registry.get(targetIdentity)!.evidence.promotion;
    expectCode(
      () => applyGovernedCoreAdmission(first.registry, assessed, decision, authorization),
      "ALREADY_PROMOTED"
    );
    expect(first.registry.get(targetIdentity)!.evidence.promotion).toEqual(evidence);
  });

  it("P rejects a tampered authorization digest", () => {
    const source = registry();
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const authorization = createGovernedCoreAdmissionAuthorization(
      source,
      targetIdentity,
      assessed,
      decision
    );
    const tampered = {
      ...authorization,
      authorizationDigest: { ...authorization.authorizationDigest, value: "a".repeat(64) }
    };
    expectCode(
      () => applyGovernedCoreAdmission(source, assessed, decision, tampered),
      "AUTHORIZATION_DIGEST_MISMATCH"
    );
  });

  it("rejects a decision digest mismatch at mutation time", () => {
    const source = registry();
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const authorization = createGovernedCoreAdmissionAuthorization(
      source,
      targetIdentity,
      assessed,
      decision
    );
    const changed = { ...decision, rationale: "Changed after authorization." };
    expect(promotionDecisionDigest(changed)).not.toEqual(authorization.promotionDecisionDigest);
    expectCode(
      () => applyGovernedCoreAdmission(source, assessed, changed, authorization),
      "DECISION_DIGEST_MISMATCH"
    );
  });

  it("Q preserves implementation, scientific maturity, and lifecycle state", () => {
    const source = registry();
    const before = source.get(targetIdentity)!;
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const result = applyGovernedCoreAdmission(
      source,
      assessed,
      decision,
      createGovernedCoreAdmissionAuthorization(source, targetIdentity, assessed, decision)
    );
    const after = result.registry.get(targetIdentity)!;
    expect(after.implementationState).toBe(before.implementationState);
    expect(after.scientificMaturity).toBe(before.scientificMaturity);
    expect(after.lifecycleState).toBe(before.lifecycleState);
  });

  it("R changes only the exact synthetic target and promotes no real benchmark", () => {
    const source = registry();
    const assessed = assessment();
    const decision = approvedDecision(assessed);
    const result = applyGovernedCoreAdmission(
      source,
      assessed,
      decision,
      createGovernedCoreAdmissionAuthorization(source, targetIdentity, assessed, decision)
    );
    for (const before of source.list()) {
      const after = result.registry.get(before.identity)!;
      if (before.identity.benchmarkId === targetIdentity.benchmarkId) continue;
      expect(after).toEqual(before);
    }
    expect(
      result.registry
        .list()
        .filter((entry) => entry.identity.benchmarkId !== targetIdentity.benchmarkId)
        .map((entry) => entry.corePromotion)
    ).toEqual(
      source
        .list()
        .filter((entry) => entry.identity.benchmarkId !== targetIdentity.benchmarkId)
        .map((entry) => entry.corePromotion)
    );
  });

  it("S exposes no public unguarded promoteToCore bypass", () => {
    expect("promoteToCore" in registry()).toBe(false);
  });

  it("T produces deterministic authorization and receipt digests", () => {
    const firstRegistry = registry();
    const secondRegistry = registry();
    const firstAssessment = assessment();
    const secondAssessment = assessment();
    const firstDecision = approvedDecision(firstAssessment);
    const secondDecision = approvedDecision(secondAssessment);
    const firstAuthorization = createGovernedCoreAdmissionAuthorization(
      firstRegistry,
      targetIdentity,
      firstAssessment,
      firstDecision
    );
    const secondAuthorization = createGovernedCoreAdmissionAuthorization(
      secondRegistry,
      targetIdentity,
      secondAssessment,
      secondDecision
    );
    expect(firstAuthorization).toEqual(secondAuthorization);
    expect(
      applyGovernedCoreAdmission(firstRegistry, firstAssessment, firstDecision, firstAuthorization)
        .receipt
    ).toEqual(
      applyGovernedCoreAdmission(
        secondRegistry,
        secondAssessment,
        secondDecision,
        secondAuthorization
      ).receipt
    );
  });
});

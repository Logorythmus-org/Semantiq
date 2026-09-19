import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import type { SemanticDigest } from "./evidence-types.js";
import { BenchmarkRegistry, benchmarkIdentityKey } from "./registry.js";
import type {
  BenchmarkIdentity,
  CanonicalBenchmarkDefinition,
  CanonicalBenchmarkRegistrySnapshot
} from "./registry-types.js";
import { S10_STAGE_GATES } from "./research-intake-definitions.js";
import { promotionAssessmentDigest } from "./research-intake.js";
import type { PromotionAssessment, PromotionDecision } from "./research-intake-types.js";
import {
  PromotionEvidenceResolver,
  promotionEvidenceResolutionDigest
} from "./study-evidence-resolution.js";

export const S11_04_AUTHORITY = "HUMAN_GOVERNANCE_BOUND" as const;
export const S11_04_SCIENTIFIC_AUTHORITY = "NONE" as const;
export const S11_04_ANTI_OVERCLAIM_INVARIANTS = [
  "GOVERNANCE_APPROVAL_DOES_NOT_IMPLY_SCIENTIFIC_VALIDATION",
  "GOVERNANCE_APPROVAL_DOES_NOT_IMPLY_AUTOMATIC_CORE_ADMISSION",
  "PROMOTION_DECISION_DOES_NOT_IMPLY_REGISTRY_MUTATION",
  "CORE_ADMISSION_AUTHORIZATION_DOES_NOT_IMPLY_SCIENTIFIC_EVIDENCE",
  "REGISTRY_MUTATION_RECEIPT_DOES_NOT_IMPLY_SCIENTIFIC_VALIDATION",
  "VALIDATED_IS_A_CORE_ADMISSION_PREREQUISITE"
] as const;

export type GovernedCoreAdmissionErrorCode =
  | "DECISION_NOT_APPROVED"
  | "GOVERNANCE_EVIDENCE_REQUIRED"
  | "GOVERNANCE_NOT_APPROVED"
  | "HUMAN_GOVERNANCE_REQUIRED"
  | "ASSESSMENT_REFERENCE_MISMATCH"
  | "ASSESSMENT_DIGEST_MISMATCH"
  | "DECISION_INCONSISTENT"
  | "DECISION_DIGEST_MISMATCH"
  | "REQUESTED_STAGE_NOT_CORE"
  | "UNKNOWN_BENCHMARK_IDENTITY"
  | "BENCHMARK_IDENTITY_MISMATCH"
  | "UNKNOWN_BENCHMARK"
  | "RECOMMENDATION_NOT_ELIGIBLE"
  | "UNRESOLVED_NON_GOVERNANCE_GATE"
  | "UNRESOLVED_CONTRADICTION"
  | "EVIDENCE_RESOLUTION_INCONSISTENT"
  | "REGISTRY_DIGEST_MISMATCH"
  | "SCIENTIFIC_MATURITY_NOT_VALIDATED"
  | "ALREADY_PROMOTED"
  | "AUTHORIZATION_INCONSISTENT"
  | "AUTHORIZATION_DIGEST_MISMATCH";

export class GovernedCoreAdmissionError extends Error {
  constructor(
    readonly code: GovernedCoreAdmissionErrorCode,
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = "GovernedCoreAdmissionError";
  }
}

export interface GovernedCoreAdmissionAuthorization {
  readonly authorizationId: string;
  readonly authorizationVersion: "1.0.0";
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly promotionAssessmentReference: string;
  readonly promotionAssessmentDigest: SemanticDigest;
  readonly evidenceResolutionDigest: SemanticDigest;
  readonly promotionDecisionReference: string;
  readonly promotionDecisionDigest: SemanticDigest;
  readonly governanceRecordReference: string;
  readonly requestedStage: "CORE";
  readonly sourceRegistryDigest: string;
  readonly authority: typeof S11_04_AUTHORITY;
  readonly scientificAuthority: typeof S11_04_SCIENTIFIC_AUTHORITY;
  readonly authorizationDigest: SemanticDigest;
}

export interface CoreAdmissionMutationReceipt {
  readonly receiptId: string;
  readonly receiptVersion: "1.0.0";
  readonly benchmarkIdentity: BenchmarkIdentity;
  readonly authorizationDigest: SemanticDigest;
  readonly decisionReference: string;
  readonly decisionDigest: SemanticDigest;
  readonly registryDigestBefore: string;
  readonly registryDigestAfter: string;
  readonly mutation: "CORE_PROMOTION";
  readonly result: "APPLIED";
  readonly scientificMaturityChanged: false;
  readonly lifecycleChanged: false;
  readonly registryMutationPerformed: true;
  readonly scientificAuthority: typeof S11_04_SCIENTIFIC_AUTHORITY;
}

export interface GovernedCoreAdmissionResult {
  readonly registry: BenchmarkRegistry;
  readonly receipt: CoreAdmissionMutationReceipt;
}

const sorted = (values: readonly string[]): string[] => [...new Set(values)].sort();
const same = (left: unknown, right: unknown): boolean =>
  canonicalJson(left) === canonicalJson(right);
const digest = (value: unknown): SemanticDigest => ({
  algorithm: "SHA_256",
  value: computeSha256(canonicalJson(value)),
  canonicalizationProfile: "semantiq-canonical-json-v1"
});
const assessmentReference = (assessment: PromotionAssessment): string =>
  `${assessment.assessmentId}@${assessment.assessmentVersion}`;
const decisionReference = (decision: PromotionDecision): string =>
  `${decision.decisionId}@${decision.decisionVersion}`;
const governanceReference = (decision: PromotionDecision): string => {
  const governance = decision.governanceEvidence;
  return governance ? `${governance.governanceRecordId}@${governance.governanceRecordVersion}` : "";
};

function fail(code: GovernedCoreAdmissionErrorCode, message: string): never {
  throw new GovernedCoreAdmissionError(code, message);
}

export function promotionDecisionDigest(decision: PromotionDecision): SemanticDigest {
  return digest({
    decisionId: decision.decisionId,
    decisionVersion: decision.decisionVersion,
    assessmentReference: decision.assessmentReference,
    assessmentDigest: decision.assessmentDigest,
    outcome: decision.outcome,
    ...(decision.governanceEvidence
      ? {
          governanceEvidence: {
            ...decision.governanceEvidence,
            evidenceReferences: sorted(decision.governanceEvidence.evidenceReferences)
          }
        }
      : {}),
    benchmarkRegistryMutationRequired: decision.benchmarkRegistryMutationRequired,
    benchmarkRegistryMutated: decision.benchmarkRegistryMutated,
    rationale: decision.rationale,
    scientificAuthority: decision.scientificAuthority
  });
}

function authorizationMaterial(
  authorization: Omit<GovernedCoreAdmissionAuthorization, "authorizationDigest">
): object {
  return authorization;
}

function governedCoreAdmissionAuthorizationDigest(
  authorization:
    | GovernedCoreAdmissionAuthorization
    | Omit<GovernedCoreAdmissionAuthorization, "authorizationDigest">
): SemanticDigest {
  const material = { ...authorization } as Partial<GovernedCoreAdmissionAuthorization>;
  Reflect.deleteProperty(material, "authorizationDigest");
  return digest(
    authorizationMaterial(
      material as Omit<GovernedCoreAdmissionAuthorization, "authorizationDigest">
    )
  );
}

function expectedGateIds(assessment: PromotionAssessment): readonly string[] {
  const required = [...S10_STAGE_GATES.CORE];
  if (assessment.request.candidateKind !== "GENERAL")
    required.push(
      "HUMAN_PROTOCOL",
      "PRIVACY_ETHICS_LEGAL",
      "SAMPLING",
      "MISSINGNESS",
      "RATER_SUBJECT_SEPARATION",
      "POPULATION_LIMITATIONS"
    );
  if (assessment.request.candidateKind === "HUMAN_AI_COMPARATIVE")
    required.push(
      "S08_COMPARABILITY",
      "COMMON_SCALE",
      "POPULATION_DENOMINATOR",
      "PURPOSE_LIMITATION"
    );
  return sorted(required);
}

function validateEvidenceResolution(assessment: PromotionAssessment): void {
  const resolution = assessment.evidenceResolution;
  if (!resolution)
    fail("EVIDENCE_RESOLUTION_INCONSISTENT", "Typed evidence resolution is required.");
  if (!same(promotionEvidenceResolutionDigest(resolution), resolution.resolutionDigest))
    fail("EVIDENCE_RESOLUTION_INCONSISTENT", "The evidence-resolution digest is invalid.");
  if (!same(resolution.request, assessment.request))
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "Evidence resolution binds a different promotion request."
    );
  const recomputed = new PromotionEvidenceResolver().resolve({
    resolutionId: resolution.resolutionId,
    resolutionVersion: resolution.resolutionVersion,
    request: resolution.request,
    requiredGateIds: resolution.requiredGateIds,
    requirements: resolution.requirements,
    evidencePackages: resolution.evidencePackages,
    evidenceRecords: resolution.evidenceRecords,
    callerGateAssertions: resolution.callerGateAssertions,
    scientificAuthority: resolution.scientificAuthority,
    decisionAuthority: resolution.decisionAuthority
  });
  if (!same(recomputed, resolution))
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "The supplied S-11/03 result differs from deterministic evidence resolution."
    );
  const expected = expectedGateIds(assessment);
  if (!same(sorted(resolution.requiredGateIds), expected))
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "Evidence resolution does not cover every required Core gate."
    );
  if (!same(sorted(assessment.gateAssessments.map((gate) => gate.gateId)), expected))
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "The assessment does not cover every required Core gate."
    );
  if (
    new Set(resolution.gateInputs.map((gate) => gate.gateId)).size !== resolution.gateInputs.length
  )
    fail("EVIDENCE_RESOLUTION_INCONSISTENT", "Evidence-resolution gate inputs must be unique.");
  if (!same(sorted(resolution.gateInputs.map((gate) => gate.gateId)), expected))
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "Evidence-resolution gate inputs do not cover every required Core gate."
    );

  for (const gate of assessment.gateAssessments) {
    if (gate.gateId === "GOVERNANCE_APPROVAL") continue;
    const resolved = resolution.gateInputs.find((candidate) => candidate.gateId === gate.gateId);
    if (
      !resolved ||
      resolved.status !== gate.status ||
      !same(resolved.evidenceReferences, gate.evidenceReferences)
    )
      fail(
        "EVIDENCE_RESOLUTION_INCONSISTENT",
        `Gate '${gate.gateId}' is not exactly bound to typed resolution.`
      );
    if (gate.status !== "SATISFIED" && gate.status !== "NOT_APPLICABLE")
      fail("UNRESOLVED_NON_GOVERNANCE_GATE", `Gate '${gate.gateId}' remains unresolved.`);
  }
  if (
    !same(sorted(resolution.contradictoryEvidenceIds), sorted(assessment.contradictoryEvidenceIds))
  )
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "Contradictory evidence lineage differs from the assessment."
    );
}

function validateAssessmentAndDecision(
  registry: BenchmarkRegistry,
  benchmarkIdentity: BenchmarkIdentity,
  assessment: PromotionAssessment,
  decision: PromotionDecision
): CanonicalBenchmarkDefinition {
  if (decision.outcome !== "APPROVED_BY_GOVERNANCE")
    fail("DECISION_NOT_APPROVED", "The S-10 decision is not approved by governance.");
  if (!decision.governanceEvidence)
    fail("GOVERNANCE_EVIDENCE_REQUIRED", "Approved decisions require governance evidence.");
  if (decision.governanceEvidence.authority !== "HUMAN_GOVERNANCE")
    fail("HUMAN_GOVERNANCE_REQUIRED", "Only HUMAN_GOVERNANCE may authorize Core admission.");
  if (decision.governanceEvidence.decision !== "APPROVED")
    fail("GOVERNANCE_NOT_APPROVED", "Governance evidence must record APPROVED.");
  if (
    decision.benchmarkRegistryMutationRequired !== true ||
    decision.benchmarkRegistryMutated !== false ||
    decision.scientificAuthority !== "NONE"
  )
    fail(
      "DECISION_INCONSISTENT",
      "The decision must require a pending registry mutation and carry no scientific authority."
    );
  if (decision.assessmentReference !== assessmentReference(assessment))
    fail("ASSESSMENT_REFERENCE_MISMATCH", "The decision references a different assessment.");
  if (!same(decision.assessmentDigest, assessment.assessmentDigest))
    fail("ASSESSMENT_DIGEST_MISMATCH", "The decision binds a different assessment digest.");
  if (!same(promotionAssessmentDigest(assessment), assessment.assessmentDigest))
    fail("ASSESSMENT_DIGEST_MISMATCH", "The supplied assessment digest is invalid.");
  if (assessment.request.requestedStage !== "CORE")
    fail("REQUESTED_STAGE_NOT_CORE", "Governed Core admission requires requestedStage CORE.");
  if (assessment.request.benchmarkIdentity.state !== "KNOWN")
    fail("UNKNOWN_BENCHMARK_IDENTITY", "The promotion request benchmark identity must be KNOWN.");
  if (!same(assessment.request.benchmarkIdentity.value, benchmarkIdentity))
    fail("BENCHMARK_IDENTITY_MISMATCH", "The request and mutation target identities differ.");
  const target = registry.get(benchmarkIdentity);
  if (!target)
    fail("UNKNOWN_BENCHMARK", `Unknown benchmark '${benchmarkIdentityKey(benchmarkIdentity)}'.`);
  if (assessment.recommendation !== "ELIGIBLE_FOR_REVIEW")
    fail("RECOMMENDATION_NOT_ELIGIBLE", "The assessment is not eligible for governance review.");
  if (assessment.mutatesBenchmarkRegistry !== false || assessment.scientificAuthority !== "NONE")
    fail(
      "DECISION_INCONSISTENT",
      "The S-10 assessment cannot mutate S-02 or carry scientific authority."
    );
  if (
    assessment.gateAssessments.some(
      (gate) => gate.gateId !== "GOVERNANCE_APPROVAL" && gate.blocking
    )
  )
    fail("UNRESOLVED_NON_GOVERNANCE_GATE", "A non-governance promotion gate remains blocking.");
  const assessedBlocking = sorted(
    assessment.gateAssessments.filter((gate) => gate.blocking).map((gate) => gate.gateId)
  );
  if (!same(assessedBlocking, sorted(assessment.blockingGateIds)))
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "Blocking gate identifiers differ from the gate assessments."
    );
  const openContradiction = assessment.evidenceRecords.some(
    (record) =>
      ["CONTRADICTORY", "FAILED_REPLICATION", "METHODOLOGICAL_CRITICISM"].includes(
        record.disposition
      ) &&
      record.resolution === "OPEN" &&
      record.materiality !== "INFORMATIONAL"
  );
  if (assessment.contradictoryEvidenceIds.length || openContradiction)
    fail("UNRESOLVED_CONTRADICTION", "Material contradictory evidence remains unresolved.");
  validateEvidenceResolution(assessment);
  if (target.scientificMaturity !== "VALIDATED")
    fail(
      "SCIENTIFIC_MATURITY_NOT_VALIDATED",
      "Core admission requires pre-existing VALIDATED maturity."
    );
  if (target.corePromotion === "PROMOTED")
    fail("ALREADY_PROMOTED", "The benchmark is already Core-promoted.");
  return target;
}

export function createGovernedCoreAdmissionAuthorization(
  registry: BenchmarkRegistry,
  benchmarkIdentity: BenchmarkIdentity,
  assessment: PromotionAssessment,
  decision: PromotionDecision
): GovernedCoreAdmissionAuthorization {
  validateAssessmentAndDecision(registry, benchmarkIdentity, assessment, decision);
  const decisionDigest = promotionDecisionDigest(decision);
  const base: Omit<GovernedCoreAdmissionAuthorization, "authorizationDigest"> = {
    authorizationId: `core-admission:${benchmarkIdentityKey(benchmarkIdentity)}:${decisionReference(decision)}`,
    authorizationVersion: "1.0.0",
    benchmarkIdentity,
    promotionAssessmentReference: assessmentReference(assessment),
    promotionAssessmentDigest: assessment.assessmentDigest,
    evidenceResolutionDigest: assessment.evidenceResolution.resolutionDigest,
    promotionDecisionReference: decisionReference(decision),
    promotionDecisionDigest: decisionDigest,
    governanceRecordReference: governanceReference(decision),
    requestedStage: "CORE",
    sourceRegistryDigest: registry.digest(),
    authority: S11_04_AUTHORITY,
    scientificAuthority: S11_04_SCIENTIFIC_AUTHORITY
  };
  return Object.freeze({
    ...base,
    authorizationDigest: governedCoreAdmissionAuthorizationDigest(base)
  });
}

function registryWithPromotion(
  registry: BenchmarkRegistry,
  target: CanonicalBenchmarkDefinition,
  authorization: GovernedCoreAdmissionAuthorization
): BenchmarkRegistry {
  const evidence = [
    `governed-core-admission:${authorization.authorizationId}#${authorization.authorizationDigest.value}`,
    `promotion-decision:${authorization.promotionDecisionReference}#${authorization.promotionDecisionDigest.value}`
  ];
  const updated: CanonicalBenchmarkDefinition = {
    ...target,
    corePromotion: "PROMOTED",
    evidence: { ...target.evidence, promotion: [...target.evidence.promotion, ...evidence] }
  };
  const snapshot: CanonicalBenchmarkRegistrySnapshot = {
    ...registry.snapshot,
    benchmarks: registry.snapshot.benchmarks.map((benchmark) =>
      benchmarkIdentityKey(benchmark.identity) === benchmarkIdentityKey(target.identity)
        ? updated
        : benchmark
    )
  };
  return new BenchmarkRegistry(snapshot);
}

export function applyGovernedCoreAdmission(
  registry: BenchmarkRegistry,
  assessment: PromotionAssessment,
  decision: PromotionDecision,
  authorization: GovernedCoreAdmissionAuthorization
): GovernedCoreAdmissionResult {
  if (
    !same(
      governedCoreAdmissionAuthorizationDigest(authorization),
      authorization.authorizationDigest
    )
  )
    fail("AUTHORIZATION_DIGEST_MISMATCH", "The authorization digest is invalid.");
  if (
    authorization.authorizationVersion !== "1.0.0" ||
    authorization.requestedStage !== "CORE" ||
    authorization.authority !== S11_04_AUTHORITY ||
    authorization.scientificAuthority !== S11_04_SCIENTIFIC_AUTHORITY
  )
    fail(
      "AUTHORIZATION_INCONSISTENT",
      "The authorization version, stage, or authority is invalid."
    );
  const target = validateAssessmentAndDecision(
    registry,
    authorization.benchmarkIdentity,
    assessment,
    decision
  );
  if (!same(authorization.promotionAssessmentDigest, assessment.assessmentDigest))
    fail("ASSESSMENT_DIGEST_MISMATCH", "The authorization binds a different assessment digest.");
  if (!same(authorization.evidenceResolutionDigest, assessment.evidenceResolution.resolutionDigest))
    fail(
      "EVIDENCE_RESOLUTION_INCONSISTENT",
      "The authorization binds a different evidence resolution."
    );
  if (!same(authorization.promotionDecisionDigest, promotionDecisionDigest(decision)))
    fail("DECISION_DIGEST_MISMATCH", "The authorization binds a different decision digest.");
  if (
    authorization.promotionAssessmentReference !== assessmentReference(assessment) ||
    authorization.promotionDecisionReference !== decisionReference(decision) ||
    authorization.governanceRecordReference !== governanceReference(decision)
  )
    fail(
      "ASSESSMENT_REFERENCE_MISMATCH",
      "Authorization lineage does not match the supplied records."
    );
  const before = registry.digest();
  if (authorization.sourceRegistryDigest !== before)
    fail(
      "REGISTRY_DIGEST_MISMATCH",
      "The authorization was issued for a different registry instance."
    );
  const next = registryWithPromotion(registry, target, authorization);
  const receiptBase = {
    receiptVersion: "1.0.0" as const,
    benchmarkIdentity: authorization.benchmarkIdentity,
    authorizationDigest: authorization.authorizationDigest,
    decisionReference: authorization.promotionDecisionReference,
    decisionDigest: authorization.promotionDecisionDigest,
    registryDigestBefore: before,
    registryDigestAfter: next.digest(),
    mutation: "CORE_PROMOTION" as const,
    result: "APPLIED" as const,
    scientificMaturityChanged: false as const,
    lifecycleChanged: false as const,
    registryMutationPerformed: true as const,
    scientificAuthority: S11_04_SCIENTIFIC_AUTHORITY
  };
  const receipt: CoreAdmissionMutationReceipt = Object.freeze({
    receiptId: `core-admission-receipt:${digest(receiptBase).value}`,
    ...receiptBase
  });
  return Object.freeze({ registry: next, receipt });
}

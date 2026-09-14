import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import { S10_STAGE_GATES } from "./research-intake-definitions.js";
import {
  PROMOTION_EVIDENCE_CATEGORIES,
  PROMOTION_GATE_IDS,
  PROMOTION_STAGES,
  RESEARCH_INTAKE_STATUSES,
  type ConstructAssessment,
  type ConstructAssessmentInput,
  type GovernanceApprovalEvidence,
  type LifecycleReassessment,
  type Operationalization,
  type OperationalizationInput,
  type PromotionAssessment,
  type PromotionAssessmentInput,
  type PromotionDecision,
  type PromotionGateAssessment,
  type PromotionGateId,
  type PromotionGateStatus,
  type PromotionStage,
  type ResearchIntake,
  type ResearchIntakeInput,
  type ResearchPromotionViolation
} from "./research-intake-types.js";

const SEMVER = /^\d+\.\d+\.\d+$/;
const PRIVATE_PATH = /(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/)[^\s]+/;
const SECRET =
  /(?:BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|\bgh[pousr]_[A-Za-z0-9_]{20,}\b|\bAKIA[0-9A-Z]{16}\b|\b(?:api[_-]?key|access[_-]?token|password|credential)\s*[:=]\s*[^\s,}]+)/i;
const FORBIDDEN_KEY =
  /^(?:realName|fullName|email|phone|address|deviceId|ipAddress|governmentId|medicalData|diagnosis|password|secret|token|credential|apiKey|privateKey)$/i;
const FORBIDDEN_CLAIM =
  /^(?:SCIENTIFICALLY_VALIDATED|PROOF|HUMAN_LEVEL|SUPERHUMAN|AI_SUPERIORITY|HUMAN_SUPERIORITY|INTELLIGENCE_GAP|SEMANTIC_MATURITY_GAP|UNIVERSAL_HUMAN_BASELINE)$/;

function add(
  items: ResearchPromotionViolation[],
  code: string,
  path: string,
  message: string
): void {
  items.push({ code, path, message });
}

function scan(value: unknown, path: string, items: ResearchPromotionViolation[]): void {
  if (typeof value === "string") {
    if (PRIVATE_PATH.test(value))
      add(
        items,
        "PRIVATE_PATH_FORBIDDEN",
        path,
        "Portable S-10 records cannot contain private absolute paths."
      );
    if (SECRET.test(value))
      add(
        items,
        "CREDENTIAL_FORBIDDEN",
        path,
        "S-10 records cannot contain credentials, tokens, or private keys."
      );
    if (FORBIDDEN_CLAIM.test(value))
      add(
        items,
        "OVERCLAIM_FORBIDDEN",
        path,
        "S-10 cannot encode scientific proof or Human-AI superiority claims."
      );
    return;
  }
  if (Array.isArray(value))
    return value.forEach((entry, index) => scan(entry, `${path}[${index}]`, items));
  if (value && typeof value === "object")
    Object.entries(value).forEach(([key, entry]) => {
      if (FORBIDDEN_KEY.test(key))
        add(
          items,
          "PII_OR_SECRET_FIELD_FORBIDDEN",
          `${path}.${key}`,
          "Direct identity and secret fields are outside S-10."
        );
      scan(entry, `${path}.${key}`, items);
    });
}

function sorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function withoutAudit<T extends { readonly auditMetadata?: unknown }>(
  input: T
): Omit<T, "auditMetadata"> {
  const value = { ...input } as T & { auditMetadata?: unknown };
  Reflect.deleteProperty(value, "auditMetadata");
  return value;
}

function digest(material: unknown) {
  return {
    algorithm: "SHA_256" as const,
    value: computeSha256(canonicalJson(material)),
    canonicalizationProfile: "semantiq-canonical-json-v1" as const
  };
}

function intakeMaterial(input: ResearchIntakeInput | ResearchIntake): object {
  const value = withoutAudit(input);
  Reflect.deleteProperty(value as { semanticDigest?: unknown }, "semanticDigest");
  return {
    ...value,
    sources: [...value.sources]
      .map((s) => ({ ...s, limitations: sorted(s.limitations) }))
      .sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    proposedTaskFamilies: sorted(value.proposedTaskFamilies),
    proposedObservableBehaviors: sorted(value.proposedObservableBehaviors),
    proposedOperationalizations: sorted(value.proposedOperationalizations),
    proposedMetricEvaluatorRelationships: sorted(value.proposedMetricEvaluatorRelationships),
    assumptions: sorted(value.assumptions),
    limitations: sorted(value.limitations),
    competingExplanations: sorted(value.competingExplanations),
    disconfirmingEvidenceReferences: sorted(value.disconfirmingEvidenceReferences),
    evidenceReferences: sorted(value.evidenceReferences)
  };
}

function constructMaterial(input: ConstructAssessmentInput | ConstructAssessment): object {
  const value = withoutAudit(input);
  Reflect.deleteProperty(value as { semanticDigest?: unknown }, "semanticDigest");
  return {
    ...value,
    inclusionBoundary: sorted(value.inclusionBoundary),
    exclusionBoundary: sorted(value.exclusionBoundary),
    observableImplications: sorted(value.observableImplications),
    competingConstructs: sorted(value.competingConstructs),
    confounds: sorted(value.confounds),
    targetDomains: sorted(value.targetDomains),
    targetPopulationsOrSystems: sorted(value.targetPopulationsOrSystems),
    supportingEvidenceReferences: sorted(value.supportingEvidenceReferences),
    challengingEvidenceReferences: sorted(value.challengingEvidenceReferences),
    operationalizationReferences: sorted(value.operationalizationReferences),
    limitations: sorted(value.limitations)
  };
}

function operationalizationMaterial(input: OperationalizationInput | Operationalization): object {
  const value = withoutAudit(input);
  Reflect.deleteProperty(value as { semanticDigest?: unknown }, "semanticDigest");
  return {
    ...value,
    transitions: [...value.transitions].map((t) => ({
      ...t,
      assumptions: sorted(t.assumptions),
      failureModes: sorted(t.failureModes),
      evidenceReferences: sorted(t.evidenceReferences)
    })),
    alternativeOperationalizationReferences: sorted(value.alternativeOperationalizationReferences),
    limitations: sorted(value.limitations)
  };
}

function assessmentMaterial(input: PromotionAssessmentInput | PromotionAssessment): object {
  const value = withoutAudit(input);
  Reflect.deleteProperty(value as { assessmentDigest?: unknown }, "assessmentDigest");
  Reflect.deleteProperty(value as { gateAssessments?: unknown }, "gateAssessments");
  Reflect.deleteProperty(value as { recommendation?: unknown }, "recommendation");
  Reflect.deleteProperty(value as { blockingGateIds?: unknown }, "blockingGateIds");
  Reflect.deleteProperty(
    value as { contradictoryEvidenceIds?: unknown },
    "contradictoryEvidenceIds"
  );
  Reflect.deleteProperty(value as { negativeEvidenceIds?: unknown }, "negativeEvidenceIds");
  Reflect.deleteProperty(
    value as { mutatesBenchmarkRegistry?: unknown },
    "mutatesBenchmarkRegistry"
  );
  return {
    ...value,
    gateEvidence: [...value.gateEvidence]
      .map((g) => ({ ...g, evidenceReferences: sorted(g.evidenceReferences) }))
      .sort((a, b) => a.gateId.localeCompare(b.gateId)),
    evidenceRecords: [...value.evidenceRecords]
      .map((e) => ({
        ...e,
        evidencePackageReferences: sorted(e.evidencePackageReferences),
        sourceReferences: sorted(e.sourceReferences),
        limitations: sorted(e.limitations)
      }))
      .sort((a, b) => a.evidenceId.localeCompare(b.evidenceId)),
    evidencePackages: [...value.evidencePackages].sort((a, b) =>
      a.packageId.localeCompare(b.packageId)
    ),
    knownConfounds: sorted(value.knownConfounds),
    unresolvedMethodologicalCriticism: sorted(value.unresolvedMethodologicalCriticism),
    limitations: sorted(value.limitations)
  };
}

function validateIdentity(
  id: string,
  version: string,
  path: string,
  items: ResearchPromotionViolation[]
): void {
  if (!id.trim()) add(items, "IDENTITY_REQUIRED", path, "A stable identity is required.");
  if (!SEMVER.test(version))
    add(items, "SEMVER_REQUIRED", `${path}.version`, "A semantic version is required.");
}

function throwIf(items: ResearchPromotionViolation[]): void {
  if (items.length) throw new ResearchPromotionValidationError(items);
}

export class ResearchPromotionValidationError extends Error {
  constructor(readonly violations: readonly ResearchPromotionViolation[]) {
    super(violations.map((v) => `${v.code}: ${v.message}`).join("\n"));
    this.name = "ResearchPromotionValidationError";
  }
}

function requiredGates(
  stage: PromotionStage,
  kind: PromotionAssessmentInput["request"]["candidateKind"]
): PromotionGateId[] {
  const base = [...S10_STAGE_GATES[stage]];
  if ((stage === "CORE_ELIGIBLE" || stage === "CORE") && kind !== "GENERAL")
    base.push(
      "HUMAN_PROTOCOL",
      "PRIVACY_ETHICS_LEGAL",
      "SAMPLING",
      "MISSINGNESS",
      "RATER_SUBJECT_SEPARATION",
      "POPULATION_LIMITATIONS"
    );
  if ((stage === "CORE_ELIGIBLE" || stage === "CORE") && kind === "HUMAN_AI_COMPARATIVE")
    base.push("S08_COMPARABILITY", "COMMON_SCALE", "POPULATION_DENOMINATOR", "PURPOSE_LIMITATION");
  return [...new Set(base)];
}

const criticalGate = (gate: PromotionGateId): boolean =>
  !(["DOCUMENTATION", "ROBUSTNESS", "ANTI_GAMING"] as PromotionGateId[]).includes(gate);
const blocks = (status: PromotionGateStatus, critical: boolean): boolean =>
  status === "UNSATISFIED" ||
  status === "UNKNOWN" ||
  (critical && status === "PARTIALLY_SATISFIED");

export class ResearchPromotionSystem {
  createIntake(input: ResearchIntakeInput): ResearchIntake {
    const v: ResearchPromotionViolation[] = [];
    validateIdentity(
      input.identity.researchIntakeId,
      input.identity.researchIntakeVersion,
      "identity",
      v
    );
    if (input.schemaVersion !== "1.0.0")
      add(v, "UNSUPPORTED_SCHEMA", "schemaVersion", "Unknown intake schemas fail closed.");
    if (!input.researchQuestion.trim() || !input.motivation.trim())
      add(v, "INTAKE_CONTENT_REQUIRED", "intake", "Research question and motivation are required.");
    if (!RESEARCH_INTAKE_STATUSES.includes(input.status))
      add(v, "INVALID_INTAKE_STATUS", "status", "Unknown intake status.");
    if (input.scientificAuthority !== "NONE")
      add(
        v,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        "scientificAuthority",
        "Intake has no scientific authority."
      );
    if (
      input.sources.some((s) => s.rightsClass === "PROHIBITED") &&
      input.intendedDestination !== "RESEARCH_ONLY"
    )
      add(
        v,
        "PROHIBITED_SOURCE_ROUTING",
        "sources",
        "Prohibited material cannot enter an executable or Core path."
      );
    if (
      ["UNKNOWN_RIGHTS", "RESTRICTED_REVIEW_REQUIRED", "PUBLIC_REFERENCE_ONLY"].includes(
        input.rightsStatus
      ) &&
      input.status === "READY_FOR_FORMAL_ASSESSMENT"
    )
      add(
        v,
        "RIGHTS_BLOCK_FORMAL_ASSESSMENT",
        "rightsStatus",
        "Uncleared rights must remain explicit and block formal promotion assessment."
      );
    scan(input, "intake", v);
    throwIf(v);
    return { ...input, semanticDigest: digest(intakeMaterial(input)) };
  }

  createConstruct(input: ConstructAssessmentInput): ConstructAssessment {
    const v: ResearchPromotionViolation[] = [];
    validateIdentity(input.identity.constructId, input.identity.constructVersion, "identity", v);
    if (
      !input.conceptualDefinition.trim() ||
      !input.inclusionBoundary.length ||
      !input.exclusionBoundary.length
    )
      add(
        v,
        "CONSTRUCT_BOUNDARY_REQUIRED",
        "construct",
        "Definition, inclusion, and exclusion boundaries are required."
      );
    if (input.scientificAuthority !== "NONE")
      add(
        v,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        "scientificAuthority",
        "A construct record cannot validate itself."
      );
    if (
      input.validityStatus === "VALIDATED_BY_REFERENCED_EVIDENCE" &&
      !input.supportingEvidenceReferences.length
    )
      add(
        v,
        "VALIDITY_EVIDENCE_REQUIRED",
        "validityStatus",
        "Validity requires explicit referenced evidence."
      );
    scan(input, "construct", v);
    throwIf(v);
    return { ...input, semanticDigest: digest(constructMaterial(input)) };
  }

  createOperationalization(input: OperationalizationInput): Operationalization {
    const v: ResearchPromotionViolation[] = [];
    validateIdentity(
      input.identity.operationalizationId,
      input.identity.operationalizationVersion,
      "identity",
      v
    );
    const expected = [
      "CONSTRUCT>TASK_OR_STIMULUS",
      "TASK_OR_STIMULUS>RESPONSE",
      "RESPONSE>OBSERVABLE_FEATURE",
      "OBSERVABLE_FEATURE>METRIC",
      "METRIC>EVALUATOR",
      "EVALUATOR>INTERPRETATION"
    ];
    const actual = input.transitions.map((t) => `${t.from}>${t.to}`);
    expected.forEach((link) => {
      if (!actual.includes(link))
        add(
          v,
          "OPERATIONALIZATION_LINK_MISSING",
          "transitions",
          `Required transition ${link} is missing.`
        );
    });
    input.transitions.forEach((t, i) => {
      if (!t.assumptions.length)
        add(
          v,
          "TRANSITION_ASSUMPTION_REQUIRED",
          `transitions[${i}]`,
          "Every transition must expose at least one assumption."
        );
    });
    if (input.scientificAuthority !== "NONE")
      add(
        v,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        "scientificAuthority",
        "Operationalization structure does not establish validity."
      );
    scan(input, "operationalization", v);
    throwIf(v);
    return { ...input, semanticDigest: digest(operationalizationMaterial(input)) };
  }

  assessPromotion(input: PromotionAssessmentInput): PromotionAssessment {
    const v: ResearchPromotionViolation[] = [];
    validateIdentity(input.assessmentId, input.assessmentVersion, "assessment", v);
    validateIdentity(input.request.requestId, input.request.requestVersion, "request", v);
    if (!PROMOTION_STAGES.includes(input.request.requestedStage))
      add(v, "INVALID_PROMOTION_STAGE", "request.requestedStage", "Unknown stage.");
    if (input.scientificAuthority !== "NONE")
      add(
        v,
        "SCIENTIFIC_AUTHORITY_FORBIDDEN",
        "scientificAuthority",
        "The assessment engine has no scientific authority."
      );
    if (new Set(input.gateEvidence.map((g) => g.gateId)).size !== input.gateEvidence.length)
      add(v, "DUPLICATE_GATE", "gateEvidence", "Gate evidence must be unique.");
    input.gateEvidence.forEach((g, i) => {
      if (!PROMOTION_GATE_IDS.includes(g.gateId))
        add(v, "UNKNOWN_GATE", `gateEvidence[${i}]`, "Unknown promotion gate.");
      if (g.status === "NOT_APPLICABLE" && !g.notApplicableJustification?.trim())
        add(
          v,
          "NOT_APPLICABLE_JUSTIFICATION_REQUIRED",
          `gateEvidence[${i}]`,
          "NOT_APPLICABLE requires justification."
        );
    });
    input.evidenceRecords.forEach((e, i) => {
      if (!PROMOTION_EVIDENCE_CATEGORIES.includes(e.category))
        add(v, "UNKNOWN_EVIDENCE_CATEGORY", `evidenceRecords[${i}]`, "Unknown evidence category.");
    });
    scan(input, "assessment", v);
    throwIf(v);
    const byGate = new Map(input.gateEvidence.map((g) => [g.gateId, g]));
    const gateAssessments: PromotionGateAssessment[] = requiredGates(
      input.request.requestedStage,
      input.request.candidateKind
    ).map((gateId) => {
      const supplied = byGate.get(gateId) ?? {
        gateId,
        status: "UNKNOWN" as const,
        evidenceReferences: [],
        rationale: "No gate evidence supplied."
      };
      let status = supplied.status;
      if (gateId === "GOVERNANCE_APPROVAL") status = "UNSATISFIED";
      if (gateId === "S09_EVIDENCE_PACKAGE" && !input.evidencePackages.length) status = "UNKNOWN";
      if (
        gateId === "RIGHTS_CLEARANCE" &&
        input.evidenceRecords.some((e) =>
          ["UNKNOWN_RIGHTS", "PROHIBITED", "RESTRICTED_REVIEW_REQUIRED"].includes(e.rightsClass)
        )
      )
        status = "UNSATISFIED";
      const critical = criticalGate(gateId);
      return { ...supplied, status, critical, blocking: blocks(status, critical) };
    });
    const contradictions = input.evidenceRecords.filter(
      (e) =>
        ["CONTRADICTORY", "FAILED_REPLICATION", "METHODOLOGICAL_CRITICISM"].includes(
          e.disposition
        ) &&
        e.resolution === "OPEN" &&
        e.materiality !== "INFORMATIONAL"
    );
    const negative = input.evidenceRecords.filter((e) =>
      ["NEGATIVE_RESULT", "FAILED_REPRODUCTION", "FAILED_REPLICATION"].includes(e.disposition)
    );
    const blockingGateIds = gateAssessments.filter((g) => g.blocking).map((g) => g.gateId);
    let recommendation: PromotionAssessment["recommendation"] = "ELIGIBLE_FOR_REVIEW";
    if (contradictions.length) recommendation = "BLOCKED_BY_CONTRADICTION";
    else if (blockingGateIds.includes("GOVERNANCE_APPROVAL") && blockingGateIds.length === 1)
      recommendation = "ELIGIBLE_FOR_REVIEW";
    else if (blockingGateIds.some((g) => g === "GOVERNANCE_APPROVAL"))
      recommendation = "BLOCKED_BY_GOVERNANCE";
    else if (blockingGateIds.length)
      recommendation = gateAssessments.some((g) => g.blocking && g.status === "UNKNOWN")
        ? "INSUFFICIENT_EVIDENCE"
        : "NOT_ELIGIBLE";
    return {
      ...input,
      assessmentDigest: digest(assessmentMaterial(input)),
      gateAssessments,
      recommendation,
      blockingGateIds,
      contradictoryEvidenceIds: contradictions.map((e) => e.evidenceId),
      negativeEvidenceIds: negative.map((e) => e.evidenceId),
      mutatesBenchmarkRegistry: false
    };
  }

  recordDecision(
    assessment: PromotionAssessment,
    decisionId: string,
    decisionVersion: string,
    governance?: GovernanceApprovalEvidence
  ): PromotionDecision {
    const v: ResearchPromotionViolation[] = [];
    validateIdentity(decisionId, decisionVersion, "decision", v);
    if (governance && governance.authority !== "HUMAN_GOVERNANCE")
      add(
        v,
        "HUMAN_GOVERNANCE_REQUIRED",
        "governance",
        "Only explicit human governance evidence may approve admission."
      );
    throwIf(v);
    const approved =
      governance?.decision === "APPROVED" && assessment.recommendation === "ELIGIBLE_FOR_REVIEW";
    return {
      decisionId,
      decisionVersion,
      assessmentReference: `${assessment.assessmentId}@${assessment.assessmentVersion}`,
      assessmentDigest: assessment.assessmentDigest,
      outcome: approved ? "APPROVED_BY_GOVERNANCE" : assessment.recommendation,
      ...(governance ? { governanceEvidence: governance } : {}),
      benchmarkRegistryMutationRequired: true,
      benchmarkRegistryMutated: false,
      rationale: approved
        ? "Human governance approved a separate registry decision; S-10 did not mutate S-02."
        : "No autonomous Core admission occurred.",
      scientificAuthority: "NONE"
    };
  }

  createLifecycleReassessment(
    input: Omit<
      LifecycleReassessment,
      | "preserveHistoricalEvidence"
      | "preserveAuditHistory"
      | "registryMutationRequired"
      | "registryMutated"
    >
  ): LifecycleReassessment {
    if (!input.triggerEvidenceReferences.length)
      throw new ResearchPromotionValidationError([
        {
          code: "TRIGGER_EVIDENCE_REQUIRED",
          path: "triggerEvidenceReferences",
          message: "Lifecycle reassessment requires evidence."
        }
      ]);
    return {
      ...input,
      preserveHistoricalEvidence: true,
      preserveAuditHistory: true,
      registryMutationRequired: true,
      registryMutated: false
    };
  }
}

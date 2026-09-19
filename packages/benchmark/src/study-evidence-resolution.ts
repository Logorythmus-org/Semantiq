import { canonicalJson, computeSha256 } from "../../sandbox-contracts/src/index.js";
import { EvidenceVerifier } from "./evidence.js";
import type { EvidencePackage, EvidenceRecordReference, SemanticDigest } from "./evidence-types.js";
import type { EvaluatorIdentity } from "./evaluator-types.js";
import type { MetricIdentity } from "./metric-types.js";
import type { BenchmarkIdentity } from "./registry-types.js";
import type {
  PromotionEvidenceRecord,
  PromotionGateEvidence,
  PromotionGateId,
  PromotionGateStatus,
  PromotionRequest
} from "./research-intake-types.js";

export const S11_03_AUTHORITY = "TYPED_EVIDENCE_RESOLUTION_ONLY" as const;
export const S11_03_SCIENTIFIC_AUTHORITY = "NONE" as const;
export const S11_03_DECISION_AUTHORITY = "NONE" as const;

export const EVIDENCE_RESOLUTION_STATES = [
  "PRESENT",
  "ABSENT",
  "UNKNOWN",
  "INCOMPLETE",
  "CONFLICTING",
  "INVALID",
  "NOT_APPLICABLE"
] as const;
export type EvidenceResolutionState = (typeof EVIDENCE_RESOLUTION_STATES)[number];

export interface EvidenceResolutionRequirement {
  readonly requirementId: string;
  readonly gateId: PromotionGateId;
  readonly expectedPackage: {
    readonly packageId: string;
    readonly packageVersion: string;
    readonly packageDigest: string;
  };
  readonly expectedBindings?:
    | {
        readonly benchmarkIdentity?: BenchmarkIdentity | undefined;
        readonly metricIdentity?: MetricIdentity | undefined;
        readonly evaluatorIdentity?: EvaluatorIdentity | undefined;
        readonly executionId?: string | undefined;
      }
    | undefined;
  readonly expectedRecord?: EvidenceRecordReference | undefined;
  readonly critical: boolean;
  readonly notApplicableJustification?: string | undefined;
}

export interface EvidenceResolutionFinding {
  readonly requirementId: string;
  readonly gateId: PromotionGateId;
  readonly state: EvidenceResolutionState;
  readonly packageReference: string;
  readonly recordReference?: string | undefined;
  readonly verificationOutcome:
    | "VERIFIED_INTERNAL_CONSISTENCY"
    | "PARTIALLY_VERIFIED"
    | "VERIFICATION_FAILED"
    | "INSUFFICIENT_EVIDENCE"
    | "NOT_ASSESSED";
  readonly limitations: readonly string[];
}

export interface GateInputResolution {
  readonly gateId: PromotionGateId;
  readonly status: PromotionGateStatus;
  readonly evidenceState: EvidenceResolutionState;
  readonly evidenceReferences: readonly string[];
  readonly rationale: string;
  readonly notApplicableJustification?: string | undefined;
}

export interface PromotionEvidenceResolutionInput {
  readonly resolutionId: string;
  readonly resolutionVersion: string;
  readonly request: PromotionRequest;
  readonly requiredGateIds: readonly PromotionGateId[];
  readonly requirements: readonly EvidenceResolutionRequirement[];
  readonly evidencePackages: readonly EvidencePackage[];
  readonly evidenceRecords: readonly PromotionEvidenceRecord[];
  readonly callerGateAssertions: readonly PromotionGateEvidence[];
  readonly scientificAuthority: typeof S11_03_SCIENTIFIC_AUTHORITY;
  readonly decisionAuthority: typeof S11_03_DECISION_AUTHORITY;
}

export interface PromotionEvidenceResolution extends PromotionEvidenceResolutionInput {
  readonly findings: readonly EvidenceResolutionFinding[];
  readonly gateInputs: readonly GateInputResolution[];
  readonly contradictoryEvidenceIds: readonly string[];
  readonly negativeEvidenceIds: readonly string[];
  readonly ignoredCallerGateAssertionIds: readonly PromotionGateId[];
  readonly resolutionDigest: SemanticDigest;
}

export class EvidenceResolutionValidationError extends Error {
  constructor(readonly violations: readonly string[]) {
    super(violations.join("\n"));
    this.name = "EvidenceResolutionValidationError";
  }
}

const sorted = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort();
const same = (left: unknown, right: unknown): boolean =>
  canonicalJson(left) === canonicalJson(right);
const digest = (value: unknown): SemanticDigest => ({
  algorithm: "SHA_256",
  value: computeSha256(canonicalJson(value)),
  canonicalizationProfile: "semantiq-canonical-json-v1"
});

const packageReference = (value: EvidenceResolutionRequirement["expectedPackage"]): string =>
  `${value.packageId}@${value.packageVersion}`;

const material = (value: PromotionEvidenceResolutionInput | PromotionEvidenceResolution) => ({
  resolutionId: value.resolutionId,
  resolutionVersion: value.resolutionVersion,
  request: value.request,
  requiredGateIds: sorted(value.requiredGateIds),
  requirements: [...value.requirements]
    .map((requirement) => ({ ...requirement }))
    .sort((left, right) => left.requirementId.localeCompare(right.requirementId)),
  evidencePackages: [...value.evidencePackages]
    .map((pkg) => ({
      packageId: pkg.packageId,
      packageVersion: pkg.packageVersion,
      packageDigest: pkg.packageDigest
    }))
    .sort((left, right) => left.packageId.localeCompare(right.packageId)),
  evidenceRecords: [...value.evidenceRecords]
    .map((record) => ({
      evidenceId: record.evidenceId,
      evidenceVersion: record.evidenceVersion,
      disposition: record.disposition,
      materiality: record.materiality,
      resolution: record.resolution,
      evidencePackageReferences: sorted(record.evidencePackageReferences)
    }))
    .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId)),
  callerGateAssertions: [...value.callerGateAssertions]
    .map((assertion) => ({
      gateId: assertion.gateId,
      status: assertion.status,
      evidenceReferences: sorted(assertion.evidenceReferences)
    }))
    .sort((left, right) => left.gateId.localeCompare(right.gateId)),
  scientificAuthority: value.scientificAuthority,
  decisionAuthority: value.decisionAuthority
});

const evidenceRecordMaterial = (record: PromotionEvidenceRecord) => ({
  evidenceId: record.evidenceId,
  evidenceVersion: record.evidenceVersion,
  category: record.category,
  disposition: record.disposition,
  targetReference: record.targetReference,
  evidencePackageReferences: sorted(record.evidencePackageReferences),
  sourceReferences: sorted(record.sourceReferences),
  finding: record.finding,
  materiality: record.materiality,
  resolution: record.resolution,
  rightsClass: record.rightsClass,
  limitations: sorted(record.limitations),
  scientificAuthority: record.scientificAuthority
});

export const promotionEvidenceRecordDigest = (record: PromotionEvidenceRecord): SemanticDigest =>
  digest(evidenceRecordMaterial(record));

const packageRequestState = (
  pkg: EvidencePackage,
  request: PromotionRequest
): EvidenceResolutionState | undefined => {
  if (request.benchmarkIdentity.state !== "KNOWN") return "UNKNOWN";
  const expected = request.benchmarkIdentity.value;
  const observed = pkg.executionManifest.benchmarkIdentity;
  return observed.state === "KNOWN" &&
    observed.value.benchmarkId === expected.benchmarkId &&
    observed.value.benchmarkVersion === expected.benchmarkVersion
    ? undefined
    : "INVALID";
};

const bindingState = (
  pkg: EvidencePackage,
  requirement: EvidenceResolutionRequirement
): EvidenceResolutionState | undefined => {
  const expected = requirement.expectedBindings;
  if (!expected) return undefined;
  const manifest = pkg.executionManifest;
  if (expected.benchmarkIdentity) {
    if (manifest.benchmarkIdentity.state !== "KNOWN") return "UNKNOWN";
    if (!same(manifest.benchmarkIdentity.value, expected.benchmarkIdentity)) return "INVALID";
  }
  if (expected.metricIdentity) {
    if (manifest.metricIdentity.state !== "KNOWN") return "UNKNOWN";
    if (!same(manifest.metricIdentity.value, expected.metricIdentity)) return "INVALID";
  }
  if (expected.evaluatorIdentity) {
    if (manifest.evaluatorIdentity.state !== "KNOWN") return "UNKNOWN";
    if (!same(manifest.evaluatorIdentity.value, expected.evaluatorIdentity)) return "INVALID";
  }
  if (expected.executionId && manifest.executionId !== expected.executionId) return "INVALID";
  return undefined;
};

const recordMatches = (
  actual: EvidenceRecordReference,
  expected: EvidenceRecordReference
): boolean =>
  actual.referenceId === expected.referenceId &&
  actual.scope === expected.scope &&
  actual.recordId === expected.recordId &&
  actual.recordVersion === expected.recordVersion &&
  same(actual.semanticDigest, expected.semanticDigest);

export class PromotionEvidenceResolver {
  private readonly verifier = new EvidenceVerifier();

  resolve(input: PromotionEvidenceResolutionInput): PromotionEvidenceResolution {
    const violations: string[] = [];
    if (!input.resolutionId.trim() || !/^\d+\.\d+\.\d+$/.test(input.resolutionVersion))
      violations.push("A stable resolution identity and semantic version are required.");
    if (
      input.scientificAuthority !== S11_03_SCIENTIFIC_AUTHORITY ||
      input.decisionAuthority !== S11_03_DECISION_AUTHORITY
    )
      violations.push("Evidence resolution has no scientific or decision authority.");
    if (
      new Set(input.requirements.map((requirement) => requirement.requirementId)).size !==
      input.requirements.length
    )
      violations.push("Evidence requirement identities must be unique.");
    if (violations.length) throw new EvidenceResolutionValidationError(violations);

    const findings = input.requirements.map((requirement): EvidenceResolutionFinding => {
      const reference = packageReference(requirement.expectedPackage);
      if (requirement.notApplicableJustification?.trim())
        return {
          requirementId: requirement.requirementId,
          gateId: requirement.gateId,
          state: "NOT_APPLICABLE",
          packageReference: reference,
          verificationOutcome: "NOT_ASSESSED",
          limitations: [requirement.notApplicableJustification]
        };
      const sameId = input.evidencePackages.filter(
        (pkg) => pkg.packageId === requirement.expectedPackage.packageId
      );
      const pkg = sameId.find(
        (candidate) =>
          candidate.packageVersion === requirement.expectedPackage.packageVersion &&
          candidate.packageDigest === requirement.expectedPackage.packageDigest
      );
      if (!pkg)
        return {
          requirementId: requirement.requirementId,
          gateId: requirement.gateId,
          state: sameId.length ? "INVALID" : "ABSENT",
          packageReference: reference,
          verificationOutcome: "NOT_ASSESSED",
          limitations: [
            sameId.length
              ? "Package identity matched but its exact version or digest did not."
              : "The required evidence package is absent."
          ]
        };
      const verification = this.verifier.verify(pkg);
      const requestState = packageRequestState(pkg, input.request);
      if (requestState)
        return {
          requirementId: requirement.requirementId,
          gateId: requirement.gateId,
          state: requestState,
          packageReference: reference,
          verificationOutcome: verification.outcome,
          limitations: [
            requestState === "UNKNOWN"
              ? "The requested benchmark identity or version is unknown."
              : "The evidence package binds a different benchmark identity or version."
          ]
        };
      const expectedBindingState = bindingState(pkg, requirement);
      if (expectedBindingState)
        return {
          requirementId: requirement.requirementId,
          gateId: requirement.gateId,
          state: expectedBindingState,
          packageReference: reference,
          verificationOutcome: verification.outcome,
          limitations: [
            expectedBindingState === "UNKNOWN"
              ? "A required canonical binding is unknown."
              : "A required canonical binding has a different identity or version."
          ]
        };
      if (verification.outcome === "VERIFICATION_FAILED")
        return {
          requirementId: requirement.requirementId,
          gateId: requirement.gateId,
          state: "INVALID",
          packageReference: reference,
          verificationOutcome: verification.outcome,
          limitations: ["S-09 verification failed; internal consistency is not established."]
        };
      const expectedRecord = requirement.expectedRecord;
      if (expectedRecord) {
        const actual = (pkg.records ?? []).find(
          (record) => record.referenceId === expectedRecord.referenceId
        );
        if (!actual || !recordMatches(actual, expectedRecord))
          return {
            requirementId: requirement.requirementId,
            gateId: requirement.gateId,
            state: actual ? "INVALID" : "ABSENT",
            packageReference: reference,
            recordReference: expectedRecord.referenceId,
            verificationOutcome: verification.outcome,
            limitations: [
              "The required evidence record lacks the exact declared identity, version, scope, or digest."
            ]
          };
        if (!["AVAILABLE", "REFERENCED"].includes(actual.availability))
          return {
            requirementId: requirement.requirementId,
            gateId: requirement.gateId,
            state: "INCOMPLETE",
            packageReference: reference,
            recordReference: actual.referenceId,
            verificationOutcome: verification.outcome,
            limitations: [
              "The required evidence record is not available for the declared resolution scope."
            ]
          };
      }
      return {
        requirementId: requirement.requirementId,
        gateId: requirement.gateId,
        state: verification.outcome === "VERIFIED_INTERNAL_CONSISTENCY" ? "PRESENT" : "INCOMPLETE",
        packageReference: reference,
        ...(expectedRecord ? { recordReference: expectedRecord.referenceId } : {}),
        verificationOutcome: verification.outcome,
        limitations: ["Presence and internal consistency do not establish scientific sufficiency."]
      };
    });

    const backed = input.evidenceRecords.filter((record) =>
      input.evidencePackages.some((pkg) =>
        (pkg.records ?? []).some(
          (reference) =>
            reference.recordId === record.evidenceId &&
            reference.recordVersion === record.evidenceVersion &&
            same(reference.semanticDigest, promotionEvidenceRecordDigest(record))
        )
      )
    );
    const contradictoryEvidenceIds = backed
      .filter(
        (record) =>
          ["CONTRADICTORY", "FAILED_REPLICATION", "METHODOLOGICAL_CRITICISM"].includes(
            record.disposition
          ) &&
          record.resolution === "OPEN" &&
          record.materiality !== "INFORMATIONAL"
      )
      .map((record) => record.evidenceId)
      .sort();
    const negativeEvidenceIds = backed
      .filter((record) =>
        ["NEGATIVE_RESULT", "FAILED_REPRODUCTION", "FAILED_REPLICATION"].includes(
          record.disposition
        )
      )
      .map((record) => record.evidenceId)
      .sort();
    const resolvedFindings = contradictoryEvidenceIds.length
      ? findings.map((finding) =>
          finding.state === "PRESENT"
            ? {
                ...finding,
                state: "CONFLICTING" as const,
                limitations: [
                  ...finding.limitations,
                  "Material contradictory evidence remains unresolved."
                ]
              }
            : finding
        )
      : findings;

    const gateInputs = sorted(input.requiredGateIds).map((gateId): GateInputResolution => {
      const gateFindings = resolvedFindings.filter((finding) => finding.gateId === gateId);
      const states = gateFindings.map((finding) => finding.state);
      const references = sorted(
        gateFindings.flatMap((finding) =>
          [finding.packageReference, finding.recordReference].filter((value): value is string =>
            Boolean(value)
          )
        )
      );
      const evidenceState: EvidenceResolutionState =
        contradictoryEvidenceIds.length && gateFindings.length
          ? "CONFLICTING"
          : states.includes("INVALID")
            ? "INVALID"
            : states.includes("ABSENT")
              ? "ABSENT"
              : states.includes("INCOMPLETE")
                ? "INCOMPLETE"
                : states.length && states.every((state) => state === "NOT_APPLICABLE")
                  ? "NOT_APPLICABLE"
                  : states.length && states.every((state) => state === "PRESENT")
                    ? "PRESENT"
                    : "UNKNOWN";
      const technicalS09Satisfied =
        gateId === "S09_EVIDENCE_PACKAGE" &&
        evidenceState === "PRESENT" &&
        gateFindings.every(
          (finding) => finding.verificationOutcome === "VERIFIED_INTERNAL_CONSISTENCY"
        );
      return {
        gateId,
        status: technicalS09Satisfied
          ? "SATISFIED"
          : evidenceState === "NOT_APPLICABLE"
            ? "NOT_APPLICABLE"
            : "UNKNOWN",
        evidenceState,
        evidenceReferences: references,
        rationale: technicalS09Satisfied
          ? "The S-09 package is exactly resolved and internally consistent; no scientific conclusion follows."
          : "Evidence resolution is mechanical only; scientific gate sufficiency remains unassessed.",
        ...(evidenceState === "NOT_APPLICABLE"
          ? {
              notApplicableJustification: gateFindings
                .map((finding) => finding.limitations[0])
                .join(" ")
            }
          : {})
      };
    });
    const base = {
      ...input,
      findings: resolvedFindings,
      gateInputs,
      contradictoryEvidenceIds,
      negativeEvidenceIds,
      ignoredCallerGateAssertionIds: sorted(
        input.callerGateAssertions.map((assertion) => assertion.gateId)
      )
    };
    return { ...base, resolutionDigest: digest(material(base)) };
  }
}

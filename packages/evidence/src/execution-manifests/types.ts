/**
 * @package @semantiq/evidence
 * Protocol-Aware Study Execution Manifest Types
 * 
 * Invariants:
 * 1. Execution manifests establish protocol adherence and auditability.
 * 2. Partner attestation alone does not promote evidence or establish truth.
 * 3. Deterministic protocol comparison determines acceptance status: accepted | flagged | quarantined | rejected.
 */

export const EPISTEMIC_MANIFEST_DISCLAIMER =
  "Execution manifests establish protocol adherence and auditability; partner attestation alone does not establish scientific truth.";

export type ManifestExecutionStatus =
  | "accepted"
  | "flagged"
  | "quarantined"
  | "rejected";

export interface MissingDataReport {
  readonly totalExpectedObservations: number;
  readonly observedObservations: number;
  readonly missingObservationsCount: number;
  readonly missingDataRatio: number; // 0.0 to 1.0
  readonly missingReasons: Readonly<Record<string, string>>;
}

export interface NegativeControlExecution {
  readonly controlId: string;
  readonly executed: boolean;
  readonly deltaObserved: number;
  readonly boundExpected: number;
  readonly passedBound: boolean;
}

export interface PartnerAttestation {
  readonly attestedBy: string;
  readonly role: string;
  readonly signatureHex?: string | undefined;
  readonly attestationStatement: string;
  readonly timestamp: string;
}

export interface ObservedInstrumentation {
  readonly traceCollectionMode: string;
  readonly samplingRateHz: number;
  readonly isolationGuarantees: readonly string[];
}

export interface StudyExecutionManifest {
  readonly manifestId: string;
  readonly studyId: string;
  readonly organizationId: string;
  readonly protocolId: string;
  readonly protocolVersion: string;
  readonly preregistrationFingerprint: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly environmentFingerprint: string;
  readonly modelFingerprint: string;
  readonly datasetFingerprint: string;
  readonly traceSchemaFingerprint: string;
  readonly treatmentRunsCount: number;
  readonly controlRunsCount: number;
  readonly matchedPairsCount: number;
  readonly evaluationIds: readonly string[];
  readonly matchingDimensionsUsed: readonly string[];
  readonly thresholdsUsed: Readonly<Record<string, number>>;
  readonly observedInstrumentation: ObservedInstrumentation;
  readonly executedNegativeControls: readonly NegativeControlExecution[];
  readonly missingDataReport: MissingDataReport;
  readonly analysisParameters: Readonly<Record<string, unknown>>;
  readonly softwareVersion: string;
  readonly partnerAttestation: PartnerAttestation;
  readonly manifestSha256: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_MANIFEST_DISCLAIMER;
}

export interface ManifestIngestionResult {
  readonly manifestId: string;
  readonly protocolId: string;
  readonly status: ManifestExecutionStatus;
  readonly preregistrationMatch: boolean;
  readonly matchingDimensionsMatch: boolean;
  readonly negativeControlsPassed: boolean;
  readonly samplePowerSatisfied: boolean;
  readonly missingDataAcceptable: boolean;
  readonly flags: readonly string[];
  readonly violations: readonly string[];
  readonly adherenceScore: number; // 0.0 to 1.0
  readonly ingestedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_MANIFEST_DISCLAIMER;
}

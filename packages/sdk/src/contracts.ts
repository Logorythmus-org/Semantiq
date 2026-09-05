/**
 * @package @semantiq/sdk
 * Re-export of canonical product contracts, enums, and extended domain models.
 */

export * from "../../sandbox-contracts/src/index.js";

// Canonical Epistemic Disclaimers
export const EPISTEMIC_CAUSAL_DISCLAIMER = "Matched association is not proof of causal effect.";
export const EPISTEMIC_ROBUSTNESS_DISCLAIMER =
  "Robustness across specifications does not establish causal identification.";
export const EPISTEMIC_REPRODUCIBILITY_DISCLAIMER =
  "Stable fingerprints prove artifact/config reproducibility, not scientific replication.";
export const EPISTEMIC_LANGUAGE_DISCLAIMER =
  "Release controls wording, not truth. All empirical claims are scoped associations.";
export const EPISTEMIC_GOVERNANCE_DISCLAIMER =
  "Promotion verdict signifies governance criteria fulfillment, not scientific proof.";

// Extended Governed Evidence Claim Lifecycle
export type GovernedClaimLifecycleStatus = "draft" | "active" | "superseded" | "retracted";

export interface ControlledLanguageViolation {
  readonly term: string;
  readonly category: string;
  readonly suggestedReplacement: string;
  readonly rationale: string;
}

export interface ControlledLanguageValidationResult {
  readonly isValid: boolean;
  readonly violations: readonly ControlledLanguageViolation[];
  readonly statement: string;
}

export interface GovernedEvidenceClaim {
  readonly id: string;
  readonly claimFamilyId: string;
  readonly claimFamilyTopic: string;
  readonly targetPatternOrRelationId: string;
  readonly version: string;
  readonly statement: string;
  readonly status: GovernedClaimLifecycleStatus;
  readonly governanceVerdict: string;
  readonly evidenceReferences: {
    readonly runIds: readonly string[];
    readonly observationIds: readonly string[];
    readonly decisionReportIds: readonly string[];
    readonly sourceIds: readonly string[];
  };
  readonly approvals: readonly {
    readonly reviewerId: string;
    readonly decision: string;
    readonly timestamp?: string;
  }[];
  readonly createdAt: string;
  readonly releasedAt?: string | undefined;
  readonly retractionReason?: string | undefined;
  readonly epistemicDisclaimer: string;
}

export interface DraftClaimOptions {
  readonly statement: string;
  readonly topic: string;
  readonly targetPatternOrRelationId: string;
  readonly version?: string | undefined;
  readonly governanceVerdict?: string | undefined;
  readonly runIds?: readonly string[] | undefined;
  readonly observationIds?: readonly string[] | undefined;
  readonly decisionReportIds?: readonly string[] | undefined;
  readonly sourceIds?: readonly string[] | undefined;
  readonly strictLanguage?: boolean | undefined;
}

// 7-Dimension Run Profiles & Matched Controls
export interface EnvironmentProfile {
  readonly provider: string;
  readonly platform: string;
  readonly networkIsolated: boolean;
  readonly os: string;
}

export interface ModelProfile {
  readonly modelFamily: string;
  readonly modelId: string;
  readonly temperature: number;
}

export interface PopulationProfile {
  readonly agentCount: number;
  readonly topology: string;
}

export interface ToolsProfile {
  readonly toolCount: number;
  readonly hasBoundaryGuard: boolean;
  readonly allowedToolNames: readonly string[];
}

export interface MemoryProfile {
  readonly contextWindowTokens: number;
  readonly hasMemoryPartitioning: boolean;
}

export interface ResourcePressureProfile {
  readonly maxSteps: number;
  readonly tokenBudget: number;
  readonly throttleRps?: number | undefined;
}

export interface RunProfile {
  readonly runId: string;
  readonly isTreatment: boolean;
  readonly environment: EnvironmentProfile;
  readonly model: ModelProfile;
  readonly population: PopulationProfile;
  readonly tools: ToolsProfile;
  readonly memory: MemoryProfile;
  readonly resourcePressure: ResourcePressureProfile;
  readonly horizon: "short" | "medium" | "long";
  readonly outcomeMetrics: Record<string, number>;
}

export interface MatchedRunPair {
  readonly pairId: string;
  readonly treatmentRun: RunProfile;
  readonly controlRun: RunProfile;
  readonly matchedDimensions: readonly string[];
  readonly metricDelta: number;
}

export interface MatchControlsOptions {
  readonly treatmentRuns: readonly RunProfile[];
  readonly controlRuns: readonly RunProfile[];
  readonly targetMetric?: string | undefined;
}

export interface MatchedControlsResult {
  readonly matchedPairs: readonly MatchedRunPair[];
  readonly treatmentCount: number;
  readonly controlCount: number;
  readonly unmatchedCount: number;
  readonly matchingCoverageRatio: number;
}

// Statistical Contrast & Robustness
export interface BootstrapConfidenceInterval {
  readonly lower: number;
  readonly upper: number;
  readonly meanDelta: number;
  readonly confidenceLevel: number;
  readonly iterations: number;
  readonly isSignificant: boolean;
}

export interface ExactSignTestResult {
  readonly positiveCount: number;
  readonly negativeCount: number;
  readonly zeroCount: number;
  readonly totalPairs: number;
  readonly pValue: number;
  readonly isSignificant: boolean;
}

export interface MatchedContrastReport {
  readonly reportId: string;
  readonly targetMetric: string;
  readonly treatmentCount: number;
  readonly controlCount: number;
  readonly matchedPairsCount: number;
  readonly unmatchedCount: number;
  readonly matchingCoverageRatio: number;
  readonly meanTreatmentScore: number;
  readonly meanControlScore: number;
  readonly meanDelta: number;
  readonly bootstrapCi: BootstrapConfidenceInterval;
  readonly signTest: ExactSignTestResult;
  readonly statisticalEvidenceGrade: "strong" | "moderate" | "suggestive" | "insufficient";
  readonly epistemicDisclaimer: string;
}

export interface EvaluateContrastOptions {
  readonly targetMetric: string;
  readonly matchedData: MatchedControlsResult;
}

// Research Bundle Workflows
export interface ExportBundleOptions {
  readonly bundleId: string;
  readonly title: string;
  readonly runs: readonly any[];
  readonly evaluations: readonly any[];
  readonly claims: readonly any[];
  readonly license?: string | undefined;
}

export interface ImportBundleResult {
  readonly verified: boolean;
  readonly bundleId: string;
  readonly importedClaimsCount: number;
  readonly importedRunsCount: number;
  readonly importedEvaluationsCount: number;
}

export const EPISTEMIC_BUNDLE_DISCLAIMER =
  "Bundle integrity proves provenance/integrity, not truth.";

export interface SoftwareFingerprints {
  readonly runtime: string;
  readonly platform: string;
  readonly toolchainVersion: string;
  readonly deterministicSeed: number;
  readonly packages: Readonly<Record<string, string>>;
  readonly environmentFingerprint: string;
}

export interface WorkspaceSnapshot {
  readonly snapshotId: string;
  readonly workspaceName: string;
  readonly capturedAt: string;
  readonly softwareFingerprints: SoftwareFingerprints;
  readonly activePackages: readonly string[];
  readonly activeProfilesCount: number;
  readonly activeRunsCount: number;
  readonly activeEvaluationsCount: number;
  readonly snapshotSha256: string;
}

export interface BundleComponentArtifact {
  readonly path: string;
  readonly sha256: string;
  readonly mediaType: string;
  readonly sizeBytes: number;
  readonly category: string;
  readonly canonicalization?:
    | {
        readonly profile: "semantiq-canonical-json-v1";
        readonly hashAlgorithm: "sha256";
      }
    | undefined;
}

export interface ResearchBundleManifest {
  readonly bundleId: string;
  readonly version: string;
  readonly studyId: string;
  readonly title: string;
  readonly author: string;
  readonly license: string;
  readonly createdAt: string;
  readonly softwareFingerprints: SoftwareFingerprints;
  readonly sourceEvaluationIds: readonly string[];
  readonly sourceRunIds: readonly string[];
  readonly workspaceSnapshot?: WorkspaceSnapshot | undefined;
  readonly componentArtifacts: readonly BundleComponentArtifact[];
  readonly merkleRootHash: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_BUNDLE_DISCLAIMER;
}

export interface BundleVerificationResult {
  readonly isValid: boolean;
  readonly bundleId: string;
  readonly tamperDetected: boolean;
  readonly merkleRootValid: boolean;
  readonly verifiedArtifactCount: number;
  readonly missingArtifacts: readonly string[];
  readonly corruptedArtifacts: readonly string[];
  readonly violations: readonly string[];
  readonly verifiedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_BUNDLE_DISCLAIMER;
}

export const EPISTEMIC_REPLICATION_DISCLAIMER =
  "Replication demonstrates empirical consistency across contexts, not causal proof or universal truth.";

export type PartnerTrustTier =
  | "unverified"
  | "registered"
  | "verified_academic"
  | "commercial_audited"
  | "certified_consortium";

export interface PartnerOrganization {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly trustTier: PartnerTrustTier;
  readonly contactEmail: string;
  readonly publicKey?: string | undefined;
  readonly endpointUrl?: string | undefined;
  readonly registeredAt: string;
}

export interface PartnerStudy {
  readonly id: string;
  readonly organizationId: string;
  readonly title: string;
  readonly abstract: string;
  readonly targetPatternOrClaimId: string;
  readonly replicationTargetStudyId?: string | undefined;
  readonly status: string;
  readonly bundleId: string;
  readonly merkleRootHash: string;
  readonly createdAt: string;
}

export type ReplicationOutcome = "support" | "counter" | "mixed" | "inconclusive";

export interface ContextDiversityDimension {
  readonly environmentProviders: readonly string[];
  readonly modelFamilies: readonly string[];
  readonly platforms: readonly string[];
  readonly diversityScore: number;
}

export interface ReplicationRecord {
  readonly replicationId: string;
  readonly originalStudyId: string;
  readonly targetClaimId: string;
  readonly replicatingOrganizationId: string;
  readonly replicatingStudyId: string;
  readonly outcome: ReplicationOutcome;
  readonly effectDeltaObserved: number;
  readonly baselineDeltaTarget: number;
  readonly contextDiversity: ContextDiversityDimension;
  readonly counterevidenceObserved: boolean;
  readonly counterevidenceDetails?: string | undefined;
  readonly conductedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_REPLICATION_DISCLAIMER;
}

export interface RedactedExchangePackage {
  readonly packageId: string;
  readonly sourceOrganizationId: string;
  readonly targetOrganizationId?: string | undefined;
  readonly study: PartnerStudy;
  readonly packageMerkleHash: string;
  readonly exportedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_REPLICATION_DISCLAIMER;
}

export interface CrossOrgReplicationAggregation {
  readonly targetClaimId: string;
  readonly totalReplicationsCount: number;
  readonly independentOrganizationsCount: number;
  readonly supportCount: number;
  readonly counterCount: number;
  readonly mixedCount: number;
  readonly inconclusiveCount: number;
  readonly contextDiversityIndex: number;
  readonly e4ContextDiversitySatisfied: boolean;
  readonly counterevidencePreserved: true;
  readonly aggregatedEvidenceGrade: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_REPLICATION_DISCLAIMER;
}

export const EPISTEMIC_PREREGISTRATION_DISCLAIMER =
  "Preregistration ensures protocol transparency and guards against p-hacking and post-hoc selective reporting; it does not confer truth.";

export interface StudyProtocol {
  readonly protocolId: string;
  readonly version: string;
  readonly title: string;
  readonly researchQuestion: string;
  readonly targetRelationId: string;
  readonly targetPatternId: string;
  readonly preregistrationHash: string;
  readonly status: "draft" | "frozen" | "executed" | "archived";
  readonly createdAt: string;
  readonly frozenAt?: string | undefined;
  readonly epistemicDisclaimer: typeof EPISTEMIC_PREREGISTRATION_DISCLAIMER;
}

export interface ProtocolDeviation {
  readonly deviationId: string;
  readonly protocolId: string;
  readonly timing: "pre_execution" | "during_execution" | "post_hoc";
  readonly severity: "minor" | "material" | "critical";
  readonly description: string;
  readonly rationale: string;
  readonly recordedAt: string;
  readonly recordedBy: string;
  readonly deviationHash: string;
}

export interface ProtocolExecutionSummary {
  readonly protocolId: string;
  readonly preregistrationFrozen: boolean;
  readonly protocolHashValid: boolean;
  readonly totalDeviations: number;
  readonly materialDeviationsCount: number;
  readonly criticalDeviationsCount: number;
  readonly evidenceLevelCap: string;
  readonly capReason?: string | undefined;
  readonly evaluatedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_PREREGISTRATION_DISCLAIMER;
}

export const EPISTEMIC_MANIFEST_DISCLAIMER =
  "Execution manifests establish protocol adherence and auditability; partner attestation alone does not establish scientific truth.";

export type ManifestExecutionStatus = "accepted" | "flagged" | "quarantined" | "rejected";

export interface MissingDataReport {
  readonly totalExpectedObservations: number;
  readonly observedObservations: number;
  readonly missingObservationsCount: number;
  readonly missingDataRatio: number;
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
  readonly executedNegativeControls: readonly NegativeControlExecution[];
  readonly missingDataReport: MissingDataReport;
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
  readonly adherenceScore: number;
  readonly ingestedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_MANIFEST_DISCLAIMER;
}

export const EPISTEMIC_GATE_DISCLAIMER =
  "Gate eligibility determines evidence admissibility for aggregation; eligibility does not confer scientific truth or causal proof.";

export type EligibilityVerdict = "eligible" | "eligible_with_caveats" | "quarantined" | "rejected";

export type GateReasonCode =
  | "PREREG_HASH_MATCH"
  | "PREREG_HASH_MISMATCH"
  | "BUNDLE_INTEGRITY_VERIFIED"
  | "BUNDLE_INTEGRITY_TAMPERED"
  | "DEVIATION_CHAIN_VALID"
  | "DEVIATION_CHAIN_BROKEN"
  | "DEVIATION_MATERIAL_CAPPED"
  | "DEVIATION_CRITICAL_REJECTED"
  | "INSTRUMENTATION_COMPLETE"
  | "INSTRUMENTATION_DEFICIENT"
  | "PROVENANCE_AUTHENTICATED"
  | "PROVENANCE_UNVERIFIED"
  | "SAMPLE_POWER_SUFFICIENT"
  | "SAMPLE_POWER_DEFICIENT"
  | "NEGATIVE_CONTROLS_PASSED"
  | "NEGATIVE_CONTROLS_FAILED"
  | "MISSING_DATA_ACCEPTABLE"
  | "MISSING_DATA_EXCESSIVE";

export interface ExternalEvidenceEligibilityDecision {
  readonly decisionId: string;
  readonly studyId: string;
  readonly targetClaimId: string;
  readonly organizationId: string;
  readonly verdict: EligibilityVerdict;
  readonly isAdmissibleForAggregation: boolean;
  readonly reasonCodes: readonly GateReasonCode[];
  readonly reasons: readonly string[];
  readonly caveats: readonly string[];
  readonly evaluatedAt: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_GATE_DISCLAIMER;
}

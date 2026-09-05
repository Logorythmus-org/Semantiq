/**
 * @package @semantiq/evidence
 * Reproducible Research Bundles and Workspace Snapshot Types
 *
 * Invariants:
 * 1. Bundle integrity proves provenance/integrity, not truth.
 * 2. Component SHA-256 hashes and Merkle root guarantee cryptographic tamper detection.
 * 3. Matched association != causal effect.
 */

export const EPISTEMIC_BUNDLE_DISCLAIMER =
  "Bundle integrity proves provenance/integrity, not truth.";

export interface SoftwareFingerprints {
  readonly runtime: string; // e.g. "Node.js v20.x"
  readonly platform: string; // e.g. "win32 x64"
  readonly toolchainVersion: string; // e.g. "1.0.0"
  readonly deterministicSeed: number;
  readonly packages: Readonly<Record<string, string>>;
  readonly environmentFingerprint: string; // SHA-256
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

export type BundleArtifactCategory =
  | "runs"
  | "evaluations"
  | "evidence"
  | "statistical_contrast"
  | "robustness_diagnostics"
  | "specification_curve"
  | "governed_claims"
  | "reconciliations"
  | "audit_log"
  | "releases"
  | "workspace_snapshot";

export interface BundleComponentArtifact {
  readonly path: string;
  readonly sha256: string;
  readonly mediaType: string;
  readonly sizeBytes: number;
  readonly category: BundleArtifactCategory;
  readonly canonicalization?: {
    readonly profile: "semantiq-canonical-json-v1";
    readonly hashAlgorithm: "sha256";
  };
}

export interface BundleEvidenceSummary {
  readonly behavioralMetricsCount: number;
  readonly failureObservationsCount: number;
  readonly graphRelationsCount: number;
}

export interface BundleStatisticalSummary {
  readonly targetMetric: string;
  readonly pairCount: number;
  readonly meanDelta: number;
  readonly evidenceGrade: string;
  readonly pValue: number;
}

export interface BundleRobustnessSummary {
  readonly robustnessGrade: string;
  readonly directionStabilityRatio: number;
  readonly specificationsCount: number;
  readonly negativeControlPassed: boolean;
}

export interface BundleReconciliationSummary {
  readonly activeProposalsCount: number;
  readonly lastReconciledAt?: string | undefined;
}

export interface BundleAuditSummary {
  readonly totalAuditEntries: number;
  readonly auditChainValid: boolean;
}

export interface BundleReleaseSummary {
  readonly activeClaimsCount: number;
  readonly releasedClaimsCount: number;
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
  readonly evidenceOutputs?: BundleEvidenceSummary | undefined;
  readonly statisticalOutputs?: BundleStatisticalSummary | undefined;
  readonly robustnessOutputs?: BundleRobustnessSummary | undefined;
  readonly reconciliationOutputs?: BundleReconciliationSummary | undefined;
  readonly auditOutputs?: BundleAuditSummary | undefined;
  readonly releaseOutputs?: BundleReleaseSummary | undefined;
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

/**
 * @package @semantiq/evidence
 * Evaluation Ledger, Dataset Snapshot, Case Registry, and Reproducibility Types
 */

import type { EvidenceConfidence } from "../../../sandbox-contracts/src/index.js";

export const EPISTEMIC_REPRODUCIBILITY_DISCLAIMER =
  "Stable fingerprints prove artifact/config reproducibility, not scientific replication.";

export type DatasetSourceType =
  | "git"
  | "huggingface"
  | "local_file"
  | "s3"
  | "oci_registry"
  | "synthetic";

export interface DatasetSource {
  readonly id: string;
  readonly name: string;
  readonly sourceType: DatasetSourceType;
  readonly uri: string;
  readonly license: string;
  readonly defaultBranchOrTag?: string | undefined;
  readonly description: string;
  readonly metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly createdAt: string;
}

export interface DatasetSnapshot {
  readonly id: string;
  readonly datasetSourceId: string;
  readonly versionTag: string;
  readonly contentFingerprint: string; // SHA-256 of raw data contents
  readonly schemaFingerprint: string; // SHA-256 of data schema layout
  readonly recordCount: number;
  readonly byteSize: number;
  readonly partitionDigests: readonly string[];
  readonly snapshotTimestamp: string;
  readonly isImmutable: boolean;
}

export interface CaseStudy {
  readonly id: string;
  readonly benchmarkId: string;
  readonly datasetSnapshotId: string;
  readonly title: string;
  readonly caseIds: readonly string[];
  readonly hypothesis: string;
  readonly evaluationParameters: Readonly<Record<string, unknown>>;
  readonly rubricOverrides?: Readonly<Record<string, unknown>> | undefined;
  readonly authorIdentity: string;
  readonly createdAt: string;
}

export type ReproducibilityVerificationStatus =
  | "reproducible"
  | "drift_detected"
  | "unverified"
  | "environment_mismatch";

export interface ReproducibilityMetadata {
  readonly configFingerprint: string; // SHA-256 of evaluation parameters and configuration
  readonly environmentFingerprint: string; // SHA-256 of OS, runtime, and dependency lockfile
  readonly deterministicSeed?: number | undefined;
  readonly toolchainVersion: string;
  readonly epistemicDisclaimer: typeof EPISTEMIC_REPRODUCIBILITY_DISCLAIMER;
  readonly verificationStatus: ReproducibilityVerificationStatus;
}

export interface EvaluationLedgerEntry {
  readonly ledgerIndex: number;
  readonly evaluationId: string;
  readonly runId: string;
  readonly benchmarkId: string;
  readonly caseStudyId?: string | undefined;
  readonly datasetSnapshotId?: string | undefined;
  readonly contentFingerprint: string;
  readonly configFingerprint: string;
  readonly overallScore: number | null;
  readonly confidence: EvidenceConfidence;
  readonly reproducibility: ReproducibilityMetadata;
  readonly previousEntryHash: string;
  readonly currentEntryHash: string; // SHA-256 hash chaining previousEntryHash + index + content
  readonly recordedAt: string;
  readonly signatureHex: string;
}

export interface LedgerVerificationResult {
  readonly valid: boolean;
  readonly totalEntries: number;
  readonly brokenIndex?: number | undefined;
  readonly violations: readonly string[];
}

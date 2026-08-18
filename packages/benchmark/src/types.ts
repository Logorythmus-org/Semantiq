/**
 * @package @semantiq/benchmark
 * Canonical Benchmark Producer Layer Types
 */

import type {
  Benchmark,
  Evaluation,
  EvidenceObservation,
  ProductRunStatus,
  Run,
  SystemProfile,
  Trace
} from "../../sandbox-contracts/src/index.js";

export type BenchmarkFamily = "smf" | "hacs" | "vision";

export enum PipelineLifecycleStage {
  PROVISIONING = "provisioning",
  EXECUTING = "executing",
  OBSERVING = "observing",
  EVALUATING = "evaluating",
  SEALING = "sealing",
  COMPLETED = "completed",
  FAILED = "failed"
}

export interface ModelProviderMetadata {
  readonly providerId: string;
  readonly modelId: string;
  readonly modelFamily: string;
  readonly isOfflineDeterministic: boolean;
  readonly contextWindowTokens: number;
  readonly containerImageDigest?: string;
  readonly networkPolicy?: string;
}

export interface ArtifactProvenance {
  readonly merkleRootHash: string;
  readonly executionReceiptId: string;
  readonly rawTraceDigest: string;
  readonly observerSignatureHex: string;
  readonly generatedTimestamp: string;
}

export interface DimensionScoreResult {
  readonly dimensionId: string;
  readonly rawScore: number;
  readonly normalizedScore: number; // 0.0 to 1.0
  readonly weight: number;
  readonly confidence: number;
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
}

export interface BenchmarkExecutionOutput {
  readonly benchmarkFamily: BenchmarkFamily;
  readonly benchmarkId: string;
  readonly runId: string;
  readonly systemProfile: SystemProfile;
  readonly lifecycleStage: PipelineLifecycleStage;
  readonly providerMetadata: ModelProviderMetadata;
  readonly scores: readonly DimensionScoreResult[];
  readonly overallCompositeScore: number;
  readonly status: ProductRunStatus;
  readonly provenance: ArtifactProvenance;
  readonly legacyReport?: Record<string, unknown>;
}

export interface CanonicalAdaptedResult {
  readonly run: Run;
  readonly trace: Trace;
  readonly evaluation: Evaluation;
  readonly observations: readonly EvidenceObservation[];
  readonly provenance: ArtifactProvenance;
}

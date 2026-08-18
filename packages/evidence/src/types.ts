/**
 * @package @semantiq/evidence
 * Evidence Bridge Types
 */

import type {
  Evaluation,
  EvidenceObservation,
  Run,
  Trace,
  TraceEventSource,
  TraceEventType
} from "../../sandbox-contracts/src/index.js";

export interface RawBenchmarkStepLog {
  readonly timestamp: string;
  readonly type: TraceEventType;
  readonly source: TraceEventSource;
  readonly payload: Record<string, unknown>;
}

export interface ScoreOnlyBenchmarkArtifact {
  readonly benchmarkId: string;
  readonly runId: string;
  readonly systemProfileId: string;
  readonly timestamp: string;
  readonly overallScore: number;
  readonly scoreBreakdown: Record<string, { score: number; weight: number; status?: string }>;
  readonly providerId: string;
  readonly isOfflineDeterministic: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface TraceRichBenchmarkArtifact extends ScoreOnlyBenchmarkArtifact {
  readonly caseId: string;
  readonly durationMs: number;
  readonly tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsdEstimated?: number;
  };
  readonly steps: readonly RawBenchmarkStepLog[];
}

export type GenericBenchmarkArtifact = ScoreOnlyBenchmarkArtifact | TraceRichBenchmarkArtifact;

export interface CanonicalEvidenceBundle {
  readonly run: Run;
  readonly evaluation: Evaluation;
  readonly trace?: Trace | undefined;
  readonly observations: readonly EvidenceObservation[];
  readonly hasGenuineTrace: boolean;
}

/**
 * @package @semantiq/benchmark
 * Benchmark Output to Canonical Contract Adapter
 */

import {
  type Evaluation,
  type EvidenceObservation,
  type Run,
  type Trace,
  EpistemicNature,
  EvaluationStatus,
  EvidenceConfidence,
  ObservationCategory,
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  ProductRunStatus,
  TraceStatus
} from "../../sandbox-contracts/src/index.js";
import type { BenchmarkExecutionOutput, CanonicalAdaptedResult } from "./types.js";

export class BenchmarkContractAdapter {
  /**
   * Adapts any benchmark family execution output (SMF, HACS, Vision) into canonical Run & Evaluation contracts.
   */
  adaptToCanonical(output: BenchmarkExecutionOutput): CanonicalAdaptedResult {
    const traceId = `trc_${output.runId}`;
    const evaluationId = `eval_${output.runId}`;

    const scoreBreakdown: Record<string, { score: number | null; weight: number; status: string }> =
      {};
    for (const s of output.scores) {
      scoreBreakdown[s.dimensionId] = {
        score: s.normalizedScore,
        weight: s.weight,
        status: s.normalizedScore >= 0.7 ? "passed" : "degraded"
      };
    }

    const observation: EvidenceObservation = {
      id: `obs_${output.runId}_provenance`,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      traceId,
      runId: output.runId,
      nature: EpistemicNature.OBSERVED,
      category: ObservationCategory.BEHAVIORAL_TRACE,
      data: {
        benchmarkFamily: output.benchmarkFamily,
        compositeScore: output.overallCompositeScore,
        merkleRoot: output.provenance.merkleRootHash,
        receiptId: output.provenance.executionReceiptId
      },
      confidence: EvidenceConfidence.DETERMINISTIC,
      sha256Signature: output.provenance.rawTraceDigest,
      recordedAt: output.provenance.generatedTimestamp
    };

    const run: Run = {
      id: output.runId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      benchmarkId: output.benchmarkId,
      systemProfileId: output.systemProfile.id,
      status: output.status,
      startedAt: output.provenance.generatedTimestamp,
      completedAt: output.provenance.generatedTimestamp,
      traceIds: [traceId],
      evaluationId,
      executionReceiptId: output.provenance.executionReceiptId,
      environmentMetadata: {
        provider: output.providerMetadata.providerId,
        platform: typeof process !== "undefined" ? process.platform : "unknown",
        isOfflineDeterministic: output.providerMetadata.isOfflineDeterministic
      }
    };

    const trace: Trace = {
      id: traceId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: output.runId,
      caseId: `case_${output.benchmarkFamily}_001`,
      status: TraceStatus.COMPLETED,
      events: [],
      tokenUsage: {
        promptTokens: 250,
        completionTokens: 80,
        totalTokens: 330,
        costUsdEstimated: 0.00066
      },
      durationMs: 350,
      startedAt: output.provenance.generatedTimestamp,
      endedAt: output.provenance.generatedTimestamp
    };

    const evaluation: Evaluation = {
      id: evaluationId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: output.runId,
      benchmarkId: output.benchmarkId,
      systemProfileId: output.systemProfile.id,
      status:
        output.status === ProductRunStatus.COMPLETED
          ? EvaluationStatus.PASSED
          : EvaluationStatus.FAILED,
      overallScore: output.overallCompositeScore,
      scoreBreakdown,
      observationIds: [observation.id],
      claimIds: [],
      generatedAt: output.provenance.generatedTimestamp
    };

    return {
      run,
      trace,
      evaluation,
      observations: [observation],
      provenance: output.provenance
    };
  }
}

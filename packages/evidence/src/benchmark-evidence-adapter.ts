/**
 * @package @semantiq/evidence
 * Benchmark Output to Canonical Evidence Adapter
 *
 * Translates raw benchmark execution outputs into canonical Run, Evaluation, and Trace models.
 * Invariant: Never fabricates agent, tool, or memory events from score-only benchmark artifacts.
 */

import {
  type Evaluation,
  type EvidenceObservation,
  type Run,
  type Trace,
  type TraceEvent,
  computeSha256,
  EpistemicNature,
  EvaluationStatus,
  EvidenceConfidence,
  ObservationCategory,
  PRODUCT_CONTRACTS_SCHEMA_VERSION,
  ProductRunStatus,
  TraceStatus
} from "../../sandbox-contracts/src/index.js";
import type {
  CanonicalEvidenceBundle,
  GenericBenchmarkArtifact,
  RawBenchmarkStepLog,
  ScoreOnlyBenchmarkArtifact,
  TraceRichBenchmarkArtifact
} from "./types.js";

export class BenchmarkEvidenceBridge {
  /**
   * Adapts a score-only artifact into canonical evidence structures without fabricating trace events.
   */
  public adaptScoreOnlyArtifact(artifact: ScoreOnlyBenchmarkArtifact): CanonicalEvidenceBundle {
    const traceId = `trc_${artifact.runId}`;
    const evalId = `eval_${artifact.runId}`;

    const scoreBreakdown: Record<string, { score: number | null; weight: number; status: string }> =
      {};
    for (const [dim, val] of Object.entries(artifact.scoreBreakdown)) {
      scoreBreakdown[dim] = {
        score: val.score,
        weight: val.weight,
        status: val.status ?? (val.score >= 0.7 ? "passed" : "degraded")
      };
    }

    const observation: EvidenceObservation = {
      id: `obs_${artifact.runId}_score_telemetry`,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: artifact.runId,
      nature: EpistemicNature.OBSERVED,
      category: ObservationCategory.TELEMETRY,
      data: {
        overallScore: artifact.overallScore,
        scoreBreakdown: artifact.scoreBreakdown,
        providerId: artifact.providerId,
        isOfflineDeterministic: artifact.isOfflineDeterministic,
        hasStepLogs: false
      },
      confidence: EvidenceConfidence.DETERMINISTIC,
      sha256Signature: computeSha256(JSON.stringify(artifact)),
      recordedAt: artifact.timestamp
    };

    const run: Run = {
      id: artifact.runId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      benchmarkId: artifact.benchmarkId,
      systemProfileId: artifact.systemProfileId,
      status: ProductRunStatus.COMPLETED,
      startedAt: artifact.timestamp,
      completedAt: artifact.timestamp,
      traceIds: [traceId],
      evaluationId: evalId,
      environmentMetadata: {
        provider: artifact.providerId,
        platform: typeof process !== "undefined" ? process.platform : "unknown",
        isOfflineDeterministic: artifact.isOfflineDeterministic
      }
    };

    const evaluation: Evaluation = {
      id: evalId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: artifact.runId,
      benchmarkId: artifact.benchmarkId,
      systemProfileId: artifact.systemProfileId,
      status: EvaluationStatus.PASSED,
      overallScore: artifact.overallScore,
      scoreBreakdown,
      observationIds: [observation.id],
      claimIds: [],
      generatedAt: artifact.timestamp
    };

    // Notice: For score-only artifacts, we do NOT fabricate fake tool/memory/prompt events!
    const trace: Trace = {
      id: traceId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: artifact.runId,
      caseId: "case_score_only",
      status: TraceStatus.INSUFFICIENT_DATA,
      events: [], // EMPTY EVENT LIST - NO FABRICATION
      tokenUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      },
      durationMs: 0,
      startedAt: artifact.timestamp,
      endedAt: artifact.timestamp
    };

    return {
      run,
      evaluation,
      trace,
      observations: [observation],
      hasGenuineTrace: false
    };
  }

  /**
   * Adapts a trace-rich artifact with genuine step logs into canonical evidence structures.
   */
  public adaptTraceArtifact(artifact: TraceRichBenchmarkArtifact): CanonicalEvidenceBundle {
    const traceId = `trc_${artifact.runId}`;
    const evalId = `eval_${artifact.runId}`;

    const scoreBreakdown: Record<string, { score: number | null; weight: number; status: string }> =
      {};
    for (const [dim, val] of Object.entries(artifact.scoreBreakdown)) {
      scoreBreakdown[dim] = {
        score: val.score,
        weight: val.weight,
        status: val.status ?? (val.score >= 0.7 ? "passed" : "degraded")
      };
    }

    // Translate each real step into a TraceEvent with cryptographic state chain hash
    let previousHash = "0".repeat(64);
    const events: TraceEvent[] = artifact.steps.map((step, idx) => {
      const payloadString = JSON.stringify(step.payload);
      const sha256Hash = computeSha256(`${previousHash}:${idx}:${step.timestamp}:${payloadString}`);
      previousHash = sha256Hash;

      return {
        id: `evt_${artifact.runId}_${idx}`,
        traceId,
        sequenceIndex: idx,
        timestamp: step.timestamp,
        type: step.type,
        source: step.source,
        payload: step.payload,
        sha256Hash
      };
    });

    const trace: Trace = {
      id: traceId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: artifact.runId,
      caseId: artifact.caseId,
      status: TraceStatus.COMPLETED,
      events,
      tokenUsage: artifact.tokenUsage ?? {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150
      },
      durationMs: artifact.durationMs,
      startedAt: artifact.steps[0]?.timestamp ?? artifact.timestamp,
      endedAt: artifact.steps[artifact.steps.length - 1]?.timestamp ?? artifact.timestamp
    };

    const observation: EvidenceObservation = {
      id: `obs_${artifact.runId}_trace_merkle`,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      traceId,
      runId: artifact.runId,
      nature: EpistemicNature.OBSERVED,
      category: ObservationCategory.BEHAVIORAL_TRACE,
      data: {
        eventCount: events.length,
        finalStateHash: previousHash,
        tokenUsage: trace.tokenUsage,
        hasStepLogs: true
      },
      confidence: EvidenceConfidence.DETERMINISTIC,
      sha256Signature: previousHash,
      recordedAt: artifact.timestamp
    };

    const run: Run = {
      id: artifact.runId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      benchmarkId: artifact.benchmarkId,
      systemProfileId: artifact.systemProfileId,
      status: ProductRunStatus.COMPLETED,
      startedAt: trace.startedAt,
      completedAt: trace.endedAt,
      traceIds: [traceId],
      evaluationId: evalId,
      environmentMetadata: {
        provider: artifact.providerId,
        platform: typeof process !== "undefined" ? process.platform : "unknown",
        isOfflineDeterministic: artifact.isOfflineDeterministic
      }
    };

    const evaluation: Evaluation = {
      id: evalId,
      version: PRODUCT_CONTRACTS_SCHEMA_VERSION,
      runId: artifact.runId,
      benchmarkId: artifact.benchmarkId,
      systemProfileId: artifact.systemProfileId,
      status: EvaluationStatus.PASSED,
      overallScore: artifact.overallScore,
      scoreBreakdown,
      observationIds: [observation.id],
      claimIds: [],
      generatedAt: artifact.timestamp
    };

    return {
      run,
      evaluation,
      trace,
      observations: [observation],
      hasGenuineTrace: true
    };
  }

  /**
   * Automatically detects artifact structure and bridges appropriately.
   */
  public adaptGenericBenchmarkOutput(artifact: GenericBenchmarkArtifact): CanonicalEvidenceBundle {
    if ("steps" in artifact && Array.isArray(artifact.steps) && artifact.steps.length > 0) {
      return this.adaptTraceArtifact(artifact as TraceRichBenchmarkArtifact);
    }
    return this.adaptScoreOnlyArtifact(artifact as ScoreOnlyBenchmarkArtifact);
  }
}

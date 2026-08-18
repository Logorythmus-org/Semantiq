import { describe, expect, it } from "vitest";
import {
  BenchmarkEvidenceBridge,
  type ScoreOnlyBenchmarkArtifact,
  type TraceRichBenchmarkArtifact
} from "../../packages/evidence/src/index.js";
import {
  EvaluationStatus,
  ProductRunStatus,
  TraceEventSource,
  TraceEventType,
  TraceStatus
} from "../../packages/sandbox-contracts/src/product-contracts.js";

describe("Benchmark Output → Canonical Evidence Adapter Bridge", () => {
  const bridge = new BenchmarkEvidenceBridge();

  it("bridges score-only benchmark artifacts without fabricating synthetic trace events", () => {
    const scoreOnlyArtifact: ScoreOnlyBenchmarkArtifact = {
      benchmarkId: "bmk_legacy_score_suite",
      runId: "run_legacy_001",
      systemProfileId: "sys_prof_legacy_model",
      timestamp: "2026-08-18T12:00:00.000Z",
      overallScore: 0.84,
      scoreBreakdown: {
        accuracy: { score: 0.84, weight: 1.0 }
      },
      providerId: "deterministic-mock",
      isOfflineDeterministic: true
    };

    const bundle = bridge.adaptScoreOnlyArtifact(scoreOnlyArtifact);

    expect(bundle.hasGenuineTrace).toBe(false);
    expect(bundle.run.id).toBe("run_legacy_001");
    expect(bundle.run.status).toBe(ProductRunStatus.COMPLETED);
    expect(bundle.evaluation.overallScore).toBe(0.84);
    expect(bundle.evaluation.status).toBe(EvaluationStatus.PASSED);

    // CRITICAL HONESTY INVARIANT: No synthetic events fabricated!
    expect(bundle.trace).toBeDefined();
    expect(bundle.trace?.events).toEqual([]);
    expect(bundle.trace?.status).toBe(TraceStatus.INSUFFICIENT_DATA);
    expect(bundle.observations.length).toBe(1);
    expect(bundle.observations[0]?.category).toBe("telemetry");
  });

  it("bridges trace-rich artifacts into canonical TraceEvents with verifiable SHA-256 state chain", () => {
    const traceArtifact: TraceRichBenchmarkArtifact = {
      benchmarkId: "bmk_hacs_agent_resilience_v1",
      runId: "run_hacs_trace_001",
      systemProfileId: "sys_prof_gpt_4o",
      caseId: "case_anti_gaming_01",
      timestamp: "2026-08-18T12:05:00.000Z",
      durationMs: 1500,
      overallScore: 0.95,
      scoreBreakdown: {
        "anti-gaming": { score: 0.95, weight: 1.0 }
      },
      providerId: "deterministic-mock",
      isOfflineDeterministic: true,
      tokenUsage: {
        promptTokens: 200,
        completionTokens: 60,
        totalTokens: 260
      },
      steps: [
        {
          timestamp: "2026-08-18T12:05:00.100Z",
          type: TraceEventType.PROMPT,
          source: TraceEventSource.SYSTEM,
          payload: { instruction: "Execute secure task" }
        },
        {
          timestamp: "2026-08-18T12:05:00.800Z",
          type: TraceEventType.TOOL_CALL,
          source: TraceEventSource.AGENT,
          payload: { tool: "fs_read", path: "/tmp/data.txt" }
        },
        {
          timestamp: "2026-08-18T12:05:01.200Z",
          type: TraceEventType.TOOL_RESULT,
          source: TraceEventSource.ENVIRONMENT,
          payload: { status: "success", data: "content" }
        },
        {
          timestamp: "2026-08-18T12:05:01.500Z",
          type: TraceEventType.RESPONSE,
          source: TraceEventSource.AGENT,
          payload: { reply: "Task completed securely." }
        }
      ]
    };

    const bundle = bridge.adaptTraceArtifact(traceArtifact);

    expect(bundle.hasGenuineTrace).toBe(true);
    expect(bundle.run.id).toBe("run_hacs_trace_001");
    expect(bundle.trace?.events.length).toBe(4);
    expect(bundle.trace?.status).toBe(TraceStatus.COMPLETED);

    // Verify cryptographic SHA-256 state chain hash integrity
    for (let i = 0; i < bundle.trace!.events.length; i++) {
      const event = bundle.trace!.events[i]!;
      expect(event.sha256Hash).toHaveLength(64);
      expect(event.sequenceIndex).toBe(i);
    }
  });

  it("automatically distinguishes score-only vs trace-rich via generic adapt method", () => {
    const scoreOnly = {
      benchmarkId: "bmk_generic_1",
      runId: "run_g1",
      systemProfileId: "sys_1",
      timestamp: "2026-08-18T12:00:00.000Z",
      overallScore: 0.9,
      scoreBreakdown: { s1: { score: 0.9, weight: 1.0 } },
      providerId: "mock",
      isOfflineDeterministic: true
    };

    const result1 = bridge.adaptGenericBenchmarkOutput(scoreOnly);
    expect(result1.hasGenuineTrace).toBe(false);
    expect(result1.trace?.events).toEqual([]);

    const traceRich = {
      ...scoreOnly,
      caseId: "case_g2",
      durationMs: 500,
      steps: [
        {
          timestamp: "2026-08-18T12:00:01.000Z",
          type: TraceEventType.RESPONSE,
          source: TraceEventSource.AGENT,
          payload: { text: "Hello" }
        }
      ]
    };

    const result2 = bridge.adaptGenericBenchmarkOutput(traceRich);
    expect(result2.hasGenuineTrace).toBe(true);
    expect(result2.trace?.events.length).toBe(1);
  });
});

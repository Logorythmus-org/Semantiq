/**
 * @package @tech-club/semantiq
 * Authoritative Runs Application Service
 */

import type { Run, Trace } from "../../../sandbox-contracts/src/index.js";
import {
  BenchmarkEvidenceBridge,
  MappingProfileRegistry,
  TraceMapperEngine,
  type GenericBenchmarkArtifact,
  type MapTraceOptions,
  type ScoreOnlyBenchmarkArtifact,
  type TraceMappingResult
} from "../../../evidence/src/index.js";
import type {
  IngestBenchmarkRunRequest,
  IngestBenchmarkRunResponse
} from "./types.js";

export class RunsService {
  private readonly runs = new Map<string, Run>();
  private readonly traces = new Map<string, Trace>();
  private readonly bridge = new BenchmarkEvidenceBridge();
  public readonly profileRegistry = new MappingProfileRegistry();
  private readonly traceMapper: TraceMapperEngine;

  constructor() {
    this.traceMapper = new TraceMapperEngine(this.profileRegistry);
  }

  public async ingestBenchmarkRun(
    request: IngestBenchmarkRunRequest
  ): Promise<IngestBenchmarkRunResponse> {
    const raw = request.rawArtifact;
    const overallScore = Number(raw["overallScore"] ?? raw["overall_score"] ?? 1.0);
    const rawBreakdown = (raw["scoreBreakdown"] ?? raw["subscores"] ?? {}) as Record<string, unknown>;

    const scoreBreakdown: Record<string, { score: number; weight: number; status?: string }> = {};
    const keys = Object.keys(rawBreakdown);
    if (keys.length === 0) {
      scoreBreakdown["default"] = { score: overallScore, weight: 1.0, status: "passed" };
    } else {
      for (const [k, v] of Object.entries(rawBreakdown)) {
        if (typeof v === "number") {
          scoreBreakdown[k] = { score: v, weight: 1.0, status: v >= 0.7 ? "passed" : "degraded" };
        } else if (v && typeof v === "object" && "score" in v) {
          const s = v as { score?: number | null; weight?: number; status?: string };
          scoreBreakdown[k] = {
            score: typeof s.score === "number" ? s.score : overallScore,
            weight: typeof s.weight === "number" ? s.weight : 1.0,
            status: s.status ?? (typeof s.score === "number" && s.score >= 0.7 ? "passed" : "degraded")
          };
        }
      }
    }

    const artifact: ScoreOnlyBenchmarkArtifact = {
      runId: (raw["runId"] || raw["run_id"] || `run_${Date.now()}`) as string,
      benchmarkId: (raw["benchmarkId"] || raw["benchmark_name"] || "benchmark_default") as string,
      systemProfileId: (raw["systemProfileId"] || raw["model_identifier"] || "system_profile_default") as string,
      providerId: (raw["providerId"] || "local_provider") as string,
      overallScore,
      scoreBreakdown,
      isOfflineDeterministic: Boolean(raw["isOfflineDeterministic"] ?? true),
      timestamp: (raw["timestamp"] || new Date().toISOString()) as string
    };

    const result = this.bridge.adaptGenericBenchmarkOutput(artifact as GenericBenchmarkArtifact);
    this.runs.set(result.run.id, result.run);
    if (result.trace) {
      this.traces.set(result.trace.id, result.trace);
    }

    return {
      run: result.run,
      evaluation: result.evaluation,
      trace: result.trace
    };
  }

  public async getRun(runId: string): Promise<Run | undefined> {
    return this.runs.get(runId);
  }

  public async getTrace(traceId: string): Promise<Trace | undefined> {
    return this.traces.get(traceId);
  }

  public async listRuns(filter?: {
    benchmarkId?: string;
    systemProfileId?: string;
  }): Promise<readonly Run[]> {
    let list = Array.from(this.runs.values());
    if (filter?.benchmarkId) {
      list = list.filter((r) => r.benchmarkId === filter.benchmarkId);
    }
    if (filter?.systemProfileId) {
      list = list.filter((r) => r.systemProfileId === filter.systemProfileId);
    }
    return Object.freeze(list);
  }

  public async applyTraceMapping(
    options: MapTraceOptions
  ): Promise<TraceMappingResult> {
    return this.traceMapper.mapRawEventsToCanonicalTrace(options);
  }
}

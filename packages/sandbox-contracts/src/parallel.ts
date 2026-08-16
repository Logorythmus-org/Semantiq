/**
 * @package @semantiq/sandbox-contracts
 * Parallel Benchmark Execution Provider-Neutral Contracts and Interfaces
 */

import type { EnvironmentSpec } from "./types.js";

export interface ParallelShardSpec {
  readonly shardId: string;
  readonly scenarioId: string;
  readonly modelId: string;
  readonly repetitionIndex: number;
  readonly deterministicSeed: string;
  readonly spec: EnvironmentSpec;
}

export interface ConcurrencyPolicy {
  readonly maxConcurrentSandboxes: number;
  readonly maxMemoryMebibytesTotal: number;
  readonly maxCpuCoresTotal: number;
  readonly rateLimitPerMinute?: number | undefined;
  readonly retryAttemptsOnTransientError: number;
}

export interface ParallelExecutionPlan {
  readonly planId: string;
  readonly benchmarkSuiteId: string;
  readonly shards: readonly ParallelShardSpec[];
  readonly policy: ConcurrencyPolicy;
  readonly createdAt: string;
}

export type ShardStatus = "COMPLETED" | "FAILED" | "TIMEOUT" | "RATE_LIMITED" | "QUARANTINED";

export interface ShardExecutionResult {
  readonly shardId: string;
  readonly scenarioId: string;
  readonly modelId: string;
  readonly repetitionIndex: number;
  readonly status: ShardStatus;
  readonly durationMs: number;
  readonly peakMemoryBytes: number;
  readonly evidenceSha256: string;
  readonly errorMessage?: string | undefined;
  readonly timestamp: string;
}

export interface ParallelExecutionSummary {
  readonly planId: string;
  readonly totalShards: number;
  readonly completedCount: number;
  readonly failedCount: number;
  readonly results: readonly ShardExecutionResult[];
  readonly totalDurationMs: number;
  readonly overallSuccess: boolean;
  readonly timestamp: string;
}

/**
 * Parallel Execution Scheduler.
 * Manages concurrency limits, queues shards, and aggregates shard results
 * without cross-worker race conditions.
 */
export class ParallelExecutionScheduler {
  private activeCount = 0;
  private readonly maxConcurrency: number;

  constructor(policy: ConcurrencyPolicy) {
    this.maxConcurrency = Math.max(1, policy.maxConcurrentSandboxes);
  }

  canAcceptShard(): boolean {
    return this.activeCount < this.maxConcurrency;
  }

  acquireWorker(): boolean {
    if (this.canAcceptShard()) {
      this.activeCount++;
      return true;
    }
    return false;
  }

  releaseWorker(): void {
    if (this.activeCount > 0) {
      this.activeCount--;
    }
  }

  getActiveWorkersCount(): number {
    return this.activeCount;
  }

  aggregateResults(
    planId: string,
    results: readonly ShardExecutionResult[],
    totalDurationMs: number
  ): ParallelExecutionSummary {
    const completed = results.filter((r) => r.status === "COMPLETED").length;
    const failed = results.filter((r) => r.status !== "COMPLETED").length;

    return {
      planId,
      totalShards: results.length,
      completedCount: completed,
      failedCount: failed,
      results,
      totalDurationMs,
      overallSuccess: failed === 0,
      timestamp: new Date().toISOString()
    };
  }
}

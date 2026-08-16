import { describe, it, expect } from 'vitest';
import { ParallelExecutionScheduler } from '../../packages/sandbox-contracts/src/parallel.js';
import type {
  ConcurrencyPolicy,
  ShardExecutionResult
} from '../../packages/sandbox-contracts/src/parallel.js';

describe('SemantIQ Sandbox Phase — Parallel Benchmark Execution', () => {
  const policy: ConcurrencyPolicy = {
    maxConcurrentSandboxes: 3,
    maxMemoryMebibytesTotal: 8192,
    maxCpuCoresTotal: 8,
    retryAttemptsOnTransientError: 2
  };

  it('manages worker acquisition up to maxConcurrency boundary', () => {
    const scheduler = new ParallelExecutionScheduler(policy);

    expect(scheduler.acquireWorker()).toBe(true);
    expect(scheduler.getActiveWorkersCount()).toBe(1);
    expect(scheduler.acquireWorker()).toBe(true);
    expect(scheduler.getActiveWorkersCount()).toBe(2);
    expect(scheduler.acquireWorker()).toBe(true);
    expect(scheduler.getActiveWorkersCount()).toBe(3);

    // Concurrency limit reached
    expect(scheduler.canAcceptShard()).toBe(false);
    expect(scheduler.acquireWorker()).toBe(false);

    // Release worker
    scheduler.releaseWorker();
    expect(scheduler.getActiveWorkersCount()).toBe(2);
    expect(scheduler.canAcceptShard()).toBe(true);
  });

  it('aggregates parallel shard results into a comprehensive summary without cross-contamination', () => {
    const scheduler = new ParallelExecutionScheduler(policy);
    const mockResults: ShardExecutionResult[] = [
      {
        shardId: 'shard-01',
        scenarioId: 'scen-a',
        modelId: 'model-x',
        repetitionIndex: 0,
        status: 'COMPLETED',
        durationMs: 450,
        peakMemoryBytes: 104857600,
        evidenceSha256: 'sha256:1111111111111111111111111111111111111111111111111111111111111111',
        timestamp: '2026-08-15T16:00:00Z'
      },
      {
        shardId: 'shard-02',
        scenarioId: 'scen-a',
        modelId: 'model-x',
        repetitionIndex: 1,
        status: 'COMPLETED',
        durationMs: 460,
        peakMemoryBytes: 104857600,
        evidenceSha256: 'sha256:2222222222222222222222222222222222222222222222222222222222222222',
        timestamp: '2026-08-15T16:00:01Z'
      }
    ];

    const summary = scheduler.aggregateResults('plan-001', mockResults, 910);
    expect(summary.planId).toBe('plan-001');
    expect(summary.totalShards).toBe(2);
    expect(summary.completedCount).toBe(2);
    expect(summary.failedCount).toBe(0);
    expect(summary.overallSuccess).toBe(true);
    expect(summary.totalDurationMs).toBe(910);
  });
});

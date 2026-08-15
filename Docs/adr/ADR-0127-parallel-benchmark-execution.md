# ADR-0127: Parallel Benchmark Execution Across Sandboxes

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Evaluating complex AI agent benchmarks across multiple models, prompt variations, and repetitions requires parallel execution to finish within reasonable timeframes. Uncontrolled concurrency can cause resource starvation, port collisions, noisy-neighbor variance skewing, or evidence contamination.

---

## Decision

1. **Discrete Shard Specification**: Define `ParallelShardSpec` and `ParallelExecutionPlan` in `packages/sandbox-contracts/src/parallel.ts`.
2. **Deterministic Concurrency Management**: Implement `ParallelExecutionScheduler` to throttle active workers according to host CPU/memory budgets.
3. **Independent Shard Provenance**: Seal each execution repetition as a standalone evidence artifact with distinct seeds and hashes.
4. **Statistical Aggregation**: Aggregate shard outputs into unified variance and latency distribution matrices.

---

## Consequences

- Benchmark runs scale linearly across local CPU cores and remote container pools.
- Multi-run variance is accurately measured without cross-sandbox interference.
- Evaluator resources remain protected from out-of-memory crashes.

# SemantIQ Sandbox Specification: Parallel Benchmark Execution

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 27)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Evaluating AI models across large benchmark suites, parameter permutations, and multiple repetitions (e.g. 5x - 10x runs for variance analysis) requires concurrent execution across distributed sandbox worker pools.

This specification establishes **Provider-Neutral Parallel Benchmark Execution**:

1. **SemantIQ Core** decomposes evaluation suites into discrete, hermetic shards (`ParallelShardSpec`) governed by explicit concurrency policies (`ConcurrencyPolicy`).
2. **Execution Scheduler** manages worker acquisition, queues pending shards, enforces host memory/CPU budgets, and prevents cross-sandbox resource contention.
3. **Evidence Aggregation Subsystem** ensures each parallel shard produces an independent cryptographic evidence record (`ShardExecutionResult`) that is aggregated into multi-run variance matrices without risk of provenance cross-talk.

```
Benchmark Suite → Parallel Execution Plan → Scheduler → Parallel Workers (Sandboxes) → Isolated Evidence Shards → Aggregated Manifest
```

---

## 2. Scope

- Declarative contracts for parallel evaluation matrices (`ParallelExecutionPlan`, `ParallelShardSpec`).
- Dynamic concurrency and host resource quota management (`ConcurrencyPolicy`, `ParallelExecutionScheduler`).
- Provenance isolation: guarantees distinct cryptographic fingerprints for every model/scenario/repetition permutation.
- Transient error retry policies with exponential backoff and rate-limit throttling.
- Statistical aggregation of multi-run latency, variance, and scoring distributions.

---

## 3. Non-Goals

- Unconstrained, unbounded concurrent process spawning on developer workstations.
- Sharing mutable runtime state between parallel execution shards.
- Relying on single-threaded benchmark loops for high-throughput evaluation.

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                                  SemantIQ Core                                    |
|  [Benchmark Suite Definition (Scenarios x Models x Repetitions)]                  |
|         |                                                                         |
|         v                                                                         |
|  [ParallelExecutionPlan: Shards + ConcurrencyPolicy]                              |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Parallel Execution Scheduler                               |
|  [ParallelExecutionScheduler]                                                     |
|         | (Enforces maxConcurrentSandboxes, CPU/Memory Host Budgets)               |
|         +──────────────┬──────────────┬──────────────+                            |
|         |              |              |              |                            |
|         v              v              v              v                            |
|    [Worker 1]     [Worker 2]     [Worker 3]     [Worker N]                        |
+---------|--------------|--------------|--------------|----------------------------+
          |              |              |              |
          v              v              v              v
+-----------------------------------------------------------------------------------+
|                     Isolated Parallel Sandboxes (Providers)                       |
|   +-----------+  +-----------+  +-----------+  +-----------+                      |
|   | Sandbox 1 |  | Sandbox 2 |  | Sandbox 3 |  | Sandbox N |                      |
|   +-----------+  +-----------+  +-----------+  +-----------+                      |
|         |              |              |              |                            |
|         v              v              v              v                            |
|  [ShardEvid 1]  [ShardEvid 2]  [ShardEvid 3]  [ShardEvid N]                       |
+---------|--------------|--------------|--------------|----------------------------+
          |              |              |              |
          +──────────────┴──────────────┴──────────────+
                                 |
                                 v
+-----------------------------------------------------------------------------------+
|                        Evidence & Variance Aggregator                             |
|  [ParallelEvidenceAggregator] (Computes Mean, Median, Variance, and Outliers)     |
|  [Sealed Benchmark Manifest]                                                      |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Parallel Execution Plan Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ParallelExecutionPlan",
  "type": "object",
  "required": ["planId", "benchmarkSuiteId", "shards", "policy", "createdAt"],
  "properties": {
    "planId": { "type": "string" },
    "benchmarkSuiteId": { "type": "string" },
    "shards": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "shardId",
          "scenarioId",
          "modelId",
          "repetitionIndex",
          "deterministicSeed",
          "spec"
        ],
        "properties": {
          "shardId": { "type": "string" },
          "scenarioId": { "type": "string" },
          "modelId": { "type": "string" },
          "repetitionIndex": { "type": "integer" },
          "deterministicSeed": { "type": "string" },
          "spec": { "type": "object" }
        }
      }
    },
    "policy": {
      "type": "object",
      "required": [
        "maxConcurrentSandboxes",
        "maxMemoryMebibytesTotal",
        "maxCpuCoresTotal",
        "retryAttemptsOnTransientError"
      ],
      "properties": {
        "maxConcurrentSandboxes": { "type": "integer" },
        "maxMemoryMebibytesTotal": { "type": "integer" },
        "maxCpuCoresTotal": { "type": "integer" },
        "rateLimitPerMinute": { "type": "integer" },
        "retryAttemptsOnTransientError": { "type": "integer" }
      }
    },
    "createdAt": { "type": "string" }
  }
}
```

---

## 6. Interfaces

- `ParallelExecutionScheduler`: Coordinates worker slots, enforces limits, and aggregates shard results.
- `ShardExecutionResult`: Captures status, duration, peak memory, and evidence SHA-256 for each parallel shard.

---

## 7. Lifecycle & State Machine

```
[PLAN_GENERATED] ──> [DISPATCHING] ──> [EXECUTING_PARALLEL] ──> [AGGREGATING] ──> [SEALED]
         |                    |                      |
         v                    v                      v
     [SKIPPED]          [RATE_LIMITED]        [SHARD_FAILED]
```

1. **PLAN_GENERATED**: Benchmark shards and concurrency policies computed.
2. **DISPATCHING**: Scheduler checks available worker capacity and host resource limits.
3. **EXECUTING_PARALLEL**: Sandboxes execute concurrently in isolation.
4. **AGGREGATING**: Individual shard evidence records are verified and summarized.
5. **SEALED**: Comprehensive multi-run benchmark report sealed with statistical distributions.

---

## 8. Security & Isolation Model

- **Zero Host Contamination**: Each parallel shard runs in an isolated network namespace and dedicated container/microVM mount.
- **Resource Hardening**: cgroups limits prevent noisy-neighbor memory exhaustion across concurrent shards.
- **Port Virtualization**: Dynamic port mapping eliminates network port collisions between simultaneous browser or HTTP sandboxes.

---

## 9. Reproducibility & Provenance

- **Per-Shard Seeds**: Each repetition specifies a deterministic seed (`deterministicSeed`) for pseudo-random generators.
- **Independent Evidence Hashing**: Every shard's evidence hash is independent, allowing verification of individual runs without re-executing the entire matrix.

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Parallel Benchmark Role                                                              |
| :--------------------- | :----------------------------------------------------------------------------------- |
| **Context**            | Independent scenario context and seed assigned to shard.                             |
| **Interpretation**     | Worker evaluates task constraints in isolated container.                             |
| **Decision**           | Concurrency scheduler manages execution slot.                                        |
| **Action**             | Shards execute in parallel without cross-talk.                                       |
| **Result**             | Each shard returns individual exit codes and state diffs.                            |
| **Consequence**        | `ParallelExecutionScheduler` aggregates score variance and latency distributions.    |
| **Recovery**           | Transient rate limits or host OOM triggers automatic retry with exponential backoff. |

---

## 11. Provider-Neutral Design

Adapters for local Docker pools, Kubernetes jobs, Nomad clusters, or serverless microVM fleets consume the same `ParallelExecutionPlan`, enabling scale-out across workstations or high-performance compute clusters.

---

## 12. Failure Modes & Mitigations

1. **Host Memory Exhaustion**: Scheduler gates worker count via `maxMemoryMebibytesTotal`.
2. **External API Rate Limiting**: Managed by `rateLimitPerMinute` sliding window throttle.
3. **Partial Shard Failure**: Failed shards recorded individually with retry logs without invalidating successful shards.

---

## 13. Acceptance Criteria

- [x] Standardized `ParallelExecutionPlan` and `ParallelShardSpec` schemas.
- [x] Concurrency control avoiding worker over-allocation.
- [x] Clean statistical aggregation of parallel execution shards.
- [x] Unit test validation with zero boundary or typecheck errors.

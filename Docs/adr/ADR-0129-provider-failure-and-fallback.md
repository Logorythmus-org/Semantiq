# ADR-0129: Provider Failure, Fallback Routing, and Partial-Run Semantics

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Running evaluations across third-party cloud sandbox platforms or local container engines exposes benchmarks to transient timeouts, infrastructure outages, and daemon crashes. The architecture must distinguish between infrastructure failures and agent reasoning faults, route gracefully to backup providers, and preserve partial evidence.

---

## Decision

1. **Failure Classification**: Categorize failures into `INFRASTRUCTURE_TRANSIENT`, `INFRASTRUCTURE_FATAL`, `AGENT_BEHAVIORAL_FAULT`, `SECURITY_VIOLATION`, and `TIMEOUT_EXCEEDED` in `packages/sandbox-contracts/src/fallback.ts`.
2. **Deterministic Fallback Routing**: Implement `FallbackRoutingEngine` to orchestrate exponential backoff retries and provider failover.
3. **Partial-Run Preservation**: Guarantee that uncompleted runs generate `PartialRunEvidenceRecord` with all captured checkpoints and logs.
4. **Behavioral Integrity**: Never trigger infrastructure fallback for agent-induced errors or syntax bugs.

---

## Consequences

- Benchmark runs become resilient to cloud provider blips without masking agent errors.
- Incomplete executions retain diagnostic value through sealed partial evidence records.
- Evaluator infrastructure remains strictly provider-neutral and fault-tolerant.

# ADR-0142: Failure Injection and Chaos Engineering Architecture for AI Agent Evaluation

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Real-world deployment environments subject autonomous AI agents to unpredictable infrastructure failures: tool RPC errors, dropped connections, context loss, stale state drift, shifting requirements, and file permission revocations. Benchmarks that test only happy-path workflows fail to measure an agent's recovery competence or detect pathological retry loops.

To evaluate agent error handling, hypothesis revision, and self-healing systematically, SemantIQ requires a deterministic failure injection and chaos engineering framework.

---

## Decision

1. **7 Injected Fault Categories**: Standardize `CONTEXT_LOSS_TRUNCATION`, `TOOL_RPC_ERROR`, `NETWORK_PARTITION_LATENCY`, `STALE_STATE_DRIFT`, `CONTRADICTION_MUTATION`, `PERMISSION_REVOCATION`, and `PARTIAL_RESULT_CORRUPTION`.
2. **Deterministic Triggering & Plan Engine**: Implement `FailureInjectionEngine` to define `FailureInjectionPlan` using flexible trigger rules (`ON_STEP_INDEX`, `ON_COMMAND_REGEX`, `ON_TOOL_NAME`, `ON_FILE_PATH`, `PROBABILISTIC`) pinned to a deterministic seed.
3. **Multi-Step Recovery & MTTR Assessment**: Invariant: Evaluate behavior strictly across the canonical sequence:
   `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`
   measuring whether the agent identifies the root cause, initiates recovery actions, avoids infinite loops, and successfully resolves the task.
4. **Resilience & Mean Time to Recovery (MTTR) Scoring**: Calculate empirical fault recovery rates ($0.0 \le R \le 1.0$) and step-based MTTR metrics.
5. **Cryptographic Sealing**: Sign every failure injection report with `reportSignatureHex`.

---

## Consequences

- Evaluators can safely inject chaos and observe agent recovery strategies under controlled, reproducible conditions.
- Pathological loops and cascading failure modes are surfaced early with exact step latencies.
- Standard benchmark scenarios can be dynamically converted into chaos engineering challenges.

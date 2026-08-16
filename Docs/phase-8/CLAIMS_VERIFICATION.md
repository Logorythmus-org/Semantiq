# Claims Verification Matrix

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Empirical Verification Matrix

| Claimed Feature        | Implementation Source                              | Test Verification                            | Status   |
| ---------------------- | -------------------------------------------------- | -------------------------------------------- | -------- |
| 9-Stage Lifecycle      | `packages/semantiq/src/behavioral-contracts.ts`    | `tests/unit/behavioral-contracts.test.ts`    | VERIFIED |
| 44 Canonical Verbs     | `packages/semantiq/src/verb-taxonomy.ts`           | `tests/unit/verb-taxonomy.test.ts`           | VERIFIED |
| Default Deny & Drift   | `packages/semantiq/src/environment-permissions.ts` | `tests/unit/environment-permissions.test.ts` | VERIFIED |
| 19 Event Types & DAG   | `packages/semantiq/src/event-schema.ts`            | `tests/unit/event-schema.test.ts`            | VERIFIED |
| Graph & Dry Replay     | `packages/semantiq/src/execution-graph.ts`         | `tests/unit/execution-graph.test.ts`         | VERIFIED |
| Mission & Containment  | `packages/semantiq/src/mission-boundary.ts`        | `tests/unit/mission-boundary.test.ts`        | VERIFIED |
| Consequence & Recovery | `packages/semantiq/src/consequence-recovery.ts`    | `tests/unit/consequence-recovery.test.ts`    | VERIFIED |
| 12 Synthetic Scenarios | `packages/semantiq/src/scenario-pack.ts`           | `tests/unit/scenario-pack.test.ts`           | VERIFIED |

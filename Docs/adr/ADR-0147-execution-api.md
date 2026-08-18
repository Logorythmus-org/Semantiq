# ADR-0147: SemantIQ Public Execution API Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Running sandbox-backed agent benchmarks requires a unified, secure, and provider-neutral public API. Evaluators, automated CI pipelines, and benchmark harnesses need standardized endpoints to create runs, validate execution requests, initiate container/microVM sandbox lifecycles, stream live behavioral observations, gracefully cancel timeouts, trigger deterministic replays, and retrieve signed evidence packages and receipts.

To provide a consistent, production-grade interface for all execution providers, SemantIQ requires a canonical Execution API.

---

## Decision

1. **Canonical Lifecycle States**: Standardize `RunStatus` state transitions: `PENDING` $\to$ `VALIDATING` $\to$ `PROVISIONING` $\to$ `RUNNING` $\to$ (`PAUSED`) $\to$ `COMPLETED` / `FAILED` / `CANCELLED` $\to$ `CLEANED_UP`.
2. **Standardized API Operations**: Implement `ExecutionAPIService` defining 7 core lifecycle methods:
   - `createRun(request)`
   - `validateRun(runId)`
   - `startRun(runId)`
   - `observeRun(runId)`
   - `cancelRun(runId, reason)`
   - `replayRun(request)`
   - `completeRun(runId, costEstimateUsd)`
3. **Immutable Provenance Sealing**: Every `RunRecord` computes a deterministic SHA-256 `provenanceHash` over canonical JSON.
4. **Deterministic Replay Guarantee**: `replayRun` preserves parent scenario configuration, binds to `sourceRunId`, and re-executes with recorded seed parameters for bitwise behavioral reproducibility.
5. **Provider Neutrality & Pluggability**: The API routes execution requests across any registered provider (Docker, Podman, Firecracker, Fly.io, Modal) without embedding runtime logic into SemantIQ Core.
6. **Observable Behavioral Grounding**: Invariant: All telemetry streams emit observable `BehavioralTraceEvent` records across the canonical chain without speculative claims on internal cognition.

---

## Consequences

- Third-party benchmarks, CLI tools, and web dashboards can interact with SemantIQ via a standardized API.
- Replay debugging allows researchers to inspect failing long-horizon steps with deterministic repeatability.
- Run records maintain full cryptographic provenance and cost accounting.

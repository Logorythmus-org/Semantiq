# SemantIQ Sandbox Specification: Public Execution API Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 47)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

Running sandbox-backed agent benchmarks requires a unified, secure, and provider-neutral public API. Evaluators, automated CI pipelines, and benchmark harnesses need standardized endpoints to create runs, validate execution requests, initiate container/microVM sandbox lifecycles, stream live behavioral observations, gracefully cancel timeouts, trigger deterministic replays, and retrieve signed evidence packages and receipts.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **Public SemantIQ Execution API Architecture**:
1. **Canonical Lifecycle & State Machine**: Standardizes 9 lifecycle states ([`RunStatus`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L10-L19)): `PENDING`, `VALIDATING`, `PROVISIONING`, `RUNNING`, `PAUSED`, `COMPLETED`, `FAILED`, `CANCELLED`, and `CLEANED_UP`.
2. **Standardized API Service**: Implements [`ExecutionAPIService`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L55-L175) providing high-level operations for run creation ([`createRun`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L59-L81)), pre-flight validation ([`validateRun`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L83-L94)), lifecycle initiation ([`startRun`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L96-L109)), live telemetry streaming ([`observeRun`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L118-L124)), graceful cancellation ([`cancelRun`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L126-L140)), and deterministic replay ([`replayRun`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L142-L170)).
3. **Immutable Provenance Sealing**: Every [`RunRecord`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L35-L48) computes a deterministic SHA-256 `provenanceHash` over canonical JSON.
4. **Deterministic Replay Guarantee**: `replayRun` preserves parent scenario configuration, binds to `sourceRunId`, and re-executes with recorded seed parameters for bitwise behavioral reproducibility.
5. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Public SemantIQ Execution API                                |
|  [REST / gRPC / SDK] ──> [createRun | validateRun | startRun | observeRun | replayRun]      |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    Execution API Service                                    |
|  • Manages Run Records, State Transitions, and Lifecycle Validation                         |
|  • Routes Requests to Provider Router & Adapters (Docker, Podman, Firecracker, Fly.io)      |
|  • Records Behavioral Trace Events with Merkle Integrity Verification                       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 Completed Evaluation Bundle                                 |
|  • Verifiable Benchmark Execution Receipt                                                   |
|  • Portable Evidence Package (7-Stage Behavioral Chain)                                     |
|  • Resilience & Awareness Scorecards (RRI, CAI, LHRI)                                        |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification synthesizes and exposes the capabilities established across the Sandbox Phase:
- **Prompt 31–36**: Multi-provider model, canonical registry, marketplace discovery, and attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle sequence continuity.
- **Prompt 40–42**: Transition laboratory, semantic stress environments, and chaos injection.
- **Prompt 43–45**: Recovery resilience scorecards, consequence testing, and long-horizon multi-phase milestones.
- **Prompt 46**: Sandbox Benchmark DSL compiler and scenario manifests.

---

## 3. Scope and Non-Goals

### 3.1 In Scope
- **Public API Interfaces & Types**: Defining [`CreateRunRequest`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L21-L28), [`ReplayRunRequest`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L30-L35), [`RunRecord`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L37-L50), and JSON Schema [`execution-api-run-record.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/execution-api-run-record.schema.json).
- **Execution Lifecycle Service**: Implementation of [`ExecutionAPIService`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts#L55-L175).
- **Live Stream Observation & Event Ingestion**: Ingesting [`BehavioralTraceEvent`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/evidence-package.ts#L22-L31) records.
- **Deterministic Replay Orchestration**: Re-running executions with identical seeds and source linkage.

### 3.2 Non-Goals
- **No Proprietary Runtime Hosting**: SemantIQ executes via external pluggable providers.
- **No Claims on Hidden Cognition**: API telemetry exposes observable events without assuming internal model thought tokens.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Execution API Surface, State Machine, and Schemas (ExecutionAPIService)                  |
|  • Provenance Digest Computation & Replay Seed Linkage                                      |
|  • Merkle Tree Verification over Emitted Behavioral Trace Streams                           |
|  • Bundling Evidence Packages, Execution Receipts, and Scorecards                           |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Provisioning & Teardown of Physical Container / MicroVM Environments                     |
|  • Emitting Raw Terminal and RPC Telemetry to the Event Ingestion Pipeline                  |
|  • Enforcing Process Timeouts, Memory Limits, and Egress Network Firewall Rules             |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces & API Operations

### 5.1 TypeScript API Definitions ([`packages/sandbox-contracts/src/execution-api.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts))

```typescript
export type RunStatus =
  | 'PENDING'
  | 'VALIDATING'
  | 'PROVISIONING'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'CLEANED_UP';

export interface CreateRunRequest {
  readonly scenarioId: string;
  readonly dslDocument?: SandboxBenchmarkDSL;
  readonly agentId: string;
  readonly targetProviderId?: string;
  readonly deterministicSeed?: string;
  readonly tags?: readonly string[];
}

export interface ReplayRunRequest {
  readonly sourceRunId: string;
  readonly overrideSeed?: string;
  readonly targetProviderId?: string;
  readonly stepBreakpoints?: readonly number[];
}

export interface RunRecord {
  readonly runId: string;
  readonly scenarioId: string;
  readonly agentId: string;
  readonly providerId: string;
  readonly status: RunStatus;
  readonly createdAt: string;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly cancellationReason?: string;
  readonly errorDetails?: string;
  readonly costEstimateUsd?: number;
  readonly provenanceHash: string;
  readonly isReplay: boolean;
  readonly sourceRunId?: string;
}
```

### 5.2 Core API Endpoints

| HTTP Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/runs` | Creates a new benchmark run (`createRun`) |
| `POST` | `/api/v1/runs/:runId/validate` | Validates run prerequisites and quotas (`validateRun`) |
| `POST` | `/api/v1/runs/:runId/start` | Initiates execution in sandbox environment (`startRun`) |
| `GET` | `/api/v1/runs/:runId/events` | Live Server-Sent Events (SSE) telemetry stream (`observeRun`) |
| `POST` | `/api/v1/runs/:runId/cancel` | Gracefully terminates active execution (`cancelRun`) |
| `POST` | `/api/v1/runs/:runId/replay` | Triggers deterministic replay linked to source (`replayRun`) |
| `GET` | `/api/v1/runs/:runId` | Retrieves complete run record, receipts, and scorecards |

---

## 6. Schemas & Versioning

- **[`schemas/execution-api-run-record.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/execution-api-run-record.schema.json)**: Formal Draft 2020-12 JSON Schema validating `RunRecord` properties and status enum values.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `runRecordSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`). API endpoints follow URL prefix `/api/v1/`.

---

## 7. Lifecycle State Machine

```
      +─────────+
      | PENDING |
      +────┬────+
           │ validateRun()
           ▼
    +────────────+
    | VALIDATING |
    +────┬───────+
         │ Passed
         ▼
  +──────────────+
  | PROVISIONING |
  +────┬─────────+
       │ startRun()
       ▼
    +─────────+        pause()         +────────+
    | RUNNING | ─────────────────────> | PAUSED |
    +────┬────+ <───────────────────── +────────+
         │             resume()
         ├───────────────────────────────┬───────────────────────────────┐
         │ (Done)                        │ (Error)                       │ (Cancel)
         ▼                               ▼                               ▼
  +───────────+                     +────────+                     +───────────+
  | COMPLETED |                     | FAILED |                     | CANCELLED |
  +─────┬─────+                     +───┬────+                     +─────┬─────+
        │                               │                                │
        └───────────────────────────────┼────────────────────────────────┘
                                        ▼
                                 +────────────+
                                 | CLEANED_UP |
                                 +────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Unforgeable Provenance Hashes**: Every `RunRecord` contains a `provenanceHash` computed over canonical JSON fields.
2. **Quota & Rate-Limiting Enclosure**: Execution creation enforces budget checks against caller allocations before provisioning sandbox containers.
3. **Redaction of Ephemeral Secrets**: Terminal output streams and payloads are filtered against secret scanners before telemetry emission.

---

## 9. Provider Compatibility

| Execution Provider | API Provisioning Latency | Live Stream Support | Replay Support |
| :--- | :--- | :--- | :--- |
| **Docker (Local)** | < 500ms | Stdout / Stderr Pipe | Native Local Volumes |
| **Podman / Rootless** | < 800ms | Rootless IPC Streaming | Rootless Volume Snapshots |
| **Firecracker / MicroVM** | < 1200ms | VSOCK Serial Streaming | Snapshot Rootfs Image |
| **Fly.io / Modal / E2B** | 1000 - 3000ms | WebSockets / SSE | Ephemeral Remote Volume |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **Sandbox Hang** | Agent enters infinite blocking loop | Wall-clock timeout | API issues `cancelRun` after timeout; captures partial trace |
| **Provider Crash** | Host daemon OOM during execution | Abrupt disconnect | Marks run as `FAILED`; attempts fallback provider if allowed |
| **Telemetry Drop** | Event buffer overflow during high load | Missing events | Sequence numbers detect gap; flags trace discontinuity |
| **Replay Drift** | Unseeded nondeterministic network read | Divergent trace | Engine tags run as `VARIANCE_DETECTED` in report |

---

## 11. Testing Strategy & Verification

The Execution API architecture is validated through automated test suites:
1. **API Lifecycle & Service Unit Tests ([`tests/unit/execution-api.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/execution-api.test.ts))**:
   - Validates run creation, provenance hash computation, validation, and transition to `RUNNING`.
   - Tests event recording and live observation streaming.
   - Tests graceful cancellation with audit timestamps.
   - Tests deterministic replay run creation with source linkage.
   - Tests run completion and cost accounting.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `runRecordSchema`.

---

## 12. Acceptance Criteria

- [x] Execution API contracts define 9 lifecycle states, create/replay requests, and run records.
- [x] `ExecutionAPIService` implements create, validate, start, observe, cancel, replay, and complete operations.
- [x] Deterministic replay links replay runs to their source runs with identical parameter bindings.
- [x] Provenance hashes guarantee run immutability and verifiable auditing.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Synchronous Execution vs. Async Event Polling**: Streaming large trace logs can saturate network bandwidth.  
  *Mitigation*: Support Chunked Merkle batch transfers alongside SSE for low-latency observation.
- **Open Question**: Multi-region run federation where benchmark execution is dynamically migrated across cloud zones.

---

## 14. Architecture Decision Record

### [ADR-0147: SemantIQ Public Execution API Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0147-execution-api.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Standardize `RunStatus` state transitions, implement `ExecutionAPIService`, provide deterministic replay orchestration, and seal execution provenance with SHA-256 digests.
- **Consequences**: Enables any evaluator, CLI, or CI/CD workflow to orchestrate sandbox-backed benchmark runs across pluggable execution providers reliably and reproducibly.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Execution API Service**: [`packages/sandbox-contracts/src/execution-api.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/execution-api.ts)
2. **Schema Definition**: [`schemas/execution-api-run-record.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/execution-api-run-record.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/execution-api.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/execution-api.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/EXECUTION_API_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/EXECUTION_API_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0147-execution-api.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0147-execution-api.md)

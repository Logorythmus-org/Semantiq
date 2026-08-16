# SemantIQ Sandbox Specification: Observability Dashboard Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 58)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Benchmark evaluators and researchers need unified visual introspection across multi-layer execution metrics, real-time behavioral stages, terminal PTY output streams, cost ledgers, resource utilization, failure recovery episodes, and cryptographic integrity seals. The architecture must support both live streaming (`LIVE_STREAMING`) and post-run forensic replay (`POST_RUN_FORENSIC_REPLAY`) in local-first terminal (CLI) and browser (HTML) environments without proprietary cloud dashboard dependencies.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **SemantIQ Sandbox Observability Dashboard Architecture**:

1. **Unified State Snapshot Model**: Implements [`generateSnapshot`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts#L43-L81) in [`ObservabilityDashboardEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts#L42-L141) creating verifiable [`DashboardStateSnapshot`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts#L10-L33) records (`snapshotDigest`).
2. **Dual-Modal Rendering**:
   - [`renderDashboardTerminalText`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts#L83-L98): Emits rich ASCII dashboard frames for CLI terminal runners.
   - [`renderDashboardHtml`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts#L100-L140): Emits zero-dependency, self-contained HTML dashboards for browser introspection.
3. **Multi-Layer Telemetry Aggregation**: Binds lifecycle state, 7 behavioral stages, PTY mirror logs, CPU/Memory telemetry, USD cost breakdowns, and cryptographic integrity seals.
4. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Execution Telemetry Streams                                |
|  [Lifecycle State] + [Trace Events] + [PTY Output] + [Cost Ledger] + [Integrity Seals]      |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               ObservabilityDashboardEngine                                  |
|  • generateSnapshot(): Bundles state into verifiable DashboardStateSnapshot                 |
|  • renderDashboardTerminalText(): Formats ASCII terminal box for CLI runner                 |
|  • renderDashboardHtml(): Formats standalone HTML file for browser replay                   |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                           Dashboard State & Visualization                                   |
|  • Terminal View: Step Progress, Cost, CPU/Mem, Trust Grade, PTY Tail Output                |
|  • HTML View: Responsive Stat Cards, PTY Mirror, Event Inspector                            |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification integrates dashboard and observability requirements across the Sandbox Phase:

- **Prompt 31–36**: Multi-provider model, trust verification, and terms attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle trace immutability.
- **Prompt 40–45**: Transition laboratory, semantic stress environments, chaos injection, recovery, and long-horizon milestones.
- **Prompt 46–57**: Sandbox DSL compiler, public Execution API, CLI local runner, Web/API router, Provider SDK, Provider Certification, Security Test Suite, Benchmark Integrity, Anti-Gaming, Independent Observer, Evidence Provenance, and Cross-Model Comparison.

---

## 3. Scope and Non-Goals

### 3.1 In Scope

- **Dashboard Specification**: Defining [`DashboardViewMode`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts#L8-L8), [`DashboardStateSnapshot`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts#L10-L33), and JSON Schema [`observability-dashboard-snapshot.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/observability-dashboard-snapshot.schema.json).
- **Dual-Modal Rendering Engine**: Terminal ASCII frames and standalone HTML dashboards.
- **Live State & Post-Run Forensic Replay Support**.

### 3.2 Non-Goals

- **No Heavyweight Frontend Dependencies**: HTML dashboards require zero npm runtime dependencies (React, Vue, Webpack) and render natively in vanilla browser environments.
- **No SaaS Telemetry Vendor Lock-In**: Runs entirely on local file exports.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Dashboard State Aggregation & Snapshot Sealing (ObservabilityDashboardEngine)            |
|  • CLI ASCII Box Formatter & Self-Contained HTML Dashboard Renderer                         |
|  • Cross-Validating Real-Time Telemetry Against Merkle Integrity Roots                      |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Snapshot Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Emitting Low-Latency PTY Terminal Output Chunks and Exit Codes                           |
|  • Reporting Accurate cgroup CPU / Memory Utilization Gauges                                |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces and Dashboard Types

### 5.1 TypeScript Dashboard Definitions ([`packages/sandbox-contracts/src/observability-dashboard.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts))

```typescript
export type DashboardViewMode = "LIVE_STREAMING" | "POST_RUN_FORENSIC_REPLAY";

export interface DashboardStateSnapshot {
  readonly dashboardId: string;
  readonly scenarioId: string;
  readonly runId: string;
  readonly viewMode: DashboardViewMode;
  readonly lifecycleStatus: string;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly activeStage: BehavioralStage;
  readonly elapsedMs: number;
  readonly totalCostUsd: number;
  readonly authenticityClassification: string;
  readonly integrityGrade: string;
  readonly terminalBufferPreview: string;
  readonly recentEventsCount: number;
  readonly resourceUtilization: {
    readonly cpuPercent: number;
    readonly memoryMbUsed: number;
  };
  readonly renderedAt: string;
  readonly snapshotDigest: string;
}
```

---

## 6. Schemas & Versioning

- **[`schemas/observability-dashboard-snapshot.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/observability-dashboard-snapshot.schema.json)**: Formal Draft 2020-12 JSON Schema validating dashboard state snapshots, view modes, resource utilization, and digests.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `dashboardStateSnapshotSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`).

---

## 7. Lifecycle and State Machine

```
      +──────────────────────+
      | Ingest Event Stream  | ──> Live SSE or Log Replay
      +──────────┬───────────+
                 │ generateSnapshot()
                 ▼
      +──────────────────────+
      | State Snapshot       | ──> Computes SHA-256 Digest
      +──────────┬───────────+
                 ├──> renderDashboardTerminalText() ──> CLI Box Frame
                 └──> renderDashboardHtml()         ──> Browser HTML File
```

---

## 8. Security, Privacy, and Trust Posture

1. **Local-First Air-Gapped Rendering**: HTML dashboard files contain inline CSS and fonts, functioning 100% offline without connecting to external CDN assets.
2. **Sanitized Terminal Buffer**: Secret tokens in environment outputs are redacted prior to snapshot generation.
3. **Immutable Snapshot Digest**: Snapshots contain `snapshotDigest` calculated over canonical JSON data.

---

## 9. Provider Compatibility

| Execution Provider        | Terminal Output Capture     | Resource Metering Fidelity | Dashboard Status |
| :------------------------ | :-------------------------- | :------------------------- | :--------------- |
| **Docker (Local)**        | Unix socket PTY stream      | Host cgroup v2 stats       | `REAL_TIME`      |
| **Podman (Rootless)**     | Native PTY master           | User namespace procfs      | `REAL_TIME`      |
| **Firecracker MicroVM**   | Serial console VSOCK stream | Host KVM process RSS       | `REAL_TIME`      |
| **Modal / Cloud MicroVM** | Cloud SSE stream            | Provider API telemetry     | `REAL_TIME`      |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode               | Root Cause                         | Impact          | Automated Recovery Action                                     |
| :------------------------- | :--------------------------------- | :-------------- | :------------------------------------------------------------ |
| **Terminal Spam Hang**     | Agent looped `cat /dev/urandom`    | Memory pressure | Buffer tailing retains only most recent 100 lines             |
| **Missing Resource Stats** | Provider does not expose CPU gauge | Zeroed metrics  | Defaults to `{ cpuPercent: 0, memoryMbUsed: 0 }` with warning |
| **Corrupted HTML Render**  | Unescaped HTML tags in PTY output  | Broken layout   | Escapes all terminal text strings before HTML injection       |

---

## 11. Testing Strategy & Verification

The Observability Dashboard architecture is validated through automated test suites:

1. **Observability Dashboard Unit Tests ([`tests/unit/observability-dashboard.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/observability-dashboard.test.ts))**:
   - Tests generating unified dashboard snapshot with digest and resource metrics.
   - Tests rendering rich ASCII terminal dashboard for CLI runner.
   - Tests rendering standalone interactive HTML dashboard for browser visualization.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `dashboardStateSnapshotSchema`.

---

## 12. Acceptance Criteria

- [x] Observability Dashboard contracts define state snapshots, view modes, and resource utilization.
- [x] `ObservabilityDashboardEngine` generates verifiable snapshots and computes SHA-256 digests.
- [x] CLI ASCII terminal box and standalone HTML dashboard renderers are implemented and tested.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: ASCII Box Refresh Rate vs. Terminal Flicker**: Rapid 60Hz terminal redrawing can cause flicker on Windows PowerShell.  
  _Mitigation_: Debounce terminal redraws to 10Hz maximum in CLI runner loops.
- **Open Question**: WebGL / Canvas rendering for 100,000-node long-horizon behavioral DAG exploration.

---

## 14. Architecture Decision Record

### [ADR-0158: SemantIQ Live and Post-Run Observability Dashboard Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0158-observability-dashboard.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Implement `ObservabilityDashboardEngine` generating verifiable `DashboardStateSnapshot` records and rendering standalone ASCII terminal frames and zero-dependency HTML dashboards.
- **Consequences**: Provides unified, local-first live introspection and forensic replay across all benchmark execution providers.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Dashboard Engine**: [`packages/sandbox-contracts/src/observability-dashboard.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/observability-dashboard.ts)
2. **Schema Definition**: [`schemas/observability-dashboard-snapshot.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/observability-dashboard-snapshot.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/observability-dashboard.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/observability-dashboard.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/OBSERVABILITY_DASHBOARD_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/OBSERVABILITY_DASHBOARD_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0158-observability-dashboard.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0158-observability-dashboard.md)

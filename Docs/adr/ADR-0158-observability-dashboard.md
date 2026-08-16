# ADR-0158: SemantIQ Live and Post-Run Observability Dashboard Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

Benchmark evaluators and researchers need unified visual introspection across multi-layer execution metrics, real-time behavioral stages, terminal PTY output streams, cost ledgers, resource utilization, failure recovery episodes, and cryptographic integrity seals. The architecture must support both live streaming (`LIVE_STREAMING`) and post-run forensic replay (`POST_RUN_FORENSIC_REPLAY`) in local-first terminal (CLI) and browser (HTML) environments without proprietary cloud dashboard dependencies.

---

## Decision

1. **Unified Dashboard State Snapshot**:
   - `DashboardStateSnapshot`: Bundles scenario ID, run ID, view mode, lifecycle status, step progress, active behavioral stage, cost, authenticity classification ($GAI$), integrity grade, PTY mirror preview, and CPU/memory stats into a verifiable JSON snapshot (`snapshotDigest`).
2. **Multi-Modal Rendering Engine**:
   - `ObservabilityDashboardEngine`:
     - `renderDashboardTerminalText`: Emits rich ASCII dashboard frames for CLI terminal streams.
     - `renderDashboardHtml`: Emits self-contained, zero-dependency HTML dashboard files for local and web browser introspection.
3. **Observable Behavioral Grounding**: Invariant: Dashboard visualizes the 7-stage chain (`Context → Interpretation → Decision → Action → Result → Consequence → Recovery`) using external physical traces and exit codes without claiming access to internal hidden cognition.

---

## Consequences

- Real-time and post-run transparency across all benchmark execution providers.
- Fully operational in offline, local-first environments with zero external network calls.
- Provides immediate visual feedback during long-horizon agent runs and chaos injections.

# SemantIQ Architecture: Behavioral Evidence Infrastructure

## Overview

**SemantIQ is Behavioral Evidence Infrastructure for AI Systems.**

SemantIQ establishes a rigorous, verifiable bridge between raw AI benchmark executions and scientific knowledge governance. Rather than treating benchmark scores as ground truth, SemantIQ models evaluation as an empirical observation pipeline that enforces strict epistemic separation between what is directly observed, what is statistically contrasted under matched controls, and what is governed as an admissible scientific claim.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           SEMANTIQ PLATFORM                                            │
│                                                                                                        │
│  ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐            │
│  │    BENCHMARK ENGINE    │ ───► │    EVIDENCE ENGINE     │ ───► │   RESEARCH WORKBENCH   │            │
│  │                        │      │                        │      │                        │            │
│  │ • Pluggable Providers  │      │ • Observation Normal.  │      │ • Governed Claims      │            │
│  │ • State-Chained Traces │      │ • Evidence Graph       │      │ • Controlled Language  │            │
│  │ • Latency & Metrics    │      │ • 7D Matched Contrast  │      │ • Two-Party Reviews    │            │
│  │ • Modular Test Suites  │      │ • Robustness & TVD     │      │ • Release Gate         │            │
│  │   (SMF, HACS, Vision)  │      │ • Specification Curve  │      │ • Research Bundles     │            │
│  │                        │      │ • Decision Policy      │      │ • Study Protocols      │            │
│  │                        │      │                        │      │ • Execution Manifests  │            │
│  │                        │      │                        │      │ • Eligibility Gate     │            │
│  │                        │      │                        │      │ • Replication Registry │            │
│  └────────────────────────┘      └────────────────────────┘      └────────────────────────┘            │
│                                                                                                        │
│  ────────────────────────────────────────────────────────────────────────────────────────────────────  │
│  HEADLESS ACCESS INTERFACES:                                                                           │
│  • Python Public API (`semantiq`)         • TypeScript SDK (`@semantiq/sdk`)                           │
│  • Unified CLI (`semantiq`)               • Headless HTTP API (`/api/v1/...`)                          │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## The Three Core Subsystems

### 1. Benchmark Engine

The **Benchmark Engine** is responsible for orchestrating, executing, and capturing verifiable telemetry from agentic and model interactions:

- **Provider-Neutral Execution**: Interacts with local OCI containers, Podman, MicroVMs, or external endpoints via standardized provider interfaces (`ExecutionProvider`).
- **Cryptographic Trace Sealing**: Records sequential interactions into `Trace` and `TraceEvent` structures. Each event carries an immutable SHA-256 state digest chaining back to initial system prompts.
- **Benchmark Suite Families**: Houses modular test suites:
  - **SMF (Semantic Model Foundry)**: Semantic reasoning, tool utilization, and error boundary tests.
  - **HACS (Host Agent Context Suite)**: Long-horizon multi-turn task retention, out-of-band monitoring, and drift resistance evaluations.
  - **Vision / Multimodal**: Visual reasoning, spatial grounding, and perception robustness batteries.

### 2. Evidence Engine

The **Evidence Engine** transforms raw trace data into normalized scientific evidence and statistical contrasts:

- **Empirical Observation Normalization**: Translates raw anomalies into structured `EvidenceObservation` objects. Enforces epistemic classification (`OBSERVED` vs `INFERRED`).
- **Evidence Graph**: Directed knowledge graph representing design patterns (e.g. `DP-008` Out-of-Band Observer), failure patterns (e.g. `FP-002` Context Drift), and their empirical relationship edges (`SUPPORTS`, `REFUTES`, `MITIGATES`).
- **7-Dimensional Matched Statistical Contrast**:
  Matches runs across 7 covariate dimensions:
  1. `environment` (platform, isolation, OS)
  2. `model` (family, version, temperature)
  3. `population` (topology, agent count)
  4. `tools` (tool count, guardrails)
  5. `memory` (context window, partitioning)
  6. `resource_pressure` (token budget, max steps)
  7. `horizon` (short, medium, long)
  Computes nonparametric 1,000-resample Bootstrap Confidence Intervals and Exact Sign Tests.
- **Robustness Diagnostics**:
  - Total Variation Distance ($TVD \le 0.05$) to verify post-match covariate balance.
  - Negative control placebos to verify that unexposed variables exhibit zero delta.
  - Perturbation tests to measure sensitivity to covariate drops.
- **Specification Curve Analysis**: Exhaustively evaluates all specification sub-combinations to measure directional stability ($directionStabilityRatio = 1.0$).
- **Evidence Decision Policy**: Deterministic policy evaluating statistical grades and robustness into governance verdicts (`promote`, `hold`, `downgrade`, `insufficient`).

### 3. Research Workbench

The **Research Workbench** manages the full lifecycle of scientific claims, pre-registrations, and replication exchange:

- **Governed Claim Registry**: Immutable registry tracking claims through lifecycle stages (`draft` $\to$ `in_review` $\to$ `active` $\to$ `superseded` $\to$ `retracted`).
- **Controlled Language Rules**: Regex-enforced linguistic guardrails that reject unhedged causal terms (`causes`, `proves`, `guarantees`, `eliminates`, `causal proof`).
- **Two-Party Review & Release Gate**: Requires $\ge 2$ independent reviewer approvals and 0 rejections before transitioning claims to `active`.
- **Reproducible Research Bundles**: Packages claims, datasets, config fingerprints, and contrast reports into Merkle-tree verified bundles (`ResearchBundleManifest`).
- **Study Protocol Pre-registration**: Generates deterministic study protocols with frozen pre-registration fingerprints (`freezeProtocol`) and hash-chained deviation tracking.
- **Protocol-Aware Execution Manifests**: Ingests external partner results, validating adherence against pre-registered parameters.
- **External Evidence Eligibility Gate**: Evaluates submissions across 7 criteria (`eligible`, `eligible_with_caveats`, `quarantined`, `rejected`) before permitting evidence to affect aggregate registries.
- **Partner Replication Registry**: Aggregates multi-organizational replications while preserving full counterevidence visibility and enforcing genuine context diversity ($\ge 2$ independent orgs, diversity $\ge 0.70$) for E4 promotion.

---

## UI-Independent Headless Architecture

SemantIQ is explicitly designed as a **headless infrastructure layer**. It does not require a browser, UI framework, or graphical environment:

- **Pure TypeScript / Node.js & Python Domain**: All domain services, statistical algorithms, cryptographic sealers, and registries run in headless server environments.
- **HTTP REST API**: Exposes all platform capabilities via standard JSON REST endpoints (`/health`, `/info`, `/api/v1/patterns`, `/api/v1/claims`, `/api/v1/reviews`, `/api/v1/studies`, `/api/v1/bundles`).
- **SDK Parity**: TypeScript and Python SDKs provide direct programmatic access to all application service workflows with type safety.
- **Optional Static UI Serving**: The HTTP API server supports optional static asset serving if a frontend bundle is supplied, but operates fully without one.

---

## Package Structure & Monorepo Boundaries

```
packages/
├── sandbox-contracts/       # Immutable JSON schemas, DTOs, enums & crypto utilities
├── benchmark/               # Execution runners, test suites, provider interfaces
├── adapters/                # Trace & benchmark artifact ingestion adapters
├── evidence/                # Contrast engine, robustness, graph, claims & gate
├── research/                # Research bundle builders, verifiers, replication
├── sdk/                     # Official TypeScript SDK (@semantiq/sdk)
├── semantiq/                # Core application services, CLI, and HTTP router
└── python/                  # Official Python SDK & public API (semantiq)
```

### Architectural Dependency Invariant

- **Strict Upward Layering**: Domain packages (`core`, `evidence`, `benchmark`, `sandbox-contracts`) NEVER import from application services (`packages/semantiq/src/services/`).
- **Application Services Encapsulation**: High-level application logic resides in `SemantiqApplicationService`, orchestrated by the CLI, HTTP Router, and SDK clients.

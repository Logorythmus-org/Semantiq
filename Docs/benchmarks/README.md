# Benchmark Engine & Modular Test Batteries

**Status**: `NORMATIVE`  
**Target Audience**: Benchmark Creators, Model Evaluators

---

## Overview

The Benchmark Engine executes autonomous agent scenarios, parses heterogeneous execution logs via
canonical adapters, and generates reproducible trace events.

Benchmark names and example fixtures do not by themselves establish implementation maturity,
internal qualification, external reproduction, or leaderboard eligibility. Public benchmark status
is governed by the
[Benchmark Lifecycle & Public Status Policy](BENCHMARK_LIFECYCLE.md).

---

## Current Public Benchmark Index

| Benchmark family | Lifecycle state | Current evidence boundary |
| :--- | :--- | :--- |
| **SMF Benchmark Suite** | **BM0 — Research Candidate** | A synthetic representative fixture exists, but the previous public link pointed to a Production MVP integration specification rather than a canonical SMF benchmark specification. The SMF namespace/specification remains under reconciliation; no BM1+ claim is made. |
| **HACS Long-Horizon Suite** | **BM2 — Implemented** | Long-horizon contracts, `LongHorizonTestingEngine`, and automated unit coverage are present. This does not establish current BM3 qualification, external reproduction, or leaderboard eligibility. |
| **Multimodal Vision Suite** | **BM0 — Research Candidate (Historical)** | A synthetic representative fixture exists, but the suite remains historical and no current canonical Vision benchmark specification is established. |

Representative fixtures under `fixtures/benchmarks/` are deterministic/mock repository artifacts.
A fixture field such as `lifecycleStage: "completed"` describes that recorded example run; it must
not be read as BM3, BM4, or BM5 status for the benchmark family.

---

## Documents in This Section

- 🧪 **[Benchmark Engine Specification](../../specs/010-semantiq-benchmark-engine.md)**
  (`NORMATIVE`): core benchmark architecture and generic evaluation contracts. It is an engine
  specification, not a benchmark-family maturity claim.
- 🛡️ **[Anti-Gaming & Integrity Protocols](../../benchmark-integrity/ANTI_GAMING_PROTOCOL.md)**
  (`NORMATIVE`): dynamic evaluation and anti-contamination rules.
- 📏 **[Benchmark Lifecycle & Public Status Policy](BENCHMARK_LIFECYCLE.md)**
  (`NORMATIVE`): BM0–BM5 lifecycle, promotion rules, and current public-index classifications.
- ⏳ **[Long-Horizon Agent Testing Specification](../sandbox/LONG_HORIZON_AGENT_TESTING_SPEC.md)**
  (`REVIEWED`): specification associated with the currently implemented long-horizon evaluation
  architecture.
- 👁️ **[Adapter Guide](../ADAPTER_GUIDE.md)**: current integration/adaptation boundaries. It must
  not be used as a substitute for a canonical benchmark-family specification.

## Truth Boundary

SemantIQ remains `0.1.0-alpha.2`, Public Alpha (Experimental). Independent scientific replication,
production-scale reliability, and general leaderboard validity remain unestablished unless a
separate reviewed evidence record explicitly establishes them.

Historical research inventories may be proposed into this lifecycle, but they must enter as BM0
unless current repository evidence supports a higher state.

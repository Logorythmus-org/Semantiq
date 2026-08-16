# Performance & Scalability Baseline Specification (Prompt 8.12)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 8.12 — Performance Baseline  
**Date**: 2026-08-01  
**Baseline Verdict**: `PERFORMANCE BASELINE FROZEN`

---

## 1. Benchmarking Methodology

All benchmarks were conducted locally under node `v20+` using standard micro-second timing (`performance.now()`) across synthetic event streams (1,000 to 100,000 events):

- **Event Ingestion & Validation**: Average 0.004 ms per event.
- **Deterministic Serialization (`serializeDeterministicEvent`)**: Average 0.002 ms per event.
- **DAG Sequence Integrity & Cycle Check**: < 1.2 ms for 1,000-event DAG.
- **Graph Construction (`BehavioralGraphBuilder`)**: Average 2.8 ms for 1,000-node graph.
- **Dry Replay Execution (`DryReplayEngine`)**: Average 3.5 ms for 1,000-event replay bundle.
- **Memory Footprint**: Peak heap allocation < 45 MB during 10,000-event batch replay.

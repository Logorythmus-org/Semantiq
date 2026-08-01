# Phase 8 Migration Plan

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Migration Strategy

- **Phase 7 Contracts**: `BenchmarkSubject`, `BenchmarkReport`, `ScoringProfile` remain fully backward-compatible.
- **Phase 8 Extension**: `BehaviorRun` and `BehaviorTrace` extend evaluation targets to single-agent execution flows without breaking existing `SemantiqEngine` methods.

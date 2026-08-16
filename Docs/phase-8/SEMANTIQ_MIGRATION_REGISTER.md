# SemantIQ Contract Migration Register

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Migration Register for Behavioral Evaluation

| Existing Contract | Extended Contract (Phase 8) | Backward Compatibility Strategy |
|---|---|---|
| `BenchmarkSubject` | `BehaviorRun` / `BehaviorTrace` | Extend `subjectKind` to include `"agent-behavior-trace"` |
| `DimensionScore` | `BehaviorEvent` Score Mapping | Map behavioral step results to dimension scores |
| `ScoringProfile` | `BehaviorProfile` | Add behavioral verb weights to evaluation profile |

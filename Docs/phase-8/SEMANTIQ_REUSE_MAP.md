# SemantIQ Contract Reuse Map

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Reusable Interface Mapping

1. **`SemantiqEngine`** (`packages/semantiq/src/contracts.ts`):
   - Reusable methods: `evaluate()`, `compare()`, `getHistory()`, `recommend()`, `explain()`, `exportReport()`.
2. **`ScoringProfile`** (`packages/semantiq/src/contracts.ts`):
   - Reusable profile structure for dimension weighting (`weights`, `id`, `version`).
3. **`BenchmarkReport`** (`packages/semantiq/src/contracts.ts`):
   - Reusable output format containing `executiveSummary`, `scores`, `weightedScore`, `confidence`, `recommendations`.
4. **`DimensionScore`**:
   - Reusable rubric structure containing `dimensionId`, `score`, `confidence`, `explanation`, `evidenceUsed`.

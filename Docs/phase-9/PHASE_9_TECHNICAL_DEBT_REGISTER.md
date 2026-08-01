# Phase 9 Technical Debt Register

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Technical Debt & Refactoring Candidates

- **Graph Indexing Optimization**: Large responsibility graphs (> 10,000 nodes) should add adjacency list caching in Phase 10.
- **Async Event Reordering**: High-concurrency async ingestion streams should apply sliding-window monotonic sorting before passing to `InteractionIntegrityAnalyzer`.

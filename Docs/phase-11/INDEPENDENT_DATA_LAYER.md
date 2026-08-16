# Independent Data Layer (Prompt 11.6)

**Project**: SemantIQ Benchmarks  
**Phase**: Phase 11.6 — Independent Data, Storage, Fixtures, and Adapters  
**Date**: 2026-08-03

---

## Summary

All persistence operations, fixture loading, dataset paths, and replay assets use candidate-relative paths only. Zero absolute parent workspace paths, parent DB access, parent cache reads, or implicit root lookups are permitted.

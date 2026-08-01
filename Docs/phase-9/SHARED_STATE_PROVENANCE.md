# Shared State Provenance Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## State Provenance Tracking

All state changes in shared memory require a valid `ProvenanceRecord` containing `provenanceId`, `authorAgentId`, `originEventId`, and `timestamp`. Writes without valid provenance trigger `provenance_loss` anomalies.

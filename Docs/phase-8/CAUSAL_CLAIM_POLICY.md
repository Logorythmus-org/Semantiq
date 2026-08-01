# Causal Claim Classification Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Causal Claim Types

Every causal edge in an execution graph is classified by explicit empirical evidence:
- `direct`: Explicit parent event relationship.
- `enabled`: Permission or resource grant that enabled action.
- `triggered`: Action that directly triggered result or consequence.
- `recovered`: Recovery event following failure.
- `correlated`: Co-occurring events without explicit parent link.

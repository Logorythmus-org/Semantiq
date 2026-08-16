# Shared Memory Integrity & Anomaly Taxonomy (10 Anomaly Classes)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## 10 Anomaly Classes

1. `stale_reads`: Agent reading outdated memory version.
2. `conflicting_writes`: Concurrent updates without lock or merge policy.
3. `lost_updates`: Overwriting unread changes.
4. `unauthorized_writes`: Writing without active permission grant.
5. `partial_propagation`: Update delivered to subset of agents.
6. `inconsistent_replicas`: Replica state divergence.
7. `context_poisoning`: Writing invalid or malformed state data.
8. `provenance_loss`: Writing without author provenance digest.
9. `silent_overwrite`: Overwriting without version bump log.
10. `divergent_interpretation`: Agents interpreting identical state differently.

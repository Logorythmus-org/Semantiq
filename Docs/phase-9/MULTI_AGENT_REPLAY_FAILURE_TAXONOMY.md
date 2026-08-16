# Multi-Agent Replay Failure Taxonomy (9 Failure Classes)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## 9 Replay Failure Classes

1. `missing_or_altered_messages`: Dropped or modified inter-agent message payloads.
2. `changed_delegation`: Delegation record state mismatch.
3. `changed_authority`: Authority scope or expiration divergence.
4. `missing_context_versions`: Gap in shared memory snapshot index.
5. `reordered_events`: Non-monotonic sequence or timestamp order.
6. `evidence_checksum_mismatch`: SHA-256 evidence digest mismatch.
7. `altered_responsibility_edges`: Difference in responsibility graph nodes or edges.
8. `incomplete_recovery`: Recovery sequence failed to re-execute cleanly.
9. `nondeterministic_inputs`: Unseeded random numbers or floating clock inputs.

# Governance Replay Failure Taxonomy (10 Failure Classes)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02

---

## 10 Replay Failure Classes

1. `missing_policy`: Reconstructed bundle missing policy definition.
2. `changed_policy_version`: Policy version string mismatch.
3. `altered_approval`: Human approval SHA-256 checksum mismatch.
4. `missing_exception`: Reconstruction missing policy exception record.
5. `changed_decision_evidence`: Decision evidence SHA-256 mismatch.
6. `missing_dissent`: Minority dissent record erased during replay.
7. `tampered_incident`: Incident bundle SHA-256 checksum mismatch.
8. `changed_responsibility_edge`: Responsibility graph attribution mismatch.
9. `incomplete_recovery`: Replay completed without recovery flag.
10. `changed_profile_input`: Behavioral profile input mutation.

# Audit Integrity Rules (8 Failure Classes)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02  

---

## 8 Failure Classes

1. `missing_policy_evidence`: Bundle lacking active policy version digest.
2. `missing_approval`: Bundle lacking human approval checkpoint digest.
3. `tampered_event`: Altered event inventory hash.
4. `incomplete_recovery`: Closed incident bundle without completed recovery flag.
5. `altered_responsibility_edge`: Responsibility graph edge tampering.
6. `source_evaluator_mixing`: Blending raw source evidence with evaluator output.
7. `nondeterministic_inventory`: Non-deterministic inventory serialization.
8. `unsupported_audit_conclusion`: Audit conclusion lacking backing evidence finding.

# Exception Abuse Detection (12 Abuse Classes)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02

---

## 12 Abuse & Failure Classes

1. `exception_without_authority`: Unauthorized exception issuance.
2. `exception_without_evidence`: Exception lacking verified evidence.
3. `exception_outside_scope`: Action executed beyond granted scope.
4. `expired_exception`: Action attempted using expired exception.
5. `temporary_exception_used_permanently`: Temporary waiver converted to permanent bypass.
6. `override_without_review`: Emergency override missing post-incident review.
7. `repeated_exception_pattern`: High-frequency exception requests signaling policy evasion.
8. `exception_used_to_bypass_approval`: Exception used to circumvent human approval steps.
9. `undocumented_emergency_action`: Emergency override executed without documentation.
10. `unresolved_residual_risk`: Override granted with unresolved critical risk.
11. `exception_attached_after_decision`: Exception retroactively linked post-facto.
12. `exception_not_included_in_replay`: Exception omitted from replay checksums.

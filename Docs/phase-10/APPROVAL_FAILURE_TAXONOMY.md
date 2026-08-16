# Approval Failure Taxonomy (8 Failure Classes)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02  

---

## 8 Failure Classes

1. `unauthorized_approver`: Approver lacking assigned authority reference.
2. `action_before_approval`: Action executed prior to approval decision.
3. `expired_approval`: Action executed after approval expiration window.
4. `reused_approval`: Single approval reused beyond `maxUsageCount`.
5. `post_hoc_approval`: Approval timestamped after action execution.
6. `missing_review_evidence`: Approval granted without mandatory review evidence.
7. `conflicting_approvals`: Contradictory decisions issued for same request.
8. `human_override_without_justification`: Human override lacking justification string.

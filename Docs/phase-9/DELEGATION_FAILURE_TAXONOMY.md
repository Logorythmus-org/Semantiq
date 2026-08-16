# Delegation Failure Taxonomy (9 Failure Classes)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## 9 Failure Classes

1. `delegation_without_authority`: Delegator issuing task exceeding their own authority.
2. `acceptance_without_capability`: Delegatee accepting task without declared capability.
3. `orphaned_tasks`: Delegated task abandoned without assigned agent.
4. `circular_delegation`: Delegating task back to original delegator in loop.
5. `responsibility_diffusion`: Task assigned to multiple agents without clear lead.
6. `silent_reassignment`: Reassigning task without notifying delegator.
7. `incomplete_handoff`: Handoff missing evidence digest or state context.
8. `ambiguous_completion_ownership`: Unclear completion status owner.
9. `failure_without_accountable_actor`: Failure occurring with 0 accountable agents logged.

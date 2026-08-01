# Permission Observation Model Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## 10 Permission States

1. `unavailable`: Resource does not exist or is unreachable.
2. `denied`: Explicitly prohibited by security policy.
3. `read_only`: Content inspection allowed; writes/executes blocked.
4. `write`: Resource mutation permitted.
5. `execute`: Process or command invocation permitted.
6. `scoped`: Restricted to explicit path prefixes or domains.
7. `temporary`: Valid only within an explicit time window.
8. `approval_required`: Suspended pending human operator approval.
9. `conditionally_allowed`: Permitted if preconditions pass.
10. `revoked`: Permission grant revoked during execution.

---

## Default-Deny & Fail-Closed Rules

- Any request lacking an explicit `PermissionGrant` fails closed with `DEFAULT DENY`.
- Uncertain permission or missing grant results in immediate action block.

# Authority Transfer & Revocation Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Authority Delegation Rules

- **Sub-Delegation Limits**: Agents may only delegate sub-authorities within their own scope.
- **Revocation Traceability**: Revoking a parent authority immediately invalidates all child sub-delegations.
- **Time Bounds**: Delegated authorities automatically expire at `expiresAt`.

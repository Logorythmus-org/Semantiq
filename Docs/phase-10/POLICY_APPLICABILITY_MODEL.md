# Policy Applicability & Scope Model Specification (Prompt 10.2)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 10.2 — Policy Applicability and Scope Evaluation  
**Date**: 2026-08-01  
**Applicability Verdict**: `POLICY APPLICABILITY AND SCOPE IMPLEMENTED`

---

## 1. 6 Policy Applicability Domain Objects

1. `PolicyApplicability`: Target actor, resource, timestamp & outcome record.
2. `ApplicabilityDimension`: Specific dimension (`actor`, `role`, `authority`, `mission`, `resource`, `action`, `environment`, `organization`, `temporal`).
3. `ApplicabilityEvidence`: SHA-256 evidence reference backing applicability decision.
4. `ApplicabilityCondition`: Required field value condition.
5. `ApplicabilityConflict`: Overlapping policies targeting conflicting boundaries.
6. `ApplicabilityUncertainty`: Score (0.0 to 1.0) and missing evidence fields.

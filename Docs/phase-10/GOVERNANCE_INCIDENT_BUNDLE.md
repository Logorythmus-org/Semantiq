# Governance Incident Bundle Specification (Prompt 10.6)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 10.6 — Governance Incident and Audit Bundles  
**Date**: 2026-08-02  
**Incident & Audit Verdict**: `GOVERNANCE INCIDENT AND AUDIT BUNDLES IMPLEMENTED`  

---

## 1. 8 Governance Incident & Audit Domain Objects

1. `GovernanceIncidentBundle`: Deterministic incident evidence bundle linking policy, approval, inventory & recovery status.
2. `GovernanceAuditBundle`: Audit scope, criteria, findings, limitations & missing evidence register.
3. `AuditScope`: Domain & timestamp boundaries.
4. `AuditCriterion`: Statement & category (`security`, `authority`, `approval`, `recovery`).
5. `EvidenceInventory`: Checksum manifest (`isDeterministic`).
6. `MissingEvidenceRegister`: Missing item names.
7. `AuditFinding`: Criterion status (`satisfied`, `violated`, `inconclusive`) & evidence ref.
8. `AuditLimitation`: Inspector evaluator limitations.

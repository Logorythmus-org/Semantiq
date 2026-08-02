# Governance Decision Record Specification (Prompt 10.5)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 10.5 — Governance Decision Evidence  
**Date**: 2026-08-02  
**Decision Evidence Verdict**: `GOVERNANCE DECISION EVIDENCE IMPLEMENTED`  

---

## 1. 6 Governance Decision Domain Objects

1. `GovernanceDecisionRecord`: Canonical record linking actor, authority, policy, approval, options, evidence, dissent, uncertainty & outcomes.
2. `DecisionOption`: Evaluated decision option (`isSelected`).
3. `DecisionEvidence`: SHA-256 evidence reference.
4. `DecisionDissent`: Dissenting agent ID & reason string.
5. `DecisionUncertainty`: Uncertainty score (0.0 to 1.0) & rationale.
6. `DecisionReview`: Inspector review ID & approval flag.

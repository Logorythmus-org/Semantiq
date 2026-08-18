# SemantIQ Request for Comments (RFC) Process

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Effective Date**: 2026-08-18  

---

## 1. Purpose of the RFC Process

The SemantIQ RFC (Request for Comments) process provides a structured, transparent mechanism for proposing, debating, and approving substantial architectural, scientific, and contract changes before implementation.

---

## 2. When is an RFC Required?

An RFC is **mandatory** for:
- Any proposed change to the **16 Core Epistemic Invariants** (e.g. `Observed ≠ Inferred`, `Matched Association ≠ Causal Effect`).
- Any breaking change to canonical product contracts or schemas in `packages/sandbox-contracts/` or `schemas/`.
- Introducing new statistical contrast estimators, robustness diagnostics, or evidence decision rules.
- Introducing new official language SDKs or high-level application service protocols.
- Modifying the external evidence eligibility gate or replication registry protocols.

An RFC is **not required** for:
- Bug fixes and routine performance optimizations.
- Adding tests, synthetic fixtures, or documentation improvements.
- Small backward-compatible additions to existing SDK methods.

---

## 3. The RFC Lifecycle

```
[ Idea / Proposal ]
        │
        ▼
   [ 1. DRAFT ] ──► Submit PR to Docs/rfcs/ (RFC-XXXX-title.md)
        │
        ▼
[ 2. UNDER REVIEW ] ──► Public debate (Minimum 14-day comment period)
        │
        ├─────────────────────────────┬───────────────────────────┐
        ▼                             ▼                           ▼
  [ 3. ACCEPTED ]               [ REJECTED ]                [ WITHDRAWN ]
        │
        ▼
 [ 4. IMPLEMENTED ] ──► Core codebase merged & released
        │
        ▼
 [ 5. SUPERSEDED ] ──► Replaced by newer approved RFC
```

### Lifecycle States:
1. **DRAFT**: Author writes proposal following the RFC Template and opens a PR in `Docs/rfcs/`.
2. **UNDER REVIEW**: Open discussion across maintainers, domain owners, and external research partners. Minimum **14 calendar days** review window.
3. **ACCEPTED**: Formal consensus reached by the Maintainers Council and relevant domain owners.
4. **IMPLEMENTED**: Code changes, tests, and contract updates completed and merged into `main`.
5. **REJECTED / WITHDRAWN**: Proposal declined with documented rationale preserved for future reference.
6. **SUPERSEDED**: Later RFC replaces the decisions of an older implemented RFC.

---

## 4. RFC Template Structure

Every RFC document in `Docs/rfcs/RFC-XXXX-<name>.md` must include:

```markdown
# RFC-XXXX: [Feature / Architecture / Epistemic Title]

- **Status**: Draft | Under Review | Accepted | Implemented | Rejected | Superseded
- **Author(s)**: [Name / Handle / Affiliation]
- **Domain(s)**: Core | Benchmark | Evidence | Governance | SDKs | Security
- **Created**: YYYY-MM-DD
- **Target Release**: vX.Y.Z

## 1. Executive Summary
Brief high-level overview of the proposal and motivation.

## 2. Motivation & Problem Statement
Why is this change necessary? What problem or limitation does it address?

## 3. Detailed Specification
- Canonical data structures, interfaces, and mathematical definitions.
- Epistemic integrity analysis (how does it uphold scientific guardrails?).
- Error handling, fallback modes, and edge cases.

## 4. Cross-Language & Backward Compatibility
- TypeScript SDK impacts.
- Python SDK parity and dataclass representations.
- Schema versioning and migration pathways.

## 5. Security, Privacy & Resource Impact
- Secret redaction and isolation considerations.
- Threat modeling analysis and performance benchmarks.

## 6. Drawbacks & Alternatives Considered
- What other approaches were evaluated?
- What are the costs of doing nothing?

## 7. Unresolved Questions & Open Discussion
- Items requiring feedback during the review window.
```

---

## 5. Decision & Governance Consensus

- **Domain Approval**: Requires sign-off from designated Domain Owners ([`.github/CODEOWNERS`](file:///c:/Users/Kaveh/Desktop/Tech-Club/.github/CODEOWNERS)).
- **Epistemic Changes**: Changes to scientific invariants require **unanimous approval** from the Maintainers Council.

# Scientific Guardrails & Epistemic Invariants

## Overview

SemantIQ is engineered with strict epistemic boundaries to prevent overfitting, p-hacking, confirmation bias, and unsupported causal overclaiming.

---

## The 16 Epistemic Invariants

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CORE EPISTEMIC INVARIANTS                                 │
│                                                                                        │
│  1. Observed ≠ Inferred             2. Zero Architecture Hallucinations                │
│  3. Absence ≠ Counterevidence       4. Matched Association ≠ Causal Effect             │
│  5. Robustness ≠ Causality          6. Promotion ≠ Scientific Proof                    │
│  7. Controlled Scientific Language  8. Release Controls Wording, Not Truth             │
│  9. No Automatic Claim Mutation    10. Bundle Integrity ≠ Truth                        │
│ 11. Counterevidence Visible        12. E4 Requires Genuine Context Diversity           │
│ 13. Preregistration ≠ Truth        14. Material Deviations Cap Evidence                │
│ 15. No Attestation Alone Promotes  16. Gate Eligibility ≠ Truth                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Observed vs Inferred Separation
- Observations are empirical artifacts directly recorded during test executions (`EpistemicNature.OBSERVED`).
- Inferences, projections, and extrapolations are labeled `EpistemicNature.INFERRED`.
- Inferred relationships can never be counted as empirical failure observations.

### 2. Zero Failure Observations from Architecture Alone
- Analyzing static architecture alone generates exactly 0 failure observations (`totalFailuresExtracted: 0`).
- Failure observations require dynamic, instrumented execution traces.

### 3. Absence of Observation is Not Counterevidence
- Unobserved pattern relations remain unobserved ($R0$, `no_observation`).
- The absence of failure evidence is not treated as evidence of safety or absence of risk.

### 4. Matched Association $\neq$ Causal Identification
- Matched statistical contrast isolates covariate differences across 7 dimensions (`environment`, `model`, `population`, `tools`, `memory`, `resource_pressure`, `horizon`).
- Matched contrast demonstrates statistical association under tested conditions, not causal proof.

### 5. Robustness Across Specifications $\neq$ Causal Identification
- Specification curve analysis and Total Variation Distance ($TVD$) prove stability across model-environment combinations, but do not prove causal invariance.

### 6. Evidence Promotion $\neq$ Scientific Proof
- Governance verdicts (`promote`, `hold`, `downgrade`) reflect whether empirical data meets programmatic acceptance criteria, not absolute scientific truth.

### 7. Controlled Scientific Language
- Claim statements undergo regex validation blocking unsupported, unhedged causal terms:
  - **Prohibited Verbs/Nouns**: `causes`, `proves`, `guarantees`, `eliminates`, `causal proof`, `unhackable`, `completely safe`, `perfect mitigation`.
  - **Allowed Scientific Phrasing**: `is associated with`, `demonstrates observed reduction in`, `mitigates observed risk under tested conditions`.

### 8. Release Controls Wording, Not Scientific Truth
- Claim release indicates that wording meets governance standards and has passed two-party review.
- All released claims carry `EPISTEMIC_LANGUAGE_DISCLAIMER`.

### 9. No Automatic Active-Claim Mutation
- Evidence Watch monitors ongoing benchmark runs and generates *proposals* when contradictions appear.
- Active claims are never mutated or retracted automatically without human peer review.

### 10. Research Bundle Integrity Proves Provenance, Not Truth
- SHA-256 Merkle root verification proves that the bundle has not been tampered with and matches source runs.
- Bundle verification does not confer truth or validity beyond the tested data.

### 11. Counterevidence Visibility Invariant
- Multi-organization replication aggregation must never hide, filter, or suppress counterevidence or mixed results (`counterevidencePreserved: true`).

### 12. E4 Requires Genuine Context Diversity
- Promotion to highest evidence tier (E4) strictly requires:
  - Submissions from $\ge 2$ independent organizations.
  - Context diversity index $\ge 0.70$ across independent platforms, providers, and models.

### 13. Pre-registration Guards Against P-Hacking, Not Truth
- Freezing study designs prior to execution prevents post-hoc metric tuning and p-hacking.
- Pre-registration does not guarantee study accuracy.

### 14. Material Deviations Cap Evidence Tier
- Any deviation introduced `during_execution` or `post_hoc` is recorded in an append-only ledger and automatically caps the highest attainable evidence tier (`CAP_E2_LOCAL_CONSISTENT` or `CAP_E1_CONTESTED`).

### 15. No Attestation Alone Promotes Evidence
- Partner signatures and attestations without verifiable trace bundles cannot promote evidence.

### 16. Gate Eligibility Determines Admissibility, Not Truth
- The External Evidence Eligibility Gate determines whether external submissions meet ingestion standards for aggregation.
- Ineligible evidence is quarantined or rejected, while remaining stored for transparency.

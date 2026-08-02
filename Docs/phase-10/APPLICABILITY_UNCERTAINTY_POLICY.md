# Applicability Uncertainty Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Uncertainty Rules

- **Missing Evidence**: When evidence digests are missing, applicability MUST evaluate to `isApplicable: false` with an explicit `ApplicabilityUncertainty` score of 1.0. Missing evidence is never converted into applicability or compliance.

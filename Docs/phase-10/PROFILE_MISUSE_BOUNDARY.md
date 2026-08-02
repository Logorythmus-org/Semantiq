# Profile Misuse Boundary Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02  

---

## Misuse Boundaries

- **No Absolute Labels**: Absolute trust claims ("100% trustworthy", "perfect actor") trigger `absolute_trust_label`.
- **No Moral or Legal Judgments**: Terminology assigning moral guilt or criminal judgment triggers `moral_or_legal_judgment`.
- **No Treating Missing Evidence as Success**: Missing evidence MUST raise uncertainty score; claiming zero uncertainty with 0 evidence items triggers `missing_evidence_treated_as_success`.

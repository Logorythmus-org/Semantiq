# Dissent and Uncertainty Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-02  

---

## Dissent & Uncertainty Rules

- **Preservation of Minority Dissent**: Dissenting opinions (`DecisionDissent`) MUST be preserved as first-class evidence and never erased or overwritten.
- **Uncertainty Score Verification**: Claiming zero uncertainty (`score = 0`) when active dissents exist triggers `unsupported_certainty`.

# Policy Interpretation Boundary

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Interpretation Boundaries

- **Separation of Raw vs Parsed**: Raw text statements (`PolicyStatement`) are stored immutably and separately from evaluator-parsed rules (`PolicyRule`).
- **Attribution Required**: Converting natural language into executable rule checks requires explicit `evaluatorId` attribution. Unattributed rule parsing triggers `unattributed_interpretation`.

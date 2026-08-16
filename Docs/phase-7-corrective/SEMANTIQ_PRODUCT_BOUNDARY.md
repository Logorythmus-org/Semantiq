# SemantIQ Product Boundary Definition (Prompt 7.18)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 7 Corrective — Product Boundary  
**Date**: 2026-08-01  
**Boundary Verdict**: `SEMANTIQ BOUNDARY ENFORCED`

---

## 1. SemantIQ Identity

SemantIQ is an independent, model- and provider-neutral AI evaluation engine.

### Included Paths (`SEMANTIQ_CORE`)

- `packages/semantiq`
- `examples/citation`, `examples/ecosystem`, `examples/kaggle`
- `CITATION.cff`, `codemeta.json`, `LICENSE`

### Excluded Paths (`PARENT_WORKSPACE_ONLY`)

- `packages/civilization-kernel`, `packages/wallet`, `packages/question-network`
- `apps/*`, `services/*`
- `Tech-Club-Architect-Blueprint.md`

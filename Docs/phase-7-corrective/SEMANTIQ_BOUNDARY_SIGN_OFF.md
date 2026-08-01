# SemantIQ Product Boundary Sign-Off

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Boundary Enforceability Sign-Off

The product boundary for SemantIQ is strictly defined in `products/semantiq/extraction-manifest.json`.

All `SEMANTIQ_CORE` assets are contained within:
- `packages/semantiq`
- `examples/citation`, `examples/ecosystem`, `examples/kaggle`
- `CITATION.cff`, `codemeta.json`, `LICENSE`

All internal platform packages (`packages/wallet`, `packages/civilization-kernel`, `packages/question-network`) are explicitly excluded.

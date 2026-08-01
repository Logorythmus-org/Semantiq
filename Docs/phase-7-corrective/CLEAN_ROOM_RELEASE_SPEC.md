# Clean-Room Release Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Clean-Room Verification Checklist

- [x] Candidate isolated outside parent `.git` tree.
- [x] 0 parent monorepo packages (`packages/wallet`, `packages/civilization-kernel`).
- [x] 0 internal blueprints or secrets.
- [x] Clean lockfile resolution (`pnpm install --frozen-lockfile`).
- [x] 100% test suite passage.

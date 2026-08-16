# Phase 11 & Phase 12 Release Protocol Handoff

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Release Pipeline Handoff

Public publication is deferred to:

- **Phase 11 (Clean-Room Extraction)**: Copy files matching `products/semantiq/extraction-manifest.json` into an isolated workspace outside `.git`.
- **Phase 12 (Authorized Publication)**: Run `scripts/clean-room-validator.mjs` and push candidate to an empty GitHub repository only upon receiving `Docs/phase-12/PHASE_12_PUBLICATION_AUTHORIZATION.json`.

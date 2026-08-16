# Release Threat Model & Vulnerability Analysis

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Threat Matrix & Safeguards

| Threat                     | Description               | Automated Safeguard                                            |
| -------------------------- | ------------------------- | -------------------------------------------------------------- |
| **Parent Workspace Push**  | Publishing monorepo root  | `scripts/release-guard.mjs` (blocks parent CWD)                |
| **Parent .git Leak**       | Pushing parent history    | `scripts/clean-room-validator.mjs` (blocks `.git` inheritance) |
| **Tech Club Secrets Leak** | Exposing private docs     | `products/semantiq/extraction-manifest.json` deny patterns     |
| **Premature Phase Push**   | Pushing during Phase 8–10 | `config/release-freeze.json` (freeze active)                   |

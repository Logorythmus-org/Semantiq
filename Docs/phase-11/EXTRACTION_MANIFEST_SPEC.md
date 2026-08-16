# Extraction Manifest Specification (Prompt 11.2)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 11.2 — Extraction Manifest Finalization  
**Date**: 2026-08-03  
**Manifest Verdict**: `EXTRACTION MANIFEST FINALIZED`

---

## 1. Schema Properties

- `$schema`: Draft 2020-12 JSON Schema specification.
- `version`: `1.0.0`
- `product`: `SemantIQ Benchmarks`
- `packageName`: `@tech-club/semantiq`
- `defaultPolicy`: `deny`
- `checksumPolicy`: `sha256`
- `symlinkPolicy`: `reject_escape`
- `hiddenFilePolicy`: `reject_git_and_secrets`
- `generatedFilePolicy`: `exclude_dist_and_build`
- `requiredFiles`: Array of mandatory root assets (`package.json`, `index.ts`, `LICENSE`, `extraction-manifest.json`).
- `includedPaths`: Exact list of extractable product files.
- `excludedPaths`: Array of explicitly forbidden monorepo paths.
- `forbiddenImports`: Array of forbidden non-product imports.

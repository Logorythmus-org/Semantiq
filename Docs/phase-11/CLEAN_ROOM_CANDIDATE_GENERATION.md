# Clean-Room Candidate Generation (Prompt 11.10)

**Project**: SemantIQ Benchmarks  
**Phase**: Phase 11.10 — Clean-Room Candidate Generation  
**Date**: 2026-08-03  
**Verdict**: `CLEAN-ROOM RELEASE CANDIDATE GENERATED`

---

## Candidate Summary

| Field | Value |
|-------|-------|
| Candidate Version | `0.1.0-alpha.1` |
| Source Commit | `4c17ba326581aacdd2318ad3837fd2a2ed3ee4f4` |
| Manifest Version | `1.0.0` |
| Generator Version | `11.10` |
| Generated At | `2026-08-03T18:38:02Z` |
| Candidate Path | `release-candidates/semantiq-v0.1.0-alpha.1/` |
| Publication Status | **UNPUBLISHED** — treat as candidate until Phase 12 |
| Deterministic | ✅ Yes |

---

## Evidence Record

| Evidence | Status |
|---------|--------|
| Provenance manifest | ✅ `PROVENANCE_MANIFEST.json` |
| File inventory | ✅ `INVENTORY.md` |
| SHA-256 checksums | ✅ `CHECKSUMS.sha256` |
| No parent `.git` inherited | ✅ Verified |
| No secret files included | ✅ Verified |
| No absolute paths | ✅ Verified |
| No forbidden imports | ✅ Verified (`boundary-validator.mjs` PASSED) |
| All declared files present | ✅ Verified against extraction manifest |
| Boundary validator | ✅ PASSED |
| Type check | ✅ 0 errors |
| Full test suite | ✅ 107 test files / 399 tests passed |

---

## Included Assets

- `packages/semantiq/` — All Phase 8–11 TypeScript source (18 modules)
- `products/semantiq/specs/` — 5 JSON fixture datasets
- `products/semantiq/extraction-manifest.json` — Canonical manifest
- `LICENSE`, `CITATION.cff`, `codemeta.json`, `.zenodo.json`, `THIRD_PARTY_NOTICES.md`

## Excluded Assets (Per Manifest)

- `.git/` directory (parent Git history)
- All parent-only packages (`sprint1-runtime` through `alpha-operations`, `agent-runtime`, etc.)
- `apps/`, `services/` directories
- `Tech-Club-Architect-Blueprint.md`, `canonical-release-audit.md`

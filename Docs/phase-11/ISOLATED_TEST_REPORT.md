# Isolated Test Report (Prompt 11.11)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Test Run Summary (Phase 11.10 Baseline — commit `661a7d1`)

| Metric             | Value                           |
| ------------------ | ------------------------------- |
| Total test files   | 118                             |
| Passed test files  | 108                             |
| Skipped test files | 10 (Postgres — no DATABASE_URL) |
| Total tests        | 441                             |
| Passed tests       | 405                             |
| Skipped tests      | 36                              |
| Failed tests       | **0**                           |
| Duration           | ~37.9s                          |

## Validation Commands and Exit Codes

| Step                | Command                                              | Exit Code | Result    |
| ------------------- | ---------------------------------------------------- | --------- | --------- |
| Full test suite     | `pnpm test`                                          | 0         | ✅ PASSED |
| Unit tests          | `pnpm test --reporter=verbose`                       | 0         | ✅ PASSED |
| Boundary validation | `node scripts/boundary-validator.mjs`                | 0         | ✅ PASSED |
| TypeScript check    | `pnpm typecheck`                                     | 0         | ✅ PASSED |
| Doctor (CLI)        | `semantiq doctor` → `SemantIQCliEngine`              | 0         | ✅ PASSED |
| Smoke (CLI)         | `semantiq smoke` → `SemantIQCliEngine`               | 0         | ✅ PASSED |
| Validate (CLI)      | `semantiq validate` → `SemantIQCliEngine`            | 0         | ✅ PASSED |
| No-egress check     | `RuntimeDependencyRemoverEngine.auditRuntimeImports` | 0         | ✅ PASSED |
| Scenario validation | `GovernanceScenarioEngine` (16 scenarios)            | 0         | ✅ PASSED |
| Package boundary    | `DependencyGraphEngine.validateGraph`                | 0         | ✅ PASSED |

## Deviation Log

- 10 Postgres integration test files skipped (expected — no `DATABASE_URL` in isolated environment). This is correct behavior.
- No unexpected failures or warnings.

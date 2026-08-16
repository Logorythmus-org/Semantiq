# Full Test & Quality Gate Report

This report records automated quality gate execution results for **SemantIQ Benchmarks** version `0.1.0-alpha.1`.

---

## Test Execution Summary

```text
Test Execution Engine: Vitest v3.2.6
Date: 2026-07-31

Test Files:  47 passed | 10 skipped (57 total)
Tests:       170 passed | 36 skipped (206 total)
Duration:    ~20.8 seconds
```

---

## Category Breakdown

| Test Suite Category       | Executed Test Files           | Passed | Failed | Status   |
| ------------------------- | ----------------------------- | ------ | ------ | -------- |
| **Unit Tests**            | `tests/unit/*.test.ts`        | All    | 0      | **PASS** |
| **Smoke Tests**           | `tests/smoke/*.test.ts`       | All    | 0      | **PASS** |
| **Integration Tests**     | `tests/integration/*.test.ts` | All    | 0      | **PASS** |
| **API Contract Tests**    | `tests/api/*.test.ts`         | All    | 0      | **PASS** |
| **Security Tests**        | `tests/security/*.test.ts`    | All    | 0      | **PASS** |
| **E2E Canonical Journey** | `tests/e2e/*.test.ts`         | All    | 0      | **PASS** |

_(Note: 36 skipped integration tests require a live external PostgreSQL instance)._

---

## Quality Gate Verdict

**ALL MANDATORY QUALITY GATES PASSED** — Zero test failures recorded.

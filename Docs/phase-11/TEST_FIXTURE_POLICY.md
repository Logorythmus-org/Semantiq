# Test Fixture Policy (Prompt 11.7)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Fixture Ownership Rules

1. **All fixtures are candidate-local** — no fixture may reference parent workspace paths.
2. **Deterministic seeds** — all randomized fixtures use seed `42` for reproducibility.
3. **Isolated temp dirs** — each test run creates a fresh `./tmp/test-harness/` directory.
4. **Cleanup on exit** — temp directories and generated artifacts are deleted after test run.
5. **No network fixtures** — all fixture data is embedded in JSON files under `products/semantiq/specs/`.
6. **No parent DB fixtures** — Postgres integration tests are skipped when `DATABASE_URL` is absent.

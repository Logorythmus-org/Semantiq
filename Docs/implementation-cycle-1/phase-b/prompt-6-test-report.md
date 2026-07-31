# Prompt 6 Test Report

- Typecheck: passed.
- Focused unit: 4/4 passed.
- Focused API: 3/3 passed.
- Focused PostgreSQL: 2/2 passed.
- Full PostgreSQL-enabled suite: 51 files, 188 tests, all passed.
- Coverage run without PostgreSQL: 42 files passed, 153 tests passed, 9 files/34 tests skipped; 76.04% statements/lines overall, 91.96% Question package, 84.45% API server.
- Format: passed.
- Lint after Prompt 6 fix: no Prompt 6 errors; two unrelated pre-existing unused-variable warnings remain.

Covered risks include duplicate floods, report privacy, capability denial, stale moderation actions, atomic rollback, append-only enforcement, restricted exact/discovery/graph/semantic access, stable 429 errors, migration survival, Docker restart, and data persistence.

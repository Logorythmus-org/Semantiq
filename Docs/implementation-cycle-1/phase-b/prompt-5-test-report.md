# Phase B Prompt 5 Test Report

Status: Passed for all executed automated suites.

## Added Coverage

| Layer                       |      Files/tests | Result |
| --------------------------- | ---------------: | ------ |
| Unit                        | 1 file / 5 tests | Passed |
| Read repository contract    |            1 / 2 | Passed |
| Real PostgreSQL integration |            1 / 9 | Passed |
| In-memory API               |            1 / 4 | Passed |
| Real PostgreSQL API         |            1 / 3 | Passed |
| Security                    |            1 / 4 | Passed |
| Prompt 5 total              |           6 / 27 | Passed |

Covered behavior includes three cursor pages with tied timestamps and no duplicates; tampered/query-mismatched cursors; lifecycle, creator, inclusive time, language, Frame presence/freshness, assumptions, unknowns, uncertainty, relation type/direction/neighbor, and combined filters; exact summary/detail; EN/DE/FA and Persian variants; update synchronization with revision preservation; archive/restore; literal SQL/wildcard/script-like input; bounds; log privacy; sanitized repository failures; and head-5 data survival.

The `constraint_type` test asserts the stable `question_constraint_filter_invalid` rejection because no typed data exists. This is a documented failed acceptance item, not a skipped test.

## Full Host Suite

- `REAL_POSTGRES_TEST=... pnpm test`: Passed, 48/48 files and 179/179 tests.
- `REAL_POSTGRES_TEST=... pnpm test:coverage`: Passed in 26.29 s.
- Coverage: 92.52% statements/lines, 82.85% branches, 94.96% functions.
- Question package: 95.42% statements/lines, 85.68% branches, 98.14% functions.
- PostgreSQL discovery repository: 94.62% statements/lines.
- API server: 87.58% statements/lines.

## Docker Suite

`docker compose run --rm ... vitest run --reporter=dot`: Passed from the final built image against Compose PostgreSQL, 48/48 files and 179/179 tests in 17.96 s.

No network/cloud, GitHub, CI/CD, frontend, AI, vector, or external search test was executed because those surfaces are out of scope.

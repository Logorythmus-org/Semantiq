# Phase B Prompt 2 Test Report

## Host Results

| Stage                       | Result                                                   |
| --------------------------- | -------------------------------------------------------- |
| Typecheck                   | Passed                                                   |
| Unit and contract           | Passed, 42 tests after final failure-injection additions |
| Security                    | Passed, 6 tests                                          |
| Real PostgreSQL integration | Passed, 8 tests                                          |
| API with real PostgreSQL    | Passed, 5 tests                                          |
| Full real coverage suite    | Passed, 106 tests across 30 files, no skips              |

Final V8 coverage with the real PostgreSQL suites enabled was 90.92% statements/lines, 79.69% branches, and 92.69% functions. Question package coverage was 96.33% statements, 86.89% branches, and 97.77% functions.

## Behavioral Evidence

- Version increments exactly once through update/archive/restore.
- Five injected failure stages roll back Question/revision/event/idempotency state.
- Real competing writes produce one winner, one conflict, one revision, and one event.
- Migration 2 to 3 preserves existing Persian data.
- Revision DB trigger rejects mutation.
- Update/archive/restore replay does not duplicate history/events.
- Validation, no-op, malformed ID, not found, forbidden actor, stale version, archived edit, and lifecycle repeat errors map stably.
- SQL-like/script-like Unicode remains data; mutation events/errors omit historical text.

`pnpm verify` passed configuration, formatting, lint, typecheck, tests, integration, API, smoke, and Compose configuration. Lint retained two unrelated historical warnings and added no new warning.

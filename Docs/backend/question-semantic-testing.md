# Question Semantic Testing

## Focused Coverage

Prompt 4 adds 23 tests across domain/application, repository contracts, HTTP, PostgreSQL integration, real HTTP/PostgreSQL, and security suites.

Covered behavior includes normalization, Unicode content, empty explicit structures, list and total bounds, duplicate rejection, uncertainty rationale, scope overlap, ownership, body spoofing, archived writes, public current reads, private history, optimistic concurrency, no-op rejection, idempotent replay/conflict, rollback, immutable revisions, database checks, retention, compact events, migration upgrade, API aliases, and log/error redaction.

## Commands

```powershell
$env:REAL_POSTGRES_TEST='postgresql://techclub:techclub@127.0.0.1:5432/techclub'
pnpm test
pnpm test:coverage
```

The guarded performance harness requires `QUESTION_BENCHMARK_ALLOW_RESET=1` and an isolated database. Docker parity runs the same coverage command inside the built API image on the Compose network.

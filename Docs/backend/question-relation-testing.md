# Question Relation Testing

Coverage is split by risk:

- Unit: taxonomy, directionality, authorization, lifecycle guards, idempotency, graph bounds, and failure rollback.
- Contract: round-trip fields, ordering, semantic uniqueness, and unit-of-work snapshots.
- PostgreSQL: migration upgrade, generated canonical identity, immutable rows, foreign keys, races, row locking, outbox atomicity, and repeatable graph reads.
- API: envelopes, aliases, filters, traversal, bounds, spoof resistance, and real PostgreSQL routing.
- Security: compact events/logs, header-only actor context, sanitized errors, and resource bounds.

Run all local tests:

```text
pnpm test
```

Run the complete real PostgreSQL suite:

```text
REAL_POSTGRES_TEST=postgresql://techclub:techclub@127.0.0.1:5432/techclub pnpm test
```

The PowerShell equivalent sets `$env:REAL_POSTGRES_TEST` before invoking `pnpm test`. The destructive benchmark additionally requires `QUESTION_BENCHMARK_ALLOW_RESET=1` and an isolated database.

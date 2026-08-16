# Question Testing

Prompt 6 coverage includes provenance normalization and duplicates, logical removal, report privacy/withdrawal, moderation capability and concurrency, lifecycle actions, atomic rollback, idempotency, rate limits, PostgreSQL constraints, discovery restriction, API privacy, Docker lifecycle, restart persistence, and migration survival.

Question lifecycle verification is split across:

- Unit tests for domain transitions, Unicode, events, revisions, policy, idempotency, and five injected transaction failures.
- Contract tests for compare-and-swap, revision uniqueness/order, and rollback.
- Real PostgreSQL tests for migration upgrade, existing-data survival, atomic lifecycle persistence, immutable history, concurrency, and rollback.
- API tests for validation, lifecycle, errors, correlation, history access, and real persistence.
- Security tests for spoofing boundaries, bounds, inert hostile-looking text, compact events, and error privacy.
- Docker lifecycle tests plus backend/database restart recovery.

Real database suites require `REAL_POSTGRES_TEST`. The destructive performance script additionally requires `QUESTION_BENCHMARK_ALLOW_RESET=1` and must target an isolated database.

Prompt 5 adds discovery unit, read-repository contract, real PostgreSQL integration, in-memory/real API, pagination, multilingual, and security tests. The destructive discovery benchmark requires `QUESTION_DISCOVERY_BENCHMARK_ALLOW_RESET=1` and accepts `QUESTION_DISCOVERY_BENCHMARK_DATABASE_URL`.

The verified Prompt 5 baseline is 48 test files and 179 tests on the host and in the built Docker image. Host coverage is 92.52% statements/lines, 82.85% branches, and 94.96% functions. Real PostgreSQL tests intentionally truncate Question Runtime tables and therefore require an isolated local database.

# Phase B Prompt 3 Reuse Map

## Reused Directly

- `Question` identity, creator, status, and restore behavior.
- `QuestionRuntimeError`, `Result`, clock, ID generator, validation, correlation, and event primitives.
- PostgreSQL pool and migration runner.
- `questions`, `idempotency_records`, and `outbox_events` tables.
- Transaction, rollback, hashed idempotency key, and compact event patterns from Prompt 1/2.
- Node HTTP API envelope, error mapping, correlation headers, health/readiness, and structured logs.
- Memory repository and unit-of-work testing conventions.
- Existing Docker image and PostgreSQL service.

## Added Without Replacing Working Code

- Relation-specific domain, contracts, application handlers, and memory adapters.
- Relation-specific PostgreSQL repository and unit of work.
- Migration 4 and three relation API routes.
- Focused tests, benchmark metrics, ADRs, and backend documentation.

## Deliberately Not Reused

Historical Question aggregates, graph metadata bags, confidence/weight fields, Neo4j runtime code, AI suggestions, and generic graph services were not reused because they bypass current Question ownership and lifecycle contracts.

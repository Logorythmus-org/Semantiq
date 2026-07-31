# ADR-0005: Primary Database

## Context

Compose already declares PostgreSQL 16 and the authoritative configuration already exposes `DATABASE_URL`. No competing active database implementation exists.

## Decision

PostgreSQL is the primary local relational system of record. Redis, Neo4j, and MinIO remain optional future adapters with explicit roles; they are not used by the foundation migration.

## Consequences

Transactions, JSON metadata, timestamps, constraints, and outbox records have a stable target. Local development requires PostgreSQL only when persistence integration is exercised. Docker remains the intended reproducible startup path.

## Rejected Alternatives

SQLite was rejected as a PostgreSQL substitute because behavior for JSON, concurrency, constraints, and migrations would diverge. Neo4j was deferred because no active graph persistence consumer exists.

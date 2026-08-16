# ADR-0008: Transaction and Unit of Work

## Decision

`PostgresUnitOfWork` obtains a client lazily, begins explicitly, exposes repository access only during an active transaction, commits on success, rolls back on failure, releases the client, and never dispatches side effects before commit.

## Required Order

Open unit of work, load or change entities, collect events, persist records, persist outbox events, commit, dispatch post-commit actions, close.

## Consequences

Transaction ownership is explicit and testable. Nested transactions are not supported in this slice; callers must compose work inside one unit of work.

# ADR-0024: Question Optimistic Concurrency

Status: Accepted

Date: 2026-07-12

## Context

Concurrent edits must not silently overwrite one another.

## Decision

Require `expectedVersion` for every mutation. Validate it in the aggregate and persist with a compare-and-swap SQL update. A successful mutation increments version once; a zero-row update returns `question_version_conflict` and rolls back revision, outbox, and idempotency state.

## Consequences

Clients must refresh after conflicts. No pessimistic lock is held across HTTP work, and real PostgreSQL tests prove one winner for competing writes.

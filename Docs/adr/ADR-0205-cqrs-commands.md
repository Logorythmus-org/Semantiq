# ADR-0205: Question CQRS Commands

Status: Deferred

Date: 2026-07-21

## Context

Create, get, update, archive, restore, revision-history, relation, semantic, discovery, and safety handlers already exist. New publish, lock, delete, and create-revision commands depend on unresolved lifecycle changes.

## Decision

Do not add duplicate commands or bypass existing application handlers.

## Consequences

Future Phase E facades must delegate to stable Question application contracts and preserve authorization/idempotency.

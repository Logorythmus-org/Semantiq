# ADR-0112: Tool Invocation Transaction Boundaries

Status: Deferred

Date: 2026-07-20

## Context

Invocation, task, authorization, event, and persistence contracts are absent.

## Decision

Do not invent transaction, completion, retry, or idempotency boundaries.

## Alternatives

One giant transaction and in-memory completion tracking were rejected.

## Consequences

No invocation can be scheduled or completed.

## Security Implications

Unsafe duplicate side effects are avoided by disabling execution.

## Migration Implications

No invocation or idempotency schema is created.

## Future Extension Boundary

Persist legal transitions, authorization decisions, request fingerprints, events, and terminal results atomically where required.

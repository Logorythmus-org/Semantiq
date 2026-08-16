# ADR-0092: Semantiq Transaction Boundaries

Status: Deferred

Date: 2026-07-19

## Context

Phase C aggregates, repositories, jobs, idempotency, and events are absent.

## Decision

Do not specify speculative transaction boundaries or reuse Question transactions as Semantiq ownership.

## Consequences

Transaction and partial-failure semantics remain a blocking implementation input.

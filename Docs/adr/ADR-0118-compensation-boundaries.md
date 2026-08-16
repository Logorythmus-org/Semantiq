# ADR-0118: Compensation Boundaries

Status: Deferred

Date: 2026-07-20

## Context

Parent task/tool side-effect and idempotency contracts are absent.

## Decision

Do not infer automatic business rollback or compensation handlers.

## Consequences

Only `none`, explicit deterministic rollback, and human-managed compensation may be considered after parent recovery.

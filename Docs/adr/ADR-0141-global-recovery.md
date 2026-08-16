# ADR-0141: Global Recovery

Status: Deferred

Date: 2026-07-21

## Context

No persisted Phase D artifacts, checkpoints, or idempotent completion identities exist.

## Decision

Do not create nominal global checkpoints or replay mutable legacy state.

## Consequences

Restart recovery and duplicate-execution prevention are not validated.

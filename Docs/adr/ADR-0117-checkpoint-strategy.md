# ADR-0117: Checkpoint Strategy

Status: Deferred

Date: 2026-07-20

## Context

No persisted step execution or normalized task/tool result exists to checkpoint.

## Decision

Do not create nominal checkpoints from approval IDs or in-memory state.

## Consequences

Resume and restart recovery remain unavailable.

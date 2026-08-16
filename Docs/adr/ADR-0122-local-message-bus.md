# ADR-0122: Local Message Bus

Status: Deferred

Date: 2026-07-20

## Context

Existing buses and arrays are in-memory and lack mailbox delivery semantics.

## Decision

Do not expose the generic kernel bus as the Agent message bus.

## Consequences

Send, receive, acknowledge, expire, ordering, and restart recovery remain unavailable.

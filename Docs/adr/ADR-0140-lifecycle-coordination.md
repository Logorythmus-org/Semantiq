# ADR-0140: Lifecycle Coordination

Status: Deferred

Date: 2026-07-21

## Context

There are no authoritative runtime lifecycle ports or durable in-flight states.

## Decision

Do not claim startup, shutdown, pause, or failure coordination.

## Consequences

Global lifecycle and readiness remain unavailable.

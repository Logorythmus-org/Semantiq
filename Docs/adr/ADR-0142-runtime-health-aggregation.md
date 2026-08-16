# ADR-0142: Runtime Health Aggregation

Status: Deferred

Date: 2026-07-21

## Context

Mandatory runtime health contracts are absent and static descriptors report synthetic states.

## Decision

Report Phase D unhealthy and readiness false; aggregate no synthetic health.

## Consequences

Health, readiness, diagnostics, and operational metrics remain unavailable.

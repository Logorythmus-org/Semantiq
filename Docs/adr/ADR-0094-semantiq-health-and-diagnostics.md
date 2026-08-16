# ADR-0094: Semantiq Health and Diagnostics

Status: Deferred

Date: 2026-07-19

## Context

No executable Phase C service, worker, migration, or adapter exists.

## Decision

Do not report synthetic health. Future liveness, readiness, and diagnostics must be distinct, bounded, authorized, and redacted.

## Consequences

Current Phase C health is unhealthy and readiness is false.

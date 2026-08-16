# ADR-0134: Constraint Solver

Status: Deferred

Date: 2026-07-21

## Context

Constraint inputs and authoritative availability/permission policies do not exist.

## Decision

Fail closed and create no solver result from missing or legacy string data.

## Consequences

No plan can be validated as feasible.

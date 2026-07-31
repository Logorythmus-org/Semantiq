# ADR-0108: Effective Permission Intersection

Status: Deferred

Date: 2026-07-20

## Context

Human authorization, Agent, capability, tool, operation, runtime, and resource policies are absent.

## Decision

Do not infer grants; effective permission remains denied.

## Alternatives

Union semantics and caller-supplied grants were rejected.

## Consequences

Permission evaluation cannot authorize execution.

## Security Implications

Fail-closed behavior prevents escalation.

## Migration Implications

No grants or decisions are persisted.

## Future Extension Boundary

Implement immutable intersection decisions with reason codes and bounded validity.

# ADR-0111: Tool Result Normalization

Status: Deferred

Date: 2026-07-20

## Context

No Tool Adapter or output schema exists.

## Decision

Accept no raw or legacy synthetic output as a Tool Result.

## Alternatives

Passing adapter output directly to tasks, events, or APIs was rejected.

## Consequences

Result and artifact contracts remain unavailable.

## Security Implications

Raw paths, secrets, and oversized output cannot cross a nonexistent boundary.

## Migration Implications

No result or artifact table is created.

## Future Extension Boundary

Validate schemas and limits, redact sensitive fields, and persist normalized immutable envelopes.

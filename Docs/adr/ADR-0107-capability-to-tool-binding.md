# ADR-0107: Capability-to-Tool Binding

Status: Deferred

Date: 2026-07-20

## Context

Prompt 1 capabilities are absent and legacy string arrays are untrusted.

## Decision

Create no capability-to-tool binding.

## Alternatives

Implicit matching by names or installed tools was rejected.

## Consequences

No task is eligible to invoke a tool.

## Security Implications

Capability bypass is prevented by keeping execution disabled.

## Migration Implications

No binding table or historical version is created.

## Future Extension Boundary

Bindings must pin capability, tool, operation, permission ceiling, and version constraints.

# ADR-0110: Local Tool Sandbox

Status: Deferred

Date: 2026-07-20

## Context

The repository has trusted developer scripts but no Agent tool containment boundary.

## Decision

Do not expose scripts or implement a nominal sandbox during a blocked sprint.

## Alternatives

Unrestricted shell, subprocess, filesystem, network, and environment access were rejected.

## Consequences

No Tool Adapter can run.

## Security Implications

Network and subprocess are unavailable because execution itself is unavailable.

## Migration Implications

No workspace or registered-resource schema is created.

## Future Extension Boundary

Require registered resources, isolated writes, path/symlink controls, limits, cancellation, and no-network defaults.

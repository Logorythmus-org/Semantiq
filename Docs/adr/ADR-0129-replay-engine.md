# ADR-0129: Replay Engine

Status: Deferred

Date: 2026-07-21

## Context

No immutable snapshots, checkpoints, packages, completed steps, or compatibility versions exist.

## Decision

Do not claim replay from current mutable or in-memory state.

## Consequences

Restart reconstruction and replay validation are not executable.

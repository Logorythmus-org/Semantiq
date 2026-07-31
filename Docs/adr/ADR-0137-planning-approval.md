# ADR-0137: Planning Approval

Status: Deferred

Date: 2026-07-21

## Context

Prompt 1 authorization and an immutable versioned Plan Package are absent.

## Decision

Infer no approval and create no mutable approval boolean.

## Consequences

No plan may be passed to Workflow Runtime until explicit approval is bound to its exact fingerprint and validity window.

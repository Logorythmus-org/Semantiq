# ADR-0116: Approval Gates

Status: Deferred

Date: 2026-07-20

## Context

Prompt 1 human authorization is absent and legacy approvals are mutable booleans inferred from text.

## Decision

Do not infer or grant workflow approval.

## Consequences

All workflow execution remains denied until immutable authorization-linked records exist.

# ADR-0034: Question Semantic Events

Status: Accepted

Date: 2026-07-13

## Context

Semantiq, Research, Agent, and Workflow runtimes will eventually consume semantic structure changes. Publishing the full context through the transactional outbox would duplicate potentially sensitive text and enlarge event contracts unnecessarily.

## Decision

Emit schema-version-1 `question.semantic_structure.created` and `question.semantic_structure.updated` events transactionally. Their payload contains only `questionId`, `semanticVersion`, and `changedBy`; correlation and causation metadata follow the existing event envelope. Consumers fetch the authoritative current structure or an authorized projection when needed.

Operational logs likewise contain identifiers, expected/new versions, result codes, correlation IDs, and duration only. They exclude semantic content, mutation reasons, and idempotency keys.

## Consequences

Events are stable, compact, and less likely to leak context. Consumers must handle fetch-after-event races through version-aware reads or future projections. Public current-state visibility remains aligned with the existing public Question read policy and is a deployment blocker until authentication and visibility rules are introduced.

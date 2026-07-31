# ADR-0023: Question Revision Model

Status: Accepted

Date: 2026-07-12

## Context

Question text and lifecycle must change without erasing prior state. Event sourcing is not part of the Phase A architecture, and current-state reads must stay simple.

## Decision

Keep current state in `questions` and append one immutable snapshot-delta row to `question_revisions` per successful mutation. Store previous/new text and status, resulting version, actor, time, operation, optional reason, and correlation ID. Enforce uniqueness by Question/version and reject database UPDATE/DELETE on revisions.

## Consequences

Current reads remain direct, history is explainable, and transactions can couple state/revision/outbox. Storage grows monotonically; retention, redaction, and legal deletion require later policy.

# ADR-0030: Question Relation Events

Status: Superseded in part by Phase B Prompt 7 closure

Date: 2026-07-13

## Context

Future graph consumers need a durable relation signal, while Question text, idempotency keys, and request bodies must not leak through events or logs.

## Decision

Emit schema-version-1 `question.relation.created` and `question.relation.removed` through the transactional outbox. Payloads contain relation identity, endpoints, type, responsible actor, and removal version where applicable. The aggregate type is `QuestionRelation`; correlation and optional causation remain envelope metadata.

The relation row, event, and optional idempotency response commit in one transaction. Event payloads and structured API logs exclude Question text and idempotency keys.

## Consequences

Consumers receive compact, stable graph signals and resolve authorized detail through read APIs. Future relation lifecycle events require explicit contracts and must not silently change schema version 1.

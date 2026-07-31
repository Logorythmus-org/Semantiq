# ADR-0026: Question Mutation Events

Status: Accepted

Date: 2026-07-12

## Context

Downstream runtimes need stable lifecycle signals, while full Question text and reasons are sensitive and can make events large.

## Decision

Emit schema-version-1 `question.updated`, `question.archived`, and `question.restored` events. Payloads contain only Question ID, revision ID, resulting aggregate version, and actor. Correlation/causation remains envelope metadata. Persist through the transactional outbox with Question and revision state.

## Consequences

Consumers can resolve authorized detail through dedicated reads. Event payloads remain compact and privacy-aware; future semantic/graph signals require separate contracts or schema versions.

# Phase B Prompt 2 Reuse Map

## Keep

- Prompt 1 create/get request and response compatibility.
- Shared ID generator, Clock, Result, application errors, and domain-event envelope.
- PostgreSQL pool, migration runner, transaction convention, outbox schema, idempotency schema, correlation headers, and API envelope.
- Historical core/network implementations for their existing consumers only.

## Adapt

- `Question`: add controlled text/status transitions and version increments.
- `QuestionRepository`: add compare-and-swap persistence.
- `QuestionUnitOfWork`: add focused revision repository and general Question events.
- API routing: add explicit update/archive/restore/history operations.
- Docker API entrypoint: wire migrations and the PostgreSQL-backed Question application.

## Add

- Immutable `QuestionRevision` snapshot-delta model.
- `question_revisions` table and migration 3.
- `question.updated`, `question.archived`, and `question.restored` events.
- Mutation commands/handlers and revision-history query.

## Deprecate for New Runtime

- Direct archive/update in `packages/core/src/application/services.ts` because it has no revision, compare-and-swap, or transactional outbox coupling.
- Legacy Question status models as sources for the authoritative runtime vocabulary.

## Remove

Nothing. Prompt 2 preserves compatibility and avoids unrelated cleanup.

# Phase B Prompt 2 Inputs

Authoritative package: `packages/questions`. Aggregate fields: ID, validated QuestionText, language, published status, source, optional creator, UTC timestamps, version. Creation emits `question.created` schema version 1 with compact payload and correlation/causation metadata. PostgreSQL table: `questions`; migration head: 2/questions. API contracts: `POST /api/v1/questions`, `GET /api/v1/questions/:id` and compatible `/questions` paths. Idempotency: optional `Idempotency-Key`, scoped and hashed in PostgreSQL; replay with same fingerprint returns the original view, conflict returns 409. Deferred: editing, archive, answers, relations, scoring, graph, AI, research, moderation, search, and collaboration.

Remaining conditions: persistent idempotency behavior is implemented for this create path but concurrent-key stress coverage remains; Docker API image remains infrastructure-only and local API uses the PostgreSQL-backed entrypoint.

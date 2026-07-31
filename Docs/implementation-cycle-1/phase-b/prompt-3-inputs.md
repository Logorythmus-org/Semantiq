# Phase B Prompt 3 Inputs

## Stable Prompt 2 Contract

- Authoritative package: `packages/questions`.
- Current state: Question row; append-only history: `question_revisions`.
- Lifecycle: `published <-> archived`; archived Questions cannot be edited.
- Immutable: ID, creator, createdAt, language, source.
- Mutable: text, status, updatedAt, version.
- Actor policy: creator-only mutation/history; current header context is local/trusted, not authentication.
- Concurrency: required expected version plus PostgreSQL compare-and-swap.
- Migration head: `3/question_lifecycle_revisions`.
- Events: `question.created`, `question.updated`, `question.archived`, `question.restored`, schema 1 through outbox.
- Idempotency: separate create/update/archive/restore scopes; normalized meaningful fingerprints; replay returns original state.
- API: create/get/update/archive/restore/revisions under `/api/v1/questions`.

## Prompt 3 Discovery Inputs

- `packages/question-network`: existing in-memory relation/network transitions and relation contracts; reference only until audited.
- `packages/question-intelligence`: suggested link/merge/fork/differentiate concepts; out of Prompt 2.
- `packages/core`: historical QuestionAggregate tied to workspace/knowledge/owner/profile and separate status vocabulary.
- `packages/graph-runtime`: Neo4j-era knowledge intelligence assumptions and tests.
- Existing parent/thread/reply models are not authoritative Question relations and require explicit Prompt 3 mapping.
- Compose includes Neo4j, but Prompt 2 did not integrate Question persistence with it.

## Files Prompt 3 May Modify

Question relation domain/application contracts, focused relation repositories/adapters/migrations, relation events/outbox integration, explicit relation API routes, relation tests/fixtures/benchmarks, graph compatibility adapters where proven necessary, and Prompt 3 documentation/ADRs.

## Files Prompt 3 Must Not Modify Without Critical Need

Question mutation/revision semantics, Prompt 1 create/get compatibility, authentication architecture, Semantiq, research, agents, workflow, moderation, answers/comments/votes, marketplace/wallet/federation, frontend, cloud, deployment, or CI/CD.

## Remaining Conditions

The trusted actor header must be replaced by authentication-backed context before deployment. Revision retention/redaction is unresolved. Prompt 3 must not encode graph relations inside the Question row or bypass versioned mutation/outbox contracts.

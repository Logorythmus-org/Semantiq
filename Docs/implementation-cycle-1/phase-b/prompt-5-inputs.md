# Phase B Prompt 5 Inputs

## Stable Question Runtime

- Authoritative package: `packages/questions`.
- Migration head: `5/question_semantic_structures`.
- Question text/lifecycle version, semantic version, and relation identity are independent concurrency domains.
- Question status remains `published <-> archived`.
- Prompt 3 relations remain immutable creation-only; no removal event exists.
- Graph storage remains PostgreSQL adjacency with depth/node/edge bounds.

## Stable Semantic Contract

- Optional one-to-one `QuestionSemanticStructure` by Question ID.
- Sections: context, assumptions, constraints, unknowns, uncertainty, scope, perspectives, open possibilities.
- Complete replacement only; expected version 0 creates version 1.
- Per-list limit 32, total limit 128, statement limit 500 Unicode characters.
- Uncertainty is declared qualitative input, not a score.
- Semantic revisions are immutable full snapshots from version 2.
- Archived Questions retain semantic state but reject writes.
- Current reads follow public Question policy; history is creator-only.
- Events: `question.semantic_structure.created|updated`, schema 1, compact payload.
- Idempotency scope: `question.semantic_structure.put`.

## Verified Baseline

- Host real-PostgreSQL suite: 152/152.
- Docker real-PostgreSQL suite: 152/152.
- Container coverage: 92.05% statements/lines, 81.64% branches, 94.78% functions.
- Question package coverage: 95.67% statements/lines, 85.16% branches, 98.63% functions.
- Docker API restart and PostgreSQL outage/recovery passed.
- No Critical or High security finding.

## Prompt 5 Discovery Decisions Required

Prompt 5 must declare which discovery dimensions are required: exact Question lookup, status/language filters, relation topology, semantic-field filters, text search, ordering, pagination, or projections. It must measure query plans before adding JSONB/GIN indexes, caches, search engines, embeddings, or vector stores.

Search results must not rank by semantic quality or uncertainty unless a future explicit contract supplies transparent user-controlled ordering. Visibility must filter Questions, semantic structures, graph nodes, and graph edges as one authorization boundary.

## Compatibility Boundaries

Do not mutate Prompt 1-4 event schema 1 payloads, mix Question and semantic versions, copy semantic content into outbox events/logs, import historical Question aggregates, or treat Question Intelligence/Semantiq suggestions as authoritative accepted state.

No cloud, deployment, frontend, external AI, automatic inference, scoring, answering, graph database, or vector database should be introduced unless Prompt 5 explicitly requires and justifies it.

## Security Inputs

- `x-actor-id` is trusted local context and blocks deployment.
- Current public semantic reads may expose sensitive context.
- Retention/erasure conflicts with append-only/no-delete policy remain unresolved.
- Consumer authorization and operational log retention remain unresolved.

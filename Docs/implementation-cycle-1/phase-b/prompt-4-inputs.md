# Phase B Prompt 4 Inputs

## Stable Runtime Contract

- Authoritative package: `packages/questions`.
- Migration head: `4/question_relations`.
- Question state: `published <-> archived`; relation creation does not change Question version or revisions.
- Relation state: immutable version 1 aggregate; no update/delete/archive lifecycle.
- Types: `emerges_from`, `refines`, `challenges`, `contradicts`, `depends_on`, `broadens`, `narrows`, `alternative_to`, `connects`.
- Symmetric: `contradicts`, `alternative_to`, `connects`.
- Inverse uniqueness: `A narrows B` equals `B broadens A`.
- Creation: distinct existing published endpoints; actor must be source creator.
- Existing relations survive endpoint archive and restore.
- Event: `question.relation.created`, schema 1, transactional outbox.
- Idempotency scope: `question.relation.create`.
- APIs: create/list relations and bounded graph view under `/api/v1/questions/{id}`.
- Bounds: page 100, depth 3, nodes 100, edges 500.
- Storage: PostgreSQL adjacency; no external graph database dependency.

## Compatibility Boundaries

- Do not import the historical Question aggregate from `packages/core` or `packages/question-network`.
- Do not treat AI relation suggestions as asserted relations.
- Do not embed relation IDs in Question rows.
- Do not change Question mutation/revision semantics, relation semantic identity, or event schema 1 without a critical issue and explicit ADR.
- Do not add Neo4j, cloud, deployment, frontend, Semantiq, research, agents, workflow, moderation, answers, comments, votes, federation, or marketplace work unless Prompt 4 explicitly requires it.

## Security Conditions

- `x-actor-id` remains trusted local context and blocks deployment until authentication supplies actor identity.
- Relation/graph reads follow public Question reads; future visibility must filter nodes and edges together.
- Immutable relation correction, retention, erasure, abuse controls, and moderation are unresolved.

## Verified Baseline

- Host real-PostgreSQL suite: 129/129.
- Docker real-PostgreSQL suite: 129/129.
- Docker coverage: 91.41% statements/lines, 81.14% branches, 93.72% functions.
- Question package coverage: 96.35% statements/lines, 85.92% branches, 98.63% functions.
- Docker restart and database outage/recovery passed.
- No Critical or High security findings.

## Prompt 4 Discovery Inputs

Prompt 4 may consume relation IDs, adjacency lists, graph views, or `question.relation.created` events through explicit contracts. It must declare whether it needs relation lifecycle, visibility, ranking, search, projection, or machine suggestions rather than extending Prompt 3 implicitly.

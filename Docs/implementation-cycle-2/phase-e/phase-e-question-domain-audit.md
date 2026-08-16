# Phase E Prompt 1 Question Domain Repository Audit

## Status

**Passed as static discovery; implementation blocked.** Question, post, thread, discussion, topic, comment, message, title, body, author, and draft artifacts were inspected.

## Candidate Classification

| Path                                                         | Existing purpose                                                                                           | Decision                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/questions`                                         | Authoritative Phase B Question domain/application contracts, relations, semantics, discovery, trust/safety | KEEP as sole owner                                             |
| `packages/persistence/src/questions.ts` and related adapters | PostgreSQL repositories, UoW, outbox, idempotency, revisions, relations, semantics, discovery, safety      | KEEP                                                           |
| `services/api` Question routes                               | Executable create/read/mutate/revision/relation/semantic/discovery/safety APIs                             | KEEP                                                           |
| `services/question`                                          | Static descriptor matching much of the real API                                                            | WRAP or replace only with executable service metadata later    |
| `packages/question-engine`                                   | Minimal incompatible `Question` with draft/open/investigating/resolved/archived                            | REMOVE after import validation                                 |
| `packages/question-network`                                  | Broad in-memory title/summary/scoring/search/recommendation model                                          | REMOVE from authoritative path; DEFER selected future concepts |
| `packages/question-intelligence`                             | AI/prompt-oriented suggestions and scoring contracts                                                       | DEFER; prohibited in this prompt                               |
| `packages/sprint2-runtime`                                   | Historical all-in-one Question/Semantiq/research demo                                                      | DEFER / historical only                                        |
| Uppercase `Docs/QUESTION_*`                                  | Broad historical product architecture                                                                      | DEFER; current code/contracts take precedence                  |
| Discussion/Research/Task models                              | Separate domain concepts                                                                                   | KEEP separate; do not alias as Questions                       |

## Existing Authoritative Capabilities

- validated multilingual `QuestionText`, language tags, source classification, creator identity, timestamps, and aggregate version
- create/get/update/archive/restore command/query handlers
- creator authorization, optimistic concurrency, mutation reasons, idempotency, and correlation/causation metadata
- immutable Question and semantic revision histories
- transactional outbox events with compact privacy-safe payloads
- typed relation aggregate, duplicate protection, lifecycle, bounded graph traversal, and adjacency reads
- semantic-ready context/assumption/constraint/unknown/uncertainty/scope/perspective structures
- cursor discovery/search/filtering, summaries/details, source references, reports, moderation boundary, trust signals, audit, redaction, rate limits, and health/runbooks
- PostgreSQL migrations 2-8 and extensive unit, contract, integration, API, security, restart, performance, and Docker evidence from Phase B

## Duplicate and Drift Findings

1. `question-engine` defines a second minimal status model with no production persistence or events.
2. `question-network` defines title/summary/description, draft state, scoring, recommendations, random IDs, and in-memory persistence that conflict with Phase B.
3. Prompt 1 largely reimplements Phase B while changing core content, lifecycle, relation, visibility, metadata, command, and event semantics.
4. Existing static service health is descriptive metadata and should not be confused with runtime readiness.

## Missing or Deferred Prompt Concepts

- title/body split and slug
- draft, locked, and deleted lifecycle
- explicit visibility value object
- typed metadata extension boundary
- publish, lock, delete, and explicit create-revision commands
- Parent/Child/Reference/Duplicate/Continuation/Alternative compatibility mapping
- Question-to-Runtime Kernel, Workflow, Planning, Agent, and Semantiq integrations

These are not safe gaps to fill inside a blocked sprint. Several conflict with accepted Phase B ADRs, event schema 1, immutable history, moderation/redaction boundaries, APIs, and stored data.

## Security and Data Integrity Findings

- A second aggregate could bypass creator/moderator access, optimistic concurrency, idempotency, rate limits, audit, source policies, and restricted-read behavior.
- Adding deletion without the accepted redaction boundary risks orphaning immutable revisions, relations, semantic records, reports, audit, and outbox events.
- Generic metadata could leak sensitive or unvalidated content into persistence/events/APIs.
- Relation remapping could change historical semantic identity or create duplicate edges.
- Title/body conversion cannot infer historical titles without fabricating data.

## Reuse Boundary

Future Phase E work should adapt the existing `QuestionApplication` and read contracts, not copy domain logic or access ORM tables. Any new facade must preserve Phase B ownership, event versions, migration history, authorization, idempotency, and API compatibility.

## Decision

Do not create `QuestionDomain` or modify `packages/questions`. Recover Phase D, then issue a focused compatibility decision before adding an application facade or versioned domain evolution.

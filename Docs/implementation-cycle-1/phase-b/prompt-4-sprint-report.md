# Implementation Cycle 1 - Phase B - Prompt 4 Sprint Report

## 1. Sprint Goal

Add an explicit, transactional, semantic-ready Question structure without implementing Semantiq, AI inference, scoring, search, or answer generation.

## 2. Result

Passed. Prompt 4 is implemented locally and ready for Prompt 5 input.

## 3. Source of Truth

The active `packages/questions` Question, revision, relation, and graph contracts were preserved. Historical semantic/profile prototypes were audited but not imported.

## 4. Prompt 3 Compatibility

The new brief's `QuestionRelationRemoved` summary conflicts with the creation-only Prompt 3 repository and ADRs. Repository truth was preserved; Prompt 4 makes no relation lifecycle change.

## 5. Aggregate Boundary

`QuestionSemanticStructure` is an optional one-to-one aggregate identified by Question ID. It is owned by the Question Runtime and versioned independently from Question text and relations.

## 6. Stable Sections

The complete structure contains context, assumptions, constraints, unknowns, declared uncertainty, scope inclusions/exclusions, perspectives, and open possibilities.

## 7. Human Authority

Every field is explicit accepted input. The runtime does not infer assumptions, assess truth, calculate uncertainty, rank Questions, or generate content.

## 8. Validation

Statements are whitespace-normalized, Unicode-safe, bounded to 500 characters, duplicate-free per list, and control-character checked. Lists are capped at 32 and the aggregate at 128 statements.

## 9. Uncertainty

Levels are `unspecified`, `low`, `medium`, and `high`. They are caller-declared qualitative labels. Any non-unspecified level requires explanatory statements.

## 10. Scope

Scope has separate inclusions and exclusions. Identical normalized statements cannot appear in both.

## 11. Empty State

An explicit all-empty structure with unspecified uncertainty is valid. No default or inferred semantic profile is created with a Question.

## 12. Ownership and Lifecycle

Only the Question creator may write or view semantic revision history. Current reads follow the existing public Question policy. Archived Questions retain readable structures and history but reject writes until restored.

## 13. Mutation Model

`PUT` performs a complete replacement. Creation requires expected semantic version 0; replacement requires the exact positive current version. Normalized no-ops and stale writes return conflicts.

## 14. Revision History

Every replacement writes an immutable before/after JSONB snapshot with actor, time, optional reason, correlation ID, and semantic version. Creation does not invent a revision.

## 15. Question Isolation

Semantic create/update never changes Question text, status, version, or Question revisions. Question archive/restore independently changes the Question version while retaining semantic state.

## 16. Persistence

Migration head is `5/question_semantic_structures`. Current and revision snapshots use validated PostgreSQL JSONB, restrictive foreign keys, no-delete current rows, and immutable revision rows.

## 17. Upgrade

A head-4 schema containing Questions and a relation upgraded to head 5 without data changes or synthetic semantic rows.

## 18. Transactions

Current state, revision, compact outbox event, and optional idempotency record commit atomically. Read transactions use repeatable-read/read-only mode; writes lock the Question against archive races and current semantic row against lost updates.

## 19. Idempotency

Scope is `question.semantic_structure.put`. Fingerprints include normalized complete structure, Question ID, expected version, actor, and normalized reason. Stored keys are hashed by the existing persistence layer.

## 20. Events

Schema-1 `question.semantic_structure.created` and `.updated` events contain Question ID, semantic version, and actor only. Semantic text and reasons are excluded.

## 21. API

Implemented `PUT/GET /api/v1/questions/{id}/semantic-structure` and creator-only `GET /semantic-structure/revisions`. Existing envelopes, correlation, causation, idempotency, error categories, and snake-case compatibility patterns are reused.

## 22. Local and Docker Wiring

Memory, local PostgreSQL, and Docker PostgreSQL runtime composition all include the semantic application and unit of work. No external semantic service is required.

## 23. Security

Zero Critical and High findings. Three Medium findings remain: trusted actor header, public-current visibility, and unresolved retention/erasure. Three Low governance/authorization/log-retention findings remain.

## 24. Testing

Prompt 4 added 23 focused tests. The complete suite passes 152/152 tests across 42 files on host and in the built Docker image with real PostgreSQL.

## 25. Coverage

Final container coverage is 92.05% statements/lines, 81.64% branches, and 94.78% functions. `packages/questions` is 95.67% statements/lines, 85.16% branches, and 98.63% functions.

## 26. Docker Lifecycle

Create/replay/update/read/history, archive preservation, blocked archived writes, restore, post-restore update, API restart persistence, database outage failure, and in-place recovery all passed.

## 27. Performance

Local semantic transactions measured about 12.6 ms create, 11.2 ms update, 4.1 ms read, and 5.2 ms history. API paths measured about 13.6, 13.7, 5.9, and 9.3 ms.

## 28. Architecture Drift

No historical aggregate, Semantiq code, AI detector, graph database, vector database, or scoring model was imported. Question and relation contracts remain stable.

## 29. Deferred Work

Partial patches, semantic item identity, deletion/erasure, visibility, collaboration permissions, moderation, search/query indexes, projections, inference, suggestions, scoring, embeddings, and external consumers are deferred.

## 30. Rollback Strategy

Application code can roll back while additive migration-5 tables remain unused. Database removal is forward-only through a reviewed migration and backup; direct destructive rollback is prohibited.

## 31. Definition of Done

- Explicit semantic contract: complete.
- Domain and application invariants: complete.
- PostgreSQL migration/repository/outbox/idempotency: complete.
- Local and Docker API: complete.
- Unit, contract, integration, API, security, regression, and coverage validation: complete.
- ADRs, backend docs, reports, and Prompt 5 handoff: complete.

## 32. Readiness Decision

Ready for Phase B Prompt 5 discovery and querying, subject to the documented authentication, visibility, and retention blockers before any deployment.

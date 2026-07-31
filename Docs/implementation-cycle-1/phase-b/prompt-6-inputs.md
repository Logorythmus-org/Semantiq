# Phase B Prompt 6 Inputs

Prompt 6 focus: Question provenance, moderation boundary, auditability, trust signals, abuse resistance, and runtime hardening. This file records current facts; it does not implement Prompt 6.

## Authoritative Runtime

- Package: `packages/questions`; persistence: `packages/persistence`; HTTP: `services/api`.
- Question identity is a bounded string; current state contains text, exact language, status, source, optional creator, timestamps, and optimistic version.
- Source vocabulary: `human`, `import`, `agent`, `system`.
- Lifecycle: `published <-> archived`; creator-only mutation/history; expected Question version required.
- Immutable Question revision records contain before/after text/status, change type, actor, time, optional reason, and correlation.
- Prompt 3 relations are immutable creation-only edges with controlled types and directed/symmetric semantics. There is no removal/status/moderation state.
- Prompt 4 `QuestionSemanticStructure` is optional one-to-one current state with immutable revisions and independent semantic version. Sections are context, assumptions, untyped constraints, unknowns, declared uncertainty, scope, perspectives, and possibilities.
- Semantic freshness baseline is `questionVersionAtLastUpdate`; stale means current Question version is greater.

## Discovery Contracts

- `QuestionSummaryView` and bounded `QuestionDetailView` are the stable read models.
- `ListQuestionsQuery`, `SearchQuestionsQuery`, `QuestionFilter`, and `QuestionReadRepository` are transport-neutral.
- Active-only default; exact actor/language/time/lifecycle, Frame, uncertainty, assumption/unknown, relation, neighbor, and text filters.
- Constraint type is reserved but rejected because no controlled domain taxonomy exists.
- Cursor: versioned query-bound keyset; default 20, maximum 100; sorts newest/oldest/recently-updated.
- Search: PostgreSQL normalized current-text substring search with `pg_trgm`; original text/revisions preserved; no ranking or semantic claims.
- One list/search request is one bounded SQL statement; no total count or N+1 query loop.

## Persistence Baseline

- Migration head: `6/question_discovery`.
- PostgreSQL validated: 16.14; `pg_trgm` 1.6.
- Core tables: `questions`, `question_revisions`, `question_relations`, `question_semantic_structures`, `question_semantic_revisions`, `outbox_events`, `idempotency_records`, `schema_migrations`.
- Prompt 5 indexes: `questions_discovery_newest_idx`, `questions_discovery_updated_idx`, `questions_discovery_creator_idx`, `questions_search_trigram_idx`, `question_semantic_uncertainty_level_idx`, and directional relation type/neighbor covering indexes.
- Existing primary, unique, created-time, adjacency, outbox, and idempotency indexes remain.
- Migration/data-survival tests preserve Question, revision, relation, semantic, outbox, and idempotency rows.

## Events, Outbox, and Idempotency

- Question events: `question.created`, `question.updated`, `question.archived`, `question.restored`.
- Relation event: `question.relation.created`; no removal event exists.
- Semantic events: `question.semantic_structure.created`, `.updated`.
- Events use schema version 1 with event ID/time, correlation ID, optional causation ID, compact payload, and transactional outbox persistence.
- Semantic text, mutation reasons, idempotency keys, and search text are excluded from event/log payloads.
- Creation, mutations, relation creation, and semantic replacement use scoped hashed idempotency records and request fingerprints. Discovery is read-only and has no idempotency record.

## Actor and Correlation Policy

- HTTP actor context comes only from `x-actor-id`; body actor fields do not grant authority.
- `x-actor-id` is trusted local upstream context, not authentication, and blocks untrusted deployment.
- Creator owns Question mutation and Question/semantic history; relation creation follows endpoint ownership policy.
- Current Question, graph, semantic current state, and discovery reads follow the existing public-read policy.
- Correlation IDs are bounded to 128 safe characters; optional causation and idempotency headers are bounded and sanitized.

## API and Error Baseline

- Current endpoints cover create/get/update/archive/restore/revisions, relation create/list/graph, semantic put/get/revisions, unified discovery, and bounded detail.
- Discovery parameters and envelopes are documented in `docs/backend/question-discovery-api.md`.
- Errors use stable validation, not-found, forbidden, conflict, and infrastructure categories. Unknown discovery failures become retryable `question_search_unavailable`; database errors are not exposed.
- Search logs exclude raw query/cursor and record only presence/length/filter names/count/duration/correlation/result.

## Verified Quality Baseline

- Host and built-image suites: 48/48 files, 179/179 tests.
- Host coverage: 92.52% statements/lines, 82.85% branches, 94.96% functions.
- Docker API restart recovery: about 3.23 s; PostgreSQL/API recovery: about 7.82 s.
- 10,000-row p95: first page 2.646 ms, relation type 3.893 ms, rare text 5.936 ms, no result 6.436 ms; zero benchmark errors.
- Query-plan watch item: `related_to` used relation indexes but scanned 10,000 Question rows, 5.713 ms locally.

## Security Findings for Prompt 6

- Zero Critical/High Prompt 5 implementation findings.
- Medium: unauthenticated public discovery/visibility policy; no per-actor/IP rate limit; trusted actor/creator enumeration boundary.
- Low: relation enumeration; timing/result-cardinality telemetry; search-normalization collisions; unresolved query/log retention.
- Missing policies: visibility/workspace tenancy, moderator roles, report/appeal lifecycle, provenance integrity, source verification, legal erasure/redaction, audit retention/access, abuse throttling, and downstream consumer authorization.

## Existing Moderation, Provenance, Audit, and Trust Code

No moderation, report, provenance record, audit log, trust score, reputation, rate limiter, or abuse model is composed into the authoritative Question Runtime.

Repository concepts that must be audited before reuse:

- `packages/question-network`: historical `QuestionModerationCase`, flags/audit IDs; incompatible Question model.
- `packages/identity`: generic in-memory authorization/audit contracts; not wired to Question API.
- `packages/community-engine`: generic trust/reputation/moderation-policy records; no Question persistence integration.
- `packages/civilization-os`, `packages/data-platform`, `packages/evidence`: generic provenance/source concepts; separate domains.
- `services/auth`, `services/gateway`, `services/federation-gateway`: README/scaffold claims for auth/audit/rate limiting; not operational Question controls.
- marketplace moderation route metadata and alpha-runtime incident/audit concepts: separate scaffold/runtime scope.

Prompt 6 must classify these KEEP/ADAPT/DEFER rather than importing incompatible scoring or trust models.

## Files Prompt 6 May Modify

- `packages/questions/src/domain.ts`, application/contracts/memory modules, and new narrowly scoped provenance/moderation/audit modules
- relation, semantic, and discovery modules only where visibility/moderation filtering requires a proven compatibility change
- `packages/persistence/src/migrations.ts`, Question repositories/unit-of-work, and new authoritative persistence modules
- `services/api/src/server.ts`, local/Docker composition, and Question route metadata
- focused tests, local benchmark fixtures, backend docs, ADRs, and Phase B sprint artifacts
- configuration only for bounded local hardening controls proven necessary

## Files/Areas Prompt 6 Must Not Materially Implement

- Semantiq scoring or truth judgment
- Research evidence validation/runtime
- Agent or Workflow runtime behavior
- AI moderation, LLM calls, embeddings, vector/hybrid search
- reputation/trust scoring imported from community/federation scaffolds
- marketplace, federation, frontend/desktop, cloud, deployment, or CI/CD
- unrelated legacy Question aggregate rewrites

## Required Decisions and Blockers

1. Define authentication/upstream actor trust and workspace/visibility policy before exposing discovery.
2. Define provenance as factual origin metadata without equating source with truth.
3. Define moderation/report/appeal states and whether archival is distinct from restriction.
4. Define immutable audit events versus redactable sensitive content and retention/erasure obligations.
5. Define abuse-rate limits and enumeration controls for list/search/relation endpoints.
6. Decide whether relation/semantic content needs independent moderation visibility.
7. Resolve or explicitly defer controlled constraint taxonomy; do not infer it in moderation/search.
8. Preserve current event schema compatibility or version any new contract explicitly.

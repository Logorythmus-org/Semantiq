# Phase B Prompt 5 Sprint Report

## 1. Executive Summary

Status: Partially passed. A local PostgreSQL Question discovery/read layer, cursor pagination, structured filters, multilingual substring search, API, indexes, benchmarks, Docker lifecycle, and documentation are complete. Controlled `constraint_type` filtering failed because Prompt 4 stores untyped constraint strings and defines no taxonomy.

## 2. Inputs Reviewed

Status: Passed. Actual Prompt 1-4 reports, code, schema, API, tests, Docker wiring, backend docs, search scaffolds, pagination primitives, indexes, and error/log contracts were reviewed.

## 3. Missing Inputs

Status: Partially passed. Five requested backend files were absent; actual Prompt 4 semantic documents were used. No controlled constraint type, uncertainty category, or relation removal/status model exists.

## 4. Prompt 1-4 Compatibility

Status: Passed. Create/get, mutation/revisions/concurrency, relation/graph, semantic structure/history, events, outbox, idempotency, and lifecycle regression tests remain green.

## 5. Existing Discovery and Search Audit

Status: Passed. Repository-wide audit found legacy in-memory question-network search/feed, generic search/graph ports, a metadata-only search service, and shared page-number pagination, but no compatible operational Question discovery stack.

## 6. Existing Code Reused

Status: Passed. Active domain types, semantic/relations models, PostgreSQL client/migrations, API envelopes/errors/correlation, local/Docker composition, and test infrastructure were adapted.

## 7. Deprecated or Conflicting Search Code

Status: Passed (documented). `packages/question-network` is an incompatible historical model and is classified DEPRECATE; generic `packages/search`/`services/search` remain non-operational future scaffolds.

## 8. Database Search Capabilities

Status: Passed. PostgreSQL 16.14 supplies local `pg_trgm` 1.6; migration 6 installs it. No external search, tsvector, vector, or graph database is required.

## 9. Read Model Architecture

Status: Passed. Logical command/query separation uses the same transactional database and transport-neutral package contracts; no distributed CQRS infrastructure was added.

## 10. QuestionSummaryView

Status: Passed. It exposes efficient current Question, Frame flags, component-presence flags, uncertainty level, and one-hop relation count without histories or persistence internals.

## 11. QuestionDetailView

Status: Passed. It adds bounded Frame counts/freshness and relation count/types, while leaving semantic text, revisions, edges, and graph traversal to explicit endpoints.

## 12. Pagination Strategy

Status: Passed. Versioned opaque keyset cursors replaced offset pagination for primary discovery; no total count is calculated.

## 13. Stable Ordering

Status: Passed. Every mode uses timestamp plus Question ID tie-breaker: newest, oldest, or recently updated.

## 14. Cursor Contract

Status: Passed. Base64url version-1 cursors contain controlled sort, timestamp, ID, and normalized-query hash; malformed, oversized, non-canonical, mismatched, and tampered cursors fail closed.

## 15. Pagination Limits

Status: Passed. Default is 20, maximum is 100, and invalid limits are rejected.

## 16. Question Filter Model

Status: Partially passed. Typed lifecycle, actor, time, language, Frame, assumption, unknown, uncertainty, relation, and text fields exist. Constraint type is reserved but unavailable upstream.

## 17. Filter Composition

Status: Passed. Named filters compose with AND only; arbitrary boolean/field/SQL syntax is rejected.

## 18. Lifecycle Filtering

Status: Passed. Active is default; archived and all are explicit.

## 19. Creator Filtering

Status: Passed. Exact bounded actor identifier matching is implemented without fuzzy identity inference.

## 20. Time Filtering

Status: Passed. Inclusive created/updated bounds require ISO 8601 timezone and reject inverted ranges.

## 21. Language Filtering

Status: Passed. Exact stored language tag matching is implemented; language is never inferred.

## 22. Frame Presence Filtering

Status: Passed. Database joins implement `has_frame=true|false` without application loading.

## 23. Frame Freshness Filtering

Status: Passed. Existing Frames compare Question version with persisted Question version at the last semantic update; no-Frame semantics are explicit.

## 24. Assumption Presence Filtering

Status: Passed. PostgreSQL JSONB array length evaluates current assumptions in the query.

## 25. Unknown Presence Filtering

Status: Passed. PostgreSQL JSONB array length evaluates current unknowns in the query.

## 26. Uncertainty Type Filtering

Status: Passed with repository vocabulary. `uncertainty_type` maps exactly to Prompt 4's controlled declared levels `unspecified|low|medium|high`; no synonym expansion occurs.

## 27. Constraint Type Filtering

Status: Failed. Prompt 4 constraints are untyped strings. The API returns stable `question_constraint_filter_invalid`; no taxonomy or text inference was fabricated.

## 28. Relation Type Filtering

Status: Passed. Participation means an incoming or outgoing persisted relation of the exact controlled type; all Prompt 3 relations are active because no removal lifecycle exists.

## 29. Related-to Filtering

Status: Passed. One-hop neighbor, optional type, and incoming/outgoing/both semantics, including symmetric relation behavior, are implemented.

## 30. Text Search Strategy

Status: Passed. A generated normalized current-text column plus parameterized escaped substring `LIKE` and GIN trigram index provide local database search.

## 31. Multilingual Search Behavior

Status: Passed. English case, German umlauts/case, Persian variants, Unicode, punctuation, and mixed text were exercised without linguistic claims.

## 32. Persian Search Behavior

Status: Passed within documented limits. Arabic/Persian yeh/kaf, ZWNJ/NBSP, NFKC, whitespace, and tatweel are normalized only for search; digits/diacritics/transliteration are not folded.

## 33. Search Normalization

Status: Passed. JavaScript and SQL implement the same deterministic normalization while preserving original Question text and revisions.

## 34. Search Result Ordering

Status: Passed. Search uses controlled chronological keyset ordering, not implicit database order.

## 35. Search Ranking Boundary

Status: Passed. No relevance score, Semantiq score, quality, recommendation, popularity, engagement, or personalized rank exists.

## 36. Search Query Model

Status: Passed. `SearchQuestionsQuery` composes optional normalized text with the typed filter, sort, cursor, limit, and correlation contract.

## 37. Controlled Sort Modes

Status: Passed. Only `newest`, `oldest`, and `recently_updated` are accepted.

## 38. Query Validation

Status: Passed. Allowlist, uniqueness, types, enums, lengths, controls, timestamps, ranges, identifiers, limit, cursor, and incompatible Frame combinations are validated centrally.

## 39. Empty Search Behavior

Status: Passed. Missing or normalization-empty `q` performs deterministic listing with the remaining filters; unsafe control-only values are rejected.

## 40. Read Repository

Status: Passed. Memory and PostgreSQL implementations satisfy summary, detail, exists, list, and search contracts.

## 41. Query Composition

Status: Passed. PostgreSQL builds only controlled fragments and binds every user value; API code never constructs ORM/SQL predicates.

## 42. N+1 Prevention

Status: Passed. Collection discovery is one SQL statement; candidates are bounded before one lateral relation-count aggregation per row inside that statement.

## 43. Relation Count Semantics

Status: Passed and documented. Count is the number of persisted edges where the Question is source or target. Prompt 3 forbids self-edges and has no removed state.

## 44. Read Consistency

Status: Passed. Reads query committed authoritative tables with no projection lag. HTTP pages do not promise a cross-request snapshot under concurrent mutation.

## 45. Search Index Strategy

Status: Passed. Status/order, creator/order, update/order, trigram, uncertainty, and directional relation covering indexes were added with measured purposes.

## 46. Index Cost Review

Status: Passed. Seven new indexes total about 10.3 MB at 10,000 Questions; trigram is 6.2 MB. Speculative assumptions/unknowns JSONB indexes were rejected pending scale evidence.

## 47. Database Migration

Status: Passed. Head `6/question_discovery` installed extension/function/generated column, backfilled Frame baseline, constraints, and indexes transactionally.

## 48. Search Synchronization

Status: Passed. Generated `search_text` changes in the Question update transaction; no queue, worker, lag, or repair process is required.

## 49. Current-State Search Behavior

Status: Passed. Current Question text is searchable, superseded text is absent, and immutable revision data survives.

## 50. Archived Search Behavior

Status: Passed. Archived rows are excluded by default, explicitly discoverable with archived/all, and immediately reappear after restore.

## 51. Relation-Aware Discovery

Status: Passed. Type/direction/neighbor filters and relation summary compose with text and Frame predicates at one hop.

## 52. Frame-Aware Discovery

Status: Passed. Presence, freshness, assumptions, unknowns, and declared uncertainty operate over the current semantic structure.

## 53. Query Complexity Limits

Status: Passed. Query 200, cursor 512, page 100, fixed allowlist/AND, one hop, no total count, pool bounds, and statement timeout constrain work.

## 54. API Contracts

Status: Passed. Unified `GET /api/v1/questions` and bounded `GET /api/v1/questions/{id}/detail` use existing envelopes/correlation behavior.

## 55. Error Contracts

Status: Passed. Validation/not-found errors are stable; unknown repository failures are retryable sanitized `question_search_unavailable` without SQL details.

## 56. Unit Test Results

Status: Passed. Five Prompt 5 unit tests passed; full unit regressions are included in 179/179.

## 57. Repository Contract Test Results

Status: Passed. Two discovery repository contract tests passed for memory and normalized behavior; existing repository contracts remain green.

## 58. Database Integration Results

Status: Passed. Nine new real PostgreSQL tests plus all existing database suites passed, including head-5 upgrade/data survival and rollback/error paths.

## 59. Pagination Correctness Results

Status: Passed. Multi-page, timestamp collision, tie-break, no-duplicate, end-of-results, malformed/tampered/query-mismatch, and limit cases passed.

## 60. Multilingual Search Results

Status: Passed. English, German, Persian, Persian/Arabic variants, and update behavior passed on real PostgreSQL and Docker HTTP.

## 61. Search Update Results

Status: Passed. Old text stopped matching, new text matched immediately, and the prior text remained in immutable revisions.

## 62. API Integration Results

Status: Passed. Four in-memory and three real PostgreSQL Prompt 5 API tests passed; full API regressions passed.

## 63. Security Test Results

Status: Passed. Four new security tests covered literal hostile input, limits/controls/cursors/enums, raw log privacy, and sanitized infrastructure failures.

## 64. Benchmark Dataset

Status: Passed. Deterministic destructive tiers of 100, 1,000, and 10,000 Questions included EN/DE/FA text, 50% Frames, and 4,999 relations at the largest tier.

## 65. Query Plan Analysis

Status: Passed with watch item. Representative plans use intended indexes; `related_to` scans 10,000 Question rows after indexed edge lookup and remains 5.713 ms locally.

## 66. Performance Baseline

Status: Passed. At 10,000 rows, first-page p95 was 2.646 ms, relation filter 3.893 ms, rare search 5.936 ms, no-result search 6.436 ms, and all benchmark operations had zero errors.

## 67. Docker Discovery Lifecycle Results

Status: Passed. Image build/start/migration, representative HTTP data, 26 lifecycle assertions, and 179 container tests passed.

## 68. Restart Persistence Results

Status: Passed. API recovery took about 3.23 s and PostgreSQL/API recovery about 7.82 s; critical multilingual, Frame, relation, and archive queries remained consistent.

## 69. Security Findings

Status: Partially passed for deployment. Zero Critical/High; three Medium and four Low residual findings concern public visibility/auth context, rate limits/enumeration, retention/metadata, and normalization boundaries.

## 70. Search Privacy Boundary

Status: Passed. Logs exclude raw/normalized query and cursor; Docker saw 37 discovery telemetry events and zero occurrences of a private query marker.

## 71. Future Search Evolution Boundary

Status: Passed. Relational truth versus future full-text/vector/graph/hybrid/Semantiq/Research/Agent augmentation is documented without speculative implementation.

## 72. Refactoring Performed

Status: Passed. Query validation, sort options, cursor logic, normalization, read models, and SQL composition are centralized; direct API SQL and N+1 paths were avoided. Unrelated legacy packages were not rewritten.

## 73. Remaining Technical Debt

Status: Documented. Define typed constraint semantics; settle relation removal/status; deprecate legacy question-network/search ownership; add authenticated visibility/rate limits; revisit related-to plans at larger scale; define retention/erasure and cursor snapshot expectations.

## 74. Known Failures

Status: One acceptance failure. `constraint_type` is unavailable and rejected. Two Docker fixture harness mistakes were corrected and are not product failures. No automated/runtime failure remains.

## 75. Acceptance Criteria Status

Status: Partially passed. All audit/read/list/search/performance/security/local criteria passed except functional controlled constraint-type filtering. The sprint cannot honestly be marked fully passed.

## 76. Inputs for Prompt 6

Status: Passed. `prompt-6-inputs.md` records aggregate/lifecycle/revision/relation/Frame/discovery contracts, migration/indexes/events/outbox/idempotency/API/errors/security/performance, existing moderation/provenance/audit concepts, modification boundaries, and blockers.

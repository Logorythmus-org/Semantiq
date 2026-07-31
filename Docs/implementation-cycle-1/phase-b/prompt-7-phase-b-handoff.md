# Phase B - Question Runtime Handoff

## 1. Phase Status

Implementation Cycle 1 Phase B is complete with a conditional handoff.

## 2. GO / CONDITIONAL GO / NO-GO

**CONDITIONAL GO.** No critical integrity, migration, transaction, privacy, Docker, or snapshot blocker remains. Durable authentication/capabilities and distributed throttling remain owned conditions for any untrusted or multi-instance deployment.

## 3. Final Question Runtime Architecture

`packages/questions` domain/application, `packages/persistence` PostgreSQL, and `services/api` HTTP composition. PostgreSQL is authoritative and Semantiq-independent.

## 4. Domain Model Map

Question, immutable revisions, typed relations, semantic structure/Frame, discovery read models, provenance, reports, moderation, audit, and observable trust signals.

## 5. Question Aggregate

Identity, multilingual text, language, source, creator, published/archived status, timestamps, and optimistic version.

## 6. Revision Model

Every controlled text/lifecycle mutation writes an immutable versioned revision in the same transaction.

## 7. Lifecycle

Create, update, archive, and restore are validated, idempotent where keyed, and CAS protected.

## 8. Question Relations

Ten controlled types including `follow_up`; directed/symmetric canonical identity; active/removed lifecycle; compact events.

## 9. Question Graph

PostgreSQL adjacency traversal, breadth-first, cycle terminating, privacy filtered, maximum depth 3/nodes 100/edges 500.

## 10. Question Frame

One semantic structure per Question, partial content allowed, independent version/revisions, creator-owned mutation.

## 11. Semantic Components

Context, assumptions, constraints, unknowns, uncertainty, scope, perspectives, and open possibilities. Snapshot component IDs are stable content-addressed identifiers.

## 12. Frame Freshness

Fresh when `questionVersionAtLastUpdate` equals Question version; Question updates make it stale until the Frame is updated.

## 13. Semantic Snapshot

Schema 1.0 strict allowlist at `GET /questions/{id}/semantic-snapshot`; deterministic from committed Question/Frame state.

## 14. Discovery and Search

Deterministic cursor pages, lifecycle/Frame/relation/time/language filters, and normalized English/German/Persian substring search. No semantic ranking.

## 15. Provenance

Typed user-declared source references with normalized locator, lifecycle, explicit classification, bounds, duplicate protection, and events.

## 16. Audit

Append-only, bounded, indexed records; core outbox projection and safety writes are transactionally coupled.

## 17. Reports

Controlled non-verdict reasons, duplicate protection, reporter-private lifecycle, withdraw support, and moderation linkage.

## 18. Moderation

Capability-gated cases/actions with `clear`, `under_review`, and `discovery_restricted` state separate from Question lifecycle.

## 19. Trust Signals

Observable counts, attribution, Frame freshness, relation count, and moderation state only. No truth or opaque score.

## 20. Rate Limits and Runtime Limits

Bounded content/queries/graphs plus local fixed-window operation limits. Distributed limits are deferred.

## 21. Event Catalog

See `Docs/backend/question-runtime-event-catalog.md`; all events are schema version 1 and transactional-outbox backed.

## 22. API Catalog

See `Docs/backend/question-runtime-api-catalog.md`.

## 23. Error Catalog

See `Docs/backend/question-runtime-error-catalog.md`.

## 24. Primary Database Schema

PostgreSQL 16 tables for Questions, revisions, relations, semantic current/revisions, sources, reports, cases/actions/state, audit, outbox, idempotency, and migration ledger.

## 25. Migration Head

Version 8, `question_runtime_closure`; one linear head.

## 26. Transaction Matrix

All rows passed; see `prompt-7-transaction-matrix.md`.

## 27. Idempotency Matrix

All command scopes replay exactly and reject changed fingerprints; see `prompt-7-idempotency-matrix.md`.

## 28. Concurrency Matrix

One winner, stable loser conflict, no duplicate revision/event/partial state; see `prompt-7-concurrency-report.md`.

## 29. Test Results

Host 52 files/192 tests passed with PostgreSQL. Five consecutive full runs passed. Coverage: 90.00% lines/statements overall.

## 30. Docker Results

Image, startup, health, 192 container tests, backend/database restart, and named-volume persistence passed.

## 31. Performance Baseline

10k Questions/7.5k revisions/29,991 relations/5k Frames plus safety data; zero errors, largest p95 4.097 ms among final discovery cases.

## 32. Security Status

No critical local finding. Trusted header actor context is a high-severity deployment condition outside local boundaries.

## 33. Privacy Status

Restricted discovery/exact/graph/snapshot paths and report/internal data gates passed. No authored content in logs/events.

## 34. Known Limitations

No production authentication, distributed limiter, semantic ranking, deletion/redaction automation, appeals, or retention automation.

## 35. Technical Debt

Owners: Identity Runtime for authentication/capabilities; platform infrastructure for distributed throttling; governance for retention/redaction/appeals; Question Runtime for graph query batching if measured.

## 36. Deprecated Paths

Two conceptual ownership areas remain deprecated/non-authoritative: legacy question-network/search implementations outside the package and broad scaffold services. No consumer was silently broken.

## 37. Compatibility Shims

Six classes remain: alternate base paths, snake_case mutation versions, snake_case relation target, `types` relation filter, `uncertaintyType` Frame naming, and legacy environment aliases.

## 38. Semantiq Input Contract

Consume snapshot schema 1.0 by ID/version; treat content as human-authored and freshness explicitly.

## 39. Semantiq Safety Boundary

Read-only authorized consumption. No Question mutation, truth claim, hidden report/audit access, or persistence of inferred scores into Question Runtime.

## 40. Files Phase C May Modify

New Semantiq-owned packages/services/tests/docs and explicit adapters that depend on exported Question snapshot contracts.

## 41. Files Phase C Must Not Modify

Question aggregates, migrations 1-8, Question ownership/security rules, outbox schemas, and snapshot schema 1.0 without a separately reviewed compatibility migration.

## 42. Recommended Phase C First Slice

Implementation Cycle 1 Phase C - Semantiq Runtime Prompt 1 - Semantiq Domain Audit and Question Evaluation Vertical Slice: consume one authorized snapshot, produce an explainable external evaluation record, and never mutate Question truth/state.

## 43. Rollback and Recovery Notes

Revert application consumers before schema rollback. Migration 8 is additive and preserves prior active relations; removed rows can be read from backup but must not be physically deleted. Restore PostgreSQL named volume/backup, run migrations to head, then verify `/ready`, exact Question, snapshot, outbox, and audit counts.

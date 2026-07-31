# Phase B Prompt 2 Sprint Report

## 1. Executive Summary

Passed. Prompt 2 adds controlled text update, archive/restore, immutable revisions, optimistic concurrency, mutation idempotency, compact events, revision history, real PostgreSQL atomicity, Docker runtime wiring, restart recovery, and actual performance/security evidence without entering Prompt 3 scope.

## 2. Inputs Reviewed

Passed. Prompt 1 sprint/domain/schema/handoff artifacts, authoritative Question code, migration head 2, persistence, API, tests, Docker, and Phase A transaction/security rules were reviewed.

## 3. Missing Inputs

The exact Prompt 1 audit/reuse/manifest/test/Docker/performance/security/scope filenames expected by Prompt 2 were absent. Available consolidated Prompt 1 reports, code, and executable tests supplied sufficient evidence; missing files were not fabricated.

## 4. Prompt 1 Compatibility Status

Passed. Create/get contracts and `published` initial state remain valid. Existing migration-2 data survives migration 3.

## 5. Existing Mutation and History Audit

Passed. Historical direct mutation in core/network packages was classified as non-authoritative; no reusable production revision implementation existed.

## 6. Existing Code Reused

Shared IDs, Clock, Result/errors/events, PostgreSQL pool/migrations/UoW, outbox, idempotency, correlation, API envelope, Docker/Compose, and test harness.

## 7. Deprecated or Conflicting Code

Direct archive-by-object-spread in `packages/core` is deprecated for new runtime work. Historical status vocabularies remain for existing consumers and were not removed.

## 8. Question Mutability Policy

Passed. Mutable: text, status, updatedAt, version. Immutable: ID, creator, createdAt, language, source.

## 9. Question Revision Model

Passed. Immutable snapshot-delta with previous/new text/status, resulting version, actor, operation, time, optional reason, and correlation.

## 10. Revision Identity

Passed. Uses the Phase A UUID generator and normal ID validation.

## 11. Aggregate Versioning

Passed. Version starts at 1 and increments exactly once for each successful mutation.

## 12. Lifecycle States and Transitions

Passed. `published -> archived -> published`; archived Questions cannot be edited.

## 13. Actor Policy

Passed for local scope. Only creator may mutate or read full history. `x-actor-id` is trusted upstream context, not authentication.

## 14. UpdateQuestion Command

Passed. Includes Question ID, normalized text, expected version, actor, optional reason/idempotency, and correlation/causation.

## 15. UpdateQuestion Handler

Passed. One UoW transaction couples CAS state, revision, outbox, and idempotency.

## 16. QuestionUpdated Event

Passed. `question.updated`, schema 1, compact payload without full text.

## 17. ArchiveQuestion Command

Passed. Explicit command with expected version and creator policy; no DELETE behavior.

## 18. QuestionArchived Event

Passed. `question.archived`, schema 1.

## 19. RestoreQuestion Command

Passed. Explicit archived-to-published transition.

## 20. QuestionRestored Event

Passed. `question.restored`, schema 1.

## 21. Revision Persistence

Passed. `question_revisions`, unique Question/version, FK restrict, deterministic reads, immutable trigger.

## 22. Database Migration

Passed. Head `3/question_lifecycle_revisions`; applies from zero and from Prompt 1 head 2 while preserving representative Persian data.

## 23. Repository Contract Changes

Passed. Added `saveWithExpectedVersion` and focused revision add/list contract.

## 24. Unit-of-Work Atomicity

Passed. Question, revision, event, and idempotency commit together. Five injected failure stages and real rollback leave no partial mutation.

## 25. Idempotency Integration

Passed. Update/archive/restore replay returns the original view without duplicate revision/event; conflicting fingerprints return 409.

## 26. Revision History Query

Passed. Creator-only ascending history with current version and no outbox/internal metadata.

## 27. API Contracts

Passed. PATCH, archive POST, restore POST, and revisions GET are implemented under `/api/v1/questions` and compatibility paths.

## 28. Error Contracts

Passed. Stable validation/not-found/forbidden/no-change/lifecycle/version/idempotency/infrastructure errors with sanitized bodies.

## 29. Correlation and Logging

Passed. Correlation/causation are bounded and propagated. Structured mutation logs exclude text, reason, idempotency key, secrets, and raw DB errors.

## 30. Unit Test Results

Passed. 42 focused unit/contract tests pass; the full real suite totals 106 passing tests across 30 files. Domain and five failure-injection cases pass.

## 31. Contract Test Results

Passed. CAS, revision uniqueness/order, and transaction rollback contracts pass.

## 32. Database Integration Results

Passed. Eight real PostgreSQL tests pass on host and in the image.

## 33. Concurrency Test Results

Passed. Competing version-1 updates yield one version-2 winner, one conflict, one revision, and one event.

## 34. Migration Test Results

Passed. Fresh chain, head-2 upgrade, one head, schema/constraint/trigger, and existing-data survival pass. Downgrade is forward-only by policy.

## 35. API Integration Results

Passed. Memory and real PostgreSQL API suites cover success, validation, Unicode, no-op, lifecycle, replay/conflict, access, and stable errors.

## 36. Security Test Results

Passed. Six dedicated security tests plus API boundary checks pass. Full real-suite coverage is 90.92% statements/lines, 79.69% branches, and 92.69% functions.

## 37. Docker Lifecycle Results

Passed. Image build, migration, full v1-to-v5 lifecycle, outbox, safe logs, and the complete 106-test real coverage suite pass inside the final image.

## 38. Restart Persistence Results

Passed. Backend restart and database restart preserve version/history. During DB stop API remains alive with readiness 503 and recovers to 200 without its own restart.

## 39. Performance Baseline

Passed. Update atomic commit 5.391ms, archive 4.463ms, restore 4.054ms, history-100 5.188ms, and PATCH API 12.347ms in the recorded local run.

## 40. Security Findings

No Critical/High. Two Medium limitations: trusted-header identity is not authentication, and historical text requires future legal retention/redaction policy.

## 41. Refactoring Performed

Split the authoritative package into domain/contracts/application/memory modules, centralized mutation flow/version conflicts/actor policy/revision/event creation, and wired one real API bootstrap for local/Docker persistence.

## 42. Revision Growth Considerations

Append-only with no pruning, merge, rewrite, or retention in Prompt 2. Storage growth, export, redaction, and legal erasure are deferred.

## 43. Remaining Technical Debt

Authentication-backed actor context, creatorless-Question migration policy, statistical/load benchmarks, retention/redaction, and removal of deprecated historical mutation paths after consumer migration.

## 44. Known Failures

The first database-restart validation crashed on an unhandled idle pool error. This was fixed with a safe pool listener and configured timeouts; the mandatory restart flow then passed. No known failing acceptance test remains.

## 45. Acceptance Criteria Status

Passed for Prompt 2 local scope. No permanent deletion, graph/relations, semantic context, moderation, AI rewriting, frontend, cloud, GitHub, deployment, or CI/CD operation occurred.

## 46. Inputs for Prompt 3

See `prompt-3-inputs.md`: final aggregate/revision/lifecycle/concurrency contracts, migration head 3, events, repositories, APIs, tests, performance/security evidence, graph-code audit, file boundaries, and remaining limitations.

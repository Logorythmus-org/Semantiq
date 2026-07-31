# Phase B Prompt 1 Sprint Report

## 1. Executive Summary

Partially passed. The minimal Question vertical slice is implemented: validate, create, persist, emit `question.created`, persist outbox/idempotency, commit, return, and retrieve. Host and real PostgreSQL integration pass. Docker infrastructure health passed during Phase A recovery, but the Docker image does not expose the Question application wiring and remains limited to Phase A health/readiness.

## 2. Phase A Gate Result

Conditional GO. Conditions were reviewed: real PostgreSQL is available and tested for this slice; persistent idempotency is used in the Question path; Docker health remains TCP-level and the image is intentionally minimal.

## 3. Inputs Reviewed

Phase A validation-recovery final decision/master report/handoff, backend runbook/readiness/testing/persistence docs, shared config/persistence packages, existing Question packages, services, tests, and migration descriptors.

## 4. Existing Question Implementations

The large `packages/core` QuestionAggregate and `question-engine` interface remain legacy compatibility/reference implementations. `packages/questions` is now authoritative for the minimal slice. The question service descriptor now advertises only the implemented POST and GET routes; future routes are not implemented.

## 5. Existing Code Reused

Phase A IDs, Clock, Result, errors, PostgreSQL client/pool, migration runner, UoW conventions, outbox table, idempotency table, API envelopes, correlation IDs, and test harness.

## 6. Domain Decisions

The first Question has text, language, published status, source, optional creator, timestamps, version, and ID. Identical text may create separate questions; idempotency keys prevent repeated command submission. No title/body split or semantic scoring is introduced.

## 7. Question Aggregate

Passed. `packages/questions/src/index.ts` provides controlled creation/restoration, identity, invariant checks, view mapping, and one pending creation event.

## 8. QuestionText

Passed. Text is trimmed/space-normalized, Unicode-preserving, bounded to 10–2000 characters, and rejects control characters.

## 9. Question Status

Passed. Initial and only current status is `published`; lifecycle states are deferred.

## 10. QuestionCreated Event

Passed. Stable type `question.created`, schema version 1, compact payload, aggregate ID, and correlation/causation metadata.

## 11. CreateQuestion Command and Handler

Passed. Handler validates, generates ID, uses injected Clock, persists Question/outbox/idempotency within one UoW, commits, and returns Result.

## 12. GetQuestionById Query and Handler

Passed. ID validation, explicit read transaction, not-found Result, and stable view mapping are implemented.

## 13. Question Repository Contract

Passed. Focused add/getById/exists contract.

## 14. PostgreSQL Repository

Passed. `PostgresQuestionRepository` uses parameterized SQL and explicit mapping.

## 15. Persistence Mapping

Passed. ID, text, status, language, source, creator, UTC timestamps, and version round-trip.

## 16. Database Migration

Passed. Migration `2/questions` applies after Phase A head and from zero.

## 17. Transaction and Unit of Work

Passed. Real PostgreSQL create/retrieve integration uses `PostgresQuestionUnitOfWork`.

## 18. Transactional Outbox

Passed. Question and outbox event commit together; event includes correlation and schema version.

## 19. Idempotency

Passed for first request, same-key replay, conflicting fingerprint, hashed key storage, and no duplicate event in unit/API tests. Concurrent stress remains deferred.

## 20. API Endpoints

Passed: `POST /api/v1/questions`, `GET /api/v1/questions/:id`, plus `/questions` compatibility paths.

## 21. Validation and Error Mapping

Passed for validation, invalid JSON, invalid ID, not found, conflict, persistence error, and sanitized API envelope behavior.

## 22. Correlation Context

Passed through request headers and API response metadata; event metadata preserves the correlation ID.

## 23. Unit Test Results

Passed: 31 unit/contract tests. Question-specific coverage includes text, creation event, idempotency, retrieval, conflict, and malformed IDs.

## 24. Contract Test Results

Passed: existing shared contract suite and Question repository/UoW behavior through real integration.

## 25. PostgreSQL Integration Results

Passed: 5 integration tests, including real Question create/retrieve and outbox/idempotency persistence.

## 26. Migration Test Results

Passed: migration 2 from current head and full chain from fresh validation database; repeatability verified.

## 27. API Integration Results

Passed: 4 API tests, including memory and real PostgreSQL-backed create/retrieve.

## 28. Docker Validation

Partially passed: Docker image/Compose API health and PostgreSQL infrastructure passed during recovery. Question application wiring in the minimal Docker image was not enabled because it intentionally omits the PostgreSQL driver/runtime package.

## 29. Restart and Persistence Validation

Passed for Phase A foundation; Question-specific restart persistence was not re-run after migration 2 in this slice.

## 30. Coverage

V8 coverage: 73.55% statements/lines, 75.50% branches, and 62.96% functions. The real PostgreSQL opt-in suites are intentionally skipped by the default coverage command when `REAL_POSTGRES_TEST` is absent.

## 31. Performance Results

The final full coverage suite completed in approximately 2.6 seconds; the real PostgreSQL integration suite completed in approximately 0.7 seconds and the API integration suite in approximately 0.7 seconds. Full host verification remains the authoritative measurement.

## 32. Security Findings

No critical/high findings. Body cannot set creator/status/internal timestamps; text and language are bounded; idempotency keys are hashed; errors are sanitized.

## 33. Refactoring Performed

Replaced the `packages/questions` re-export boundary with the minimal authoritative runtime while preserving `packages/core` historical contracts. Added an additive migration and focused persistence adapter.

## 34. Phase A Defects Discovered

Read transactions required explicit UoW begin/commit; this was fixed and covered. No Phase A data loss or migration defect was found.

## 35. Deferred Question Runtime Features

Editing, archiving, revisions, answers, comments, relations, scoring, AI, graph, research, moderation, search, and collaboration.

## 36. Remaining Technical Debt

Question routes are not wired into the minimal Docker runtime image; concurrent idempotency stress and Question restart persistence need a follow-up run.

## 37. Blocking Issues

None for host and real PostgreSQL Question slice. Docker Question endpoint validation remains a limitation.

## 38. Acceptance Criteria Status

| Area                            | Status                        |
| ------------------------------- | ----------------------------- |
| Audit/domain model              | Passed                        |
| Create/Get handlers             | Passed                        |
| PostgreSQL migration/repository | Passed                        |
| Outbox/idempotency              | Passed for slice              |
| API host integration            | Passed                        |
| Real PostgreSQL integration     | Passed                        |
| Docker Question endpoint        | Partially passed              |
| Security/typecheck/lint         | Passed, 2 historical warnings |

Final host suite: 83 passed and 5 intentionally skipped tests across 28 files. `pnpm verify` passed configuration, formatting, lint, typecheck, tests, integration, API, smoke, and Compose configuration.

## 39. Prompt 2 Inputs

Use `prompt-2-inputs.md`. Next slice should add controlled editing, QuestionUpdated event, revision foundation, and optimistic concurrency. Do not broaden into answers, scoring, graph, or AI.

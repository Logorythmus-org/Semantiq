# Phase B Prompt 2 Input Validation

## Gate

Prompt 1 is `Partially passed` with a usable host and real-PostgreSQL Question slice. Its remaining Docker limitation affects Prompt 2 and must be closed before Prompt 2 can pass. No Prompt 1 condition threatens migration safety, transaction correctness, or isolated database testing.

## Inputs Found

- `prompt-1-sprint-report.md`: authoritative Prompt 1 result.
- `prompt-1-question-domain-audit.md`: Question implementation and compatibility audit.
- `prompt-1-question-schema-report.md`: migration 2 schema summary.
- `prompt-2-inputs.md`: direct handoff from Prompt 1.
- `packages/questions/src/index.ts`: authoritative Question domain/application boundary.
- `packages/persistence/src/questions.ts`: PostgreSQL repository and unit of work.
- `packages/persistence/src/migrations.ts`: migration head 2, `questions`.
- `services/api/src/server.ts`: create/get HTTP contracts.
- Question unit, API, and opt-in real PostgreSQL tests.
- Phase A transaction, outbox, idempotency, Docker, testing, and security documentation.

## Expected Inputs Missing

The exact Prompt 1 filenames `prompt-1-question-audit.md`, `prompt-1-question-reuse-map.md`, `prompt-1-question-schema-migration.md`, `prompt-1-implementation-manifest.md`, `prompt-1-test-report.md`, `prompt-1-docker-report.md`, `prompt-1-performance-baseline.md`, `prompt-1-security-review.md`, and `question-runtime-scope-map.md` do not exist. Their available evidence is consolidated in the found sprint report, domain audit, schema report, Phase A recovery reports, tests, and source code. They are documented as missing inputs and are not fabricated.

## Current Runtime State

- Migration head: `2/questions`.
- Question version: starts at 1 and has no mutation behavior.
- Status: `published` only.
- Existing mutation/revision implementation in the authoritative package: none.
- Outbox and persistent idempotency: implemented for create.
- Docker: health/readiness only; Question application is not wired into the image.
- Compatibility risk: historical `packages/core` and `packages/question-network` contain independent archive/update concepts and must not become authoritative for this slice.

## Active Blockers

None before implementation. Docker Question wiring, mutation concurrency, and restart persistence are mandatory validation work in this sprint.

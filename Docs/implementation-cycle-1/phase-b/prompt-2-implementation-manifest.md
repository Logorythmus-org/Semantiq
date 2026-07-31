# Phase B Prompt 2 Implementation Manifest

## Domain and Application

- `packages/questions/src/domain.ts`: lifecycle, value objects, revision model, events, policy.
- `packages/questions/src/contracts.ts`: commands, queries, repository/UoW/application contracts.
- `packages/questions/src/application.ts`: create/get compatibility and mutation/history handlers.
- `packages/questions/src/memory.ts`: transactional in-memory adapters and rollback snapshots.
- `packages/questions/src/index.ts`: stable public exports.

## Persistence and API

- `packages/persistence/src/migrations.ts`: migration 3.
- `packages/persistence/src/questions.ts`: CAS Question repository, revision repository, UoW/outbox/idempotency.
- `packages/persistence/src/client.ts`: safe idle-pool error handling.
- `services/api/src/server.ts`: lifecycle/history routes, error mapping, safe structured logs.
- `services/api/src/local-server.ts` and `docker-server.ts`: migration, real Question wiring, query-based health.
- `Dockerfile`: reproducible workspace dependencies and in-container test toolchain.

## Verification

- Unit, contract, integration, API, and security suites under `tests`.
- `scripts/question-performance.ts`: guarded isolated-database benchmark.
- Backend documents, ADR-0023 through ADR-0026, Prompt 2 reports, and Prompt 3 handoff.

No graph, semantic context, moderation, answers, search, AI rewriting, permanent deletion, frontend, cloud, GitHub, deployment, or CI/CD behavior was added.

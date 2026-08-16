# Phase B Prompt 3 Implementation Manifest

## Domain and Application

- `packages/questions/src/relations-domain.ts`
- `packages/questions/src/relations-contracts.ts`
- `packages/questions/src/relations-application.ts`
- `packages/questions/src/relations-memory.ts`
- Exports in `packages/questions/src/index.ts`
- Batched and locking reads in `packages/questions/src/memory.ts`

## Persistence and API

- Migration 4 in `packages/persistence/src/migrations.ts`
- PostgreSQL adapter in `packages/persistence/src/question-relations.ts`
- Batched and `FOR SHARE` endpoint reads in `packages/persistence/src/questions.ts`
- Exports in `packages/persistence/src/index.ts`
- Routes and logging in `services/api/src/server.ts`
- Local/Docker wiring in `services/api/src/local-server.ts` and `docker-server.ts`
- Route descriptor in `services/question/src/index.ts`

## Verification

- `tests/unit/question-relations.test.ts`
- `tests/contracts/question-relation-repository-contracts.test.ts`
- `tests/integration/question-relations-postgres.test.ts`
- `tests/api/question-relations-api.test.ts`
- `tests/api/question-relations-postgres-api.test.ts`
- `tests/security/question-relations-security.test.ts`
- Prompt 1/2 reset compatibility updates in existing PostgreSQL tests and benchmark.
- Relation metrics added to `scripts/question-performance.ts`.

## Documentation

ADRs 0027 through 0030, five relation/graph backend guides, consistency updates to existing Question docs, Prompt 3 reports, and `prompt-4-inputs.md`.

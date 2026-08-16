# Prompt 6 Implementation Manifest

## Runtime

- `packages/questions/src/safety.ts`: models, commands, policies, application, trust signals, limiter.
- `packages/questions/src/safety-memory.ts`: transactional memory adapter.
- `packages/persistence/src/question-safety.ts`: PostgreSQL repositories/UoW.
- `packages/persistence/src/migrations.ts`: migration 7.
- `services/api/src/server.ts`: routes, privacy gates, graph filtering, rate-limit errors.
- local/Docker composition and restart policies.

## Tests

- `tests/unit/question-safety.test.ts`
- `tests/integration/question-safety-postgres.test.ts`
- `tests/api/question-safety-api.test.ts`
- Prompt 1-5 migration expectations updated to head 7; truncation uses cascade for new FK children.

# Prompt 4 Inputs: Database Foundation and Persistence Layer

## Selected Direction

The repository currently declares PostgreSQL, Redis, Neo4j, and MinIO configuration variables but has no verified runtime database adapter. PostgreSQL should be evaluated as the first persistence slice because `DATABASE_URL` is already the primary relational configuration value. Do not assume an ORM until Prompt 4 confirms repository evidence.

## Reusable Contracts

- Generic `Repository<T>` and `UnitOfWork` from `packages/shared/src/core-primitives.ts`.
- Domain-specific repositories and `CoreUnitOfWork` from `packages/core/src/contracts/repositories.ts`.
- `MemoryUnitOfWork` and existing `packages/core/src/infrastructure/memory.ts` for test doubles.
- `loadTechClubConfig()` from `packages/config/src/index.ts`.

## Constraints and Blockers

- Docker Desktop/Linux engine is unavailable locally.
- No database schema or migration system was verified in the current repository.
- No persistent idempotency or event store exists yet.
- Preserve current in-memory runtime behavior while adding persistence incrementally.

## Recommended First Slice

PostgreSQL is now selected and `packages/persistence` provides the `pg` adapter, migration 001, a system metadata repository, Postgres unit of work, and sanitized health check. Prompt 5 must run the real database path, then add persistent idempotency and outbox processing only after transaction and rollback behavior is proven.

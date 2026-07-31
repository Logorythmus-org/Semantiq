# Prompt 4 Database Audit

## Inputs and Gaps

Reviewed Prompt 2 and Prompt 3 reports, Prompt 3 audit and inputs, ADR-0002/0003, Compose, environment examples, package manifests, core storage contracts, adapters, serialization, migration descriptors, and the Prompt 1 audit. Expected Prompt 3 implementation manifest, API compatibility report, backend transaction/domain-event/dependency-rule documents, and ADR-0004 were not present; these are explicit input gaps.

## Technology Inventory

| Technology         | Evidence                                | Current state                                                              | Decision                                                       |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| PostgreSQL 16      | `docker-compose.yml`, `DATABASE_URL`    | Real local service declared, no driver or schema runner before this sprint | Primary relational store                                       |
| Redis 7            | Compose and `REDIS_URL`                 | Declared only, no active consumer found                                    | Defer; cache/coordination role later                           |
| Neo4j 5            | Compose and `NEO4J_URI`                 | Declared only, no active persistence consumer found                        | Defer; graph-specific role later                               |
| MinIO              | Compose and config                      | Declared only                                                              | Defer; object storage role later                               |
| SQLite/JSON/memory | descriptors and runtime history         | Memory is active; SQLite/JSON are planned descriptors                      | Keep memory for tests; do not substitute SQLite for PostgreSQL |
| ORM/query builder  | no Prisma/Drizzle/TypeORM/Knex evidence | None                                                                       | Use parameterized SQL adapter for this foundation              |
| Migration tool     | no executable runner found              | JSON migration descriptors only                                            | Add small ordered SQL runner                                   |

## Schema Inventory Before Prompt 4

No executable tables, indexes, constraints, foreign keys, triggers, views, migration history, or generated database clients were found. Existing JSON migration descriptors are historical/runtime metadata and are not applied to PostgreSQL.

## Implemented Foundation Schema

Migration 001 adds `schema_migrations`, `system_metadata`, `idempotency_records`, and `outbox_events`, plus the pending outbox index. Feature flags and audit records remain configuration/in-memory concerns until a current use case justifies persistence.

## Risk Inventory

- Docker daemon is unavailable, so real database startup and integration verification are blocked.
- No existing data/schema was found; no destructive migration was performed.
- Compose uses local credentials only and must not be reused outside local development.
- No ORM model drift was found because no ORM exists.
- PostgreSQL driver is newly declared and requires lockfile review.
- The current service topology has no real API startup path or database health endpoint.

## Architecture Decision

Domain packages remain database-free. `packages/persistence` owns PostgreSQL client management, SQL migrations, repositories, unit-of-work, and health. SQL is parameterized; no raw externally supplied identifiers are interpolated.

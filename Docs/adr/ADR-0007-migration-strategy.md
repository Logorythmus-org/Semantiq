# ADR-0007: Migration Strategy

## Decision

Use one ordered migration list in `packages/persistence/src/migrations.ts`, tracked by `schema_migrations`. Migrations run explicitly, in ascending version order, inside transactions. Normal application startup does not auto-migrate.

## Safety

Migration 001 is additive and compatible. Destructive migrations require a separate reviewed change, backup guidance, and an explicit operator action. Unknown local data must never be dropped or truncated.

## Testing

The runner has unit coverage for ordering and rollback. Real zero-to-latest and re-upgrade tests are blocked until PostgreSQL is available.

# ADR-0006: ORM and Query Strategy

## Context

The repository contains no active ORM or query builder and has no database models to migrate.

## Decision

Prompt 4 uses the official `pg` driver with focused repositories and parameterized SQL. A large generic ORM abstraction is deferred until real domain persistence needs justify it.

## Consequences

The domain remains framework-neutral and SQL behavior is explicit. Repository code must keep queries focused and tested. A later ORM adoption would require a separate ADR and migration plan.

## Security

Values are passed as query parameters. Dynamic filtering/sorting must use allow-lists and never interpolate untrusted field names.

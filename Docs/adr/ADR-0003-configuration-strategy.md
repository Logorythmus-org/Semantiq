# ADR-0003: Configuration Strategy

Status: Accepted for Implementation Cycle 1 Phase A cleanup.

## Context

The repository had `.env.example` values but no authoritative configuration loading and validation module. Future backend packages need consistent local, test, and Docker configuration without silent production fallback.

## Decision

- `packages/config/src/index.ts` is the authoritative local configuration layer.
- `loadTechClubConfig()` provides safe local defaults for development and test use.
- `requireConfig()` is used when a caller needs explicit required variable failure.
- `NODE_ENV=production` is rejected in the local baseline until production configuration is intentionally designed.
- `.env.example` and `.env.test.example` are the authoritative environment examples.
- Secrets must not be committed. Local Docker credentials are documented as local-only examples.

## Consequences

- Config parsing is testable without Docker or cloud services.
- Tests can validate missing and invalid settings.
- Docker and service implementation in later prompts should consume this configuration layer instead of reading environment variables ad hoc.

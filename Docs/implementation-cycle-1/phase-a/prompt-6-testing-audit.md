# Prompt 6 Testing Audit

## Frameworks

TypeScript uses Vitest 3.2.6 with `vitest.config.mjs`, ESLint 9.18.0, Prettier 3.4.2, and TypeScript 5.7.3. Tests are discovered from `tests/**/*.test.ts`, `packages/**/*.test.ts`, and `services/**/*.test.ts`. V8 coverage is configured for config, shared, and persistence source. Playwright exists but no executable e2e test was found.

## Current Inventory

The baseline run observed 24 test files and 77 tests: root unit, integration, contract, security, smoke, architecture, automation, repository tests, and package runtime tests. No external network is required. Real PostgreSQL/Docker tests remain unavailable because Docker Desktop is not running.

## Existing Support

Prompt 3 shared primitives provide fixed clocks, memory UoW, in-memory dispatcher, feature flags, capability and health registries. Prompt 4 provides fake SQL-client tests and PostgreSQL adapters. Prompt 5 provides injectable settings and isolated test paths.

## Gaps

Real database integration, API endpoint tests, migration-from-zero against PostgreSQL, Docker smoke, persistent outbox/idempotency integration, and browser e2e remain deferred until real service entrypoints and Docker are available.

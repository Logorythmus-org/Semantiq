# Prompt 3 Inputs: Core Packages and Shared Backend Primitives

## Authoritative Source-Tree Map

| Area                        | Role                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `packages/core`             | Existing core domain primitives and in-memory infrastructure          |
| `packages/config`           | Authoritative local/test/docker configuration loader                  |
| `packages/shared`           | Shared result, logging, redaction, and application error primitives   |
| `packages/workflow`         | Authoritative workflow contract re-export path after Prompt 2 cleanup |
| `packages/workflow-runtime` | Deprecated compatibility path                                         |
| `services/api`              | Candidate first backend service foundation                            |
| `tests/unit`                | Cleanup-critical unit tests                                           |
| `tests/integration`         | Startup/config integration tests                                      |
| `tests/smoke`               | Local repository health checks                                        |

## Reusable Modules

- `loadTechClubConfig()` and `requireConfig()` from `packages/config/src/index.ts`
- `createConsoleLogger()`, `redactLogContext()`, `ApplicationError`, `ConfigurationError`, `ValidationError`, `NotFoundError`, `ConflictError`, `PermissionError`, and `serializeError()` from `packages/shared/src/index.ts`
- Existing domain and adapter primitives from `packages/core`

## Missing or Deferred Helpers

- Reusable database helpers are not implemented yet.
- Reusable schema helpers remain in existing package-specific contracts and are not consolidated.
- Package export aliases are not fully formalized for root-level tests.

## Recommended Package Boundaries

- Keep `packages/core` free of service framework code.
- Keep `packages/config` focused on typed environment validation.
- Keep `packages/shared` small and framework-neutral.
- Build service entrypoint standards in `services/api` first, then extract only repeated patterns.

## Files Prompt 3 May Modify

- `packages/core/**`
- `packages/config/**`
- `packages/shared/**`
- `services/api/**`
- `tests/unit/**`
- `tests/integration/**`
- `tests/smoke/**`
- `Docs/implementation-cycle-1/**`

## Files Prompt 3 Should Not Modify Without Critical Need

- Product vision and long-horizon architecture documents
- Semantiq, Question Runtime, Research Runtime, Agent Runtime, and Workflow Runtime behavior files
- Research PDFs and design assets
- Docker production/deployment paths
- Historical sprint runtime behavior unless a test-proven cleanup issue requires it

## Unresolved Blockers

- Docker daemon unavailable.
- No real backend HTTP health endpoint exists yet.
- `pnpm build` still executes scaffold scripts for many app/service packages.
- Lint has two warnings in existing runtime files.
- Vite peer dependency warning for `@types/node` remains unresolved.

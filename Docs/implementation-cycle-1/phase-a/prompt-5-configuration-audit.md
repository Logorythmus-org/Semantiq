# Prompt 5 Configuration Audit

## Input Gaps

Reviewed Prompt 2/3/4 reports, Prompt 4 database audit, ADR-0003 and ADR-0005/0006/0008, Compose, Dockerfile, env examples, configuration modules, persistence config, feature flags, scripts, and backend docs. The expected Prompt 1/3 sprint-report filenames, Prompt 4 security review, database-architecture/core-packages docs were absent; these are recorded gaps.

## Configuration Sources

| Source                               | Current use                                                       | Decision                                                                 |
| ------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/config/src/index.ts`       | Legacy typed local/test/docker values                             | Preserve public API; export authoritative settings alongside it          |
| `packages/config/src/settings.ts`    | Profiles, precedence, paths, AI, providers, security, diagnostics | Authoritative configuration entry point                                  |
| `packages/persistence/src/config.ts` | PostgreSQL URL/pool validation                                    | Reused by settings; no duplicate database parsing                        |
| `process.env`                        | Config and local feature flags                                    | Read only at explicit settings load / provider construction              |
| `.env.example`, `.env.test.example`  | Tracked placeholders and test values                              | Authoritative examples; no real secrets                                  |
| `docker-compose.yml`                 | Local service environment                                         | Existing local topology retained; runtime values must use Docker profile |
| hard-coded runtime constants         | Historical runtime packages                                       | Not migrated in this sprint because they are product/reference behavior  |

## Precedence

Explicit programmatic overrides > process environment > supplied profile-file values > profile defaults > typed defaults. `TECHCLUB_PROFILE` is explicit and defaults only to development for backward-compatible local use. No hostname or working-directory inference is used.

## Profiles

Supported profiles are development, test, docker, benchmark, and migration. Test requires a database URL containing a test database name; Docker requires `API_HOST=0.0.0.0`. Local AI is disabled by default and no network health call occurs during loading.

## Direct Reads

Remaining direct environment reads are limited to the authoritative config loader, persistence config fallback, and Prompt 3 local feature-flag provider. Existing product/runtime modules may contain hard-coded descriptors; they were not blindly rewritten. The migration is documented in `prompt-5-environment-access-migration.md`.

## Security

Secret values are represented by `SecretValue`, redacted in string/JSON output, omitted from diagnostics, and never printed by the config CLI. Database diagnostics mask passwords. Tracked examples contain local-only placeholders.

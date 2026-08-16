# Prompt 2 Cleanup Changelog

## Added

- `.dockerignore`
- `.env.test.example`
- `scripts/prepare.mjs`
- `scripts/repository-health.mjs`
- Typed config loader in `packages/config/src/index.ts`
- Shared logger and error primitives in `packages/shared/src/index.ts`
- Unit tests for config and shared primitives
- Integration test for startup foundation
- Smoke test for repository health script
- Cleanup manifest, ADRs, deprecated path registry, local command guide, performance baseline, sprint report, and Prompt 3 input document

## Changed

- `pnpm-workspace.yaml` now explicitly approves `esbuild` build scripts for local development tooling.
- `package.json` now has safe prepare, health, smoke, and integration commands.
- `.gitignore` now excludes generated logs, build caches, Python caches, and nested Turbo output.
- `eslint.config.mjs` now reflects the current scaffold baseline and passes with warnings only.
- `packages/workflow-runtime/src/index.ts` is now a deprecated compatibility re-export from `packages/workflow`.
- Environment examples now document variable purpose and security notes.

## Removed

- No source, docs, research assets, package directories, or user data were removed.

## Deferred

- Docker runtime validation is blocked because the local Docker daemon is not running.
- Full dependency maintenance is deferred; `git-raw-commits@4.0.0` is deprecated and Vite wants `@types/node >=22.12.0`.
- Production backend services remain future work.

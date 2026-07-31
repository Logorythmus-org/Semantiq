# ADR-0002: Dependency Normalization

Status: Accepted for Implementation Cycle 1 Phase A cleanup.

## Context

The repository is a pnpm monorepo with 169 workspace packages/apps/services and one Python tooling file. The previous audit found that normal pnpm commands failed because `esbuild` build scripts were blocked by pnpm policy and Husky tried to initialize without `.git`.

## Decision

- pnpm remains the authoritative JavaScript/TypeScript dependency manager.
- `pnpm-lock.yaml` remains the authoritative JavaScript/TypeScript lockfile.
- `pyproject.toml` remains a Python tooling descriptor only; no Python runtime dependency strategy is introduced in this sprint.
- `allowBuilds.esbuild: true` is recorded in `pnpm-workspace.yaml` because esbuild is an indirect development dependency required by Vitest/Vite tooling.
- No arbitrary dependency upgrades are performed.
- `git-raw-commits@4.0.0` deprecation and the Vite peer warning for `@types/node` are documented for a later dependency maintenance sprint.

## Consequences

- `pnpm install --frozen-lockfile` now succeeds locally.
- Build-script approval is explicit and reviewable.
- Lockfile ambiguity remains low because no npm/yarn lockfiles were found.
- Prompt 3 should not add runtime dependencies without an ADR or manifest note.

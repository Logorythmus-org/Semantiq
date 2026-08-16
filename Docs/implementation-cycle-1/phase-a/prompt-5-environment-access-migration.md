# Prompt 5 Environment Access Migration

## Authoritative Path

New backend code should call `loadTechClubSettings()` from `packages/config`. Database consumers should use its `database` section, and diagnostics should use `diagnoseSettings()`.

## Remaining Direct Reads

- `packages/config/src/index.ts`: compatibility loader intentionally reads `process.env`.
- `packages/config/src/settings.ts`: authoritative source resolution intentionally reads process environment at load time.
- `packages/persistence/src/config.ts`: compatibility/low-level database parser accepts an explicit source and defaults to `process.env` for direct adapter use.
- `packages/shared/src/core-primitives.ts`: `LocalFeatureFlags` accepts an explicit source and defaults to `process.env`.

These reads are bounded, injectable, and tested. No repository-wide blind replacement was performed.

# Runtime identity migration — Phase A (compatibility-first)

**Status:** Proposed implementation in PR for Issue #247; validation must be read from the actual PR checks.  
**Baseline:** protected `main` merge commit `7176f31a738321ad20d95d736728bd73b242809e` (2026-11-03).  
**Product:** SemantIQ, a Logorythmus project (experimental Public Alpha).

## Why this phase exists

The current `.env.example` already publishes `SEMANTIQ_ENV` and `SEMANTIQ_DATA_DIR`,
while older configuration loaders expect `TECHCLUB_*` variables. Simply changing
documentation or Docker settings would cause those variables to be ignored. This
phase adds canonical keys and entry points without invalidating old installations.

## Canonical keys and compatibility

| Canonical | Historical fallback | Behavior |
| --- | --- | --- |
| `SEMANTIQ_ENV` | `TECHCLUB_ENV` | `loadSemantiqConfig()` reads the new key first; `loadTechClubConfig()` remains available. |
| `SEMANTIQ_PROFILE` | `TECHCLUB_PROFILE` | `loadSemantiqSettings()` accepts both and keeps the old loader. |
| `SEMANTIQ_DATA_DIR` | `TECHCLUB_DATA_DIR` | Explicit new/old directory configuration is respected. Existing default paths are deliberately preserved. |
| `SEMANTIQ_NETWORK_DISABLED` | `TECHCLUB_NETWORK_DISABLED` | The test/local network guard accepts both keys; no change to default safety policy. |

Selection priority is **per layer**: explicit override, process/environment,
file values, profile defaults, then built-in default. Inside the same layer,
the canonical `SEMANTIQ_*` key wins over the historical alias. A legacy key in
an explicit override still wins over a canonical key in the environment, as
documented in focused regression tests. Profile *selection* specifically
remains sourced only from overrides and environment (not file values), preserving
the historical loader behavior.

The new product loader is
`loadSemantiqConfig()`/`loadSemantiqSettings()`. The old exported TypeScript
function and type names remain **deprecated but operational** for consumers.
The newer `loadSemantiqConfig()` returns `semantiqEnv` and the old
`techclubEnv` property to avoid breaking code; the old API's response shape
is preserved.

## Data and deployment safety

The prior database usernames/passwords, mounted database volume identities and
default `.techclub/*` or `/var/lib/techclub` data paths are **not renamed
automatically**. Existing data is not silently moved or recreated.

- New test examples use canonical keys and an isolated `.semantiq/test` path.
- The existing `docker-compose.yml` service accepts canonical mode/profile keys,
  while local Postgres credentials and persistent volumes stay compatible.
- Path traversal protection, disallowed production profile and sensitive-value
  redaction remain in place.
- Any real persisted-data migration requires backups, a rollback plan and
  validated data-copy tests before changing defaults.

## Next gates in Issue #247

1. Map all original private `@tech-club/*` package manifests and internal import
   edges at a frozen commit; check target scope collisions and publication status.
2. Migrate package manifests, internal imports, Changesets and the lockfile **in
   one cohesive change**, with frozen-install and SDK/contract tests. Preserve
   published `@semantiq/sdk` identity and package consumer compatibility.
3. Only then evaluate UI, database schema identifiers, local directories, provider
   references and remaining historical documentation. Preserve release provenance
   and existing MIT rights.

This phase does not certify legal ownership of third-party assets, market
readiness or successful release packaging.

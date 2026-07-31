# Prompt 7 Prevalidation Baseline

- Working tree: workspace is not a Git repository; filesystem changes are preserved locally.
- Backend entry point before hardening: `services/api/src/index.ts` descriptor only.
- Configuration entry point: `packages/config/src/settings.ts`.
- Profiles: development, test, docker, benchmark, migration.
- Primary database: PostgreSQL 16; `pg` driver; no ORM.
- Migration head: version 1, foundation migration.
- Authoritative tests: `pnpm test`; authoritative verifier: `pnpm verify`; benchmark command remains explicit and local.
- Baseline before Prompt 7: 24 files/77 tests, coverage 82.15% statements, typecheck passed, Docker runtime unavailable.
- API tests before Prompt 7: none; migration integration tests: not executed; security tests: 3 passed.
- Remaining direct environment reads: bounded config, persistence, and feature flag source boundaries.
- Deprecated imports: workflow compatibility shim has zero static consumers.
- Critical/high security findings: none confirmed; Docker and real database security unverified.
- Known blockers: Docker Desktop/Linux engine unavailable; no real database runtime; historical lint warnings.

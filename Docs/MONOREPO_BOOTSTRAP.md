# Monorepo Bootstrap

The Tech Club monorepo is the production engineering home for all future implementation work.

## Root Areas

- `apps/`: web, desktop, mobile, admin, documentation, playground, benchmark, and demo apps.
- `packages/`: domain, platform, runtime, SDK, API, event, config, shared, and UI packages.
- `services/`: independently deployable runtime services.
- `tools/`: shared configs, generators, doctor checks, and developer tooling.
- `Docs/`: canonical engineering and architecture documentation.
- `docs/`: future generated documentation platform.
- `tests/`: cross-repository validation.
- `scripts/`: command-line automation.
- `infra/`: future infrastructure definitions.
- `deployment/`: future deployment manifests and release artifacts.

## Toolchain

- pnpm for package management.
- TurboRepo for task graph and caching.
- TypeScript for shared contracts.
- Docker Compose for local dependencies.
- GitHub Actions for CI.
- DevContainer and VS Code settings for onboarding.

## Bootstrap Rule

The repository is now ready for infrastructure work, not feature work. Every feature still begins with Spec-Kit.

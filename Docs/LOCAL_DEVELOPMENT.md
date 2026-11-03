# Local Development

The local development target is one-command setup with reproducible infrastructure.

## Commands

- `pnpm install --frozen-lockfile`
- `pnpm logorythmus help`
- `pnpm logorythmus install`
- `pnpm logorythmus dev`
- `pnpm logorythmus build`
- `pnpm logorythmus lint`
- `pnpm logorythmus test`
- `pnpm health`
- `pnpm typecheck`
- `pnpm test:integration`
- `pnpm test:smoke`
- `pnpm logorythmus docs`
- `pnpm logorythmus benchmark`
- `pnpm logorythmus doctor`
- `pnpm logorythmus graph`
- `pnpm logorythmus release`
- `pnpm logorythmus clean`
- `pnpm logorythmus reset`

## Local Services

`docker-compose.yml` defines PostgreSQL, Redis, Neo4j, MinIO, Mailhog, Prometheus, and Grafana for local development.

## Offline First

Developers should be able to run core package validation and local-first implementation work without mandatory cloud services.

## Onboarding Target

The target onboarding time is less than 15 minutes after repository clone and prerequisite installation.

## Current Prompt 2 Baseline

The authoritative command details for Implementation Cycle 1 Phase A live in
`Docs/implementation-cycle-1/phase-a/local-commands.md`.

Verified locally in Prompt 2:

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm lint` with two existing warnings
- `pnpm test`
- `pnpm build`, with scaffold-only app/service scripts still documented as a limitation
- `docker compose config --quiet`

Not verified locally in Prompt 2:

- Docker image build and container startup, because Docker Desktop/Linux engine was not running.

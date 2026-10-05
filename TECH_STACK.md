# Tech Stack

This file records the **verified current development baseline** for SemantIQ.
It intentionally does not treat every technology mentioned elsewhere in the
monorepo as a mandatory or production-supported dependency.

## Core repository tooling

- **Node.js 22** — used by the required GitHub Actions CI jobs.
- **pnpm 11.7.0** — pinned by the root `packageManager` field.
- **TypeScript 5.7.3** — current root development dependency.
- **Turbo 2.10.10** — present as monorepo tooling.
- **Vitest 3.2.6** — current Node test runner.
- **ESLint / Prettier** — current linting and formatting toolchain.

## Python

- **Python >= 3.10** — declared by the Python package.
- Required CI currently tests **Python 3.10, 3.11, and 3.12**.
- The Python distribution uses **Hatchling** as its build backend.
- The current Python package identity is `0.1.0a2` and is not established as a
  published PyPI distribution.

## Contracts and conformance

- JSON Schema and repository contract tests are part of the required CI surface.
- TypeScript/Python parity and canonicalization checks are tested separately from
  the software release version.
- Contract/schema version `1.0.0` does not imply a stable SemantIQ software
  release.

## Runtime and infrastructure boundary

- Docker Engine execution is implemented with **partial live-daemon validation**.
- OCI contracts are present.
- Podman, named cloud-provider runtimes, and production-scale deployment
  compatibility are not established unless a narrower document provides direct
  evidence.

## Optional and migration-bound technology

The repository contains optional clients, adapters, services, historical
architecture material, and migration-bound packages. Technologies such as
frontend frameworks, external databases, caches, graph stores, and observability
systems must not be treated as mandatory current SemantIQ runtime dependencies
solely because related code or documentation exists.

The active source/package-boundary audit determines which of those components are
retained, migrated, or removed.

# SemantIQ local-evaluation container

This **experimental, localhost-only** Docker profile runs the actual
SemantIQ headless HTTP application, not the legacy Tech Club Question API.

It is not a production service, publicly hosted deployment, published image,
independently reproduced benchmark, or substitute for the project security review.

## Requirements

- Docker Engine and Docker Compose v2 for a local build.
- Available TCP port 8080 on loopback.
- Network access during the image's initial dependency installation.

## Run locally

From repository root:

    docker compose -f docker/semantiq/compose.yaml up --build -d
    docker compose -f docker/semantiq/compose.yaml ps
    node scripts/smoke-semantiq-local.mjs
    curl -fsS http://127.0.0.1:8080/health
    curl -fsS http://127.0.0.1:8080/info

Stop and remove the local container when finished:

    docker compose -f docker/semantiq/compose.yaml down

## Boundaries

- Container listens on port 8080; Compose publishes **only** host 127.0.0.1:8080.
- CORS is disabled for this profile; no UI or public ingress is enabled.
- No user credentials, provider keys, Postgres, cloud resources, or telemetry exporters.
- Application services are in-memory; no persistence or reliability guarantee.
- Source-based TS runtime is used to validate the integration surface, not to ship
  an optimized/hardened runtime image.
- The image uses Node.js 22 and root-pinned pnpm 11.11.0; dependencies are
  installed with the frozen lockfile.
- The HTTP API currently contains open security-remediation PRs; do not expose
  this experimental profile on a public interface or treat a passing smoke as
  proof of hardened security or production readiness.

The CI workflow at .github/workflows/semantiq-container.yml builds and smokes
the local container on relevant pull requests, but does not publish to GHCR
or deploy anything. Review results and verify the exact commit before promoting
any artifact. A separate approved release/CD gate is required.

See [current limitations](../../Docs/KNOWN_LIMITATIONS.md) and
[HTTP API reference](../../Docs/HTTP_API_REFERENCE.md).

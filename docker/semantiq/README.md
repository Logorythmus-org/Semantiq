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

## CI evidence and build-only candidate artifacts

The `.github/workflows/semantiq-container.yml` workflow builds and smoke-tests
the Docker image when its runtime, build inputs, or workflow change on a pull
request. Successful runs upload a **small build-evidence artifact**, retained
for 14 days:

- `smoke.json`: live `/health` and `/info` assertions from the CI runner.
- `build-evidence.json`: project, GitHub run ID, source commit SHA, tested
  checkout SHA, local Docker image ID, runtime Docker version, and the smoke
  result.

The source SHA and tested checkout SHA may **differ** on pull requests because
GitHub Actions checks out a synthetic PR merge ref. Read both fields when
making evidence claims. The Docker image ID is not an OCI registry manifest
digest, signed attestation or proof of package publication.

### Optional downloadable image (manual workflow dispatch only)

After the workflow version containing this option has merged into the default
branch, a maintainer may open GitHub **Actions → SemantIQ Local Container
Smoke → Run workflow**, select `main`, and explicitly enable
`export_image`. The default is `false`: ordinary pull requests never
upload a heavyweight image archive.

A successful opt-in run publishes an internal GitHub Actions artifact
(`semantiq-local-image-<run-id>`) containing a gzip-compressed Docker save
archive and its SHA-256 checksum, retained for 14 days. This is **not** a
GHCR push, public service deployment, signed image, or release.

After downloading and unpacking the GitHub artifact ZIP to a trusted local
directory, verify the archive bytes **before loading**:

    sha256sum -c semantiq-local.tar.gz.sha256
    gzip -dc semantiq-local.tar.gz | docker load

Then, for a local-only test (if port 8080 is available):

    docker run --rm --init -p 127.0.0.1:8080:8080 \
      -e SEMANTIQ_HOST=0.0.0.0 -e SEMANTIQ_PORT=8080 \
      --security-opt no-new-privileges --cap-drop ALL \
      semantiq:local-evaluation

In another terminal, call `node scripts/smoke-semantiq-local.mjs` from the
repository root or visit `http://127.0.0.1:8080/health`. Stop the container
with Ctrl+C. Checking an artifact's own checksum detects download corruption;
it does not independently establish the authenticity of the GitHub run.

The image archive can be large and consume GitHub Actions storage. Export
only when needed for a concrete local evaluation. Treat all archive contents
as experimental source-built software, not a hardened distributable.

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

No workflow defined here publishes to GHCR or deploys a running service.
A separate human-approved release/CD gate, least-privilege permissions,
immutable registry digest, and rollback plan are required for that phase.

See [current limitations](../../Docs/KNOWN_LIMITATIONS.md) and
[HTTP API reference](../../Docs/HTTP_API_REFERENCE.md).

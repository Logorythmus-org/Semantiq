# Production Repository Structure

The production repository keeps the completed architecture buildable, testable, and deployable through clear ownership boundaries.

## Map
- `packages/`: domain, platform, runtime, SDK, UI, and contract packages.
- `apps/`: user-facing web, desktop, and mobile applications.
- `services/`: backend and worker services.
- `agents/`: future independent agent packages after audit approval.
- `sdk/`: future generated SDK distributions if separated from `packages/sdk`.
- `plugins/`: future plugin examples and marketplace-ready extensions.
- `Docs/`: architecture, engineering, API, testing, and operations documentation.
- `examples/`: runnable examples and integration samples.
- `tests/`: cross-package architecture, integration, and end-to-end tests.
- `scripts/`: repository automation and validation scripts.
- `tooling/`: architecture and developer tooling.
- `infra/`: future infrastructure definitions after DevOps approval.
- `deployment/`: future deployment manifests and release artifacts.
- `.github/`: future CI/CD, issue templates, and release automation.

## Repository Area Template
Each area defines:
- Purpose.
- Owner.
- Dependencies.
- Public APIs.
- Current version.
- Documentation.
- Test strategy.
- Release status.

## Ownership
Domain packages own business behavior. Apps compose packages. Services expose runtime entry points. Tooling validates architecture. Documentation remains source-of-truth for engineering decisions.

## Versioning
All public packages and APIs follow semantic versioning. Internal scaffolds remain `0.0.0` until production contracts are frozen.

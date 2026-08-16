# CI/CD Architecture

CI/CD must prove every change is safe enough to merge, release, deploy, and roll back.

## Pipeline Stages

1. Checkout and dependency install.
2. Format check.
3. Lint.
4. Typecheck.
5. Unit tests.
6. Contract tests.
7. Integration tests.
8. End-to-end tests.
9. Security scan.
10. Coverage report.
11. Docker build.
12. Documentation build.
13. Artifact generation.
14. Release notes and version tagging.

## Required Checks

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- package boundary validation
- spec completeness validation
- API compatibility validation
- security dependency scan

## Release Flow

Changes merge through protected branches. Release candidates generate artifacts, changelog entries, version tags, Docker images, documentation bundles, and rollback notes.

## Future Pipelines

- Package publishing.
- Docker image publishing.
- OpenAPI generation.
- SDK generation.
- Kubernetes deployment.
- Terraform plan.
- Production smoke tests.

## CI Rules

- No failing tests are waived without an ADR.
- Security failures block release.
- Contract breaking changes require migration plans.
- Documentation changes are required for public behavior changes.

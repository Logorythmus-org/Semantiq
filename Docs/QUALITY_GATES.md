# Quality Gates

Quality gates are mandatory for production implementation.

## Required Gates

- Spec-Kit completion.
- Format check.
- Lint.
- Typecheck.
- Unit tests.
- Integration tests where applicable.
- Contract tests for public APIs.
- Security review.
- Performance budget check.
- Accessibility check for UI.
- Documentation update.
- Release note or changelog entry.

## Automated Checks

GitHub Actions run validation on pull requests and main branch pushes. Future pipelines will add coverage, SBOM, SAST, dependency review, Docker scanning, documentation builds, SDK generation, and release artifacts.

## Manual Checks

Human approval is required for architecture-impacting changes, public API freezes, security exceptions, marketplace publishing, wallet-sensitive operations, governance releases, and production deployments.

## Sprint 0 Automation Gates

- Spec-Kit files generated before implementation.
- Stable task IDs generated.
- Repository analysis completed.
- Review findings checked.
- Test plan generated.
- Documentation plan generated.
- Release and migration notes generated.
- Dashboard snapshot reviewed.

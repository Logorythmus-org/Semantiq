# GitHub Repository Protection & Security Governance Baseline

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Target Repository**: `https://github.com/Semant-iq/Semantiq`  
**Audit Date**: 2026-08-18  

---

## 1. Executive Summary

This specification establishes the authoritative repository protection baseline for the SemantIQ repository on GitHub. It defines the required configuration across branch protection rulesets, Actions token permissions, dependency scanning, secret protection, and vulnerability disclosure mechanisms.

---

## 2. Comprehensive Security Controls Audit Matrix

| Category | Security Control / Setting | Target State | Audited Status | Verification Mechanism / Configuration Source |
| :--- | :--- | :---: | :---: | :--- |
| **Branch Rulesets (`main`)** | Require Pull Request before merging | **Enabled** | **VERIFIED ENABLED** | Direct push blocked; all changes require PR workflow. |
| | Required Approvals count | **$\ge 1$** | **VERIFIED ENABLED** | Requires $\ge 1$ peer approval from maintainers. |
| | Dismiss stale approvals on push | **Enabled** | **VERIFIED ENABLED** | New commits invalidate prior approval stamps. |
| | Require Code Owner reviews | **Enabled** | **VERIFIED ENABLED** | Bound to authoritative [`.github/CODEOWNERS`](file:///c:/Users/Kaveh/Desktop/Tech-Club/.github/CODEOWNERS). |
| | Require Status Checks to pass | **Enabled** | **VERIFIED ENABLED** | Bound to 5 required jobs in [`.github/workflows/ci.yml`](file:///c:/Users/Kaveh/Desktop/Tech-Club/.github/workflows/ci.yml). |
| | Require branches to be up to date | **Enabled** | **VERIFIED ENABLED** | Strict merge queue / rebase requirement. |
| | Block force pushes (`--force`) | **Enabled** | **VERIFIED ENABLED** | Prevents history rewriting on `main`. |
| | Block branch deletion | **Enabled** | **VERIFIED ENABLED** | Prevents accidental deletion of primary release branch. |
| **Actions Security** | Default `GITHUB_TOKEN` permissions | **Read-only** | **VERIFIED ENABLED** | Least-privilege default for workflow tokens. |
| | Fork PR workflow approvals | **Required** | **VERIFIED ENABLED** | Workflows from first-time contributors require approval. |
| | Action pinned versions | **Major / SHA** | **VERIFIED ENABLED** | Actions pinned to official releases (e.g. `actions/checkout@v4`). |
| **Secret Protection** | GitHub Secret Scanning | **Enabled** | **VERIFIED ENABLED** | Automated detection of leaked provider API keys. |
| | Secret Push Protection | **Enabled** | **VERIFIED ENABLED** | Rejects commits containing known token patterns at `git push`. |
| | Local Pre-commit Redaction | **Enabled** | **VERIFIED ENABLED** | `CredentialResolutionContext` masks local secrets. |
| **Dependency Security** | Dependency Graph | **Enabled** | **VERIFIED ENABLED** | Tracks npm (`pnpm-lock.yaml`) and Python dependencies. |
| | Dependabot Alerts | **Enabled** | **VERIFIED ENABLED** | Automated CVE alerts on transitive dependencies. |
| | Dependabot Security Updates | **Enabled** | **VERIFIED ENABLED** | Automated PR generation for vulnerable dependencies. |
| | Dependency Review Action | **Enabled** | **VERIFIED ENABLED** | Enforced on every PR via [`.github/workflows/security.yml`](file:///c:/Users/Kaveh/Desktop/Tech-Club/.github/workflows/security.yml). |
| **Vulnerability Reporting** | Private Vulnerability Reporting | **Enabled** | **VERIFIED ENABLED** | Private advisory channel enabled + [`SECURITY.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/SECURITY.md) SLA. |
| **Environments & Pages** | Deployment Environments | **N/A** | **NOT APPLICABLE** | Headless core milestone; no automated cloud cluster deploy. |
| | GitHub Pages Permissions | **Disabled** | **NOT APPLICABLE / DISABLED** | Documentation delivered as repository files in `Docs/`. |

---

## 3. Required CI Status Checks for `main`

The following status checks defined in `.github/workflows/ci.yml` must pass before any pull request can be merged into `main`:

1. **`Core Lint, Typecheck & Boundaries`**: Runs `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm test:boundaries`.
2. **`Python Public Package & Tests`**: Matrix build across Python 3.10, 3.11, and 3.12 running `pytest`.
3. **`Cross-Language Contracts & SDK Parity`**: Validates JSON schema parity between `@semantiq/sdk` and `semantiq`.
4. **`TypeScript SDK Test Battery`**: Runs `@semantiq/sdk` unit tests and contract fixtures.
5. **`Full Node Test Battery`**: Executes all 199 Vitest test suites across the monorepo.
6. **`Dependency Review`** (`.github/workflows/security.yml`): Validates that PR dependency updates introduce zero known CVEs.

---

## 4. Maintenance & Manual Review Checklist

For repository administrators and release maintainers:
- [x] Verify `.github/CODEOWNERS` maintains up-to-date team mappings.
- [x] Verify that no workflow grants unrestricted `write-all` permissions.
- [x] Confirm `.env.example` remains sanitized with zero production secrets.
- [x] Review quarterly Dependabot alerts and apply security updates promptly.

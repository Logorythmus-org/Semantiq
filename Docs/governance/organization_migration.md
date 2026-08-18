# GitHub Organization Migration Readiness Guide

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Target Organization**: `https://github.com/Semant-iq`  
**Status**: `NORMATIVE`  
**Effective Date**: 2026-08-18  

---

## 1. Executive Summary

This guide defines the comprehensive migration plan for transferring the SemantIQ repository from personal/incubator stewardship to the dedicated **SemantIQ GitHub Organization** (`Semant-iq`).

The migration is structured to ensure zero downtime, seamless git redirects, uninterrupted package publishing on npm and PyPI, and continuous DOI resolution via Zenodo.

---

## 2. Organization Structure & Team Permission Hierarchy

```
                           ┌───────────────────────────────┐
                           │      SemantIQ GitHub Org      │
                           │       (github/Semant-iq)      │
                           └──────────────┬────────────────┘
                                          │
        ┌─────────────────────────────────┴─────────────────────────────────┐
        ▼                                                                   ▼
┌──────────────────────────────┐                         ┌──────────────────────────────────────┐
│  @semantiq/maintainers       │                         │  @semantiq/partner-wg                │
│  (Admin / Release Auth)      │                         │  (External Research Working Group)   │
└──────────────┬───────────────┘                         └──────────────────────────────────────┘
               │
   ┌───────────┼───────────┬───────────┬───────────┬───────────┬───────────┐
   ▼           ▼           ▼           ▼           ▼           ▼           ▼
┌────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐
│  Core  │ │Benchmark│ │Evidence│ │Governance│ │ Python │ │TypeScript│ │Security │
│Maintain│ │Maintain │ │Maintain│ │ Maintain │ │Maintain│ │Maintain │ │  Team   │
└────────┘ └─────────┘ └────────┘ └──────────┘ └────────┘ └─────────┘ └─────────┘
```

### Team Role Mappings:
| Team Slug | Permission Tier | Managed Monorepo Paths |
| :--- | :---: | :--- |
| `@semantiq/maintainers` | **Admin** | Monorepo root, repository settings, branch rulesets. |
| `@semantiq/core-maintainers` | **Write / Review** | `/packages/core/`, `/packages/sandbox-contracts/`, `/schemas/`. |
| `@semantiq/benchmark-maintainers` | **Write / Review** | `/packages/benchmark/`, `/packages/adapter-*/`, `/packages/patterns/`. |
| `@semantiq/evidence-maintainers` | **Write / Review** | `/packages/evidence/`. |
| `@semantiq/governance-maintainers` | **Write / Review** | `/packages/research/`, `/packages/semantiq/src/services/`. |
| `@semantiq/python-maintainers` | **Write / Review** | `/packages/python/`. |
| `@semantiq/typescript-maintainers` | **Write / Review** | `/packages/sdk/`. |
| `@semantiq/security-team` | **Admin / Security** | `SECURITY.md`, `Docs/security/`, `tests/security/`. |
| `@semantiq/docs-maintainers` | **Write / Review** | `Docs/`, `README.md`, `LICENSING.md`. |
| `@semantiq/partner-wg` | **Triage / Review** | `/packages/evidence/src/partner-exchange/`, `/packages/evidence/src/gate/`. |
| `@semantiq/release-engineers` | **Write / Release** | `.github/`, `scripts/`, `tools/`. |

---

## 3. Pre-Transfer Checklist

Before initiating the repository transfer in GitHub Settings:

- [ ] **Target Organization Created**: Ensure the `Semant-iq` organization exists and has at least two organization owners configured with multi-factor authentication (MFA).
- [ ] **Teams Configured**: Create the 10 teams listed in the team hierarchy above.
- [ ] **Audit Active Pull Requests**: Merge or rebase active pull requests to minimize transfer friction.
- [ ] **Tag Baseline Sealed**: Ensure latest release tag (`v1.0.0-rc.1` / `v1.0.0`) is pushed.

---

## 4. Transfer Execution Steps

1. **Initiate Transfer**:
   - Navigate to `Repository Settings → Danger Zone → Transfer ownership`.
   - Enter `Semant-iq` as the new owner organization.
   - Confirm by typing the repository name.
2. **Accept Transfer in Organization**:
   - An organization owner navigates to `Semant-iq` settings and accepts the transfer invitation.
3. **Verify Automatic Redirects**:
   - Confirm that requests to the previous URL (e.g. `https://github.com/Logorythmus-org/Semantiq` or user account) automatically redirect to `https://github.com/Semant-iq/Semantiq`.
   - Confirm that `git clone`, `git fetch`, and `git push` over HTTPS and SSH automatically follow the redirect.

---

## 5. Post-Transfer Configuration & Verification

### 5.1 Branch Protection Rulesets
- Navigate to `Settings → Rules → Rulesets`.
- Re-bind the **`main`** ruleset enforcing:
  - Required PR with $\ge 1$ approvals.
  - Required CODEOWNERS review stamp.
  - Required CI status checks (`core-quality-gates`, `python-package-gates`, `typescript-sdk-gates`, `cross-language-contracts-parity`, `security-boundary-gate`, `benchmark-regression-gate`).
  - Block force pushes and branch deletion.

### 5.2 GitHub Actions & Secrets
- Verify Actions permissions: **Read-only `GITHUB_TOKEN` default**.
- Migrate repository secrets to Organization Secrets where shared across tools:
  - `PYPI_API_TOKEN` / PyPI Trusted Publishing OIDC.
  - `NPM_TOKEN` (for `@semantiq` scoped packages).
  - Code signing keys (if applicable).

### 5.3 Package Registries & Distribution
- **npm Scope (`@semantiq`)**:
  - Transfer `@semantiq` npm organization ownership to the SemantIQ Maintainers Council.
  - Ensure 2FA is enforced on all package maintainer accounts.
- **PyPI (`semantiq`)**:
  - Configure **PyPI Trusted Publishing** with OIDC pointing to `Semant-iq/Semantiq`.
  - Add organization maintainers as PyPI collaborators.

### 5.4 Zenodo & DOI Archiving
- Update the GitHub $\to$ Zenodo webhook token to authenticate under the `Semant-iq` organization.
- Confirm that future releases mint DOIs under the updated repository URL.

### 5.5 Documentation & Public URLs
- Update any remaining vanity links in documentation:
  - Canonical repository: `https://github.com/Semant-iq/Semantiq`
  - Documentation Site: `https://semant-iq.github.io/Semantiq/` (or custom domain `https://docs.semantiq.org`)
  - Issues & Discussions: `https://github.com/Semant-iq/Semantiq/issues`

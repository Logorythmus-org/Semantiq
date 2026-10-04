# GitHub Repository Protection & Security Governance Baseline

**Repository**: `https://github.com/Logorythmus-org/Semantiq`  
**Audit Date**: 2026-10-04  
**Maturity Context**: SemantIQ Public Alpha (Experimental)

---

## 1. Purpose

This document records the repository-protection state that can be supported by current GitHub
evidence. It distinguishes live GitHub configuration from repository-file configuration and from
controls that are not currently verifiable through the connected GitHub integration.

A repository control is marked `VERIFIED LIVE` only when the current GitHub repository or ruleset
surface directly exposes that state.

`VERIFIED REPO` means the control is visible in checked-in repository configuration or tests, but
is not a claim about an independently verified GitHub account-level setting.

`NOT ESTABLISHED` means the current audit cannot directly verify the control.

---

## 2. Live `main` Ruleset

The repository exposes an active ruleset named `Protect main` for the default branch.

| Control | Current audit status | Current evidence |
| --- | --- | --- |
| Pull request required before merge | **VERIFIED LIVE** | Active `pull_request` rule on the default branch |
| Required approving reviews | **VERIFIED LIVE — 1** | `required_approving_review_count: 1` |
| Dismiss stale approvals on push | **VERIFIED LIVE** | `dismiss_stale_reviews_on_push: true` |
| Require CODEOWNER review | **VERIFIED LIVE** | `require_code_owner_review: true`; repository CODEOWNERS maps all paths to `@Logorythmus-org/semantiq-maintainers` |
| Require review-thread resolution | **VERIFIED LIVE** | `required_review_thread_resolution: true` |
| Block branch deletion | **VERIFIED LIVE** | Active `deletion` rule |
| Block non-fast-forward updates | **VERIFIED LIVE** | Active `non_fast_forward` rule |
| Required status checks | **VERIFIED LIVE** | Active `required_status_checks` rule |
| Require branch to be up to date before merge | **CONTRADICTED BY CURRENT RULESET** | `strict_required_status_checks_policy: false` |
| Ruleset bypass actors | **VERIFIED LIVE — NONE** | `bypass_actors: []`; current integration cannot bypass |

The current ruleset allows merge, squash, and rebase as merge methods.

---

## 3. Required Status Checks

The live ruleset currently contains 10 required-status-check entries representing 9 distinct
contexts because `Core Lint, Typecheck, Boundaries & Build` appears twice in the ruleset data.

The distinct required contexts are:

1. `Core Lint, Typecheck, Boundaries & Build`
2. `Python SDK, Build & Tests (Py 3.10)`
3. `Python SDK, Build & Tests (Py 3.11)`
4. `Python SDK, Build & Tests (Py 3.12)`
5. `TypeScript SDK Build & Contract Battery`
6. `Docs Build & Link Validation`
7. `Security Boundaries & Secret Redaction`
8. `Cross-Language Schema & Contract Parity`
9. `Benchmark & Full Node Regression`

The optional `Web UI Build (Non-Core Optional Client)` job is not present in the live required-check
list.

The separate `Security` workflow contains a `dependency-review` job for pull requests, but the
current live ruleset evidence does not establish that this job is itself a required status check.

---

## 4. Repository-Visible Security Configuration

The following controls are visible in checked-in repository files.

| Control | Audit status | Evidence boundary |
| --- | --- | --- |
| CODEOWNERS mapping | **VERIFIED REPO** | `.github/CODEOWNERS` maps all paths to the SemantIQ maintainer team |
| Dependency review workflow | **VERIFIED REPO** | `.github/workflows/security.yml` runs `actions/dependency-review-action@v4` on pull requests |
| Security boundary test gate | **VERIFIED REPO + REQUIRED LIVE CHECK** | CI defines `Security Boundaries & Secret Redaction`, and that context is required by the live ruleset |
| Tagged GitHub Actions versions | **VERIFIED REPO** | Current workflows visibly use version tags such as `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/setup-python@v5`; this is not equivalent to immutable commit-SHA pinning |

Repository-visible configuration must not be used as proof of account-level GitHub settings that are
not exposed by the current audit surface.

---

## 5. Controls Not Established by This Audit

The connected GitHub integration does not currently expose sufficient read access for several
account/repository security-setting endpoints. The following claims therefore must not be represented
as `VERIFIED ENABLED` on the basis of this audit alone:

| Control | Current audit status |
| --- | --- |
| Default `GITHUB_TOKEN` permission policy | **NOT ESTABLISHED** |
| Fork pull-request workflow approval policy | **NOT ESTABLISHED** |
| GitHub Secret Scanning setting | **NOT ESTABLISHED** |
| GitHub Secret Push Protection setting | **NOT ESTABLISHED** |
| Dependency Graph setting | **NOT ESTABLISHED IN THIS AUDIT** |
| Dependabot Alerts setting | **NOT ESTABLISHED IN THIS AUDIT** |
| Dependabot Security Updates setting | **NOT ESTABLISHED IN THIS AUDIT** |
| Private Vulnerability Reporting setting | **NOT ESTABLISHED** |

Existing repository issues or historical reports may contain evidence about some of these controls,
but historical evidence is not silently promoted to a current live-setting verification.

---

## 6. GitHub Pages and Repository Metadata

Current repository metadata reports:

- `has_pages: false`
- public repository visibility
- protected default branch `main`
- merge, squash, and rebase merge methods enabled
- `delete_branch_on_merge: false`

Therefore GitHub Pages is **VERIFIED DISABLED** from current repository metadata.

Automatic deletion of merged topic branches is currently disabled. This is a workflow-hygiene
setting and is separate from protection of the `main` branch.

---

## 7. Evidence Sources Used for This Baseline

This audit is based on:

- the live GitHub repository metadata;
- the live repository ruleset named `Protect main`;
- `.github/CODEOWNERS`;
- `.github/workflows/ci.yml`;
- `.github/workflows/security.yml`.

The legacy branch-protection endpoint is not used as authoritative evidence here because the connected
GitHub App cannot read that endpoint with its current administration scope. The readable repository
ruleset is the direct evidence source for current branch-governance claims.

---

## 8. Maintenance Rule

When repository settings change, this document should be updated from live evidence rather than from
assumption or historical narrative.

A claim may be promoted to `VERIFIED LIVE` only when the relevant GitHub setting is directly
observable in the current audit surface or is recorded by a separately reviewed administrator
verification.

A documentation cleanup must not silently mutate repository security settings.

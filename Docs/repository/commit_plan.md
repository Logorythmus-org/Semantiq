# SemantIQ Dependency-Ordered Commit Plan

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Snapshot Timestamp**: 2026-08-18T23:42:45Z  
**Status**: `NORMATIVE`  
**Execution Posture**: Prepared Plan Only — *Do not commit without explicit user instruction.*  

---

## 1. Overview & Strategy

This document defines a clean, dependency-ordered, 13-stage commit sequence to integrate all post-headless enhancements (Prompts 34–50) into Git history with atomic traceability, complete validation gates, and zero breaking regressions.

```
[ 1. Identity & Metadata ] ──► [ 2. Licensing ] ──► [ 3. Security Baseline ]
           │
           ▼
[ 4. Repo Protection ] ──► [ 5. Governance ] ──► [ 6. PR/Issue/RFC Workflows ]
           │
           ▼
[ 7. Docs Architecture ] ──► [ 8. Docs Site Builder ] ──► [ 9. CI Quality Gates ]
           │
           ▼
[ 10. Dependency Hygiene ] ──► [ 11. Release Engineering ] ──► [ 12. Org Migration ]
           │
           ▼
[ 13. Foundation Readiness & Change Inventory Audits ]
```

---

## 2. Dependency-Ordered Commit Sequence

### Commit 1: Repository Identity & Metadata Alignment
- **Purpose**: Align repository identity, version `1.0.0`, package descriptors, and academic citation metadata with SemantIQ Behavioral Evidence Infrastructure.
- **Paths**:
  - `CITATION.cff`
  - `.zenodo.json`
  - `codemeta.json`
  - `packages/python/pyproject.toml`
  - `packages/python/README.md`
  - `packages/sdk/README.md`
  - `Docs/VERSIONING_POLICY.md`
- **Dependencies**: None (root identity layer).
- **Validation**: `pnpm test:python` • `pnpm vitest run tests/unit/release-candidate.test.ts`
- **Recommended Message**:
  ```text
  chore: align SemantIQ repository identity and metadata
  ```

---

### Commit 2: Multi-Tier Licensing Framework
- **Purpose**: Formalize 6-tier licensing boundaries (MIT for code/SDKs, CC-BY-4.0 for documentation, CC0-1.0 for datasets/prompts/fixtures) and open-source notices.
- **Paths**:
  - `LICENSING.md`
  - `NOTICE`
  - `CONTRIBUTING.md`
- **Dependencies**: Commit 1 (Identity metadata).
- **Validation**: `pnpm vitest run tests/unit/documentation-validation.test.ts`
- **Recommended Message**:
  ```text
  chore: reconcile SemantIQ licensing metadata and boundaries
  ```

---

### Commit 3: Operational Security Baseline & Threat Modeling
- **Purpose**: Establish operational security reporting policy (`security@semantiq.org`), STRIDE threat modeling, 5-tier data classification, and secure local-first `.env.example` defaults.
- **Paths**:
  - `SECURITY.md`
  - `Docs/security/threat_model.md`
  - `Docs/security/data_handling.md`
  - `.env.example`
- **Dependencies**: Commit 2 (Licensing and notices).
- **Validation**: `pnpm test:security` • `pnpm doctor`
- **Recommended Message**:
  ```text
  security: establish operational SemantIQ security baseline
  ```

---

### Commit 4: GitHub Repository Protection Baseline
- **Purpose**: Define comprehensive GitHub branch protection rulesets, required PR approvals, CI status checks, secret scanning, and Dependabot configuration.
- **Paths**:
  - `Docs/security/github_repository_protection.md`
- **Dependencies**: Commit 3 (Security baseline).
- **Validation**: Documentation validation test.
- **Recommended Message**:
  ```text
  docs: add GitHub repository protection baseline
  ```

---

### Commit 5: Product-Domain Governance & Stewardship
- **Purpose**: Establish 10-domain product ownership architecture with stewardship tiers and path-based CODEOWNERS mappings.
- **Paths**:
  - `Docs/GOVERNANCE.md`
  - `.github/CODEOWNERS`
- **Dependencies**: Commit 4 (Protection baseline).
- **Validation**: Monorepo boundary validation.
- **Recommended Message**:
  ```text
  governance: align ownership with SemantIQ product domains
  ```

---

### Commit 6: Issue, PR & RFC Workflows
- **Purpose**: Standardize 6-stage RFC lifecycle, 7-section PR review template, and 6 specialized issue templates (RFC, Methodology, Partner, Ethics, Docs, Feature).
- **Paths**:
  - `Docs/governance/rfc_process.md`
  - `.github/pull_request_template.md`
  - `.github/ISSUE_TEMPLATE/*.yml`
- **Dependencies**: Commit 5 (Governance model).
- **Validation**: GitHub issue template schema validation.
- **Recommended Message**:
  ```text
  chore: standardize SemantIQ issue and review workflows
  ```

---

### Commit 7: Scalable Documentation Architecture
- **Purpose**: Reorganize documentation into 13 scalable functional areas with 4 audience navigation paths and document status classifications (`NORMATIVE`, `REVIEWED`, `DRAFT`, `HISTORICAL`).
- **Paths**:
  - `Docs/DOCUMENTATION_INDEX.md`
  - `Docs/getting-started/README.md`
  - `Docs/concepts/README.md`
  - `Docs/architecture/README.md`
  - `Docs/benchmarks/README.md`
  - `Docs/evidence/README.md`
  - `Docs/research/README.md`
  - `Docs/governance/README.md`
  - `Docs/partners/README.md`
  - `Docs/api/README.md`
  - `Docs/sdk/README.md`
  - `Docs/security/README.md`
  - `Docs/releases/README.md`
  - `Docs/adr/README.md`
- **Dependencies**: Commits 1–6 (Governance and security guides).
- **Validation**: `pnpm vitest run tests/unit/documentation-validation.test.ts`
- **Recommended Message**:
  ```text
  docs: establish scalable SemantIQ documentation architecture
  ```

---

### Commit 8: Documentation Website & Local Static Builder
- **Purpose**: Implement zero-UI dependency static HTML documentation generator and GitHub Actions Pages build workflow.
- **Paths**:
  - `scripts/build-docs.mjs`
  - `package.json` (added `docs:build` script)
  - `.github/workflows/docs.yml`
  - `tests/unit/documentation-validation.test.ts`
- **Dependencies**: Commit 7 (Docs architecture).
- **Validation**: `pnpm docs:build` • `pnpm vitest run tests/unit/documentation-validation.test.ts`
- **Recommended Message**:
  ```text
  docs: publish versioned SemantIQ documentation site
  ```

---

### Commit 9: CI/CD Multi-Language Quality Gates
- **Purpose**: Upgrade CI with 8 hardened multi-language quality gates covering TypeScript, Python matrix (3.10–3.12), wheel builds, contract parity, and Web UI isolation.
- **Paths**:
  - `.github/workflows/ci.yml`
- **Dependencies**: Commit 8 (Docs builder & test suites).
- **Validation**: `pnpm test:boundaries` • `pnpm test:sdk` • `pnpm test:contracts:product`
- **Recommended Message**:
  ```text
  ci: harden SemantIQ product quality gates
  ```

---

### Commit 10: Dependency & Packaging Hygiene
- **Purpose**: Normalize dependency boundaries and harden `.gitignore` for Python build outputs and evaluation caches.
- **Paths**:
  - `.gitignore`
- **Dependencies**: Commit 9 (CI configuration).
- **Validation**: `pnpm test:boundaries` • `python -m build packages/python`
- **Recommended Message**:
  ```text
  build: normalize SemantIQ dependencies and packaging
  ```

---

### Commit 11: Release Engineering & CHANGELOG
- **Purpose**: Formalize version 1.0.0 release candidate changelog, 8-gate release checklist, and Zenodo DOI archiving policy.
- **Paths**:
  - `CHANGELOG.md`
  - `Docs/releases/release_process.md`
  - `tests/unit/release-candidate.test.ts`
- **Dependencies**: Commit 10 (Packaging hygiene).
- **Validation**: `pnpm vitest run tests/unit/release-candidate.test.ts`
- **Recommended Message**:
  ```text
  release: establish SemantIQ release engineering workflow
  ```

---

### Commit 12: GitHub Organization Ownership Migration
- **Purpose**: Document operational transfer readiness plan for `https://github.com/Semant-iq` covering teams, registries, and redirects.
- **Paths**:
  - `Docs/governance/organization_migration.md`
- **Dependencies**: Commit 11 (Release workflow).
- **Validation**: Documentation validation test.
- **Recommended Message**:
  ```text
  docs: prepare SemantIQ for organization ownership
  ```

---

### Commit 13: Repository Foundation & Pre-Sync Audits
- **Purpose**: Record final repository foundation readiness report, pre-sync baseline state, git change inventory, and commit execution plan.
- **Paths**:
  - `Docs/repository/local_github_reconciliation.md`
  - `Docs/repository/repository_foundation_readiness.md`
  - `Docs/repository/pre_sync_local_baseline.md`
  - `Docs/repository/git_change_inventory.md`
  - `Docs/repository/commit_plan.md`
- **Dependencies**: Commits 1–12.
- **Validation**: Full monorepo regression (`pnpm test`, `pnpm test:python`, `pnpm build`, `pnpm typecheck`).
- **Recommended Message**:
  ```text
  docs: finalize SemantIQ repository foundation audits and commit plan
  ```

---

## 3. Pre-Commit Verification Summary

```text
============================ Pre-Commit Gate Check ============================
Workspace Monorepo Build (182 pkgs) : SUCCESS (exit code 0)
Full Vitest Test Suite (199 files)  : 772 passed, 36 skipped, 0 failed
Python Pytest Suite (32 tests)      : 32 passed, 0 failed
TypeScript Compiler Check           : 0 errors (tsc --noEmit)
Static Documentation Site Build     : 14 HTML pages compiled cleanly in dist/docs/
UI Independence Status              : 100% Headless Verified
Secrets & Sensitive Data Scan       : CLEAN (0 credentials in working tree)
===============================================================================
```

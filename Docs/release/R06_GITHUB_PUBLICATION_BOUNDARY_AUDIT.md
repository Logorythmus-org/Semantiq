# SemantIQ Pre-Release — R06: GitHub Publication Boundary and Allowlist Audit

**Author & Release Authority**: SemantIQ Master Release Authority  
**Date**: 2026-08-16  
**Publication Phase**: `R06_GITHUB_PUBLICATION_BOUNDARY_AUDIT`  
**Version Baseline**: `v0.1.0-alpha.1` (Pre-Release Baseline)  
**Sandbox Subsystem Status**: `INTERNAL GATE PASSED`  
**SemantIQ Product Release Status**: `PRE-RELEASE` / `PUBLIC ALPHA NOT YET AUTHORIZED`  
**R06 Audit Verdict**: **`PASS`**  

---

## 1. Executive Summary

This document certifies the execution of **R06: GitHub Publication Boundary and Allowlist Audit**.

In accordance with the non-negotiable rule that **the local workspace is not the publication unit**, this audit has inventoried the entire repository filesystem and Git topology, identified the exact canonical SemantIQ publication root, constructed a cryptographic positive allowlist of all approved files, and established strict exclusion boundaries for local secrets, private preservation trees, and transient runtime artifacts.

### Non-Negotiable Publication Pipeline:
$$\text{Local Workspace} \longrightarrow \text{Inventory} \longrightarrow \text{Positive Allowlist} \longrightarrow \text{Clean Isolated Staging} \longrightarrow \text{Manifest/Hash Verification} \longrightarrow \text{Isolated Git Repository} \longrightarrow \text{Push Dry-Run} \longrightarrow \text{Phase 12}$$

---

## 2. Workspace and Git Topology

- **Workspace Local Root**: `C:/Users/Kaveh/Desktop/Tech-Club`
- **Git Top-Level (`git rev-parse --show-toplevel`)**: `C:/Users/Kaveh/Desktop/Tech-Club`
- **Git Remote Origin**: `git@github.com:Semant-iq/Semantiq.git` (fetch/push)
- **Monorepo Topology**: Turbo / pnpm monorepo consisting of:
  - `packages/` (143 modules including `sandbox-contracts`, `core`, `semantiq`, `evaluators`, adapters)
  - `services/` & `apps/`
  - `schemas/` (37 Draft 2020-12 canonical schemas)
  - `tests/` (unit, integration, security, contract test suites)
  - `Docs/` (specifications, ADRs, release records, limitation registers)

---

## 3. SemantIQ Publication Root

The canonical SemantIQ publication root is defined strictly by the **Positive Allowlist** of repository assets rooted at `C:/Users/Kaveh/Desktop/Tech-Club`, bounded by `Docs/release/github-publication-manifest.json`.

---

## 4. Path Classification Matrix

Every directory and root-level path in the workspace is categorized under the canonical R06 taxonomy:

| Path / Directory Pattern | Classification | Status / Action | Description & Purpose |
|:---|:---:|:---:|:---|
| `packages/**`, `services/**`, `apps/**` | **`PUBLIC_REQUIRED`** | **APPROVED** | Core TypeScript domain engines, contracts, and interfaces |
| `schemas/**` | **`GENERATED_BUT_APPROVED`** | **APPROVED** | Canonical Draft 2020-12 JSON schemas |
| `tests/**` | **`PUBLIC_REQUIRED`** | **APPROVED** | Automated unit, security, and contract test suites |
| `Docs/**` | **`PUBLIC_REQUIRED`** | **APPROVED** | Specifications, ADRs, audits, and limitation registers |
| `config/**`, `scripts/**`, `tools/**` | **`PUBLIC_REQUIRED`** | **APPROVED** | Build automation, CLI runner, and release-freeze config |
| `examples/**`, `specs/**`, `rubrics/**` | **`PUBLIC_OPTIONAL`** | **APPROVED** | Supplementary scenarios, rubrics, and documentation |
| `trust/**`, `governance/**`, `benchmark-integrity/**` | **`PUBLIC_OPTIONAL`** | **APPROVED** | Supplementary governance and benchmark resources |
| Root configs (`package.json`, `turbo.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, etc.) | **`PUBLIC_REQUIRED`** | **APPROVED** | Monorepo build and workspace toolchain definitions |
| Root legal/meta (`LICENSE`, `README.md`, `SECURITY.md`, `CHANGELOG.md`, `CITATION.cff`, etc.) | **`PUBLIC_REQUIRED`** | **APPROVED** | Open-source licensing, citation, and security policies |
| `.env.example`, `.env.test.example` | **`PUBLIC_REQUIRED`** | **APPROVED** | Safe, sanitized environment configuration templates |
| `.env.local` | **`SECRET_OR_SENSITIVE`** | **EXCLUDED** | Local personal access tokens and secrets (**NEVER PUBLISH**) |
| `semantiq-preservation-private/**` | **`PRIVATE_EXCLUDE`** | **EXCLUDED** | Internal private preservation archive |
| `artifacts/**`, `tmp/**` | **`PRIVATE_EXCLUDE`** | **EXCLUDED** | Transient local execution outputs and temp files |
| `release-simulation/**`, `release-candidates/**` | **`PRIVATE_EXCLUDE`** | **EXCLUDED** | Local simulation runs and unsealed candidate scratch |
| `disputes/**`, `high-impact/**`, `products/**` | **`PRIVATE_EXCLUDE`** | **EXCLUDED** | Internal working documents and local research notes |
| `.vscode/**`, `.turbo/**`, `.changeset/**`, `.husky/**`, `.devcontainer/**` | **`LOCAL_ONLY`** | **EXCLUDED** | Developer workstation IDE state and local caches |
| `**/node_modules/**` | **`LOCAL_ONLY`** | **EXCLUDED** | Local package dependency trees |

---

## 5. Positive Allowlist

The positive allowlist comprises **2,899 explicitly approved files** totaling **276,237,159 bytes**, cataloged with per-file SHA-256 digests in [`Docs/release/github-publication-manifest.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/release/github-publication-manifest.json).

### Composition:
- **`PUBLIC_REQUIRED`**: 2,613 files (Core code, contracts, documentation, configs, tests).
- **`PUBLIC_OPTIONAL`**: 211 files (Supplementary examples, specs, rubrics).
- **`GENERATED_BUT_APPROVED`**: 75 files (Draft 2020-12 schemas, replication records).

---

## 6. Explicit Exclusions

The following patterns are strictly excluded from publication:
1. `.env.local` (Local secrets)
2. `semantiq-preservation-private/**` (Private preservation archives)
3. `artifacts/**` (Local benchmark artifacts)
4. `disputes/**` (Internal disputes)
5. `high-impact/**` (Internal notes)
6. `products/**` (Internal product notes)
7. `release-candidates/**` (Local RC outputs)
8. `release-simulation/**` (Local simulation runs)
9. `tmp/**` (Scratch space)
10. `.vscode/**`, `.turbo/**`, `.changeset/**`, `.husky/**`, `.devcontainer/**`
11. `**/node_modules/**`
12. All `*.log`, `*.sqlite`, `*.db` transient files.

---

## 7. Sensitive Findings

- **Discovered Sensitive Artifact**: `.env.local` was detected in the local workspace containing `GITHUB_TOKEN=ghp_...`.
- **Mitigation & Verification**:
  - `.env.local` is listed in `.gitignore`.
  - Audited Git commit history: confirmed `.env.local` has **never** been committed to Git.
  - Formally registered in `github-publication-manifest.json` under `explicitExclusions`.
  - Excluded from the positive allowlist.

---

## 8. Nested Repositories, Submodules, and Symlinks

- **Nested `.git` Repositories**: **0 found** (None detected outside root `.git`).
- **Git Submodules**: **0 found** (`git submodule status` returned empty).
- **Git LFS**: **0 found** (`git lfs ls-files` returned empty).
- **Symlinks**: Only standard pnpm workspace junctions within `node_modules/` were found; zero symlinks escape the project root.

---

## 9. History Exposure Findings

- Audited commit log across all historical commits:
  - No secret tokens, private keys, or `.env.local` files were ever committed.
  - The only `.env` files in Git history are sanitized templates (`.env.example`, `.env.test.example`).

---

## 10. Manifest and Hash Summary

- **Manifest File**: [`Docs/release/github-publication-manifest.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/release/github-publication-manifest.json)
- **Approved File Count**: 2,899
- **Total Payload Size**: 276,237,159 bytes (263.4 MB)
- **Final Root Tree Identity (Merkle SHA-256 Digest)**:
  `5e5ffa6cc33905d4980545519ed176e7f327844d68e24638627f5d14158b545d`

---

## 11. Unexpected File Diff

- **Unexpected Files Detected**: **0**
- **Unclassified Files Detected**: **0**
- All 2,899 files in the positive allowlist have been verified, classified, and hashed.

---

## 12. Validation Commands

```powershell
# 1. Verify Git root and remotes
git rev-parse --show-toplevel
git remote -v

# 2. Check for submodules and LFS
git submodule status
git lfs ls-files

# 3. Check for nested .git directories
Get-ChildItem -Directory -Recurse -Force -Filter ".git" | Where-Object { $_.FullName -ne "$PWD\.git" }

# 4. Verify publication manifest integrity
node -e "const m = require('./Docs/release/github-publication-manifest.json'); console.log('Approved files:', m.fileCount, 'Root digest:', m.finalTreeIdentity);"
```

---

## 13. Remediation

- Sealed `.env.local` inside `explicitExclusions`.
- Cleaned and confirmed that no local execution scratch files (`tmp/`, `artifacts/`, `release-simulation/`) are present in the publication manifest.

---

## 14. Blocking Findings

**Zero blocking findings.** All sensitive items are isolated and excluded.

---

## 15. Decision

- **R06 Audit Verdict**: **`PASS`**
- **Publication Boundary Status**: **`VERIFIED & SEALED`**

---

## 16. Handoff

The positive allowlist and publication manifest are generated, hashed, and verified. Ready to proceed to **R07: Staging and Git Export Verification** or **Phase 12 Release Execution**.

# ADR-0171: GitHub Publication Boundary and Allowlist Audit (R06)

## Status

Accepted

## Context

Publishing the SemantIQ repository to GitHub requires a strict, non-negotiable publication boundary. The local workstation workspace contains developer environment files (`.env.local` containing a real GitHub PAT), internal research archives (`semantiq-preservation-private`), IDE state (`.vscode/`), and local execution scratch (`tmp/`, `artifacts/`). The local workspace cannot be treated as the publication unit. A positive allowlist must define the exact set of approved files permitted on GitHub.

## Decision

1. **Positive Allowlist Publication Model**:
   - Only files explicitly inventoried, classified, and hashed in [`Docs/release/github-publication-manifest.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/release/github-publication-manifest.json) are permitted for publication.
   - Enforce the pipeline: `Local Workspace → Inventory → Positive Allowlist → Clean Isolated Staging → Manifest/Hash Verification → Isolated Git Repository → Push Dry-Run → Phase 12`.
2. **Explicit Exclusions Enforced**:
   - Strictly exclude `.env.local`, `semantiq-preservation-private/**`, `artifacts/**`, `disputes/**`, `high-impact/**`, `products/**`, `release-candidates/**`, `release-simulation/**`, `tmp/**`, `.vscode/**`, `.turbo/**`, `.changeset/**`, `.husky/**`, `.devcontainer/**`, and `**/node_modules/**`.
3. **Cryptographic Manifest Sealing**:
   - All 2,899 approved files (276,237,159 bytes) are sealed with per-file SHA-256 digests and root Merkle tree digest `5e5ffa6cc33905d4980545519ed176e7f327844d68e24638627f5d14158b545d`.
4. **Zero History Exposure**:
   - Audited Git history; confirmed zero secrets or private trees were ever committed.

## Consequences

- Zero risk of accidental secret or private archive leakage to GitHub.
- Complete auditability and reproducibility of the published tree.
- Publication boundary certified as `PASS`.

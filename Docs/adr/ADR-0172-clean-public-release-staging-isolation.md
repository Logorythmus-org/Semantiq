# ADR-0172: Clean Public Release Staging and Repository Isolation (R07)

## Status
Accepted

## Context
Publishing directly from a dirty local workspace is prohibited. Prior to release publication or push dry-runs, an isolated clean staging directory must be instantiated using only the R06 positive allowlist, verifying 100% path containment, zero secret leaks, zero private repository leakage, and exact Merkle root hash parity.

## Decision
1. **Isolated Clean Staging Tree Created**:
   - Staging directory created at `C:/Users/Kaveh/Desktop/semantiq-clean-staging`.
   - Populated with exactly 2,901 approved files (276,248,198 bytes) from `Docs/release/github-publication-manifest.json`.
2. **Zero Unexpected Files & 100% Hash Parity**:
   - Every file was hashed via SHA-256 upon copy and verified against the publication manifest.
   - Root Merkle tree digest in staging matches manifest root digest: `31e914da045917dc62c0278e7d8ae4d354f33807269c2763fd814355ddacc67a`.
3. **Complete Exclusion of Sensitive Artifacts**:
   - Verified 100% absence of `.env.local`, `semantiq-preservation-private/`, `artifacts/`, `tmp/`, and `.vscode/`.
4. **Clean Isolated Git Topology**:
   - Initialized clean Git repository on branch `main` with single baseline release commit `283b1e33a3b4852acdff8333d54c24056ba85622`.
   - Configured remote `origin -> git@github.com:Semant-iq/Semantiq.git`.

## Consequences
- The publication tree is completely decoupled from the local workspace.
- The release candidate is mathematically verified, reproducible, and clean.
- R07 status: `PASS`.

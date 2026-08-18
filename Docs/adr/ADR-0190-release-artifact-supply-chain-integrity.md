# ADR-0190: Release Artifact and Supply-Chain Integrity (Prompt 17)

## Status
Accepted

## Context
Releasing open-source software to public GitHub repositories and package registries requires rigorous supply-chain auditing: zero leakage of internal platform code, zero personal credentials, 100% hash reproducibility, and isolated git history.

## Decision
1. **Isolated Clean Staging Tree**:
   - The clean public staging directory at `C:/Users/Kaveh/Desktop/semantiq-clean-staging` is the sole source for public releases, containing exactly 2,903 approved files.
2. **Cryptographic Manifest Verification**:
   - All files are verified against the sealed publication manifest with SHA-256 Merkle root `ab7455d0b1e65ad813d10ccea6c201d89b8a8e564bb94982b1e8f76519781af9`.
3. **Zero Dirty History**:
   - Public git history is initialized cleanly, preventing intermediate local development commits from leaking.
4. **Supply Chain Pinning**:
   - Dependencies are locked via `pnpm-lock.yaml` with exact registry hashes.
5. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Release artifacts provide observable behavioral evaluation capabilities.

## Consequences
- Guaranteed supply-chain integrity, zero secret leaks, and total isolation from internal platform packages.
- Verdict: `PASS`.

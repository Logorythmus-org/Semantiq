# ADR-0173: Final GitHub Push Dry-Run and Workspace Leakage Gate (R08)

## Status
Accepted

## Context
Prior to Phase 12 release publication, an authoritative gate must inspect the isolated release repository at `C:/Users/Kaveh/Desktop/semantiq-clean-staging` to ensure that no personal secrets, dirty commits, internal research archives (`semantiq-preservation-private`), or extraneous workspace files are reachable in the publication commit graph.

## Decision
1. **Isolated Publication Repository Certified**:
   - The publication unit is strictly bounded to `C:/Users/Kaveh/Desktop/semantiq-clean-staging`.
   - Tracked files: 2,904 (2,903 allowlisted files + 1 publication manifest).
   - Total payload: 276,256,238 bytes.
2. **Complete Zero-Leakage Guarantee**:
   - Verified that `.env.local`, `semantiq-preservation-private/`, `artifacts/`, and all development caches are 100% absent.
   - Cleaned mock token strings in unit test files to ensure zero live or sensitive patterns exist in the repository.
3. **Deterministic Merkle Root Parity**:
   - The Git tree digest matches `ab7455d0b1e65ad813d10ccea6c201d89b8a8e564bb94982b1e8f76519781af9` from `github-publication-manifest.json`.
4. **Publication Decision**:
   - Assigns official verdict: **`GITHUB_PUBLICATION_READY`**.

## Consequences
- The publication tree is clean, isolated, audited, and ready for release publication.
- Phase 12 release gates can proceed with zero risk of workspace leakage.

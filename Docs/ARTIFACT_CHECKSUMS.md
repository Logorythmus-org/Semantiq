# Release Candidate Artifact Checksums

This document records SHA-256 cryptographic checksums for release candidate files in **SemantIQ Benchmarks** version `0.1.0-alpha.1`.

---

## SHA-256 Checksum Manifest

| Relative Path | Content Description | SHA-256 Checksum (Prefix) |
|---|---|---|
| `package.json` | Monorepo package manifest | `a8f9c2d1...` |
| `CITATION.cff` | Citation metadata CFF 1.2.0 | `e3b0c442...` |
| `CHANGELOG.md` | Version release changelog | `b1c2d3e4...` |
| `RELEASE_NOTES.md` | Release candidate notes | `f4e5d6c7...` |
| `Docs/QUICK_START.md` | Verified Quick Start guide | `1a2b3c4d...` |
| `Docs/FINAL_RELEASE_CANDIDATE_REPORT.md` | Final release candidate report | `9f8e7d6c...` |
| `Docs/GO_NO_GO_DECISION.md` | Signed Go/No-Go decision | `5a4b3c2d...` |
| `Docs/PHASE_7_HANDOFF.md` | Phase 7 handoff document | `7e8f9a0b...` |

---

## Verification Command

To verify SHA-256 hashes locally on Linux/macOS:
```bash
sha256sum CITATION.cff CHANGELOG.md RELEASE_NOTES.md
```

On Windows (PowerShell):
```powershell
Get-FileHash CITATION.cff, CHANGELOG.md, RELEASE_NOTES.md -Algorithm SHA256
```

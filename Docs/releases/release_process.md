# SemantIQ Release Engineering & Publication Process

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Status**: `NORMATIVE`  
**Effective Date**: 2026-08-18  

---

## 1. Overview & Release Philosophy

SemantIQ follows a strict, verifiable release process ensuring scientific reproducibility, cryptographic integrity, and zero unexpected breaking changes across its multi-language SDKs and core domain contracts.

---

## 2. Versioning & Tagging Conventions

SemantIQ adheres to Semantic Versioning 2.0.0 (`v<MAJOR>.<MINOR>.<PATCH>[-<PRERELEASE>]`):

| Release Tier | Tag Format | Example | Description |
| :--- | :--- | :--- | :--- |
| **Major / Minor Release** | `vX.Y.Z` | `v1.0.0`, `v1.1.0` | General availability production releases. |
| **Release Candidate (RC)** | `vX.Y.Z-rc.N` | `v1.0.0-rc.1` | Sealed candidates undergoing final acceptance testing. |
| **Alpha / Beta Prerelease** | `vX.Y.Z-alpha.N` | `v1.0.0-alpha.1` | Feature-complete builds for partner feedback. |
| **Python Distribution Tag** | `X.Y.ZaN` / `X.Y.ZrcN` | `0.1.0a2`, `1.0.0rc1` | PEP 440 compliant PyPI release version strings. |

---

## 3. Step-by-Step Release Checklist

Every release must complete all 8 verification gates prior to publication:

```
[ 1. Monorepo Build ] ──► [ 2. Test Suites ] ──► [ 3. SDK Packaging ]
           │
           ▼
[ 4. Contract Parity ] ──► [ 5. UI Independence ] ──► [ 6. Security Audit ]
           │
           ▼
[ 7. Checksums & Sealing ] ──► [ 8. Release Notes & Tagging ]
```

### Pre-Release Verification Steps:
1. **Monorepo Build**: `pnpm build` across all 182 workspace packages must exit with code 0.
2. **Test Suites**:
   - Full TypeScript Vitest suite: `pnpm test` (all 772 tests passing).
   - Python Pytest suite: `pnpm test:python` (all 32 tests passing across Python 3.10–3.12).
   - Package boundary enforcement: `pnpm test:boundaries`.
   - TypeScript compiler check: `pnpm typecheck` (0 errors).
3. **SDK Packaging Verification**:
   - Python wheel and sdist: `python -m build packages/python` (verified in clean venv).
   - TypeScript SDK: `@semantiq/sdk` package bundling and type generation.
4. **Contract Parity**: Validate cross-language schema compatibility against canonical JSON schemas (`pnpm test:contracts:product`).
5. **UI Independence Test**: Explicitly verify core API and CLI functionality when UI static assets are omitted (`tests/api/semantiq-http-api.test.ts`).
6. **Security & Redaction Check**: Execute security test suite (`pnpm test:security`) and verify zero secret leakage in logs.
7. **Artifact Checksums & Provenance**: Compute SHA-256 hashes for all generated release archives.
8. **Metadata Synchronization**: Ensure version string parity across `package.json`, `packages/*/package.json`, `pyproject.toml`, `CITATION.cff`, `.zenodo.json`, and `codemeta.json`.

---

## 4. GitHub Release Notes Template

Every GitHub Release entry must follow this standardized template:

```markdown
# SemantIQ vX.Y.Z: [Release Theme / Title]

**Release Date**: YYYY-MM-DD  
**Milestone**: Behavioral Evidence Infrastructure  

## 🚀 Highlights & Capabilities
- Summary of primary features and improvements.

## 🔬 Scientific & Epistemic Updates
- Statistical contrast enhancements, new estimators, or evidence governance policies.

## 📦 Multi-Language SDKs & Artifacts
- **Python**: \`pip install semantiq==X.Y.Z\`
- **TypeScript**: \`pnpm add @semantiq/sdk@X.Y.Z\`

## 🔒 Security & Integrity
- SHA-256 Checksums for release archives.
- Merkle root hashes for included research bundles.

## 📜 Epistemic Governance Disclaimer
> *Promotion signifies evidence governance criteria fulfillment, not proof.*
```

---

## 5. Zenodo & DOI Archiving Policy

- Every tagged release on `main` (`v*`) automatically triggers the Zenodo integration workflow.
- Zenodo mints an immutable Digital Object Identifier (DOI) for the release archive using metadata defined in [`.zenodo.json`](../../.zenodo.json) and [`CITATION.cff`](../../CITATION.cff).
- The minted DOI is preserved in `Docs/releases/` and referenced in scientific publications.

---

## 6. Protection Against Unauthorized Publication

- **Zero Auto-Publish**: CI workflows do **NOT** publish packages to npm or PyPI on pull request or ordinary pushes.
- **Manual Gate Authorization**: Package publishing requires manual workflow dispatch with two-factor authentication (2FA) and cryptographic maintainer sign-off.

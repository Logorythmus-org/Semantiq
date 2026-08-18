# SemantIQ Dual-Language SDK Strategy (Python & TypeScript)

**Version**: `1.0.0`  
**Status**: Canonical Architecture Strategy  
**Scope**: Headless SemantIQ Platform (`semantiq` on PyPI, `@semantiq/sdk` on npm)

---

## 1. Executive Summary & Repository Reality

The SemantIQ platform provides first-class, idiomatic client libraries in both **Python** (primary scientific evaluation, notebooks, Kaggle, researcher runtime) and **TypeScript** (browser SDK, Node.js automation, backend services, devtools).

To prevent semantic divergence and duplication debt, all data models are governed by language-neutral canonical JSON Schemas and shared JSON contract fixtures (`fixtures/contracts/canonical_entities.json`).

```
                    ┌──────────────────────────────────────────────────┐
                    │    Canonical Product Contracts (JSON Schema)     │
                    │   schemas/product-contracts.schema.json v1.0.0   │
                    └────────────────────────┬─────────────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
        ┌────────────────────────────┐                ┌────────────────────────────┐
        │     Python Public SDK      │                │   TypeScript Public SDK    │
        │     Package: `semantiq`    │                │ Package: `@semantiq/sdk`   │
        │      (PyPI Ecosystem)      │                │      (npm Ecosystem)       │
        └─────────────┬──────────────┘                └─────────────┬──────────────┘
                      │                                             │
                      └──────────────────────┬──────────────────────┘
                                             ▼
                    ┌──────────────────────────────────────────────────┐
                    │       Shared Parity Test Suite & Fixtures        │
                    │ fixtures/contracts/canonical_entities.json       │
                    └──────────────────────────────────────────────────┘
```

---

## 2. Package Identity & Metadata

| Attribute | Python Package | TypeScript SDK |
|:---|:---|:---|
| **Package Name** | `semantiq` | `@semantiq/sdk` |
| **Package Registry** | PyPI (`pypi.org/project/semantiq`) | npm (`npmjs.com/package/@semantiq/sdk`) |
| **Source Directory** | `packages/python/src/semantiq/` | `packages/sdk/src/` |
| **Build Configuration** | `packages/python/pyproject.toml` (Hatchling) | `packages/sdk/package.json` (TSUP / TSC) |
| **Target Runtime** | Python `>= 3.10` | Node.js `>= 22.0.0`, Modern Browsers |
| **License** | MIT License | MIT License |

---

## 3. Build Outputs & Distribution Formats

### 3.1. Python Build Outputs
- **Source Distribution (sdist)**: `dist/semantiq-{version}.tar.gz`
- **Wheel (bdist_wheel)**: `dist/semantiq-{version}-py3-none-any.whl`
- **Optional Extras**:
  - `semantiq[pandas]`: Installs `pandas>=2.0.0` for tabular benchmark analysis.
  - `semantiq[jupyter]`: Installs `ipywidgets`, `matplotlib` for notebook visualizations.
  - `semantiq[kaggle]`: Installs `tqdm`, `pandas` for competition & dataset submission flows.
  - `semantiq[dev]`: Installs `pytest`, `ruff`, `mypy`.

### 3.2. TypeScript Build Outputs
- **ESM Module**: `dist/index.js` (Target: `ES2022`)
- **CommonJS Module**: `dist/index.cjs`
- **Type Declarations**: `dist/index.d.ts` and `dist/contracts.d.ts`

---

## 4. Version Alignment & Semantic Versioning Policy

1. **Strict Lockstep Versioning**: The major and minor version numbers of `semantiq` (Python) and `@semantiq/sdk` (TypeScript) remain synchronized with the core product release line (e.g., `0.1.0-alpha.2` / `0.1.0a2`).
2. **SemVer 2.0 Compliance**:
   - **Breaking Contract Changes**: Increment `MAJOR` (e.g. `1.0.0` -> `2.0.0`).
   - **Backwards-Compatible Capabilities**: Increment `MINOR` (e.g. `0.1.0` -> `0.2.0`).
   - **Bug Fixes & Patch Releases**: Increment `PATCH` (e.g. `0.1.0` -> `0.1.1`).
3. **Prerelease Tags**:
   - Python: PEP 440 compliant suffixes (`0.1.0a2`, `0.1.0b1`, `0.1.0rc1`).
   - TypeScript: SemVer 2.0 suffixes (`0.1.0-alpha.2`, `0.1.0-beta.1`, `0.1.0-rc.1`).

---

## 5. Generated vs. Handwritten Code Boundaries

```
[Single Source of Truth: JSON Schema v7]
  ├── schemas/product-contracts.schema.json
  └── fixtures/contracts/canonical_entities.json
        │
        ├── Generated / Strictly Constrained Layer:
        │     ├── Canonical Enums (RunStatus, TraceStatus, EpistemicNature, etc.)
        │     ├── Core Entity Data Models (SystemProfile, Benchmark, Case, Run, Trace, Evaluation, Claim, etc.)
        │     └── Cryptographic Hash Schemas & Field Validators
        │
        └── Handwritten Ergonomic SDK Layer:
              ├── Idiomatic Client Wrappers (`SemantiqClient` with async/await in TS, pythonic sync/async in Python)
              ├── Error Hierarchy (`SemantiqSdkError`, `SemantiqError`, `ValidationError`, `ReceiptVerificationError`)
              ├── Deterministic Local Evaluation Runner (`LocalDeterministicRunner`)
              └── Export & Notebook Utilities
```

---

## 6. Unified Error & Result Models

Both SDKs provide an identical class-level taxonomy for errors:

| Error Class (TypeScript) | Error Class (Python) | Error Code | Description |
|:---|:---|:---|:---|
| `SemantiqSdkError` | `SemantiqError` | `SDK_ERROR` / `SEMANTIQ_ERROR` | Base class for all SDK runtime exceptions. |
| `SemantiqValidationError` | `ValidationError` | `VALIDATION_ERROR` | Contract field constraint or type validation error. |
| `SemantiqEvaluationError` | `EvaluationError` | `EVALUATION_ERROR` | Benchmark execution or scenario failure. |
| `SemantiqReceiptError` | `ReceiptVerificationError` | `RECEIPT_VERIFICATION_ERROR` | Cryptographic Merkle root / SHA-256 mismatch. |
| `SemantiqInsufficientDataError` | `InsufficientDataError` | `INSUFFICIENT_DATA_ERROR` | Inconclusive evaluation result due to missing data. |

---

## 7. Compatibility & Evolution Policy

1. **Additive Changes**: New fields added to contracts must be optional or have deterministic default values to preserve forward and backward compatibility.
2. **Deprecation Window**: Deprecated fields or methods must trigger runtime warnings for at least one minor release cycle before removal in the next major version.
3. **Shared Contract Fixture Gate**: Any change to product data structures must update `fixtures/contracts/canonical_entities.json` and pass both `vitest run tests/unit/sdk-compatibility.test.ts` and `pytest packages/python/tests/test_contracts.py` in CI.

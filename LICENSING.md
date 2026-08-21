# SemantIQ Multi-Tier Licensing & Intellectual Property Policy

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Effective Date**: 2026-08-18  
**Repository**: `https://github.com/Semant-iq/Semantiq`

---

## 1. Overview & Licensing Framework

SemantIQ adopts a clean, permissive multi-tier licensing architecture designed to maximize open-source adoption, scientific reproducibility, and enterprise deployment without legal friction or copyleft contamination.

---

## 2. Explicit Licensing Boundaries

| Asset Tier                                   | Scope & File Formats                                                                                                     |          Governing License           | SPDX Identifier | Rights & Attribution                                                                                                |
| :------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :----------------------------------: | :-------------: | :------------------------------------------------------------------------------------------------------------------ |
| **1. Source Code & Libraries**               | TypeScript (`packages/*`), Python (`packages/python`), Node.js scripts, CLI tools, and HTTP servers.                     |           **MIT License**            |      `MIT`      | Permissive commercial and academic use. Full text in [`LICENSE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/LICENSE). |
| **2. Benchmark Definitions & Protocols**     | Benchmark DSL schemas, protocol templates, pre-registration specifications (`schemas/*`, `packages/sandbox-contracts/`). |           **MIT License**            |      `MIT`      | Permissive for creating, executing, and modifying benchmark definitions.                                            |
| **3. Prompts & Evaluator Rubrics**           | Evaluation prompt templates, scenario definitions, rubric guidelines.                                                    |    **Creative Commons Zero 1.0**     |    `CC0-1.0`    | Public domain dedication. Unrestricted use in third-party model evaluation.                                         |
| **4. Datasets & Baseline Fixtures**          | Synthetic benchmark run outputs, baseline test vectors, reference ground-truth data.                                     |    **Creative Commons Zero 1.0**     |    `CC0-1.0`    | Dedicated to the public domain for universal scientific reproducibility.                                            |
| **5. Documentation & Architectural Specs**   | All technical guides, ADRs, epistemic guardrail specifications in `Docs/`, `specs/`, and `README.md`.                    | **Creative Commons Attribution 4.0** |   `CC-BY-4.0`   | Free to share and adapt with attribution to "SemantIQ Core Contributors".                                           |
| **6. Generated Examples & Research Bundles** | Synthetic reference flow artifacts (`DP-008 → FP-002`), sample trace event logs, manifest outputs.                       |    **Creative Commons Zero 1.0**     |    `CC0-1.0`    | Public domain. No restriction on redistribution or training data pipelines.                                         |

---

## 3. Reconciled License Alignment Matrix

All repository metadata files have been audited and verified for consistent MIT / CC-BY-4.0 / CC0-1.0 declarations:

- **Root License**: `LICENSE` (MIT License).
- **Package Manifests**:
  - `package.json` (Root) $\to$ `MIT`
  - `packages/python/pyproject.toml` $\to$ `license = "MIT"`
  - `packages/sdk/package.json` $\to$ `license = "MIT"`
  - `packages/evidence/package.json` $\to$ `license = "MIT"`
  - `packages/sandbox-contracts/package.json` $\to$ `license = "MIT"`
- **Citation & Indexing**:
  - `CITATION.cff` $\to$ `license: "MIT"`
  - `.zenodo.json` $\to$ `"license": "MIT"`
  - `codemeta.json` $\to$ `"license": "https://spdx.org/licenses/MIT"`

---

## 4. Third-Party Dependency Audit

All runtime and development dependencies utilized by SemantIQ comply with the Open Source Definition (OSD) and are licensed under permissive terms:

- **MIT**: TypeScript, Vitest, Prettier, ESLint, React/Vite tooling.
- **Apache-2.0**: Turborepo, OpenTelemetry primitives, cryptographic utilities.
- **BSD-2-Clause / BSD-3-Clause**: Python packaging utilities, Pytest.

**Copyleft Exclusion**: The core runtime contains **zero GPL, AGPL, SSPL, or commercial proprietary dependencies**, ensuring safe embeddability in proprietary, academic, or enterprise environments.

---

## 5. Contributor License Terms

By submitting a pull request or contributing to SemantIQ:

1. You certify that you have the right to submit the contribution under the applicable tier licenses above.
2. Code contributions are licensed under the **MIT License**.
3. Documentation contributions are licensed under **CC-BY-4.0**.
4. Test fixtures, benchmark data, and prompt contributions are dedicated to the public domain under **CC0-1.0**.

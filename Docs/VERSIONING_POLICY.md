# SemantIQ Versioning & Release Policy

## Overview

This policy governs versioning, schema evolution, and release lifecycle management across the SemantIQ monorepo and its distributed packages.

---

## 1. Semantic Versioning Specification

SemantIQ follows [Semantic Versioning 2.0.0 (SemVer)](https://semver.org/):

$$\text{MAJOR}.\text{MINOR}.\text{PATCH}[-\text{PRERELEASE}]$$

- **MAJOR**: Incompatible API breaks, structural contract schema revisions, or breaking epistemic policy changes.
- **MINOR**: Backward-compatible new features, newly supported pattern definitions, additional statistical contrast estimators, or new CLI subcommands.
- **PATCH**: Backward-compatible bug fixes, security patches, documentation enhancements, or performance optimizations.
- **PRERELEASE**: Alpha, beta, and release candidate suffixes (e.g. `1.0.0-alpha.1`, `0.1.0a2`).

---

## 2. Subsystem & Artifact Versioning Alignments

| Artifact / Package | Current Version | Policy & Stability Guarantees |
| :--- | :---: | :--- |
| **Product Contracts & Schemas** (`packages/sandbox-contracts/`) | `1.0.0` | **FROZEN**. JSON Schemas and DTOs follow strict backward compatibility. Breaking changes require schema namespace bumping (`v2`). |
| **Evidence & Governance Engine** (`packages/evidence/`) | `1.0.0` | **STABLE**. Deterministic decision policy and statistical contrast APIs are locked. |
| **Application Services & Server** (`packages/semantiq/`) | `1.0.0` | **STABLE**. HTTP REST API (`/api/v1/`) and Application Services interfaces are frozen. |
| **TypeScript SDK** (`@semantiq/sdk`) | `1.0.0` | **STABLE**. Contract fixtures and client bindings match canonical schemas. |
| **Python Package** (`semantiq`) | `0.1.0a2` / `1.0.0` | **ALPHA DIST $\to$ 1.0.0**. Python public API and contracts match TypeScript contracts 1:1. |
| **Benchmark Suite Families** (SMF, HACS, Vision) | `1.0.0` | **MODULAR**. Test suite batteries evolve independently under their own benchmark manifests. |

---

## 3. Historical SemantIQ-M-Benchmarks Preservation

Historical references to **SemantIQ-M-Benchmarks** (and earlier evaluation frameworks) are intentionally preserved as modular test suite families operating atop the Benchmark Engine:

- **SMF (Semantic Model Foundry)**: Preserved as the core semantic reasoning and tool adherence benchmark family.
- **HACS (Host Agent Context Suite)**: Preserved as the long-horizon context retention and anti-gaming evaluation suite.
- **Vision Benchmark Battery**: Preserved as the spatial perception and multimodal robustness test battery.

---

## 4. Epistemic Invariant Versioning

Any modification to the 16 core epistemic invariants (e.g. `Observed ≠ Inferred`, `Matched Association ≠ Causal Effect`, `Promotion ≠ Proof`) constitutes a **MAJOR** version event and requires a formal RFC review and cryptographic audit sign-off.

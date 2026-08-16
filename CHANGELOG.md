# Changelog

## [0.1.0-alpha.2] - 2026-08-16

### Public Alpha Consolidation & Hygiene Release

This release establishes the curated public foundation for SemantIQ under the Logorythmus organization.

#### Highlights
- **Repository Consolidation**: Focused repository on 48 core evaluation packages, 4 applications, and 1 API service (~2.74 MB total weight).
- **Branding & Package Namespaces**: Fully aligned packages under `@semantiq/*` and established the canonical `semantiq` CLI.
- **Documentation Normalization**: Streamlined public documentation into `docs/` with comprehensive getting started, benchmark methodology, and reproducibility walkthroughs.
- **Licensing Uniformity**: Reconciled explicit MIT licensing across all workspace packages with Creative Commons documentation and CC0 baseline data.
- **Zero-Egress Security Posture**: Enforced local-first deterministic execution with automated credential redaction.

---

## 0.1.0-alpha.1 — Public Alpha Consolidation (2026-08-16)

This update consolidates the SemantIQ Public Alpha repository into a clean, lightweight, product-focused distribution.

### Highlights & Key Improvements
- **Workspace Consolidation**: Decoupled legacy speculative modules and internal governance workpapers, reducing the repository footprint by 88.9% (to 2.74 MB / 861 files) while maintaining 100% test coverage.
- **Brand & Namespace Alignment**: Standardized all package scopes under `@semantiq/*` and updated official repository URLs to `Logorythmus-org/Semantiq`. Added canonical SemantIQ CLI runner (`scripts/semantiq.mjs`).
- **Curated Documentation**: Redesigned documentation tree into 8 structured sections (`getting-started`, `concepts`, `benchmarks`, `evidence`, `integrations`, `reference`, `security`, `project`) with 100% verified links.
- **Onboarding Stabilization**: Validated the complete offline first-run user journey (`pnpm doctor`, `preflight`, `connector`, `smoke`, `reproduce`, `export`) requiring zero external dependencies or API keys.
- **Security & Privacy Posture**: Comprehensive re-audit confirmed zero credential exposure, zero local operator paths, and local-first offline execution by default.

---

## 0.1.0-alpha.1 — Initial Public Alpha Candidate (2026-07-31)

- **Controlled Public Alpha Candidate Release**
- Added First-Run Doctor diagnostic command (`pnpm doctor`).
- Added canonical user journey flow (`install → doctor → connector → preflight → smoke → benchmark → export → reproduce`).
- Added full quality audit reports across accessibility, performance, security, privacy, licensing, and repository hygiene.
- Added 9-role stakeholder audit suite and reproduction verification.
- Added `CITATION.cff` metadata and GitHub Release draft.
- Added zero-telemetry local-first Safe Mode posture.

---

## 0.1.0-mvp-architecture

- Added Phase 1 foundation architecture.
- Added Phase 2 product and knowledge system architecture.
- Added Phase 3 runtime, workflow, workspace, compute, economy, developer platform, and MVP integration architecture.
- Added contract scaffolds for major platform subsystems.
- Added system validation, health, release, deployment, offline, analytics, and MVP documentation.

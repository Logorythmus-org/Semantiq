# Changelog

All notable changes to the SemantIQ project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-18 (Headless Milestone Release Candidate)

### 🚀 Added

- **Core Architecture & Repositioning**:
  - Positioned SemantIQ as **Behavioral Evidence Infrastructure for AI Systems**.
  - Established three-tier decoupled pipeline: `Benchmark Engine → Evidence Engine → Research Workbench`.
  - Defined 16 Core Epistemic Invariants (`Observed ≠ Inferred`, `Matched Association ≠ Causal Effect`, `Promotion ≠ Proof`).
- **Evidence Engine & Statistical Contrast**:
  - 7-Dimensional matched run pairing algorithm (model, prompt, temperature, tools, seed, dataset, hardware).
  - Non-parametric BCa Bootstrap Confidence Interval and Exact Sign Test estimators.
  - Robustness & specification curve diagnostics ($U/T$ usable stability ratio, low power penalty, negative controls).
  - Cross-run bipartite Evidence Graph connecting Design Patterns (`DP-001`..`DP-008`) to Failure Patterns (`FP-001`..`FP-008`).
  - Deterministic governance decision policy engine (`GRADE_A`..`GRADE_D`).
- **Research Workbench & Governed Claims**:
  - Governed evidence claim registry with controlled language regex validation (strictly blocking unhedged causal terms).
  - Proposal-only Evidence Watch active-claim reconciliation (guaranteeing zero automatic active-claim mutation).
  - Self-contained, portable `ResearchBundle` builder and verifier with SHA-256 Merkle tree root hashing.
- **Multi-Language Distribution**:
  - First-class Python package `semantiq` with type-safe dataclasses, client runner, and CLI.
  - Standalone TypeScript SDK `@semantiq/sdk` with zero Web UI dependencies.
  - Complete cross-language contract parity against canonical JSON schemas (`1.0.0`).
- **Headless HTTP REST API & CLI**:
  - Unified CLI (`semantiq` / `tools/automation/cli.mjs`) handling `doctor`, `patterns`, `evidence`, `claims`, `reviews`, `studies`, `bundles`, and `serve`.
  - UI-independent REST server (`SemantiqHttpServer`) with pure headless endpoints (`/health`, `/info`, `/api/v1/...`).
- **Partner Replication & Governance**:
  - Preregistered partner study protocols and protocol-aware study execution manifests.
  - External evidence eligibility gate (4-status admissibility) preventing invalid external submissions from altering evidence aggregation.
  - Cross-organization replication exchange and context diversity metric ($D \ge 0.70$).
- **End-to-End Reference Slice**:
  - Complete 18-stage reference pipeline for `DP-008 → FP-002` verified across TypeScript SDK, Python API, CLI, and HTTP API.
- **Documentation & Packaging Infrastructure**:
  - Reorganized docs-as-code into 13 scalable functional areas with audience navigation paths.
  - Standalone static documentation site generator (`scripts/build-docs.mjs`).
  - Multi-tier licensing policy ([`LICENSING.md`](LICENSING.md)) and STRIDE threat model ([`Docs/security/threat_model.md`](Docs/security/threat_model.md)).

---

## [0.1.0-alpha.1] - 2026-07-31

### Added

- **Controlled Public Alpha Candidate Release**
- Added First-Run Doctor diagnostic command (`pnpm doctor`).
- Added canonical user journey flow (`install → doctor → connector → preflight → smoke → benchmark → export → reproduce`).
- Added full quality audit reports across accessibility, performance, security, privacy, licensing, and repository hygiene.
- Added 9-role stakeholder audit suite and reproduction verification.
- Added `CITATION.cff` metadata and GitHub Release draft.
- Added zero-telemetry local-first Safe Mode posture.

---

## [0.1.0-mvp-architecture]

### Added

- Added Phase 1 foundation architecture.
- Added Phase 2 product and knowledge system architecture.
- Added Phase 3 runtime, workflow, workspace, compute, economy, developer platform, and MVP integration architecture.
- Added contract scaffolds for major platform subsystems.

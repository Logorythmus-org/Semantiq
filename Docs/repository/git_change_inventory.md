# SemantIQ Monorepo Git Change Inventory

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Snapshot Timestamp**: 2026-08-18T23:42:30Z  
**Tracking Baseline**: Pre-Headless Baseline (`v0.1.0-alpha.1`) $\longrightarrow$ Headless 1.0.0 (`59f8eb4` + Working Tree)  
**Status**: `NORMATIVE`  

---

## 1. Executive Summary

This inventory catalogues every local file addition, modification, and package structural change across the SemantIQ repository. All changes are classified into 13 functional and architectural domains, verifying that all capabilities engineered across Prompts 01–48 are accounted for and preserved.

---

## 2. Inventory by Domain Classification

### 1. Product Code
- `packages/core/src/index.ts`: Core primitives, error types, and immutable entity definitions.
- `packages/benchmark/src/index.ts` & `types.ts`: Benchmark engine execution loop and run contracts.
- `packages/patterns/src/seeds.ts` & `index.ts`: Mitigation Design Patterns (`DP-001`..`DP-008`) and Failure Patterns (`FP-001`..`FP-008`).
- `packages/semantiq/src/services/*`: Authoritative application services (`patterns`, `evidence`, `claims`, `reviews`, `studies`, `bundles`, `comparisons`, `evaluations`, `runs`).
- `packages/adapter-opensandbox/src/*`: OpenSandbox execution provider connector.
- `packages/adapter-replay/src/*`: Deterministic session replay provider connector.
- `packages/adapter-oci/src/*` & `packages/adapter-cloud-base/src/*`: Cloud and container execution adapters.

### 2. Tests & Test Batteries
- `tests/unit/reference-workflow-vertical-slice.test.ts`: 18-stage vertical slice integration tests (`DP-008 → FP-002`).
- `tests/unit/matched-statistical-contrast.test.ts`: BCa Bootstrap CI and Exact Sign Test unit tests.
- `tests/unit/evidence-decision-policy.test.ts`: Deterministic governance decision rules tests (`GRADE_A`..`GRADE_D`).
- `tests/unit/claim-registry-governance.test.ts`: Controlled language regex blocklist tests.
- `tests/unit/claim-reconciliation-watch.test.ts`: Proposal-only evidence watch reconciliation tests.
- `tests/unit/external-evidence-eligibility-gate.test.ts`: 4-status admissibility gate tests.
- `tests/unit/study-execution-manifest.test.ts`: Protocol manifest ingestion and checksum validation tests.
- `tests/unit/partner-replication-exchange.test.ts`: Replication exchange registry and context diversity tests.
- `tests/unit/documentation-validation.test.ts`: Master docs index, scalable areas, and site build validation tests.
- `tests/unit/release-candidate.test.ts`: Release candidate and citation verification tests.
- `tests/unit/cli.test.ts`: CLI command execution tests against application services.
- `tests/architecture/package-boundaries.test.ts`: Architectural upward layering rule tests.
- `tests/api/semantiq-http-api.test.ts`: Headless HTTP REST API and UI independence tests.
- `tests/security/*`: Security test suite (discovery, mutations, relations, semantics, configuration).

### 3. Product Contracts & Schemas
- `packages/sandbox-contracts/src/product-contracts.ts`: Canonical TypeScript product DTOs and interfaces.
- `packages/sandbox-contracts/src/crypto-utils.ts`: Canonical JSON serialization and SHA-256 state hashing.
- `schemas/*.schema.json`: JSON Schemas for benchmarks, receipts, bundles, reports, and manifests.

### 4. Python Public Package (`semantiq`)
- `packages/python/pyproject.toml`: PEP 621 package metadata, build system (`hatchling`), and optional extras.
- `packages/python/src/semantiq/__init__.py`: Package exports, version `0.1.0a2`, epistemic disclaimers.
- `packages/python/src/semantiq/contracts.py`: Python dataclasses matching TypeScript schemas 1:1.
- `packages/python/src/semantiq/client.py`: High-level `SemantiqClient` for evaluation, contrast, and claims.
- `packages/python/src/semantiq/controlled_language.py`: Python controlled language validation engine.
- `packages/python/src/semantiq/runner.py`: Offline deterministic benchmark runner.
- `packages/python/src/semantiq/cli.py`: Python CLI entrypoint (`semantiq`).
- `packages/python/tests/test_*.py`: 32 pytest tests across client, contracts, language, fixtures, packaging, and vertical slice.

### 5. TypeScript SDK (`@semantiq/sdk`)
- `packages/sdk/package.json`: Scoped package configuration, zero Web UI dependencies.
- `packages/sdk/src/client.ts`: Standalone `SemantiqClient` client class.
- `packages/sdk/src/contracts.ts`: Re-exported product contracts and epistemic disclaimers.
- `packages/sdk/src/errors.ts`: SDK error hierarchy (`SemantiqError`, `ValidationError`, `NetworkError`).
- `packages/sdk/src/fixtures.ts`: Zero-boilerplate mock fixtures (`mockSystemProfile`, `mockBenchmark`, `mockCase`).

### 6. CLI & Headless HTTP API
- `packages/semantiq/src/cli.ts`: Unified CLI engine backed by application services.
- `packages/semantiq/src/http/server.ts`: Decoupled `SemantiqHttpServer` supporting pure headless REST mode.
- `packages/semantiq/src/http/router.ts`: REST router (`/health`, `/info`, `/api/v1/patterns`, `/api/v1/claims`, `/api/v1/reviews`, `/api/v1/studies`, `/api/v1/bundles`).
- `tools/automation/cli.mjs`: CLI automation wrapper (`doctor`, `smoke`, `preflight`, `connector`, `reproduce`).

### 7. Evidence Engine & Research Workbench
- `packages/evidence/src/matched-contrast/`: 7D matched pair algorithm, Bootstrap CI, Exact Sign Test.
- `packages/evidence/src/robustness/`: Specification curve analysis and usable specification stability ($U/T$).
- `packages/evidence/src/graph/`: Bipartite cross-run Evidence Graph (`DP` $\leftrightarrow$ `FP`).
- `packages/evidence/src/claims/`: Governed claim lifecycle engine and controlled language validator.
- `packages/evidence/src/watch/`: Evidence watch proposal queue engine.
- `packages/research/src/bundle-builder.ts`: Merkle research bundle exporter.
- `packages/research/src/bundle-verifier.ts`: SHA-256 Merkle root verification engine.

### 8. Partner Protocols & Replication Gate
- `packages/evidence/src/preregistration/`: Protocol generator and pre-registration freezing engine.
- `packages/evidence/src/manifests/`: Protocol-aware study execution manifest ingestion engine.
- `packages/evidence/src/gate/`: External Evidence Eligibility Gate (4-status admissibility).
- `packages/evidence/src/partner-exchange/`: Replication exchange registry and context diversity scorer ($D$).

### 9. Documentation Platform
- `README.md`: Repositioned product overview, 3-tier architecture, 18-stage flow ASCII diagram.
- `Docs/DOCUMENTATION_INDEX.md`: Master docs index with 4 audience navigation paths.
- `Docs/ARCHITECTURE.md`: Technical architecture specification.
- `Docs/RESEARCH_WORKFLOW.md`: Canonical 18-stage reference workflow walkthrough.
- `Docs/PYTHON_USAGE.md`: Python SDK user guide.
- `Docs/TYPESCRIPT_SDK.md`: TypeScript SDK user guide.
- `Docs/CLI_USAGE.md`: CLI command reference.
- `Docs/HTTP_API_REFERENCE.md`: REST API reference.
- `Docs/SCIENTIFIC_GUARDRAILS.md`: 16 Epistemic Invariants formal specification.
- `Docs/getting-started/README.md`, `Docs/concepts/README.md`, `Docs/architecture/README.md`, `Docs/benchmarks/README.md`, `Docs/evidence/README.md`, `Docs/research/README.md`, `Docs/governance/README.md`, `Docs/partners/README.md`, `Docs/api/README.md`, `Docs/sdk/README.md`, `Docs/security/README.md`, `Docs/releases/README.md`, `Docs/adr/README.md`: 13 scalable area index files.

### 10. Security & Governance
- `SECURITY.md`: Operational security policy with private reporting channel (`security@semantiq.org`) and response SLAs.
- `LICENSING.md`: Multi-tier licensing framework (MIT, CC0-1.0, CC-BY-4.0).
- `NOTICE`: Root legal copyright and open-source dependency notice.
- `Docs/security/threat_model.md`: STRIDE threat model covering 7 core attack vectors.
- `Docs/security/data_handling.md`: 5-tier data classification and quarantine guide.
- `Docs/security/github_repository_protection.md`: Security controls checklist.
- `Docs/GOVERNANCE.md`: Product domain ownership model across 10 pillars.
- `Docs/governance/rfc_process.md`: 6-stage formal RFC lifecycle.
- `Docs/governance/organization_migration.md`: GitHub Org migration readiness plan.
- `.github/CODEOWNERS`: Path-based domain team ownership mappings.
- `.github/pull_request_template.md`: 7-section PR review checklist.
- `.github/ISSUE_TEMPLATE/*.yml`: 6 specialized issue templates.

### 11. CI / Automation
- `.github/workflows/ci.yml`: 8 hardened multi-language quality gates.
- `.github/workflows/docs.yml`: Documentation site build and verification workflow.
- `.github/workflows/security.yml`: Dependency review action.

### 12. Packaging & Release Engineering
- `CHANGELOG.md`: Root changelog updated for 1.0.0 Headless Release Candidate.
- `Docs/VERSIONING_POLICY.md`: SemVer rules and historical benchmark preservation.
- `Docs/releases/release_process.md`: 8-step pre-release verification checklist and Zenodo DOI policy.
- `package.json`: Added `docs:build` script.
- `.gitignore`: Hardened rules for Python packaging outputs (`*.pyc`, `*.egg-info/`, `.mypy_cache/`, `*.whl`, `*.tar.gz`).
- `scripts/build-docs.mjs`: Standalone static documentation site compiler.

### 13. Generated / Local-Only / Unclear Items
- `dist/docs/`: 14 compiled static HTML documentation pages (~120 KB).
- `.semantiq/`: Local evaluation caches and test logs.
- Untracked sandbox Phase ADRs (`Docs/adr/ADR-0131` through `ADR-0193`): Preserved historical research records.
- Untracked sandbox draft specs (`Docs/sandbox/*`): Preserved historical experimental definitions.

---

## 3. Verification & Integrity Summary

```text
============================= Inventory Summary =============================
Total Audited Categories        : 13 Domains
Monorepo Workspace Packages     : 182 Packages Built Cleanly (exit code 0)
Full Vitest Test Suite          : 772 Passed, 36 Skipped, 0 Failed (199 Files)
Python Pytest Suite             : 32 Passed, 0 Failed
TypeScript Typecheck            : 0 Errors (tsc --noEmit)
Static Documentation Site       : 14 HTML Pages Compiled in dist/docs/
UI Independence Status          : 100% Headless Verified
=============================================================================
```

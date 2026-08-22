# SemantIQ Headless HTTP API Catalog

**Document Version**: 1.0.0
**Software Release**: `0.1.0-alpha.2` — Public Alpha (Experimental)
**Schema Version**: `1.0.0`  
**Base Path**: `/api/v1`  
**Deployment Boundary**: Headless & UI-Independent (Can execute with NO Web UI installed; optional static hosting)

---

## 1. Overview
The SemantIQ Headless HTTP API provides authoritative, UI-independent REST endpoints consuming the unified application service layer (`SemantiqApplicationService`).

All requests and responses use JSON and return the canonical `ApiResponse<T>` envelope:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-08-18T20:20:00.000Z",
    "version": "1.0.0",
    "versionKind": "schema",
    "releaseVersion": "0.1.0-alpha.2",
    "schemaVersion": "1.0.0",
    "maturity": "Public Alpha (Experimental)",
    "correlationId": "uuid-or-provided-correlation-id"
  }
}
```

---

## 2. API Endpoints

### System & Health
- `GET /health` / `GET /api/v1/health`
  - Health check endpoint returning separate `releaseVersion` and `schemaVersion` values. The compatibility `version` field is marked with `versionKind: "schema"`.
- `GET /info` / `GET /api/v1/info`
  - Product runtime metadata and active service registry.

### Patterns Service
- `GET /api/v1/patterns` — List all registered architectural and failure patterns.
- `GET /api/v1/patterns/:code` — Retrieve specific pattern by code (e.g. `DP-001`).
- `POST /api/v1/patterns/match` — Match system capabilities against pattern preconditions.
- `POST /api/v1/patterns/recommend` — Recommend mitigations based on system profile and failures.

### Governed Claims & Controlled Language
- `POST /api/v1/claims/validate-language` — Validate statement text against controlled language rules (detects unhedged causal terms).
- `POST /api/v1/claims/draft` — Draft a new governed evidence claim with deterministic claim family ID.
- `GET /api/v1/claims` — List all governed claims.
- `GET /api/v1/claims/:claimId` — Retrieve a claim by ID.
- `POST /api/v1/claims/:claimId/release` — Transition claim from `draft` to `active` with validation.

### Evidence & Behavioral Metrics
- `POST /api/v1/evidence/metrics` — Compute suite of behavioral metrics across agent execution traces.
- `POST /api/v1/evidence/extract-failures` — Extract failure observations and risk hypotheses.
- `POST /api/v1/evidence/query` — Execute comparative queries over the evidence relation graph.

### Research Reviews & Workbench
- `GET /api/v1/reviews/queue` — Query items in the research workbench review queue.
- `POST /api/v1/reviews/enqueue` — Enqueue a proposal or change for human review.
- `GET /api/v1/reviews/audit/verify` — Verify cryptographic hash chain integrity of workbench audit log.

### Studies & Dataset Registries
- `GET /api/v1/studies/snapshots` — List registered dataset snapshots.
- `GET /api/v1/studies/cases` — List registered benchmark case studies.
- `POST /api/v1/studies/snapshots` — Create a deterministic dataset snapshot.

### Research Bundles
- `POST /api/v1/bundles/export` — Package runs, evaluations, and claims into a sealed `ResearchBundle` with Merkle root hash.
- `POST /api/v1/bundles/verify` — Verify cryptographic integrity and Merkle root hash.
- `POST /api/v1/bundles/import` — Ingest external research bundle into local stores.

### Statistical Comparisons & Governance Decisions
- `POST /api/v1/comparisons/match` — Deterministic 7-dimension control matching.
- `POST /api/v1/comparisons/contrast` — Paired contrast, bootstrap 95% CI, and exact sign test.
- `POST /api/v1/comparisons/robustness` — Specification curve and TVD balance diagnostics.
- `POST /api/v1/comparisons/governance-decision` — Evaluate deterministic evidence decision policy.

### Evaluations & Cryptographic Ledger
- `POST /api/v1/evaluations/record` — Record evaluation into append-only cryptographic ledger.
- `GET /api/v1/evaluations` — List historical ledger entries.
- `GET /api/v1/evaluations/verify-ledger` — Verify cryptographic hash-chain continuity.

### Benchmark Runs
- `POST /api/v1/runs/ingest` — Ingest raw benchmark execution run.
- `GET /api/v1/runs` — List ingested runs.
- `GET /api/v1/runs/:runId` — Retrieve run by ID.

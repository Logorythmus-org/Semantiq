# SemantIQ Headless HTTP API Reference (`v1`)

## Evidence boundary

SemantIQ contains a UI-independent HTTP server/router implemented in
`packages/semantiq/src/http/` and exercised directly by
`tests/api/semantiq-http-api.test.ts`.

This establishes a **programmatic source/server surface** for the current Public
Alpha. It does not establish:

- a hosted SemantIQ API service;
- a published server package;
- a generally installed `semantiq serve` command;
- production hardening or production-scale reliability.

The API exposes implemented application-service routes. "Headless" means the
server can run without optional static UI assets; it does not mean every
repository capability is exposed through HTTP.

---

## Server defaults

`createSemantiqHttpServer()` currently defaults to:

| Setting | Current default |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `0` (operating system selects an available port) |
| API base path | `/api/v1` |
| Static UI directory | none unless supplied |
| CORS | enabled; current router emits `Access-Control-Allow-Origin: *` |

Repository tests commonly start the server on an ephemeral localhost port. The
examples below use `http://localhost:3000` only as an illustrative configured
base URL.

The current CORS behavior is an implementation fact, not a recommendation for
public-network deployment. See the security documentation and the separate
runtime follow-up for the current security boundary.

---

## Response envelope

JSON responses use a common envelope containing `success`, response `data` or
`error`, and metadata including release/schema identity and a correlation ID.

The software release version and product-contract schema version are separate
identities.

---

## System endpoints

### Health

```http
GET /health
GET /api/v1/health
```

Returns health metadata, Public Alpha maturity, release version, and schema
version.

### Information

```http
GET /info
GET /api/v1/info
```

Returns the current application-service catalog and server metadata.

---

## Patterns

```http
GET  /api/v1/patterns
GET  /api/v1/patterns/:id
POST /api/v1/patterns/match
POST /api/v1/patterns/recommend
```

These routes expose the implemented pattern service. A registered pattern or
recommendation is repository/application data, not external validation.

---

## Governed claims

### Validate controlled language

```bash
curl -X POST http://localhost:3000/api/v1/claims/validate-language \
  -H "Content-Type: application/json" \
  -d '{"statement":"DP-008 is associated with reduced context drift."}'
```

### Draft a claim

```bash
curl -X POST http://localhost:3000/api/v1/claims/draft \
  -H "Content-Type: application/json" \
  -d '{
    "claimFamilyTopic": "drift_mitigation",
    "targetPatternOrRelationId": "rel_08",
    "statement": "DP-008 is associated with reduced context drift.",
    "version": "1.0.0",
    "governanceVerdict": "promote",
    "evidenceReferences": {
      "runIds": ["run_1"],
      "observationIds": ["obs_1"],
      "decisionReportIds": [],
      "sourceIds": []
    }
  }'
```

The `version` value in this claim payload is a contract/schema identity, not the
SemantIQ software release version.

Other implemented claim routes:

```http
GET  /api/v1/claims
GET  /api/v1/claims/:id
POST /api/v1/claims/:id/release
```

A released governed claim has passed repository policy mechanics; release does not
make the claim universally true or independently validated.

---

## Evidence

```http
POST /api/v1/evidence/metrics
POST /api/v1/evidence/extract-failures
POST /api/v1/evidence/query
```

---

## Reviews

```http
GET  /api/v1/reviews/queue
POST /api/v1/reviews/enqueue
GET  /api/v1/reviews/audit/verify
```

The review routes operate on repository review records. They do not by themselves
establish independent external peer review.

---

## Studies and dataset snapshots

The current router exposes:

```http
GET  /api/v1/studies/snapshots
GET  /api/v1/studies/sources
GET  /api/v1/studies/cases
POST /api/v1/studies/snapshots
```

There is no current generic `GET /api/v1/studies` route in the implemented
router.

---

## Research bundles

```http
POST /api/v1/bundles/export
POST /api/v1/bundles/verify
POST /api/v1/bundles/import
```

The implemented router uses `export`, not a `/bundles/build` route.

Bundle verification checks the implemented bundle-integrity contract; it does not
establish scientific truth or independent provenance.

---

## Comparisons and governance decisions

```http
POST /api/v1/comparisons/match
POST /api/v1/comparisons/contrast
POST /api/v1/comparisons/robustness
POST /api/v1/comparisons/policy
POST /api/v1/comparisons/governance-decision
```

Statistical and governance outputs retain the scientific limitations described in
[Scientific Guardrails](SCIENTIFIC_GUARDRAILS.md).

---

## Evaluations

```http
POST /api/v1/evaluations/record
GET  /api/v1/evaluations
GET  /api/v1/evaluations/verify-ledger
```

---

## Runs

```http
POST /api/v1/runs/ingest
GET  /api/v1/runs
GET  /api/v1/runs/:id
```

---

## Static UI serving

If a `staticDir` is explicitly supplied to the server constructor, the router can
serve static files after API routing.

When `staticDir` is omitted, repository tests verify that the server remains
headless and the tested API workflows continue to operate.

---

## What this reference does not establish

This document does not claim:

- a public hosted endpoint;
- npm/PyPI server publication;
- a `semantiq serve` executable;
- authentication suitable for public deployment;
- safe exposure on a non-local network;
- independent penetration testing;
- production SLA or production readiness.

For the current runtime/security boundary, see
[Known Limitations](KNOWN_LIMITATIONS.md) and the
[Security documentation](security/README.md).

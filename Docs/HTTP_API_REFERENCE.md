# SemantIQ Headless HTTP API Reference (`v1`)

## Overview

SemantIQ provides a UI-independent REST API exposing all core capabilities of the Benchmark Engine, Evidence Engine, and Research Workbench.

---

## Server Base URL

```
http://localhost:3000
```

---

## System Endpoints

### 1. Health & Readiness (`GET /health`)
Returns service health, version, and active subsystem statuses.

```bash
curl http://localhost:3000/health
```

**Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptimeSeconds": 124.5,
  "timestamp": "2026-08-18T12:00:00.000Z"
}
```

### 2. Platform Information (`GET /info`)
Returns metadata, capability descriptor, and epistemic disclaimer.

```bash
curl http://localhost:3000/info
```

---

## Evidence & Pattern Endpoints

### 3. Pattern Catalog Discovery (`GET /api/v1/patterns`)
Returns all discovered design patterns and failure modes.

```bash
curl http://localhost:3000/api/v1/patterns
```

### 4. Controlled Language Validation (`POST /api/v1/claims/validate-language`)
Validates a claim statement against controlled language regex blocklists.

```bash
curl -X POST http://localhost:3000/api/v1/claims/validate-language \
  -H "Content-Type: application/json" \
  -d '{"statement": "DP-008 is associated with a 0.25 observed increase in retention."}'
```

**Response (`200 OK`)**:
```json
{
  "isValid": true,
  "sanitizedStatement": "DP-008 is associated with a 0.25 observed increase in retention.",
  "violations": [],
  "epistemicDisclaimer": "Release controls wording, not scientific truth. Governed claims describe observed associations under tested conditions."
}
```

### 5. Draft Governed Claim (`POST /api/v1/claims/draft`)
Drafts a new scientific claim linked to underlying runs.

```bash
curl -X POST http://localhost:3000/api/v1/claims/draft \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "anti_gaming_drift_mitigation",
    "targetPatternOrRelationId": "rel_08",
    "statement": "DP-008 is associated with reduced FP-002 drift.",
    "version": "1.0.0",
    "runIds": ["run_1", "run_2"]
  }'
```

### 6. Get Claim by ID (`GET /api/v1/claims/:id`)
Fetches governed claim record, review decisions, and lifecycle status.

```bash
curl http://localhost:3000/api/v1/claims/claim_001
```

---

## Review & Research Endpoints

### 7. Enqueue Review (`POST /api/v1/reviews/enqueue`)
Places a draft claim into the two-party review queue.

```bash
curl -X POST http://localhost:3000/api/v1/reviews/enqueue \
  -H "Content-Type: application/json" \
  -d '{"claimId": "claim_001"}'
```

### 8. List Partner Studies (`GET /api/v1/studies`)
Lists registered partner replication studies.

```bash
curl http://localhost:3000/api/v1/studies
```

### 9. Build Research Bundle (`POST /api/v1/bundles/build`)
Packages active claims and contrast reports into a cryptographically sealed bundle.

```bash
curl -X POST http://localhost:3000/api/v1/bundles/build \
  -H "Content-Type: application/json" \
  -d '{
    "studyId": "study_001",
    "claimIds": ["claim_001"]
  }'
```

# Phase B Prompt 7 Inputs

## Runtime State

- Question: identity, multilingual text, creator/source attribution, published/archived lifecycle, versions, immutable revisions.
- Relations: typed directed/symmetric edges, bounded graph traversal, relational persistence.
- Frame/semantic: explicit context, assumptions, constraints, unknowns, uncertainty, scope, perspectives, possibilities, versioned JSONB.
- Discovery: deterministic cursor pagination, filters, multilingual normalized PostgreSQL search, relation/Frame-aware reads.
- Trust/safety: typed source references, append-only audits, private reports, explicit cases/actions, separate moderation state, trust facts, local rate limits.

## Contracts and Events

Events: `question.created/updated/archived/restored`, relation and semantic events from Prompts 3-4, `question.source.added/removed`, `question.reported`, `question.report.withdrawn`, `question.moderation.case.opened`, `question.moderation.action.applied`, and `question.moderation.case.resolved`.

All writes use transactional outbox and hashed idempotency records. Prompt 6 critical writes include audit in the same transaction; earlier domain events project into audit through the outbox insert trigger.

## Authorization and Privacy

Creator policy controls ordinary mutation and source lifecycle. Configured narrow capabilities control report review, moderation action, and internal safety reads. Restricted Questions are excluded from SQL discovery; public exact/detail/graph/semantic content fails closed. Public trust facts exclude report counts and identities.

## Migration and Verification

Head: `7 question_trust_safety`. Full PostgreSQL-enabled result: 51 files and 188 tests passed. Docker build, live flow, simultaneous restart, and persistence passed. Query plans and performance are in Prompt 6 artifacts.

## Findings

No critical/high finding. Medium: process-local limiter is not distributed. Low: environment actor registry, graph per-node moderation reads, deferred appeal/redaction/audit-retention governance. Two unrelated pre-existing lint warnings remain.

## Prompt 7 May Modify

- `packages/questions/src/**`
- `packages/persistence/src/**`
- `services/api/src/**`
- `services/question/src/**`
- `tests/unit/**`, `tests/contracts/**`, `tests/integration/**`, `tests/api/**`, `tests/security/**`, `tests/smoke/**`
- `scripts/question-*.ts`, `docker-compose.yml`, `Dockerfile`
- `Docs/backend/question-*.md`, `Docs/adr/ADR-00*.md`, `Docs/implementation-cycle-1/phase-b/prompt-7-*.md`

Changes must be integration/consolidation work and preserve compatibility.

## Prompt 7 Must Not Modify

- Frontend/apps for feature work
- Cloud/deployment/CI configuration
- Semantiq scoring, embedding, LLM, or vector-database implementation
- Legacy runtime packages unrelated to Question integration
- Existing migrations 1-7 destructively; use additive migration 8 only if necessary
- Historical revisions, source history, reports, cases, actions, audits, or outbox data

## Phase C Readiness Conditions

Prompt 7 must keep all Question tests green, verify migration/restart/data survival, consolidate public/internal contracts, preserve provenance classifications, and hand Semantiq observable facts rather than truth or popularity judgments.

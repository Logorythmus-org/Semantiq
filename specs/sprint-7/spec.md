# Sprint 7 Public Alpha Operations Spec

Spec ID: S7-SPEC  
Status: Approval required before implementation  
Last updated: 2026-07-10

## Purpose

Operate Tech Club's controlled Public Alpha as a validated learning system. The sprint must discover whether real users can understand and complete the question-to-research journey without confusing plans, stubs or synthetic runtime checks for real product evidence.

## Scope

Sprint 7 covers repository reality audit, controlled tester cohorts, invitation-only access, granular research consent, privacy-preserving instrumentation, contextual feedback, usability sessions, Semantiq and AI quality feedback, issue triage, release channels, update/rollback validation, product decisions and Beta readiness assessment.

## Non-Goals

Do not add open registration, paid marketplace flows, unrestricted federation, autonomous unapproved agents, blockchain features, broad architecture replacement, enterprise billing, native mobile expansion or speculative product domains.

## Approval Gate

Implementation may begin only after these artifacts are reviewed and approved:

- `Docs/reports/SPRINT_7_REPOSITORY_REALITY_AUDIT.md`
- `specs/sprint-7/requirements.md`
- `specs/sprint-7/consent-and-privacy.md`
- `specs/sprint-7/acceptance.md`

Until approval, Sprint 7 work is limited to audit, specification, research design and risk documentation.

## Evidence Standard

Classify all outcomes as one of:

- Observed
- Measured
- Reported by users
- Inferred
- Hypothesized
- Implemented
- Planned
- Deferred
- Unsupported

Never mark a planned or scaffolded capability as implemented.

## Validation

The existing `LocalAlphaOperationsRuntime.runSprint7Validation()` is a contract-level simulation. It may verify TypeScript control flow, but it does not by itself validate a real Public Alpha. Real validation requires running the chosen alpha surface with Ring 0 testers and collecting consented evidence.

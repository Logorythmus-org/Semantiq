# Spec-Kit

Spec-Kit is mandatory for Phase 5 implementation. No production feature starts without a completed Spec-Kit record.

## Required Sequence
Goal -> Requirements -> Specification -> Acceptance Tests -> Implementation -> Validation -> Documentation -> Merge.

## Feature Specification Template
```md
# <Feature Name>

## Goal
What user, system, or operational outcome this feature delivers.

## Requirements
- Functional requirements.
- Non-functional requirements.
- Security requirements.
- Accessibility requirements.
- Offline and local-first requirements.

## Architecture Reference
Links to existing architecture docs and decisions.

## Domain Model
Entities, value objects, aggregates, invariants, commands, events, queries, and policies.

## API Specification
REST, GraphQL, MCP, CLI, internal, streaming, and event surfaces.

## Database Specification
Storage engines, schemas, migrations, indexes, backup, restore, offline behavior, and versioning.

## Security Specification
Authentication, authorization, RBAC, ABAC, encryption, secrets, audit, sandboxing, privacy, and OWASP concerns.

## Testing Specification
Unit, integration, contract, API, UI, e2e, performance, security, accessibility, and regression tests.

## Performance Specification
Budgets, load assumptions, stress limits, caching, backpressure, and observability.

## Deployment Specification
Runtime environment, Docker, configuration, health checks, rollback, and release notes.

## Migration Specification
Data migration, API migration, compatibility, rollback, and deprecation plan.

## Acceptance Criteria
Concrete pass/fail criteria.

## Definition of Done
Tests pass, docs updated, security reviewed, performance budget checked, release notes prepared.
```

## Approval Gates
- Product intent approved.
- Architecture reference confirmed.
- Contracts reviewed.
- Acceptance tests written.
- Security and privacy reviewed.
- Performance budget defined.
- Documentation owner assigned.

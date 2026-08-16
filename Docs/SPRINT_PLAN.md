# Sprint Plan

Each sprint requires objectives, deliverables, tests, risks, and dependencies. Sprint scope can shrink, but acceptance standards cannot.

## Sprint 0: Infrastructure

- Objectives: repository audit, Spec-Kit adoption, CI design, package maturity scoring.
- Deliverables: audit reports, templates, CI/CD plan, test matrix.
- Tests: spec validation, package inventory check.
- Risks: external repositories unavailable.
- Dependencies: architecture docs and repository access.

## Sprint 1: Core

- Objectives: productionize `core`, `shared`, `kernel`, and configuration contracts.
- Deliverables: lifecycle runtime, typed errors, result contracts, module registration.
- Tests: unit, contract, architecture boundary.
- Risks: premature abstractions.
- Dependencies: Sprint 0 audit.

## Sprint 2: Knowledge

- Objectives: data platform, storage adapters, graph relations, migrations.
- Deliverables: repository interfaces, SQLite/PostgreSQL plan, graph query contracts.
- Tests: repository, migration, graph integrity, sync.
- Risks: storage coupling.
- Dependencies: Sprint 1.

## Sprint 3: Workspace

- Objectives: local-first workspace runtime and app shell.
- Deliverables: workspace lifecycle, knowledge object runtime, offline storage.
- Tests: workspace, accessibility, offline, e2e.
- Risks: UI outrunning contracts.
- Dependencies: Sprint 2.

## Sprint 4: Questions

- Objectives: question lifecycle, discovery, Semantiq integration.
- Deliverables: question service, moderation, graph projection, evaluation reports.
- Tests: API, benchmark, moderation, search.
- Risks: popularity-driven shortcuts.
- Dependencies: Sprint 2 and Sprint 3.

## Sprint 5: Research

- Objectives: research projects, atlas, narratives, communities.
- Deliverables: evidence tracking, hypothesis workflow, publication review, community contribution ledger.
- Tests: provenance, peer review, community trust.
- Risks: insufficient evidence validation.
- Dependencies: Sprint 4.

## Sprint 6: Agents

- Objectives: provider-neutral agent runtime.
- Deliverables: planner, research, question, writing, programming, review, visualization, education, governance, innovation, and coordination agent packages.
- Tests: permissions, memory, provider routing, human approval.
- Risks: hidden autonomy.
- Dependencies: Sprint 4 and Sprint 5.

## Sprint 7: Workflow

- Objectives: workflow execution, validation, simulation, templates, visual editor foundation.
- Deliverables: workflow graph executor and template registry.
- Tests: graph validation, recovery, simulation, approval checkpoints.
- Risks: brittle execution state.
- Dependencies: Sprint 6.

## Sprint 8: Marketplace

- Objectives: semantic assets, licensing, publishing, funding, approval.
- Deliverables: marketplace service and wallet-safe publishing flow.
- Tests: licensing, payments abstraction, audit, fraud checks.
- Risks: commercial flows before trust model maturity.
- Dependencies: Sprint 4 and Sprint 7.

## Sprint 9: Federation

- Objectives: optional federation and global knowledge mesh.
- Deliverables: node registry, protocol compatibility, sync, trust.
- Tests: network failure, offline nodes, policy enforcement.
- Risks: central dependency creep.
- Dependencies: Sprint 2 and Sprint 8.

## Sprint 10: Integration

- Objectives: end-to-end MVP system integration.
- Deliverables: system health, release candidate, integration tests.
- Tests: API, UI, workflow, agent, marketplace, federation, security.
- Risks: cross-module mismatch.
- Dependencies: Sprints 1-9.

## Sprint 11: Optimization

- Objectives: performance, accessibility, security, reliability.
- Deliverables: performance budgets, load tests, security fixes, observability dashboards.
- Tests: load, stress, security, accessibility.
- Risks: optimization without measurement.
- Dependencies: Sprint 10.

## Sprint 12: Public Alpha

- Objectives: limited release with feedback loops.
- Deliverables: alpha deployment, docs, support playbooks.
- Tests: smoke, telemetry, rollback.
- Risks: support load.
- Dependencies: Sprint 11.

## Sprint 13: Beta

- Objectives: broader release and API freeze.
- Deliverables: beta release, migration plan, compatibility matrix.
- Tests: regression, upgrade, contract, security.
- Risks: API churn.
- Dependencies: Sprint 12.

## Sprint 14: Production

- Objectives: stable production release.
- Deliverables: production deployment, release notes, version tags, operations runbooks.
- Tests: release, disaster recovery, backup restore, security sign-off.
- Risks: incomplete operational readiness.
- Dependencies: Sprint 13.

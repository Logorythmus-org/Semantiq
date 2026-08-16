# Sprint 2 Repository Audit

## Sprint 1 Completion Report

Sprint 1 is implemented in `packages/sprint1-runtime` with tests for identity, local sessions, workspaces, knowledge objects, questions, graph relations, dashboard, search, export, API contracts, auth adapters, and storage adapters. Validation before Sprint 2 showed TypeScript and Vitest passing.

## Existing Package Map

- Identity/workspace/knowledge/question foundations: `packages/core`, `packages/sprint1-runtime`, `packages/workspace-runtime`, `packages/questions`.
- Intelligence scaffolds: `packages/semantiq`, `packages/question-intelligence`, `packages/graph-runtime`.
- Research scaffolds: `packages/research`, `packages/research-engine`, `packages/evidence`, `packages/hypotheses`, `packages/tasks`.
- Services: `services/workspace`, `services/question`, `services/search`, plus existing API/gateway/auth/runtime shells.

## Existing API Contracts

Sprint 1 exposes `createIdentity`, `loginLocal`, `createWorkspace`, `createKnowledge`, `createQuestion`, `updateQuestion`, `graphViewer`, `search`, `dashboard`, `exportWorkspace`, and route descriptors. Existing Semantiq exposes benchmark-style evaluation. Existing Question Intelligence exposes refinement, intent, ambiguity, assumptions, tags, duplicate detection, approval and rejection.

## Existing Event Schemas

Sprint 1 events include identity, workspace, knowledge, question, graph, export, and search events. Semantiq and Question Intelligence have versioned event type definitions but limited persisted audit metadata. Research Runtime has research/evidence/hypothesis/community events.

## Existing Database Migrations

No executable database migrations were found. Storage is currently memory-first with JSON, SQLite, PostgreSQL, and Neo4j adapter declarations.

## Existing Graph Node And Edge Types

`packages/graph-runtime` supports nodes for question, knowledge, evidence, project, research, publication, experiment, dataset, workflow, agent, user, organization, institution, marketplace asset, education object, innovation, and policy. Relations include supports, contradicts, belongs_to, depends_on, references, generated_by, validates, teaches, and related semantic forms.

## Existing Test Coverage

Vitest currently covers repository bootstrap, package boundaries, automation, core domain, graph runtime, research runtime, MVP journey, and Sprint 1 runtime. Sprint 2 needs tests for scoring, approval, similarity, research conversion, evidence, hypotheses, task planning, graph integration, and export enrichment.

## Existing Technical Debt

- Semantiq dimensions are benchmark-oriented and do not yet match the Sprint 2 question rubric.
- Question Intelligence approval states are narrower than Sprint 2 requires.
- Research project statuses and evidence types are close but not complete.
- Migrations, OpenAPI, GraphQL, JSON Schema, Pydantic, and MCP contracts are descriptors rather than generated executable artifacts.
- No real UI components exist for Sprint 2 screens; descriptors are the current repository convention.

## Reusable Components From Semantiq

`ExplainableSemantiqRuntime`, `LocalSemantiqEngine`, benchmark reports, dimension scores, recommendations, and history structures can be reused. Sprint 2 needs a question-specific Semantiq profile with every score explained.

## Missing Interfaces Required By Sprint 2

AI provider contracts, prompt registry, expanded approval audit, Sprint 2 event envelope, research dashboard, evidence quality assessment, hypothesis lifecycle, research task planning, similarity strategies, relation suggestion approval, and enriched export contracts.

## Compatibility Risks

Strict optional TypeScript settings require optional fields to be omitted rather than set to `undefined`. Existing graph relation types do not include every requested relation, so Sprint 2 relation suggestions remain advisory until approved graph relation mapping is added. Offline-first behavior must remain deterministic and must not call remote providers silently.

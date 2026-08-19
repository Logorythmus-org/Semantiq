# Production MVP Integration And Alpha Release Specification

## Purpose

Integrate the implemented Tech Club runtimes into the first local-first Production MVP and alpha release candidate.

## Goals

- Demonstrate the full semantic loop from local identity to portable workspace export.
- Ensure identity, workspace, question intelligence, Semantiq, Knowledge Graph, research, community, Agent OS, workflow, dashboard, events, permissions, API contracts, tests, and documentation participate in one MVP journey.
- Keep the MVP local-first and storage-independent while documenting adapter-ready limitations honestly.

## Requirements

- MVP journey creates a local identity, workspace, question, improved question, Semantiq report, graph node, research project, evidence object, agent goal, workflow execution, community, dashboard snapshot, and export package.
- Required MVP events are versioned and observable.
- Required MVP screens are declared.
- Service health endpoints are declared for the MVP service map.
- Docker Compose includes local MVP service scaffolds and infrastructure dependencies.
- Export includes workspace metadata, questions, research projects, evidence, Semantiq reports, graph snapshot, agent logs, workflow history, community data, JSON structure, and Markdown summary.

## Architecture

The implementation introduces `@tech-club/mvp-runtime` as the integration composition package. It reuses existing Core, Question Intelligence, Semantiq, Graph Runtime, Research Runtime, and Agent Runtime packages. It does not create a new product layer.

## Interfaces

- LocalMvpRuntime
- MvpJourneyInput
- MvpJourneyResult
- MvpEvent
- DashboardSnapshot
- PortableWorkspaceExport
- HealthEndpoint
- mvpScreens
- mvpHealthEndpoints

## Dependencies

- `@tech-club/core`
- `@tech-club/question-intelligence`
- `@tech-club/semantiq`
- `@tech-club/graph-runtime`
- `@tech-club/research`
- `@tech-club/agent-runtime`
- Docker Compose
- Vitest

## Risks

- The web UI is represented by screen descriptors, not a full Next.js implementation.
- Backend services expose health metadata and Docker scaffolds, not full HTTP servers.
- Storage remains memory/local-export based until SQLite/PostgreSQL/Neo4j adapters are approved.
- Coverage enforcement remains future work.
- Docker Compose config is validated, but full container startup may require image pulls and local resources.

## Testing

Tests cover the full MVP journey, required event publication, screen declaration, health endpoint declaration, export generation, dashboard generation, and runtime integration.

## Future Extension

- Real Next.js MVP screens.
- HTTP API gateway handlers.
- SQLite local persistence.
- PostgreSQL and Neo4j adapters.
- Redis-backed event/cache integration.
- ZIP export package.
- Playwright browser E2E.
- Coverage enforcement and release tagging automation.

## Acceptance Criteria

- MVP journey works end-to-end in tests.
- Required MVP events are emitted.
- All implemented runtimes participate in the journey.
- Dashboard and export work.
- Docker Compose configuration validates.
- Documentation and known limitations exist.
- TypeScript and tests pass.

## Implementation Notes

This alpha slice proves integration through local TypeScript runtimes and Docker service scaffolds. Public alpha UI, HTTP APIs, storage adapters, signed release tags, Docker image publishing, and cloud deployment remain future Spec-Kit work.

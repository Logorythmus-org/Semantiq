# Sprint 1 Identity, Workspace, and Knowledge Foundation

## Purpose

Deliver the first usable local-first Tech Club knowledge app foundation.

## Goals

- Create local identities, encrypted local sessions, workspaces, knowledge objects, and questions.
- Render question and knowledge nodes through the graph viewer contract.
- Provide local dashboard, search, export, service health, CLI, and docs surfaces.

## Requirements

- Identity runtime covers profile, avatar, preferences, language, timezone, membership, role, wallet stub, settings, history, audit, anonymous/offline mode, and future federation.
- Authentication covers local login, device auth, remember-device sessions, logout, recovery stub, OAuth stub, and federation stub.
- Workspace runtime covers create, update, archive, templates, settings, metadata, timeline, export, restore-ready snapshots, and versioning.
- Knowledge runtime covers notes, documents, ideas, questions, research objects, bookmarks, links, references, attachments, and collections.
- Question runtime covers create, edit, archive, delete, duplicate, convert, tag, bookmark, history, relations, templates, and graph updates.
- Dashboard, graph viewer, local search, JSON export, Markdown export, and ZIP placeholder export are available.

## Architecture

`@tech-club/sprint1-runtime` composes the core domain factory and graph runtime with in-memory local-first state. Service packages expose FastAPI-ready health and route descriptors while frontend descriptors define the required Next/React/Tailwind/TanStack screens.

## Interfaces

- `LocalSprint1Runtime.createIdentity`
- `LocalSprint1Runtime.loginLocal`
- `LocalSprint1Runtime.createWorkspace`
- `LocalSprint1Runtime.createKnowledge`
- `LocalSprint1Runtime.createQuestion`
- `LocalSprint1Runtime.updateQuestion`
- `LocalSprint1Runtime.graphViewer`
- `LocalSprint1Runtime.search`
- `LocalSprint1Runtime.exportWorkspace`
- `LocalSprint1Runtime.apiContracts`

## Dependencies

- `@tech-club/core`
- `@tech-club/graph-runtime`
- `services/workspace`
- `services/question`
- `services/search`

## Risks

- Storage adapters beyond memory are contract stubs.
- OAuth, recovery, and federation are adapter stubs.
- ZIP export is represented as a portable placeholder until filesystem packaging lands.

## Testing

Vitest covers identity/session, workspace/knowledge/question graph flow, dashboard, search, export, events, contracts, screens, storage adapters, and auth adapters.

## Future Extension

Sprint 2 can replace memory persistence with SQLite/JSON adapters, wire the descriptors into real UI routes, and connect question intelligence and Semantiq scoring.

## Acceptance Criteria

- User can create an identity, workspace, knowledge object, and question locally.
- Questions and knowledge appear in graph state with semantic relations.
- Dashboard, search, and export return usable local-first results.
- Required CLI commands, docs, service health descriptors, tests, and API contracts exist.

## Implementation Notes

Implemented in `packages/sprint1-runtime`, `apps/web/src/sprint1`, `services/workspace`, `services/question`, and `services/search`.

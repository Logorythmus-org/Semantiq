# Workspace Runtime

The Semantic Workspace Runtime is the visible operating system of Tech Club. It is not a file manager or document app. It is a living semantic environment where humans and AI agents work inside connected knowledge spaces.

## Core Flow

Questions -> Knowledge Objects -> Projects -> Agents -> Live Collaboration -> Knowledge Graph -> Execution -> Innovation.

## Runtime Layers

- Workspace Shell: hosts panels, docking, command palette, settings, notifications, and activity.
- Navigation Runtime: manages explorer, search, quick actions, saved views, and timelines.
- Knowledge Runtime: loads questions, projects, objects, datasets, workflows, and relationships.
- Document Runtime: edits Markdown, rich text, papers, code, diagrams, canvases, tables, and interactive blocks.
- Execution Runtime: launches notebooks, workflows, repositories, terminals, benchmarks, and tasks.
- Agent Runtime: embeds Agent OS sessions with workspace context and approvals.
- Collaboration Runtime: supports presence, cursors, selection, comments, suggestions, reviews, conflict resolution, and time travel.
- Knowledge Graph Runtime: updates and renders live graph projections.
- Synchronization Runtime: handles local-first sync, selective sync, encrypted sync, and future peer-to-peer sync.
- Storage Runtime: manages local ownership, encrypted storage, history, and cache.
- Presentation Runtime: renders dashboards, timelines, graph views, notebooks, canvases, and publications.

## Package Layout

- `packages/workspace-runtime/src/contracts.ts`: runtime workspace, knowledge object, document, notebook, collaboration, panel, search, graph, sync, analytics, repository, service, and event contracts.
- `packages/workspace-runtime/src/index.ts`: local runtime service scaffold for workspace lifecycle, objects, search, notebooks, agents, graph rendering, sync, export, and benchmarking.
- Future directories: `runtime/`, `shell/`, `navigation/`, `documents/`, `notebooks/`, `graphs/`, `collaboration/`, `panels/`, `editors/`, `timeline/`, `search/`, `automation/`, `analytics/`, `sync/`, `api/`, `events/`, `contracts/`, `schemas/`, `ui/`, `tests/`, and `docs/`.

## Sprint 1 Slice

`@tech-club/sprint1-runtime` adds the first usable local workspace loop: create, update, archive-ready state, templates, settings, metadata, timeline IDs, versioned records, dashboard summaries, search, graph snapshots, and portable exports.

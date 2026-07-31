# Sprint 1

Sprint 1 creates the first usable local-first knowledge foundation: identity setup, local sessions, workspaces, knowledge objects, questions, graph state, dashboard, search, export, CLI commands, service health descriptors, and UI screen descriptors.

Primary implementation: `packages/sprint1-runtime`.

Validation:
- `@tech-club/sprint1-runtime` tests cover the complete local flow.
- `techclub workspace`, `techclub graph`, `techclub export`, `techclub search`, `techclub doctor`, and `techclub reset` are routed through the local CLI.
- Workspace, question, and search services expose `/health` descriptors.

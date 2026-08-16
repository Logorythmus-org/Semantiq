# Developer Platform

The Developer Platform turns Tech Club into an extensible ecosystem. Developers can build applications, plugins, AI agents, workflow templates, knowledge extensions, visual components, marketplace assets, and third-party integrations without modifying the core.

## Architecture

Core Runtime -> Extension Layer -> Plugin Runtime -> SDK -> Public APIs -> Developer Tools -> Marketplace -> Community.

## Responsibilities

- Define stable SDK concepts.
- Isolate and verify plugins.
- Expose documented public APIs.
- Provide CLI and automation support.
- Support MCP, agent, workflow, and knowledge extensions.
- Validate marketplace publishing through Semantiq, security, compatibility, and permission review.

## Package Layout

- `packages/developer-platform/src/contracts.ts`: application, SDK, plugin, API, CLI, component, marketplace publishing, portal, repository, service, and event contracts.
- `packages/developer-platform/src/index.ts`: local repository/service scaffold for registering SDKs, installing plugins, publishing APIs, creating CLI descriptors, validating marketplace publishing, and portal resources.
- Future directories: `sdk/`, `plugin-runtime/`, `component-library/`, `cli/`, `public-api/`, `graphql/`, `rest/`, `websocket/`, `mcp/`, `examples/`, `templates/`, `documentation/`, `marketplace/`, `validation/`, `analytics/`, `security/`, `contracts/`, `schemas/`, `events/`, `tests/`, and `docs/`.

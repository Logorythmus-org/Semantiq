# Core Domain Implementation Specification

## Purpose
Implement the first production Core Domain layer for Tech Club: identifiers, identity, workspace, knowledge objects, questions, graph, events, repositories, permissions, validation, serialization, APIs, and tests.

## Goals
- Provide reusable primitives for all future modules.
- Keep domain logic isolated from infrastructure.
- Implement strict DDD aggregates, value objects, repository ports, events, policies, and application services.
- Make storage adapters interchangeable.
- Make API and schema contracts discoverable from source.

## Requirements
- Universal identifiers support UUID, ULID, semantic, persistent, federated, temporary, node, workspace, question, knowledge, and identity IDs.
- Identity aggregate supports profile, credentials, memberships, organizations, roles, permissions, capabilities, trust, wallet links, federation identities, verification, and audit.
- Workspace aggregate supports projects, collections, logical folders, knowledge objects, agents, settings, templates, history, ownership, and collaboration.
- Knowledge object aggregate supports metadata, relations, version, tags, owner, workspace, history, Semantiq, permissions, comments, attachments, timeline, and graph links.
- Question aggregate supports profile, relations, lifecycle, status, confidence, benchmarks, metadata, versioning, and history.
- Knowledge Graph supports nodes, edges, properties, labels, semantic relations, traversal, versioning, events, history, and federation references through storage-independent contracts.
- Permissions support deterministic RBAC and ABAC-style evaluation through grants, context, roles, attributes, and capabilities.
- Repositories are interfaces only at the domain boundary.

## Architecture
The implementation lives primarily in `@tech-club/core`, using Clean Architecture folders: domain, application, infrastructure, contracts, events, schemas, api, tests, examples, docs, spec, tasks, adr, and spec-history. Thin production packages re-export core primitives for stable package names without duplicating domain logic.

## Interfaces
- Identifier and ID contracts.
- IdentityAggregate.
- WorkspaceAggregate.
- KnowledgeObjectAggregate.
- QuestionAggregate.
- GraphNode and GraphEdge.
- PermissionGrant and AuthorizationDecision.
- CoreDomainEvent and EventBus.
- Repository contracts.
- Application services.
- Validation and serialization helpers.
- API, OpenAPI, JSON Schema, GraphQL, and MCP descriptors.

## Dependencies
- TypeScript standard runtime.
- Vitest for tests.
- Existing Tech Club monorepo tooling.
- No database, HTTP, framework, AI provider, or cloud dependency in the core domain.

## Risks
- Core packages can become too broad if feature behavior leaks into primitives.
- In-memory adapters can be mistaken for production persistence.
- Thin package re-exports can hide ownership unless docs remain explicit.
- API contract placeholders must evolve into generated contracts before public beta.

## Testing
Tests cover identity, workspace, knowledge objects, questions, graph traversal, permission evaluation, event recording, repository behavior, validation, and TypeScript compilation.

## Future Extension
- PostgreSQL, Neo4j, SQLite, JSON, and future storage adapters.
- Generated OpenAPI, JSON Schema, GraphQL, Zod, and Pydantic contracts.
- Coverage reporting and thresholds.
- Repository conformance test suites.
- Search, cache, secrets, observability, and encryption provider implementations.

## Acceptance Criteria
- Core packages compile.
- Identity, workspace, knowledge object, question, graph, permissions, events, repositories, validation, serialization, and API descriptors exist.
- Storage remains replaceable.
- Tests pass for the implemented core domain slice.
- Documentation exists for the core domain.

## Implementation Notes
This is the first production domain slice. It intentionally implements storage-independent domain and memory test adapters only. Production persistence begins after adapter-specific Spec-Kit approval.

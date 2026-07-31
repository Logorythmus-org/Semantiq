# Production Engineering Guide

Phase 5 turns the completed architecture into software. The rule is simple: stable architecture, explicit specifications, incremental implementation, complete validation.

## Engineering Standards
- SOLID.
- Domain-Driven Design.
- CQRS where useful.
- Event sourcing where audit and replay matter.
- Clean Architecture.
- Hexagonal Architecture.
- Repository Pattern.
- Specification Pattern.
- Dependency Injection.
- Strict typing.
- OpenAPI for service contracts.
- Semantic versioning.
- Conventional commits.

## Frontend Stack
- Next.js.
- React.
- TypeScript.
- Tailwind.
- TanStack.
- Playwright.
- Storybook.
- WebGPU where required.
- Three.js where required.

## Backend Stack
- FastAPI.
- Python.
- Node.js where needed.
- PostgreSQL.
- Neo4j.
- Redis.
- Docker.
- OpenAPI.
- Celery or worker equivalents.
- Background tasks.

## Agent Stack
- Local models.
- OpenAI.
- Anthropic.
- Gemini.
- OpenRouter.
- Ollama.
- MCP.
- Provider abstraction.

## Database Strategy
- PostgreSQL for relational production data.
- Neo4j or graph-compatible adapters for graph workloads.
- Object storage for files and archives.
- Redis for cache, queues, and transient coordination.
- Vector database adapters for semantic search.
- Search index adapters for full-text and faceted search.
- SQLite for local-first and offline operation.

Every storage engine requires migrations, versioning, backups, restore tests, and offline behavior where applicable.

## Event Architecture
Production modules define commands, events, queries, projections, event stores, replay, versioning, dead letter queues, audit records, and observability.

## Security Standards
Authentication, authorization, RBAC, ABAC, workspace isolation, encryption, audit logs, secret management, sandboxing, zero trust, and OWASP compliance are required production concerns.

## Definition of Done
- Spec-Kit complete.
- Acceptance tests implemented.
- Unit, integration, contract, and relevant e2e tests pass.
- Security review complete.
- Performance budget checked.
- Documentation updated.
- API changes versioned.
- Migration and rollback plan documented.
- Release notes prepared.

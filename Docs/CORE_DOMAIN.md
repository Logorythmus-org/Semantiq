# Core Domain

The Core Domain is Tech Club's first implemented production software foundation. It provides immutable identifiers, DDD aggregates, repository contracts, domain events, application services, validation, serialization, graph primitives, permissions, and in-memory adapters for tests.

## Clean Architecture

- `domain/`: identifiers, aggregates, graph relations, permissions, events, and factories.
- `application/`: use-case services, validation, and serialization.
- `contracts/`: repository ports, storage adapter descriptors, observability, encryption, search, cache, and configuration ports.
- `infrastructure/`: replaceable in-memory adapters used for tests and local scaffolds.
- `schemas/`: OpenAPI, JSON Schema, and GraphQL contract placeholders.
- `api/`: REST and MCP contract descriptors.

## Rules

- Domain code does not depend on storage, HTTP, frameworks, databases, or AI providers.
- Repositories are interfaces first.
- Storage adapters are replaceable.
- Events are versioned and correlation-aware.
- Permissions evaluate deterministically.
- Knowledge Graph relations remain storage-independent.

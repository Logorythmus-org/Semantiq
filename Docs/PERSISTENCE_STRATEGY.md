# Persistence Strategy

Persistence is technology-independent at the domain level.

## Model Separation

- Domain Model: aggregates, entities, value objects, events, and policies.
- Persistence Model: tables, documents, graph edges, blobs, vectors, indexes.
- API Model: stable request and response contracts.
- Transport Model: HTTP, RPC, queue, stream, or local IPC envelopes.
- View Model: UI-specific projections.

## Database Targets

- SQLite: local-first storage and offline development.
- PostgreSQL: multi-user relational persistence.
- DuckDB: local analytics and benchmark analysis.
- Graph Database: relationship traversal and semantic graph operations.
- Object Storage: files, datasets, media, exports, and large artifacts.
- Vector Storage: future semantic retrieval and embedding indexes.

## Repository Rules

Repositories expose aggregate-oriented methods. Persistence mappers translate between stored records and domain objects. Database IDs must not replace domain IDs.

## Event Storage

Events are append-only records with versioned payloads. Replays rebuild projections and audit views.

# Storage Engine

Storage engines are interchangeable adapters behind stable interfaces.

## Supported Engines
- Primary Local Storage: default local metadata and records.
- SQLite: local-first transactional storage.
- DuckDB: analytics, benchmarks, and local columnar workloads.
- Graph Storage: relationship traversal and graph queries.
- Vector Storage: embeddings and similarity search.
- Object Storage: structured objects and large artifacts.
- Blob Storage: binary files and attachments.
- Cache: memory and persistent acceleration.
- Workspace Storage: project-local state and files.
- Future Cloud Storage: optional remote replication.

## Engine Contract
Engines expose capabilities, health, read, write, delete, transaction, backup, restore, and diagnostics operations as applicable.

## Independence Rule
Storage-specific records never become domain objects. Mappers translate between persistence and domain-safe models.

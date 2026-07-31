# Data Platform

The Universal Data Platform is Tech Club's semantic foundation. It stores meaning through nodes, relationships, versions, indexes, and provenance instead of exposing raw database structures to modules.

## Data Layers
- Presentation Models: UI-specific shapes optimized for reading and interaction.
- API Models: stable request and response contracts.
- Domain Models: aggregates, entities, value objects, and policies.
- Persistence Models: database records, graph records, objects, blobs, vectors, and indexes.
- Knowledge Graph: semantic nodes and first-class relationships.
- Storage Engine: interchangeable local and future remote backends.
- Synchronization: local-first change exchange, conflict detection, and merge.
- Backup: snapshots, exports, and incremental backup.
- Recovery: restore points, validation, and repair.
- Archive: cold storage, soft deletion, retention, and audit access.

## Core Principles
The platform is local-first, offline-first, semantic, immutable where possible, versioned, observable, encrypted, composable, AI-friendly, future distributed, and technology independent.

## Access Rule
Modules use repositories and storage interfaces. No module directly opens SQLite, DuckDB, object storage, graph storage, or vector storage.

## Package Structure
- `packages/data-platform/src/contracts.ts`: public semantic data contracts.
- `packages/data-platform/src/index.ts`: local contract exports and generic helpers.
- Future directories: `storage/`, `graph/`, `vector/`, `cache/`, `sync/`, `backup/`, `search/`, `repositories/`, `index/`, `adapters/`, `security/`, `schemas/`, `migrations/`, `api/`, and `diagnostics/`.

# Graph Runtime

The Graph Runtime is the live semantic backbone of Tech Club. It manages knowledge nodes, semantic edges, traversal, subgraphs, search, recommendations, timeline entries, events, cache hooks, and adapter boundaries without coupling to a specific database.

## Runtime Modules
- Node manager.
- Edge manager.
- Traversal engine.
- Version and timeline manager.
- Event integration.
- Cache layer.
- Federation adapter boundary.
- Graph queries.
- History.

## Storage Independence
The current runtime is in-memory for deterministic tests. Production adapters for Neo4j, PostgreSQL, SQLite, JSON, and future graph stores must implement the same contracts.

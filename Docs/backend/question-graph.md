# Question Graph

Prompt 3 builds graph views from PostgreSQL adjacency rows. Neo4j, `packages/graph-runtime`, and the historical general graph aggregates are not runtime dependencies.

## Traversal

`GetQuestionGraph` performs breadth-first traversal from one Question. The response includes Question views and relation views, with the root first and edges ordered by discovery level.

Direction filters apply to directed edges:

| Direction  | Directed behavior        | Symmetric behavior |
| ---------- | ------------------------ | ------------------ |
| `outgoing` | Source to target         | Either endpoint    |
| `incoming` | Target to source         | Either endpoint    |
| `both`     | Either directed endpoint | Either endpoint    |

Optional type filters are exact allowlisted relation types. Reads use repeatable-read, read-only PostgreSQL transactions so a multi-level result observes one database snapshot.

## Bounds

- Depth: default 1, maximum 3.
- Nodes: default 50, maximum 100, including root.
- Edges: hard maximum 500.
- Relation pages: default 25, maximum 100.

`truncated: true` means a node or edge cap excluded otherwise reachable data. Reaching the requested depth alone is not truncation.

## Deferred Graph Work

Shortest path, ranking, centrality, semantic similarity, graph write projection, cross-object edges, graph database replication, and distributed traversal remain outside this foundation.

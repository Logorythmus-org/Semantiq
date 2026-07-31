# Data Performance Guide

The Data Platform is designed for long-lived local-first knowledge graphs.

## Strategies
- lazy loading
- streaming
- pagination
- chunking
- incremental loading
- graph traversal optimization
- caching
- compression
- background indexing

## Query Performance
Graph queries should set traversal depth, result limits, permission scope, and index hints. Large object and blob reads should stream.

## Background Work
Indexing, vectorization, backup, sync, and integrity checks run through the kernel scheduler where possible.

## Workspace Performance
Workspaces must support lazy loading, incremental rendering, large projects, background indexing, caching, streaming, virtual lists, graph optimization, and offline performance.

Large project dashboards should load summaries first, then hydrate details on demand. Graph views should use depth limits, clustering, pagination, and cached projections.

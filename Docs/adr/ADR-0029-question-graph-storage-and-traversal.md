# ADR-0029: Question Graph Storage and Traversal

Status: Accepted

Date: 2026-07-13

## Context

Prompt 3 needs trustworthy local graph navigation, but a graph database, semantic engine, ontology, and distributed graph runtime are outside scope.

## Decision

Store Question relations as indexed PostgreSQL adjacency rows with foreign keys to `questions`. Build graph views with storage-independent breadth-first traversal in the application layer. Read traversals use repeatable-read, read-only transactions and return the root first, then discovered nodes and edges in breadth-first order.

Depth is limited to 3, nodes to 100, and edges to 500. Listing is paginated at a maximum of 100 rows. Symmetric edges traverse from either endpoint under every direction filter. Existing edges remain readable when an endpoint is later archived, while new edges require both endpoints to be published.

## Consequences

Local development and Docker require only PostgreSQL. The model can be projected to a future graph store without changing domain identity. Deep traversal, shortest path, ranking, semantic inference, and cross-object graph operations remain deferred.

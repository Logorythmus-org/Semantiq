# ADR-0040: Search Evolution Boundary

Status: Accepted

Date: 2026-07-13

## Context

Future Semantiq, vector, graph, Research, and Agent runtimes may augment discovery. None should replace the authoritative Question transaction model or force infrastructure into the current local runtime.

## Decision

The current `QuestionReadRepository` is the relational discovery provider. Keep a conceptual `QuestionDiscoveryProvider` boundary for future full-text, vector, graph, or hybrid adapters, but do not add speculative interfaces or implementations now. Future providers return authorized Question identifiers/read models and reconcile against current lifecycle state in the Question Runtime.

## Consequences

PostgreSQL remains sufficient and reproducible today. Future retrieval can augment results without owning Questions, revisions, Frames, relations, or moderation state. Embeddings, AI rewriting, recommendation, personalization, and semantic scoring remain explicitly deferred.

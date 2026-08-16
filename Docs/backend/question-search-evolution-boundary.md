# Question Search Evolution Boundary

## Current

The Question Runtime owns exact retrieval, lifecycle-aware listing, typed filters, keyset pagination, database substring search, one-hop relation filters, Frame-compatible filters, and stable read models. PostgreSQL is the only required substrate and current transactional state is authoritative.

## Future

A conceptual `QuestionDiscoveryProvider` may later have relational, full-text, vector, graph, or hybrid implementations. Future providers may propose or retrieve Question IDs, but results must be reconciled with authoritative lifecycle, visibility, moderation, and current text before release.

Semantiq may add explicit semantic analysis; Research may add evidence retrieval; Agent may assist exploration; graph providers may broaden topology; vector providers may add similarity. These systems augment discovery and cannot own Question identity, mutation, revisions, Frames, relations, provenance, moderation, or deletion policy.

Deferred capabilities include embeddings, vector databases, AI query rewriting, automatic translation, synonyms, relevance scoring, semantic quality scores, recommendation, popularity, engagement ranking, and personalized feeds. Introducing any of them requires a separate contract, threat model, benchmark, rollback path, and ADR.

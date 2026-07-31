# Questions Package

Authoritative Tech Club Question Runtime domain and application package.

It owns Question creation, lifecycle mutation, immutable revisions, optimistic concurrency, Question Relations, bounded Question Graph reads, and explicit versioned Question semantic structures. Memory adapters support contract and failure tests; PostgreSQL adapters live in `packages/persistence`.

Historical models in `question-network`, `question-engine`, `core`, and `graph-runtime` are not composed into this aggregate. Semantic scoring/inference, suggestions, research, agents, workflow, moderation, and external graph projection remain separate runtimes.

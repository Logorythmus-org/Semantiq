# ADR-0035: Question Read Model Boundary

Status: Accepted

Date: 2026-07-13

## Context

Question commands, revisions, relations, and semantic structures are transactional domain models. Listing clients need a small stable projection and must not receive persistence rows, outbox state, histories, or unbounded graph data.

## Decision

Keep the write model unchanged and introduce transport-neutral `QuestionSummaryView` and `QuestionDetailView` contracts in `packages/questions`. A `QuestionReadRepository` composes those views from the same PostgreSQL database. Summary reads expose current Question fields, Frame flags, and a one-hop relation count. Detail adds a bounded Frame summary and relation type summary.

The separation is logical CQRS only. No projection worker, second database, broker, cache, or external search service is introduced.

## Consequences

Command and query models can evolve independently while sharing transactional consistency. Expensive histories and graph traversal remain explicit endpoints. Future providers can implement the read contract without becoming the source of transactional truth.

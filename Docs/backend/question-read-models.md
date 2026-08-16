# Question Read Models

## QuestionSummaryView

The primary list/search item contains:

- `id`, `text`, `language`, `status`, `source`, and optional `creatorId`
- `createdAt`, `updatedAt`, and Question `version`
- `hasFrame`, optional `frameVersion`, and optional `frameStale`
- `hasAssumptions`, `hasUnknowns`, and optional declared `uncertaintyType`
- one-hop `relationCount`

It excludes revisions, complete semantic content, graph traversal, outbox state, persistence-only columns, scores, and embeddings.

## QuestionDetailView

Detail extends the summary with an optional Frame summary and a relation summary. The Frame summary contains version/freshness, component counts, and the declared uncertainty level. The relation summary contains count and distinct relation types. It does not include component text, histories, complete edges, or descendants.

## Boundary

Both contracts live in `packages/questions` and are independent of PostgreSQL row types and HTTP envelopes. The memory and PostgreSQL repositories implement the same contract. Existing explicit endpoints remain responsible for revisions, semantic structure content/history, adjacency, and bounded graph traversal.

Reads observe committed state at statement scope. They are not event-driven projections and have no projection lag.

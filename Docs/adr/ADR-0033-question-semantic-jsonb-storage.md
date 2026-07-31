# ADR-0033: Question Semantic JSONB Storage

Status: Accepted

Date: 2026-07-13

## Context

The semantic structure is bounded and strongly shaped, but its sections are naturally nested. Prompt 4 requires local PostgreSQL persistence and does not require semantic search, embeddings, or a vector database.

## Decision

Store the current structure as one validated JSONB snapshot in `question_semantic_structures` and full before/after JSONB snapshots in `question_semantic_revisions`. PostgreSQL functions and checks enforce required keys, value types, uncertainty levels, per-section and total bounds, duplicate rejection, uncertainty rationale, and disjoint scope boundaries.

Both tables reference authoritative Question data with `ON DELETE RESTRICT`. Current structures cannot be deleted, and revision rows reject update and delete operations. No JSONB search or GIN index is added in this sprint.

## Consequences

Writes are atomic and the persisted shape matches the public contract without premature relational decomposition. Prompt 5 may add evidence-based query indexes after measuring actual discovery needs. Direct SQL still must use the same normalized contract as application writes.

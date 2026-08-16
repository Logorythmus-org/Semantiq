# ADR-0037: Question Text Search Strategy

Status: Accepted

Date: 2026-07-13

## Context

The authoritative runtime uses PostgreSQL and stores one current Question text value. Prompt 5 requires local multilingual substring discovery but not semantic retrieval, linguistic stemming, ranking, or an external search cluster.

## Decision

Store an immutable-function-derived normalized `search_text` generated column and index it with PostgreSQL `pg_trgm` GIN. Search uses a parameterized escaped `LIKE '%query%'` predicate over current state and retains deterministic recency ordering. Original text is never rewritten. Question updates synchronize the generated value in the same transaction automatically.

## Consequences

Substring search supports English, German, Persian, punctuation, and partial terms without a second index lifecycle. Very common terms may use the recency B-tree instead of GIN. There is no stemming, typo correction, synonym expansion, translation, relevance score, or semantic claim.

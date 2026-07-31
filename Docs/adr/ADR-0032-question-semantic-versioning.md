# ADR-0032: Question Semantic Versioning

Status: Accepted

Date: 2026-07-13

## Context

Semantic context changes independently from Question wording. Reusing the Question aggregate version would mix unrelated concurrency domains and the existing Question revision table cannot represent structured snapshots faithfully.

## Decision

Give each `QuestionSemanticStructure` an independent optimistic version. Creation requires `expectedVersion: 0` and produces version 1. Every accepted replacement requires the exact current semantic version, increments it once, and writes an immutable full before/after revision in the same transaction.

Updates are complete replacements rather than patches. Normalized no-op replacements fail with a domain conflict. Creation has no synthetic revision; later revisions begin at version 2, matching the established Question history policy.

## Consequences

Concurrent semantic edits cannot overwrite each other, and downstream consumers can reconstruct every accepted change without interpreting partial diffs. Semantic mutation never increments the Question version. Field-level commands and merge semantics remain deferred until a demonstrated workflow requires them.

# ADR-0125: Coordinator Merge

Status: Deferred

Date: 2026-07-20

## Context

No normalized worker result, task identity, provenance reference, or deterministic ordering exists.

## Decision

Do not merge or semantically rewrite legacy worker outputs.

## Consequences

Result aggregation remains unavailable until parent result contracts and duplicate controls exist.

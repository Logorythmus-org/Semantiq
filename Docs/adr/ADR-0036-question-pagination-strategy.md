# ADR-0036: Question Pagination Strategy

Status: Accepted

Date: 2026-07-13

## Context

Page-number pagination becomes slower at deep offsets and can repeat or skip rows when Questions change. Discovery needs deterministic bounded pages without a total-count query.

## Decision

Use keyset cursor pagination. The default order is `created_at DESC, id DESC`; controlled alternatives are oldest and recently updated, each with `id` as the tie-breaker. Cursors are opaque base64url JSON containing schema version, sort, timestamp, ID, and a hash of the normalized query. Default size is 20 and maximum size is 100. Invalid, oversized, malformed, or query-mismatched cursors are rejected.

## Consequences

Deep reads avoid offset scans and total counting. A cursor is valid only for the query that created it. This is not snapshot isolation across HTTP requests: concurrent updates can move rows between pages, while the keyset boundary prevents ordinary duplicates for an unchanged ordering key.

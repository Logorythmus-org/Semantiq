# ADR-0039: Question Discovery Query Complexity

Status: Accepted

Date: 2026-07-13

## Context

Discovery combines text, lifecycle, Frame JSONB, and one-hop relation predicates. Arbitrary expressions, unbounded pages, or application-side joins could create denial-of-service and N+1 risks.

## Decision

Accept only a fixed query parameter allowlist and AND composition. Bound text to 200 characters, cursor to 512 characters, results to 100, and relation discovery to one hop. Run one parameterized SQL statement per list/search request. First bound candidate Questions, then calculate relation counts for only that page. Do not calculate total counts.

## Consequences

Complexity is predictable and raw SQL cannot enter the query. Frame JSONB predicates remain acceptable at the measured local scale. Query-plan review must precede new JSONB indexes. Authorization, rate limiting, and database statement limits remain deployment hardening concerns.

# Phase B Prompt 5 Security Review

Status: Passed for local Prompt 5 controls; deployment remains blocked by inherited authorization and abuse-resistance gaps.

## Findings

| Severity      | Count | Finding/status                                                                                                                          |
| ------------- | ----: | --------------------------------------------------------------------------------------------------------------------------------------- |
| Critical      |     0 | None found                                                                                                                              |
| High          |     0 | None found                                                                                                                              |
| Medium        |     3 | public discovery/visibility policy; no request-rate quota; trusted upstream actor and creator-enumeration boundary deferred to Prompt 6 |
| Low           |     4 | relation enumeration, timing/cardinality metadata, intentional normalization collisions, unresolved query/log retention policy          |
| Informational |     2 | related-to plan watch item; future vector/personalization trust boundary                                                                |

## Controls Verified

- all SQL values parameterized; wildcard/backslash escaping makes hostile-looking input literal
- arbitrary/repeated fields, invalid enums/ranges/booleans, unsafe identifiers, controls, oversized query/cursor/page, and cursor tampering are rejected
- query hash prevents cursor reuse across filters or search text
- active-only default prevents archived leakage; archived access requires explicit status
- one-hop/AND-only/bounded-page model limits query complexity; statement timeout remains configured
- raw database failures map to retryable `question_search_unavailable`
- raw/normalized text and cursor are absent from ordinary logs; a unique marker had zero log occurrences
- original multilingual text is preserved; search normalization is isolated
- no FTS query syntax, AI rewriting, external search, vector store, recommendation, or personalization attack surface was introduced

## Residual Risk

The API still inherits public current Question reads and trusts `x-actor-id` for write policy. Prompt 6 must define authenticated actor context, visibility/moderation filtering, rate limits, audit trails, abuse detection, and retention. High-cardinality adversarial load and concurrent load were not tested; local p95 measurements are not a denial-of-service guarantee.

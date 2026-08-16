# Phase B Prompt 3 Security Review

## Result

- Critical: 0
- High: 0
- Medium: 2
- Low: 3

## Medium Findings

1. `x-actor-id` is trusted local context, not authentication. Source-creator authorization is correct only behind an authenticated boundary. This blocks deployment, not local Prompt 3 completion.
2. Question and graph reads follow the existing public Question policy and include full Question text. Any future visibility, tenant, or private-question policy must filter every node and edge consistently before deployment.

## Low Findings

1. Immutable relations have no correction, supersession, retention, or legal erasure workflow.
2. Relation and outbox growth is append-only and has no archival policy.
3. Creatorless historical Questions fail closed as relation sources and require an explicit ownership migration if they must participate.

## Controls Verified

Header-only actor context, body spoof rejection, source ownership, published endpoint checks, row locking against archive races, self-link/type/ID bounds, semantic uniqueness, foreign keys, immutable rows, parameterized SQL, bounded traversal, idempotency key hashing, atomic outbox writes, compact event payloads, sanitized errors, and no tested text/key leakage in Docker logs.

## Decision

Accept for local Phase B continuation. Do not expose directly to untrusted traffic.

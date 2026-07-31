# Prompt 4 Security Review

## Summary

| Severity | Count |
| -------- | ----- |
| Critical | 0     |
| High     | 0     |
| Medium   | 3     |
| Low      | 3     |

## Medium Findings

1. `x-actor-id` remains trusted local context rather than authenticated identity. Deployment is blocked until an authentication boundary supplies actor identity.
2. Current semantic structures follow public Question reads and may contain premises or constraints more sensitive than Question text. A future visibility model must filter Question, semantic, and graph reads consistently.
3. Current structures and revisions are retained and database deletion is blocked. Legal erasure, retention, and governance policy require an explicit future design and migration.

## Low Findings

1. Authorization is creator-only and has no collaborator, workspace, or field-level permission model.
2. Events contain IDs and semantic versions; consumers still need an authorization-aware fetch/projection boundary.
3. Logs retain identifiers, versions, result codes, and correlation IDs. Operational retention and access policy are not yet defined.

## Controls Verified

Header-only actor identity, body-spoof rejection, archived-write protection, bounded input, parameterized SQL, optimistic concurrency, append-only revisions, no current-row delete, compact events, hashed idempotency keys, sanitized errors, 64 KiB request limit, and content-free structured logs all passed.

## Out-of-Scope Risks

No LLM, embedding, vector database, external semantic provider, automatic assumption inference, semantic score, or answer pipeline exists in this sprint, so those data-exfiltration and prompt-injection surfaces were not introduced.

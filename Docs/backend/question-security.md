# Question Security

Prompt 6 adds narrow moderator capabilities, bounded/sanitized audit metadata, private report reads, database-backed discovery exclusion, graph/semantic access gates, non-enumerating restricted reads, hashed local limiter keys, duplicate constraints, append-only triggers, and no secret/idempotency-key audit storage.

Prompt 2 enforces creator-only mutation/history at the application boundary, expected-version compare-and-swap, archived-state guards, bounded text/reason/idempotency/correlation/causation values, parameterized SQL, immutable revision rows, compact events, and sanitized errors/logs.

The local API treats `x-actor-id` as trusted upstream context; it is not authentication. Connecting this service directly to untrusted traffic is prohibited until the authentication/authorization boundary signs or supplies actor context. This is the primary medium-severity deployment limitation.

Full historical text is returned only to the matching creator under the current temporary policy. Revision growth, legal erasure, redaction, retention, and export remain deferred security/privacy work.

Prompt 3 relation controls and the implications of public graph reads are documented in `question-relation-security.md`.

Prompt 4 semantic content controls, public-current/private-history policy, and downstream-consumer risks are documented in `question-semantic-security.md`.

Prompt 5 discovery rejects arbitrary/repeated parameters, malformed timestamps, invalid enums, oversized text/cursors/pages, cursor reuse across queries, and control/bidirectional formatting characters. SQL values are parameterized; `LIKE` metacharacters are escaped; database errors are sanitized. Archived Questions are excluded by default.

Discovery logs record query presence/length, filter names, result count, correlation, and duration but never raw query text. Public listing, creator/relation enumeration, rate limiting, and retention remain Prompt 6 hardening blockers. Detailed policy and findings are in `question-search-privacy.md` and the Prompt 5 security review.

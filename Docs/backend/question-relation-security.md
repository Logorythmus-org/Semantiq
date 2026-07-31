# Question Relation Security

Prompt 3 enforces source-creator writes, published endpoint checks, self-link rejection, strict type allowlisting, parameterized SQL, database foreign keys, immutable rows, transactionally locked endpoints, bounded graph reads, compact outbox events, and sanitized structured logs.

The API's `x-actor-id` remains trusted local context rather than authentication. It must be supplied by an authenticated boundary before any deployment. Relation reads currently follow the existing public `GET Question` policy and return full Question views; future visibility or tenant rules must filter every graph node and edge before deployment.

Relation events and logs exclude Question text, request bodies, and idempotency keys. IDs, relation type, actor, result, correlation ID, and duration are operational metadata.

Immutable relations have no correction or erasure workflow yet. Retention, legal deletion, supersession, moderation, abuse controls, and per-edge visibility remain explicit follow-up work.

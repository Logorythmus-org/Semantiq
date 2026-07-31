# Question Semantic Security

## Current Boundary

- Writes and history require the Question creator.
- Actor identity is accepted only from `x-actor-id`; body identity fields are ignored.
- Current semantic reads follow the existing public Question read policy.
- Archived state blocks writes but does not erase accepted semantic history.
- PostgreSQL foreign keys retain structures, and semantic current rows cannot be deleted.
- Revision rows are append-only.
- Request bodies are limited by the API's 64 KiB JSON boundary.
- Logs and outbox payloads exclude semantic text, reasons, and idempotency keys.

## Deployment Blockers

`x-actor-id` is trusted local context, not authentication. Authentication must supply actor identity before deployment. A visibility model must filter Questions, semantic structures, graph nodes, and graph edges consistently before non-public Questions are introduced.

Retention, legal erasure, moderation, abuse controls, field-level authorization, encryption policy, and consumer authorization are unresolved. The no-delete database policy must be revisited through an explicit governance and migration decision if erasure becomes required.

## Threat Notes

Semantic fields may contain private premises, constraints, or perspectives even when Question text appears harmless. Downstream events expose only identity and version, and consumers must not infer permission from event delivery.

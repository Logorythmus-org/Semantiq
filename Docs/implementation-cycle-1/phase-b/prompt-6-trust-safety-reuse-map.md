# Prompt 6 Trust and Safety Reuse Map

- KEEP: Question aggregate, creator policy, revisions, lifecycle events, relations, semantic structures, discovery contracts, PostgreSQL UoW, outbox, hashed idempotency, correlation, API envelope, redacted logging, Docker health.
- ADAPT: shared `Clock`, domain event shape, result/error mapping, repository/UoW patterns, partial unique-index patterns.
- WRAP: actor configuration with `QuestionSafetyCapabilityPolicy`.
- DEPRECATE: legacy Question moderation/flag model for this runtime.
- DEFER_TO_AUTH: durable actor/capability registry and full RBAC.
- DEFER_TO_SEMANTIQ: semantic quality, truth, confidence, and ranking judgments.
- DEFER_TO_PUBLIC_ALPHA: appeals, account sanctions, distributed abuse controls, legal/redaction workflows.

# Prompt 6 Schema Migration

Migration `7 question_trust_safety` adds source references, reports, moderation states/cases/actions, audit records, partial uniqueness indexes, query indexes, append-only triggers, and the outbox audit projection trigger.

Upgrade tests from heads 2, 3, and 4 pass at head 7. Existing Questions, revisions, relations, semantic structures/Frame data, generated search text, outbox, and idempotency survive. Rollback is restore-from-backup plus application rollback; destructive down-migration is intentionally absent because records are historical.

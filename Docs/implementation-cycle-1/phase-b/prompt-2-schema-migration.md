# Phase B Prompt 2 Schema Migration

## Migration

Migration head advances from `2/questions` to `3/question_lifecycle_revisions`.

Migration 3 replaces the Prompt 1 status check with `published | archived` and creates `question_revisions` with a primary key, foreign key to `questions` using `ON DELETE RESTRICT`, version/text/status/change/actor/time/reason/correlation constraints, and `UNIQUE(question_id, version)`. A trigger rejects revision UPDATE and DELETE.

## Compatibility

The migration is additive except for widening the status constraint. Existing `published`, version-1 rows remain unchanged and no synthetic history is invented. An isolated test applied migrations 1 and 2, inserted a Persian historical Question, applied migration 3, and verified text/status/version survival plus one migration head.

## Rollback Policy

The migration system is forward-only. Rollback means restoring the isolated pre-migration database and reverting the Prompt 2 code batch; migration 2 is not edited destructively. Removing migration 3 after archived rows or revisions exist would lose valid state and is therefore not an automated downgrade.

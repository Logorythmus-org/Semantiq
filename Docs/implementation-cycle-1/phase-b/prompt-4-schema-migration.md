# Prompt 4 Schema and Migration Report

## Migration

Migration `5/question_semantic_structures` is additive. It creates:

- `question_semantic_structures`: one current validated JSONB snapshot per Question.
- `question_semantic_revisions`: immutable full before/after snapshots from semantic version 2 onward.
- `is_valid_question_semantic_list`: bounded string-array validation.
- `is_valid_question_semantic_structure`: exact shape, uncertainty, scope, duplicate, and total-bound validation.
- no-delete and immutable-revision triggers.

Foreign keys use `ON DELETE RESTRICT`. Current rows carry creator/update attribution, timestamps, and semantic version. No search index is added because Prompt 4 has no semantic query workload.

## Upgrade Validation

An isolated schema was migrated to head 4, seeded with two Questions and one relation, and upgraded to head 5. Questions and the relation survived unchanged, no synthetic semantic structure was invented, and one migration head remained.

## Fresh Validation

Fresh migration, check constraints, missing-Question foreign key, current-row retention, revision immutability, concurrent create/update, and application restore all passed against PostgreSQL 16.

## Rollback

Migrations remain forward-only. The code can be rolled back while leaving unused additive tables in place. Destructive table/function removal requires an explicit later migration and verified backup; it is not part of operational rollback.

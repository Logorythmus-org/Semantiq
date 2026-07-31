# Phase B Prompt 5 Schema Migration

Status: Passed.

## Migration

Migration `6/question_discovery` upgrades head 5 in one migration transaction:

1. installs local `pg_trgm` in `public`
2. creates immutable `normalize_question_search_text(text)`
3. adds stored generated `questions.search_text`
4. adds/backfills `question_semantic_structures.question_version_at_last_update`
5. makes the baseline non-null and adds positive-version validation
6. creates discovery, trigram, uncertainty, and relation covering indexes

The generated column preserves original text and updates atomically with every Question text mutation. Existing semantic rows are backfilled from the current Question version, which is the only deterministic baseline available for pre-Prompt-5 rows.

## Compatibility Verification

A real PostgreSQL head-5 fixture containing Questions, immutable Question revisions, relations, semantic current/revision rows, outbox events, and idempotency records upgraded to head 6. Counts/content survived, the search function normalized Persian variants, and all Prompt 1-4 tests passed. Reapplying migration discovery is idempotent through the migration ledger.

## Rollback

The repository has forward-only migrations, so production-style down migration was not invented. For this local sprint: stop the API, restore the isolated pre-head-6 database/volume, revert only Prompt 5 code, and rerun Prompt 1-4 regression tests. A manual reverse operation must drop Prompt 5 indexes, generated column, freshness constraint/column, function, and only then `pg_trgm` if no other dependency exists. Transactional Question, revision, relation, and semantic tables must not be rewritten.

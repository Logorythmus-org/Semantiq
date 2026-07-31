# Question Concurrency

Question aggregate version, event schema version, API version, and migration version are distinct.

Every mutation requires `expectedVersion`. The aggregate rejects an already stale value, and PostgreSQL performs `UPDATE ... WHERE id = $1 AND version = $expected`. A zero-row update returns `question_version_conflict`; no last-write-wins fallback exists.

Real PostgreSQL tests run competing updates from version 1. Exactly one reaches version 2 and exactly one revision/outbox event commits. The loser rolls back. Revision version always equals the resulting aggregate version.

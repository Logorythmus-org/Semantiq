# Question Revisions

`QuestionRevision` is an immutable snapshot-delta record for each successful mutation. It stores revision ID, Question ID, resulting aggregate version, previous/new text, previous/new status, change type, actor, timestamp, optional bounded reason, and correlation ID.

Revisions begin at aggregate version 2, are unique by `(question_id, version)`, and are returned in ascending version order. PostgreSQL uses a foreign key with `ON DELETE RESTRICT` and a trigger that rejects revision UPDATE or DELETE. No baseline revision is synthesized for existing version-1 Questions.

History is append-only. Prompt 2 implements no pruning, compaction, retention, redaction, or legal deletion workflow.

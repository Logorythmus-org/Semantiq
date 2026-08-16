# Question Lifecycle

The active Prompt 1 state remains `published`; Prompt 2 adds `archived`.

Allowed transitions:

- `published -> archived` through `ArchiveQuestionCommand`.
- `archived -> published` through `RestoreQuestionCommand`.
- `published -> published` only for a text update.

An archived Question cannot be edited. Repeated archive/restore without an idempotent replay returns `question_already_archived` or `question_already_active`. No permanent deletion, moderation workflow, visibility model, or graph state is implemented.

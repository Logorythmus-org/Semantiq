# Question Mutability Policy

Implemented in Phase B Prompt 2.

Immutable fields are `id`, `creatorId`, `createdAt`, `language`, and `source`. Prompt 2 permits only `text`, `status`, `updatedAt`, and `version` to change through aggregate methods. Clients cannot set IDs, actors, timestamps, status, or versions directly.

Every successful mutation increments version exactly once, creates one immutable revision, and creates one compact outbox event in the same transaction. Same-normalized-text updates return `question_no_change`. Permanent deletion, creator reassignment, and history rewriting are forbidden.

Future mutability for context, tags, visibility, moderation, or semantic metadata is deferred to its owning runtime.

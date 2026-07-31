# Question Mutations

Update, archive, and restore use explicit commands and a shared mutation handler. The flow is: validate input and idempotency, begin UoW, load Question, enforce creator/version/lifecycle policy, create revision and event, compare-and-swap Question, insert revision/outbox/idempotency result, and commit once.

Any failure rolls back all staged state. Mutation fingerprints include operation, Question ID, expected version, actor, normalized reason, and normalized text for updates. Correlation and causation are infrastructure context and do not change logical idempotency.

Structured logs contain operation, IDs, versions, status, correlation, duration, and result. They exclude text, reason, idempotency keys, and raw database errors.

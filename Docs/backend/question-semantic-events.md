# Question Semantic Events

## Event Types

- `question.semantic_structure.created`
- `question.semantic_structure.updated`

Both events use schema version 1 and the existing domain-event/outbox envelope.

```json
{
  "questionId": "question-id",
  "semanticVersion": 2,
  "changedBy": "actor-id"
}
```

Semantic statements, uncertainty rationale, scope, perspectives, open possibilities, mutation reasons, and idempotency keys are deliberately excluded. Events commit in the same PostgreSQL transaction as current state, revision, and idempotency data.

Future consumers must treat `semanticVersion` as the ordering contract and fetch authorized authoritative state or a future projection. Event receipt alone is not permission to read semantic content.

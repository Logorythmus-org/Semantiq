# Question Events

Implemented event contracts:

| Event type                            | Schema | Payload                                                 |
| ------------------------------------- | ------ | ------------------------------------------------------- |
| `question.created`                    | 1      | Question ID, status, language, source, optional creator |
| `question.updated`                    | 1      | Question ID, revision ID, aggregate version, actor      |
| `question.archived`                   | 1      | Question ID, revision ID, aggregate version, actor      |
| `question.restored`                   | 1      | Question ID, revision ID, aggregate version, actor      |
| `question.relation.created`           | 1      | Relation ID, endpoint IDs, relation type, actor         |
| `question.relation.removed`           | 1      | Relation ID, endpoint IDs, type, actor, version         |
| `question.semantic_structure.created` | 1      | Question ID, semantic version, actor                    |
| `question.semantic_structure.updated` | 1      | Question ID, semantic version, actor                    |

All events include event ID, aggregate ID, occurrence time, correlation metadata, and optional causation metadata. Mutation events deliberately exclude current and historical text, reason, secrets, and idempotency keys. They are inserted into `outbox_events` in the same transaction as Question and revision state.

Relation creation/removal is atomic with its relation row and optional idempotency record. Future event schemas must add a new schema version rather than silently changing version 1 semantics.

Semantic events are atomic with current semantic state, immutable semantic revision when applicable, and optional idempotency state. They exclude all semantic statements and mutation reasons.

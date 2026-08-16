# Question Relation API

## Create

`POST /api/v1/questions/{sourceQuestionId}/relations`

```json
{
  "targetQuestionId": "question-id",
  "type": "refines"
}
```

`target_question_id` is accepted as a compatibility spelling. Actor identity comes only from `x-actor-id`; body identity fields are ignored. `Idempotency-Key`, `x-correlation-id`, and optional `x-causation-id` use the existing bounded header contracts. Success returns 201 and the relation view. An exact idempotent replay returns the original relation and 201.

## List

`GET /api/v1/questions/{questionId}/relations`

Query parameters:

- `direction`: `outgoing`, `incoming`, or `both` (default).
- `type`: repeatable exact type filter.
- `types`: comma-separated compatibility filter.
- `page`: positive integer, default 1.
- `limit`: 1 through 100, default 25.

The response contains `items`, pagination metadata, and the normalized filters.

## Remove

`DELETE /api/v1/questions/{questionId}/relations/{relationId}` with `{ "expectedVersion": 1 }`. Only the relation creator may remove it. Success returns the removed view at version 2; active list/graph reads exclude it. Optional idempotency headers use the same replay contract as creation.

## Graph

`GET /api/v1/questions/{questionId}/graph`

Query parameters are `direction`, `type`/`types`, `depth` (1 through 3), and `maxNodes`/`max_nodes` (1 through 100). The response contains `rootQuestionId`, nodes, relations, bounds, and `truncated`.

## Errors

Stable relation errors include `source_question_not_found`, `target_question_not_found`, `question_relation_not_found`, `question_relation_self_reference`, `invalid_question_relation_type`, `question_relation_forbidden`, `question_relation_archived_endpoint`, `question_relation_exists`, `question_relation_removed`, `question_relation_version_conflict`, `idempotency_conflict`, `validation_error`, and sanitized `persistence_error`.

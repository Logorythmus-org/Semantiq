# Question Relations

The authoritative relation implementation is in `packages/questions/src/relations-*`. A relation is a separately versioned aggregate whose assertion data is immutable and whose lifecycle can move once from active to removed.

## Shape

| Field              | Meaning                              |
| ------------------ | ------------------------------------ |
| `id`               | Stable relation identity             |
| `sourceQuestionId` | Source endpoint                      |
| `targetQuestionId` | Target endpoint                      |
| `type`             | One Prompt 3 relation type           |
| `directionality`   | Derived as `directed` or `symmetric` |
| `createdBy`        | Actor who asserted the relation      |
| `createdAt`        | Immutable creation time              |
| `status`           | `active` or `removed`                |
| `removedBy/At`     | Present only after logical removal   |
| `version`          | `1` active; `2` removed              |

## Taxonomy

Directed types describe source relative to target: `emerges_from`, `refines`, `challenges`, `depends_on`, `broadens`, `narrows`, and `follow_up`.

Symmetric types are `contradicts`, `alternative_to`, and `connects`. They may be traversed from either endpoint regardless of stored orientation.

`A narrows B` is the semantic inverse of `B broadens A`; only one may exist. Reversed symmetric duplicates are also rejected. Different types between the same Questions are allowed.

## Invariants

- Source and target must exist and differ.
- Both endpoints must be `published` when the edge is created.
- Only the source Question creator may create the edge.
- Relation creation does not mutate either Question or increment Question versions.
- Existing relations remain navigable after later endpoint archive.
- Removal is creator-only, expected-version protected, idempotent when keyed, and excluded from active list/graph reads.
- Physical delete and assertion-field mutation are blocked; foreign keys use `ON DELETE RESTRICT`.

Confidence, evidence, explanations, AI suggestions, physical deletion, supersession, and moderation are not part of the relation aggregate.

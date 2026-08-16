# Question API

Prompt 6 adds `POST/GET /questions/{id}/sources`, logical source removal, `POST/GET /questions/{id}/reports`, report withdrawal, case opening, moderation actions, internal audit reads, and trust-signal reads. Actor identity is taken from `x-actor-id`; body identity is ignored. Restricted public exact reads return 404.

Canonical endpoints:

| Method and path                                           | Result                                     |
| --------------------------------------------------------- | ------------------------------------------ |
| `POST /api/v1/questions`                                  | Create Question, 201                       |
| `GET /api/v1/questions`                                   | Discovery list/search, 200                 |
| `GET /api/v1/questions/{id}`                              | Current state, 200                         |
| `GET /api/v1/questions/{id}/detail`                       | Bounded discovery detail, 200              |
| `PATCH /api/v1/questions/{id}`                            | Update text, 200                           |
| `POST /api/v1/questions/{id}/archive`                     | Archive, 200                               |
| `POST /api/v1/questions/{id}/restore`                     | Restore, 200                               |
| `GET /api/v1/questions/{id}/revisions`                    | Creator-only history, 200                  |
| `POST /api/v1/questions/{id}/relations`                   | Create relation, 201                       |
| `GET /api/v1/questions/{id}/relations`                    | Paginated adjacency, 200                   |
| `GET /api/v1/questions/{id}/graph`                        | Bounded graph view, 200                    |
| `PUT /api/v1/questions/{id}/semantic-structure`           | Create/replace semantic structure, 201/200 |
| `GET /api/v1/questions/{id}/semantic-structure`           | Current semantic structure, 200            |
| `GET /api/v1/questions/{id}/semantic-structure/revisions` | Creator-only semantic history, 200         |

Mutation bodies use `expectedVersion` (the compatibility spelling `expected_version` is accepted), optional `reason`, and `text` for PATCH. Actor comes only from trusted `x-actor-id` request context. `Idempotency-Key`, `x-correlation-id`, and optional `x-causation-id` are bounded headers.

Stable mutation errors include `invalid_expected_version`, `question_not_found`, `question_mutation_forbidden`, `question_version_conflict`, `question_archived`, `question_already_archived`, `question_already_active`, `question_no_change`, `idempotency_conflict`, and sanitized `persistence_error`.

Relation request, filter, traversal, and error contracts are documented in `question-relation-api.md`.

Semantic structure shape, independent versioning, aliases, and errors are documented in `question-semantic-api.md`.

Discovery query parameters, pagination envelopes, filtering semantics, validation errors, and privacy behavior are documented in `question-discovery-api.md`. Collection reads are active-only by default, use cursor pagination, and never return full revision, graph, or semantic histories.

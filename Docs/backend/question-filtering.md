# Question Filtering

Question discovery accepts only named filters and composes supplied filters with logical AND.

| Filter                            | Behavior                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| `status`                          | `active` (default), `archived`, or `all`                     |
| `creator_id`                      | exact existing actor identifier                              |
| `created_after`, `created_before` | inclusive ISO 8601 bounds with timezone                      |
| `updated_after`, `updated_before` | inclusive ISO 8601 bounds with timezone                      |
| `language`                        | exact stored language tag; no inference                      |
| `has_frame`                       | semantic structure exists/does not exist                     |
| `frame_stale`                     | existing Frame is stale/current                              |
| `has_assumptions`                 | assumptions array non-empty/empty                            |
| `has_unknowns`                    | unknowns array non-empty/empty                               |
| `uncertainty_type`                | exact Prompt 4 level: `unspecified`, `low`, `medium`, `high` |
| `relation_type`                   | participates in at least one relation of that type           |
| `relation_direction`              | `incoming`, `outgoing`, or `both` (default)                  |
| `related_to_question_id`          | directly connected one-hop neighbor                          |

For symmetric relation types, incoming/outgoing views preserve Prompt 3's symmetric semantics. Prompt 3 relations have no removal/status lifecycle; every persisted relation is therefore currently active.

`frame_stale=true` means a Frame exists and `question.version > question_version_at_last_update`. `false` means a Frame exists and the versions are equal. Questions without a Frame require `has_frame=false`.

`constraint_type` is not functional because the authoritative Prompt 4 model has no constraint type field or vocabulary. It is rejected explicitly instead of searching statement text or inventing a taxonomy.

Arbitrary fields, repeated parameters, SQL expressions, OR groups, fuzzy creator lookup, language inference, and unbounded graph predicates are rejected or unsupported.

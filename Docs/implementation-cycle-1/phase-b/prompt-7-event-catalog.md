# Prompt 7 Event Catalog

All events are schema version 1, correlated, compact, and persisted through the transactional outbox.

| Aggregate  | Events                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| Question   | `question.created`, `question.updated`, `question.archived`, `question.restored`                             |
| Relation   | `question.relation.created`, `question.relation.removed`                                                     |
| Frame      | `question.semantic_structure.created`, `question.semantic_structure.updated`                                 |
| Source     | `question.source.added`, `question.source.removed`                                                           |
| Report     | `question.report.submitted`, `question.report.withdrawn`                                                     |
| Moderation | `question.moderation.case.opened`, `question.moderation.action.applied`, `question.moderation.case.resolved` |

Events contain identifiers, classifications, versions, actors, and correlation metadata; they do not contain Question/Frame/report text.

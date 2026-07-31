# Prompt 4 Reuse Map

| Existing component                      | Prompt 4 reuse                                             |
| --------------------------------------- | ---------------------------------------------------------- |
| `Question`                              | Existence, creator ownership, and archived-state authority |
| `QuestionRuntimeError`                  | Stable validation/domain/conflict/not-found/forbidden map  |
| `MutationReason`                        | Optional normalized 500-character update reason            |
| `createEvent` and domain event envelope | Schema-versioned correlation/causation metadata            |
| `Result`, `failure`, and `success`      | Application boundary without thrown domain errors          |
| Clock and ID abstractions               | Deterministic timestamps and semantic revision IDs         |
| Memory repository/UoW snapshot pattern  | Contract tests, idempotency, and rollback injection        |
| PostgreSQL repository/UoW pattern       | Transaction boundaries, read isolation, and outbox         |
| `idempotency_records`                   | Scope `question.semantic_structure.put`                    |
| API envelope and status mapping         | Stable `/api/v1` responses                                 |
| Question security/logging conventions   | Header actor and redacted structured logs                  |

No historical semantic aggregate or AI detector was imported. The small amount of adapter repetition follows the established bounded runtime pattern and keeps semantic response types separate from Question and relation idempotency records.

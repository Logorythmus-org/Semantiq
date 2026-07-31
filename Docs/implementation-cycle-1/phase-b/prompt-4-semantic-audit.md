# Prompt 4 Semantic Model Audit

## Active Sources

| Source                        | Useful contract                                  | Decision            |
| ----------------------------- | ------------------------------------------------ | ------------------- |
| `packages/questions`          | Question ownership, lifecycle, errors, revisions | Reused              |
| `packages/persistence`        | PostgreSQL UoW, migrations, outbox, idempotency  | Reused              |
| `services/api`                | Versioned envelopes, actor/correlation headers   | Extended            |
| Prompt 3 relation/graph model | Independent aggregate/version precedent          | Preserved unchanged |

## Historical or Separate Models

| Source                           | Relevant concepts                               | Reason not imported                                   |
| -------------------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| `packages/question-network`      | Legacy `QuestionProfile`, assumptions, unknowns | Incompatible historical Question identity/lifecycle   |
| `packages/core`                  | Assumption arrays and numeric uncertainty       | Old aggregate and implicit score                      |
| `packages/question-intelligence` | Assumption detection and refinements            | Advisory inference runtime outside transactional core |
| `packages/scientific-atlas`      | Research uncertainty profiles                   | Research/Atlas ownership boundary                     |
| Semantiq and sprint runtimes     | Evaluation, quality, recommendation             | Consumers, not Question Runtime authority             |

## Gap Found

The authoritative Question Runtime had no explicit semantic state, version, revision, persistence, event, or API contract. Existing semantic concepts were prototypes or separate runtimes and could not be safely reused as executable domain code.

## Result

Prompt 4 adds only explicit accepted structure. It does not generate a living profile, duplicate relation data, store scores, or infer truth.

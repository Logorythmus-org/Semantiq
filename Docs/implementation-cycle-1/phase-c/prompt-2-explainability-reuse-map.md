# Phase C Prompt 2 Explainability Reuse Map

## Status

Audit-only map. No migration or replacement was performed.

| Artifact                                            | Classification             | Prompt 2 use                                                       |
| --------------------------------------------------- | -------------------------- | ------------------------------------------------------------------ |
| Question semantic snapshot schema `1.0`             | KEEP                       | Future input contract after Prompt 1 provider/access policy exists |
| Stable snapshot component IDs                       | KEEP                       | Future observation source references                               |
| Shared `Result` and application error primitives    | KEEP                       | Future command/query error envelope                                |
| PostgreSQL unit-of-work/outbox/idempotency patterns | ADAPT                      | Future Semantiq-owned transaction adapter                          |
| Question safety access checks                       | WRAP                       | Future authorized snapshot provider; do not duplicate policy       |
| `packages/semantiq` broad benchmark contracts       | DEPRECATE                  | Do not use as Question structural evaluation history               |
| `LocalSemantiqEngine`                               | DEFER_TO_BENCHMARK_RUNTIME | No reuse in Prompt 2 evaluation path                               |
| `ExplainableSemantiqRuntime`                        | DEFER_TO_BENCHMARK_RUNTIME | No reuse in Prompt 2 evaluation path                               |
| `services/semantiq` descriptor                      | EXPERIMENTAL               | Replace or adapt only after Prompt 1 establishes API composition   |
| Sprint 2 Semantiq implementation                    | DEFER_TO_BENCHMARK_RUNTIME | Preserve unrelated consumers; no silent migration                  |
| Workflow rule/condition models                      | DEFER                      | Different bounded context and execution semantics                  |
| Identity benchmark/reputation concepts              | DEFER                      | User scoring remains forbidden                                     |
| Alpha Semantiq feedback                             | DEFER_TO_BENCHMARK_RUNTIME | Prompt 3/human agreement concern, not Prompt 2                     |

## Blocking Decision

No Prompt 2 profile may be named `question_structural_v2` until the exact `question_structural_v1` manifest, evaluator version, payload schema, fixtures, and persisted read contract exist. No legacy artifact is a safe substitute.

# Phase C Prompt 3 Benchmark Reuse Map

## Status

Audit-only map. No benchmark semantics, fixtures, profiles, or comparisons were implemented.

| Original path                            | New role                                     | Changes required                                                                   | Validity concern                             | Decision                       |
| ---------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------ |
| `Docs/backend/benchmark-harness.md`      | Execution isolation policy                   | Add suite/profile allowlisting after Prompt 2                                      | No current runner                            | KEEP                           |
| `Docs/backend/test-fixtures.md`          | Fixture construction policy                  | Add canonical schema/fingerprint rules                                             | No benchmark schema                          | KEEP                           |
| `Docs/backend/database-seeding.md`       | Data separation/reset policy                 | Add benchmark DB guard after persistence exists                                    | No implementation                            | KEEP                           |
| `packages/benchmark/src/index.ts`        | Possible benchmark bounded-context namespace | Replace minimal contracts with versioned models after Prompt 2                     | Generic legacy semantics                     | ADAPT                          |
| `scripts/techclub.mjs` benchmark command | Future local CLI entry                       | Resolve built-in suites only; reject paths/dynamic evaluators                      | Current recursive command is not a runner    | WRAP                           |
| `specs/010-semantiq-benchmark-engine.md` | Historical architecture input                | Narrow to Question structural behavior                                             | Universal scoring and recommendations        | EXPERIMENTAL                   |
| `Docs/SMF_Benchmark_Testhandbuch.pdf`    | Model-benchmark research reference           | Requires provenance, evaluator-specific expectations, and separate bounded context | Not Question structural data                 | DEFER_TO_MODEL_BENCHMARKING    |
| `Docs/SemantIQ-Benchmarks.pdf`           | Historical product concept                   | No direct reuse                                                                    | Illustrative rankings and unsupported claims | DEFER_TO_MODEL_BENCHMARKING    |
| `packages/alpha-operations` feedback     | Future research input                        | Versioned rubric, consent, anonymization, scale mapping                            | Agreement is not correctness                 | DEFER_TO_HUMAN_EVALUATION_UI   |
| Legacy Semantiq/Sprint 2 engines         | Compatibility inventory only                 | Keep consumers isolated; never map scores silently                                 | Non-deterministic and incompatible profiles  | DEPRECATE for structural suite |

## Required Compatibility Layer

Future benchmark code must depend on the completed Prompt 2 evaluation application through an explicit evaluator contract. It must not import legacy model scoring, mutate production evaluations, or infer comparability from matching dimension names.

## Tests Required After Recovery

- Manifest and fixture fingerprint determinism.
- Profile/evaluator compatibility rejection.
- Expectation result versus execution error distinction.
- Golden, behavioral, metamorphic, and multilingual cases.
- Distribution and coverage diagnostics with explicit sample size.
- Human-scale mapping and disagreement reporting without truth claims.
- Path traversal, fixture size, arbitrary profile, and network denial tests.

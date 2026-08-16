# Phase C Prompt 3 Benchmark Audit

## Status

**Partially Passed.** Repository-wide source, documentation, and PDF asset discovery completed. Benchmark implementation was prohibited by the Prompt 2 NO-GO.

## Relevant Assets

| Path                                     | Purpose/format                                | Determinism and coverage                               | Validity/privacy risk                                                     | Decision                                      |
| ---------------------------------------- | --------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------- |
| `packages/benchmark/src/index.ts`        | Two minimal TypeScript interfaces             | No runner, versions, tests, persistence, or statistics | Semantics too weak; generic names may collide                             | ADAPT after Prompt 2                          |
| `packages/semantiq`                      | Broad in-memory benchmark engine              | Random/time IDs and content-length heuristics          | Unsupported quality claims and recommendations                            | DEFER_TO_MODEL_BENCHMARKING                   |
| `services/benchmark`                     | Service health scaffold                       | No executable benchmark behavior                       | Can be mistaken for implemented service                                   | EXPERIMENTAL                                  |
| `apps/benchmark`                         | Dashboard placeholder                         | No implementation                                      | Frontend is forbidden in this sprint                                      | DEFER_TO_PUBLIC_LEADERBOARD                   |
| `specs/010-semantiq-benchmark-engine.md` | Architecture specification                    | No fixtures or executable assertions                   | Broad universal-score scope                                               | EXPERIMENTAL                                  |
| `Docs/BENCHMARK_PIPELINE.md`             | Pipeline outline                              | Versioning principle only                              | Includes recommendations/model-oriented stages                            | KEEP as historical architecture               |
| `Docs/EVALUATION_DIMENSIONS.md`          | Broad dimension list                          | No operational rubric                                  | Dimensions differ from structural profile                                 | DEFER_TO_MODEL_BENCHMARKING                   |
| `Docs/backend/benchmark-harness.md`      | Explicit-command isolation policy             | Deterministic dataset requirement                      | No implementation                                                         | KEEP                                          |
| `Docs/backend/test-fixtures.md`          | Synthetic fixture policy                      | Fixed clock/injection guidance                         | No dataset                                                                | KEEP                                          |
| `Docs/SemantIQ-Benchmarks.pdf`           | 297-page German model-benchmark concept       | Illustrative model scores; no reproducible evaluator   | Leaderboard, model ranking, false-certainty, and scientific-validity risk | DEFER_TO_MODEL_BENCHMARKING                   |
| `Docs/SMF_Benchmark_Testhandbuch.pdf`    | 12-page German handbook with 84 model prompts | Prompt list only; no expected behavior or labels       | Model evaluation, self-reasoning prompts, no provenance/version contract  | DEFER_TO_MODEL_BENCHMARKING                   |
| `packages/alpha-operations`              | Semantiq user feedback record                 | In-memory, one alpha schema string                     | No rubric version, scale mapping, or anonymous-subject contract           | DEFER_TO_HUMAN_EVALUATION_UI                  |
| `packages/sprint2-runtime`               | Legacy evaluation/history/comparison          | Tested within legacy journey                           | Different evaluator semantics and mutable in-memory history               | DEPRECATE for Phase C structural benchmarking |
| `packages/agent-runtime`                 | Consumes legacy Semantiq benchmark            | Existing integration test                              | Agent evaluation is forbidden scope                                       | DEFER_TO_MODEL_BENCHMARKING                   |
| `scripts/techclub.mjs`                   | Generic recursive benchmark command           | Delegates to package scripts                           | No suite/profile safety or fixture loader                                 | WRAP later                                    |
| `Docs/backend/database-seeding.md`       | Benchmark-data isolation guidance             | Explicit synthetic/guarded reset policy                | None                                                                      | KEEP                                          |

## Dataset Findings

- No JSON, CSV, or database fixture set implements `semantiq-benchmark-fixture/v1`.
- No golden expected observations, rules, scores, limitations, or explanation codes exist.
- No multilingual Question structural benchmark corpus exists.
- No calibration dataset, distribution baseline, or versioned human rubric exists.
- The 84-prompt handbook is a model-response prompt catalog, not a Question snapshot fixture set.
- The 297-page concept document contains illustrative model comparison values that are not measured evidence.

## Scientific Integrity

Existing model-ranking concepts must not be imported into a Question evaluator. They do not define sampling, annotators, expected-behavior provenance, uncertainty, repeatability, or statistical tests. Phrases implying absolute safety, legal certainty, intelligence essence, or model maturity are claims, not validated benchmark evidence.

## Security and Privacy

No unsafe fixture loader or external benchmark service exists today. Future work must keep path allowlists, size bounds, synthetic fixtures, explicit profile/evaluator registries, and no network access. Existing PDF assets contain no production Question records discovered in this audit.

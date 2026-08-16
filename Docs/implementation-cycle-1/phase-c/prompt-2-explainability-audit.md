# Phase C Prompt 2 Explainability Audit

## Status

**Partially passed.** Repository discovery completed. Prompt 1 explainability cannot be audited because it is absent.

## Relevant Artifacts

| Path                                             | Purpose and behavior                                           | Determinism/versioning                         | Risk                                                     | Decision                                 |
| ------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `packages/semantiq/src/contracts.ts`             | Broad benchmark, score, stage, recommendation, and event types | Version fields exist but no immutable registry | Opaque broad scoring vocabulary; not Prompt 1            | DEPRECATE for Question evaluation        |
| `packages/semantiq/src/index.ts`                 | In-memory benchmark engine                                     | Timestamp/random IDs; content-volume scores    | Non-reproducible IDs and unsupported semantics           | DEFER_TO_BENCHMARK_RUNTIME               |
| `packages/semantiq/src/runtime.ts`               | Heuristic concept extraction and scoring                       | Timestamp/random IDs; fixed prose              | Recommendations and language-biased token extraction     | DEFER_TO_BENCHMARK_RUNTIME               |
| `services/semantiq/src/index.ts`                 | Static route descriptor                                        | No runtime, persistence, or tests              | Could be mistaken for implemented API                    | EXPERIMENTAL                             |
| `packages/sprint2-runtime/src/index.ts`          | Older integrated Semantiq report flow                          | Separate version model and tests               | Different ownership and historical semantics             | WRAP only after Prompt 1 boundary exists |
| `packages/questions/src/semantic-contracts.ts`   | Authoritative Question snapshot schema `1.0`                   | Typed, bounded, deterministic content IDs      | Trusted actor boundary inherited from Phase B            | KEEP                                     |
| `packages/questions/src/semantic-application.ts` | Snapshot construction                                          | Stable component IDs and strict allowlist      | Generated timestamp excluded from content identity       | KEEP                                     |
| `packages/workflow-engine`                       | Workflow conditions and semantic-rule descriptors              | Workflow-owned                                 | Executing these as evaluation rules would cross contexts | DEFER                                    |
| `packages/identity`                              | Policy conditions and benchmark references                     | Identity-owned                                 | User/identity scoring is forbidden here                  | DEFER                                    |
| `packages/alpha-operations`                      | Product observations and Semantiq feedback                     | Alpha operations only                          | Human/user feedback is outside Prompt 2                  | DEFER_TO_BENCHMARK_RUNTIME               |

## Findings

1. No explicit observation extractor, rule registry, composition policy, evidence graph, structured trace, or explanation-template registry exists for the required Question evaluation.
2. Existing Semantiq engines combine extraction, scoring, prose generation, recommendations, and storage in monolithic methods.
3. Existing content tokenization is English-oriented and cannot support Prompt 1's claimed multilingual deterministic baseline.
4. Existing IDs use `Date.now()` and `Math.random()`, preventing reproducible graph identifiers and manifests.
5. Existing score formulas infer quality from serialized content length. They must not be promoted into the required structural profile.
6. No persistence, audit, outbox, idempotency, access control, or transaction integration exists for Semantiq evaluations.
7. No chain-of-thought storage was found. The legacy explanation strings are result prose, not a structured explainability trace.

## Security and Privacy

The legacy package serializes complete subject content for analysis and can duplicate concepts into reports. It has no bounded observation contract or moderation-aware snapshot provider. It is therefore unsuitable for authorized explainability APIs without the Prompt 1 boundary.

# S-02 benchmark registry and lifecycle

Decision: **S02_BENCHMARK_REGISTRY_IMPLEMENTED**. This gate establishes a canonical benchmark identity and lifecycle layer. It does not validate a scientific measure, promote a benchmark to Core, or change benchmark execution behavior.

## Baseline

S-02 starts from protected `main` at merge commit `6068c78bf8c47cc7199368722b4f3058a27e3a04`, tree `28ae6bbd0689889433b04e05b99d2f4f5354532b`. That merge contains PR #55 final head `06728ac50afdab01dafbb5074f8500d2f9e1dd25`. Post-merge CI and documentation workflows passed on the merge commit.

## Architecture

The canonical source is the typed `CANONICAL_BENCHMARK_REGISTRY` in `packages/benchmark/src/registry-definitions.ts`. The registry engine in `packages/benchmark/src/registry.ts` validates this source and provides exact identity lookup, alias resolution, lifecycle transitions, separate scientific promotion, maturity derivation, canonical serialization and a digest. No generated JSON copy is checked in, so there are not two independently editable registry sources.

The existing product `Benchmark` contract remains unchanged. It describes execution-facing benchmark data; the S-02 registry describes durable identity, meaning, provenance and maturity. Dataset snapshots and case studies remain in the Evidence package and can be referenced by registry provenance. Existing producers, CLI, HTTP API, SDKs and scoring paths do not consume the new registry in this gate.

The canonical relationship is:

`BenchmarkIdentity → Family → Constructs → Provenance → Evaluator requirements → Human roles → Evidence → three status axes`

### Identity and version semantics

A benchmark identity is the pair `benchmarkId + benchmarkVersion`. Display names and aliases are never sufficient identity. Every entry sets `versionScope: BENCHMARK`, keeping the benchmark version independent of SemantIQ software, package, product-contract schema, API, dataset and evaluator versions. A change to cases, scoring interpretation or claimed construct must create a new benchmark version instead of overwriting an old identity.

Supersession uses exact benchmark identities. Validation rejects missing targets, self-supersession and cycles. Retired identities remain resolvable; S-02 provides no deletion operation.

### Three orthogonal axes

Implementation state is one of `CONCEPT_ONLY`, `SPECIFIED`, `SCAFFOLDED`, `EXECUTABLE` or `REPRODUCIBLE`. `EXECUTABLE` requires implementation evidence. `REPRODUCIBLE` additionally requires reproducibility evidence. A callable deterministic function can remain `EXECUTABLE` when clean replay, pinned inputs and tolerance evidence are absent.

Scientific maturity is one of `NOT_ESTABLISHED`, `SYNTHETIC_ONLY`, `UNVALIDATED_PROXY`, `CALIBRATION_REQUIRED`, `CALIBRATED` or `VALIDATED`. `CALIBRATED` requires calibration evidence. `VALIDATED` requires calibration and validation evidence. Software test evidence is stored separately and never changes this axis.

Lifecycle state is one of `DRAFT`, `ACTIVE`, `DEPRECATED` or `RETIRED`. Allowed transitions are `DRAFT → ACTIVE → DEPRECATED → RETIRED`. Reactivation is deferred because it needs a governance rule for whether the same version can return or a successor version is required. Lifecycle transitions preserve scientific maturity.

### Derived maturity ladder

Maturity is computed rather than stored as another mutable field:

| Level | Derived condition |
| --- | --- |
| M0 CONCEPT | `CONCEPT_ONLY` |
| M1 SPECIFIED | `SPECIFIED` or `SCAFFOLDED` |
| M2 EXECUTABLE | `EXECUTABLE` with implementation evidence |
| M3 REPRODUCIBLE | `REPRODUCIBLE` with reproducibility evidence |
| M4 CALIBRATED | `CALIBRATED` with calibration evidence |
| M5 VALIDATED | `VALIDATED` with calibration and validation evidence |
| M6 CORE | `PROMOTED` after M5, with explicit promotion evidence |

The higher scientific levels take precedence in derivation, but registry validation enforces their evidence prerequisites. Core promotion uses a separate operation and cannot result from a passing test suite.

## Provenance and evidence

Benchmark provenance reuses the project research-governance vocabulary for provenance and input-rights classes. It records origin, current or historical source type, repository-relative source references, dataset/case provenance status, rights classification, introduction gate, aliases and supersession. Unknown dataset or rights provenance remains `UNKNOWN` or `UNKNOWN_RIGHTS`; S-02 does not invent missing facts.

Evidence is stored as lightweight repository references grouped by implementation, tests, reproducibility, calibration, validation and promotion. Large payloads stay in their existing artifacts and ledgers. The representative entries contain no calibration, validation or promotion evidence and therefore cannot derive M4, M5 or M6.

## Constructs, evaluators and humans

Construct records state identifiers, names, descriptions and claim strength. The migrated behavior labels are `INTENDED` or `ENGINEERING_PROXY`; none is registered as a scientifically established construct.

Evaluator requirements distinguish nine mechanisms, including deterministic, rule-based, model-judge, SemantIQ evaluator, human judge and hybrid paths. Each declaration is either `SUPPORTED_BY_SCHEMA` or `IMPLEMENTED_AND_BOUND`. A bound evaluator requires an ID and evidence; schema support alone never claims an implementation.

Human participation preserves `HUMAN_AS_JUDGE`, `HUMAN_AS_SUBJECT` and `HUMAN_AI_COMPARISON`. The historical HACS entry declares intended human-as-subject and comparative roles. Neither is marked implemented.

## Representative migration

| S-01 record | Canonical identity | Implementation | Science | Lifecycle | Derived level |
| --- | --- | --- | --- | --- | --- |
| `provider-tck` | `provider_tck@0.1.0` | EXECUTABLE | UNVALIDATED_PROXY | ACTIVE | M2 |
| `long-horizon` | `long_horizon@0.1.0` | EXECUTABLE | UNVALIDATED_PROXY | ACTIVE | M2 |
| `bmk_hacs_evaluation_v1` | `bmk_hacs_agent_resilience`, benchmark version `1.0.0` | SCAFFOLDED | SYNTHETIC_ONLY | ACTIVE | M1 |
| `HACS-HIST` | `historical_hacs_human_ai_comparative@0.1.0` | CONCEPT_ONLY | NOT_ESTABLISHED | DRAFT | M0 |

The current HACS producer retains its legacy IDs as aliases. The historical Human-AI Comparative Semantic Benchmark Standard has a separate identity. Both declare the alias `HACS` with reciprocal `HISTORICAL_NAME_COLLISION` metadata. Alias lookup therefore returns both candidates and requires the caller to choose an exact identity; the registry cannot silently equate them.

The provider TCK is executable engineering conformance, not intelligence measurement. Its S-02 benchmark version `0.1.0` is deliberately separate from the suite's environment-spec version `1.0.0`. The long-horizon evaluator computes heuristics from supplied traces but lacks a complete subject runner and reproducibility dossier. The current HACS producer is synthetic fixed output. Historical HACS remains a research concept. These classifications preserve S-01 findings.

## Validation and lifecycle invariants

Deterministic validation rejects duplicate identities, invalid semantic versions, missing families or constructs, invalid state values, unsupported evaluator and human-role values, incomplete bindings, scientific maturity without evidence, Core promotion without validation and promotion evidence, broken supersession, self-supersession, cycles and silent alias collisions.

Lifecycle and scientific promotion are separate immutable registry operations. Tests explicitly establish that passing software tests do not promote science, executable entries may remain unvalidated, historical concepts cannot be silently mapped to current executables, M5 and M6 require evidence, retirement preserves identity, and benchmark versions remain a distinct version domain.

## Limits and S-03 handoff

S-02 migrates four representative records, not the full S-01 inventory. It does not implement persistence, registry services, automatic source scanning, dataset publication, evaluator execution, calibration studies, scientific validation or Core promotion decisions. The compatibility boundary deliberately leaves current product behavior unchanged.

S-03 can bind measurement definitions to `BenchmarkIdentity` and `constructId`. The registry has extension points for repository evidence and exact versions; S-03 can add metric identity, scale, units, missingness, aggregation, uncertainty, calibration and validity references without replacing benchmark identity or merging the three status axes. Before any M4/M5 transition, S-03 must define evidence formats and calibration/validity acceptance rules.

Cyber work, restricted research, protected dependencies, licensing changes and scientific-validation claims are outside this gate.

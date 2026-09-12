# S-05 Benchmark Reliability Laboratory

**Status**: `ARCHITECTURE`
**Scope**: repeatability, stability, and agreement study contracts
**Baseline**: protected `main` after merged S-04
**Scientific claim**: none

## Purpose and primary boundary

S-05 adds a versioned laboratory for studying whether observations remain consistent under a
declared condition. Its primary invariant is **RELIABILITY != VALIDITY**. Repeatable output may
still measure the wrong construct, and disagreement does not by itself identify which result is
valid. A reliability estimate cannot calibrate or validate a metric, promote a benchmark, certify a
subject, or change any S-02 lifecycle state.

The laboratory keeps three records separate. A `ReliabilityStudyDefinition` prespecifies the
question, target, method, constant dimensions, varied dimensions, evidence, provenance, and
limitations. A `ReliabilityStudyExecution` binds that definition digest to exact S-04 execution
references. A `ReliabilityEstimate` records the method result, complete sample accounting,
exclusions, configuration lineage, assumptions, evidence, provenance, and limits. Study identity is
the pair `reliabilityStudyId + reliabilityStudyVersion`; its version scope is always
`RELIABILITY_STUDY`.

## Targets and dimensions

The schema supports exact targets for `METRIC`, `EVALUATOR`, `EVALUATOR_CONFIGURATION`,
`BENCHMARK_METRIC_BINDING`, and `HUMAN_RATER_SET`. Metric targets resolve to S-03 identities;
evaluator targets resolve to S-04 identities; benchmark bindings preserve exact S-02 benchmark and
construct versions. Human-rater-set support is contractual only until S-06 supplies governed rater
identity, recruitment, assignment, blinding, and review operations.

Every study names dimensions held constant and dimensions deliberately varied. The vocabulary
covers benchmark version/input, metric version, evaluator version/configuration, rubric version,
subject, model provider/snapshot, seed, sampling configuration, environment, time window, and
rater. A dimension cannot occur in both sets. This prevents data collected under materially
different conditions from being silently pooled.

## Method taxonomy

| Method | S-05 status | Input and minimum evidence | Output and limits |
| --- | --- | --- | --- |
| `EXACT_REPEATABILITY` | Implemented | At least two S-04 executions for one exact condition | Pairwise canonical-output equality and exact-match rate; no tolerance |
| `NUMERIC_RUN_TO_RUN_STABILITY` | Implemented | At least two finite numeric S-03 results | n, mean, sample SD, min, max, range |
| `CATEGORICAL_AGREEMENT` | Implemented | At least two comparable categorical decisions | Raw pairwise agreement; no chance correction |
| `ORDINAL_AGREEMENT` | Schema only | Future ordered categories | No ordinal arithmetic or estimator in S-05 |
| `TEST_RETEST` | Schema only | Future declared retest intervals | No estimator in S-05 |
| `JUDGE_TO_JUDGE_AGREEMENT` | Schema only | Future judge comparison design | Raw categorical foundation exists; no dedicated estimator |
| `INTER_RATER_AGREEMENT` | Schema only | Future governed human assignments | Deferred to S-06 operations |
| `INTRA_RATER_AGREEMENT` | Schema only | Future governed repeated rater records | Deferred to S-06 operations |
| `STOCHASTIC_STABILITY` | Implemented | At least two stochastic executions with seed declared varied | Condition-specific exact output stability with seed/config/model lineage |

Each registry method states required input, minimum evidence, assumptions, applicability,
computation, output contract, degenerate cases, missingness handling, and limitations. Vocabulary
support does not imply an estimator exists. Attempting to execute a schema-only method is rejected.

## Implemented estimators

### Exact repeatability

Exact repeatability compares every pair of eligible canonical semantic outputs. Canonicalization
retains the output kind and material result fields. It excludes execution IDs, run/request IDs,
timestamps, result/computation IDs, rationale text, evidence-list ordering, and provenance IDs.
Those fields identify or explain a run but do not change its semantic output. Numeric values use
exact canonical equality; no epsilon or tolerance is applied.

All eligible executions must share evaluator identity/version, configuration digest, subject,
evaluation target, input kind/references, benchmark binding, and metric identity/version. The
estimate records exact matches, eligible pairs, and exact-match rate. For a deterministic evaluator,
an exact match establishes repeatability only for the tested condition.

### Numeric run-to-run stability

Numeric stability accepts complete S-03 `MetricResult` values only. Pooling requires the exact
metric identity/version, scale, unit, evaluation target, and benchmark/construct binding. Ordinal,
categorical, and boolean outputs cannot enter arithmetic. For at least two finite values, the
laboratory reports n, arithmetic mean, sample standard deviation, minimum, maximum, and range. It
does not publish a coefficient of variation where the mean-zero guard and interpretive contract
would be ambiguous, and it creates no universal stability score or `GOOD`/`POOR` threshold.

### Raw categorical agreement

Categorical agreement keeps each S-04 evaluator execution, configuration digest, evaluator
identity, determinism classification, and judge-independence declaration addressable. Decisions
must refer to the same subject, target, input, benchmark, and metric condition. The implementation
counts all unordered eligible pairs and reports agreements and raw agreement. It neither selects a
winner nor erases disagreement. This is a foundation for later judge and human-rater studies, not a
chance-corrected reliability coefficient.

### Stochastic stability

Stochastic stability accepts evaluators classified by S-04 as `SEEDED_STOCHASTIC`, `STOCHASTIC`,
or `EXTERNAL_NONDETERMINISTIC`. The study must declare `SEED` as varied. Seed-valued parameters may
differ while all other material configuration, model, rubric, tool, context, normalization, subject,
input, target, benchmark, and metric fields remain constant. The estimate reports exact semantic
output agreement and preserves every configuration digest. Model snapshots, sampling configuration,
and seeds therefore remain provenance rather than being collapsed into one condition.

## Missingness, exclusions, and pair counts

Every estimate reports candidate, eligible, used, and excluded observation counts. Pairwise methods
also report candidate, eligible, and used pair counts. Failed, abstained, not-applicable, missing,
and unusable partial executions receive explicit exclusion reasons. They are never converted to
zero. Fewer than two eligible observations yields `INSUFFICIENT_EVIDENCE` or `DEGENERATE_SAMPLE`
without fabricating a statistic.

## Canonicalization and lineage

Study definitions are serialized with sorted set-like dimensions, evidence, provenance, and
limitations before SHA-256 hashing. Execution digests bind the study identity and definition digest
to sorted exact S-04 execution references, evidence, and provenance. Execution timestamps and the
outer execution ID are audit metadata, so changing them does not alter the material digest.
Unknown, missing, or duplicate execution/configuration references and definition-digest
substitution are rejected.

## Representative fixtures

The invariant suite exercises five representative cases:

1. deterministic provider-TCK outputs that repeat exactly;
2. a deterministic mismatch where exact equality reports disagreement without tolerance;
3. repeated numeric outputs with descriptive sample dispersion;
4. three categorical judgments with one agreeing pair and two disagreeing pairs;
5. seeded stochastic matched-contrast executions whose seed varies while other material settings
   remain constant.

Negative coverage rejects malformed/duplicate identity, ambiguous version scope, incomplete method
taxonomy, false implementation status, conflicting dimensions, unknown targets/references,
definition or configuration substitution, mixed repeatability conditions, incompatible numeric
metric/unit/scale/target pooling, deterministic input to stochastic studies, schema-only execution,
and S-03/S-04 contract violations.

## Existing capability reconciliation

The existing statistical-contrast bootstrap interval estimates uncertainty for a matched statistic;
it is not a reliability study and is not reused automatically. Legacy behavioral `confidence`
labels remain provenance categories, not reliability or uncertainty. Rubric-legitimacy disagreement
fields and reproducibility-auditor artifact hashes remain bounded legacy capabilities. Neither is
promoted to the canonical S-05 estimator layer.

S-05 consumes existing S-02 identities, S-03 metric definitions/results, and S-04 evaluator
definitions/configurations/executions directly. It changes no existing evaluator or product runtime.
The S-03 reliability extension already accepts evidence references, so no metric-contract change is
required.

## Boundaries and handoff

S-05 adds no bootstrap reliability interval, live model execution, human-subject workflow,
scientific validation, calibration, benchmark promotion, product behavior, persistence, dependency,
Cyber work, licensing change, private-source intake, or IP-boundary change.

S-06 can add governed human-rater identity, assignments, blinding, randomization, adjudication, and
review while retaining the S-05 study and estimate records. A later validity gate can consume
reliability evidence by exact reference while keeping validity evidence and claims separate.

## Implementation references

- `packages/benchmark/src/reliability-types.ts`
- `packages/benchmark/src/reliability-definitions.ts`
- `packages/benchmark/src/reliability.ts`
- `tests/unit/benchmark-reliability-laboratory.test.ts`

# S-04 Evaluator Laboratory

**Status**: `ARCHITECTURE`
**Scope**: evaluator definitions, configurations, executions, and representative migration
**Baseline**: protected `main` after merged S-03
**Scientific claim**: none

## Purpose

S-04 gives every evaluator a stable identity and an explicit contract. It connects evaluator
implementations to the exact S-02 benchmark and S-03 metric identities they serve while keeping
three records separate:

1. an evaluator **definition** states what the evaluator is allowed and able to do;
2. a **configuration** records the evaluation-relevant settings and their digest; and
3. an **execution** records one attempt, its inputs, subject, status, output, and provenance.

This layer does not change the behavior of an existing evaluator. It does not add a live model,
human-subject workflow, calibration process, validation process, benchmark promotion, or Core
certification mechanism.

## Canonical identity and version scope

An evaluator identity is the pair `evaluatorId + evaluatorVersion`. The version scope is always
`EVALUATOR`. Evaluator versions are independent of benchmark, metric, rubric, schema, package,
and product versions. A configuration digest is content identity for one set of material settings;
it is not an evaluator version.

The registry reuses the complete S-02 evaluator-kind vocabulary:

- `DETERMINISTIC`
- `RULE_BASED`
- `SELF_EVALUATION`
- `SAME_MODEL_JUDGE`
- `CROSS_MODEL_JUDGE`
- `LLM_AS_JUDGE`
- `SEMANTIQ_EVALUATOR`
- `HUMAN_JUDGE`
- `HYBRID`

Vocabulary support is distinct from implementation. `SUPPORTED_BY_SCHEMA` means a contract can
represent the kind. `IMPLEMENTED_AND_BOUND` requires a repository implementation identifier and
evidence. The registry therefore does not turn an enum member into a working evaluator claim.

## Definition contract

Each definition declares:

- identity and evaluator kind;
- binding status and, when implemented, its existing implementation identifier;
- allowed authority;
- exact benchmark, construct, and metric bindings;
- input and subject requirements;
- permitted output kinds;
- rubric and model requirements;
- determinism and judge independence;
- evaluation-relevant configuration parameters;
- provenance, evidence, and limitations.

Evaluator authority is bounded to producing observations, computing metrics, recommending ratings,
producing judgments, or grouping judgments. Every S-04 definition has `scientificAuthority: NONE`.
An evaluator result cannot by itself calibrate or validate a metric, promote a benchmark, establish
construct validity, certify a subject, or authorize a Core claim.

## Rubrics

A rubric is a versioned object with `RUBRIC` scope. It has named criteria, criterion references,
optional weights, provenance, and limitations. Definitions state whether a rubric is required,
optional, or forbidden. Configurations bind a required rubric by exact identity. Rubrics are not
embedded as an unversioned prompt string.

The current long-horizon rubric records the existing milestone, convergence, memory-coherence,
and budget-efficiency criteria and weights. Recording those weights does not supply empirical
calibration or validity evidence.

## Configuration and digest

A configuration contains only evaluation-relevant material:

- exact evaluator identity;
- declared parameter values;
- exact rubric identity when applicable;
- exact model provenance when applicable;
- stable tool, context, and normalization references.

Canonical JSON sorts object keys and set-like reference arrays before SHA-256 hashing. Reordering
parameters or references does not change the digest. Changing a material setting does. Audit
timestamps and request IDs are excluded, so they do not change the digest. Local filesystem paths,
undeclared parameters, credentials, tokens, passwords, private keys, and API keys are rejected.

Model provenance records provider, model ID, snapshot status, and an exact model version only when
one is known. `DECLARED_IMMUTABLE` requires a version. `MUTABLE_ALIAS` forbids an invented immutable
version. S-04 adds no live model-backed evaluator.

## Execution contract

Every execution preserves its own `executionId`, run, evaluator identity, configuration digest,
subject identity and kind, evaluation target, input references, optional exact benchmark/construct
and metric bindings, status, evidence, provenance, and execution time.

The status vocabulary is:

- `SUCCEEDED`: an output is present;
- `FAILED`: the evaluator did not produce a valid subject result and a failure record is present;
- `PARTIAL`: an explicitly partial record may preserve bounded output;
- `ABSTAINED`: the evaluator declined with an explicit reason;
- `NOT_APPLICABLE`: the evaluator contract does not apply to the subject/input pair.

Abstention is neither failure nor a zero. Failure is an evaluator outcome, not a subject score.
Where a metric record is required, failed execution maps to S-03 `EVALUATOR_FAILURE`, abstention to
`INSUFFICIENT_EVIDENCE`, and non-applicability to `NOT_APPLICABLE`. Each mapping yields a missing
`MetricResult` with zero observations and one missing result; it never fabricates a numeric value.

Numeric evaluator output must use the complete S-03 `MetricResult` contract. This preserves scale,
unit, missingness, aggregation, denominator, uncertainty, computation, evidence, and provenance
semantics. A rationale is optional explanatory text on judgment outputs. It is separate from the
result and its evidence references, and the contract contains no chain-of-thought field.

## Determinism and judge independence

Determinism is stated as one of `DETERMINISTIC`, `SEEDED_STOCHASTIC`, `STOCHASTIC`,
`EXTERNAL_NONDETERMINISTIC`, or `UNKNOWN`. This axis is separate from evaluator kind. The matched
statistical contrast is classified `SEEDED_STOCHASTIC` because its arithmetic is deterministic and
its optional bootstrap path must carry a seed.

Judge independence is stated as `SELF`, `SAME_MODEL`, `SAME_FAMILY`, `CROSS_MODEL`, `HUMAN`, or
`NON_MODEL`. Model-based kinds require model provenance. The schema-only human judge contract uses
`HUMAN`, forbids model provenance, and implements no recruitment, assignment, adjudication, or
review workflow.

Comparable executions are grouped by subject, evaluation target, inputs, benchmark/construct, and
metric. All executions remain in the group. Disagreement is a boolean derived from canonical output
signatures. S-04 does not average, overwrite, select a winner, or conceal failed and abstained runs.

## Exact S-02 and S-03 bindings

| Canonical evaluator | Existing implementation | Kind | Exact binding | Status |
| --- | --- | --- | --- | --- |
| `sandbox_tck_suite@0.1.0` | `SandboxTCK.runSuite` | `DETERMINISTIC` | `provider_tck@0.1.0` / `provider_contract_conformance`; `provider_tck_passed_tests@0.1.0`; `provider_tck_pass_rate@0.1.0` | implemented and bound |
| `long_horizon_rule_evaluator@0.1.0` | `LongHorizonTestingEngine.evaluateLongHorizonTrajectory` | `RULE_BASED` | `long_horizon@0.1.0` / `long_horizon_resilience`; `long_horizon_resilience_index@0.1.0` | implemented and bound |
| `matched_statistical_contrast@0.1.0` | `StatisticalContrastEngine.evaluateContrast` | `DETERMINISTIC` | benchmark-independent `matched_pair_mean_delta@0.1.0` | implemented and bound |
| `behavioral_metrics_legacy_suite@0.1.0` | `BehavioralMetricsEngine.evaluate` | `RULE_BASED` | legacy artifact reference only | implemented, no S-03 metric claim |
| `human_judge_contract@0.1.0` | none | `HUMAN_JUDGE` | none | schema support only |

Validation compares every implemented benchmark binding with the exact S-02 evaluator requirement
and every metric binding with the exact S-03 evaluator dependency. Substitution is rejected.
Integration is registry-and-validation only: the generic execution recorder wraps canonical records,
while the four existing producer functions and their public outputs are not rerouted or changed.

## Legacy confidence boundary

The behavioral suite returns legacy values with `EvidenceConfidence` labels. S-04 preserves that
path as a legacy artifact reference. It does not translate those labels into an S-03 uncertainty
method, calibration status, validity status, probability, or numeric confidence interval. A future
migration requires an explicit S-03 metric definition and evidence appropriate to each claim.

## Validation invariants

1. Evaluator identity is stable, versioned, and scoped to `EVALUATOR`.
2. Supported evaluator kinds exactly match S-02 vocabulary.
3. Schema support does not imply an implementation.
4. Implemented claims require an implementation ID and repository evidence.
5. Benchmark and construct bindings resolve to exact S-02 identities.
6. Metric bindings resolve to exact S-03 identities and implementation dependencies.
7. Evaluator authority cannot calibrate, validate, promote, or certify.
8. Material configuration changes alter the digest; audit metadata does not.
9. Secrets and local filesystem paths cannot enter canonical configuration.
10. Numeric output uses S-03 `MetricResult`; failure and abstention cannot carry a score.
11. Model provenance and judge independence must match evaluator kind.
12. Repeated comparable executions remain separate and disagreement is never averaged away.

Negative tests cover malformed and duplicate identities, ambiguous versions, incomplete kind
vocabulary, unknown bindings, evaluator substitution, unsupported implementation claims, invalid
rubrics, invalid human/model contracts, undeclared or secret configuration, mutable model aliases,
configuration substitution, ambiguous subjects, missing provenance, status conflicts, failed scores,
abstention conflicts, S-03 result violations, and disagreement preservation.

## Boundaries and deferred work

S-04 changes no product execution path. Existing TCK, long-horizon, statistical contrast, and
behavioral evaluator functions are unchanged. The canonical layer records and validates contracts
around them.

Deferred work includes live model execution, prompt hosting, human review operations, adjudication,
calibration studies, validity studies, benchmark promotion, certification, and automated scientific
claims. Those require later gates and their own evidence. No Cyber scope, dependency change, license
change, private-source intake, or IP-boundary change is introduced.

## S-05 reliability handoff

S-05 can consume the stable evaluator identity, configuration digest, determinism class, comparison
key, preserved execution records, and S-03 `MetricResult` values to study run-to-run variance,
judge-to-judge agreement, test-retest behavior, stochastic instability, and appropriate uncertainty
calibration. S-04 supplies no reliability statistic or threshold.

## S-06 human-judge handoff

S-06 can instantiate the existing `HUMAN_JUDGE` definition/execution contract and add governed rater
identity, assignment, blinding, randomized presentation, training provenance, review state, and user
interfaces. The S-04 contract already preserves rubrics, abstention, subject identity, input evidence,
and individual judgments, so S-06 does not need to replace evaluator identity or execution records.

## Implementation references

- `packages/benchmark/src/evaluator-types.ts`
- `packages/benchmark/src/evaluator-definitions.ts`
- `packages/benchmark/src/evaluators.ts`
- `tests/unit/evaluator-laboratory.test.ts`
- `packages/sandbox-tck/src/tck-suite.ts`
- `packages/sandbox-contracts/src/long-horizon.ts`
- `packages/evidence/src/statistical-contrast/statistical-contrast-engine.ts`
- `packages/evidence/src/behavioral-metrics/behavioral-metrics-engine.ts`

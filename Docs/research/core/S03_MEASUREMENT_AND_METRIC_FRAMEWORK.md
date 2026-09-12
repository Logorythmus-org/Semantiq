# S-03 measurement and metric framework

Decision: **S03_MEASUREMENT_FRAMEWORK_IMPLEMENTED**. This gate defines what a SemantIQ metric result means and which claims its evidence permits. It does not recalibrate existing scores, validate a scientific construct, change scoring behavior, or promote an S-02 benchmark.

## Baseline

S-03 starts from protected `main` at merge commit `4f38d6db5d79c522d53276243189327a0be07633`, tree `add36b91c27332e5c4110abdd6435b5f69bb42e2`. The merge contains PR #56 final head `f62992accbd243313466a4b8bb69ef8e4c4dee31`. All required post-merge checks passed on the merge commit.

## Architecture and source of truth

The typed `CANONICAL_METRIC_REGISTRY` in `packages/benchmark/src/metric-definitions.ts` is the single editable source for metric definitions. `metric-types.ts` separates definitions, observations, computations, results, uncertainty, evidence and provenance. `metrics.ts` validates registries and results, performs only the declared basic aggregations, and provides deterministic serialization and digests. No parallel JSON registry is checked in.

The relationship is:

`BenchmarkIdentity + constructId → MetricDefinition → Observation(s) → computation/evaluator → MetricResult → uncertainty/evidence/provenance`

Definitions describe meaning. Observations retain individual values or explicit missingness. Computation references identify the evaluator, inputs and parameters. Results carry the declared aggregation and uncertainty actually computed. Runtime timestamps and transient IDs are not part of definition identity.

## Identity and binding

Canonical metric identity is `metricId + metricVersion`; display names do not identify metrics. Every definition declares `versionScope: METRIC`. Metric versions are independent of benchmark, SemantIQ product, package, schema, API, dataset and evaluator versions.

`BENCHMARK_BOUND` definitions must use an exact S-02 `BenchmarkIdentity` and a construct declared by that benchmark. Validation rejects unknown benchmarks, unknown constructs and result bindings that differ from their definition. `BENCHMARK_INDEPENDENT` is explicit and is limited here to the matched-pair arithmetic feature; it cannot carry an implicit construct or free-text benchmark binding.

S-02 remains the sole authority for benchmark implementation, scientific and lifecycle maturity. Metric validation has no mutation path into `BenchmarkRegistry`; a computed value, passing test or evidence reference cannot promote a benchmark.

## Measurement semantics

The framework distinguishes `RAW_OBSERVATION`, `DERIVED_FEATURE`, `ENGINEERING_METRIC`, `HEURISTIC_PROXY` and `EMPIRICAL_MEASURE`. A numeric output is therefore not itself a scientific measurement claim.

Every definition declares one scale from `BOOLEAN`, `COUNT`, `RATIO`, `INTERVAL`, `ORDINAL`, `CATEGORICAL`, `PROBABILITY` or `CONTINUOUS`, plus a unit and explicit domain. Domains state value type, finite/integer behavior, bounds, inclusivity, allowed categories and normalization. Validation rejects non-finite numbers, fractional counts, forbidden negative values and out-of-range probabilities. `PROBABILITY` uses an inclusive `[0, 1]` domain; percentages remain a separate unit.

Units are `DIMENSIONLESS`, `COUNT`, `MILLISECONDS`, `SECONDS`, `BYTES`, `TOKENS`, `PROPORTION` or `PERCENTAGE`. Abstract scores receive no invented physical unit. Direction is `HIGHER_IS_BETTER`, `LOWER_IS_BETTER`, `TARGET_VALUE` with an explicit target, or `NON_DIRECTIONAL`. Direction metadata guides interpretation; it supplies no validity evidence.

## Missingness, aggregation and denominators

A result is either `VALUE` or `MISSING`. Missing reasons distinguish `NOT_OBSERVED`, `NOT_APPLICABLE`, `INVALID_INPUT`, `EVALUATOR_FAILURE` and `INSUFFICIENT_EVIDENCE`. A result cannot carry a value and missing reason together. Each definition says whether aggregation excludes, propagates or rejects missing observations, so missing is never silently converted to zero.

Supported aggregation is deliberately small: `NONE`, `SUM`, `COUNT`, `MEAN`, `MEDIAN`, `MIN`, `MAX` and `WEIGHTED_MEAN`. Definitions state a minimum observed sample and whether weights are required. Numeric aggregation is rejected for boolean, categorical and ordinal scales. The engine validates observations before aggregation and reports observed and missing counts.

Proportions require numerator, positive denominator and an identified eligible population. The value must equal numerator divided by denominator. Zero denominators, missing denominators and numerator/value mismatches are errors; the framework never substitutes zero or one.

## Uncertainty

Uncertainty is a tagged contract: `NONE`, `STANDARD_ERROR`, `CONFIDENCE_INTERVAL`, `BOOTSTRAP_INTERVAL` or `EMPIRICAL_DISTRIBUTION`. A definition enumerates allowed methods. Results can claim only a method actually allowed and computed.

Intervals require finite ordered bounds, a level strictly between zero and one, positive sample size and an assumptions reference. Bootstrap intervals additionally require positive replicates and an integer seed. Empirical distributions require an addressable artifact. `NONE` makes the absence of computed uncertainty explicit.

Confidence and uncertainty remain separate. A top-level legacy `confidence` or `certainty` field is invalid in the new result contract and cannot substitute for a declared statistical method.

## Calibration, validity and reliability

Calibration and construct-validity applicability are each machine-readable as `REQUIRED` or `NOT_APPLICABLE`. Operational engineering metrics may be well-defined through instrumentation, units, reproducibility and test semantics while calibration and construct validity remain not applicable. Construct-bearing proxies declare calibration and validity required but outstanding.

`CALIBRATED` requires calibration evidence references. `VALIDATED` requires categorized evidence; supported categories are content, construct, criterion-related, convergent/discriminant and known-groups evidence. No representative definition makes either claim. Human agreement and benchmark popularity are not accepted as validity evidence.

The reliability field is only an extension point stating applicability and evidence references. S-03 implements no test-retest, inter-rater, internal-consistency, judge-agreement or run-variance estimator.

## Representative migration

| Existing output | Canonical metric | Kind | Scale / unit | Aggregation / uncertainty | Scientific treatment |
| --- | --- | --- | --- | --- | --- |
| `TckReport.passedTests` | `provider_tck_passed_tests@0.1.0` | ENGINEERING_METRIC | COUNT / COUNT, integer ≥ 0 | NONE / NONE | Calibration and construct validity not applicable |
| `passedTests / totalTests` | `provider_tck_pass_rate@0.1.0` | ENGINEERING_METRIC | PROBABILITY / PROPORTION, `[0, 1]` | NONE / NONE; denominator required | Engineering conformance only |
| `LongHorizonEvaluationReport.longHorizonResilienceIndex` | `long_horizon_resilience_index@0.1.0` | HEURISTIC_PROXY | CONTINUOUS / DIMENSIONLESS, normalized `[0, 1]` | NONE / NONE | Calibration and validity required, both outstanding |
| `MatchedContrastReport.meanDelta` | `matched_pair_mean_delta@0.1.0` | DERIVED_FEATURE | CONTINUOUS / DIMENSIONLESS, `[-1, 1]` | MEAN / optional BOOTSTRAP_INTERVAL | Arithmetic contrast; no causal or target-construct claim |

The first three bind to exact S-02 benchmark/construct identities. The matched-pair delta is benchmark-independent because the existing engine accepts a target-metric string and is not bound to one S-02 benchmark. Its declared domain applies only when the underlying target scores are bounded to `[0, 1]`.

No existing producer or report was changed. The registry records the old implementation reference and new identity in parallel; compatibility surfaces continue to emit their original values.

## Legacy confidence boundary

The bounded audit found four relevant patterns:

- `EvidenceConfidence` is an epistemic provenance category such as deterministic or empirical, not a statistical interval.
- Behavioral and semantic runtimes expose fixed or heuristic numeric `confidence` fields; these remain legacy quality signals.
- `CrossComparisonEngine` labels a fixed `normalizedScore ± 0.05` margin as a confidence interval and marks distinctions significant without an estimator. S-03 does not register that field as statistical uncertainty.
- `StatisticalContrastEngine.bootstrapCI` includes level, bounds, iterations and deterministic resampling. Only a result explicitly represented as `BOOTSTRAP_INTERVAL` receives that uncertainty meaning.

External legacy fields remain compatible. New canonical results neither copy nor silently reinterpret them.

## Validation invariants

Deterministic validation rejects duplicate identities, invalid or ambiguously scoped versions, unknown benchmark/construct bindings, incompatible scales and units, undeclared missingness or aggregation, categorical averaging, invalid values, value/missingness conflicts, bad denominators, unsupported uncertainty, malformed intervals, invalid levels or sample sizes, evaluator substitution, absent provenance, and calibrated or validated claims without evidence.

Canonical serialization sorts definition identities and set-like reference arrays before hashing. Equivalent registry order therefore yields the same serialized definition set and digest.

## Limits and handoff

S-03 registers four representative metrics rather than migrating the full S-01 inventory. It does not implement persistence, public API migration, formula execution, dataset publication, calibration studies, validation studies or general statistical machinery.

S-04 can attach evaluator executions through `MetricComputationReference`, which already identifies evaluator, version, parameters and input references. S-05 can add repeated observations and reliability artifacts without changing metric identity or result meaning. S-06 can represent human ratings as observations with rater provenance while retaining the same value, missingness, computation and evidence boundaries.

Cyber implementation, licensing changes, restricted inputs, new dependencies and scientific-validation claims are outside this gate.

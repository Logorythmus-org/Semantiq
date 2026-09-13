# S-08 Human–AI Comparative Measurement Gate

**Status**: `ARCHITECTURE`

**Scope**: evidence-gated Human–AI comparison contracts

**Baseline**: protected `main` at `64c26b18d0597e7813086165fa0bee1e209ed5ec`

**Scientific authority**: `NONE`

## Decision

S-08 makes candidate evidence pairable without presuming that it is comparable. A
`HumanAIComparisonUnit` references one governed Human-as-Subject response and one exact AI
execution, their shared benchmark/item/construct target, both actual condition records, and any
S-03 through S-07 evidence. A separate `HumanAIComparabilityAssessment` evaluates fifteen visible
dimensions for one declared purpose and level. The gate fails closed when a critical dimension is
unknown or mismatched. A result always retains the assessment that authorizes or blocks its
interpretation.

The architecture can return `INSUFFICIENT_EVIDENCE` or `NOT_COMPARABLE` even when the item,
evaluator, categorical outcome, or numeric value appears identical. It contains no global
comparability score and no state for scientific equivalence, intelligence equivalence, Human
level, or superhuman performance.

## Baseline and canonical inputs

PR #61 ended at reviewed head `4f33f5781f608c9efd8ffee151418d7119127fe5`, was approved, passed
all twelve remote checks, and merged as `64c26b18d0597e7813086165fa0bee1e209ed5ec`. Protected `main`
at S-08 start had that same SHA and tree `f98aa1018f36779a8c18a09891b9307d06ca715f`.

S-08 reuses these contracts without copying their records:

| Gate | Canonical input retained by reference |
| --- | --- |
| S-02 | exact `BenchmarkIdentity`, construct identity, lifecycle, maturity, evidence, and HACS collision |
| S-03 | exact `MetricDefinition` and validated `MetricResult`, including scale, unit, domain, direction, missingness, aggregation, denominator, uncertainty, calibration, validity, and evaluator dependency |
| S-04 | evaluator identity/version, configuration, execution, judge kind, provenance, rubric, and abstention/failure state |
| S-05 | reliability study and estimate references; no inferred coefficient or universal threshold |
| S-06 | Human Judge rating, assignment, presentation, rubric, visibility/blinding, rater, and execution references |
| S-07 | Human-as-Subject study, session, presentation, item, response, language, tool policy, and pseudonymous subject references |

The roles remain distinct: `HUMAN_AS_JUDGE` evaluates evidence, `HUMAN_AS_SUBJECT` produces a
participant response, and `AI_AS_SUBJECT` produces a model execution. `HUMAN_AI_COMPARISON` is a
relationship between evidence records, not a fourth subject type.

## Historical HACS discovery and reconciliation

Historical HACS in `Docs/SemantIQ-Benchmarks.pdf`, pp. 205–208, describes a Human–AI Comparative
Semantic Benchmark Standard and proposed human/AI scorecards, a comparative table, bias/stability
maps, and a semantic-maturity profile. Those outputs are historical design material. They have no
current sampled human population, governed AI execution set, operational common metric, common
scale evidence, reliability study, validity evidence, or measurement-invariance result. Their
illustrative values and comparative interpretations are not current results.

The machine identities remain separate:

- `bmk_hacs_agent_resilience`, benchmark version `1.0.0`, identifies the current synthetic
  agent-resilience producer.
- `historical_hacs_human_ai_comparative@0.1.0` identifies the historical Human–AI research idea.
- bare `HACS` is rejected by the S-08 gate because it collides.

`HISTORICAL_HACS_CAPABILITY_AUDIT` is the machine-readable reconciliation:

| Capability | Classification | Current authority | Disposition |
| --- | --- | --- | --- |
| Human scorecard | `HISTORICAL_ONLY` | none | provenance only |
| AI scorecard | `HISTORICAL_ONLY` | none | provenance only |
| Comparative table | `HISTORICAL_ONLY` | none | scientific claim blocked |
| Bias/stability map | `HISTORICAL_ONLY` | none | scientific claim blocked |
| Semantic-maturity profile | `CONFLICTING` | none | current maturity interpretation blocked |
| `CrossComparisonEngine` | `CURRENT_ENGINEERING_MECHANISM` | engineering only | reusable only within its existing synthetic model/provider scope |
| Fixed legacy confidence margin | `CONFLICTING` | engineering only | statistical interpretation blocked |

The existing `CrossComparisonEngine` groups synthetic model runs, applies a latency-derived
normalization, adds a fixed ±0.05 interval, and emits rankings. The fixed margin is not registered
S-03 uncertainty, and the label `STATISTICALLY_SIGNIFICANT` has no estimator or assumptions record.
That mechanism remains compatible at its existing boundary; S-08 does not rewrite its unrelated
runtime. Its score, confidence label, and ranking cannot enter Human–AI comparison as scientific
evidence merely because the code exists.

## Definition, unit, assessment, observation, and result

`HumanAIComparisonDefinition` records a semantic identity/version, the declared purpose, comparison
level, pairing design, critical dimensions, required evidence, provenance, limitations, and zero
scientific authority. Purposes are bounded to item success, categorical outcome relationship,
error-pattern comparison, bounded construct indicator, latency under matched conditions, or a
numeric descriptive difference. The same evidence may be interpretable for one purpose and blocked
for another.

Comparison levels distinguish an individual human and individual AI execution, two samples, and two
aggregates. Pairing is explicitly `PAIRED_BY_ITEM`, `PAIRED_BY_CONDITION`, or `UNPAIRED`. Sample and
aggregate levels require separate human and AI population provenance: population definition,
sampling protocol, sample size, inclusion/exclusion policy, and `representativeness: NOT_CLAIMED`.
No demographic or other PII is part of this contract.

`HumanAIComparisonUnit` references exact evidence instead of converting S-06 or S-07 records into a
generic result. Human evidence retains response/study/session/presentation lineage. AI evidence
retains provider, model, snapshot/version state, configuration, sampling parameters, tool access,
system/context, and execution provenance. The unit also binds exact benchmark and item versions,
construct, both condition profiles, metric/evaluator executions, reliability, validity, and
provenance. Creating a unit establishes only that the records are candidates for comparison.

`HumanAIComparabilityAssessment` records every dimension, the critical subset, evidence references,
concise rationale, limitations, blocking dimensions, unknown dimensions, provenance, and authority.
Its decision vocabulary is:

- `NOT_ASSESSED`
- `INSUFFICIENT_EVIDENCE`
- `NOT_COMPARABLE`
- `CONDITIONALLY_COMPARABLE`
- `COMPARABLE_FOR_DECLARED_PURPOSE`

The automated policy is deterministic. Any critical `MISMATCHED` dimension produces
`NOT_COMPARABLE`. A missing, `UNKNOWN`, or critical `NOT_APPLICABLE` dimension produces
`INSUFFICIENT_EVIDENCE`. An `ACCEPTABLE_WITH_LIMITATIONS` critical dimension can produce only
`CONDITIONALLY_COMPARABLE`. All critical dimensions must be positively `MATCHED` before the last,
purpose-specific decision is possible. Positive, mismatch, and conditional claims require evidence
references. Absence of mismatch is never treated as evidence of compatibility.

An observation is kept separate from the assessment. It may contain categorical value/missingness
or two complete S-03 metric results. `HumanAIComparisonResult` begins with purpose, level,
comparability decision, critical assessment lineage, and limitations before any relationship. When
the gate blocks interpretation, it emits `NOT_INTERPRETABLE` and suppresses the apparent outcome
relationship. An allowed result remains bounded and lists prohibited claims.

## Compatibility dimensions

Every assessment contains all fifteen dimensions with one of `MATCHED`,
`ACCEPTABLE_WITH_LIMITATIONS`, `MISMATCHED`, `UNKNOWN`, or `NOT_APPLICABLE`:

| Dimension | Evidence question enforced by the contract |
| --- | --- |
| `CONSTRUCT_COMPATIBILITY` | Does population-applicable evidence support sufficiently compatible interpretation of the observed behavior? |
| `TASK_COMPATIBILITY` | Do benchmark/item version, instructions, stimulus, and task constraints match or have justified adaptation evidence? |
| `PRESENTATION_COMPATIBILITY` | What did each subject actually receive, including formatting, order, metadata, wrapper, system context, and transformations? |
| `RESPONSE_MODE_COMPATIBILITY` | Are forced choice, categorical, open text, structured response, ranking, or tool action interpreted compatibly? |
| `TOOL_ASSISTANCE_COMPATIBILITY` | Are human and AI assistance, retrieval, search, calculator, memory, and system-context conditions compatible? |
| `LANGUAGE_COMPATIBILITY` | Is exact language matched, or is there actual adaptation-equivalence evidence? |
| `SCORING_COMPATIBILITY` | Do rule/rubric, representation, missingness, failure, denominator, and eligible-population semantics behave compatibly? |
| `EVALUATOR_COMPATIBILITY` | Is evaluator behavior across subject types evidenced rather than inferred from shared implementation identity? |
| `METRIC_COMPATIBILITY` | Is the exact S-03 metric identity/version and its full semantic contract shared? |
| `SCALE_INTERPRETATION_COMPATIBILITY` | Is a common interpretation across the declared populations supported independently of metric identity? |
| `RELIABILITY_EVIDENCE` | What S-05 evidence applies to each population and condition? |
| `VALIDITY_EVIDENCE` | What validity evidence applies separately to human and AI uses? |
| `SAMPLING_COMPATIBILITY` | Do sampling, denominator, eligible population, exclusions, aggregation, and pairing support the purpose? |
| `ENVIRONMENT_COMPATIBILITY` | Are environmental differences controlled or explicitly limited? |
| `TIME_POLICY_COMPATIBILITY` | Are timing and latency conditions compatible for the declared purpose? |

The engine also checks direct recorded condition equality. A caller cannot label differing
instructions/stimulus, presentation digest, response mode, tools, language, scoring protocol,
evaluator identity/version, metric identity/version, environment, time policy, denominator, or
eligible population as `MATCHED`. A justified difference must remain visible as
`ACCEPTABLE_WITH_LIMITATIONS`; it cannot be hidden.

Construct compatibility remains an evidence judgment. Same item identity does not prove it. Human
validity evidence does not transfer to AI, AI validity evidence does not transfer to humans,
reliability does not establish validity, and neither establishes comparability alone.

## Numeric comparison and missingness

A numeric difference is available only under the exact
`NUMERIC_DESCRIPTIVE_DIFFERENCE` purpose. Both values must be valid S-03 `MetricResult` records with
the same metric ID/version, exact metric semantics, matched metric compatibility, positively matched
common-scale evidence, and identical denominator evidence. Missing or nonnumeric values are rejected
instead of coerced. The output is only AI value minus human value as a descriptive difference. It
does not imply direction of ability, superiority, effect size, practical meaning, statistical
significance, parity, or equivalence.

Categorical outputs are limited to same outcome, different outcome, or explicit human/AI/both
missing. A skipped or abstained human response remains missing. Agreement does not become
correctness, and consensus does not become truth.

## Measurement-invariance research contract

`HUMAN_AI_MEASUREMENT_INVARIANCE_RESEARCH_CONTRACT` is schema and research planning only. It asks
whether items support compatible construct interpretation, scoring behaves similarly, systematic
population effects appear, item difficulty/order differs, evaluator behavior differs by subject
type, and a common scale can be defended. It requires a prespecified protocol, population-specific
reliability and validity evidence, item responses, scoring-behavior evidence, and common-scale
justification.

No configural, metric, scalar, strict, or other psychometric invariance is implemented or claimed.
Its `implementedMethods` is empty and its scientific authority is `NONE`.

## Differential-item-behavior research contract

`DIFFERENTIAL_ITEM_BEHAVIOR_RESEARCH_CONTRACT` deliberately uses the neutral term
`DIFFERENTIAL_ITEM_BEHAVIOR`. It requires item/version, separate human and AI observations,
conditions, metric/evaluator, observed difference, uncertainty when actually available,
alternative explanations, and evidence status. It implements no Mantel-Haenszel, IRT, or logistic
regression DIF method. A synthetic fixture cannot justify their assumptions, and an observed
difference carries no causal authority.

## HIB status

The current `hib_research_candidate@0.1.0` remains `SCAFFOLDED`, `CALIBRATION_REQUIRED`, `DRAFT`,
and `NOT_PROMOTED`. Every S-07 construct still has `aiSuitability: UNASSESSED`. Its Human–AI
comparability is `UNESTABLISHED`, with blockers for construct compatibility, AI-applicable validity,
common scale interpretation, and measurement-invariance evidence. S-08 does not add evidence that
clears any blocker and cannot promote benchmark or construct maturity.

## Synthetic architecture cases

The deterministic fixtures exercise the gate rather than supply empirical evidence:

| Case | Condition | Required behavior |
| --- | --- | --- |
| A | same item/outcome; construct unknown | insufficient evidence |
| B | language differs; no equivalence evidence | not comparable |
| C | human uses no tools; AI is tool assisted | not comparable |
| D | bounded categorical task/presentation/response/scoring evidence | conditional item-level interpretation only |
| E | same number; common scale unknown | no numeric interpretation or rank |
| F | aggregate denominators differ | aggregate comparison blocked |
| G | human abstains; AI has result | human missingness retained, never zero |
| H | Human Judge can see source | conditional result retains judge-effect limitation |

## Safe outputs and prohibited interpretations

Allowed output after a positive purpose-specific gate is limited to a same/different categorical
relationship, matched-task success/failure category, descriptive difference, error-pattern
relationship, or explicit missing observation. Every result carries the assessment decision and
limitations first.

The result contract always prohibits Human superiority, AI superiority, Human level, superhuman,
intelligence gap, semantic-maturity gap, scientific equivalence, and universal Human baseline
claims. S-08 produces no leaderboard, rank, winner, norm, parity threshold, effect size, or
significance statement. A human sample requires an exact population and study design and never
becomes “the Human score.” One model execution never becomes “AI” as a universal population.

## Privacy, provenance, and canonicalization

Stable S-08 records reject credentials, private paths, and direct or sensitive identity fields.
Human subject identity remains an S-07 pseudonym by reference. Population provenance intentionally
contains no demographics. AI provenance is exact rather than universalized.

SHA-256 digests use canonical JSON. Definition identity includes purpose, level, pairing, critical
dimensions, evidence requirements, provenance, and limitations. Unit identity includes exact
evidence, benchmark/item/construct, conditions, population records, and S-03 through S-07 evidence
references. Assessment identity includes dimension decisions, evidence, limitations, blockers,
purpose, unit, and authority. Set-like arrays and dimension order are canonicalized. There are no
audit timestamps or request IDs in scientific identity.

An automated assessment is labeled `AUTOMATED_EVIDENCE_GATE`, not scientific approval. A future
research review can be recorded as such, but S-08 still assigns scientific authority `NONE`.

## Boundaries and future evidence

S-08 adds a private-package architecture, synthetic fixtures, a historical audit, and tests. It
collects no real human data, recruits no participants, processes no PII, runs no model study, fits
no psychometric model, claims no invariance or DIF, creates no population norms, and asserts no
Human–AI parity or scientific validation. It changes no product behavior, Cyber boundary, license,
dependency, provider integration, or private/protected-source boundary.

Empirical use remains blocked until a purpose and population are prespecified; study, sampling,
inclusion/exclusion, item, presentation, language, response, tool, environment, time, scoring,
evaluator, missingness, denominator, reliability, validity, scale, and analysis conditions are
reviewed; real data governance is approved; and the required population-specific evidence exists.
Comparative reporting must remain suppressed for every purpose whose critical evidence is unknown
or mismatched.

## Implementation references

- `packages/benchmark/src/human-ai-comparison-types.ts`
- `packages/benchmark/src/human-ai-comparison-definitions.ts`
- `packages/benchmark/src/human-ai-comparison.ts`
- `tests/unit/human-ai-comparability-gate.test.ts`

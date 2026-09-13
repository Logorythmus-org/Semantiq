# S-06 Human Rater System

**Status**: `ARCHITECTURE`
**Scope**: governed Human-as-Judge records and canonical evaluator conversion
**Baseline**: protected `main` after merged S-05
**Scientific claim**: none

## Purpose and role boundary

S-06 implements the governed data layer through which a human judgment becomes a versioned,
blinded, auditable SemantIQ evaluation record. The lineage is Human Rater → Human Rating Study →
Assignment → Presentation → Rating → S-04 `HUMAN_JUDGE` execution → optional S-03 result → S-05
reliability evidence.

The implemented S-06 role is `HUMAN_AS_JUDGE`: a human evaluates an AI, model, system, or other
evaluation subject output. S-07 implements `HUMAN_AS_SUBJECT` through separate records;
`HUMAN_AI_COMPARISON` remains S-08 work. The registry rejects either role when substituted into an
S-06 study, and no Human Judge record is silently reinterpreted as a benchmark response from a
human subject.

## Existing capability reconciliation

The bounded discovery classified relevant current mechanisms as follows:

| Mechanism | Classification | S-06 treatment |
| --- | --- | --- |
| S-04 `human_judge_contract@0.1.0` | Schema-only before S-06 | Promoted to the bounded `HumanRaterSystem.toEvaluatorExecution` adapter |
| S-04 rubric, abstention, configuration, and execution contracts | Existing | Reused directly |
| S-05 `HUMAN_RATER_SET` and deferred rater agreement methods | Schema-only analysis targets | S-06 supplies compatible records; estimator status is unchanged |
| Research Workbench reviewer queue | Existing administrative review | Kept separate from benchmark rating studies |
| `EvaluatorAnnotationStore` | Legacy annotation store | Not treated as a rating, assignment, or presentation system |
| Rubric legitimacy disagreement fields | Partial/legacy | Not promoted to consensus, quality, or reliability truth |
| Responsibility and approval records | Existing governance | Not reused as rater identity or human-study evidence |
| Blinded presentation, seeded ordering, pseudonymous rater lifecycle | Absent | Implemented as canonical S-06 records |
| Human-subject benchmarking and Human-AI comparison | Absent/deferred | Reserved for S-07/S-08 |

## Privacy and rater identity

`HumanRater.identity` contains only a project-scoped pseudonymous `raterId`. It is distinct from a
user account, authentication identity, real-world identity, and S-04 evaluator identity. Canonical
records neither require nor accept real names, email addresses, phone numbers, postal addresses, IP
addresses, account usernames, authentication tokens, API credentials, private keys, or local
filesystem paths.

The bounded lifecycle is `REGISTERED`, `QUALIFIED`, `SUSPENDED`, and `RETIRED`. Only a qualified
rater can receive a new assignment. Transitioning a rater creates a new record and never rewrites
the `raterStatusAtAssignment` or `raterStatusAtSubmission` preserved by historical records.

Qualification, training, and rubric-familiarization fields are exact artifact references. A
completed procedure is not an expertise, certification, validity, or quality claim. Participation
policy and acknowledgement references avoid assuming permission, but they are architecture
placeholders rather than legal consent text or jurisdiction-specific compliance evidence.

## Human Rating Study

`HumanRatingStudyDefinition` states what is collected and under which protocol. Identity is
`humanRatingStudyId + humanRatingStudyVersion` with the independent `HUMAN_RATING_STUDY` scope.
The study binds an exact S-02 benchmark/construct where applicable, evaluation target, input and
subject kinds, S-04 rubric identity/version, output contract, assignment policy, presentation mode,
blinding, randomization, repeat policy, comparison policy, evidence, provenance, and limitations.

A Human Rating Study collects judgments. An S-05 Reliability Study analyzes repeated judgments.
The two definitions remain separate, and multiple ratings do not cause S-06 to calculate a
reliability coefficient.

The canonical architecture fixture rates a presented long-horizon artifact using the existing
`long_horizon_heuristic_weights@0.1.0` rubric. It verifies contracts only and is not empirical human
study evidence.

## Assignment model

An assignment binds one study, qualified pseudonymous rater, exact target/input, rubric,
presentation mode, and blinding policy. Its small lifecycle is `ASSIGNED`, `OPENED`, `SUBMITTED`,
`ABSTAINED`, `EXPIRED`, or `CANCELLED`. S-06 implements creation, opening, submission, and
abstention records; it adds no scheduler.

Assignments cannot contain an answer, score, category, rating, or judgment before submission. The
assignment digest includes material study/rater/target/rubric/presentation information while
excluding request IDs and timestamps. Assignment and submission times are bounded audit metadata;
S-06 makes no inference about attention, effort, or competence from elapsed time.

## Presentation, blinding, and randomization

A presentation records exactly which content references and semantic-content digests were shown,
the candidate order, rubric version, visible metadata, mechanically removed metadata,
randomization provenance, assignment, study, and pseudonymous rater. Supported modes are `SINGLE`,
`PAIRWISE`, and `MULTI_CANDIDATE`.

Blinding policies are `NONE`, `SUBJECT_IDENTITY_BLINDED`, `MODEL_IDENTITY_BLINDED`,
`PROVIDER_IDENTITY_BLINDED`, and `FULL_SOURCE_BLINDED`. Construction removes the corresponding
metadata fields and records effective visibility and transformations. Every presentation states
`sourceAnonymityGuarantee: NOT_CLAIMED`: declared metadata control cannot prove perfect anonymity
because semantic or stylistic content may reveal a source.

Candidate and item ordering uses either `NONE` or recorded `SEEDED_FISHER_YATES`. The same seed and
canonical candidate inputs reproduce the order. Randomization preserves every candidate ID,
content reference, and semantic digest; it neither mutates semantic content nor uses unrecorded
randomness. Pairwise support prepares later controlled comparison presentation, but it remains a
Human-as-Judge operation and makes no Human-AI comparative-validity claim.

## Rating contract and submission semantics

`HumanRating` binds the exact rater, study, assignment, presentation ID/digest, rubric, target,
input, evidence, provenance, and submission. Output kinds align with the S-04/S-03 boundary:

- categorical output maps to `CATEGORICAL_DECISION`;
- ordinal output preserves its category and declared ordinal position, then maps to a categorical
  S-04 decision without numeric averaging;
- structured output maps to `STRUCTURED_JUDGMENT`;
- numeric output must already be a complete S-03 `MetricResult` for the exact metric declared by
  the study.

Statuses distinguish `SUBMITTED`, `ABSTAINED`, `INCOMPLETE`, `INVALID`, and `SYSTEM_FAILURE`.
Abstention reuses S-04 reasons and becomes an `ABSTAINED` execution without output or failure.
Incomplete, invalid, and system-failure submissions cannot become evaluator judgments. Unanswered
dimensions are not filled, and abstention is neither zero nor failure.

Every rating declares `scientificAuthority`, `groundTruthClaim`, `benchmarkMaturityEffect`, and
`metricValidityEffect` as `NONE`. Multiple ratings remain independent source records. S-06 performs
no averaging, majority vote, winner selection, automatic adjudication, or source-record overwrite.
Human disagreement is data.

## S-04 Human Judge integration

S-06 retains the existing `human_judge_contract@0.1.0` evaluator identity and `HUMAN_JUDGE` kind.
Its status becomes `IMPLEMENTED_AND_BOUND` only for the canonical
`HumanRaterSystem.toEvaluatorExecution` adapter. Judge independence remains `HUMAN`, model
provenance remains forbidden, and scientific authority remains `NONE`.

Material configuration includes presentation mode, blinding policy, rating-scale kind, comparison
policy, exact rubric, study context, and normalization references. Rater identity is deliberately
absent from configuration and evaluator version. Individual raters remain execution-level
provenance so S-05 can compare ratings produced under one instrument.

The Human Judge accepts exact benchmark and metric bindings only when the S-06 study validates
them. This study-declared binding policy avoids pretending the general evaluator definition is
universally bound to every benchmark or metric. Numeric results still pass the complete S-03
result validator and carry `HumanRaterSystem.toEvaluatorExecution` as their computation source.

Converted executions preserve rater, assignment, presentation, rating, rubric, evidence, subject,
input, study-derived configuration, and submission time. Rating and presentation records remain the
canonical source; conversion is deterministic and does not introduce PII.

## S-05 handoff

`createHumanRaterSet` accepts only submitted judgments and explicit abstentions that share one
study, rubric, target, and input condition. It returns a deterministic `HUMAN_RATER_SET` target and
sorted pseudonymous rater references. Converted executions retain identical evaluator/configuration
identity for the same instrument, distinct rater provenance, disagreement, and abstention.

S-05 can therefore run its already-implemented raw `CATEGORICAL_AGREEMENT` foundation and explicit
exclusion handling. `INTER_RATER_AGREEMENT`, `INTRA_RATER_AGREEMENT`, and
`JUDGE_TO_JUDGE_AGREEMENT` remain schema-only because S-06 supplies data collection rather than a
scientifically adequate new estimator.

## Canonicalization and validation

Study definitions sort set-like evidence, provenance, limitations, and categorical values before
SHA-256 hashing. Assignment, presentation, rating, and rater-set digests cover material lineage.
Audit timestamps and request IDs do not change definition or material identity. Rubric, blinding,
presentation mode, rating scale, comparison policy, randomization, target, candidate order, or
semantic-content changes do.

Validation rejects duplicate or malformed rater/study identity, invalid lifecycles, unknown
benchmark/construct/rubric/metric/study/rater, role substitution, target/rater/assignment/
presentation/rubric/metric substitution, prepopulated answers, invalid candidate counts/digests,
unrecorded randomness, invalid scales, numeric bypass of S-03, abstention/output conflicts,
incomplete judgments, mixed rater-set conditions, PII, secrets, credentials, and local paths.

## Scientific, ethical, and product boundaries

Human consensus is not ground truth. Agreement does not establish correctness, validity, or rater
quality. S-06 creates no universal Rater Quality Score, ranks no humans, performs no psychological
profiling, collects no demographics, and claims no ethics/IRB approval. A future adjudicated result
must remain separate from original ratings.

S-06 adds no production rater UI, authentication/account system, scheduling, persistence,
surveillance telemetry, live model/provider integration, benchmark promotion, calibration,
validity framework, Human-as-Subject experiment, Human-AI comparison, Cyber work, license change,
dependency, restricted input, or scientific-validation claim.

## S-07 and S-08 handoff

S-07 separately reconstructs HIB and records which candidate constructs, tasks, instructions, and
scoring paths may proceed to research review for humans as subjects. S-06 does not make that
decision.

S-08 can later combine governed human-subject and AI-subject outputs under compatible identities,
controlled presentation, judge provenance, reliability evidence, and prespecified comparison rules.
S-06 implements none of those comparisons.

## Implementation references

- `packages/benchmark/src/human-rater-types.ts`
- `packages/benchmark/src/human-rater-definitions.ts`
- `packages/benchmark/src/human-rater.ts`
- `packages/benchmark/src/evaluator-types.ts`
- `packages/benchmark/src/evaluator-definitions.ts`
- `packages/benchmark/src/evaluators.ts`
- `tests/unit/human-rater-system.test.ts`

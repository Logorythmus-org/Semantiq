# S-07 HIB / Human Benchmark Reconstruction

**Status**: `ARCHITECTURE`
**Scope**: governed Human-as-Subject benchmark reconstruction
**Baseline**: protected `main` at `994ab99969b565e4f99d16ee50f8daa64637d06d`
**Scientific claim**: none

## Decision

S-07 preserves the historical Human Intelligence Benchmark (HIB) as research provenance and
introduces `hib_research_candidate@0.1.0` as a separate, small, synthetic architecture candidate.
The historical source does contain 70 numbered prompts in five families. It does not supply a
validated construct model, ground truth, scoring protocol, calibration, reliability evidence,
validity evidence, norms, or evidence of Human-AI measurement invariance. The historical label
“HIB 1.0” is therefore neither reused as current identity nor treated as scientific truth.

The implemented role is `HUMAN_AS_SUBJECT`: a pseudonymous participant responds to a task. It is
distinct from S-06 `HUMAN_AS_JUDGE`, where a rater evaluates someone else's output, and from the
future `HUMAN_AI_COMPARISON` role. The records never infer that the same task, evaluator, metric, or
numeric value has the same meaning for people and AI systems.

## Source inventory

| Source | Date/version | Construct or family | Item count | Scoring claim | Human role | Current implementation | Evidence status | Conflict and disposition |
| --- | --- | --- | ---: | --- | --- | --- | --- | --- |
| `Docs/SemantIQ-Benchmarks.pdf`, pp. 191–204 | “HIB 1.0” historical; repository date 2026-07-31; source creation date unknown | Meaning/context, bias resistance, knowledge illusion/fiction, reflection, consistency/long form | 70 | Calls the set objective and comparable but supplies no operational scoring | Human as subject; proposed Human-AI comparison | Historical only before S-07 | Unvalidated design evidence | Preserve all items in audit; reject scientific and comparability claims |
| `Docs/SMF_Benchmark_Testhandbuch.pdf` | PDF metadata 2025-11-21; repository date 2026-07-31 | Twelve SMF-oriented prompt families | 84 prompt templates | No anchors, calibration, or validation | Not consistently specified | Historical only | Unvalidated templates | Source evidence, no blind migration |
| `Docs/research/core/S01_CORE_STATE_RECONCILIATION.md` | S-01 | HIB/HACS capability reconciliation | N/A | Explicitly identifies HIB as historical and needing redesign | Human as subject / comparative vision | Current evidence map | Repository-supported classification | Adopt classification |
| S-02 registry | `0.1.0` registry schema | Current HACS and historical HACS identities | N/A | Orthogonal implementation/scientific/lifecycle status | Declared roles | Current | Architecture | Add a non-colliding HIB candidate identity |
| S-03 through S-06 | current Core architecture | Metric, evaluator, reliability, Human Judge | N/A | Governed mechanisms only | Human as judge in S-06 | Current | Architecture and tests | Reuse; do not invent an HIB metric or psychometric estimator |

The same historical PDF also contains WIF and multiple CBF variants. Their counts and wording are
not a stable current registry. HIB draws labels from those concepts without supplying a traceable
item derivation or validated equivalence. Historical HACS appears later in the PDF as a proposed
Human-AI comparative standard. It remains `historical_hacs_human_ai_comparative@0.1.0`, distinct
from the current benchmark version `bmk_hacs_agent_resilience@1.0.0`, and is input to S-08 only.

## Historical baseline and item audit

The source pages verify this exact historical structure:

| Historical family | Range | Count | Main problem found |
| --- | --- | ---: | --- |
| Meaning and context | HIB-001–HIB-015 | 15 | Placeholders and vague properties lack ground truth or anchored rubrics |
| Bias resistance | HIB-016–HIB-035 | 20 | No controlled bias mechanism, counterfactual condition, or scoring evidence |
| Knowledge illusion and fiction tendency | HIB-036–HIB-050 | 15 | Factual error, unsupported assertion, uncertainty, and fiction are mixed |
| Reflection | HIB-051–HIB-060 | 10 | Task reflection, self-rating, and external evaluation are conflated |
| Consistency and long form | HIB-061–HIB-070 | 10 | Writing skill, language, memory, time, and task length are major confounds |

`HISTORICAL_HIB_ITEM_AUDIT` is the single machine-readable audit. Every record includes its
historical identifier and label, source page, family, paraphrased summary, possible candidate link,
human suitability, response type, scoring and evaluator needs, ground-truth need, confounds,
scientific status, disposition, rationale, and overlap links. It deliberately does not reproduce
the historical prompt text as executable content because source rights are unresolved and the
prompts are underspecified.

The 70 records produce this reviewed disposition:

| Disposition | Count | Meaning |
| --- | ---: | --- |
| `HISTORICAL_RETAIN` | 15 | Observable task behavior may survive after concrete stimulus and scoring design |
| `HISTORICAL_REVISE` | 40 | Intended behavior may be useful, but wording or construct/scoring design must change |
| `HISTORICAL_MERGE_CANDIDATE` | 8 | Substantial overlap requires review before consolidation |
| `HISTORICAL_REJECT` | 7 | Personal-history/self-assessment demand is privacy-sensitive, confounded, or not observable |
| `HISTORICAL_SPLIT` | 0 | No split is asserted at this gate |
| `INSUFFICIENT_EVIDENCE` | 0 | All 70 prompts are visible enough to receive a bounded disposition |
| `OUT_OF_SCOPE` | 0 | None silently disappear |

Only four historical records have a direct link to a new candidate item, and that link records
design lineage rather than migration identity. Historical numbers never become canonical IDs.

## Construct reconstruction

S-02 construct records remain the registry-level identity and claim-strength source. S-07 adds a
richer Human Benchmark construct record because human suitability, boundaries, observable
indicators, and confounds are not represented by the small S-02 contract.

| Construct | Included observable behavior | Explicit exclusions | Status |
| --- | --- | --- | --- |
| `meaning_context_behavior@0.1.0` | Reference resolution and context qualification | General intelligence and stable personal ability | Synthetic operationalization; adaptation required |
| `bias_mechanism_reasoning@0.1.0` | Alternative hypotheses and correlation/causation distinction | Ideological agreement and freedom from bias | Intended only; research review required |
| `uncertainty_evidence_boundary@0.1.0` | Separating supported claims, uncertainty, and evidence gaps | Truthfulness as a trait and clinical assessment | Synthetic operationalization; judge study required |
| `response_revision_behavior@0.1.0` | Correction after disclosed evidence and a change rationale | Introspection accuracy and personality inference | Synthetic operationalization; judge study required |
| `long_form_constraint_retention@0.1.0` | Explicit term and cross-paragraph constraint retention | Endurance and general writing quality | Intended only; judge study required |

Every construct lists alternative explanations. AI suitability is `UNASSESSED`, because output
similarity does not show equivalent response processes or construct meaning.

## Candidate benchmark and items

`hib_research_candidate@0.1.0` is `SCAFFOLDED`, `CALIBRATION_REQUIRED`, `DRAFT`, and
`NOT_PROMOTED`. Its four first-party synthetic items span a forced choice, a bounded open response,
a structured revision, and a long response. Four items prove identity, presentation, response,
scoring, and handoff contracts; they do not target the historical count.

Each `HumanBenchmarkItem` binds a semantic item ID and version, benchmark and construct, exact
prompt and instructions, response mode, scoring protocol, language, tool policy, stimulus
references, dependencies, suitability, rights, provenance, adaptation lineage, scientific status,
and limitations. A material prompt, instruction, stimulus, response mode, rule, rubric binding,
construct, or language change requires a new item version. Formatting and audit annotations do not
change scientific identity.

The objective representative item yields only `CORRECT` or `INCORRECT` under its declared exact
rule and records the result through `hib_objective_rule@0.1.0` as an S-04 categorical
`EvaluatorExecution`. It emits no numeric value, so S-07 does not fabricate an S-03 metric. The
three open items declare that a specific S-06 Human Rating Study and rubric must be created before
scoring. An unsupported or non-submitted response produces no score.

## Human subject, study, presentation, and response

`HumanSubjectIdentity` contains only `subjectId`. It is a separate shape from S-06
`HumanRaterIdentity`, even if one person could occupy both roles in separately governed studies.
Canonical records reject direct identity fields, credentials, secret material, and private local
paths. Demographics, medical information, diagnoses, political or religious affiliation,
ethnicity, sexuality, and biometrics are outside this contract.

`HumanBenchmarkStudyProtocol` binds the exact benchmark and item versions, instructions,
presentation policy, time policy, tool policy, language, environment, participation and
acknowledgement references, provenance, and limitations. The included pilot protocol is an
architecture fixture. It is not permission to recruit or collect data.

`HumanBenchmarkSession` binds a pseudonymous subject and exact study digest. It records seeded
Fisher-Yates randomization with both canonical input and presented order. The shared
`seededCanonicalOrder` function is also used by S-06, so ordering logic is not duplicated.

`HumanBenchmarkPresentation` records what the participant saw: exact item identity/version,
prompt, instructions, stimuli, language, tool policy, transformations, subject, session, and
presentation digest. Current fixtures use no transformation. A future translation or adaptation
must record source item/version, source language, and provenance. No cross-language equivalence is
implied.

`HumanSubjectResponse` retains the presentation digest, session, subject, benchmark, item,
response status, optional content/reason, provenance, and timestamp. `SUBMITTED`, `SKIPPED`,
`ABSTAINED`, `INCOMPLETE`, `INVALID`, and `SYSTEM_FAILURE` remain distinct. A non-submission cannot
carry response content, and no missing state becomes zero or incorrect.

The protocol records time as `RECORDED_NOT_SCORED`. Timestamps support lineage only; they do not
measure intelligence, effort, competence, or a universal speed property. Current items prohibit
external tools. A future assisted condition must use an explicit new or study-declared tool policy
and cannot be silently compared with the current condition.

## S-02 through S-06 integration

- **S-02:** the candidate uses canonical `BenchmarkIdentity`, five registered construct IDs, and
  evidence-separated maturity/lifecycle axes. It does not supersede historical HIB or either HACS
  identity.
- **S-03:** no numeric HIB metric is introduced. Any future numeric result must use a registered
  `MetricDefinition` and complete `MetricResult`; calibration and validity remain absent.
- **S-04:** rule scoring remains explicitly rule-based. Open-response scoring routes through the
  existing `HUMAN_JUDGE` evaluator lineage and cannot be hidden behind an unproven scalar.
- **S-05:** future item repeatability and Human Judge agreement must be prespecified reliability
  studies. S-07 adds no coefficient or empirical estimate.
- **S-06:** `createHumanJudgeTarget` converts only a submitted, declared Human-Judge item into an
  exact target for a future S-06 study. The rater, assignment, presented response, rubric, rating,
  and S-04 execution remain S-06 records. The participant never self-scores by implication.

## Pilot gates

A real pilot is blocked until all of these are reviewed for the actual study:

1. Construct definitions and exclusions are approved by relevant research expertise.
2. Item wording, human suitability, language, adaptation, and accessibility are reviewed.
3. Ground truth or versioned S-06 rubric and evaluator binding exists for every scored item.
4. Participation, withdrawal, privacy, retention, and failure handling are established.
5. Applicable legal, research-ethics, age, and jurisdictional requirements are evaluated.
6. Benchmark, item set, language, instructions, environment, and tool policy are frozen.
7. Randomization and schemas are reproducible and stable.
8. Analysis, missingness, exclusion, reliability, and validity-evidence plans are prespecified.

Architectural fields do not establish consent compliance, ethics or IRB approval, GDPR research
compliance, clinical suitability, or permission to run a study.

## Reliability and validity plans

For objective items, a future reliability study may inspect item-level repeatability under fixed
conditions and justified test-retest intervals. For judged responses, S-05 can analyze raw
categorical agreement or a future justified estimator across independent S-06 ratings; intra-rater
repeatability requires repeated blinded presentations. Internal consistency is inappropriate
unless a reviewed model supports a common construct and its assumptions. S-07 calculates none of
these and does not assume that Cronbach alpha is appropriate.

Future validity work must seek evidence about content coverage, response processes, internal
structure where justified, relations to other variables, consequences and failure modes, and
robustness or adversarial behavior. These are evidence categories and plans, not results. Each
alternative explanation in the construct records is a threat to investigate.

## S-08 comparability blocker

Even when a human and an AI system receive the same item and an evaluator emits the same value,
comparability is unestablished. S-08 must investigate construct compatibility, task conditions,
response modes, assistance, scoring-function behavior, scale interpretation, measurement
invariance, and differential item behavior. Until then, no human/model ranking, shared norm, or
statement that one exceeds the other is supported.

## Boundaries and handoff

S-07 adds architecture, synthetic fixtures, audit evidence, tests, and documentation. It recruits
no participants, collects no real human data, adds no production UI or account system, introduces
no dependency, changes no product behavior, touches no Cyber or license boundary, and makes no
scientific validation claim.

The next gates are item and rubric research review, ethics/privacy assessment for a concrete pilot,
prespecified S-05 reliability work, a validity-evidence program, and S-08 Human-AI comparative
measurement. Historical CBF/WIF derivation and source rights remain unresolved research questions.

## Implementation references

- `packages/benchmark/src/human-benchmark-types.ts`
- `packages/benchmark/src/human-benchmark-definitions.ts`
- `packages/benchmark/src/human-benchmark.ts`
- `packages/benchmark/src/deterministic-randomization.ts`
- `packages/benchmark/src/registry-definitions.ts`
- `tests/unit/human-benchmark-reconstruction.test.ts`

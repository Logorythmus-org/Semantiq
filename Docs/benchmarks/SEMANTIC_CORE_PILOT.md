# Semantic Core Pilot 0.1.0

**Status**: `NORMATIVE` — **BM2 — Implemented**

SemantIQ remains `0.1.0-alpha.2`, Public Alpha (Experimental). BM3 is not established.
Internal M-level ≠ Public BM-level. Implementation ≠ Qualification; Qualification ≠ External
Reproduction; Reliability ≠ Validity; Determinism ≠ Validity; Synthetic Fixture ≠ Empirical Evidence;
Pack Admission ≠ Scientific Validation; BM2 ≠ BM3; BM3 ≠ BM4; CI Pass ≠ Production Readiness;
Capability ≠ Adoption; Same Score ≠ Human-AI Equivalence; Observed ≠ Inferred.

## Identity and scope

Benchmark `semantic_core_pilot@0.1.0`, evaluator `semantic_core_rule_evaluator@0.1.0`,
pack `semantic_core_pilot@0.1.0`, case schema `0.1.0` and response schema `0.1.0` have
separate version scopes. Exactly 24 newly authored synthetic first-party cases: eight Meaning &
Context Behavior, eight Epistemic Boundary, eight Bias Resistance. No case 25.
The existing constructs `meaning_context_behavior`, `uncertainty_evidence_boundary` and
`bias_mechanism_reasoning` directly cover preservation/disambiguation, supplied-evidence separation
and identification of inference-distorting mechanisms. No new construct is needed.
Canonical registries bind the executable path, with `UNVALIDATED_PROXY`, `NOT_PROMOTED`, empty
calibration/validation/reproduction/promotion evidence. Execution never mutates those registries.
The public BM2 claim rests on executable code and automated tests, not an internal M-level conversion.

## Historical source audit

Research input only: [SemantIQ benchmark research](../SemantIQ-Benchmarks.pdf), pages 81–82
(Meaning Coherence and Context Integrity), 136–142 (WIF design), 158–161 (CBF design), and
[historical test manual](../SMF_Benchmark_Testhandbuch.pdf), especially pages 1–2.
The manual describes 84 broad prose prompts; the research includes a 49-prompt WIF catalog and
21-item CBF catalog. This pilot does not implement the complete historical SMF/WIF/CBF suites.
Historical design ancestry is retained for meaning preservation, context-sensitive interpretation,
missing-evidence/fact-fiction boundaries and controlled reasoning traps. Historical conversational
scores, confidence scales, scientific-validity assertions, certification, ranking authority,
first-in-world and human-equivalence claims are rejected as current evidence. No historical prompt
catalog is copied. No psychological or medical diagnosis is performed.

Architecture sources reviewed: [S01](../research/core/S01_CORE_STATE_RECONCILIATION.md),
[S02](../research/core/S02_BENCHMARK_REGISTRY_AND_LIFECYCLE.md),
[S03](../research/core/S03_MEASUREMENT_AND_METRIC_FRAMEWORK.md),
[S04](../research/core/S04_EVALUATOR_LABORATORY.md),
[S05](../research/core/S05_BENCHMARK_RELIABILITY_LABORATORY.md),
[lifecycle](BENCHMARK_LIFECYCLE.md), [pack contract](BENCHMARK_PACK_CONTRACT.md).
Historical SMF remains unresolved at BM0; no unrelated benchmark is promoted.

## Case and response contracts

[Case schema](../../schemas/semantic-core-case.schema.json) is Draft 2020-12, runtime machine
validated with Ajv. Every payload carries schema version, stable case/dimension identity, observable
target, prompt, supplied context, bounded options, eligible response states, exact oracle, provenance
and limitations. Additional fields are rejected. Option IDs must be unique and the oracle must name
an offered option. Scientific maturity and governance approval are not case fields.

[Response schema](../../schemas/semantic-core-response.schema.json) accepts only:

```json
{"schemaVersion":"0.1.0","caseId":"meaning_context_01_paraphrase","status":"ANSWER","selectedOptionId":"green_all"}
```

or `schemaVersion`, `caseId`, `status: ABSTAIN` with no selected option. No hidden chain-of-thought,
scratchpad, confidence, rationale or model state is requested or scored. Supplied context is the
closed evidence universe. `insufficient_evidence` is an ordinary offered answer ID, scorable as
correct where it matches the declared oracle; it is distinct from abstention.

The evaluator compares exact option IDs with no whitespace/case normalization, fuzzy matching,
embeddings or model judge. It retains case/dimension identity and `scientificAuthority: NONE`.
Undefined response = MISSING; schema invalid, unknown option or wrong case identity = MALFORMED;
ABSTAIN = ABSTAINED; schema-valid wrong offered answer = INCORRECT; exact oracle = PASSED.
A thrown/rejected subject adapter call = SUBJECT_ERROR; failure text is not exposed.
Invalid case payloads or evaluator failures halt execution and produce no fabricated report.

## Metrics and missingness

All metric versions are `0.1.0`:

- `semantic_core_eligible_cases`: count of PASSED + INCORRECT cases across the pilot.
- `semantic_core_passed_cases`: count of PASSED cases across the pilot.
- `semantic_core_meaning_context_pass_proportion`: PASSED / eligible evaluated cases in Meaning & Context.
- `semantic_core_epistemic_boundary_pass_proportion`: PASSED / eligible evaluated cases in Epistemic Boundary.
- `semantic_core_bias_resistance_pass_proportion`: PASSED / eligible evaluated cases in Bias Resistance.

Counts are evaluator-specific benchmark-independent S03 definitions used only by this bound pilot;
proportions bind each dimension's existing construct. Numeric outputs are canonical S03 MetricResult
records with exact identities, computation lineage and pack digest provenance. No overall proportion,
weights, scientific threshold, calibrated probability or universal semantic-intelligence score exists.
MISSING, MALFORMED, ABSTAINED and SUBJECT_ERROR are excluded from denominators, counted separately
in stateCounts and retained per case. They are never silently zero. Zero eligible cases returns
MISSING/INSUFFICIENT_EVIDENCE for all metrics; dimension proportions retain denominator zero.
The canonical metric contract requires at least one eligible observation for numeric results.
Conditional pass proportions must be read with coverage/missingness, which can select the sample.
All measurement paths remain uncalibrated and unvalidated; no empirical reliability is established.

## Pack and execution

[Manifest](../../fixtures/benchmark-packs/semantic-core-pilot-0.1.0/manifest.json) binds exact
benchmark, evaluator, five metric versions and all 24 ORIGINAL_BYTES SHA-256 case digests.
Rights are FIRST_PARTY_OR_PROJECT under the root [MIT license](../../LICENSE); provenance honestly
records new AI-authored synthetic project fixtures. No secrets, private data or external dataset
is included. Exposure is tier_a_public_reference: cases and oracles are public and contaminable.

Phase 2 admission and path rules are reused unchanged. The additive readBenchmarkPackCase helper
reuses the bounded safe reader and rechecks digests before family payload parsing. The runner first
admits the pack, validates all payloads/identities and the 8/8/8 inventory, then calls the trusted
application-supplied adapter with a detached input containing no oracle/provenance. Subject text
is data. No fixture code, shell command, external URL or arbitrary remote ingestion is executed.
The existing stable-tree assumption applies; concurrent hostile writers are outside the portable
filesystem guarantee.

runSemanticCorePilot(packRoot, subject) is exported by the benchmark package. The focused
semantic-core-pilot test provides all-correct oracle-backed, deliberately wrong, missing, malformed,
abstaining and throwing adapters. These prove engineering plumbing only. No live provider,
real-model performance, external reproduction or BM3 qualification is established. No evidence
package or S05 scientific reliability record is registered from synthetic repeats.

## Inventory

| Case ID | Dimension | Observable target |
| :--- | :--- | :--- |
| `meaning_context_01_paraphrase` | meaning_context | Preserve meaning under paraphrase |
| `meaning_context_02_ambiguity` | meaning_context | Resolve an ambiguous term from context |
| `meaning_context_03_context_shift` | meaning_context | Change interpretation when context changes |
| `meaning_context_04_role_constraint` | meaning_context | Maintain explicit role constraints |
| `meaning_context_05_same_wording` | meaning_context | Distinguish identical wording across situations |
| `meaning_context_06_unsupported` | meaning_context | Reject an unsupported interpretation |
| `meaning_context_07_relation` | meaning_context | Preserve a declared semantic relation |
| `meaning_context_08_equivalence` | meaning_context | Recognize equivalence despite surface differences |
| `epistemic_boundary_01_missing_property` | epistemic_boundary | Recognize insufficient evidence |
| `epistemic_boundary_02_hypothesis` | epistemic_boundary | Separate observation from hypothesis |
| `epistemic_boundary_03_citation` | epistemic_boundary | Avoid fabricating a missing citation |
| `epistemic_boundary_04_supported_claim` | epistemic_boundary | Identify a supported claim |
| `epistemic_boundary_05_unsupported_claim` | epistemic_boundary | Mark an unsupported claim |
| `epistemic_boundary_06_fiction` | epistemic_boundary | Preserve the fact/fiction boundary |
| `epistemic_boundary_07_unknown_entity` | epistemic_boundary | Avoid converting an unknown into a factual answer |
| `epistemic_boundary_08_boundary_paraphrase` | epistemic_boundary | Maintain evidence boundary across paraphrase |
| `bias_resistance_01_confirmation` | bias_resistance | Identify selective evidence filtering |
| `bias_resistance_02_dichotomy` | bias_resistance | Recognize an omitted third alternative |
| `bias_resistance_03_causality` | bias_resistance | Avoid spurious causal inference |
| `bias_resistance_04_single_observation` | bias_resistance | Reject generalization from one observation |
| `bias_resistance_05_anchoring` | bias_resistance | Ignore an irrelevant numerical anchor |
| `bias_resistance_06_sunk_cost` | bias_resistance | Exclude unrecoverable past costs from future comparison |
| `bias_resistance_07_availability` | bias_resistance | Use complete counts instead of vivid distractors |
| `bias_resistance_08_attribution` | bias_resistance | Identify unsupported attribution from limited context |

## Qualification handoff

See the versioned [Phase 4 qualification plan](SEMANTIC_CORE_PILOT_QUALIFICATION_PLAN.md).
Phase 3 stops at review; no release, tag, leaderboard or Cyber work is authorized here.

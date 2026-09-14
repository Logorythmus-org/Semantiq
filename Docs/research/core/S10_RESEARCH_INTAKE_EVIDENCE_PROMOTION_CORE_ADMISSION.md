# S-10 Research Intake, Evidence Promotion, and Core Admission

**Status:** canonical Core architecture; no candidate promoted
**Authority:** `SCIENTIFIC_AUTHORITY = NONE`; assessment recommendations only
**Scope:** discovery through governed Core-admission recommendation

## Decision

S-10 provides versioned research-intake, construct, operationalization, typed evidence, promotion-assessment, governance-decision, and lifecycle-reassessment records. It orchestrates S-02 through S-09 and never mutates the S-02 registry. Actual maturity or Core promotion remains a separate governed S-02 decision.

The following distinctions are structural:

`DISCOVERY != EVIDENCE`
`IDEA != CONSTRUCT`
`CONSTRUCT != OPERATIONALIZATION`
`OPERATIONALIZATION != METRIC`
`METRIC != VALID MEASURE`
`IMPLEMENTED != SCIENTIFICALLY SUPPORTED`
`TESTED != CALIBRATED`
`RELIABLE != VALID`
`REPRODUCIBLE != VALID`
`COMPARABLE != EQUIVALENT`
`EVIDENCE != PROOF`
`PROMOTION != PUBLICATION`
`PUBLICATION != CORE ADMISSION`
`CORE ADMISSION != PERMANENCE`
`RETRACTION != DELETION`

Implementation quality, test volume, citations, evidence-record count, or successful runs cannot substitute for missing scientific evidence. One unresolved critical contradiction cannot be averaged away by many supporting records.

## Verified baseline

S-10 starts from protected `main` commit `34b3f9f8f3e1a8a066aa8180456a8e220e2d9a92`, whose tree is `f31bbdc1ecf7d7dad651e39c3744dda8ecd1f196`. PR #63 merged reviewed S-09 head `f05bb8f704935b64a8551efe927b96d33ac4a88d` while preserving its tree exactly.

## Discovery and reconciliation

| Mechanism | Classification | S-10 treatment |
| --- | --- | --- |
| S-02 benchmark lifecycle and Core promotion | `CANONICAL_CURRENT` | sole registry mutation authority |
| S-03 metric calibration and validity | `CANONICAL_CURRENT` | referenced; never inferred from execution |
| S-04 evaluator identity and determinism | `CANONICAL_CURRENT` | referenced as evaluator evidence |
| S-05 reliability studies | `CANONICAL_CURRENT` | reliability stays distinct from validity |
| S-06 Human-as-Judge | `CANONICAL_CURRENT` | governed human evidence only |
| S-07 HIB candidate | `CANONICAL_CURRENT` | remains draft and unpromoted |
| S-08 Human-AI comparability | `CANONICAL_CURRENT` | required where applicable; never inferred |
| S-09 evidence and verification | `CANONICAL_CURRENT` | consumed without increasing authority |
| legacy claim/promotion helpers | `PARTIAL` | retained within existing domains |
| release and test evidence | `ENGINEERING_ONLY` | cannot establish scientific gates |
| historical HACS/research vision | `HISTORICAL_ONLY` | not current implementation truth |
| count-based confidence or automatic admission | `CONFLICTING` | rejected |

No second benchmark lifecycle is introduced. `PromotionAssessment` is an immutable recommendation input to later governance; it is not an S-02 transition.

## Research intake

`ResearchIntake` uses `researchIntakeId + researchIntakeVersion` and a semantic SHA-256 digest over canonical JSON. Audit timestamps, request identifiers, reviewer comments, and ordering of set-like fields do not alter semantic identity.

An intake records question, provenance, motivation, proposed construct and phenomenon, target population or system, possible tasks, observable behavior, operationalizations, metric/evaluator relationships, assumptions, limitations, competing explanations, disconfirming evidence, rights, Cyber routing, destination, evidence references, and status.

Outcomes include `REJECTED`, `ARCHIVED`, `WATCH`, `RESEARCH_CANDIDATE`, `NEEDS_OPERATIONALIZATION`, `NEEDS_EVIDENCE`, and `READY_FOR_FORMAL_ASSESSMENT`. Discovery does not have to become a benchmark.

Provenance uses the S-02 vocabulary: `HUMAN_DIRECTION`, `AI_ASSISTED`, `AI_GENERATED`, `THIRD_PARTY_SOURCE`, `PROJECT_EXISTING_SOURCE`, and `MIXED`. Rights routing remains `FIRST_PARTY_OR_PROJECT`, `OPEN_CLEARED`, `PUBLIC_REFERENCE_ONLY`, `RESTRICTED_REVIEW_REQUIRED`, `UNKNOWN_RIGHTS`, or `PROHIBITED`. Provenance is not scientific quality; open access is not redistribution permission.

## Construct model

`ConstructAssessment` distinguishes a conceptual construct from tasks, prompts, items, metrics, evaluators, scores, and benchmark families. It records inclusion and exclusion boundaries, observable implications, competing constructs, confounds, domains/populations, supporting and challenging evidence, alternative operationalizations, maturity, and limitations.

There is no universal construct score. A clear definition does not establish construct validity. A `VALIDATED_BY_REFERENCED_EVIDENCE` status requires explicit evidence references and remains subject to independent review.

## Operationalization

An `Operationalization` makes this chain explicit:

`Construct → Task/Stimulus → Response → Observable Feature → Metric → Evaluator → Interpretation`

Every transition has a binding reference, assumptions, failure modes, and evidence references. Missing links or assumption-free transitions fail validation. Multiple operationalizations may address one construct, and a metric may participate in more than one construct-specific interpretation.

## Typed evidence

`PromotionEvidenceRecord` represents theoretical, implementation, unit/integration test, synthetic, empirical, calibration, reliability, validity, robustness, anti-gaming, human-rater, human-subject, comparability, reproduction, replication, external-validation, contradictory, and negative-result evidence.

Its disposition separately records supporting evidence, contradiction, negative result, failed reproduction, failed replication, or methodological criticism. Materiality and resolution remain explicit. Records are never summed into scalar confidence. Contradictory evidence does not delete older support, and negative results remain first-class evidence.

## Promotion gates

The assessment vocabulary distinguishes `CONCEPT`, `RESEARCH_CANDIDATE`, `SPECIFIED_CANDIDATE`, `EXECUTABLE_CANDIDATE`, `EMPIRICALLY_STUDIED`, `CALIBRATED`, `VALIDATED`, `CORE_ELIGIBLE`, and `CORE`.

Each required gate is assessed as `SATISFIED`, `PARTIALLY_SATISFIED`, `UNSATISFIED`, `UNKNOWN`, or `NOT_APPLICABLE`. Critical partial, unknown, and unsatisfied states block advancement. `NOT_APPLICABLE` is accepted only with an explicit justification retained for governed review.

Gate families cover stable identity, construct, operationalization, metric/evaluator semantics, implementation, empirical evidence, calibration, reliability, validity, robustness, anti-gaming, S-09 package, reproducibility, rights, documentation, versioning, deprecation, contradictions, human protocol/governance, S-08 comparability, common scale, population/denominator, purpose, and governance approval.

The engine returns `NOT_ELIGIBLE`, `INSUFFICIENT_EVIDENCE`, `ELIGIBLE_FOR_REVIEW`, `BLOCKED_BY_CONTRADICTION`, or `BLOCKED_BY_GOVERNANCE`. It never returns autonomous scientific approval.

## Core admission and governance

Core eligibility is more demanding than implementation. General candidates require stable identities, construct and operationalization contracts, metric/evaluator semantics, S-09 evidence, empirical/calibration/reliability/validity/robustness/anti-gaming evidence where applicable, limitations, cleared rights, documentation, versioning, and lifecycle policy.

Human candidates additionally require protocol, privacy/ethics/legal review, sampling, missingness, rater/subject separation, and population limitations. Human-AI candidates also require the exact S-08 comparability assessment, common-scale evidence for numeric comparisons, compatible population/denominator, and purpose limitation.

`PromotionRequest`, `PromotionAssessment`, and `PromotionDecision` are separate. Only explicit `HUMAN_GOVERNANCE` evidence can produce `APPROVED_BY_GOVERNANCE`. Even then the decision records `benchmarkRegistryMutationRequired = true` and `benchmarkRegistryMutated = false`; S-02 must perform any separately authorized transition.

No current benchmark gains Core status because S-10 exists.

## Contradiction and negative evidence

Open material contradictions, failed replications, and material methodological criticism produce `BLOCKED_BY_CONTRADICTION`. Failed reproduction and negative results remain identifiable. A failed replication does not prove the original false; a successful replication does not establish universal validity.

Evidence closure means required references are accounted for under a contract. It does not mean truth, validity, calibration, causal identification, or scientific completeness.

## Demotion, retraction, and history

`LifecycleReassessment` distinguishes `DEPRECATION`, `DEMOTION`, `RETRACTION`, `SUPERSESSION`, and `ARCHIVAL`. Every record preserves historical evidence and audit history and leaves the actual S-02 mutation pending. Retraction does not delete evidence; deprecation does not destroy reproducibility; superseded metrics remain historically interpretable.

## S-09 boundary

S-09 `EvidencePackage` references may support gates, but `VERIFIED_INTERNAL_CONSISTENCY` does not satisfy promotion evidence by itself. Replay readiness is not validity, reproduction is not replication, and hash equality is not scientific truth or authenticity. S-10 does not increase S-09's `INTERNAL_CONSISTENCY_ONLY` verifier authority.

## Scientific boundaries

`METRIC != VALIDATED_MEASURE`
`UNCERTAINTY != RELIABILITY`
`RELIABILITY != VALIDITY`
`VALIDITY != COMPARABILITY`

No calibration, reliability, or validity coefficient is invented. The architecture contains contracts and evidence references, not substitute psychometric estimators.

HIB remains `hib_research_candidate@0.1.0`: `SCAFFOLDED`, `CALIBRATION_REQUIRED`, `DRAFT`, `NOT_PROMOTED`; AI suitability is `UNASSESSED`; Human-AI comparability is `UNESTABLISHED`.

Historical HACS remains historical, current agent-resilience HACS remains separate, and bare HACS remains ambiguous. Pairability, common items, common metric names, or equal numbers cannot establish comparability, equivalence, or superiority.

## Representative synthetic cases

| Case | Expected boundary |
| --- | --- |
| A | paper without operationalization → `WATCH / NEEDS_OPERATIONALIZATION` |
| B | tested implementation without scientific evidence → executable, not scientifically promotable |
| C | repeatable metric without construct validity → not validated |
| D | calibration with insufficient validity → blocked below validated/Core |
| E | supporting and contradictory evidence → conflict preserved, no averaging |
| F | reproduced computation plus failed replication → reproduction retained, replication concern explicit |
| G | human candidate without protocol/privacy/sampling clearance → Core admission blocked |
| H | insufficient S-08 comparability → comparison promotion blocked |
| I | unknown third-party redistribution rights → reference may remain, public executable promotion blocked |
| J | mature candidate without governance → `ELIGIBLE_FOR_REVIEW`, not Core |
| K | admitted benchmark receives material contradiction → reassessment/demotion, no deletion |
| L | deprecated benchmark remains reproducible → historical package preserved |

All cases are deterministic synthetic architecture fixtures. They are not empirical evidence, human data, validation, calibration, or scientific findings.

## Security, privacy, rights, and scope

Portable records reject credential/token/private-key patterns, direct PII fields, private absolute paths, and prohibited scientific or Human-AI superiority states. Environment details remain governed by S-09. Restricted material is referenced rather than embedded merely to create self-containment.

S-10 adds no UI, CLI, HTTP route, database, cloud service, provider, external model call, dependency, production behavior, human recruitment, real human data, Cyber capability, license change, publication, benchmark promotion, or Core admission.

## Limitations and future work

The architecture does not judge source authenticity, conduct peer review, estimate psychometric quantities, resolve methodological disputes, or execute registry transitions. Real governance policy, ethics/legal review, empirical protocols, publication workflow, persistence, and public admission require separate authorization and review.

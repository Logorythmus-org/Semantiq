# S-01 Core gap register

Baseline: `d61fbb67a307c9070a2e1e2fb229cdabe2097da3`. Priorities reflect risk of misinterpreting existing outputs and dependencies, not estimated schedules. No implementation is authorized by this register.

## G1.1 — G1 BENCHMARK_CATALOG

- **Missing**: Canonical registry/lifecycle and historical name reconciliation
- **Why it matters**: Fixed demos and research names currently look like benchmark implementations.
- **Foundation**: C01,C04; producer fixtures; historical PDFs
- **Dependencies**: S01
- **Research**: Define construct/subject boundaries and historical identity crosswalk.
- **Engineering**: Registry manifest, explicit synthetic status, immutable versions, retirement rules and contract links.
- **Risk**: Misleading suite counts and accidental claim promotion.
- **Priority**: CRITICAL
- **Destination**: S02

## G2.1 — G2 METRICS

- **Missing**: Measurement contracts and honest uncertainty across paths
- **Why it matters**: Length scores and fixed margins can be mistaken for semantic measurement or inferential confidence.
- **Foundation**: C03,C05,C06
- **Dependencies**: S02
- **Research**: Define constructs, scales, denominators, missingness, estimator assumptions and validation plans.
- **Engineering**: Unify metric identifiers; replace unsupported significance/confidence outputs in a separately approved implementation gate.
- **Risk**: Invalid rankings and overstated confidence.
- **Priority**: CRITICAL
- **Destination**: S03

## G3.1 — G3 EVALUATORS

- **Missing**: Evidence-linked evaluator and model execution pipeline
- **Why it matters**: SDK and producer passing outputs do not measure a model response.
- **Foundation**: C04,C13,C17
- **Dependencies**: S02,S03
- **Research**: Reference items, judge bias and selection protocol.
- **Engineering**: Runner/evaluator interfaces, raw-response recording, rubric versioning, errors/retries and evaluator identity.
- **Risk**: Synthetic claims presented as observations.
- **Priority**: CRITICAL
- **Destination**: S04

## G4.1 — G4 MEASUREMENT_SCIENCE

- **Missing**: Reliability and validity studies
- **Why it matters**: Existing arithmetic and synthetic tests cannot validate intended constructs.
- **Foundation**: C06,C09,C19
- **Dependencies**: S03,S04; S06 for human-calibrated promotion
- **Research**: Test-retest, power/sampling, agreement, small-sample behavior, robustness, contamination and held-out validation.
- **Engineering**: Study executor, preregistered analysis, perturbation runners and evidence-linked results.
- **Risk**: Unsupported psychometric or cognitive conclusions.
- **Priority**: HIGH
- **Destination**: S05

## G5.1 — G5 HUMAN_RATING

- **Missing**: Blind independent rating and adjudication
- **Why it matters**: Review comments and human enums do not provide calibrated ratings.
- **Foundation**: C10,C15; historical pp.275-279
- **Dependencies**: S02,S03; feeds S04/S05 calibration
- **Research**: Rubric anchors, rater qualification, agreement and disagreement protocol.
- **Engineering**: Accessible UI, seeded assignment, masking, rating ledger, adjudication and calibration reports.
- **Risk**: Bias, leakage and untraceable consensus.
- **Priority**: HIGH
- **Destination**: S06

## G6.1 — G6 HUMAN_BENCHMARKING

- **Missing**: Human participant benchmark protocol and runner
- **Why it matters**: HIB is historical only.
- **Foundation**: C11; historical pp.198-204
- **Dependencies**: S05 pilot evidence,S06
- **Research**: Sampling, consent, accessibility, task administration, scoring validity and population limits.
- **Engineering**: Participant task sessions, response/timing capture and versioned administration.
- **Risk**: Unjustified human intelligence/normative profiling claims.
- **Priority**: HIGH
- **Destination**: S07

## G7.1 — G7 HUMAN_AI_COMPARISON

- **Missing**: Comparable human/model design
- **Why it matters**: Identical prompt text alone does not establish equivalent measurement.
- **Foundation**: C12,C06; historical HACS
- **Dependencies**: S07,S04,S05
- **Research**: Task/mode equivalence, confounds, uncertainty and disaggregated profiles.
- **Engineering**: Shared case protocol and separately labeled subject groups/reports.
- **Risk**: Misleading human-AI superiority claims.
- **Priority**: HIGH
- **Destination**: S08

## G8.1 — G8 REPRODUCIBILITY

- **Missing**: Complete run provenance, durability and verifiable evidence semantics
- **Why it matters**: Defaults and generated signatures can imply evidence that was never collected.
- **Foundation**: C07,C08,C16
- **Dependencies**: S02; extend in S04/S05
- **Research**: Define repeatability vs reproducibility vs auditability for each execution mode.
- **Engineering**: Unknown-preserving metadata, actual payload hashes, stable task versions, durable storage and clean reproduction recipe.
- **Risk**: False auditability, lost runs, unverifiable model response provenance.
- **Priority**: CRITICAL
- **Destination**: S02

## G9.1 — G9 REPORTING

- **Missing**: Evidence-aware reports and usable UI
- **Why it matters**: Current reports may carry unvalidated labels and static UI declarations.
- **Foundation**: C15,C18
- **Dependencies**: S02,S03
- **Research**: Understand uncertainty/limitations comprehension.
- **Engineering**: Show demo/heuristic status, exclusions, evidence links, justified intervals and accessible views.
- **Risk**: Readers interpret output badges as certification.
- **Priority**: HIGH
- **Destination**: S03

## G10.1 — G10 RESEARCH_INTAKE

- **Missing**: Versioned historical/research promotion pipeline
- **Why it matters**: Historical 84 prompts and broader variants are not a production catalog.
- **Foundation**: C20; governance/research-intake-template.json
- **Dependencies**: S02
- **Research**: Reconcile variants, provenance, intended uses and duplication; reject untestable claims.
- **Engineering**: Intake metadata, explicit review decisions, non-runtime research records and promotion evidence links.
- **Risk**: Historical rhetoric or unreviewed material becomes a public measurement claim.
- **Priority**: HIGH
- **Destination**: S02

## G11.1 — G11 COMMUNITY_ECOSYSTEM

- **Missing**: Verified contribution and independent reproduction evidence
- **Why it matters**: Registry examples and partner records do not demonstrate adoption or independent validation.
- **Foundation**: C20,C09,C08
- **Dependencies**: S02; mature S09/S10
- **Research**: Independent replication criteria and reviewer incentives/conflicts.
- **Engineering**: Contributor conformance kit, reproducible submissions, ownership and support policy.
- **Risk**: Unmaintained benchmarks and overstated ecosystem evidence.
- **Priority**: MEDIUM
- **Destination**: S09

## Five largest gaps

1. G1.1: canonical registry, identity and lifecycle.
2. G8.1: truthful, complete, durable provenance and reproduction.
3. G2.1: construct/metric contracts and justified uncertainty.
4. G3.1: actual response/evaluator execution instead of synthetic success.
5. G4.1: empirical calibration, reliability and validity evidence.

Human rating is a critical dependency for measures requiring human calibration; it is sequenced before those reliability promotions rather than treated as a late cosmetic UI.

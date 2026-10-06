# Semantic Core Pilot Phase 4 qualification plan

**Status**: `PLAN` — plan version `0.1.0`; no execution authorization or BM3 claim.

Target: `semantic_core_pilot@0.1.0`. BM3 is not established. BM3 remains internal and does not imply
external reproduction, validity, calibrated measurement or leaderboard authority.

## Identity controls

Before collection, freeze benchmark/pack/schema versions, canonical pack digest, all ORIGINAL_BYTES
case digests, evaluator `semantic_core_rule_evaluator@0.1.0`, all five metric `0.1.0` identities,
evaluator configuration digest and implementation commit. Resolve these from the Phase 3 manifest
and admitted digest, rather than mutable names. Record exact genuine model ID/snapshot, provider,
transport/runtime/SDK versions, operating environment, prompt serialization and digest, sampling
parameters, seed availability, timestamps/time window and retry policy. Mutable model aliases must
be explicitly disclosed and differing snapshots must not be pooled.

## Real subject and repetition

BM3 consideration requires at least one genuine non-mock model/provider path. Oracle-backed test
adapters and synthetic CI repeats are excluded from qualification evidence. Prespecify a repeated-run
study before collection, including at least two complete scheduled 24-case executions per fixed
condition (the S05 estimator minimum, not a scientific significance claim). Additional repetitions
must be justified against the study question and expected precision; no arbitrary confidence or
scientific cutoff is inferred from this minimum. Prespecify what is held constant and deliberately
varied, seeds, time windows and operational acceptance criteria with rationale. Preserve every trial,
including failures and retry attempts; never replace a failed attempt with a successful retry.

## Reliability and missingness

Reuse S05 EXACT_REPEATABILITY for exact comparable conditions, NUMERIC_RUN_TO_RUN_STABILITY for
finite same-metric results and CATEGORICAL_AGREEMENT for matched case decisions. Stochastic
methods apply only when their actual declared contracts are met; the deterministic evaluator's
classification does not turn a stochastic subject into a stochastic evaluator automatically.
Retain subject variation separately with correct S04 provenance. Schema-only TEST_RETEST or
ordinal/rater methods must not be described as implemented estimators. Report n, descriptive
variability, pair/sample accounting, exclusions and disagreements with no invented GOOD/POOR
scientific threshold. Reliability ≠ Validity.

Count scheduled, attempted, passed, incorrect/failed, malformed, abstained, missing, provider-error
and evaluator-error executions separately. Map Phase 3 SUBJECT_ERROR to provider-error only when
actual provider provenance supports that classification; retain transport details in controlled
records without secrets. A halted evaluator invocation is an evaluator-error event, never a score.
Keep conditional pass denominators and coverage explicit; zero eligible observations is missing,
not zero performance. Quantify selection from exclusion and do not cherry-pick completed runs.

## Integrity and evidence

Verify case/prompt/pack/evaluator digests before every run; fail closed on substitution. Cases and
oracles in this pack are public, so disclose exposure and possible contamination. A protected or
rotating future pack requires separately versioned cases, rights review and exposure controls; never
silently relabel these public cases as held-out. Record tool/network boundaries and prevent oracle
leakage through provider inputs. Secret credentials remain outside prompts/configuration/evidence.

Create exact S04 configurations/execution references and S03 metric records with case/run lineage.
Prespecify S05 study definitions, execution references and estimates. Bind canonical S09 evidence
packages, artifact hashes, reproduction instructions and provenance to exact versions. Review
integrity, missingness, repeated real-subject evidence and the prespecified operational gates under
existing governance; only a separate explicit reviewed decision may assign BM3. Neither pack
admission, a real-provider score nor an S05 estimate promotes maturity automatically.

## Independence boundary

Project-controlled qualification remains internal. No external reproduction is implied. BM4 requires
separate submitted, provenance-reviewed, independence-reviewed and accepted evidence. Public Alpha
(Experimental), uncalibrated/unvalidated measurement and no human-AI equivalence remain explicit.
No Phase 4 collection, live provider credentials, release or leaderboard action occurs in Phase 3.

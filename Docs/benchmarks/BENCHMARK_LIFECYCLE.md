# Benchmark Lifecycle & Public Status Policy

**Status**: `NORMATIVE`  
**Applies to**: public SemantIQ benchmark families, packs, suites, and leaderboard eligibility  
**Software maturity boundary**: SemantIQ remains `0.1.0-alpha.2` — Public Alpha (Experimental)

---

## Purpose

SemantIQ separates benchmark design, implementation, internal qualification, external reproduction,
and public comparative use. A benchmark name, fixture, specification, completed example run, or
working evaluator is not by itself evidence that a benchmark has been independently reproduced or
is suitable for a public leaderboard.

This lifecycle is independent of:

- the SemantIQ software version;
- package versions;
- schema or API versions;
- evidence tiers used by the Evidence Engine;
- claim-review or release status.

## Lifecycle

| State | Name | Minimum meaning |
| :--- | :--- | :--- |
| **BM0** | **Research Candidate** | A proposed, historical, or exploratory benchmark idea. It may have prompts, notes, mock fixtures, or research artifacts, but no current implementation claim is implied. |
| **BM1** | **Specified** | The construct, scope, inputs/fixtures, evaluator or oracle, scoring semantics, limitations, provenance expectations, and licensing/data requirements are documented. |
| **BM2** | **Implemented** | Executable repository implementation exists and is exercised by automated tests. This is an implementation claim, not a reliability or external-validation claim. |
| **BM3** | **Internally Qualified** | Project-controlled qualification establishes the declared repeatability, reliability, integrity, and regression gates for the versioned benchmark pack. |
| **BM4** | **Externally Reproduced** | An independent reproduction has been submitted, provenance-reviewed, independence-reviewed, and explicitly accepted under repository governance. |
| **BM5** | **Leaderboard Eligible** | Governance explicitly authorizes versioned public comparative/ranking use, with the benchmark protocol, uncertainty/reliability reporting, and anti-gaming conditions recorded. |

## Promotion rules

1. Benchmark state is evidence-bounded. Design intent does not promote a benchmark.
2. A repository fixture whose own run field says `completed` describes that fixture/run record; it
   does not assign BM3, BM4, or BM5 to the benchmark family.
3. Deterministic mocks, synthetic representative runs, and owner-controlled CI are internal
   evidence only.
4. BM3 is not external replication.
5. BM4 requires reviewed provenance and reviewed independence; self-attestation is insufficient.
6. BM5 requires a separate governance decision. BM4 does not automatically authorize a leaderboard.
7. A benchmark may be demoted if its specification, oracle, fixtures, reproducibility, integrity, or
   public evidence no longer supports its previous state.
8. Benchmark maturity does not imply SemantIQ software production readiness, certification,
   adoption, safety, or universal scientific validity.
9. Evaluation must be grounded in observable inputs, outputs, traces, artifacts, and declared
   metadata. Benchmark design must not assume access to hidden model chain-of-thought.

## Current public-index snapshot

This table is a conservative source audit for the benchmark families currently named in
`Docs/benchmarks/README.md`. It is not a complete historical research catalog.

| Public label | Current state | Repository evidence | Boundary |
| :--- | :--- | :--- | :--- |
| **Semantic Core Pilot** | **BM2 — Implemented** | `semantic_core_pilot@0.1.0`, its 24-case governed pack, deterministic evaluator and focused tests. | BM3 is not established; synthetic engineering execution is not qualification or external reproduction. Historical SMF/WIF/CBF suites remain unresolved and are not claimed implemented. |
| **SMF Benchmark Suite** | **BM0 — Research Candidate** | A synthetic representative fixture exists at `fixtures/benchmarks/smf_representative_run.json`. | The current public index links SMF to `specs/036-production-mvp-integration-alpha.md`, but that file specifies Production MVP integration rather than a canonical SMF benchmark. No BM1+ claim is made until the namespace/specification is reconciled. |
| **HACS Long-Horizon Suite** | **BM2 — Implemented** | `LongHorizonTestingEngine`, long-horizon contracts, and `tests/unit/long-horizon.test.ts` exist; the reviewed long-horizon specification documents the model. | Current evidence supports implementation under project-controlled tests, not current BM3 qualification, external reproduction, or leaderboard eligibility. The representative HACS fixture is deterministic/mock evidence. |
| **Multimodal Vision Suite** | **BM0 — Research Candidate (Historical)** | A synthetic representative fixture exists at `fixtures/benchmarks/vision_representative_run.json`; the public index already marks the suite historical. | `Docs/ADAPTER_GUIDE.md` is an adapter-boundary document, not a current canonical Vision benchmark specification. No BM1+ claim is made. |

## Naming rule

A benchmark acronym must have one canonical public meaning at a given lifecycle/version boundary.
If historical research used the same acronym differently, the repository must preserve that record
as historical rather than silently merging meanings.

For Phase 1, **SMF remains unresolved as a canonical benchmark acronym** until a dedicated
specification or an explicit migration/deprecation decision is reviewed. The legacy link to the
Production MVP integration specification must not be treated as a benchmark specification.

## Relationship to evidence and public claims

A benchmark result should identify at least:

- benchmark family and pack version;
- benchmark lifecycle state;
- exact model/provider/runtime identity where available;
- fixture/data identity and license/provenance;
- evaluator/oracle version;
- execution environment and relevant parameters;
- uncertainty/reliability information when the benchmark reports comparative scores;
- evidence status and whether external reproduction is established.

SemantIQ's public scientific boundary remains governed by
[Known Limitations](../KNOWN_LIMITATIONS.md) and
[Scientific Guardrails](../SCIENTIFIC_GUARDRAILS.md).

## Phase 1 boundary

This document classifies existing public benchmark labels only. It does not:

- implement a new benchmark pack;
- change benchmark scoring/runtime semantics;
- publish a leaderboard;
- establish external validation;
- authorize SemantIQ Cyber benchmark execution;
- change the SemantIQ software version or release state.

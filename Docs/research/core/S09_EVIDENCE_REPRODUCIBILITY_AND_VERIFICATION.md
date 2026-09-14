# S-09 Evidence, Reproducibility, and Verification System

**Status**: `ARCHITECTURE`

**Scope**: canonical evidence packages, execution and environment manifests, internal-consistency verification, replay assessment, and reproduction records

**Baseline**: protected `main` at `5b40492a5cf2b392d492f9401e574f788eb53de3`

**Scientific authority**: `NONE`

**Verifier authority**: `INTERNAL_CONSISTENCY_ONLY`

## Decision

S-09 adds a portable Core evidence contract that can identify what produced a result, which exact
versions and artifacts were involved, what was intended and observed, which evidence is absent or
restricted, and whether the recorded material is internally consistent. It can assess whether an
execution has enough recorded material for a replay and can record a separate reproduction attempt.
It performs no external execution and grants no scientific authority.

The central boundaries are:

- `RESULT != EVIDENCE`
- `EVIDENCE != PROOF`
- `REPLAY != REPRODUCTION`
- `REPRODUCTION != REPLICATION`
- `HASH MATCH != SCIENTIFIC VALIDITY`
- `DETERMINISTIC EXECUTION != VALID MEASUREMENT`
- `TEST PASS != REPRODUCIBILITY`
- `REPRODUCIBLE != SCIENTIFICALLY VALIDATED`

An internally consistent package may still be non-replayable. A reproducible computation may
still have an unestablished scientific interpretation. Those outcomes are first-class rather than
errors hidden by a universal score.

## Verified baseline

PR #62 ended at reviewed head `795c44dde527b4e756d1f5125c93c43c65c2341a` and reviewed tree
`45304a85cc70607a6b1560e1842574053f2389a0`. It passed all twelve required remote checks and merged
as `5b40492a5cf2b392d492f9401e574f788eb53de3`. Protected `main` at S-09 start had that same SHA and
tree `45304a85cc70607a6b1560e1842574053f2389a0`; the merge policy therefore preserved the reviewed
S-08 tree exactly.

## Discovery and reconciliation

Repository discovery found multiple mechanisms with narrower or older meanings:

| Mechanism | Classification | S-09 treatment |
| --- | --- | --- |
| S-02 through S-08 Core records | `CANONICAL_CURRENT` | referenced by exact identity/version/digest |
| `canonicalJson` and `computeSha256` | `CANONICAL_CURRENT` | reused without a new digest algorithm |
| sandbox portable evidence package | `ENGINEERING_ONLY` | preserved; not made the Core scientific contract |
| research bundles | `PARTIAL` | retained as specialized export/research machinery |
| evidence execution manifests | `PARTIAL` | retained; S-09 adds cross-phase Core lineage |
| adapter/collective replay | `ENGINEERING_ONLY` | retained within existing execution boundaries |
| release reproducibility auditor | `ENGINEERING_ONLY` | retained for release artifact checks |
| digest-shaped legacy package signature | `CONFLICTING` | never treated as a cryptographic signature |
| boolean legacy `isReproducible` | `CONFLICTING` | not promoted to the dimensional S-09 vocabulary |

The older sandbox package computes a Merkle root and a digest-shaped `packageSignatureHex`. Hashing
does not authenticate a signer. S-09 therefore declares `SIGNATURE_STATUS = NOT_IMPLEMENTED` and
does not reinterpret that legacy field. Older release and research checks remain useful engineering
evidence, but their result labels do not establish S-09 replay, reproduction, replication, validity,
or scientific truth.

## Terminology

**Evidence record** is one versioned, digest-bound reference to supporting material. **Evidence
package** is a bounded canonical collection for one claim or result. **Execution manifest** records
what was intended and what was observed. **Artifact** is a material input, output, configuration,
rubric, dataset, fixture, trace, log, environment record, dependency lock, source snapshot, or
report.

**Verification** checks schema, digest, reference, closure, lineage, availability, and completeness
claims. It does not check scientific truth. **Replay** attempts another execution under the intended
same recorded conditions. **Reproduction** creates new evidence by independently obtaining a
materially equivalent result under a declared protocol. **Replication** is a new study testing
whether an underlying finding persists beyond the original execution.

**Engineering reproducibility** concerns software, configuration, and artifact behavior.
**Scientific reproducibility** concerns a declared empirical protocol and interpretation. Strong
engineering reproducibility supplies evidence but does not establish construct validity,
calibration, reliability, comparability, or benchmark maturity.

## Canonical subsystem

The subsystem is contained in `@tech-club/benchmark` alongside the S-02 through S-08 records:

- `evidence-types.ts` defines the portable contracts and bounded vocabularies.
- `evidence-definitions.ts` records discovery classifications, anti-overclaim invariants, and cases
  A–J.
- `evidence.ts` creates canonical manifests and packages, verifies internal consistency, assesses
  replay readiness, and records reproduction outcomes.

It adds internal package exports required by tests and downstream Core code. It adds no CLI, HTTP
route, SDK surface, UI, database, object store, archive format, cloud service, provider call, or new
runtime dependency.

## EvidencePackage

`EvidencePackage` binds one target to exact records, requirements, artifacts, an execution manifest,
an environment manifest, dimensional completeness, a typed evidence chain, determinism class,
reproducibility status, limitations, and explicit authority. Package modes are:

- `SELF_CONTAINED`: every artifact is embedded and redistribution is allowed.
- `PARTIALLY_SELF_CONTAINED`: some material is embedded and some remains external or restricted.
- `REFERENTIAL`: the package primarily points to separately governed material.

A digest without accessible bytes never makes an artifact available. A third-party reference never
grants redistribution rights. `RESTRICTED`, `REDACTED`, `UNAVAILABLE`, and `UNKNOWN` remain distinct.
The verifier rejects a false self-contained declaration.

Package identity excludes timestamps, request IDs, and local paths. Material records, requirements,
artifacts, manifests, completeness declarations, evidence-chain links, determinism, status, and
limitations affect the semantic digest. Set-like lists are sorted and deduplicated before canonical
serialization.

## Evidence records and S-02–S-08 lineage

Every `EvidenceRecordReference` has a scope, record identity/version, semantic digest, availability,
and provenance references. The scopes preserve the following boundaries:

| Phase | Retained evidence |
| --- | --- |
| S-02 | benchmark identity/version, construct, lifecycle, maturity, and evidence references |
| S-03 | metric identity/version, result, scale, missingness, denominator, uncertainty, calibration, and validity evidence |
| S-04 | evaluator identity/version, configuration digest, execution, determinism, rubric, model, and judge provenance |
| S-05 | reliability study definition/execution/estimate and constant/varied dimensions |
| S-06 | Human Judge study, assignment, presentation, rubric, rating, pseudonym, visibility, and evaluator execution |
| S-07 | Human-as-Subject study, session, presentation, item, response, language, tool policy, randomization, and pseudonym |
| S-08 | comparison definition/unit/assessment/observation/result, critical dimensions, populations, and limitations |

Packaging a record cannot alter it. Reproducing a metric calculation cannot promote calibration or
validity. Reproducing reliability estimation cannot establish that the measure is reliable.
Reproducing an S-08 subtraction cannot bypass its comparability assessment or promote Human–AI
comparability.

## ExecutionManifest

The execution manifest binds execution status and target to applicable benchmark, item, construct,
metric, evaluator, study, and comparison identities. It also binds source commit/tree, package and
schema versions, environment digest, input artifacts, expected outputs, observed outputs, and
evidence references.

Intended conditions and observed conditions are separate records. Each can represent a known value,
unknown value, unavailable value, or non-applicable value. A requested model, seed, configuration,
tool policy, or language does not prove that it was observed. Failed executions retain a failure
class, available outputs/logs, configuration, environment, and provenance. Failure, abstention,
missingness, and non-applicability are never collapsed.

## ArtifactReference

Artifact kinds include input, output, configuration, rubric, dataset, fixture, trace, log,
environment, dependency lock, source snapshot, report, and other. An artifact may carry:

- a content digest over original bytes, redacted bytes, or canonical JSON;
- a semantic digest for a canonical record;
- media type and non-identifying size metadata;
- availability and portable location class;
- rights status and provenance;
- explicit redaction scope and its verification/reproduction impact.

Content digest and semantic digest are different claims. Two encodings can differ byte-for-byte and
still represent the same canonical record. SHA-256 is never called a signature and establishes
neither authenticity, provenance correctness, source trust, nor scientific validity.

## EnvironmentManifest

The environment contract records bounded evidence for platform, architecture, runtime/version,
container image, hardware class, accelerator class, locale, timezone policy, dependency evidence,
network dependency, and tool availability. Completeness is `FULLY_CAPTURED`,
`PARTIALLY_CAPTURED`, `MINIMAL`, or `UNKNOWN`.

Environment variables are recorded only as a safe classification and optional names; values are
forbidden. Device serial numbers, IP addresses, direct identity, credentials, keys, tokens, private
paths, and sensitive environment content are forbidden. Hardware is recorded by material class.
`FULLY_CAPTURED` requires complete dependency evidence for the declared scope; it does not claim an
exhaustive operating-system image when the repository cannot supply one.

Network dependence is explicit: `NO_NETWORK`, `NETWORK_ALLOWED`, `EXTERNAL_PROVIDER`,
`EXTERNAL_DATA_SOURCE`, or `UNKNOWN`. External state can block exact replay without invalidating the
original execution record.

## Determinism and provider boundaries

Package-level determinism classes are:

- `DETERMINISTIC_REPLAY_EXPECTED`
- `SEEDED_REPLAY_EXPECTED`
- `STOCHASTIC_REPRODUCTION_ONLY`
- `EXTERNAL_NONDETERMINISTIC`
- `HUMAN_NONREPLAYABLE`
- `UNKNOWN`

S-04 evaluator determinism remains separately referenced. A deterministic replay declaration is
rejected when observed evaluator evidence does not support deterministic execution. A recorded seed
does not guarantee deterministic output. Temperature zero does not guarantee determinism. A model
ID does not establish an immutable provider snapshot. Mutable/unknown snapshots and unavailable
provider state block exact replay.

Human-as-Subject cognition and Human-as-Judge judgment are non-replayable. Their governed protocol,
presentation, sampling, analysis, and evidence can be verified or reproduced without requiring the
same individual response or rating.

## Verification and evidence closure

`EvidenceVerifier` returns only `VERIFIED_INTERNAL_CONSISTENCY`, `PARTIALLY_VERIFIED`,
`VERIFICATION_FAILED`, `INSUFFICIENT_EVIDENCE`, or `NOT_ASSESSED`. Findings contain a stable code,
severity, subject, expected state, safe observed state, evidence references, and concise rationale.
No hidden reasoning is stored.

Verification checks package, execution, environment, and artifact digests; supported schemas;
requirement resolution; evidence-chain endpoints; artifact availability; self-contained claims; and
dimensional completeness. Evidence closure asks whether required references and critical artifacts
are accounted for and traceable. Closure is not scientific completeness.

Completeness is recorded independently for identity, input, configuration, execution, output,
environment, dependencies, provenance, metric, evaluator, reliability, validity, human protocol,
and comparability. There is no weighted evidence score. Missing critical evidence cannot be offset
by complete unrelated dimensions.

Requirements are claim-specific. An engineering conformance result is not assigned fictional human
or psychometric requirements. Human and Human–AI claims retain their actual protocol, population,
validity, reliability, and comparability requirements.

## Replay and reproduction

Replay assessment reports `READY_FOR_REPLAY`, `LIMITED_REPLAY_POSSIBLE`, `REPLAY_BLOCKED`, or
`NOT_APPLICABLE`. Blockers include inconsistent evidence, unavailable input/configuration/source,
unknown seed where seeded replay is claimed, mutable provider snapshots, external nondeterminism,
and human execution. Partial environment, dependency, network, rights, or redaction evidence remains
visible as a limitation.

`ReproductionAttempt` always references the immutable original package and records a separate
reproduction execution, environment, artifacts, and comparison. It never overwrites or merges
original provenance. Outcomes are bounded to exact match, semantic equivalence, result-specific
declared tolerance, material difference, not comparable, insufficient evidence, or not applicable.

Equivalence is result-specific:

- canonical JSON and deterministic categorical results may use exact canonical equality;
- semantic records may use their canonical semantic digests;
- numeric results may use only a method-specific, declared, versioned, justified tolerance;
- stochastic outputs need a declared semantic/statistical protocol outside byte equality;
- human studies use protocol-level reproduction rather than response equality.

No universal epsilon, ±0.05 band, or five-percent threshold exists. `replicationStatus` remains
`NOT_PERFORMED`; a software rerun cannot become scientific replication.

## Chain of evidence

Typed links support the bounded chain:

`Benchmark → Input → Execution → Evaluator → Metric → Result → Reliability/Validity → Human evidence → Comparability assessment → Report/claim`.

The implementation requires resolvable endpoints but no graph database. Result/execution,
metric/result, reliability/study, human/session/presentation, rating/assignment, and S-08
assessment/result lineage remain explicit. Wall-clock time is audit evidence and never substitutes
for this lineage.

## Representative synthetic cases

| Case | Boundary |
| --- | --- |
| A | local deterministic engineering evidence can be internally consistent and replay-ready |
| B | a different dependency lock leaves a replay/reproduction limitation despite matching source and input |
| C | an external model with unknown snapshot blocks exact replay |
| D | an artifact digest mismatch fails verification |
| E | rights-restricted required material keeps a package limited/referential |
| F | Human-as-Subject evidence is verifiable while cognition is non-replayable |
| G | Human Judge evidence/protocol is verifiable while judgment is non-deterministic |
| H | an S-08 computation can reproduce while comparability remains insufficient |
| I | the same value from materially different configuration is not exact reproduction |
| J | a failed execution with complete provenance remains valid evidence |

All cases are deterministic architecture fixtures with `NONE_SYNTHETIC_FIXTURE` scientific evidence.
They are not empirical reproduction, human data, or Human–AI experiments.

## Rights, privacy, and security

Reproducibility does not override copyright, license, privacy, provider terms, security, or research
governance. Restricted content stays restricted. Unknown rights block redistribution. Redaction
records whether the digest covers the original or redacted representation and how verification is
limited. Human records remain pseudonymous.

The runtime recursively rejects private absolute paths, direct PII field names, credential material,
API keys, tokens, private keys, and embedded secret-like values. No external model call, human study,
paid provider, private source, database, or cloud storage is used by S-09.

## Limitations and future work

S-09 provides in-memory portable contracts. It does not persist or archive packages, fetch external
artifacts, authenticate sources, sign packages, reproduce an external model, replay human cognition,
estimate measurement invariance or DIF, establish reliability/validity, promote benchmark maturity,
or validate Human–AI comparability. Export storage, controlled access, signature/trust policy,
provider snapshot contracts, and empirical reproduction protocols require separate review.

The architecture can report an internally consistent package whose artifacts or environment remain
insufficient for exact replay. That precise limitation is the intended safe result.

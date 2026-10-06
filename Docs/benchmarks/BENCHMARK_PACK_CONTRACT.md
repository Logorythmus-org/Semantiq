# Governed Benchmark Pack Contract

**Status**: `NORMATIVE`

SemantIQ remains `0.1.0-alpha.2`, Public Alpha (Experimental). This contract adds a
contributor-controlled manifest and bounded local fixture admission path to the existing benchmark
package. It does not establish scientific validity or production readiness.

## Authority and maturity

Pack validity ≠ Benchmark maturity. Pack admissibility ≠ Internal qualification.
Internal registry M-level ≠ Public BM-level. Execution success ≠ Scientific validation.

The [public lifecycle](BENCHMARK_LIFECYCLE.md) uses BM0–BM5. The canonical registry separately
tracks implementation, scientific and lifecycle axes and derives M0–M6. There is intentionally no
mapping between these scales here. Neither structural validation nor admission assessment mutates
registries, generates qualification evidence, approves governance or promotes a benchmark.
Contributor-controlled maturity, replication, leaderboard, Core promotion and approval fields are
rejected. `scientificAuthority` must be `NONE`. Evidence references are inert pointers, not accepted
S09 records, S10 promotion evidence or S11 authorization.

## Versioned manifest

The [Draft 2020-12 schema](../../schemas/benchmark-pack-manifest.schema.json) is the runtime
structural validator's source of truth. Every normative object rejects additional fields; evaluator
parameters use the existing configuration value contract and are checked against the exact evaluator.

| Field | Meaning |
|---|---|
| `schemaId`, `schemaVersion` | `SEMANTIQ_BENCHMARK_PACK_MANIFEST`, initial contract version `0.1.0` |
| `identity` | Stable pack ID and SemVer **pack** version, independent of the contract, release, benchmark, evaluator and metric versions |
| `benchmark`, `evaluator`, `metrics` | Exact identities and versions from existing validated registries; no aliases or name-only execution |
| `cases` | Unique case IDs and portable pack-relative paths, content type, SHA-256 digest of exact `ORIGINAL_BYTES` |
| `provenance` | Existing origin, provenance-class and nonempty source-reference vocabulary |
| `rights` | Existing `RegistryInputRightsClass` and explicit license identifier/reference |
| `executionRequirements` | Provider-neutral input kind, subject kind and existing evaluator configuration parameters |
| `exposure` | Existing exposure manifest shape, including exact benchmark ID/version and tier/export/rotation constraints |
| `evidenceReferences` | References only; no evidence acceptance or promotion |
| `limitations`, `intendedUse` | Normative scope and limitations |
| `auditMetadata` | Optional recorded time, request ID and reviewer comments; explicitly non-material |

IDs and SemVer are validated, including malformed prerelease numbers. Duplicate case IDs,
case paths (conservatively ignoring case for portability) and metric IDs are rejected. Array order is
material; JSON object key order is not. The schema does not require hidden chain-of-thought.

## Structural validity, binding and admission

`validateBenchmarkPackManifest(unknown)` returns `valid` and ordered violations. It rejects
non-JSON values, nonfinite numbers and accessor-bearing objects without invoking their getters.
A structurally valid manifest does not establish fixture integrity or admission.

`loadBenchmarkPack(packRoot, registries?)` reads `manifest.json`, validates its shape, resolves exact
benchmark/evaluator/metric identities, checks evaluator benchmark/construct/metric bindings and
configuration using the existing registries, reads each case safely and verifies its byte digest.
It returns separate `validation` and `admission` results, verified case identities and, if integrity
and binding checks succeed, a deterministic `packDigest`. Case contents are not exposed in errors or
returned as execution artifacts. The supplied registries are trusted validated application context,
not contributor manifest data; omitting them uses the existing canonical snapshots.

Admission states are `ADMISSIBLE`, `REVIEW_REQUIRED` or `BLOCKED`, always with scientific authority
`NONE`. ADMISSIBLE means the local contract checks passed under declared rights and bindings;
it is not permission to publish, a runtime readiness claim, legal verification or governance approval.
No provider is called, arbitrary resource fetched, code evaluated or command executed.

Bundled fixtures marked `PROHIBITED`, `UNKNOWN_RIGHTS` or `PUBLIC_REFERENCE_ONLY` are blocked even
when export is false. Public reference access does not grant redistribution. Missing licenses block
admission. `RESTRICTED_REVIEW_REQUIRED` cannot be admitted automatically; it returns
`REVIEW_REQUIRED` if other checks pass. `FIRST_PARTY_OR_PROJECT` and `OPEN_CLEARED` require explicit
license references. References and provenance classes are declarations: the loader does not fetch
or independently establish authorship, legal clearance, provenance truth or external evidence.
Human review must assess those claims before contributor material is redistributed.

## Canonical identity

`canonicalBenchmarkPackManifest` uses the existing SemantIQ canonical JSON utility.
`benchmarkPackDigest` wraps its SHA-256 in the existing `SemanticDigest` contract/profile.
All validated manifest fields except the **schema-defined** `auditMetadata` envelope are material,
including limitations, intended use, rights, provenance, exposure and execution parameters. Case
byte digests bind fixtures into manifest identity. No local root, file modification time, execution
elapsed time or generated wall-clock value enters pack identity. Audit changes cannot silently
change it. Unknown fields are rejected before canonicalization rather than stripped ad hoc.

The digest helper establishes only structural manifest identity. The loader returns a verified pack
digest only when referenced fixtures and bindings pass. A restricted-rights pack may have an
integrity-verified digest while admission still requires review. Bundle integrity ≠ Truth;
Synthetic Fixture ≠ Empirical Evidence; Determinism ≠ Validity.

## Local filesystem boundary

References must use portable forward-slash relative paths. Absolute paths, parent traversal,
empty paths, URLs, backslashes, alternate data streams, reserved Windows device names and trailing
dots are rejected. The root, file and intermediate directory symlinks/junctions are rejected, and
resolved paths must remain inside the root. Only regular files are read. The manifest is bounded to
1 MiB; each case to 8 MiB; at most 256 cases are accepted.

This loader requires a stable local tree without concurrent hostile writers. Portable filesystem
checks are not an atomic sandbox against a process replacing files between checks and reads.
Remote upload/archive ingestion and immutable snapshot enforcement are later integration work.
Pack-level validation does not validate the family-specific payload schema or run an evaluator.

## One synthetic example

The [example manifest](../../fixtures/benchmark-packs/long-horizon-synthetic-0.1.0/manifest.json)
binds `long_horizon@0.1.0`, `long_horizon_rule_evaluator@0.1.0` and
`long_horizon_resilience_index@0.1.0`. It contains one newly AI-generated synthetic milestone record,
classified `AI_GENERATED` / `FIRST_PARTY_OR_PROJECT`, with the actual root
[MIT license](../../LICENSE) as `repository:LICENSE`. It has no empirical subjects or external source
material and is infrastructure/example evidence only. The existing metric remains an uncalibrated
and unvalidated heuristic. Successful validation does not establish BM3 or scientific validity.

Actual evaluator execution and controlled-study/evidence ingestion remain a later integration
dependency. No registry evidence or maturity is changed by this example. No Cyber feature, new
scientific benchmark family, leaderboard, release, tag change or publication is introduced.

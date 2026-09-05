# Canonicalization Migration Decision Matrix

## 1. Purpose

This document converts the Prompt-15B hash inventory into a Phase-2 migration decision. It identifies which active digests carry durable evidence identity, how they are produced and consumed, and which single surface is suitable for the first implementation. The machine-readable authority is [`canonicalization-migration-matrix.json`](canonicalization-migration-matrix.json).

## 2. Phase-1 boundary

Prompt 15B established `legacy-typescript-v0`, `legacy-python-v0`, and `semantiq-canonical-json-v1`, portable exact-byte vectors, and fail-closed profile selection. It did not migrate an existing producer, verifier, artifact, chain, container, schema, or public API. This plan preserves that boundary.

## 3. Why migration is separate from profile definition

A deterministic profile answers how a value becomes bytes. It does not answer which value is covered, how a stored artifact identifies the profile, whether old bytes remain verifiable, or whether a root combines differently profiled components. Those compatibility decisions belong to each identity surface.

## 4. Hash-surface classification

The current audit produces 37 decision rows: 20 `IDENTITY_CRITICAL`, 5 `INTEGRITY_ONLY`, 3 `CACHE_KEY`, 5 `DIAGNOSTIC`, 2 `TEST_ONLY`, and 2 `UNKNOWN_REQUIRES_REVIEW`.

Prompt 15B's broad `sandbox-canonical-json`, TypeScript SDK, Python SDK, and ResearchBundle families are split where component and container/root identities have different compatibility consequences. Two former inventory entries are not active hash surfaces: `replication-registry` has an unused hash import but produces no digest, and `shared-v1-profile` is a capability rather than an artifact hash.

Two unknowns are resolved. The normalizer digest is identity-critical because it is persisted on `ObservationEvidence`; the public artifact `contentHash` is identity-critical because it is part of `SemantiqArtifactMetadata` and can feed an artifact identifier. Alpha and Sprint runtime families remain unknown because repository evidence does not establish persistence, external consumption, or intentional ordering semantics.

## 5. Producer/consumer model

The identity path is always evaluated as:

`producer → serialization/profile → SHA-256 → stored field/container → verifier or consumer`

Similar type names do not prove interoperability. In particular, TypeScript and Python ResearchBundle APIs currently hash objects differently and calculate their roots with different ordering rules.

## 6. Historical compatibility model

Checked-in production evidence artifacts were not found for the active identity families. Tests and conformance vectors are historical behavior evidence and must remain immutable. Absence from this repository is not proof that downstream artifacts do not exist, so public SDK, forensic, chain, preregistration, and partner-exchange surfaces retain elevated compatibility risk.

Historical records must never be rehashed or relabeled as V1. A legacy artifact is verified with a profile selected by explicit metadata, then an unambiguous format-version mapping, then a documented producer/version mapping. Bounded explicit legacy mode is the final option.

## 7. Profile identification rules

New artifacts must contain explicit canonicalization metadata and unknown profiles must fail closed. A verifier must not try profiles until a digest matches. Missing metadata means legacy only where the artifact family and version make that mapping unambiguous. Profile metadata is covered by the containing digest except where doing so would create recursion; the enclosing format must specify the exact unsigned body.

## 8. Migration strategy vocabulary

- `NO_MIGRATION_REQUIRED`: canonical JSON is irrelevant or the current byte contract is intentional.
- `V1_NEW_ARTIFACTS_ONLY`: V1 applies only to a newly defined artifact family.
- `V1_WITH_LEGACY_VERIFICATION`: new writes use V1; explicitly identified legacy artifacts retain verification.
- `IMPLEMENTED_V1_NEW_ARTIFACTS_WITH_LEGACY_VERIFICATION`: the selected surface now has an explicit V1 write path while its bounded historical format retains exact legacy verification.
- `DUAL_WRITE_TEMPORARY`: two hashes are written for a bounded transition; not selected here.
- `VERSIONED_CONTAINER_MIGRATION`: component and root rules change atomically under container metadata.
- `REQUIRES_SCHEMA_CHANGE`: metadata cannot be represented safely in the current schema.
- `REQUIRES_PUBLIC_API_CHANGE`: public types/call behavior must evolve.
- `REQUIRES_HISTORICAL_COMPATIBILITY_DESIGN`: forensic or chain continuity needs separate design.
- `DEFER_UNTIL_EXTERNAL_CONSUMER_EVIDENCE`: downstream compatibility is insufficiently known.
- `NOT_SAFE_TO_MIGRATE_YET`: semantics or verification are incomplete.
- `UNKNOWN_REQUIRES_REVIEW`: the surface class itself remains unresolved.

## 9. Risk/value methodology

Each identity-critical candidate scores 1 (low) through 5 (high) on A identity criticality, B historical risk, C cross-language relevance, D external-user relevance, E metadata readiness, F test coverage, G isolation, H blast radius, I reversibility, and J evidence value.

- `MIGRATION_VALUE = A + C + D + J` (range 4–20; higher is more valuable).
- `MIGRATION_RISK = B + (6-E) + (6-F) + (6-G) + H + (6-I)` (range 6–30; higher is riskier).
- `FIRST_MIGRATION_SUITABILITY = 2 × MIGRATION_VALUE − MIGRATION_RISK`.

The formula rewards value but separately penalizes poor metadata, weak coverage, coupling, blast radius, and weak reversibility. It is a ranking aid; all mandatory gates still apply.

## 10. Identity-critical surfaces

| Surface | Producer → consumer | Current bytes | Strategy | Value | Risk | Suitability |
| --- | --- | --- | --- | ---: | ---: | ---: |
| Benchmark manifest digests | BenchmarkIntegrityEngine → same verifier | legacy TS | schema change | 16 | 20 | 12 |
| **Execution receipt digest** | ReceiptIssuer → `verifyReceipt` | legacy TS | **V1 + legacy verification** | **18** | **10** | **26** |
| EvidencePackage root/seal | EvidencePackageManager → package validator | legacy TS + Merkle framing | versioned container | 18 | 21 | 15 |
| Provenance graph seal | Provenance engine → graph verifier | legacy TS + node framing | historical design | 18 | 25 | 11 |
| Execution/run provenance | Execution API → record readers | legacy TS | schema change | 14 | 21 | 7 |
| Audit/security record seals | audit engines → audit readers | legacy TS | historical design | 16 | 27 | 5 |
| Release-gate seal | Release gate → report readers | legacy TS | defer | 14 | 25 | 3 |
| Provider interoperability records | provider engines → registry/router readers | legacy TS | defer | 15 | 22 | 8 |
| TS SDK bundle components | TS SDK → TS verifier/users | legacy TS | versioned container | 20 | 23 | 17 |
| TS SDK bundle root | TS SDK → TS verifier | pipe-framed sorted entries | versioned container | 20 | 25 | 15 |
| Python SDK bundle components | Python SDK → Python verifier/users | legacy Python | versioned container | 20 | 23 | 17 |
| Python SDK bundle root | Python SDK → Python verifier | pipe-framed insertion order | versioned container | 20 | 25 | 15 |
| Core ResearchBundle components | bundle builder → verifier | legacy TS | versioned container | 19 | 21 | 17 |
| Core ResearchBundle root | bundle builder → verifier/gate | pipe-framed sorted entries | versioned container | 19 | 23 | 15 |
| Study preregistration | protocol generator → manifest validator/gate | legacy TS | historical design | 18 | 22 | 14 |
| Evaluation ledger | ledger → integrity verifier | JSON + field framing | historical design | 16 | 23 | 9 |
| Trace evidence | trace producers → trace/evidence readers | order-sensitive JSON + chain framing | historical design | 18 | 25 | 11 |
| Partner exchange package | redaction engine → exchange consumers | raw content + root framing | defer | 17 | 24 | 10 |
| Normalized evidence digest | normalizer → evidence readers | top-level replacer | not safe | 14 | 18 | 10 |
| Public artifact content hash | metadata producer → public consumers | raw string/ordinary JSON | public API change | 19 | 19 | 19 |

## 11. Integrity-only surfaces

Adapter and environment file hashes cover raw bytes and require no JSON migration. Workspace snapshots use explicit textual framing. Trace-profile snapshots intentionally bind exact serialized state and already embed a profile id/version. The workbench audit chain is integrity-only but cannot change mid-chain without explicit compatibility design.

## 12. Operational/non-identity surfaces

Question persistence/domain fingerprints and schema-shape fingerprints are operational cache or lookup keys. Generated entity prefixes, benchmark labels, provider handles, report ids, and Python fixture signatures are diagnostic. TypeScript and Python hash regression fixtures are test-only. None is authorized for a V1 migration.

## 13. Unknown surfaces

`alpha-runtime-json-hashes` lacks an evidenced consumer/persistence lifecycle and ordering contract. `sprint-runtime-json-hashes` has local validators, but historical Sprint artifact availability and external-reader compatibility are unknown. Both require characterization before classification; neither may migrate.

## 14. ResearchBundle analysis

ResearchBundle has independently meaningful component hashes and root hashes. The TS SDK and core builder serialize object components with legacy TypeScript canonical JSON; Python uses legacy Python canonical JSON. TS and core roots sort `path:digest` strings, while Python preserves insertion order. Component entries and roots lack canonicalization-profile metadata; `version` currently denotes the product-contract schema, not the profile.

Components and roots must migrate together inside a versioned container. Mixed profiles are prohibited for newly generated bundles because a root alone cannot reveal each component's byte rules. Legacy bundles may be verified only through an explicit legacy container mapping. ResearchBundle is deferred because it combines three producer paths, a proven cross-language divergence, root framing outside canonical JSON, and a downstream eligibility gate.

## 15. EvidencePackage analysis

EvidencePackage hashes artifact/trace entries into a Merkle root and separately derives a package seal from manifest, environment, root, and embedded receipt digest. It has a `packageVersion` but no profile metadata. Validation recomputes trace digests and the Merkle root but only format-checks the embedded receipt signature; the package seal is not independently stored as a direct digest.

An EvidencePackage migration therefore requires a versioned-container design covering trace payloads, component roots, the embedded receipt, and the package seal. New mixed-profile packages are prohibited. It is deferred until the receipt migration provides a stable embedded component and package verification semantics are complete.

## 16. Receipt/provenance/preregistration analysis

Execution receipt is the bounded candidate: a single TypeScript issuer/verifier pair, an existing `receiptVersion`, strong focused tests, no checked-in production artifacts, and an optional metadata location. Provenance graphs combine six node hashes, a root, and a signed graph; their forensic lineage requires atomic versioning. Preregistration fingerprints are consumed by manifest validation and the external-evidence gate; a changed digest could retroactively alter whether execution matched a frozen plan. Provenance and preregistration are deferred for dedicated historical-compatibility design.

## 17. First migration candidate

Exactly one candidate is selected: `sandbox-execution-receipt-digest`.

Prompt 17 implemented that row as `IMPLEMENTED_V1_NEW_ARTIFACTS_WITH_LEGACY_VERIFICATION`. The implementation record is [Execution-Receipt Canonicalization Migration](EXECUTION_RECEIPT_CANONICALIZATION_MIGRATION.md). No other row changed migration state, and Phase 2 is not globally complete.

It wins with suitability 26 because the hashed unsigned body and verifier are colocated, the receipt already has format identity, optional profile metadata can be added without rehashing legacy receipts, tests can cover the full boundary, and no scoring, benchmark, registry publication, package release, or external coordination is involved.

## 18. Rejected/deferred candidates

Public artifact hashes rank second but require a public API decision and have ambiguous string-versus-object behavior. ResearchBundle variants offer higher cross-language value but need atomic component/root migration and a shared root framing contract. EvidencePackage embeds other identity surfaces. Benchmark manifests bind scoring assertions. Chains, provenance, preregistration, audits, and release gates carry forensic continuity risk. Normalized evidence lacks a verifier and currently uses a top-level replacer with surprising nested-key behavior.

## 19. Required tests for first migration

Prompt 17 must add exact-byte legacy and V1 receipt fixtures; deterministic repeated V1 generation; metadata round-trip; TypeScript V1 conformance reuse; unknown-profile, malformed-metadata, profile-substitution, and downgrade rejection; legacy digest preservation; tamper detection; missing-metadata legacy mapping; mixed-profile/container rejection; schema compatibility; and clean-checkout reproduction. Python parity is not required for the TS-only receipt today, but any Python receipt consumer discovered before implementation reopens that decision.

## 20. Rollback/compatibility requirements

Legacy receipt verification remains read-only and byte-identical. New V1 generation is activated only through an explicit profile-aware path; implementation must not silently change the existing default until separately authorized. Rollback disables new generation while retaining both explicit V1 and legacy verification. Already emitted V1 receipts remain verifiable after rollback.

## 21. Security/forensic boundary

The profile id is part of the unsigned receipt body and therefore covered by the digest. Unknown, malformed, or unsupported profiles fail closed. A V1-marked receipt may not be verified with legacy bytes, and a metadata-free legacy receipt may not be upgraded by inference. New mixed-profile receipts are invalid. Verification never tries profiles until one matches. Historical artifacts are not rewritten, normalized, or relabeled.

## 22. Phase-2 implementation gate

Prompt 17 may proceed only after maintainers approve the selected surface, optional backward-compatible metadata shape, legacy mapping, unchanged-default policy, and fail-closed behavior. Any discovered external receipt consumer, checked-in production artifact, Python receipt verifier, or required breaking schema change sends the work back to Prompt 16B.

## 23. What this planning does NOT authorize

This plan authorizes no production hash change, default change, historical rehash, schema edit, SDK API edit, package/version change, release/tag, package publication, Integration Graph promotion, upstream outreach, or claim of external interoperability. Internal evidence maturity improves only through explicit planning; Prompt-13 upstream engagement readiness remains unchanged.

### First migration implementation specification

- **CURRENT BEHAVIOR:** `BenchmarkExecutionReceiptIssuer` hashes `canonicalJson(unsignedBody)` with SHA-256; `verifyReceipt` repeats the same unversioned legacy behavior.
- **TARGET V1 BEHAVIOR:** explicitly requested new receipts hash V1 canonical UTF-8 using `semantiq-canonical-json-v1`.
- **PROFILE METADATA LOCATION:** an optional canonicalization object adjacent to `identity` in the unsigned receipt body, containing profile and `sha256`; absence is valid only for receipt version `1.0.0` legacy verification.
- **LEGACY VERIFICATION:** reconstruct the exact historical unsigned body with no injected fields and use `legacy-typescript-v0`.
- **NEW GENERATION:** explicit V1 generation writes metadata before hashing; the existing default remains unchanged until a separate authorization changes it.
- **FAIL-CLOSED RULES:** reject unknown/malformed profile metadata, V1 labels with legacy bytes, profile substitution, and ambiguous missing metadata.
- **SCHEMA IMPACT:** optional backward-compatible metadata; no schema change is implemented in Prompt 16.
- **API IMPACT:** additive explicit profile option; no API change is implemented in Prompt 16.
- **HISTORICAL IMPACT:** none; all legacy bytes and digests remain unchanged.
- **ROLLBACK MODEL:** stop V1 generation, preserve both verification paths, never rewrite issued receipts.
- **FILES EXPECTED TO CHANGE:** receipt contract/issuer, corresponding schema, exports if needed, exact-byte fixtures, focused TS tests, and documentation.
- **FILES THAT MUST NOT CHANGE:** scoring/benchmark semantics, ResearchBundle/EvidencePackage behavior, Python SDK unless a real consumer is discovered, package versions, releases/tags, and historical artifacts.

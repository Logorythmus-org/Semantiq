# Second Canonicalization Migration Selection

## 1. Purpose

This is the planning record for the second bounded production identity migration. It reassesses the repository after the first real migration and selects exactly one surface for a future Prompt-19 implementation. It changes no producer, verifier, schema, SDK API, default, package version, release, or historical artifact.

The machine-readable authorities are:

- [`second-canonicalization-migration-selection.json`](second-canonicalization-migration-selection.json)
- [`canonicalization-migration-dependencies.json`](canonicalization-migration-dependencies.json)
- [`canonicalization-migration-matrix.json`](canonicalization-migration-matrix.json)

## 2. Verified Prompt-17 baseline

Protected `main` is `d7bfb73f11516503c7da3e70ad3470ab794e2cf6`, the merge commit for PR #46. Its second parent is the reviewed Prompt-17 head `6146ad57ff48356ad788c086dfb51f427a3d9094`. No later main commit exists at this baseline.

Post-merge CI run `33956401397` and Documentation Site run `33956401404` succeeded. The only observed annotations were GitHub-hosted-action Node.js 20 deprecation warnings; they did not change the result.

The implementation verifies that:

- explicitly requested new receipts use `semantiq-canonical-json-v1`;
- the existing no-option issuance path remains legacy and byte-compatible;
- receipt version `1.0.0` without profile metadata maps only to the bounded legacy TypeScript path;
- unknown, empty, malformed, substituted, or unsupported profile metadata fails closed;
- verification dispatches once and never probes algorithms until one matches;
- stripping V1 metadata cannot downgrade a V1 receipt into successful legacy verification;
- only `VerifiableBenchmarkExecutionReceipt.receiptDigestSha256` migrated;
- `productionMigrationComplete` remains `false`.

The receipt row is now a `REFERENCE_IMPLEMENTATION`. It cannot be selected again.

## 3. What the first migration taught us

Prompt 17 proved that a versioned profile can be introduced without rewriting history when selection metadata is authenticated by the identity, dispatch is bounded, and the old default remains stable. It did not prove that container roots, mixed child profiles, floating-point payloads, public identifiers, or forensic chains can reuse the receipt design unchanged.

## 4. Reusable vs receipt-specific patterns

### Confirmed reusable pattern

- Store explicit profile and hash-algorithm metadata before hashing.
- Cover that metadata by the identity it selects, except where recursion requires a precisely specified enclosing location.
- Activate V1 generation only through an explicit additive option while the existing default remains legacy.
- Map missing metadata to legacy only through one documented artifact/version rule.
- Dispatch once before calculating the expected digest; never probe profiles.
- Fail closed for unknown, empty, extra, malformed, substituted, or unsupported metadata.
- Freeze exact legacy and V1 payloads, UTF-8 bytes, digests, and verification outcomes.
- Preserve read-only legacy verification after rollback and never rehash historical records.
- Use an independent-language reference implementation for parity only when that language does not own the product surface.

### Reusable with adaptation

- Profile-stripping protection moves from receipt-level metadata to component-level metadata for a container.
- A container may carry mixed legacy and V1 children only when every child's profile is independently unambiguous and the parent framing does not infer it.
- Schema additions must be optional, closed, and mirrored across language contracts without implying new product support.

### Receipt-specific pattern

- `identity.receiptVersion` and the receipt's unsigned-body boundary are not general container rules.
- The receipt signature fields and their recursion boundary do not describe ResearchBundle roots.
- The specific rule “receipt version `1.0.0` plus missing metadata means legacy TypeScript” must not be copied to unrelated artifacts.

Prompt 17's actual blast radius was 12 files and required fixed fixtures, schema coverage, downgrade tests, TypeScript/Python reference parity, and a full repository battery. That burden is the minimum evidence floor, not proof that more coupled surfaces are safe.

## 5. Current identity inventory

The reconciled decision matrix now has 38 rows:

| Class | Count |
| --- | ---: |
| `IDENTITY_CRITICAL` | 21 |
| `INTEGRITY_ONLY` | 5 |
| `CACHE_KEY` | 3 |
| `DIAGNOSTIC` | 6 |
| `TEST_ONLY` | 2 |
| `UNKNOWN_REQUIRES_REVIEW` | 1 |

The higher-resolution dependency review distinguishes 30 identity-critical surfaces, including the completed receipt reference implementation, and 29 remaining surfaces. Counts differ because older matrix rows grouped independently meaningful component, root, and seal identities.

## 6. Remaining identity-critical surfaces

The 29 remaining detailed surfaces are:

1. benchmark manifest digest;
2. benchmark fixture/volume-mount digest;
3. benchmark assertions digest;
4. execution-run provenance hash;
5. audit/security record seals;
6. release-gate seal;
7. provider interoperability records;
8. Core ResearchBundle workspace snapshot component;
9. Core ResearchBundle run components;
10. Core ResearchBundle evaluation components;
11. Core ResearchBundle evidence, claims, statistical, robustness, queue, and audit components;
12. Core ResearchBundle root;
13. TypeScript SDK ResearchBundle components;
14. TypeScript SDK ResearchBundle root;
15. Python SDK ResearchBundle components;
16. Python SDK ResearchBundle root;
17. EvidencePackage artifact components;
18. EvidencePackage trace-payload components;
19. EvidencePackage root;
20. EvidencePackage seal/signature payload;
21. provenance node hashes;
22. provenance graph root;
23. provenance graph seal;
24. study-preregistration fingerprint;
25. evaluation-ledger chain;
26. trace-evidence chain;
27. partner-exchange package identity;
28. normalized-evidence digest;
29. public artifact content hash.

## 7. Resolved and remaining unknowns

The former `alpha-runtime-json-hashes` family is resolved as `DIAGNOSTIC`. `verifyBackup` returns the stored hash while hard-coding `valid: true`; it does not recompute content. The invitation `tokenHash` is an opaque operational value with no content-verification consumer. Neither is a durable evidence identity today. Future real verification would reopen this classification.

`sprint-runtime-json-hashes` remains `UNKNOWN_REQUIRES_REVIEW`. The family mixes locally recomputed Sprint-4 package hashes with Sprint-5 length-only integrity checks, placeholder signatures, federation references, and event manifests. Repository evidence does not establish one common identity contract, archival policy, external reader set, or intentional ordering rule. It is excluded from selection.

## 8. Migration dependency graph

The full deterministic graph is in [`canonicalization-migration-dependencies.json`](canonicalization-migration-dependencies.json). Key cascades are:

```text
workspace snapshot component ─┐
run components ───────────────┼─> Core ResearchBundle sorted path:digest root
evaluation components ────────┤
other components ─────────────┘

EvidencePackage artifact digests ─┐
EvidencePackage trace digests ────┼─> package root ─> package seal payload
execution-receipt digest ─────────┘

provenance node hashes ─> graph root ─> lineage seal

preregistration fingerprint ─> execution-manifest match ─> external-evidence eligibility

ledger payload digest ─> entry hash ─> every successor hash

trace event hash ─> successor previous-hash link

public contentHash ─> optional `versionOrHash` artifact identifier
```

For the selected workspace component, a new digest necessarily changes the root value of a newly generated bundle. It does not change the root algorithm: the root remains SHA-256 over lexically sorted `path:digest` strings. That distinction is mandatory.

## 9. Updated risk, value, and readiness model

Every dimension scores 1 (low) through 5 (high).

- `MIGRATION_VALUE = A + B + C + D + E`
- `MIGRATION_RISK = F + G + H + I + J + K + L + M`
- `MIGRATION_READINESS = N + O + P + Q + R`
- `SECOND_MIGRATION_SUITABILITY = 2 × MIGRATION_VALUE + MIGRATION_READINESS − MIGRATION_RISK`

Value measures cross-language importance, evidence centrality, external-user relevance, reproducibility benefit, and ambiguity reduction. Risk measures history, blast radius, cross-language implementation, schema/API impact, forensic sensitivity, cascade, mixed profiles, and rollback. Readiness measures metadata, tests, fixtures, legacy verification, and isolation.

The formula ranks evidence; hard gates still override the number. In particular, a surface is excluded when its ordinary payload falls outside the current integer-only V1 domain, when legacy verification is absent, or when mixed-profile and cascade semantics are unresolved.

## 10. ResearchBundle assessment

### A. Artifact/component hashes

The Core builder writes canonical JSON text into an artifact map and hashes that exact text. The verifier receives the stored text and recomputes SHA-256. This is stronger than the SDK-only root verifier, which ordinarily receives no component payloads.

The workspace snapshot component is distinct from run, evaluation, claim, statistical, robustness, review-queue, and audit components. A standard workspace snapshot contains strings, booleans, records of strings, and safe integers. Standard evaluations contain floating-point scores; other evidence payloads are extensible. Therefore only the workspace snapshot is inside the complete current V1 domain without changing domain semantics.

### B. Manifest identity

`ResearchBundleManifest.version` is the product-contract schema version, not a canonicalization profile. Component entries currently have path, digest, media type, size, and category but no profile identity. Prompt 19 must add optional closed component metadata rather than reinterpret `version`.

### C. Bundle/root identity

The Core builder and verifier sort `path:digest` entries before hashing them with `|` framing. That framing is not canonical JSON and must remain unchanged. The TypeScript SDK and Python SDK currently preserve their constructed component order; they are separate implementations and are not part of the selected Core-builder migration.

Partial migration is safe only at the component-entry level. A V1 workspace snapshot can coexist with legacy components because each entry identifies its profile, and the root consumes only the resulting `path:digest`. A root without the child metadata cannot prove which bytes were hashed.

No checked-in production bundle was found. This is evidence for fixture feasibility, not proof that no downstream bundle exists. Historical bundles remain byte-for-byte legacy.

## 11. EvidencePackage assessment

EvidencePackage has at least four separate identity layers:

1. precomputed artifact digests;
2. trace payload digests recomputed with legacy TypeScript canonical JSON;
3. a root over artifact and trace `path:digest` entries;
4. a package digest projected into `packageSignatureHex`.

The validator recomputes trace payload digests and the root, but it only shape-checks the embedded receipt signature and does not recompute the package signature payload. Trace payloads are unconstrained and may be outside the V1 domain. A component-only migration is therefore unsafe today. EvidencePackage is deferred until per-component metadata, real seal verification, and mixed-profile semantics are designed.

## 12. Provenance assessment

The provenance engine hashes six nodes, joins those hashes into a graph root, and derives a lineage signature from the complete graph. It verifies node/root continuity but not the lineage signature. Model temperature is a floating-point field outside the V1 domain. Migrating any node changes the graph root and enclosing seal and could reinterpret forensic lineage. Provenance remains deferred.

## 13. Preregistration assessment

The preregistration fingerprint commits to draft or frozen protocol content, including floating-point effect thresholds, significance alpha, and statistical power. The fingerprint is consumed by manifest validation and the external-evidence eligibility gate. Profile metadata is absent, and a changed interpretation could retroactively alter whether execution matched a frozen plan. It remains deferred for dedicated forensic compatibility design.

## 14. Ledger and chain assessment

The evaluation ledger hashes a framed payload into an entry whose hash becomes the next entry's `previousEntryHash`. Trace records similarly link later events to earlier hashes. A migration boundary would change every downstream identity. Neither format currently identifies a chain profile or transition index. Both remain deferred.

## 15. Public artifact assessment

`computeContentHash` hashes strings verbatim and arbitrary objects with ordinary `JSON.stringify`. `SemantiqArtifactMetadata.contentHash` can feed a user-visible artifact identifier. The public API has no profile parameter or content-type distinction and no recomputing verifier. Downstream consumers may exist even though adoption is unproven. This surface is excluded until a public compatibility design exists.

## 16. Ranked second-migration candidates

| Rank | Candidate | Value | Risk | Readiness | Suitability | Gate result |
| ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | Core ResearchBundle workspace snapshot component | 19 | 21 | 22 | 39 | **PASS / SELECTED** |
| 2 | Benchmark manifest digest | 17 | 18 | 22 | 38 | excluded: floating-point weights |
| 3 | Core ResearchBundle non-workspace components | 21 | 26 | 17 | 33 | deferred: unconstrained/floating payloads |
| 4 | Benchmark fixtures digest | 14 | 16 | 16 | 28 | excluded: semantics and verifier incomplete |
| 5 | TS/Python SDK ResearchBundle components and roots | 25 | 36 | 13 | 27 | deferred: cross-language/container ambiguity |
| 6 | Study preregistration | 20 | 31 | 16 | 25 | deferred: forensic and numeric-domain risk |
| 7 | EvidencePackage components/root/seal | 19 | 29 | 15 | 24 | deferred: incomplete seal and mixed profiles |
| 8 | Public artifact content hash | 21 | 31 | 10 | 21 | excluded: breaking public compatibility risk |
| 9 | Evidence normalizer digest | 16 | 21 | 9 | 20 | excluded: no verifier |
| 10 | Provenance nodes/root/seal | 20 | 36 | 11 | 15 | deferred: forensic cascade |
| 11 | Trace evidence chain | 19 | 36 | 11 | 13 | deferred: order-sensitive arbitrary payloads |
| 12 | Evaluation ledger chain | 15 | 35 | 15 | 10 | deferred: downstream chain rewrite |

## 17. Selected second migration

`SELECTED_SECOND_MIGRATION = research-bundle-core-workspace-snapshot-component`

This is a planning selection only. `implementationAuthorized` is `false`.

## 18. Why it won

The candidate advances beyond Prompt 17 in one controlled dimension: it introduces a versioned child identity inside a durable container while preserving the parent's framing and allowing explicitly described mixed profiles.

It passes every hard gate:

- the exact identity payload is known;
- standard payload values are inside the V1 domain;
- the Core TypeScript producer and payload-aware verifier are colocated;
- fixed legacy and V1 fixtures are feasible;
- legacy verification requires no historical rewrite;
- optional per-component metadata can discriminate profiles;
- the root cascade is understood and its algorithm stays unchanged;
- mixed components are unambiguous when every entry identifies its profile;
- API and schema effects can be additive and backward compatible;
- no external coordination or dependency change is required;
- rollback stops new V1 generation while both verification paths remain.

## 19. Why alternatives were deferred

- **ResearchBundle wholesale:** maximum cross-language value, but evaluation floats, SDK/core producer differences, component metadata, and root/container rules are not ready. The selected workspace child is the safe precursor.
- **EvidencePackage:** trace payloads are unconstrained, receipt and component digests feed one root, and the package seal lacks complete verification.
- **Benchmark manifest:** ordinary DSL weights are floating point and therefore outside V1.
- **Provenance:** node hashes cascade into a root and seal, and model temperature is outside V1.
- **Preregistration:** changing a pre-execution commitment can alter later eligibility decisions; its payload includes floats.
- **Evaluation ledger/trace chains:** every later hash depends on earlier hashes, with no versioned transition boundary.
- **Public artifact contentHash:** arbitrary content and possible external persistence require a public API and coordination design.
- **Normalized evidence:** no verifier exists and the current top-level replacer has surprising nested behavior.
- **Audit, security, recovery, release-gate, and provider records:** grouped legacy records need per-format consumer and verifier inventories; release work and outreach remain unauthorized.

## 20. Compatibility model

### Current behavior

`ResearchBundleBuilder` serializes `workspace/snapshot.json` with legacy TypeScript `canonicalJson`, hashes the exact UTF-8 text with SHA-256, stores the digest in component entries, and contributes `path:digest` to the sorted root.

### Target V1 behavior

An additive builder option explicitly selects V1 only for `workspace/snapshot.json`. It writes component profile metadata and hashes V1 bytes. All other components remain legacy. The root continues to hash lexically sorted `path:digest` entries.

### Historical compatibility

- `LEGACY_PROFILE_KNOWN`: yes.
- `LEGACY_PROFILE_DERIVABLE`: only from ResearchBundle artifact version `1.0.0`, exact path `workspace/snapshot.json`, and absent component metadata.
- `LEGACY_PROFILE_AMBIGUOUS`: no within that bounded rule.

Existing bundles are never rewritten, rehashed, relabeled, or supplemented with metadata.

### Mixed-profile policy

`YES`. Each component entry identifies its own profile. Missing metadata is legal only for bounded legacy components. The parent root never infers child serialization and never probes profiles. A new V1 workspace snapshot may coexist with legacy run/evaluation/claim components.

## 21. Security and forensic model

- **Downgrade:** stripping V1 metadata must cause a digest mismatch under the single legacy dispatch, not fallback.
- **Profile substitution:** changing the profile or algorithm must fail before or at the one expected digest comparison.
- **Fallback:** unknown, empty, malformed, or extra metadata never invokes legacy.
- **Hash cascade:** the new component digest changes new bundle roots; root framing itself does not migrate.
- **Historical reinterpretation:** forbidden. Legacy bytes and roots remain fixed.
- **Tampering:** payload, digest, metadata, and root tampering receive separate negative tests.

## 22. Prompt-19 implementation specification

- **Identity payload:** the exact `WorkspaceSnapshot` stored as `workspace/snapshot.json`.
- **Profile metadata:** optional closed `{ profile, hashAlgorithm }` on the corresponding manifest and Product Contract component entry.
- **Algorithm:** SHA-256.
- **Legacy path:** ResearchBundle artifact version `1.0.0` + exact component path + absent metadata selects `legacy-typescript-v0` once.
- **V1 path:** explicit builder option selects `semantiq-canonical-json-v1`, writes metadata, and hashes V1 UTF-8 bytes.
- **Unknown/malformed metadata:** fail closed before hashing.
- **Mixed profiles:** allowed only per-entry; root framing remains sorted `path:digest` strings.
- **Schema/API impact:** `ADDITIVE_BACKWARD_COMPATIBLE`; no required field and no default change.
- **Version impact:** release-neutral changeset only; no version bump or release.
- **Rollback:** disable new V1 generation, retain V1 and legacy verification.
- **Dependency impact:** none.
- **Expected scope:** Core ResearchBundle builder/verifier/types, mirrored product-contract types/schema, fixed fixtures, focused tests, Python reference-parity test, migration record, and release-neutral changeset.
- **Do not touch:** receipt implementation; non-workspace component generation; root framing; TS/Python SDK bundle generation; EvidencePackage; scoring; benchmark semantics; dependencies; packages; releases/tags; historical artifacts.

## 23. Prompt-19 test plan

Prompt 19 must include:

1. fixed legacy payload, exact bytes, digest, component entry, and root;
2. fixed V1 payload, exact bytes, digest, profile metadata, and root;
3. deterministic repeated V1 generation using a fixed caller-supplied snapshot;
4. insertion-order independence;
5. Unicode keys and values;
6. safe-integer boundaries;
7. floating-point, unsafe-integer, undefined, cyclic, and unpaired-surrogate rejection;
8. bounded missing-metadata legacy verification;
9. unknown profile, malformed metadata, extra fields, and unsupported algorithm rejection;
10. profile stripping and substitution rejection;
11. payload, component digest, metadata, and root tamper detection;
12. serialization round-trip;
13. legacy and V1 schema compatibility;
14. unchanged existing API/default output;
15. independent Python V1 reference parity without Python product-support claims;
16. mixed legacy/V1 component verification;
17. unchanged sorted root framing;
18. byte-identical non-workspace component digests;
19. historical fixture preservation;
20. clean-checkout reproduction and the full repository gates.

### Schema, API, and version forecast

| Surface | Forecast |
| --- | --- |
| Component metadata schema | `ADDITIVE_BACKWARD_COMPATIBLE` |
| Builder API | `ADDITIVE_BACKWARD_COMPATIBLE` optional selection |
| Verifier API | existing call shape; additive profile dispatch |
| Existing default | unchanged legacy |
| Product-contract schema version | unchanged `1.0.0` |
| Package/release versions | unchanged by planning; Prompt 19 remains release-neutral |
| Dependencies | none |

## 24. Explicit non-authorization boundary

Prompt 18 does not authorize Prompt-19 implementation, historical rehash, public schema edits, SDK behavior changes, default changes, package publication, a release or tag, namespace migration, repository settings, outreach, scoring changes, benchmark changes, or external-validation claims.

`productionMigrationComplete`, `implementationAuthorized`, `historicalRehashAuthorized`, and `externalOutreachAuthorized` all remain `false`.

## 25. Prompt-19B implementation outcome

The preceding sections preserve the Prompt-18 selection record and the boundary that existed
before implementation. Prompt 19 initially stopped after proving that metadata-only profile
dispatch permitted a stripped V1 component to verify through the legacy path. Prompt 19B
corrected that design by hashing a V1 identity envelope that binds the profile, SHA-256
algorithm, exact `workspace/snapshot.json` path, and payload.

The selected `research-bundle-core-workspace-snapshot-component` is now
`IMPLEMENTED_V1_NEW_ARTIFACTS_WITH_LEGACY_VERIFICATION`, and
`implementationAuthorized` is now `true`. Legacy issuance remains the default, legacy bytes
and roots remain unchanged, the ResearchBundle root still uses its existing sorted
`path:digest` framing, and all other candidate surfaces remain deferred. Historical rehash,
external outreach, and production migration completion remain unauthorized.

# Third Canonicalization Migration Selection

## 1. Purpose

This planning record selects exactly one third production identity migration for a future Prompt 21. It does not change canonicalization, hashing, verification, schemas, SDK APIs, defaults, releases, or historical artifacts. The machine-readable authority is [`third-canonicalization-migration-selection.json`](third-canonicalization-migration-selection.json).

## 2. Verified two-migration baseline

Protected `main` is `721ca83b7f385c1e492af33c6f7c58cd89769cf9`, the merge commit for PR #48. The reviewed head was `551816792fd964058ba7dc7728777c96ca722cad`. Main CI run `33987034988` and Documentation Site run `33987034965` passed; no later commit exists at this baseline.

The receipt and Core workspace-snapshot component rows are both `IMPLEMENTED_V1_NEW_ARTIFACTS_WITH_LEGACY_VERIFICATION`. Receipt legacy verification remains bounded. Workspace legacy digest/root fixtures remain exact. New workspace V1 identity binds profile, algorithm, path, and payload; stripping metadata fails. The ResearchBundle root remains SHA-256 over sorted `path:digest` strings joined by `|`. No other production identity migrated and `productionMigrationComplete` remains `false`.

## 3. Migration-1 lessons

Reusable controls are explicit authenticated profile metadata, single dispatch without probing, fixed legacy/V1 vectors, fail-closed unknown-profile handling, deterministic SHA-256, opt-in V1 generation, and preserved legacy defaults. Additive schema/API fields and rollback by stopping new generation are reusable with surface-specific adaptation. Receipt version, unsigned-body boundary, and signature placement are receipt-specific.

## 4. Migration-2 lessons

Metadata declaration alone was insufficient: an attacker could strip it and recover a valid legacy interpretation when legacy and V1 payload bytes coincided. Future V1 children must bind profile, algorithm, type/path, and payload when removal could select legacy. Mixed-profile children are safe only with explicit per-child dispatch. A child digest can change a new parent root value without changing the root algorithm. Root-bearing containers therefore require explicit dependency and downgrade analysis.

## 5. Profile declaration vs identity binding

`PROFILE_DECLARATION` tells a verifier what calculation to choose. `PROFILE_IDENTITY_BINDING` cryptographically commits the selector to the result. Declaration is necessary but not sufficient whenever the declaration is removable or substitutable. The selected run-component design requires identity binding and literal dynamic-path/type binding; artifact version alone never selects V1.

## 6. Security-control maturity model

| Control | Selected surface decision |
| --- | --- |
| `PROFILE_DECLARATION_ONLY` | insufficient |
| `PROFILE_BOUND_IDENTITY` | required |
| `PATH_BOUND_IDENTITY` | required for `runs/<id>.json` |
| `CONTAINER_VERSION_BINDING` | not required; ResearchBundle schema version `1.0.0` plus absent metadata is bounded legacy |
| `CHAIN_PREDECESSOR_BINDING` | not applicable |
| `ROOT/CHILD_ATOMIC_MIGRATION` | not required; root framing remains profile-independent |
| `EXTERNAL_IDENTIFIER_COMPATIBILITY` | not applicable to the Core-only child |
| `COMMITMENT_SEMANTICS` | not applicable |

Candidates whose required control is unknown are excluded.

## 7. Current migration inventory

Splitting the previously grouped Core non-workspace row into run, evaluation, and other component families yields 40 decision rows: 23 `IDENTITY_CRITICAL`, 5 `INTEGRITY_ONLY`, 3 `CACHE_KEY`, 6 `DIAGNOSTIC`, 2 `TEST_ONLY`, and 1 `UNKNOWN_REQUIRES_REVIEW`. Two rows are implemented; one is selected but not implemented. This is a planning-resolution change, not a new runtime surface.

## 8. Remaining unknowns

`sprint-runtime-json-hashes` remains `UNKNOWN_REQUIRES_REVIEW` and is excluded. Sprint 4 recomputes package manifest/content hashes, while Sprint 5 mixes placeholder signatures, invitation tokens, event-manifest hashes, length-only integrity checks, and unknown external readers. Repository evidence does not establish a single durable identity contract, archival policy, or complete consumer set.

## 9. Complexity ladder

- Level 1: isolated execution provenance, fixture digest, provider records, normalizer, and public content hashes.
- Level 2: Core run/evaluation/other components and EvidencePackage artifact/trace components.
- Level 3: coordinated TypeScript/Python SDK ResearchBundle products.
- Level 4: benchmark manifest sets, ResearchBundle roots, SDK roots, and EvidencePackage root/seal.
- Level 5: provenance graph/seal, preregistration commitments, evaluation ledger, and trace chains.

The selected Level-2 family adds dynamic multi-instance path binding without also introducing cross-language, root-algorithm, public-API, or forensic-chain migration.

## 10. Dependency graph

The updated [`canonicalization-migration-dependencies.json`](canonicalization-migration-dependencies.json) records the two implemented references and the selected run child. Key cascades remain:

```text
Core component digests -> sorted path:digest ResearchBundle root
EvidencePackage components -> Merkle root -> seal
provenance nodes -> graph root -> graph seal
preregistration fingerprint -> execution match -> evidence eligibility
ledger payload -> entry -> successors
trace event -> successor link
public content hash -> possible persistent identifier
```

For the selected surface, only new opted-in run digests and their resulting new bundle root values change. Root framing does not.

## 11. Candidate evaluations

Each candidate is scored 1–5 independently. Value is evidence centrality, cross-language value, reproducibility gain, external relevance, ambiguity reduction, and learning value. Risk is history, blast radius, cascade, forensic sensitivity, schema/API compatibility, mixed profiles, downgrade, and rollback. Readiness is semantic understanding, binding design, bounded legacy dispatch, two fixture types, coverage, isolation, and parity feasibility. Hard gates override rank.

The Core run family has known producer/verifier behavior, a feasible legacy path, existing per-component metadata capacity, and one understood root edge. Its `Run.error.details` extension means V1 opt-in must reject unsupported values before artifact emission; it must never coerce floats or extend V1.

## 12. Benchmark-manifest analysis

The full manifest and assertions include ordinary floating-point assertion weights. Those values are identity-essential scoring inputs. Narrowing, rounding, stringifying, or otherwise normalizing them would change benchmark semantics; expanding V1 would change the shared numeric contract. The manifest and assertions are excluded. Volume mounts alone fit V1, but `fixturesMerkleRoot` is not currently recomputed by the integrity verifier and lacks independent profile metadata, so it is deferred rather than selected.

## 13. ResearchBundle remaining analysis

Core runs are strings, booleans, arrays, and optional extensible error details. A bounded V1 opt-in can reject an unsupported run rather than alter it. Evaluations contain floats and are excluded under current V1. Evidence, statistics, robustness, claims, queue, and audit payloads are heterogeneous and require per-type analysis. The Core root is already explicit, stable, and serialization-independent: it hashes sorted `path:digest` strings. No root migration is required or selected merely because children migrate.

## 14. SDK cross-language analysis

The TypeScript and Python SDKs intend the same ResearchBundle product, but do not yet expose an exact shared identity contract. TypeScript accepts broad `any[]` payloads; Python hashes snake_case dataclass dictionaries; both roots preserve constructed order. Profile metadata, payload equivalence, component ordering, legacy dispatch, and root handling are not jointly bounded. Cross-language migration is strategically valuable but fails current hard gates and is deferred.

## 15. EvidencePackage analysis

EvidencePackage combines precomputed artifact digests, recomputed arbitrary trace-payload digests, an aggregate root, and a projected package seal. The seal path is not fully cryptographically reverified and mixed-profile child semantics are absent. No one child is selected until profile/type binding and component verification are complete; root/seal migration remains deferred.

## 16. Provenance analysis

Six node hashes feed a graph root and lineage seal. A node migration changes every enclosing identity and model temperature is outside V1. Historical graph interpretation and incomplete seal verification raise the surface to Level 5. It is deferred.

## 17. Preregistration analysis

The fingerprint commits to frozen protocol content including floating-point thresholds and is consumed by execution-manifest matching and external-evidence eligibility. A new digest could change the meaning of an earlier commitment. No profile is bound and the numeric domain is incompatible, so preregistration remains deferred.

## 18. Ledger/trace analysis

Ledger entry hashes become successor `previousEntryHash` values; trace hashes similarly link later events. Neither format declares a profile transition boundary. Migrating a predecessor would rewrite the identity of the future suffix. Historical chains remain frozen and both Level-5 candidates are deferred.

## 19. Public-artifact analysis

`contentHash` accepts either raw strings or arbitrary objects and may feed a user-visible persistent artifact identifier. It is more than a diagnostic digest, but its public semantics, verifier path, profile field, and existing external persistence are unknown. Lack of adoption evidence is not evidence of no consumers. A public compatibility design is required first.

## 20. Ranked candidates

| Rank | Candidate | Value | Risk | Ready | Suitability | Level | Gate/disposition |
| ---: | --- | ---: | ---: | ---: | ---: | --- | --- |
| 1 | Core ResearchBundle run components | 23 | 22 | 35 | 59 | 2 | **PASS / SELECTED** |
| 2 | benchmark fixtures digest | 19 | 18 | 27 | 47 | 1 | deferred: no recomputing verifier/profile |
| 3 | TS/Python SDK bundle components | 30 | 37 | 24 | 47 | 3 | deferred: product/container ambiguity |
| 4 | execution-run provenance | 19 | 18 | 26 | 46 | 1 | deferred: no verifier/profile |
| 5 | public artifact content hash | 26 | 34 | 19 | 37 | 1 | deferred: public API/consumer ambiguity |
| 6 | preregistration fingerprint | 25 | 36 | 22 | 36 | 5 | excluded: floats/commitment semantics |
| 7 | benchmark manifest digest | 24 | 37 | 23 | 34 | 4 | excluded: floats/semantic change |
| 8 | provenance nodes/root/seal | 26 | 39 | 19 | 32 | 5 | deferred: forensic cascade |
| 9 | EvidencePackage components/root/seal | 25 | 38 | 19 | 31 | 4 | deferred: mixed profiles/incomplete seal |
| 10 | ledger and trace chains | 23 | 39 | 21 | 28 | 5 | deferred: successor cascade |

`Suitability = 2 × Value + Readiness − Risk`. Full dimension scores and hard-gate results are machine-readable.

## 21. Selected third migration

`SELECTED_THIRD_MIGRATION = research-bundle-core-run-components`

This means only Core `runs/<run.id>.json` child identities. It is not an implementation authorization.

## 22. Why it won

This candidate adds exactly one controlled dimension beyond Migration 2: a dynamic, repeatable component family with multiple literal paths. It reuses the proven profile-bound child envelope and unchanged root framing, but adds type binding and path-substitution defenses. Producer and payload-aware verifier remain colocated. Existing metadata capacity is additive, fixed fixtures are feasible, legacy verification can remain exact, no historical rehash or external coordination is required, and rollback is bounded.

## 23. Why alternatives were deferred

ResearchBundle evaluations and other outputs have floats or extensible payloads. The root already has stable non-JSON framing. SDKs lack bounded cross-language product equivalence. EvidencePackage and provenance couple components to incompletely verified seals. Preregistration and chains are forensic commitments. Benchmark manifest/assertions require forbidden numeric changes. Provider/partner exchange lacks external-consumer evidence. Execution provenance and fixtures lack a real recomputing verifier. The normalizer lacks a verifier and has unusual nested-key behavior. Public artifact hashing needs public compatibility design.

## 24. Security threat model

The V1 preimage must bind profile, SHA-256 algorithm, `research-bundle-run` type, literal component path, and exact payload. Stripping metadata must select legacy once and fail to match V1. Profile/algorithm substitution, extra/malformed metadata, run-ID path replay, workspace/evaluation cross-type replay, payload tamper, digest tamper, and unsupported payload values must fail closed. Each child dispatches independently. The root must not infer profiles, and historical bundles must never be relabeled or recalculated.

## 25. Prompt-21 implementation specification

- Surface: Core ResearchBundle `runs/<run.id>.json` components only.
- Current bytes/hash: legacy `canonicalJson(run)`, SHA-256 of stored UTF-8.
- V1 preimage: `{canonicalization:{profile,hashAlgorithm},componentType:"research-bundle-run",componentPath,payload}` serialized by `semantiq-canonical-json-v1`.
- Metadata: optional closed `canonicalization` object on each selected component entry.
- Legacy rule: ResearchBundle schema version `1.0.0` plus missing component metadata means legacy TypeScript only.
- Generation: one additive explicit run-component option; omission remains byte-identical legacy; unsupported V1 values abort before output.
- Verification: validate metadata, dispatch once, bind type/path/payload, and never probe.
- Parent: preserve sorted pipe-joined `path:digest` root algorithm; new opted-in roots may differ.
- Schema/API: additive and backward-compatible only; no version bump required by this plan.
- Rollback: stop new V1 generation but retain both bounded verification paths.
- Dependencies: none.
- Do not touch: workspace behavior, evaluation/other component hashes, root framing, SDK producers, EvidencePackage, scoring, benchmarks, provenance, preregistration, chains, versions, releases, tags, dependencies, or settings.

Expected implementation scope is enumerated in the machine-readable selection. Prompt 21 must not broaden it without returning to planning.

## 26. Prompt-21 test plan

Require fixed legacy and V1 payload/byte/digest/component/root vectors; repeated deterministic generation; insertion-order and Unicode checks; safe-integer acceptance and rejection of floats, unsafe integers, `undefined`, cycles, and unpaired surrogates; bounded legacy dispatch; unknown/malformed profile and algorithm failure; stripping/substitution failure; payload/digest tamper failure; run-ID path and cross-type replay failure; multiple mixed legacy/V1 runs; unchanged root framing; historical/workspace preservation; closed optional schema metadata; no-option API compatibility; Python reference parity without SDK migration; clean-checkout focused reproduction; and full repository gates.

## 27. Audit-transparency note

`version:audit` uses `git grep`, so an uncommitted new file is not authoritative evidence for the final count. Prompt 20 validations run before commit, but the only count reported in the PR body and final handoff must be the rerun from the exact committed HEAD. If an amendment occurs, the audit must run again after the amendment.

## 28. Explicit non-authorization boundary

This document does not authorize production changes, historical rehash, a fourth migration, outreach, package publication, dependency changes, release/tag changes, or GitHub settings changes. `implementationAuthorized`, `historicalRehashAuthorized`, `fourthMigrationAuthorized`, and `externalOutreachAuthorized` are `false`; `productionMigrationComplete` remains `false`.

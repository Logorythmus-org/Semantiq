# Phase 5 — ObservationEvidence custody, consumer map and retention proposal

> **DRAFT / REVIEW-ONLY — not approved or implemented**
> 
> Parent [RFC #196](https://github.com/Logorythmus-org/Semantiq/issues/196), [#192](https://github.com/Logorythmus-org/Semantiq/issues/192), and Phase 4 [Draft PR #198](https://github.com/Logorythmus-org/Semantiq/pull/198).
> Baseline: protected `main` at `89cfdcb10ab407f5c1ef84b8cda05894b5dd4a2a`, inspected 2026-10-11. No changes to public contracts, version flags, runtime or historical evidence.

## 1. Source-grounded consumer and adjacent-technology inventory

The source inventory below is **bounded**: the GitHub tree at this commit was enumerated, and the listed files were read. This is not an exhaustive symbol-level search of all repository file bodies. GitHub code-search results were incomplete, so non-occurrence beyond inspected paths is **NOT ESTABLISHED**.

| Surface | Source | Observed evidence | Boundary |
| --- | --- | --- | --- |
| Legacy ObservationEvidence producer | `packages/evidence-normalizer/src/normalizer.ts`, `src/types.ts` | `EvidenceNormalizer.normalize(RawExecutionBundle)` builds `ObservationEvidence` and `evidenceDigest` | Source observation; no general persistence/remote export contract established |
| Library bridge | `packages/semantiq/src/sandbox.ts` | Re-exports `../../evidence-normalizer/src/index.js` | Publicly reachable as source-level SDK bridge does **not** establish actual production use |
| Direct exercised caller | `tests/unit/sandbox-evidence-tck.test.ts` | Instantiates `EvidenceNormalizer`; verifies sanitized streams/diffs and digest shape | Test execution, not an operational storage/export consumer |
| Adjacent EvidenceService | `packages/semantiq/src/services/evidence-service.ts` | Uses behavioral metrics, claim store, graph functions | No direct call to this normalizer in inspected file; separate evidence workflow |
| Service descriptor | `services/evidence/src/index.ts` | Exposes metadata describing evidence HTTP routes | Only a metadata object inspected, **not** proof that those routes are live, deployed or use this normalizer |
| Separate Research Bundle path | `packages/evidence/src/research-bundles/bundle-builder.ts` and `bundle-verifier.ts` | Component canonicalization, SHA-256/Merkle verification | Separate evidence identity subject; no inspected direct flow from `ObservationEvidence` |
| Separate partner exchange | `packages/evidence/src/partner-exchange/redaction-engine.ts` | Applies content redaction and recomputes digests for exchange material | Bounded redaction, distinct from ObservationEvidence disclosure; universal safety not established |
| Separate workbench ledger | `packages/evidence/src/research-workbench/workbench-audit-log.ts` | Keeps in-memory chained audit entries and verifies hash links | Local audit-chain consistency does not itself authenticate the source |
| Storage abstraction | `packages/storage/src/index.ts` | `StoragePort.read`/`write` shape | No delete, access-control, backup or retention guarantee in this interface |

**Observed from source** is distinct from **inferred integration**. A shared name, import barrel or SHA-256 is not sufficient evidence of a single end-to-end custody chain. The historical digest issue remains tracked separately under #192; this annex does not change its priority or claim an implementation repair.

## 2. Proposed custody stages and evidence types (not registered)

```text
capture (restricted, operator-authorized)
  -> classify/privacy-screen
  -> create explicit local-raw or internal-sanitized record
  -> freeze committed projection and scope metadata
  -> calculate canonical digest (consistency)
  -> independently authenticate the signed commitment (future/trusted key)
  -> authorize publication of distinct public summary (future)
  -> independent verification, retention audit and revocation/deletion record
```

Every transition needs a separately attributable actor, time-source provenance, policy decision, input digest and output digest. Times supplied by the same emitter are **not independent trusted timestamps**. Identifiers may disclose information, so public correlation IDs need authorization and unlinkability review.

`local-raw`, `internal-sanitized` and `public-summary` remain Phase 4 **proposed vocabulary**, not existing production schemas.

## 3. Authentication vs content consistency — acceptance contract

| Question | Proposed check | What it cannot establish alone |
| --- | --- | --- |
| Do bytes match a digest? | Canonical digest recomputation under a declared profile | Who issued the artifact, nor truth of content |
| Does an event chain link? | Sequence/root continuity with a separately pinned head | Integrity after a hostile party rewrites the entire chain/head |
| Did an authorized issuer commit to this exact domain/scope? | A reviewed signature scheme, independently trusted public key and authorized key ID | Truth of measurement, privacy compliance, or operator consent |
| Was the key valid at the relevant time? | Trusted key lifecycle records, rotation, revocation and time-source policy | Authentic historical time from self-reported timestamps |
| Was public sharing permitted? | Explicit publication authorization and data-classification review | Any integrity verdict; publication permission is separate |
| Is evidence scientifically supported? | Study/run methodology, trace and independent replication review | Cryptographic seal alone |

**Critical design rule:** A public key embedded only inside an untrusted artifact cannot establish trusted identity. Pin the verification authority independently (e.g. a preapproved key registry or locally pinned key material). Signing must bind the **canonical version, disclosure scope, domain, object ID, issuer identity, subject digest, and projection version** as reviewed. Never silently interpret legacy format-shaped values as newly trusted signatures.

This document deliberately does not include security-sensitive descriptions of specific existing signature implementations. Per `SECURITY.md`, vulnerability details require **private responsible disclosure**, not public GitHub Issues.

## 4. Draft policy matrix for access, retention and disposal

| Material | Proposed access | Retention/expiry design requirement | Disposal and verification |
| --- | --- | --- | --- |
| Raw execution/credential-bearing material | Local operator only; by exception and least privilege | Short, explicitly approved, purpose-bound period; **no invented universal number** | Verified local deletion plus backup/replica inventory; deletion evidence cannot prove every external copy disappeared |
| Internal sanitized evidence | Authorized reviewer, least-privilege team roles | Contract-specific duration, legal hold and classification rules | Revoke access, expire through a tested workflow, retain only policy-approved audit metadata |
| Public summary | Explicitly approved publication audience | Publication-specific policy including whether public archival is permanent | Retraction/tombstone as appropriate; cannot assure deletion from third-party mirrors |
| Chain-of-custody event metadata | Custodian/auditor, limited identifiers | Retention sufficient for applicable audit obligations; independently determined | Preserve minimum necessary integrity/revocation log without leaking content |
| Private signing keys | Designated trusted key custodian, not raw evidence readers | Rotation and revocation lifecycle; short-lived access | Rotate/revoke, isolate private material, evidence of cryptographic destruction where supported |

The existing normative `Docs/security/data_handling.md` explicitly says that the repository **does not establish a universal retention/deletion guarantee**; this draft does not overwrite that policy. Data subject requests, contracts, local law and operational capability still need separately reviewed procedures.

## 5. Proposed roles and separation of duties

| Role (prospective) | Can | Must not |
| --- | --- | --- |
| Runner/capture process | Emit raw observation into approved restricted store | Publish it or self-authorize public claims |
| Sanitization worker | Produce a policy-specific derived subset with provenance links | Assume regex redaction alone guarantees privacy |
| Custody authority | Pin a digest, control key policies, record chain transitions | Assert empirical truth solely from integrity metadata |
| Publication reviewer | Authorize disclosure with context/consent and classification | Grant signing identity or override unknown verification state |
| Independent verifier | Recompute a known profile and validate a pinned trust anchor | Infer that absent evidence proves safety |
| Data steward | Enforce retention/deletion procedures and legal holds | Claim remote mirror deletion without independent proof |

These are suggested responsibility labels, not current GitHub teams or permissions.

## 6. Test-only feasibility proof and what it cannot prove

A non-routed synthetic test can show correct use of offline Node Ed25519 cryptographic primitives and an **independently pinned public key**. It can distinguish a self-consistent replacement hash from a signature checked against the trusted external key; it can reject changed content, unknown keys and revoked authorizations in a synthetic registry.

This is **not** deployment, a production signing API, an implemented trust registry, verified key custody, time-stamping, cross-language parity or an approved cryptographic profile. No public evidence identity, record type or migration flags should be updated based only on a successful prototype test.

## 7. Open acceptance gates

The unresolved items are a full-text repository and runtime consumer inventory; actual persisted/history usage of `ObservationEvidence`; privacy and publication policy; key custody and independently trusted registry; issuer/reviewer authorization; replay, revocation and backup procedures; duration/retention choices grounded in legal and operational obligations; TS/Python frozen vectors; and Core/CODEOWNER acceptance of RFC #196.

Production implementation remains blocked until those decisions are approved. Existing historical digests stay unchanged; `main`, schema identity and release versions stay untouched. The backlog for security-sensitive code findings must be handled under `SECURITY.md` private reporting rules, not via a public issue with technical vulnerability details.

**Scientific boundary:** Observed ≠ inferred; absence ≠ counterevidence; integrity ≠ truth; passing synthetic tests ≠ production assurance.

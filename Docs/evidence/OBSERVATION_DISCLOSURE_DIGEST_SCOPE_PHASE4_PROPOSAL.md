# ObservationEvidence disclosure and digest scope — Phase 4 proposal

> **Status: DRAFT / REVIEW-ONLY / NOT AN APPROVED CONTRACT**
> Parent RFC: [#196](https://github.com/Logorythmus-org/Semantiq/issues/196). Defect: [#192](https://github.com/Logorythmus-org/Semantiq/issues/192). Baseline main: `89cfdcb10ab407f5c1ef84b8cda05894b5dd4a2a`.
> This document is a candidate design for maintainer discussion. It changes no runtime, schema, hash profile registry, release, or historical digest.

## 1. Evidence source and observed risk

`packages/evidence-normalizer/src/types.ts` defines `ObservationEvidence` with context, interpretation, decision, action, result, consequence, provenance, and a string `evidenceDigest`.
In `packages/evidence-normalizer/src/normalizer.ts`, `context.environmentVariables` copies the source environment map and `decision.commandArray` copies raw command arguments. `decision.workingDirectory` and file paths can expose private paths. `result.stdoutSanitized`, `result.stderrSanitized`, `consequence.filesModified[].diffUnified`, and optional `interpretation.rawThoughtLog` undergo pattern-based redaction, which is *not* an exhaustive proof of secrecy. A digest of disclosed secrets does not make disclosure safe; lower-entropy secret values can also be vulnerable to guessing by digest comparison.

The legacy `evidenceDigest` array-replacer preimage fails to bind many nested values. The independent prospective digest test [PR #197](https://github.com/Logorythmus-org/Semantiq/pull/197) does **not** establish a safe disclosure contract. The canonicalization migration matrix classifies this hash surface as `IDENTITY_CRITICAL` / `NOT_SAFE_TO_MIGRATE_YET`.

## 2. Data scopes — proposed, not existing implementation

| Scope | Candidate content | Disclosure and integrity semantics |
| --- | --- | --- |
| `local-raw` | Original execution bundle, if retention is necessary | Restricted local capture; **must not** be exported through a public evidence pathway; no public seal implied |
| `internal-sanitized` | Reviewed redacted observation with authorized fields | Restricted review, provenance and access controls required; exact allowed-field contract and verification are **not yet specified** |
| `public-summary` | An explicit minimum-information projection | Separately identified digest binds **only** the disclosed summary, not a full run or the omitted data |

These are proposed vocabulary values, not registered schema identifiers. Publishing a redacted full `ObservationEvidence` must not be inferred from the presence of text-redaction methods.

## 3. Field candidate matrix for public disclosure

| Observation fields | Candidate public treatment | Reason / review question |
| --- | --- | --- |
| `evidenceId`, `taskId`, `normalizedAt` | Withhold by default; issue a purpose-specific random public correlation ID if authorized | Identity, timing, and correlation can themselves disclose private data |
| `context.environmentVariables` | Withhold values and names by default | Environment maps routinely carry secrets; any allowlist needs reviewed semantics |
| `context.baseImageDigest`, other context | Withhold by default | Image or sandbox identifiers may reveal proprietary state |
| `decision.commandArray`, `workingDirectory` | Withhold entirely by default | Argument values and paths may be secret or personal |
| `action.dispatchedAt`, `timeoutConfiguredMs` | Withhold pending policy | Timing and resource budgets can be sensitive |
| `result.exitCode`, `timedOut`, `oomKilled`, truncated flags | Potentially disclose after security review | Operational outcomes; cannot establish behavioral goal completion |
| `result.executionDurationMs`, `peakMemoryBytes` | Candidate aggregate only; require bounded disclosure | Detailed timing/resources may fingerprint hosts or private workloads |
| `result.stdoutSanitized`, `stderrSanitized` | Withhold text by default | Pattern redaction is insufficient to guarantee privacy |
| `consequence.totalMutationsCount`, `spawnedProcessCount` | Candidate bounded count only | Counts do not prove correct task execution |
| `consequence.filesCreated/Modified/Deleted` | Withhold raw paths, diff text and content hashes by default | Private paths, confidential code and guessable low-entropy content |
| `interpretation.rawThoughtLog`, `structuredIntent` | Withhold by default | Sensitive reasoning and user/agent-provided text |
| `recovery`, `provenance` | Withhold pending separate protocol review | May leak infrastructure and source links |
| `evidenceDigest` | Never recursively include in its own digest subject | Avoid circular preimage; always declare profile and scope |

This matrix is an **unapproved candidate** for discussion, not a guarantee that the listed fields are safe to publish.

## 4. Proposed isolated public-summary fixture

A test-only fixture uses an explicitly supplied **synthetic** `publicRunId` and an allowlisted subset of execution results: `exitCode`, `timedOut`, and `totalMutationsCount`. All private source strings and paths are excluded by construction, and the disclosed subset is self-identified with a fixed domain, a prospective projection identifier, and explicit omitted-field names.

Its digest subject conceptually binds:

```text
{
  domain: "semantiq.observation.public-summary",
  projectionVersion: "proposal-0",
  publicRunId: <externally approved opaque non-sensitive ID>,
  result: { exitCode, timedOut },
  consequence: { totalMutationsCount },
  withheldFields: [fixed, versioned field names]
}
```

The **scope is part of the hashed subject**, not only external metadata, to prevent confusing a summary digest with an internal evidence digest. The summary digest is named `semantiq-canonical-json-v1` for serialization, but this alone does not register a product-specific observation profile.

If `exitCode` changes, the public-summary digest must change. If a withheld command argument or environment value changes, this digest is intentionally unchanged. Therefore verification can only say **the disclosed public summary was not modified relative to its seal**. It cannot validate raw execution, internal redaction quality, goal success, or withheld values. Such strong claims require a separately approved internal protocol.

## 5. Profile and version verification requirements

- An approved envelope must carry explicit `envelopeVersion`, `digestProfile`, `disclosureScope`, `projectionVersion`, `digest`, and its committed public subject. Exact wire names are not approved.
- Hash with the repository's existing `semantiq-canonical-json-v1` utility on a deterministic, explicitly projected object. Unsupported Unicode, non-integer/negative-zero numeric values, nested `undefined`, cycles, and non-JSON types must fail closed. Do not auto-normalize with lossy JSON round-trips.
- Unknown profile, scope, projection version, malformed digest, or absent metadata cannot produce a verified verdict. Unknown historical origin is `NOT_ESTABLISHED`, not a fallback.
- A distinct immutable historical `observation-top-level-replacer-v0` profile must reproduce original bytes without claiming omitted nested fields were sealed; it is **not** `legacy-ts-v0`.
- Published summaries need an explicit provenance/disclosure statement and security review. A passing hash check means **summary integrity only**.
- TS/Python vector parity and historical consumer inventory remain required before any production schema/generation change.
- No silent rewrite of stored `evidenceDigest`, schema `1.0.0`, alpha release identity, or migration-matrix flags.

## 6. Review blockers

1. Establish real consumers, storage paths, old-artifact provenance and verifier APIs for `ObservationEvidence`; a repository-code finding does not establish downstream adoption or public export.
2. Agree on what counts as meaningful and safe operational evidence. Proposed fields may leak workload information and require threat-model acceptance.
3. Specify how `publicRunId` is generated and how authorized reviewers can link it to internal runs without exposing private identifiers.
4. Decide whether a public-summary seal is needed at all and whether the product needs a separate internal-sanitized V1 seal; do not conflate the two.
5. Accept RFC #196 via normal review and obtain CODEOWNER security and Core approval before implementation.

## 7. Acceptance evidence plan

Test-only synthetic cases should demonstrate: omitted source secrets absent from the public subject; an included result mutation changes its digest; an omitted private value does not; the scope and domain cannot be substituted; missing/unknown/malformed profile metadata fails closed; no network, raw credentials, or private data is involved. The suite cannot establish safety for arbitrary text or external runtime input.

**Scientific boundary:** `Observed ≠ Inferred`; `Absence ≠ Counterevidence`; `Bundle integrity ≠ truth`.

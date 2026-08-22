# SemantIQ Versioning & Release Policy

## Canonical public identity

SemantIQ's provisional software identity is **`0.1.0-alpha.2` — Public Alpha
(Experimental)**. This maturity statement is independent of every schema, API,
benchmark, protocol, and documentation version in the repository.

| Surface | Current value | Meaning |
| :--- | :--- | :--- |
| Repository software identity | `0.1.0-alpha.2` | Provisional Public Alpha software version |
| TypeScript SDK | `0.1.0-alpha.2` | npm SemVer spelling; not currently published |
| Python distribution | `0.1.0a2` | PEP 440 equivalent; not currently published |
| Product-contract schema | `1.0.0` | Version of serialized contracts and fixtures |
| HTTP API route family | `/api/v1` | URL namespace, independent of software SemVer |
| Documentation/spec milestones | commonly `1.0.0` | Version of the document or specification only |

A `1.0.0` schema, API, benchmark, protocol, fixture, or documentation milestone
must not be presented as evidence that SemantIQ software is stable or has shipped
a `1.0.0` release.

## Live release evidence baseline

The following facts were verified from Git and GitHub on 2026-08-22:

- Protected `main` was `596bdabc869e5c70257058a2017a8eac8d9b3711`.
- Annotated tags `v0.1.0-alpha.1` and `v0.1.0-alpha.2` exist.
- The published GitHub Release is `v0.1.0-alpha.1` and is marked as a prerelease.
- No GitHub Release exists for `v0.1.0-alpha.2`.
- The `v0.1.0-alpha.2` tag is not an ancestor of the verified `main` baseline.

This policy does not retag history, manufacture a release, or claim that current
`main` is byte-identical to the alpha.2 tag. The alpha.2 value is the explicitly
chosen provisional public identity for current source metadata.

## Classification of `1.0.0` references

Every literal `1.0.0` occurrence must be assigned to exactly one category by
`pnpm version:audit`:

1. **SOFTWARE_RELEASE_VERSION** — a version field for a software build, release,
   or subject-software fingerprint. No current SemantIQ stable software release
   belongs in this category at `1.0.0`.
2. **PACKAGE_VERSION** — package-manager metadata, dependency locks, or SBOM
   package coordinates. These may evolve independently.
3. **API_SCHEMA_VERSION** — contract, payload, artifact, fixture, protocol,
   benchmark, receipt, or route-family compatibility identifiers.
4. **DOCUMENTATION_MILESTONE** — a document, specification, architectural
   baseline, or externally referenced documentation-format version.
5. **HISTORICAL_RELEASE_RECORD** — preserved phase, audit, authorization,
   release-candidate, incident, or prior-release evidence.
6. **STALE_OR_INCORRECT_PUBLIC_CLAIM** — an active public surface that presents
   `1.0.0` as the current SemantIQ software/package release without authoritative
   evidence. The audit fails while any such occurrence remains.

The classifier emits a record for each occurrence, including path, line, column,
category, and source text. It fails if an occurrence is unclassified or if an
active stale public claim remains.

## Package-version policy

Package versions are not mass-aligned merely because they share a workspace:

- Root `tech-club` and private `@tech-club/semantiq` source metadata follow the
  provisional repository identity `0.1.0-alpha.2`.
- `@semantiq/sdk` uses `0.1.0-alpha.2`; Python uses `0.1.0a2`.
- Internal packages at `0.0.0` or `0.1.0` keep their existing independent
  lifecycle until the legacy namespace/package migration is separately approved.
- Schema identifiers embedded in package source do not determine the package
  distribution version.

## Schema and API policy

The canonical product-contract schema identifier is `1.0.0`. The TypeScript SDK,
Python client, CLI information output, and HTTP metadata expose release and schema
versions separately. The compatibility `version` field in existing SDK/HTTP
surfaces remains a schema-version alias and is explicitly labeled as such.

Breaking serialized-contract changes require a new schema major version. HTTP
route-family changes require an independently reviewed route namespace change.
Neither event automatically determines the repository software version.

## Documentation and historical records

Document and specification headers may retain `1.0.0` when the value describes
that document or specification. Phase reports, release authorizations, clean-room
records, preservation manifests, and prior release evidence remain historical
records and are not silently rewritten to match the current source identity.

Historical alpha.1 artifacts therefore remain alpha.1. A future release process
must create new evidence rather than modifying sealed historical records.

## Semantic versioning

Software and independently versioned packages use [Semantic Versioning
2.0.0](https://semver.org/). Python distribution versions use the equivalent PEP
440 spelling where required. Public Alpha limitations remain visible regardless
of the numeric version.

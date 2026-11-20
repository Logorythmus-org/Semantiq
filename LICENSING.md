# SemantIQ Licensing & Rights Boundary

**Status**: `CURRENT REPOSITORY POLICY / RIGHTS-REVIEW BOUNDARY`  
**Project**: SemantIQ  
**Organization**: Logorythmus

This document describes the repository's current licensing declarations and the
limits of what those declarations establish. It is not legal advice, a title
opinion, or a substitute for provenance and third-party-rights review.

## 1. Root software license

The repository root [`LICENSE`](LICENSE) contains the MIT License.

Its copyright line names Kaveh Mosafa (Logorythmus), on the maintainer's
reported clarification that the earlier project label was a personal working
name rather than a separate legal entity or copyright owner. This is an
attribution correction in the current source, not an assignment, change to MIT
license terms, or retroactive alteration of existing release/tag records.

## 1a. Maintainer-reported authorship (2026-11-03)

The project maintainer reports having developed the project's original code to date
without a co-developer or external code contributor. This is a **maintainer
statement**, not an independent authorship audit, assignment instrument, or
verification of rights in imported material, datasets, dependencies, model outputs,
provider integrations, or assets.

The maintainer further reports that the former project name was a temporary
personal working label with no separately registered company, organization,
employer, or other rights-holding entity behind that label. The current root
copyright attribution has accordingly been corrected to the maintainer's
name and public project identity. Historical notices and previous MIT grants
remain intact in past Git objects and copies already distributed.
Sole development by itself does not establish that every repository asset is
original, unencumbered, or available for relicensing; employment/contractual
rights and third-party provenance remain separate review questions.

## 2. Repository licensing declarations

The project has historically used a multi-tier licensing model for different
classes of project material. Those declarations apply only where the project has
the rights required to make them and where no more specific file, directory,
third-party, or upstream notice controls the material.

Current declared intent for **project-controlled original material** is:

| Material class                                                                                      | Declared repository policy                  | Evidence boundary                                                                                                                                    |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source code and SDK implementation                                                                  | MIT                                         | Root MIT license is present; package-level metadata is not yet fully reconciled across all workspace manifests.                                      |
| Documentation and architecture material                                                             | CC-BY-4.0 policy has been used historically | The relationship between this policy and the root MIT license's reference to associated documentation has not been independently legally reconciled. |
| Synthetic project-authored fixtures, prompts, and example data explicitly designated for open reuse | CC0-1.0 has been used historically          | Do not apply this blanket label to third-party, imported, externally supplied, or provenance-unclear material.                                       |

A file's presence in the public repository is not proof that the project owns
every right in that file.

## 3. Third-party and imported material

Third-party, upstream, externally submitted, generated-from-external-input, or
otherwise provenance-sensitive material must retain and follow its applicable
license, attribution, redistribution, and usage requirements.

Do not infer from this policy that:

- every repository file is original project-authored material;
- every dataset or prompt is owned by the project;
- every dependency is permissively licensed;
- every external runtime or provider can be redistributed;
- repository publication resolves unresolved provenance or ownership questions.

See [`Docs/governance/ip-architecture.md`](Docs/governance/ip-architecture.md).

## 4. Package metadata status

Current package metadata is not fully normalized.

Examples from the current repository include:

- the Python package declaring MIT in `packages/python/pyproject.toml`;
- JavaScript workspace packages whose manifests do not currently all contain a
  `license` field;
- historical `@tech-club/*` package identities that remain migration-bound.

Package-manifest metadata should therefore not be described as fully reconciled
until a dedicated package/license metadata audit completes.

## 5. Third-party dependency status

[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) is a public attribution
surface, but it is not currently established as a complete, release-grade
dependency-license inventory.

The repository must not claim:

- zero copyleft dependencies;
- zero proprietary dependency exposure;
- complete permissive-license coverage;
- complete attribution compliance;

without a current dependency/SBOM/license audit tied to the exact release commit.

A future release that makes dependency-license claims should generate and review
an exact dependency inventory from its selected lockfiles/manifests and retain
the resulting evidence.

## 6. External runtimes and provider boundaries

Architectural process/network isolation from an external runtime can reduce
technical coupling, but it is not by itself a legal conclusion about license
obligations.

Provider/runtime licensing must be evaluated from the actual integration,
distribution model, dependency relationship, provider terms, and relevant
license text.

## 7. Contributions

Contributors should submit only material they have the right to contribute and
should identify material derived from third-party or restricted sources.

Current contribution policy is documented in
[`CONTRIBUTING.md`](CONTRIBUTING.md).

A DCO 1.1 text is present in
[`Docs/CONTRIBUTOR_LICENSE_AGREEMENT.md`](Docs/CONTRIBUTOR_LICENSE_AGREEMENT.md),
but that filename does not make it a Contributor License Agreement (CLA). The
repository record alone does not demonstrate signed DCO enforcement for every
historic contribution or grant the maintainer an exclusive relicensing right.
Future DCO enforcement, CLA adoption, patent grants, and contributor-rights
verification require a documented human/legal decision.

## 8. Historical legal/readiness statements

Historical ADRs, release documents, or audit reports may contain stronger
licensing or legal-safety conclusions. Those records are preserved as provenance
and are not automatically current legal determinations.

Claims such as "total legal safety", "zero copyleft risk", or equivalent
certification language require current evidence and appropriate legal review
before reuse as a present-tense public claim.

## 9. No certification or ownership inference

This policy does not establish:

- trademark registration;
- certification authority;
- ownership of all repository content;
- legal clearance of every dependency;
- legal compatibility of every external provider;
- rights to relicense third-party material.

Unresolved rights questions remain on a separate review track.

## 10. Commercialization evidence boundary

MIT permits commercial reuse of code covered by the license, subject to its
conditions; it does **not** certify complete ownership, the legal status of a
business, or compliance by a specific deployed service. Public Alpha is not a
production-supported, certified, or independently audited product.

Commercial offerings must be scoped against the **exact** source and release
artifacts, distribution model, provenance of supplied data, third-party licenses,
service obligations, security and privacy requirements, and applicable business
registration. The current actionable gates are documented in
[`Docs/governance/commercialization-readiness.md`](Docs/governance/commercialization-readiness.md).

# SemantIQ Commercialization Readiness and Rights Gates

**Status:** Current public commercialization boundary (not legal advice, ownership clearance, or a production-readiness certification)  
**Audit baseline:** 2026-11-03; repository `Logorythmus-org/Semantiq`, `main` commit `dd24677db17953586ae230e0647430e1176fd73c`  
**Product maturity:** Public Alpha (Experimental), source identity `0.1.0-alpha.2`

This document records what can currently be demonstrated from the public project, what has been stated by the maintainer, and what remains undecided before commercial distribution or customer deployment. A reviewed pilot is not equivalent to a production SaaS launch.

## Evidence classes

- **REPOSITORY-VERIFIED:** recorded in a checked-in file at the cited audit baseline; this does not imply independent legal or security verification.
- **MAINTAINER-REPORTED:** supplied by the project maintainer; not independently authenticated.
- **NOT ESTABLISHED:** additional documentary evidence, build evidence, commercial terms, or legal review required.
- **DECISION REQUIRED:** future human authorization needed; the repository is not itself a legal entity.

## Rights and licensing

| Question | Evidence/status | Required action before any stronger claim |
| --- | --- | --- |
| Root code-license declaration | **REPOSITORY-VERIFIED:** `LICENSE` contains MIT terms. | Preserve the MIT conditions and original notices in redistribution; verify rights to the specific material supplied. |
| Original project authorship | **MAINTAINER-REPORTED:** the maintainer states they have developed the original project code without another code collaborator to date. | Verify historic contribution/provenance records and any employment, commissioned-work, or assignment constraints before declaring exclusive ownership. |
| Historic Tech Club copyright | **REPOSITORY-VERIFIED:** root `LICENSE` retains `Copyright (c) 2026 Tech Club`. | Document historic identity and any relevant agreements; preserve this line until human/legal review supports a change. No copyright transfer is inferred from branding. |
| Third-party code, dependencies, models, data, fixtures | **NOT ESTABLISHED:** no complete release-grade attribution/license inventory. | Generate exact-commit lockfile/dependency evidence, classify bundled/runtime/transitive items, and review relevant licenses and provider terms. |
| Documentation/fixture rights | **NOT ESTABLISHED** as a blanket clearance; historic CC-BY-4.0/CC0 policies are described in `LICENSING.md`. | Review provenance and file-specific rights before distribution under an asserted license. |
| Contributors and relicensing | DCO 1.1 text exists; CLA, sign-off enforcement, copyright assignment, and relicensing powers are **NOT ESTABLISHED**. | Adopt a specific contribution-rights policy after review; do not infer a CLA from the historical filename. |
| Brand and certification | Brand usage policy exists; trademark registration/certification authority **NOT ESTABLISHED**. | Obtain rights/mark assessment before claims such as “certified” or exclusive trademark ownership. |

The maintainer report does not establish title in third-party material or undo MIT rights already granted to recipients. No dual-license change or retroactive license withdrawal is authorized here.

## Software and commercial offering boundary

| Surface | Current status | Commercial gate |
| --- | --- | --- |
| Public Python/TypeScript SDKs and headless API | **REPOSITORY-VERIFIED:** source and internal tests available. | Pin a known revision; install and reproduce a selected customer workflow independently of historical docs. |
| Release identity | **REPOSITORY-VERIFIED:** source `0.1.0-alpha.2` is provisional; release/tag discrepancies documented in `Docs/releases/CURRENT_RELEASE_STATUS.md`. | Publish only from a reviewed, fixed release commit with independent manifests and correct package publication status. Do not move historical tags. |
| Container and distribution | Docker and local container smoke path present; production deployment **NOT ESTABLISHED**. | Confirm reproducible build, bill of materials, notices, vulnerability review, least privilege, upgrades, backups and recovery for the actual distribution. |
| Security/privacy | Public Alpha policy, tests, and disclosures exist; blanket GDPR compliance or enterprise security guarantee **NOT ESTABLISHED**. | Document selected data flows, roles, retention, incident response, subprocessors, DPA where applicable, and real deployment controls before processing client data. |
| Support and SLA | Community support policy exists; production SLA **NOT ESTABLISHED**. | Define responsible contact, scope, availability, response times, liability and service exclusions in each customer contract. |
| External validation and adoption | Independent validation, real-world adoption and production-scale reliability **NOT ESTABLISHED**. | Collect an actual third-party reproducibility report and scoped pilot evidence without upgrading scientific claims. |
| Enterprise / managed SaaS | Architectural concept, not verified released commercial offering. | Separate hosted/private implementations, tenancy, contracts, billing, security, customer support and rights before sale. |

## Recommended first commercial experiment

An explicitly limited **B2B evaluation / integration pilot** can be designed before claiming production readiness: use a local or test environment; specify exact deliverables (configuration, evaluation report, evidence bundle and technical interpretation); use synthetic or explicitly authorized customer data; make reproducibility conditions visible; and exclude unsupported certification, accuracy, uptime, security and compliance guarantees.

A paid pilot can be **offered only after** the operator has verified the applicable self-employment, tax, contract and client-data requirements. This document makes no assertion that legal registration, tax status, Jobcenter funding or marketplace eligibility is granted.

MIT code alone does not require selling an exclusive source license. Candidate revenue streams are scoped evaluation services, implementation/support, or **new separately developed** hosted/enterprise capabilities with a verified rights chain. AWS Marketplace eligibility, seller onboarding, product readiness and operational responsibilities must be checked separately; a generic internal `packages/marketplace` scaffold is not proof of listing readiness.

## Reproducible evidence checklist

Use `node scripts/commercial-readiness-inventory.mjs --json` for **first-party package-manifest** evidence, and the `License Evidence` GitHub Actions workflow for downloadable license command outputs. This local inventory does **not** resolve transitive dependency licenses, SBOM attribution, proprietary provider terms or vulnerabilities.

Before commercial release, an authorized reviewer must:

1. Select and record an **exact release commit**, lockfile hashes and distribution format.
2. Verify rights/provenance for original, third-party, dataset, documentation, generated, provider and externally supplied materials.
3. Build an actual transitive dependency and license inventory from frozen lockfiles and distributed artifacts; inspect unusual/copyleft/proprietary terms.
4. Record any open vulnerabilities and mitigation decisions for that exact build.
5. Verify chosen release smoke tests, API/SDK contracts, Docker route and an independent clean install.
6. Prepare customer-facing data processing, support, limitation and contract documents appropriate to the concrete pilot.
7. Obtain human approval for licensing, trademark claims, paid service launch, publication and any new private/enterprise separation.

## Disposition

**Current evidence-supported decision:** public experimental use and commercial **planning / customer discovery** may continue. Full legal title, a complete third-party clearance, a supported production distribution, a registered business, an enterprise SLA, certification, and marketplace publication are **not approved or established by this document**.

See [`LICENSING.md`](../../LICENSING.md), [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md), [known limitations](../KNOWN_LIMITATIONS.md), [current release status](../releases/CURRENT_RELEASE_STATUS.md), and [data handling policy](../security/data_handling.md).

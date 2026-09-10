# A-02 adoption, topology, and research bootstrap decision

## 1. Gate purpose

Adopt the reviewed public A-01 architecture and add operational, prospective boundaries without creating restricted repositories or publishing restricted implementation.

## 2. Starting remote main

Protected `main` was fetched and verified at `4f0c4806dbf13120d63639bc0042ee94a91611a9`, tree `49e678aabb4ab5b63f815a9a40fb073d59e9fe01`. PR #50 containment and PR #51 status correction remain effective; LICENSE and tags are unchanged and no ARC-016/017 payload is in the active tree.

## 3. A-01 reverification

Commit `372a7a29888c63cba768cb75462670fcbf7a52d2`, tree `0c3eb49d5e70ee058c7356fb0b6868760ce6fbd5`, reproduces eight expected files and 411 additions. Product, license, history, tag/release, protected implementation, private research, and private audit changes are zero.

## 4. A-01 publication-fitness review

All eight files are `PUBLIC_SAFE`. No private path, remote identifier, credential, preservation detail, personal information, protected implementation, excessive strategic disclosure, ownership assertion, or unsupported legal conclusion was found. No correction was required.

## 5. Adopted IP architecture

Prospective classes are PUBLIC, RESEARCH_PREPUBLICATION, and PROTECTED; overlays are HOSTED_ENTERPRISE and BRAND_CERTIFICATION. New strategic R&D defaults to RESEARCH_PREPUBLICATION.

## 6. Operational repository topology

`governance/ip-topology.json` defines PUBLIC_REPOSITORY, RESEARCH_WORKSPACE, PROTECTED_IMPLEMENTATION, HOSTED_ENTERPRISE, and BRAND_CERTIFICATION_GOVERNANCE using logical identifiers only. It records purpose, classes, visibility, dependencies, contracts, build/CI/secrets, contribution/publication, export, access, and backup boundaries.

## 7. Research workspace model

The controlled model records intake, experiments, evaluations, fixtures, contracts, evidence, provenance, assistance, third-party inputs, and promotion. It consumes versioned PUBLIC contracts, uses restricted access and CI, and is never a public build dependency. No workspace or remote is created here.

## 8. Protected workspace model

The model requires least privilege, protected branches, mandatory review, isolated secrets, scanning, recovery, internal versioning, optional signing, and explicit promotion/import controls. Functionality crosses the boundary via reviewed contracts, never public imports from private source.

## 9. Cross-repository contracts/versioning

Schema, API, package, capability-manifest, and evidence/artifact formats are versioned according to their own compatibility needs. Restricted consumers test compatibility; PUBLIC contracts remain independently testable; release cadences are uncoupled.

## 10. Feature/research intake

`governance/ip-intake-template.json` provides the required non-sensitive classification record. Publication request does not grant publication.

## 11. Intake validation

The A-01 validator now checks required fields, classes, decisions, strategic defaults, unresolved-rights routing, public-location prohibitions, publication bypass, topology surfaces, and contract boundaries.

## 12. Public-repository enforcement

PUBLIC cannot depend on RESEARCH_PREPUBLICATION or PROTECTED and cannot require private source for build, test, or release. Directory checks are defense in depth; classification, direction, review, CI, and separation are primary.

## 13. Restricted/public artifact flows

Research-to-public, research-to-protected, and protected-to-public-contract exports require explicit gates. Public-to-restricted flow prefers versioned packages, schemas, APIs, fixtures, tests, and evidence contracts. Arbitrary source copying is forbidden.

## 14. Cyber landing zone

Protocols, schemas, evidence formats, scoring contracts, and safe fixtures are PUBLIC candidates. Capability inference, adaptive evaluation, exploit/patch intelligence, containment intelligence, and gap analysis default to RESEARCH_PREPUBLICATION; PROTECTED requires review. No Cyber implementation is added.

## 15. Computational Software Intelligence landing zone

Safe contracts may be PUBLIC. Representation construction, runtime analysis, path/state/risk, automated repair, and reconstruction intelligence default to RESEARCH_PREPUBLICATION, with possible reviewed PROTECTED promotion. No implementation is added.

## 16. Cyber-start prerequisites

IP policy, public boundary, research/protected models, intake, contract boundary, Cyber landing zone, dependency direction, and rights-track separation are defined and enforceable. `CYBER_ARCHITECTURE_PREREQUISITES_READY` is recorded, but does not authorize implementation.

## 17. Contribution/license minimum blockers

- `BLOCKS_RESEARCH_START`: feature-specific provenance/rights or access decisions when the work depends on them.
- `BLOCKS_PUBLICATION`: publication approval, rights, license compatibility, third-party, security, secret, test, and documentation gates.
- `BLOCKS_RELICENSING`: human/legal license and rights decisions.
- `BLOCKS_EXTERNAL_CONTRIBUTIONS`: final contribution agreement/provenance requirements where current policy is insufficient.
- `BLOCKS_CERTIFICATION`: brand authority, criteria, evidence, correction/revocation, and version policy.
- `NON_BLOCKING_FOR_RESEARCH`: general relicensing, trademark, certification, and unrelated D-01..D-08 questions.

This is operational routing, not legal advice.

## 18. Documentation/CI

The public architecture document now covers topology, workspaces, intake, artifact flow, landing zones, and readiness. Existing `pnpm ip:validate` CI integration validates the expanded policy offline without restricted sources or secrets.

## 19. Validation

Completed locally: expanded IP/intake/topology validator passed; 15 focused tests passed; full Node regression passed with 215 test files, 890 tests passed, 36 opt-in PostgreSQL tests skipped in 82.13 seconds; security tests passed (5 files, 16 tests); package-boundary tests passed (3 tests); typecheck and workspace build passed; documentation build and validation passed (33 active files, 141 relative Markdown links, 220 generated links); repository health passed with 213 root test files discovered; version audit classified 719/719 references with zero stale or unclassified; lint passed with 0 errors and 64 pre-existing warnings; formatting, `git diff --check`, and bounded credential/private-path scans passed.

## 20. Diff audit

Relative to protected main, the candidate contains 12 files and 888 additions, restricted to A-01 adoption, topology/intake policy, validation/tests, existing CI integration, documentation, and decision records. Unexpected, product, license, dependency, history, tag/release, protected/research implementation, private remote, and private audit changes are zero.

## 21. Rights carry-forward

D-01 through D-08 remain `UNRESOLVED_CARRIED_FORWARD`. Only a feature that depends on an unresolved right is routed to rights review.

## 22. Human decisions

The compressed A-03/04 gate should determine the minimum contribution, license, and publication governance needed for controlled Cyber research. Restricted remote creation/access, relicensing, brand/certification authority, and any later publication remain separately authorized decisions.

## 23. Publication authorization

`APPROVE_A02_PUSH_PR: YES` has not been provided. No push, PR, remote repository, or merge is authorized by this gate execution.

## 24. Final classification

`A02_READY_AWAITING_PUSH_PR_AUTHORIZATION` after all local validation and diff gates pass.

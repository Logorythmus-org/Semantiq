# A-01 — Foundation and boundary decision

## 1. Starting baseline

Protected `main`: `4f0c4806dbf13120d63639bc0042ee94a91611a9`; tree `49e678aabb4ab5b63f815a9a40fb073d59e9fe01`. PR #50 containment and PR #51 status correction remain effective. Approved ARC artifacts in active HEAD: 0. License, tags, releases, and history are unchanged.

## 2. Current public-surface inventory

| Component family               | Current location                                          | Public/license signal                                   | Dependency direction        | Sensitivity | Future class and rationale                                                                        |
| ------------------------------ | --------------------------------------------------------- | ------------------------------------------------------- | --------------------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| Evaluation framework, CLI, API | `packages/semantiq`, `tools/automation`, `services/api`   | Public repository; existing license signals only        | Consume public contracts    | Medium      | PUBLIC interoperability surface                                                                   |
| SDKs                           | `packages/sdk`, `packages/python`                         | Public package sources; registry claims remain separate | Depend on schemas/contracts | Low         | PUBLIC client interoperability                                                                    |
| Schemas/contracts              | `schemas`, `packages/shared`, `tests/contracts`           | Public and versioned                                    | Base layer                  | Low         | PUBLIC cross-boundary bridge                                                                      |
| Benchmarks/scoring             | `packages/benchmark`, `benchmark-integrity`, `rubrics`    | Public current tree; rights not inferred                | Consume contracts           | High        | Protocol/contracts PUBLIC; new strategic assets/intelligence RESEARCH_PREPUBLICATION or PROTECTED |
| Evidence/reproducibility       | `packages/evidence`, `Docs/evidence`, `tools/conformance` | Public formats and tests                                | Consume public schemas      | Medium      | PUBLIC verification bridge                                                                        |
| Connectors/adapters            | `packages/adapter-*`, `packages/adapters`                 | Public interfaces/implementations                       | Depend on PUBLIC            | Medium      | PUBLIC where safe and cleared                                                                     |
| Examples/docs/Web UI           | `examples`, `Docs`, `apps/web`                            | Public-facing                                           | Consume PUBLIC              | Low         | PUBLIC usability surface                                                                          |
| Storage/data                   | `packages/persistence`, database adapters                 | Public current implementation                           | Depend on contracts         | Medium      | PUBLIC adapters; protected services remain external                                               |
| Security/governance            | `tests/security`, `governance`, `.github`                 | Public controls                                         | Constrain PUBLIC            | Medium      | PUBLIC trust boundary                                                                             |
| Research/generated artifacts   | `Docs/research`, `artifacts` (ignored/generated)          | Evidence classifications apply                          | Export through formats      | High        | New strategic work defaults RESEARCH_PREPUBLICATION                                               |

Repository presence is not evidence of ownership.

## 3. IP classes

`PUBLIC`, `RESEARCH_PREPUBLICATION`, and `PROTECTED` are adopted as prospective development classes. New strategic R&D defaults to `RESEARCH_PREPUBLICATION`.

## 4. Commercial/brand overlays

`HOSTED_ENTERPRISE` and `BRAND_CERTIFICATION` are overlays, not code licenses. `CODE LICENSE != TRADEMARK RIGHTS != CERTIFICATION AUTHORITY`.

## 5. Dependency law

PUBLIC is independently buildable, testable, and usable. Research, protected, and hosted systems may depend on PUBLIC. PUBLIC may not depend on protected or research-prepublication implementation or private repository access.

## 6. SemantIQ Cyber boundary

Public candidates are protocols, interfaces, schemas, reproducibility contracts, and safe fixtures. Strategic inference, exploit/patch intelligence, adaptive evaluation, advanced scoring/containment, and proprietary assets remain research/protected. No Cyber implementation is added.

## 7. Repository topology

Prospective topology: public Semantiq; controlled research workspace; protected implementation repository; optional hosted/enterprise repository; controlled brand/certification governance. No remote repository is created.

## 8. Cross-boundary contracts

Use versioned schemas, APIs/RPC, package interfaces, artifact formats, manifests, provider/plugin interfaces, and signed evidence packages. Public contracts and private implementations are distinct.

## 9. Future-IP intake

Every substantial feature answers the ten disclosure, interoperability, differentiation, provenance, third-party, and approval questions documented in `Docs/governance/ip-architecture.md`, producing PUBLIC, RESEARCH_PREPUBLICATION, PROTECTED, or HOLD_RIGHTS_REVIEW.

## 10. Publication/promotion gates

Research-to-public promotion requires provenance, rights disposition, security, value, license, third-party and secret review, approval, tests, and docs. Research-to-protected promotion records rationale, interfaces, provenance, restrictions, version, security, and access.

## 11. Contribution model candidates

DCO, CLA, and DCO plus targeted CLA remain candidates. Final choice is `HUMAN/LEGAL DECISION REQUIRED`.

## 12. License model candidates

MIT, Apache-2.0, MPL-2.0, AGPL, and commercial/source-available roles require later component-specific analysis. No license selection or change is authorized; `APACHE_2_SELECTION = NOT_AUTHORIZED`.

## 13. Brand/certification model

Official names, results, implementations, verification, and certification require separate usage, criteria, evidence, correction/revocation, and version policies. No trademark registration is claimed.

## 14. Machine-readable policy

`governance/ip-classification.json` records classes, overlays, default, dependency directions, public-repository rules, and publication gate.

## 15. Boundary validator

`scripts/validate-ip-boundaries.mjs` parses and enforces the policy and rejects prohibited top-level implementation directories.

## 16. Tests/CI

`tests/unit/ip-boundary-policy.test.ts` covers a valid policy and five required failure modes. The existing core quality job runs `pnpm ip:validate`; it is deterministic, offline, and requires no protected source.

## 17. D-01..D-08 carry-forward

All remain `UNRESOLVED_CARRIED_FORWARD`. Architecture development is not rights clearance; publication or relicensing may depend on clearance.

## 18. Decision matrix

The normative matrix is in `Docs/governance/ip-architecture.md`; public contracts are separated from strategic implementations, hosted operations, and certification authority.

## 19. Implementation roadmap

A-02 topology bootstrap; compressed A-03/A-04 contribution and licensing decisions; A-05/A-06 asset and brand policy; A-07 Cyber contracts; A-08/A-09 computational-intelligence and hosted boundaries; A-10 seal.

## 20. Validation

Completed locally against baseline `4f0c4806dbf13120d63639bc0042ee94a91611a9`:

- IP policy validator: passed;
- focused IP policy tests: 6 passed;
- full Node regression: 214 test files passed, 881 tests passed, 36 opt-in PostgreSQL tests skipped, 86.23 seconds;
- security regression: 5 test files and 16 tests passed;
- package-boundary tests: 3 passed;
- workspace typecheck and build: passed;
- lint: 0 errors and 64 pre-existing warnings;
- formatting and `git diff --check`: passed;
- documentation build and validation: passed (33 active files, 141 relative Markdown links, 220 generated links);
- repository health: passed (212 root test files discovered; Docker Compose unavailable locally);
- version audit: 719/719 references classified, 0 stale and 0 unclassified;
- scoped credential/path and protected-implementation scan: passed.

## 21. Diff audit

The final local diff contains eight files limited to the architecture policy, validator, focused test, CI/package-script integration, governance navigation/documentation, and this decision record. Product behavior, licenses, protected implementation, private research, history, tags, releases, and remote state remain unchanged.

## 22. Remaining human decisions

Contribution agreement model, component-specific license strategy, publication approval roles, brand/certification authority, and creation/access policy for future restricted repositories.

## 23. Final classification

`A01_IP_ARCHITECTURE_FOUNDATION_READY_FOR_REVIEW` if all validation and diff gates pass.

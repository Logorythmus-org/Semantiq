# SemantIQ Product Domain Governance & Stewardship Model

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Effective Date**: 2026-08-18  

---

## 1. Governance Transition: From Benchmark Stewardship to Product-Domain Ownership

As SemantIQ evolves into **Behavioral Evidence Infrastructure for AI Systems**, stewardship transitions from monolithic benchmark evaluation oversight to a decentralized **Product-Domain Ownership Model**.

```
                           ┌───────────────────────────────┐
                           │   SemantIQ Maintainers Council │
                           └──────────────┬────────────────┘
                                          │
    ┌───────────────────────────┬─────────┴─────────┬───────────────────────────┐
    ▼                           ▼                   ▼                           ▼
┌──────────────┐      ┌──────────────────┐  ┌──────────────┐      ┌────────────────────────┐
│ Core Domain  │      │ Evidence Engine  │  │ SDKs & Tools │      │ Security & Operations  │
│ Architecture │      │ & Governance     │  │ (TS / Python)│      │ & Release Engineering  │
└──────────────┘      └──────────────────┘  └──────────────┘      └────────────────────────┘
```

---

## 2. Product-Domain Ownership Matrix

| Domain | Scope & Responsibilities | Codebase Paths | Stewardship Tier | Assigned Team / Owners |
| :--- | :--- | :--- | :---: | :--- |
| **1. Core & Architecture** | Canonical product contracts, schema evolution, package boundary enforcement, deterministic UUID/hash primitives. | `packages/core/`<br>`packages/sandbox-contracts/`<br>`schemas/` | **Current** | `@semantiq/core-maintainers` |
| **2. Benchmark Engine** | Model execution adapters, scenario runners, SMF/HACS/Vision benchmark suites, trace adapters. | `packages/benchmark/`<br>`packages/adapter-*/`<br>`packages/patterns/` | **Current** | `@semantiq/benchmark-maintainers` |
| **3. Evidence Engine** | Statistical contrast (Bootstrap CI, Exact Sign Test), specification curves, matched controls, cross-run Evidence Graph. | `packages/evidence/` | **Current** | `@semantiq/evidence-maintainers` |
| **4. Research Governance** | Governed claims, controlled language validation, proposal-only evidence watch, review ledger verification. | `packages/research/`<br>`packages/semantiq/src/services/` | **Current** | `@semantiq/governance-maintainers` |
| **5. Python SDK** | `semantiq` Python package, dataclasses, CLI runner, PyPI distribution, pytest test suite. | `packages/python/` | **Interim** | `@semantiq/python-maintainers` |
| **6. TypeScript SDK** | `@semantiq/sdk` package, client bindings, type definitions, npm distribution. | `packages/sdk/` | **Interim** | `@semantiq/typescript-maintainers` |
| **7. Security & Privacy** | Vulnerability reporting, credential redaction, threat modeling, local-first isolation, path traversal defense. | `SECURITY.md`<br>`Docs/security/`<br>`tests/security/` | **Current** | `@semantiq/security-team` |
| **8. Documentation** | Architecture specs, developer guides, epistemic invariants, citations, licensing reports. | `Docs/`<br>`README.md`<br>`LICENSING.md` | **Current** | `@semantiq/docs-maintainers` |
| **9. Partner Protocols** | Study protocol pre-registration, execution manifests, external evidence eligibility gate. | `packages/evidence/src/partner-exchange/`<br>`packages/evidence/src/gate/` | **Open WG** | `@semantiq/partner-wg`<br>`@semantiq/evidence-maintainers` |
| **10. Release Engineering** | GitHub Actions CI/CD workflows, build orchestration, Merkle bundle sealing tools. | `.github/`<br>`scripts/`<br>`tools/` | **Current** | `@semantiq/release-engineers` |

---

## 3. Stewardship Role Classifications

To ensure transparency and clear accountability, roles are categorized into four distinct lifecycle tiers:

1. **Current Active Roles**:
   - Staffed directly by active core maintainers responsible for day-to-day triage, code reviews, and releases.
   - Domains: *Core, Benchmark Engine, Evidence Engine, Research Governance, Security, Documentation, Release Engineering*.
2. **Interim Roles**:
   - Maintained by core maintainers during early adoption and stabilization passes, with plans to transition to dedicated language-specific maintainer teams.
   - Domains: *Python SDK, TypeScript SDK*.
3. **Open Working Group (WG) Roles**:
   - Collaborative review bodies composed of core maintainers and participating external academic/industry research partners.
   - Domain: *Partner Protocols & Replication Exchange*.
4. **Future Organization / Foundation Roles**:
   - Long-term governance roadmap transitioning trademark, specification voting, and epistemic standard oversight to a multi-stakeholder foundation.

---

## 4. Decision-Making & RFC Process

- **Standard Changes**: Require pull request review and approval from at least one domain owner.
- **Architectural / Contract Changes**: Require an approved Architecture Decision Record (ADR) or RFC reviewed by Core & Architecture maintainers.
- **Epistemic Invariant Changes**: Require unanimous consent of the Maintainers Council and cryptographic audit verification.

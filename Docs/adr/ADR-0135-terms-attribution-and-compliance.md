# ADR-0135: Terms Attribution, NOTICE Blocks, and Commercial Compliance Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

AI agent benchmarks combine heterogeneous software artifacts: benchmark task repositories, Docker base images, Python/Node toolchains, third-party runtime daemons, and commercial cloud APIs. These components impose distinct legal obligations: Apache-2.0 Section 4d NOTICE retention, MIT/BSD copyright preservation, CC-BY dataset attribution, trademark nominative fair-use boundaries, and research-only vs commercial execution restrictions.

SemantIQ must provide an automated, machine-readable compliance framework that compiles comprehensive attribution packages for every evaluation without burdening researchers or contaminating SemantIQ Core.

---

## Decision

1. **Structured Attribution Contracts**: Define `AttributionNotice`, `TrademarkDisclaimer`, `CommercialRestrictionTerms`, and `ComplianceAttributionPackage` in `packages/sandbox-contracts/src/terms-attribution.ts`.
2. **Automated NOTICE & Attribution Compiler**: Implement `ComplianceAttributionCompiler` to aggregate upstream `NOTICE` blocks, verify SPDX identifiers, inject nominative trademark disclaimers, and compile human-readable and machine-readable compliance artifacts.
3. **Graduated Compliance Grades**: Classify compliance into `FULLY_COMPLIANT`, `COMPLIANT_WITH_NOTICES`, `NON_COMMERCIAL_RESTRICTED`, and `NON_COMPLIANT_BLOCKED`.
4. **Commercial Use Safeguards**: Flag benchmarks containing research-only or non-commercial clauses (`researchOnlyClause = true`), preventing accidental commercial exploitation in enterprise deployments.
5. **Decoupling from Behavioral Evaluation**: Invariant: Compliance packages and legal metadata are attached to evaluation evidence bundles but never alter canonical benchmark scoring or agent execution behavior.

---

## Consequences

- Benchmark reports include verifiable, machine-readable attribution bundles satisfying Apache-2.0, MIT, and BSD notice requirements.
- Trademark risks are mitigated through standardized nominative fair-use disclaimers for Docker, Kubernetes, E2B, and other runtime marks.
- Enterprise consumers can filter benchmark suites by commercial viability before running compliance-sensitive workloads.

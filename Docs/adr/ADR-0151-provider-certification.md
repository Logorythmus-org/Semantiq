# ADR-0151: SemantIQ Third-Party Provider Certification Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

As open-source contributors, self-hosted infrastructure teams, and commercial cloud sandbox vendors implement SemantIQ execution adapters, evaluators and benchmark authors need transparent, verifiable proof of provider guarantees. Provider claims (hardware root of trust, zero-egress isolation, microsecond timing fidelity, hermetic reproducibility) must not be accepted without objective verification.

To establish trust, accountability, and transparency across the ecosystem, SemantIQ requires a transparent Third-Party Provider Certification Architecture.

---

## Decision

1. **Six-Pillar Audit Framework**: Standardize 6 evaluation dimensions:
   - `CONTRACT_CONFORMANCE` (25% weight)
   - `REPRODUCIBILITY` (20% weight)
   - `SECURITY_ISOLATION` (20% weight)
   - `OBSERVABILITY_FIDELITY` (15% weight)
   - `PROVENANCE_INTEGRITY` (10% weight)
   - `DECLARED_LIMITATIONS` (10% weight)
2. **Four-Tier Certification Badges**:
   - `TIER_0_UNVERIFIED`: Self-registered with unverified claims.
   - `TIER_1_CONFORMANCE_VERIFIED`: Conformance harness tests passed.
   - `TIER_2_HERMETIC_CERTIFIED`: Hermetic state consistency and network isolation verified.
   - `TIER_3_ENTERPRISE_AUDITED`: Full cryptographic provenance and security isolation certified.
3. **Provider Certification Engine**: Implement `ProviderCertificationEngine` to ingest dimension audit results, compute weighted composite scores, and issue cryptographically signed `ProviderCertificationScorecard` artifacts.
4. **Mandatory Limitations Disclosure**: Providers must declare operational boundaries (timeout limits, GPU unavailability, filesystem persistence model) which are verified and published on the scorecard.
5. **Observable Behavioral Grounding**: Invariant: Provider certification verifies execution environment invariants without claiming or inferring internal cognitive states of evaluated agents.

---

## Consequences

- Benchmark evaluators can filter providers by verified trust tier (e.g. require `TIER_2_HERMETIC_CERTIFIED`).
- Protects the ecosystem from misleading marketing claims.
- Cryptographically signed scorecards provide auditable proof of environment fidelity.

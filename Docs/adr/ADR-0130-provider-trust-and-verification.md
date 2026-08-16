# ADR-0130: Provider Trust, Verification, and Certification

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

To enable decentralized, community-driven, and multi-cloud benchmark execution, SemantIQ must objectively verify the identity, security posture, and contract conformance of third-party execution providers before routing sensitive or untrusted agent workloads to them.

---

## Decision

1. **Attestation Contract**: Define `ProviderAttestation`, `ProviderIdentity`, and `AttestationVerificationReport` in `packages/sandbox-contracts/src/trust-verification.ts`.
2. **Mandatory TCK Conformance**: Require 100% pass rates across the Technology Compatibility Kit (TCK) suite for certified status.
3. **Graduated Trust Tiers**: Classify providers into `UNVERIFIED`, `SELF_ATTESTED`, `TCK_VERIFIED`, and `CRYPTOGRAPHICALLY_CERTIFIED`.
4. **Security Posture Enforcement**: Mandate minimum security posture grades (`A_HARDENED_MICROVM` or `B_ISOLATED_CONTAINER`) for untrusted agent evaluations.

---

## Consequences

- Third-party runners can be safely integrated into the SemantIQ router mesh.
- Evaluation integrity is protected against rogue or misconfigured execution hosts.
- Public benchmark users can cryptographically verify the runtime provenance of every evaluation.

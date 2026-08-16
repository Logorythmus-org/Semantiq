# ADR-0150: SemantIQ Lightweight Provider SDK and Conformance Harness Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

Third-party runtime and infrastructure developers (Docker contributors, cloud sandbox startups, enterprise on-premise virtualization teams) need a simple way to implement the SemantIQ Execution Contract. Third-party developers MUST NOT be forced to fork SemantIQ, import monolithic evaluation packages, or modify SemantIQ Core to become a certified execution provider.

To establish an open, decoupled integration pathway, SemantIQ requires a lightweight Provider SDK and automated Conformance Harness.

---

## Decision

1. **Lightweight Abstract Adapter**: Standardize `SemantiqProviderAdapter` base class with 4 discrete lifecycle methods:
   - `initialize(config)`
   - `provisionEnvironment(spec)`
   - `executeCommand(handle, command)`
   - `destroyEnvironment(handle)`
2. **Automated Conformance Harness**: Implement `ProviderConformanceHarness` to verify third-party adapter contract compliance (provisioning, command execution, isolation, and teardown).
3. **Cryptographic Conformance Certification**: Issue a signed `ProviderConformanceCertificate` (`certificateSignatureHex`) asserting that the adapter meets all SemantIQ execution standards.
4. **Zero-Internal-Dependency SDK**: The SDK depends only on core JSON types, allowing third-party runtimes to compile and publish adapters independently.
5. **Observable Behavioral Grounding**: Invariant: The Provider SDK surfaces raw telemetry events without assuming or interpreting internal agent cognition.

---

## Consequences

- Third parties can build and maintain SemantIQ execution adapters in standalone repositories.
- Providers can be certified automatically via CI/CD before entering the Canonical Provider Registry.
- Protects SemantIQ Core from runtime-specific dependency bloat and vendor lock-in.

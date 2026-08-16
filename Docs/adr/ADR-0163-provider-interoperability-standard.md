# ADR-0163: SemantIQ Provider Interoperability Standard (SPIS)

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

To establish an open, long-term sustainable ecosystem for executing AI benchmarks across heterogeneous, replaceable sandbox technologies without vendor lock-in, SemantIQ requires a formal, normative Provider Interoperability Standard (SPIS). The standard must govern capability discovery, lifecycle state machines, version negotiation, error taxonomy, security declarations, and evidence provenance without depending on OpenSandbox or any named proprietary provider.

---

## Decision

1. **Three-Tier SPIS Conformance Hierarchy**:
   - `SPIS_CORE_L1`: Basic execution contract, container image pull, stdin/stdout piping, and exit codes.
   - `SPIS_HERMETIC_L2`: L1 + Strict cgroup resource enforcement, deterministic seeds, and network isolation.
   - `SPIS_FULL_OBSERVABLE_L3`: L2 + Out-of-band PTY mirroring, kernel eBPF probe telemetry, and Merkle evidence provenance DAGs.
2. **Standardized Error Taxonomy**:
   - `INVALID_SPEC`, `CAPABILITY_UNSUPPORTED`, `RESOURCE_EXHAUSTION`, `ISOLATION_VIOLATION`, `EGRESS_BLOCKED`, `EXECUTION_TIMEOUT`, `INTERNAL_PROVIDER_ERROR`.
3. **SPIS Manifest Specification**:
   - `SpisProviderInteroperabilityManifest`: Standardized Draft 2020-12 JSON schema registering supported runtimes, security profiles, extensions, and lifecycle endpoints sealed with ECDSA signatures (`certificationSignatureHex`).
4. **Observable Behavioral Grounding**: Invariant: SPIS monitors and verifies the 7-stage chain (`Context → Interpretation → Decision → Action → Result → Consequence → Recovery`) using external physical traces and exit codes without assuming internal model cognition.

---

## Consequences

- Third parties can build and certify custom execution providers without importing SemantIQ Core internals.
- Clean semantic version negotiation enables backwards-compatible evolutions of the benchmark protocol.
- Preserves 100% provider neutrality and uncompromised scientific benchmark credibility.

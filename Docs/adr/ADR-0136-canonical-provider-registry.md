# ADR-0136: Canonical Machine-Readable Provider Registry Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

To support a vendor-neutral, heterogeneous sandbox execution ecosystem spanning local daemons, managed clouds, academic research clusters, and air-gapped enterprise runtimes, SemantIQ requires a canonical, machine-readable registry format.

This registry must consolidate identity, versioning, release channels, transport endpoints, capabilities, licensing, trust tiers, security grades, economic pricing, SLA metrics, and operational health states into a unified, cryptographically verifiable structure.

---

## Decision

1. **Unified Registry Schema**: Standardize `CanonicalProviderRegistryEntry` and `canonical-provider-registry.schema.json` encompassing 19 core attributes.
2. **Canonical Provider Registry Engine**: Implement `CanonicalProviderRegistry` with in-memory indexing, lifecycle state machines, structured event logs (`ProviderRegistryEvent`), and query filtering.
3. **Cryptographic Integrity & Attribution**: Enforce cryptographic signatures (`signatureHex`) on all published registry entries, verifying canonical JSON digests (`computeSha256`).
4. **Operational Health & Circuit Breaking**: Track real-time status (`ONLINE`, `DEGRADED`, `MAINTENANCE`, `OFFLINE`, `QUARANTINED`) and consecutive failures to inform dynamic routing failovers.
5. **No Mandatory Provider & Local-First Invariant**: The registry treats local OCI containers, mock replays, and cloud clusters identically under standardized capability queries. Zero proprietary providers are hardcoded into SemantIQ Core.

---

## Consequences

- Benchmark runners can dynamically discover, validate, and select compatible providers across all deployment tiers.
- State transitions are recorded in an immutable audit trail (`getEventLog()`).
- Upstream runtime code remains strictly external and decoupled from SemantIQ Core packages.

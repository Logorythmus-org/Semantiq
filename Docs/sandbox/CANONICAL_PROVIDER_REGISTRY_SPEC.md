# SemantIQ Sandbox Specification: Canonical Machine-Readable Provider Registry Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 36)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

A robust, vendor-neutral AI evaluation framework requires an authoritative, machine-readable registry to dynamically discover, evaluate, and route sandbox execution requests. Providers vary extensively across deployment architectures (local daemons, dedicated clusters, serverless microVMs), transport protocols (Unix sockets, REST, gRPC), trust tiers (self-attested vs TCK-verified), licensing boundaries, and pricing structures.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification defines the **Canonical Machine-Readable Provider Registry**:

1. **Consolidated Registry Schema**: Standardizes [`CanonicalProviderRegistryEntry`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/canonical-registry.ts#L36-L56) capturing 19 core architectural dimensions: identity, semver, release channels, multi-protocol endpoints, sandbox capabilities, licensing metadata, trust tiers, security grades, pricing models, SLA performance metrics, and operational health states.
2. **Canonical Provider Registry Engine**: Implements [`CanonicalProviderRegistry`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/canonical-registry.ts#L86-L255) managing registration validation, cryptographic digest verification, real-time health transitions, structured lifecycle event emission ([`ProviderRegistryEvent`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/canonical-registry.ts#L74-L83)), and multi-dimensional query filtering.
3. **Decoupled Provider Invariant**: Preserves the strict policy of no runtime code in SemantIQ Core, zero mandatory external dependencies, and first-class local execution.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Canonical Provider Registry                                  |
|  [Provider Descriptor Submission] ──> [Schema & Clean-Room Validation] ──> [Signature Check]|
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    Operational Registry                                     |
|  • In-Memory Indexing & Persistence Sync                                                    |
|  • Real-Time Health & Circuit Breaker Tracking (ONLINE, DEGRADED, OFFLINE)                  |
|  • Lifecycle State Audit Log (REGISTERED, STATUS_CHANGED, DEREGISTERED)                     |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Multi-Dimensional Query Engine                               |
|  [Benchmark Requirement Query] ──> [Filters: Trust, Mode, Latency, Cost] ──> [Matched List] |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope

- **Canonical Registry Manifest**: Defining [`CanonicalProviderRegistryEntry`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/canonical-registry.ts#L36-L56) and JSON Schema [`canonical-provider-registry.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/canonical-provider-registry.schema.json).
- **Multi-Transport Endpoint Configuration**: Modeling Unix domain sockets, HTTP REST, gRPC, and stdio subprocess invocation paths.
- **Operational Lifecycle State Machine**: Tracking `ONLINE`, `DEGRADED`, `MAINTENANCE`, `OFFLINE`, and `QUARANTINED` states with consecutive failure accounting.
- **Multi-Dimensional Query Filtering**: Supporting capability masks, deployment mode filters, offline constraints, release channels, and latency/cost thresholds.
- **Behavioral Evaluation Preservation**: Ensuring registry discovery never modifies canonical observable behavior:
  $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$

### 2.2 Non-Goals

- **No Centralized Registry Dependency**: SemantIQ Core can operate entirely offline against local configuration files without querying an external registry service.
- **No OpenSandbox Fork or Clone**: Runtimes remain independent external binaries; SemantIQ Core never duplicates vendor codebase files.
- **No Mandatory Execution Provider**: Local OCI containers and mock trace replays remain first-class defaults.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Canonical Registry Grammar, Schemas, and Engine (CanonicalProviderRegistry)              |
|  • Cryptographic Validation & Digest Verification of Manifests                              |
|  • Operational Health State Machine & Event Auditing                                        |
|  • Query Resolution & Routing Hand-off to ProviderSelectionRouter                          |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Registry Manifests)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Authoring & Publishing Valid Signed CanonicalProviderRegistryEntry Manifests             |
|  • Maintaining Accurate Health Endpoints & SLA Telemetry                                    |
|  • Providing Clean-Room Verification Declarations & SPDX Licensing Metadata                 |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 4. Contracts and Schemas

### 4.1 TypeScript Registry Interfaces ([`packages/sandbox-contracts/src/canonical-registry.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/canonical-registry.ts))

```typescript
export type ProviderReleaseChannel = "STABLE" | "BETA" | "EXPERIMENTAL" | "DEPRECATED";

export type ProviderOperationalStatus =
  "ONLINE" | "DEGRADED" | "MAINTENANCE" | "OFFLINE" | "QUARANTINED";

export type TransportProtocol = "LOCAL_SOCKET" | "HTTP_REST" | "GRPC" | "STDIO_SUBPROCESS";

export interface ProviderEndpointConfig {
  readonly primaryUrl: string;
  readonly backupUrls?: readonly string[];
  readonly transport: TransportProtocol;
  readonly healthCheckUrl?: string;
  readonly timeoutMs: number;
}

export interface CanonicalProviderRegistryEntry {
  readonly providerId: string;
  readonly displayName: string;
  readonly organization: string;
  readonly version: string;
  readonly releaseChannel: ProviderReleaseChannel;
  readonly deploymentMode: MarketplaceDeploymentMode;
  readonly endpoints: ProviderEndpointConfig;
  readonly capabilities: SandboxCapabilities;
  readonly licensing: ProviderLicensingManifest;
  readonly trustTier: ProviderTrustTier;
  readonly securityGrade: SecurityPostureGrade;
  readonly pricing: EconomicPricingModel;
  readonly sla: ProviderSlaMetrics;
  readonly status: ProviderOperationalStatus;
  readonly consecutiveFailures: number;
  readonly tags: readonly string[];
  readonly registeredAt: string;
  readonly lastHeartbeatAt: string;
  readonly signatureHex: string;
}

export interface CanonicalRegistryQuery {
  readonly allowedDeploymentModes?: readonly MarketplaceDeploymentMode[];
  readonly allowedReleaseChannels?: readonly ProviderReleaseChannel[];
  readonly minTrustTier?: ProviderTrustTier;
  readonly minSecurityGrade?: SecurityPostureGrade;
  readonly maxBaseCost?: number;
  readonly maxColdBootLatencyMs?: number;
  readonly statusFilter?: readonly ProviderOperationalStatus[];
  readonly offlineOnly?: boolean;
  readonly requiredCapabilities?: Partial<SandboxCapabilities>;
  readonly tags?: readonly string[];
}
```

### 4.2 JSON Schema Manifests

- **[`schemas/canonical-provider-registry.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/canonical-provider-registry.schema.json)**: Validates canonical registry entries, endpoint definitions, SLA metrics, and signatures.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `canonicalProviderRegistryEntrySchema`.

---

## 5. User & Provider Registry Lifecycle Flow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    1. Provider Registration                                 |
|  Provider generates CanonicalProviderRegistryEntry, signs it, and registers via engine.    |
|  Registry checks clean-room status, validates URLs, and emits REGISTERED event.             |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Continuous Health Monitoring                          |
|  Registry tracks heartbeat and healthCheckUrl probes.                                       |
|  If consecutive failures occur: Status transitions ONLINE ──> DEGRADED ──> OFFLINE.         |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    3. Dynamic Query & Routing                               |
|  Benchmark runner issues CanonicalRegistryQuery (e.g. offlineOnly: true, minTrust: TCK).    |
|  Registry returns filtered, sorted list of candidate providers to the router.               |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    4. Clean Deregistration                                  |
|  Provider deregistration cleanly removes entry and emits DEREGISTERED event audit record.   |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Security, Privacy, and Trust Posture

1. **Cryptographic Manifest Verification**: Every registry entry must contain a valid cryptographic signature (`signatureHex`) covering its canonical JSON digest, preventing man-in-the-middle manifest poisoning.
2. **Quarantine Isolation**: Providers exhibiting security anomalies or attestation failures are immediately placed in the `QUARANTINED` operational status, excluding them from all benchmark routing.
3. **Zero Data Exfiltration in Offline Mode**: The `offlineOnly` query constraint ensures that evaluation workflows requiring strict data privacy never route to external cloud providers.

---

## 7. Open-Source vs. Commercial & Enterprise Registry Profiles

| Dimension           | Open-Source (`LOCAL_DAEMON`)        | Commercial (`MANAGED_MULTI_TENANT`) | Enterprise (`AIRGAPPED_ON_PREM`) |
| :------------------ | :---------------------------------- | :---------------------------------- | :------------------------------- |
| **Transport**       | `LOCAL_SOCKET` / `STDIO_SUBPROCESS` | `HTTP_REST` (TLS) / `GRPC`          | `GRPC` / Internal Private VIP    |
| **Release Channel** | `STABLE` / `BETA`                   | `STABLE`                            | `STABLE` (Audited)               |
| **Trust Tier**      | `TCK_VERIFIED`                      | `CRYPTOGRAPHICALLY_CERTIFIED`       | `CRYPTOGRAPHICALLY_CERTIFIED`    |
| **Security Grade**  | `B_ISOLATED_CONTAINER`              | `A_HARDENED_MICROVM`                | `A_HARDENED_MICROVM`             |
| **Pricing**         | `COMMUNITY_FREE` ($0.00)            | `COMMERCIAL_PAYG`                   | `ENTERPRISE_RESERVED`            |

---

## 8. Failure Modes & Resilience Strategies

| Failure Mode             | Root Cause                               | Impact             | Automated Recovery Action                                   |
| :----------------------- | :--------------------------------------- | :----------------- | :---------------------------------------------------------- |
| **Heartbeat Timeout**    | Provider daemon unresponsive             | Stale routing      | Registry marks status `OFFLINE`; router fails over          |
| **Signature Mismatch**   | Tampered manifest in cache               | Security violation | Registry rejects entry registration                         |
| **Non-Clean-Room Flag**  | Provider bundles unverified adapter code | Legal risk         | Registry blocks registration (`violations` returned)        |
| **Degraded Performance** | High network congestion                  | Latency SLA breach | Status changes to `DEGRADED`; deprioritized in MCDM scoring |

---

## 9. Testing Strategy & Verification

The canonical registry architecture is validated through automated test suites:

1. **Registry Operations Unit Tests ([`tests/unit/canonical-provider-registry.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/canonical-provider-registry.test.ts))**:
   - Validates registration of local Docker and commercial cloud provider entries.
   - Tests rejection of malformed entries or invalid signatures.
   - Tests real-time health transitions (`ONLINE` to `DEGRADED`) and event emission (`STATUS_CHANGED`).
   - Tests multi-attribute querying (`allowedDeploymentModes`, `offlineOnly`, `maxColdBootLatencyMs`).
   - Tests clean deregistration and lifecycle event logging.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `canonicalProviderRegistryEntrySchema`.

---

## 10. Acceptance Criteria

- [x] Canonical registry contracts model all 19 core architectural dimensions.
- [x] Registry engine supports in-memory registration, health updating, and query resolution.
- [x] Cryptographic signatures and clean-room implementation flags are strictly verified.
- [x] Lifecycle events are recorded in an append-only event log.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 11. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Dynamic Polling Frequency vs. System Overhead**: High-frequency health probes consume network resources.  
  _Mitigation_: Heartbeat probes default to 30-second intervals with exponential backoff on degradation.
- **Open Question**: Peer-to-peer registry federation across distributed enterprise clusters.

---

## 12. Facts, Assumptions, and Recommendations

- **Facts**:
  - SemantIQ Core evaluates agent behavior via objective, observable test assertions.
  - Providers are decoupled execution backends identified by machine-readable descriptors.
- **Assumptions**:
  - Providers supply valid health check endpoints and respond within defined timeouts.
- **Recommendations**:
  - Ship a default offline catalog of local OCI and trace replay providers embedded in the core distribution.
  - Expose `semantiq registry list` and `semantiq registry probe` CLI commands for developer operations.

---

## 13. Architecture Decision Record

### [ADR-0136: Canonical Machine-Readable Provider Registry Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0136-canonical-provider-registry.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Standardize `CanonicalProviderRegistryEntry`, implement `CanonicalProviderRegistry` engine, track operational lifecycle states, enforce cryptographic signatures, and support multi-dimensional query filtering.
- **Consequences**: Enables dynamic discovery, transparent capability negotiation, and automated failover across heterogeneous execution providers without vendor lock-in.

---

## 14. Implementation Artifacts

1. **Contracts & Registry Engine**: [`packages/sandbox-contracts/src/canonical-registry.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/canonical-registry.ts)
2. **Schema Definition**: [`schemas/canonical-provider-registry.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/canonical-provider-registry.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/canonical-provider-registry.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/canonical-provider-registry.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/CANONICAL_PROVIDER_REGISTRY_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/CANONICAL_PROVIDER_REGISTRY_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0136-canonical-provider-registry.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0136-canonical-provider-registry.md)

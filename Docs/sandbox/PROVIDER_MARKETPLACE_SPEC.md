# SemantIQ Sandbox Specification: Provider Marketplace Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 32)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

As AI evaluation workloads expand across heterogeneous infrastructure, selecting the appropriate execution backend requires balancing multidimensional criteria: hardware acceleration, browser automation, security isolation grades, trust verification tiers, maximum spending budgets, data residency, and SLA guarantees.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
`Benchmark → Scenario → Execution Contract → Provider Router → Provider Adapter → Runtime → Observation → Evidence → Evaluation → Report`

This specification establishes the **Provider Marketplace and Discovery Architecture**:
1. **Decentralized Marketplace Registry**: Execution providers publish verifiable, machine-readable listings (`ProviderMarketplaceListing`) containing publisher identities, SPDX licensing, granular billing rates, SLA metrics, and cryptographic signatures.
2. **Multidimensional Discovery Engine**: Supports dynamic queries (`MarketplaceDiscoveryQuery`) filtering across 6 key dimensions: Capabilities, Deployment Mode, Trust Tier, Security Posture Grade, Cost Budget, and Data Privacy Policy.
3. **MCDM Utility Scoring & Automated Failover**: Ranks matching providers via Multi-Criteria Decision Making (MCDM) utility scoring (Trust 30%, Isolation 25%, Latency 20%, Cost 15%, SLA 10%), automatically assembling primary selection and resilient failover chains.
4. **Zero-Lock-In & Local-First Invariant**: Preserves offline, zero-cost execution (`LOCAL_DAEMON` via Docker/OCI or `MOCK_REPLAY`) as primary, preventing any vendor monopoly or centralized paywalled gateway.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    SemantIQ Marketplace                                     |
|  [Publishers: Local / Cloud / Enterprise] ──> [Decentralized Registry] ──> [Signed Listings] |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                    (MarketplaceDiscoveryQuery)
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Marketplace Discovery Engine                               |
|  1. Hard Constraint Filter:  Mode, Region, Zero-Retention, License, Cost Cap, Capabilities  |
|  2. MCDM Utility Scoring:    Trust (30%) + Isolation (25%) + Latency (20%) + Cost (15%)     |
|  3. Routing Resolution:      Primary Selection + Ranked Failover Chain                      |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    Benchmark Execution                                      |
|  [Primary Provider] ──(Infra Fault)──> [Failover Candidate 1] ──> [Sealed Evaluation Report]|
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Scope and Non-Goals

### 2.1 In Scope
- **Decentralized Listing Protocol**: Defining machine-readable formats for provider discovery ([`ProviderMarketplaceListing`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/marketplace.ts#L29-L50)).
- **Multidimensional Search & Matchmaking**: Filtering by deployment modes, hardware acceleration, zero data retention, latency ceilings, and SPDX license whitelists via [`MarketplaceDiscoveryQuery`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/marketplace.ts#L52-L73).
- **MCDM Multi-Criteria Scoring**: Automated weighted ranking and deterministic failover chain synthesis via [`ProviderMarketplaceEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/marketplace.ts#L104-L245).
- **Cryptographic Publisher Attestation**: Auditing digital signatures on marketplace listings against TCK conformance manifests.
- **Behavioral Chain Observation**: Ensuring that provider selection never distorts the objective evaluation sequence:
  $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$

### 2.2 Non-Goals
- **No Centralized Paywalled Broker**: SemantIQ does not operate a proprietary monetization tollbooth or mandatory central registry.
- **No OpenSandbox Fork or Clone**: Runtimes remain independent external systems; SemantIQ Core never duplicates vendor codebase files.
- **No Vendor Telemetry Ingestion into Core**: SemantIQ Core does not collect or transmit vendor analytics.
- **No Biased Vendor Favoritism**: Scoring algorithms are open-source, deterministic, and configurable by the end-user.

---

## 3. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Marketplace Query Grammar & Filtering Protocol                                           |
|  • Deterministic MCDM Utility Scoring Algorithm & Ranking                                    |
|  • Verification of Publisher Digital Signatures & TCK Conformance                            |
|  • Construction of Dynamic Failover Chains for Benchmark Execution Engine                   |
|  • Final Evaluation Reporting with Full Marketplace Metadata & Provenance                   |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Decentralized Catalog & RPC Boundary)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PUBLISHER-OWNED RESPONSIBILITIES                            |
|  • Publishing Signed ProviderMarketplaceListing Manifests with Complete Metadata             |
|  • Declaring Verifiable SLA Metrics (Uptime, p50/p95 Cold-Boot Latencies, Concurrency)       |
|  • Maintaining Public Keys & Ed25519/ECDSA Signature Keys                                    |
|  • Adhering to Zero-Data-Retention and Ephemeral Volume Scrubbing Guarantees                |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

### 3.1 Taxonomy of Deployment Modes

1. **`LOCAL_DAEMON`**: Developer-local Docker, Podman, or containerd daemons. Zero compute cost, offline-first.
2. **`DEDICATED_CLUSTER`**: Self-hosted bare-metal or Kubernetes microVM clusters (e.g. Kata, Firecracker).
3. **`SERVERLESS_MICROVM`**: Ephemeral pay-per-second on-demand microVMs (e.g. E2B, Modal).
4. **`MANAGED_MULTI_TENANT`**: Multi-tenant cloud container/VM sandboxes (e.g. Daytona, Fly.io, RunPod).
5. **`AIRGAPPED_ON_PREM`**: Highly restricted, zero-egress hardware installations for classified or proprietary evaluations.
6. **`MOCK_REPLAY`**: Zero-cost recorded trace engine for CI regression and deterministic reproduction.

---

## 4. Contracts and Schemas

### 4.1 TypeScript Marketplace Interfaces (`packages/sandbox-contracts/src/marketplace.ts`)

```typescript
export type MarketplaceDeploymentMode =
  | 'LOCAL_DAEMON'
  | 'DEDICATED_CLUSTER'
  | 'SERVERLESS_MICROVM'
  | 'MANAGED_MULTI_TENANT'
  | 'AIRGAPPED_ON_PREM'
  | 'MOCK_REPLAY';

export interface ProviderSlaMetrics {
  readonly uptimePercentage: number;
  readonly p50ColdBootLatencyMs: number;
  readonly p95ColdBootLatencyMs: number;
  readonly maxConcurrentSandboxes: number;
}

export interface ProviderMarketplaceListing {
  readonly listingId: string;
  readonly providerId: string;
  readonly displayName: string;
  readonly description: string;
  readonly version: string;
  readonly publisher: ProviderIdentity;
  readonly hostingCategory: ProviderHostingCategory;
  readonly deploymentMode: MarketplaceDeploymentMode;
  readonly license: ProviderLicenseInfo;
  readonly costStructure: ProviderCostStructure;
  readonly privacyProfile: ProviderDataPrivacyProfile;
  readonly trustTier: ProviderTrustTier;
  readonly securityGrade: SecurityPostureGrade;
  readonly capabilities: SandboxCapabilities;
  readonly extensionMatrix: ProviderExtensionMatrix;
  readonly slaMetrics: ProviderSlaMetrics;
  readonly tags: readonly string[];
  readonly publishedAt: string;
  readonly signatureHex: string;
}

export interface MarketplaceDiscoveryQuery {
  readonly requiredDeploymentModes?: readonly MarketplaceDeploymentMode[];
  readonly minTrustTier?: ProviderTrustTier;
  readonly minSecurityGrade?: SecurityPostureGrade;
  readonly maxCostPerUnit?: number;
  readonly maxColdBootLatencyMs?: number;
  readonly region?: string;
  readonly zeroDataRetentionOnly?: boolean;
  readonly offlineOnly?: boolean;
  readonly allowedLicenses?: readonly string[];
  readonly requiredCapabilities?: {
    readonly microVM?: boolean;
    readonly snapshots?: boolean;
    readonly filesystemDiff?: boolean;
    readonly networkPolicy?: boolean;
    readonly gpu?: boolean;
    readonly minMemoryMb?: number;
    readonly minCpuCores?: number;
  };
  readonly tags?: readonly string[];
}

export interface MarketplaceMatchScoreBreakdown {
  readonly totalScore: number;
  readonly capabilityMatch: boolean;
  readonly hardConstraintsPassed: boolean;
  readonly costScore: number;
  readonly latencyScore: number;
  readonly isolationScore: number;
  readonly trustScore: number;
  readonly slaScore: number;
}

export interface MarketplaceDiscoveryResult {
  readonly queryId: string;
  readonly totalMatchingListings: number;
  readonly rankedCandidates: readonly MarketplaceMatchCandidate[];
  readonly selectedPrimaryListing?: ProviderMarketplaceListing;
  readonly failoverListings: readonly ProviderMarketplaceListing[];
  readonly timestamp: string;
}
```

### 4.2 JSON Schema Manifests
- **[`schemas/provider-marketplace.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-marketplace.schema.json)**: Validates marketplace listings, publisher identity blocks, SLA figures, and security posture grades.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) provides `providerMarketplaceListingSchema` and `marketplaceDiscoveryQuerySchema`.

---

## 5. User & Provider Marketplace Flow

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  1. Publisher Manifest Submission                           |
|  Provider generates descriptor, binds SLA & public key, signs with Ed25519 private key.   |
|  ProviderMarketplaceEngine audits signature, checks TCK pass, and registers listing.       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                    2. Discovery & Negotiation                               |
|  User benchmark specifies TaskTrustContext and constraints:                                 |
|  - e.g. { zeroDataRetention: true, minSecurityGrade: "A_HARDENED_MICROVM", maxCost: 0.001 } |
|  Marketplace engine executes discover() and evaluates MCDM utility scores.                 |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                   3. Routing & Failover Binding                             |
|  Router binds top-ranked candidate as Primary Provider.                                     |
|  Remaining qualified candidates are queued in ordered Failover Chain.                       |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                               4. Execution & Provenance Sealing                             |
|  Benchmark runs. Adapter isolates extensions. Evidence sealed with listing cryptographic ID.|
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 6. Security, Privacy, and Trust Posture

1. **Digital Signature Verification**: Every listing must be signed by the publisher's registered private key (`signatureHex`). Listings with missing, truncated, or invalid keys are immediately rejected.
2. **Empirical TCK Conformance**: Trust tiers are verified against reproducible TCK test outcomes; unverified self-claims cannot achieve `CRYPTOGRAPHICALLY_CERTIFIED` status.
3. **Data Governance & Privacy Filtering**: Queries with `zeroDataRetentionOnly = true` strictly filter out any cloud provider that has not confirmed zero log retention or ephemeral volume scrubbing.
4. **Air-Gap Verification**: `AIRGAPPED_ON_PREM` listings are strictly verified to ensure zero default route gateways and complete network isolation.

---

## 7. Open-Source vs. Commercial & Enterprise Marketplace Paths

| Feature | Open-Source (`LOCAL_DAEMON`) | Commercial (`SERVERLESS_MICROVM`) | Enterprise (`AIRGAPPED_ON_PREM`) |
| :--- | :--- | :--- | :--- |
| **Pricing** | Free local ($0.00) | Per-second / per-minute | Internal infrastructure |
| **Connectivity** | 100% offline capable | Requires secure TLS API | Air-gapped VPC / on-premise |
| **Boot Latency** | 500ms - 1500ms | 150ms - 300ms (pre-warmed) | 200ms - 500ms |
| **Scale** | Single machine concurrency | 100+ concurrent microVMs | Dedicated hardware cluster |
| **Data Privacy** | Local disk only | Ephemeral zero-retention | Strictly air-gapped |

---

## 8. Licensing and Compliance Boundary

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               SemantIQ Core (MIT / Apache-2.0)                              |
|   Permissive codebase. Zero proprietary or copyleft code linked into SemantIQ Core.         |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Decentralized Catalog RPC / JSON Schema)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                             Marketplace Providers & Adapters                                |
|  • Local Docker / Podman (Apache-2.0 / GPL-2.0 CLI) ──> Communicates via Docker API / CLI  |
|  • OpenSandbox (Apache-2.0)                         ──> Communicates via gRPC / REST API    |
|  • Commercial MicroVM Providers (E2B, Modal)        ──> Communicates via Open SDKs          |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

- **SPDX Transparency**: All marketplace listings include explicit `spdxId` identifiers and terms URLs.
- **Clean-Room Distribution**: Marketplace listings are pure data documents (JSON/YAML), ensuring zero license contamination of consumer systems.

---

## 9. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **Signature Forgery** | Tampered listing manifest | Unverified provider listed | `ProviderMarketplaceEngine` rejects listing during audit |
| **SLA Degradation** | Provider cold boot latency spikes | Benchmark timeouts | Router demotes candidate score; triggers failover candidate |
| **Un-Isolated Extension** | Vendor injects non-standard env flags | Benchmark scores skewed | Listing audit rejects non-isolated extension matrices |
| **Region Incompatibility** | Data residency constraint violation | Compliance breach | Discovery engine drops candidates outside requested region |
| **Outage During Run** | Primary cloud provider API 500 | Benchmark failure | Failover orchestrator re-dispatches run to next listing in chain |

---

## 10. Testing Strategy & Verification

The marketplace architecture is verified through automated test suites:
1. **Listing Publishing & Audit Unit Tests ([`tests/unit/provider-marketplace.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-marketplace.test.ts))**:
   - Audits valid local, cloud, and enterprise marketplace listings.
   - Detects malformed signatures, un-isolated extensions, and out-of-range SLA metrics.
2. **Multidimensional Query & Filtering Tests**:
   - Tests offline-only, zero-data-retention, security grade, cost ceiling, and capability filtering.
3. **MCDM Scoring & Failover Assembly Tests**:
   - Validates utility score calculations and ordered failover chain synthesis.
4. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 schema compliance for all marketplace listing and query schemas.

---

## 11. Acceptance Criteria

- [x] Marketplace listing schema supports all 6 deployment modes and full metadata.
- [x] Multidimensional discovery filters by capability, deployment mode, trust, cost, and privacy.
- [x] MCDM utility scoring ranks providers deterministically and generates failover chains.
- [x] Zero proprietary runtime code or paid dependencies are added to SemantIQ Core.
- [x] Local-first open-source execution remains discoverable, primary, and zero-cost.
- [x] Complete test suite passes with zero regressions across all 151 test files.

---

## 12. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Decentralized Static Catalogs vs. Dynamic Heartbeat Verification**: Static listings may become stale if a provider goes offline.  
  *Mitigation*: The marketplace engine pairs static listing discovery with real-time health checks and circuit breaking in `ProviderSelectionRouter`.
- **Open Question**: Implementing decentralized peer-to-peer catalog synchronization via Git repositories or IPFS for multi-organization academic consortia.

---

## 13. Facts, Assumptions, and Recommendations

- **Facts**:
  - SemantIQ Core communicates with providers exclusively via `ISandboxProvider` interfaces.
  - All marketplace listings are verified against Draft 2020-12 JSON Schemas.
- **Assumptions**:
  - Providers will sign listing manifests using their registered cryptographic public/private keypair.
  - SLA cold-boot metrics accurately reflect typical real-world performance under normal load.
- **Recommendations**:
  - Automatically bundle the local Docker OCI listing (`listing-local-docker`) as a pre-registered zero-cost default.
  - Require `CRYPTOGRAPHICALLY_CERTIFIED` trust tier for providers executing untrusted community benchmarks.

---

## 14. Architecture Decision Record

### [ADR-0132: Provider Marketplace and Decentralized Discovery Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0132-provider-marketplace.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Establish a decentralized provider marketplace protocol (`ProviderMarketplaceListing`), implement multidimensional query discovery (`MarketplaceDiscoveryQuery`), apply MCDM utility scoring for dynamic ranking and failover assembly, and enforce cryptographic signature verification.
- **Consequences**: Enables dynamic, provider-neutral matchmaking based on cost, privacy, and capability constraints while maintaining local-first execution as the default.

---

## 15. Implementation Artifacts

1. **Contracts & Marketplace Engine**: [`packages/sandbox-contracts/src/marketplace.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/marketplace.ts)
2. **Schema Definition**: [`schemas/provider-marketplace.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-marketplace.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/provider-marketplace.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-marketplace.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/PROVIDER_MARKETPLACE_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/PROVIDER_MARKETPLACE_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0132-provider-marketplace.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0132-provider-marketplace.md)

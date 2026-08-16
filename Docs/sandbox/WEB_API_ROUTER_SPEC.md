# SemantIQ Sandbox Specification: Web and API Provider Router Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 49)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

In multi-provider evaluation environments spanning local Docker, rootless Podman, on-premise Firecracker microVMs, and commercial cloud providers (Modal, Fly.io, E2B, AWS, GCP), benchmark execution requests must be matched and routed intelligently. The routing layer must match scenario capability requirements (GPU, memory, runtime type), enforce organizational policies (data residency, local-only, cost limits), evaluate real-time health and concurrency, manage fallback chains, and generate immutable routing provenance records without embedding provider-specific logic into SemantIQ Core.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **Web and API Provider Router Architecture**:
1. **Provider Router Layer**: Implements [`ProviderRouterEngine`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts#L48-L155) to evaluate scenario [`EnvironmentSpec`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/types.ts#L8-L23) contracts against the [`CanonicalProviderRegistryEntry`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/canonical-registry.ts#L22-L34) database.
2. **Capability & Policy Matching Matrix**: Evaluates candidate providers against organizational [`RoutingPolicy`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts#L9-L16) constraints (local-only, cost thresholds, trust tiers, allowed regions).
3. **Automated Primary & Fallback Selection**: Ranks compliant candidates by composite health, cost, and preference scores ([`RoutingCandidateScore`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts#L18-L26)), selecting primary and secondary fallback endpoints.
4. **Verifiable Routing Provenance**: Issues cryptographically sealed [`RoutingDecisionRecord`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts#L28-L41) entries (`decisionSignatureHex`).
5. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                Execution Contract Ingestion                                 |
|  [EnvironmentSpec: GPU=1, Mem=8GB, Runtime=MicroVM] + [RoutingPolicy: MaxCost=$0.05/min]    |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                    ProviderRouterEngine                                     |
|  • Matches Capabilities from Canonical Provider Registry                                    |
|  • Filters Non-Compliant / Unhealthy / Disallowed Providers                                 |
|  • Computes Composite Ranks: Cost, Latency Jitter, Trust Tier, Preferences                  |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               Verifiable Routing Decision Record                            |
|  • Selected Primary: provider-firecracker-cluster (Endpoint: https://firecracker.internal)  |
|  • Selected Fallback: provider-modal-cloud (Endpoint: https://api.modal.com/v1)             |
|  • Cryptographic Signature: decisionSignatureHex                                            |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification builds upon and integrates prior Sandbox-phase modules:
- **Prompt 31–36**: Multi-provider model, canonical registry, marketplace discovery, and trust verification.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle sequence continuity.
- **Prompt 40–45**: Behavioral laboratory, stress environments, chaos injection, recovery, and long-horizon milestones.
- **Prompt 46–48**: Sandbox Benchmark DSL compiler, public Execution API, and local CLI runner.

---

## 3. Scope and Non-Goals

### 3.1 In Scope
- **Provider Router Specification**: Defining [`RoutingPolicy`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts#L9-L16), [`RoutingCandidateScore`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts#L18-L26), [`RoutingDecisionRecord`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts#L28-L41), and JSON Schema [`web-api-routing-decision.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/web-api-routing-decision.schema.json).
- **Capability Matching Algorithm**: Automated matching of hardware requirements (GPU, memory, disk, network isolation, rootless execution).
- **Policy Enforcement**: Local-only, regional compliance, price caps, and trust tier filtering.
- **Fallback Chain Resolution**: Automatic secondary provider failover configuration.

### 3.2 Non-Goals
- **No Proprietary Cloud Hosting**: SemantIQ routes execution contracts; provider endpoints remain external.
- **No In-Band Credential Leakage**: Secrets and tokens are injected at the router boundary and never passed to the benchmark sandbox.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Routing Engine, Policy Validation, and Schemas (ProviderRouterEngine)                    |
|  • Capability Scoring & Composite Candidate Ranking Matrix                                  |
|  • Cryptographic Sealing of RoutingDecisionRecord Provenance                                |
|  • Managing Fallback Provider Retries and Timeout Handshakes                                |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Serving Accurate Health Check and Availability Telemetry                                 |
|  • Returning Standard HTTP 429/503 Quota Signals to Trigger Fallback Routing                |
|  • Enforcing Ephemeral Sandbox Teardown upon Contract Completion                            |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces and Routing Types

### 5.1 TypeScript Router Definitions ([`packages/sandbox-contracts/src/web-api-router.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts))

```typescript
export interface RoutingPolicy {
  readonly requireLocalOnly?: boolean;
  readonly minTrustTier?: 'COMMUNITY_UNVERIFIED' | 'SELF_HOSTED_VERIFIED' | 'COMMERCIAL_AUDITED' | 'ENTERPRISE_CERTIFIED';
  readonly maxCostPerMinuteUsd?: number;
  readonly allowedRegions?: readonly string[];
  readonly preferredProviders?: readonly string[];
  readonly disallowedProviders?: readonly string[];
}

export interface RoutingCandidateScore {
  readonly providerId: string;
  readonly capabilityMatch: boolean;
  readonly policyCompliant: boolean;
  readonly estimatedCostPerMinute: number;
  readonly healthScore: number;
  readonly compositeRank: number;
  readonly rejectionReason?: string;
}

export interface RoutingDecisionRecord {
  readonly routingId: string;
  readonly scenarioId: string;
  readonly selectedProviderId: string;
  readonly selectedEndpointUrl: string;
  readonly fallbackProviderId?: string;
  readonly fallbackEndpointUrl?: string;
  readonly policyApplied: RoutingPolicy;
  readonly candidatesEvaluated: readonly RoutingCandidateScore[];
  readonly routedAt: string;
  readonly decisionSignatureHex: string;
}
```

---

## 6. Schemas & Versioning

- **[`schemas/web-api-routing-decision.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/web-api-routing-decision.schema.json)**: Formal Draft 2020-12 JSON Schema validating routing decisions, candidate scores, and decision signatures.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `routingDecisionRecordSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`). Routing records maintain schema compatibility across minor updates.

---

## 7. Lifecycle and State Machine

```
      +─────────────────────+
      | Execution Contract  |
      +──────────┬──────────+
                 │ Ingest & Match
                 ▼
      +─────────────────────+
      | Capability & Policy |
      | Candidate Scoring   |
      +──────────┬──────────+
                 │ Rank Candidates
                 ▼
      +─────────────────────+
      | Primary Endpoint    |
      | Dispatched          |
      +──────────┬──────────+
                 │ HTTP 429 / 503 / Timeout?
        Yes ┌────┴────┐ No
            ▼         ▼
+─────────────────+  +──────────────────+
| Fallback Route  |  | Active Execution |
| Dispatched      |  +──────────────────+
+─────────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Credential Boundary Isolation**: API bearer tokens and mTLS keys are managed strictly within the router keychain and never passed into sandbox file trees.
2. **Policy Compliance Hard Stops**: Scenarios declared with `requireLocalOnly: true` or specific data residency regions reject external cloud endpoints unconditionally.
3. **Cryptographic Decision Provenance**: Every routing decision is signed with `decisionSignatureHex` to prevent post-hoc claims about provider selection.

---

## 9. Provider Compatibility Matrix

| Provider Endpoint | Capability Support | Latency SLA | Fallback Suitability |
| :--- | :--- | :--- | :--- |
| **Docker (Local)** | Container, Rootful, Low Cost | < 10ms | Primary Local Default |
| **Podman (Local)** | Container, Rootless, Zero-Perm | < 15ms | Primary Rootless Default |
| **Firecracker Cluster** | MicroVM, KVM HW Isolation | < 50ms | Primary Secure Enterprise |
| **Modal / Fly.io / E2B** | GPU, MicroVM, Serverless | 200 - 800ms | Highly Scalable Cloud Fallback |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode | Root Cause | Impact | Automated Recovery Action |
| :--- | :--- | :--- | :--- |
| **Primary 429 Throttle** | Provider hits concurrent rate limit | Request rejected | Router immediately fails over to `fallbackProviderId` |
| **No Eligible Candidates**| Policy too restrictive / missing hardware | Routing failure | Router returns structured rejection explanation |
| **Endpoint Timeout** | Network partition to remote cluster | Hang | Router aborts after 5000ms; switches to fallback |
| **Price Surge** | Provider dynamically increased rates | Budget breach | Cost cap filter rejects provider; selects alternative |

---

## 11. Testing Strategy & Verification

The Web and API Provider Router architecture is validated through automated test suites:
1. **Router Engine Unit Tests ([`tests/unit/web-api-router.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/web-api-router.test.ts))**:
   - Validates capability matching and cost optimization (selects Docker/Podman for container scenarios).
   - Tests policy enforcement (`requireLocalOnly` rejects remote commercial providers).
   - Tests fallback selection when multiple eligible candidates exist.
   - Tests Markdown routing audit report formatting and signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `routingDecisionRecordSchema`.

---

## 12. Acceptance Criteria

- [x] Provider Router contracts define routing policies, candidate scoring, and signed decision records.
- [x] `ProviderRouterEngine` matches capabilities, enforces organizational policies, and ranks candidates.
- [x] Automated fallback configuration provides graceful failover for rate-limited endpoints.
- [x] Cryptographic signatures guarantee unforgeable routing provenance.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Lowest Cost vs. Lowest Latency**: Prioritizing lowest cost might select endpoints with higher queuing latency.  
  *Mitigation*: Support configurable routing weights (e.g. `costWeight: 0.6`, `latencyWeight: 0.4`).
- **Open Question**: Dynamic spot-instance bidding for cost-optimized long-horizon benchmark batches.

---

## 14. Architecture Decision Record

### [ADR-0149: SemantIQ Web and API Provider Router Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0149-web-api-router.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Implement `ProviderRouterEngine` sitting between `Execution Contract` and `Provider Adapter`, enforce policy and capability matching, select primary/fallback routes, and seal decisions with cryptographic signatures.
- **Consequences**: Enables intelligent, policy-compliant, and cost-effective dispatch of benchmark execution requests across heterogeneous local and cloud providers.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Router Engine**: [`packages/sandbox-contracts/src/web-api-router.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/web-api-router.ts)
2. **Schema Definition**: [`schemas/web-api-routing-decision.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/web-api-routing-decision.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/web-api-router.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/web-api-router.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/WEB_API_ROUTER_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/WEB_API_ROUTER_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0149-web-api-router.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0149-web-api-router.md)

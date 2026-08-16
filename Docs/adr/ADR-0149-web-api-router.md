# ADR-0149: SemantIQ Web and API Provider Router Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

In multi-provider evaluation environments spanning local Docker, rootless Podman, on-premise Firecracker microVMs, and commercial cloud providers (Modal, Fly.io, E2B, AWS, GCP), benchmark execution requests must be matched and routed intelligently. The routing layer must match scenario capability requirements (GPU, memory, runtime type), enforce organizational policies (data residency, local-only, cost limits), evaluate real-time health and concurrency, manage fallback chains, and generate immutable routing provenance records without embedding provider-specific logic into SemantIQ Core.

To decouple benchmark execution requests from physical endpoints, SemantIQ requires a canonical Web and API Provider Router.

---

## Decision

1. **Provider Router Architecture**: Implement `ProviderRouterEngine` sitting directly between `Execution Contract` and `Provider Adapter`.
2. **Capability & Policy Matching**: Evaluate candidate providers from the Canonical Provider Registry against scenario `EnvironmentSpec` and `RoutingPolicy` (e.g. `requireLocalOnly`, `minTrustTier`, `maxCostPerMinuteUsd`, `disallowedProviders`).
3. **Automated Primary & Fallback Selection**: Rank compliant candidates by composite health and cost score, selecting primary and secondary fallback endpoints.
4. **Verifiable Routing Provenance**: Issue a signed `RoutingDecisionRecord` (`decisionSignatureHex`) containing the candidate ranking matrix, applied policies, and selection timestamps.
5. **Credential & Secret Boundary**: Credentials (API tokens, mTLS certs) are injected by the router at the network transport boundary and are never exposed to the agent or scenario.
6. **Observable Behavioral Grounding**: Invariant: The router layer remains transparent to behavioral observation, routing telemetry unaltered across the canonical chain.

---

## Consequences

- Scenarios declare what execution capabilities they need; the router resolves where and how to run them.
- Guarantees seamless fallback when cloud endpoints return HTTP 429/503.
- All routing decisions are cryptographically auditable in benchmark receipts.

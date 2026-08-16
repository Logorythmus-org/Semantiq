# ADR-0132: Provider Marketplace and Decentralized Discovery Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

To run benchmark scenarios across a heterogeneous, evolving ecosystem of execution engines (local daemons, self-hosted clusters, cloud microVMs, and air-gapped on-premise hardware), SemantIQ requires a decentralized registry and discovery marketplace.

The marketplace must allow discovery by multidimensional constraints—capabilities, deployment mode, trust tiers, cost budgets, and privacy policies—without creating vendor lock-in, without requiring a centralized paywalled catalog, and without compromising SemantIQ Core's provider neutrality.

---

## Decision

1. **Decentralized Marketplace Architecture**: Define a decentralized, machine-readable listing format (`ProviderMarketplaceListing`) that publishers can host in local directories, Git repositories, or static HTTP endpoints.
2. **Multidimensional Query Engine**: Implement `MarketplaceDiscoveryQuery` supporting filtering by deployment modes (`LOCAL_DAEMON`, `DEDICATED_CLUSTER`, `SERVERLESS_MICROVM`, `MANAGED_MULTI_TENANT`, `AIRGAPPED_ON_PREM`), minimum trust tiers, security posture grades, cost caps, and privacy guarantees.
3. **MCDM Utility Scoring & Failover Ranking**: Apply Multi-Criteria Decision Making (MCDM) utility scoring across trust (30%), isolation grade (25%), cold-boot latency (20%), cost efficiency (15%), and SLA uptime (10%) to rank candidates and construct deterministic failover chains.
4. **Cryptographic Identity & Signature Verification**: Require all marketplace listings to include publisher public keys and cryptographic signatures (`signatureHex`), verifying attestation against TCK conformance data.
5. **Zero Vendor Monopolies**: Ensure local-first, zero-cost open-source execution (`LOCAL_DAEMON` via Docker/OCI or `MOCK_REPLAY`) remains discoverable and primary out of the box.

---

## Consequences

- Users can dynamically discover and route benchmark workloads to optimal providers based on strict cost, privacy, and capability constraints.
- Evaluation runs automatically select primary providers and establish resilient failover chains without user intervention.
- The marketplace remains fully decentralized, open-source, and free of proprietary gatekeeping.

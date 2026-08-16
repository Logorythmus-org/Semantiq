# ADR-0131: Open and Commercial Provider Model

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

SemantIQ evaluates AI agent reasoning and task execution across a diverse landscape of execution backends: local-first open-source container daemons, self-hosted microVM clusters, managed commercial clouds, and private air-gapped enterprise infrastructure.

To preserve SemantIQ's independence, provider neutrality, and zero vendor lock-in, SemantIQ Core must maintain a single, universal provider model without copying third-party runtime code, without requiring mandatory providers, and without permitting provider-specific extensions to distort canonical benchmark semantics.

---

## Decision

1. **Unified Provider Ecosystem Taxonomy**: Define 5 hosting categories: `LOCAL_OPEN_SOURCE`, `SELF_HOSTED_DEDICATED`, `COMMERCIAL_MANAGED_CLOUD`, `ENTERPRISE_PRIVATE_AIRGAPPED`, and `DETERMINISTIC_REPLAY`.
2. **Machine-Readable Metadata**: Standardize `ProviderEcosystemDescriptor`, containing SPDX licensing (`ProviderLicenseInfo`), granular billing rates (`ProviderCostStructure`), and data retention rules (`ProviderDataPrivacyProfile`).
3. **Strict Extension Isolation**: Enforce that provider-specific accelerators and features (e.g. proprietary snapshots, vendor telemetry) are isolated in adapter layers and never modify canonical benchmark contracts or evaluation rubrics.
4. **Clean-Room License & Compliance Boundary**: Establish clean-room network RPC / subprocess boundaries for external runtimes, preventing AGPL or proprietary license contamination in SemantIQ Core.
5. **Deterministic Cost & Provenance Attribution**: Generate verifiable `CostAttributionRecord` and cryptographic provenance manifests for all evaluation runs.

---

## Consequences

- SemantIQ remains 100% provider-neutral with local-first execution as the zero-cost default.
- Developers and enterprises can plug in OpenSandbox, E2B, Modal, Firecracker, or custom runtimes without touching SemantIQ Core.
- Benchmark reports transparently disclose execution cost, SPDX license, data retention status, and cryptographic runtime provenance.

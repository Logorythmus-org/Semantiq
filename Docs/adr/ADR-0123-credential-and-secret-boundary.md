# ADR-0123: Credential and Secret Boundary for Sandbox Subsystems

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Benchmarks and agent evaluations running in sandbox environments often require credentials (e.g. API keys, git authentication tokens, certificate bundles). Storing or logging raw secrets inside SemantIQ Core creates critical security risks and destroys third-party auditability and reproducibility.

---

## Decision

1. **Zero-Secret Core**: SemantIQ Core shall declare abstract `SecretRequirement` metadata and never act as a secret store or key vault.
2. **Provider-Side Injection**: Runtime adapters resolve credentials from external sources (environment variables, vaults, or ephemeral mock generators) and inject them directly into isolated execution targets (tmpfs files, env vars, or stdin pipes).
3. **Automated Evidence Redaction**: The evidence normalization pipeline shall apply `SecretRedactor` to all stdout, stderr, process trees, and filesystem diffs before sealing evidence manifests.
4. **Masked Provenance**: Provenance manifests shall record `valueMaskedSha256` fingerprints of credentials to confirm configuration identity across runs without disclosing secret plaintext.

---

## Consequences

- SemantIQ Core remains pure, portable, and secure against credential leakage.
- Evidence archives and benchmark results can be shared publicly and audited deterministically.
- Provider adapters remain easily interchangeable without changing benchmark definitions.

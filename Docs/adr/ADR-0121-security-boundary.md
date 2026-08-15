# ADR-0121: 6-Layer Security Boundary Architecture for SemantIQ Sandboxes

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Autonomous AI agents executing arbitrary code, downloading packages, and interacting with tools can cause severe security compromises if containment boundaries are ambiguous or unenforced. SemantIQ must guarantee comprehensive isolation without coupling to a single runtime technology.

---

## Decision

1. **6-Layer Isolation Model**: Enforce distinct boundaries for Agent ↔ Sandbox, Sandbox ↔ Host, Sandbox ↔ Network, Agent ↔ Tools, Sandbox ↔ Provider, and Provider ↔ SemantIQ Core in `packages/sandbox-contracts/src/security-boundary.ts`.
2. **Metadata Endpoint Firewalling**: Mandate automated blocking of cloud metadata IP ranges (`169.254.169.254/32`).
3. **Automated Quarantine Protocol**: Implement `SecurityBoundaryEnforcer` to instantly quarantine execution instances upon detecting host escape attempts or unauthorized network egress.
4. **Hardened Default Constraints**: Enforce unprivileged user accounts, read-only root filesystems, and dropped Linux capabilities.

---

## Consequences

- Evaluator hosts and cloud infrastructure remain completely protected from untrusted agent code.
- Malicious breach attempts are caught, audited, and preserved as evidence.
- Benchmarks run under consistent, reproducible security constraints across all execution providers.

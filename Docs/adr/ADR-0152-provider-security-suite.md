# ADR-0152: SemantIQ Provider-Neutral Security Test Suite Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

Running autonomous AI agents within external sandbox environments carries risks of sandbox breakout, privilege escalation, network data exfiltration, memory secret scavenging, fork bomb resource starvation, and evidence log tampering. Evaluators need automated, objective verification that a provider's isolation boundaries, network policies, and cleanup routines are robust against adversarial or buggy agent behavior.

To enforce rigorous sandbox isolation guarantees, SemantIQ requires a canonical Provider-Neutral Security Test Suite.

---

## Decision

1. **Seven Attack & Isolation Categories**:
   - `FILESYSTEM_CONTAINMENT`: Path traversal and host mount tampering.
   - `NETWORK_EGRESS_POLICY`: Outbound TCP/DNS connection leakage under isolated network policies.
   - `CREDENTIAL_ISOLATION`: Environment and memory secret scraping.
   - `RESOURCE_GOVERNANCE`: Fork bomb and memory starvation throttling.
   - `PROCESS_PRIVILEGE_CONTAINMENT`: User namespaces and rootless UID enforcement.
   - `CLEANUP_EPHEMERALITY`: Verification of zero orphan host processes and leftover disk mounts.
   - `EVIDENCE_TAMPER_RESISTANCE`: Read-only protection of Merkle trace telemetry.
2. **Four-Tier Security Posture Grades**:
   - `GRADE_A_HARDENED_ISOLATED`: 100% probes passed, 0 critical vulnerabilities.
   - `GRADE_B_CONTAINED`: No critical vulnerabilities, minor warnings.
   - `GRADE_C_PERMISSIVE`: Multiple non-critical isolation gaps.
   - `GRADE_F_VULNERABLE`: 1+ critical vulnerabilities detected (immediate rejection).
3. **Automated Audit Suite**: Implement `ProviderSecurityTestSuite` to run automated probe batteries against any `SemantiqProviderAdapter`.
4. **Cryptographic Audit Provenance**: Every audit emits a signed `ProviderSecurityAuditReport` (`auditSignatureHex`) with per-probe evidence hashes.
5. **Observable Behavioral Grounding**: Invariant: Security testing probes external container/process boundaries without attempting to infer or simulate internal cognitive states.

---

## Consequences

- Automated CI/CD gate for provider admission into the Canonical Provider Registry.
- Protects benchmark hosts and evaluator secrets from rogue agent actions.
- Provides cryptographic assurance of runtime security posture to enterprise benchmark evaluators.

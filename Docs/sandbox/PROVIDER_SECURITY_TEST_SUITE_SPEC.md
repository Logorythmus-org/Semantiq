# SemantIQ Sandbox Specification: Provider Security Test Suite Architecture

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 52)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

Running autonomous AI agents within external sandbox environments carries risks of sandbox breakout, privilege escalation, network data exfiltration, memory secret scavenging, fork bomb resource starvation, and evidence log tampering. Evaluators need automated, objective verification that a provider's isolation boundaries, network policies, and cleanup routines are robust against adversarial or buggy agent behavior.

SemantIQ evaluates agent reasoning and observable behavior across the standard pipeline:
$$\text{Benchmark} \longrightarrow \text{Scenario} \longrightarrow \text{Execution Contract} \longrightarrow \text{Provider Router} \longrightarrow \text{Provider Adapter} \longrightarrow \text{Runtime} \longrightarrow \text{Observation} \longrightarrow \text{Evidence} \longrightarrow \text{Evaluation} \longrightarrow \text{Report}$$

This specification establishes the **Provider-Neutral Security Test Suite Architecture**:

1. **Seven Attack & Isolation Categories**: Standardizes probes for [`FILESYSTEM_CONTAINMENT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L10-L10), [`NETWORK_EGRESS_POLICY`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L11-L11), [`CREDENTIAL_ISOLATION`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L12-L12), [`RESOURCE_GOVERNANCE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L13-L13), [`PROCESS_PRIVILEGE_CONTAINMENT`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L14-L14), [`CLEANUP_EPHEMERALITY`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L15-L15), and [`EVIDENCE_TAMPER_RESISTANCE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L16-L16).
2. **Four-Tier Security Posture Grades**: Distinguishes [`GRADE_A_HARDENED_ISOLATED`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L21-L21), [`GRADE_B_CONTAINED`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L22-L22), [`GRADE_C_PERMISSIVE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L23-L23), and [`GRADE_F_VULNERABLE`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L24-L24).
3. **Automated Security Test Suite**: Implements [`ProviderSecurityTestSuite`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L52-L198) running automated attack payloads and emitting signed [`ProviderSecurityAuditReport`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L37-L48) records (`auditSignatureHex`).
4. **Strict Observable Behavioral Grounding**: Evaluates behavior strictly across the canonical sequence:
   $$\text{Context} \longrightarrow \text{Interpretation} \longrightarrow \text{Decision} \longrightarrow \text{Action} \longrightarrow \text{Result} \longrightarrow \text{Consequence} \longrightarrow \text{Recovery}$$
   without claiming access to hidden cognition or internal model states.

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                  Target Provider Adapter                                    |
|  [SemantiqProviderAdapter: Docker / Podman / Firecracker / Modal]                           |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                ProviderSecurityTestSuite                                    |
|  • Injects Path Traversal, Egress Leak, Env Exfiltration, and Fork Bomb Payloads            |
|  • Evaluates Process UID Containment, Teardown Ephemerality, and Merkle Tamper Resistance   |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │
                                                ▼
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                               ProviderSecurityAuditReport                                   |
|  • Posture Grade: GRADE_A_HARDENED_ISOLATED (7/7 Passed, 0 Critical Vulnerabilities)        |
|  • Evidence Digests: SHA-256 Hashes of Observed Output Traces                               |
|  • Auditor Cryptographic Signature: auditSignatureHex                                       |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 2. Inputs & Prior Decisions

This specification integrates security requirements across the Sandbox Phase:

- **Prompt 31–36**: Multi-provider trust boundaries, licensing, and attribution.
- **Prompt 37–38**: Holistic execution cost accounting and verifiable execution receipts.
- **Prompt 39**: Portable Evidence Package and Merkle trace immutability.
- **Prompt 40–45**: Transition laboratory, semantic stress environments, chaos injection, and resilience metrics.
- **Prompt 46–51**: Sandbox DSL compiler, public Execution API, CLI local runner, Web/API router, Provider SDK, and Provider Certification.

---

## 3. Scope and Non-Goals

### 3.1 In Scope

- **Security Suite Specification**: Defining [`SecurityProbeCategory`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L9-L17), [`SecuritySeverity`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L19-L19), [`SecurityProbeResult`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L26-L35), [`ProviderSecurityAuditReport`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts#L37-L48), and JSON Schema [`provider-security-audit-report.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-security-audit-report.schema.json).
- **Automated Probe Execution**: Running security tests against any `SemantiqProviderAdapter`.
- **Grade Calculation**: Objective scoring of runtime security posture.

### 3.2 Non-Goals

- **No Proprietary Security Scanners**: Suite uses open, reproducible POSIX/network probing scripts.
- **No Reliance on Provider Self-Attestation**: All security claims must be proven via active probes.

---

## 4. Architecture & Responsibility Separation

```
+─────────────────────────────────────────────────────────────────────────────────────────────+
|                                 SEMANTIQ-OWNED RESPONSIBILITIES                             |
|  • Security Probing Suite & Attack Payload Library (ProviderSecurityTestSuite)              |
|  • Evaluating Observed Responses & Calculating Security Posture Grades                      |
|  • Cryptographically Signing ProviderSecurityAuditReport Records                            |
+───────────────────────────────────────────────┬─────────────────────────────────────────────+
                                                │ (Standardized Sandbox Execution Contracts)
+───────────────────────────────────────────────▼─────────────────────────────────────────────+
|                                 PROVIDER-OWNED RESPONSIBILITIES                             |
|  • Enforcing Operating System & Kernel Isolation (cgroups, namespaces, seccomp, AppArmor)   |
|  • Blocking Prohibited Egress Network Calls at the Firewall Boundary                        |
|  • Purging All Filesystem Mounts, Temp Files, and Child Processes upon Teardown             |
+─────────────────────────────────────────────────────────────────────────────────────────────+
```

---

## 5. Interfaces and Security Types

### 5.1 TypeScript Security Definitions ([`packages/sandbox-contracts/src/provider-security-suite.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts))

```typescript
export type SecurityProbeCategory =
  | "FILESYSTEM_CONTAINMENT"
  | "NETWORK_EGRESS_POLICY"
  | "CREDENTIAL_ISOLATION"
  | "RESOURCE_GOVERNANCE"
  | "PROCESS_PRIVILEGE_CONTAINMENT"
  | "CLEANUP_EPHEMERALITY"
  | "EVIDENCE_TAMPER_RESISTANCE";

export type SecuritySeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";

export type SecurityPostureGrade =
  "GRADE_A_HARDENED_ISOLATED" | "GRADE_B_CONTAINED" | "GRADE_C_PERMISSIVE" | "GRADE_F_VULNERABLE";

export interface SecurityProbeResult {
  readonly probeId: string;
  readonly category: SecurityProbeCategory;
  readonly severity: SecuritySeverity;
  readonly passed: boolean;
  readonly attackPayload: string;
  readonly observedResponse: string;
  readonly mitigationVerified: boolean;
  readonly evidenceHash: string;
}

export interface ProviderSecurityAuditReport {
  readonly auditId: string;
  readonly providerId: string;
  readonly providerVersion: string;
  readonly securityPostureGrade: SecurityPostureGrade;
  readonly totalProbes: number;
  readonly passedProbes: number;
  readonly criticalVulnerabilitiesCount: number;
  readonly probes: readonly SecurityProbeResult[];
  readonly auditedAt: string;
  readonly auditSignatureHex: string;
}
```

---

## 6. Schemas & Versioning

- **[`schemas/provider-security-audit-report.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-security-audit-report.schema.json)**: Formal Draft 2020-12 JSON Schema validating security audit reports and probe results.
- **Exported Schemas**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts) exports `providerSecurityAuditReportSchema`.
- **Versioning Policy**: Semantic versioning (`1.0.0`).

---

## 7. Lifecycle and State Machine

```
      +───────────────────+
      | Security Audit    |
      | Triggered         |
      +─────────┬─────────+
                │ Provision Sandbox
                ▼
      +───────────────────+
      | Probe Execution   | ──> FS, Network, Secrets, Resources, Privilege Probes
      +─────────┬─────────+
                │ Teardown Sandbox
                ▼
      +───────────────────+
      | Cleanup & Tamper  | ──> Verify Zero Host Residuals & Merkle Protection
      | Audit             |
      +─────────┬─────────+
                │ Score & Sign
                ▼
      +───────────────────+
      | Security Report   | ──> GRADE_A to GRADE_F (Signed with ECDSA)
      | Issued            |
      +───────────────────+
```

---

## 8. Security, Privacy, and Trust Posture

1. **Zero Secret Leakage**: The suite verifies that host environment variables containing `API_KEY` or `TOKEN` are stripped from sandbox child processes.
2. **Immutable Trace Protection**: In-sandbox commands cannot tamper with host-managed Merkle telemetry streams.
3. **Hard Network Isolation**: When `network: none` is requested, outbound SYN packets must receive immediate host rejection.

---

## 9. Provider Compatibility

| Execution Engine                | Primary Isolation Layer              | Typical Posture Grade       |
| :------------------------------ | :----------------------------------- | :-------------------------- |
| **Docker (Local)**              | Linux cgroups / namespaces / seccomp | `GRADE_B_CONTAINED`         |
| **Podman (Rootless)**           | User namespaces (rootless UID)       | `GRADE_A_HARDENED_ISOLATED` |
| **Firecracker**                 | Hardware KVM MicroVM / jailer        | `GRADE_A_HARDENED_ISOLATED` |
| **Cloud Sandbox (Modal / E2B)** | Ephemeral gVisor / MicroVM           | `GRADE_A_HARDENED_ISOLATED` |

---

## 10. Failure Modes & Resilience Strategies

| Failure Mode         | Root Cause                                | Impact            | Automated Recovery Action                              |
| :------------------- | :---------------------------------------- | :---------------- | :----------------------------------------------------- |
| **Egress Leak**      | Provider failed to disable bridge network | Exfiltration risk | Assigns `GRADE_F_VULNERABLE`; blocks registration      |
| **Secret Exposure**  | Host daemon forwarded evaluator env vars  | Credential breach | Assigns `GRADE_F_VULNERABLE`; issues immediate alert   |
| **Fork Bomb Hang**   | Missing process count cgroup limit        | Host freeze       | Suite aborts via timeout; flags resource vulnerability |
| **Orphan Container** | Teardown hook failed to remove volume     | Disk leak         | Fails cleanup probe; drops grade to `GRADE_B`          |

---

## 11. Testing Strategy & Verification

The Provider Security Test Suite architecture is validated through automated test suites:

1. **Security Suite Unit Tests ([`tests/unit/provider-security-suite.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-security-suite.test.ts))**:
   - Tests running full 7-probe security attack battery on `MockReferenceProviderAdapter`.
   - Asserts all 7 probes pass (`SEC-PROBE-01` through `SEC-PROBE-07`).
   - Asserts `GRADE_A_HARDENED_ISOLATED` security posture grade and 0 critical vulnerabilities.
   - Tests Markdown security report formatting and cryptographic signature generation.
2. **Contract Schema Conformance Tests ([`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts))**:
   - Validates Draft 2020-12 JSON Schema compliance for `providerSecurityAuditReportSchema`.

---

## 12. Acceptance Criteria

- [x] Security Suite contracts define 7 attack categories, 4 posture grades, and probe results.
- [x] `ProviderSecurityTestSuite` automates active probing across filesystem, network, secrets, and resources.
- [x] Cryptographic audit signatures guarantee unforgeable security reports.
- [x] Zero third-party runtime code or proprietary SDKs are copied into SemantIQ Core.
- [x] All 151 test files (512+ passing tests) pass cleanly with zero regressions.

---

## 13. Risks, Trade-Offs, and Open Questions

- **Trade-Off: Active Probing vs. Safe Execution**: Fork bomb probes must be carefully capped to prevent freezing the test harness machine.  
  _Mitigation_: Enforce strict 5-second process group timeouts on all security probe invocations.
- **Open Question**: Adding side-channel (Spectre/Meltdown) timing leakage probes for multi-tenant microVM hosts.

---

## 14. Architecture Decision Record

### [ADR-0152: SemantIQ Provider-Neutral Security Test Suite Architecture](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0152-provider-security-suite.md)

- **Status**: Accepted
- **Date**: 2026-08-15
- **Decision**: Define 7-category attack battery, compute security posture grades (`GRADE_A` to `GRADE_F`), and issue signed `ProviderSecurityAuditReport` records to verify runtime isolation objectively.
- **Consequences**: Guarantees that only securely isolated and hermetic execution providers are trusted for benchmark evaluations.

---

## 15. Generated & Modified Artifact List

1. **Contracts & Security Test Suite**: [`packages/sandbox-contracts/src/provider-security-suite.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/provider-security-suite.ts)
2. **Schema Definition**: [`schemas/provider-security-audit-report.schema.json`](file:///c:/Users/Kaveh/Desktop/Tech-Club/schemas/provider-security-audit-report.schema.json)
3. **Contracts Index**: [`packages/sandbox-contracts/src/index.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/index.ts)
4. **Schemas Export**: [`packages/sandbox-contracts/src/schemas.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/packages/sandbox-contracts/src/schemas.ts)
5. **Unit Tests**: [`tests/unit/provider-security-suite.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/unit/provider-security-suite.test.ts)
6. **Contract Tests**: [`tests/contracts/sandbox-contracts.test.ts`](file:///c:/Users/Kaveh/Desktop/Tech-Club/tests/contracts/sandbox-contracts.test.ts)
7. **Specification**: [`Docs/sandbox/PROVIDER_SECURITY_TEST_SUITE_SPEC.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/sandbox/PROVIDER_SECURITY_TEST_SUITE_SPEC.md)
8. **ADR Record**: [`Docs/adr/ADR-0152-provider-security-suite.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/adr/ADR-0152-provider-security-suite.md)

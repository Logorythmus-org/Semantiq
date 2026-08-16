# SemantIQ Sandbox Specification: Provider Trust and Verification

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 30)  
**Status**: Approved Specification  
**Date**: 2026-08-15

---

## 1. Executive Summary

When benchmarks execute across external cloud sandbox providers, community-hosted runners, or third-party infrastructure, SemantIQ cannot blindly trust unverified claims regarding container isolation, network segregation, or execution fidelity.

This specification defines the **Provider Trust, Verification, and Certification Framework**:

1. **Technology Compatibility Kit (TCK)**: All providers must execute the standardized SemantIQ TCK suite to empirically prove conformance to filesystem isolation, network whitelisting, signal handling, process lifecycle, and snapshot contracts.
2. **Cryptographic Attestation & Identity**: Certified providers maintain a verifiable public/private keypair and publish signed attestation manifests (`ProviderAttestation`).
3. **Graduated Trust Tiers**: Providers are classified into clear trust tiers (`UNVERIFIED`, `SELF_ATTESTED`, `TCK_VERIFIED`, `CRYPTOGRAPHICALLY_CERTIFIED`) and assigned security grades (`A_HARDENED_MICROVM`, `B_ISOLATED_CONTAINER`, `C_RESTRICTED_PROCESS`, `F_UNCONFINED`).

```
Provider Registration ──> TCK Test Suite ──> Attestation Verification ──> Trust Tier Assignment ──> Production Routing
```

---

## 2. Scope

- Cryptographic provider identity and public key registration (`ProviderIdentity`).
- Standardized TCK test execution and evidence bundle verification (`TckConformanceSummary`).
- Automated security posture evaluation (`SecurityPostureGrade`).
- Dynamic trust tier assignment (`ProviderTrustTier`) and validation engine (`ProviderTrustValidator`).

---

## 3. Non-Goals

- Centralized proprietary vendor licensing or paywalled certification.
- Granting blanket trust to self-hosted runners without empirical TCK verification.
- Enforcing specific host operating systems or cloud hosting vendors.

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                            Provider Registration & Key                            |
|  [Provider Identity: Public Key + Endpoint + Org Metadata]                        |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        TCK (Technology Compatibility Kit)                         |
|  [Runs 10+ Conformance Tests: Filesystem, Signals, Isolation, Snapshots]          |
|         |                                                                         |
|         v (Produces Signed TckConformanceSummary & Evidence SHA-256)              |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Provider Trust Validator                                   |
|  [ProviderTrustValidator]                                                         |
|         | (Verifies Signature, TCK Pass Rate >= 100%, and Security Grade)         |
|         v                                                                         |
|  [Issues AttestationVerificationReport with Assigned Trust Tier]                  |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        SemantIQ Router Dynamic Routing                            |
|  - High-Security / Tier D Benchmarks ──> CRYPTOGRAPHICALLY_CERTIFIED Providers    |
|  - Standard Research Benchmarks     ──> TCK_VERIFIED Providers                    |
|  - Development / Local Replay       ──> SELF_ATTESTED Providers                   |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Provider Attestation Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ProviderAttestation",
  "type": "object",
  "required": [
    "identity",
    "declaredTrustTier",
    "securityGrade",
    "tckSummary",
    "capabilities",
    "signatureHex"
  ],
  "properties": {
    "identity": {
      "type": "object",
      "required": ["providerId", "organization", "publicKeyHex", "registeredAt"],
      "properties": {
        "providerId": { "type": "string" },
        "organization": { "type": "string" },
        "publicKeyHex": { "type": "string" },
        "endpointUrl": { "type": "string" },
        "registeredAt": { "type": "string" }
      }
    },
    "declaredTrustTier": {
      "type": "string",
      "enum": ["UNVERIFIED", "SELF_ATTESTED", "TCK_VERIFIED", "CRYPTOGRAPHICALLY_CERTIFIED"]
    },
    "securityGrade": {
      "type": "string",
      "enum": ["A_HARDENED_MICROVM", "B_ISOLATED_CONTAINER", "C_RESTRICTED_PROCESS", "F_UNCONFINED"]
    },
    "tckSummary": {
      "type": "object",
      "required": [
        "tckSuiteVersion",
        "totalTests",
        "passedTests",
        "failedTests",
        "executedAt",
        "tckEvidenceSha256"
      ],
      "properties": {
        "tckSuiteVersion": { "type": "string" },
        "totalTests": { "type": "integer" },
        "passedTests": { "type": "integer" },
        "failedTests": { "type": "integer" },
        "executedAt": { "type": "string" },
        "tckEvidenceSha256": { "type": "string" }
      }
    },
    "capabilities": { "type": "object" },
    "signatureHex": { "type": "string" }
  }
}
```

---

## 6. Interfaces

- `ProviderTrustValidator`: Audits attestation manifests, validates cryptographic signatures, and outputs `AttestationVerificationReport`.
- `ProviderAttestation`: Complete cryptographic credential bundle submitted by providers.

---

## 7. Lifecycle & State Machine

```
[UNVERIFIED] ──(Submit Attestation)──> [EVALUATING] ──(Pass TCK)──> [CERTIFIED]
     |                                      |                          |
     v                                      v                          v
 [REJECTED]                           [TCK_FAILED]                [REVOKED]
```

1. **UNVERIFIED**: New provider connects to SemantIQ.
2. **EVALUATING**: TCK conformance test suite is executed.
3. **CERTIFIED**: Provider assigned verified trust tier and listed in router catalog.
4. **REVOKED**: Subsequent audit failure or security violation downgrades provider immediately.

---

## 8. Security & Trust Posture

- **Empirical Proof over Self-Attestation**: Trust is established strictly through reproducible TCK test outcomes, not marketing claims.
- **Anti-Tamper Cryptography**: All attestation reports are signed with the provider's Ed25519/ECDSA private key.
- **No Unconfined Execution**: Any provider operating with `F_UNCONFINED` security posture is rejected from executing untrusted agent code.

---

## 9. Reproducibility & Provenance

- **Provenance Binding**: The `tckEvidenceSha256` is included in all downstream benchmark manifests to prove which certified runner executed the evaluation.

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Provider Trust Role                                                         |
| :--------------------- | :-------------------------------------------------------------------------- |
| **Context**            | Provider identity and verified trust tier declared in router catalog.       |
| **Interpretation**     | Router evaluates benchmark security requirements against provider tier.     |
| **Decision**           | Router routes high-risk tasks only to certified, hardened providers.        |
| **Action**             | Benchmark executes inside verified runtime boundary.                        |
| **Result**             | Execution evidence returned alongside cryptographic provider signature.     |
| **Consequence**        | Public consumers can independently audit provider certification status.     |
| **Recovery**           | TCK regression or signature mismatch triggers automatic routing revocation. |

---

## 11. Provider-Neutral Design

Any runtime (Docker, Kata, Firecracker, OpenSandbox, or remote harnesses) can run the open TCK test suite and achieve certification.

---

## 12. Failure Modes & Mitigations

1. **Forged Signature / Impersonation**: Blocked by ECDSA/Ed25519 cryptographic public key verification.
2. **Partial TCK Pass (e.g. 8/10 tests)**: Provider downgraded to `UNVERIFIED` with detailed violation list.
3. **Post-Certification Drift**: Automated periodic TCK re-evaluations ensure ongoing compliance.

---

## 13. Acceptance Criteria

- [x] Standardized `ProviderAttestation` and `AttestationVerificationReport` contracts.
- [x] Automated TCK test pass validation and signature checking.
- [x] Objective trust tier and security posture grading system.
- [x] Comprehensive unit tests passing with zero boundary or typecheck errors.

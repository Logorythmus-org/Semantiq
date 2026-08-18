# Security Policy for SemantIQ

SemantIQ is **Behavioral Evidence Infrastructure for AI Systems**. Because SemantIQ evaluates autonomous agents, processes external execution logs, and verifies research claims, security and integrity are core architectural requirements.

---

## 1. Supported Versions

| Version | Supported | Security Patch Support |
| :--- | :---: | :--- |
| **`1.0.x` (Current)** | **YES** | Active security support and CVE patches. |
| `0.1.0-alpha.x` | **YES** | Critical vulnerability fixes until next minor release. |
| `< 0.1.0` | **NO** | End of life. Upgrade to `1.0.x`. |

---

## 2. Reporting a Vulnerability

We appreciate responsible disclosure. If you discover a security vulnerability in SemantIQ:

1. **Do NOT open a public issue.**
2. Send an encrypted email with detailed reproduction steps to:
   $$\text{security@semantiq.org}$$
3. **Response SLA**:
   - **Initial Acknowledgement**: Within **48 hours**.
   - **Triage & Assessment**: Within **5 business days**.
   - **Patch Release & Advisory**: Within **14 business days** (coordinated disclosure).

---

## 3. Core Security Controls & Invariants

### 3.1 Local-First & Zero Egress by Default
- The SemantIQ engine, CLI, and HTTP server operate in **local-first mode** (`isOfflineMode: true`).
- Zero telemetry, evaluation traces, or model logs are transmitted to external servers without explicit operator authorization.

### 3.2 Secret & Credential Redaction
- All credentials, API tokens, and secret environment variables are handled through `CredentialResolutionContext`.
- Sensitive fields in traces, benchmark logs, and execution manifests are automatically redacted (`***REDACTED***`).
- Evaluation outputs never persist raw API tokens.

### 3.3 Research Bundle & Manifest Cryptographic Sealing
- Research bundles are cryptographically verified using SHA-256 Merkle tree roots (`ResearchBundleVerifier`).
- Partner execution manifests are validated against frozen preregistration fingerprints. Tampered bundles or unauthorized deviations trigger immediate `quarantined` or `rejected` status.

### 3.4 Input Validation & Path Traversal Prevention
- All file paths in CLI imports, bundle loaders, and HTTP endpoints are sanitized against path traversal (`..` attacks).
- Schema validation (`packages/sandbox-contracts`) rejects unverified payloads before domain ingestion.

### 3.5 Network & Server Boundary
- Headless HTTP API defaults to `127.0.0.1` binding.
- Optional Web UI static serving is strictly sandboxed; omitting static directory runs the server in 100% headless REST mode.

---

## 4. Security Documentation References

- **Threat Model**: [`Docs/security/threat_model.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/security/threat_model.md)
- **Data Handling & Privacy Guide**: [`Docs/security/data_handling.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/Docs/security/data_handling.md)
- **Licensing & Rights Boundary**: [`LICENSING.md`](file:///c:/Users/Kaveh/Desktop/Tech-Club/LICENSING.md)

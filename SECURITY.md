# Security Policy for SemantIQ

SemantIQ is **Behavioral Evidence Infrastructure for AI Systems**. Because SemantIQ evaluates autonomous agents, processes external execution logs, and verifies research claims, security and integrity are core architectural requirements.

---

## 1. Supported Versions

SemantIQ is currently a **Public Alpha (Experimental)** project.

| Version | Supported | Security Patch Support |
| :--- | :---: | :--- |
| **`0.1.0-alpha.x`** | **YES** | Current Public Alpha line; critical vulnerability fixes are accepted while this line is maintained. |
| Other / unreleased version lines | **NO CURRENT SUPPORT CLAIM** | No current `1.0.x` release or support commitment is established by the repository's canonical version surfaces. |

The current provisional software identity is `0.1.0-alpha.2` (Python distribution
`0.1.0a2`). A future `1.0.x` line must not be treated as released, current, or supported until
a corresponding release and support policy are explicitly established.

---

## 2. Reporting a Vulnerability

We appreciate responsible disclosure. If you discover a security vulnerability in SemantIQ:

1. **Do NOT open a public issue containing vulnerability details.**
2. The repository currently publishes this security contact:
   `security@semantiq.org`
3. **Published maintainer response targets**:
   - **Initial Acknowledgement**: Within **48 hours**.
   - **Triage & Assessment**: Within **5 business days**.
   - **Patch Release & Advisory**: Target within **14 business days** when the issue is confirmed and the remediation scope permits that timeline.

These are repository policy targets, not independently verified historical SLA performance. This
document does not by itself establish mailbox availability, encrypted-mail/PGP support, GitHub
Private Vulnerability Reporting enablement, or guaranteed response/remediation timing.

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

- **Threat Model**: [`Docs/security/threat_model.md`](Docs/security/threat_model.md)
- **Data Handling & Privacy Guide**: [`Docs/security/data_handling.md`](Docs/security/data_handling.md)
- **Licensing & Rights Boundary**: [`LICENSING.md`](LICENSING.md)

# Security Policy for SemantIQ

SemantIQ is **Behavioral Evidence Infrastructure for AI Systems**. Because SemantIQ evaluates
autonomous agents, processes external execution logs, and verifies research claims, security and
integrity are core architectural requirements.

---

## 1. Supported Versions

SemantIQ is currently a **Public Alpha (Experimental)** project.

| Version | Supported | Security patch commitment |
| :--- | :---: | :--- |
| **`0.1.0-alpha.x`** | **YES** | Current Public Alpha line. Critical security fixes are accepted while this line is maintained. |
| Other / unreleased version lines | **NO CURRENT SUPPORT CLAIM** | No current `1.0.x` release or support commitment is established by the repository's canonical version surfaces. |

The current provisional software identity is `0.1.0-alpha.2` (Python distribution
`0.1.0a2`). A future `1.0.x` line must not be treated as released, current, or supported until
a corresponding release and support policy are explicitly established.

---

## 2. Reporting a Vulnerability

We appreciate responsible disclosure. If you discover a security vulnerability in SemantIQ:

1. **Do not open a public issue containing vulnerability details.**
2. The repository currently publishes the following security contact:
   `security@semantiq.org`
3. The published maintainer response targets are:
   - initial acknowledgement: within **48 hours**;
   - triage and assessment: within **5 business days**;
   - patch/advisory coordination target: within **14 business days** when the issue is confirmed and
     the remediation scope permits that timeline.

These are repository policy targets, not independently verified historical SLA performance.

This repository document does not, by itself, establish:
- mailbox availability or delivery monitoring;
- encrypted-mail/PGP support;
- GitHub Private Vulnerability Reporting enablement;
- guaranteed response or remediation timing.

Do not include secrets, credentials, personal data, or exploit material in a public issue while
seeking a private reporting path.

---

## 3. Core Security Controls & Invariants

### 3.1 Local-First & Zero Egress by Default

- The SemantIQ engine, CLI, and HTTP server operate in **local-first mode** (`isOfflineMode: true`).
- Zero telemetry, evaluation traces, or model logs are transmitted to external servers without
  explicit operator authorization.

### 3.2 Secret & Credential Redaction

- Credentials, API tokens, and secret environment variables are handled through
  `CredentialResolutionContext`.
- Sensitive fields in traces, benchmark logs, and execution manifests are redacted
  (`***REDACTED***`) by the repository's implemented redaction paths.
- Security-boundary and credential tests are part of the required CI surface.

These implementation statements do not establish GitHub Secret Scanning or Secret Push Protection
settings; those repository-host settings are documented separately according to available evidence.

### 3.3 Research Bundle & Manifest Cryptographic Sealing

- Research bundles use SHA-256-based integrity verification paths.
- Partner execution manifests are checked against preregistration/integrity inputs where the
  applicable runtime path requires them.
- Rejection or quarantine behavior is an implementation property and must not be interpreted as a
  general security certification of SemantIQ or of evaluated systems.

### 3.4 Input Validation & Path Traversal Prevention

- Repository security tests cover input and path-boundary behavior.
- Schema validation under the product-contract boundary rejects payloads that do not satisfy the
  applicable local contract.

These controls are repository implementation claims, not a claim that all deployment environments
or integrations have been independently penetration-tested.

### 3.5 Network & Server Boundary

- The headless HTTP API is designed for local-first operation.
- Optional external providers or remote execution paths require explicit operator configuration.
- Public Alpha status means deployment-specific network security and production-scale hardening are
  not established globally.

---

## 4. Security Documentation References

- **Repository protection baseline**:
  [`Docs/security/github_repository_protection.md`](Docs/security/github_repository_protection.md)
- **Threat Model**: [`Docs/security/threat_model.md`](Docs/security/threat_model.md)
- **Data Handling & Privacy Guide**: [`Docs/security/data_handling.md`](Docs/security/data_handling.md)
- **Licensing & Rights Boundary**: [`LICENSING.md`](LICENSING.md)

---

## 5. Maturity Boundary

A passing security test, required CI check, or documented local control demonstrates only the scope
that was tested or configured.

It does **not** by itself establish:
- independent third-party security audit;
- production-scale reliability;
- universal deployment safety;
- legal or regulatory certification;
- absence of undiscovered vulnerabilities.

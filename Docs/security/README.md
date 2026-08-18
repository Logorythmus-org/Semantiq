# Security, Privacy & Repository Protection

**Status**: `NORMATIVE`  
**Target Audience**: Security Auditors, System Operators, Contributors  

---

## Overview

SemantIQ enforces a zero-trust, local-first default posture with automated secret redaction, cryptographic Merkle sealing, and repository protection.

---

## Documents in this Section

- 🔒 **[Operational Security Policy](../../SECURITY.md)** (`NORMATIVE`): Vulnerability reporting channel (`security@semantiq.org`), response SLAs, and supported versions.
- 🛡️ **[Threat Model](threat_model.md)** (`NORMATIVE`): STRIDE analysis covering 7 key attack vectors (secret exfiltration, path traversal, tampered bundles, forged provenance).
- 🕵️ **[Data Handling & Privacy Guide](data_handling.md)** (`NORMATIVE`): 5-tier data classification, quarantine protocol, and zero-telemetry boundary.
- 🏰 **[GitHub Repository Protection Baseline](github_repository_protection.md)** (`NORMATIVE`): Branch rulesets, required status checks, Actions token permissions, and Dependabot configuration.

# Security, Privacy & Repository Protection

**Status**: `NORMATIVE INDEX`  
**Target Audience**: Security Auditors, System Operators, Contributors

---

## Overview

SemantIQ is a **Public Alpha (Experimental)** project with a local-first security
posture and a set of tested repository/runtime controls.

This section distinguishes:
- controls directly exercised by current code/tests;
- repository-host controls verified from GitHub;
- architecture intent or broader guarantees that are not yet established.

A security document or passing test is not a certification that every deployment,
integration, provider, or code path is secure.

## Current evidence highlights

Current repository evidence includes:

- tested masking/redaction behavior for several credential and sensitive-log paths;
- configuration-path containment checks under the configured local data root;
- local host binding (`127.0.0.1`) for the SemantIQ HTTP server by default;
- required CI security-boundary checks;
- live GitHub branch/ruleset protection evidence;
- SHA-256/Merkle integrity mechanisms in specific evidence and bundle workflows.

Current evidence does **not** establish a universal zero-egress guarantee, a
complete penetration test, production-scale hardening, or that every path and
integration has been independently security-audited.

## Documents in this Section

- 🔒 **[Operational Security Policy](../../SECURITY.md)** (`NORMATIVE`): supported-version and vulnerability-reporting policy.
- 🛡️ **[Threat Model](threat_model.md)** (`NORMATIVE MODEL`): current threats, implemented mitigations, and known evidence gaps.
- 🕵️ **[Data Handling & Privacy Guide](data_handling.md)** (`NORMATIVE POLICY`): local-first storage, redaction, external-integration, and data-handling boundaries.
- 🏰 **[GitHub Repository Protection Baseline](github_repository_protection.md)** (`NORMATIVE EVIDENCE`): live branch/ruleset claims and controls that remain unverified.
- 📦 **[Legacy preservation payload containment](legacy-preservation-containment.md)** (`AUDIT RECORD`): preserved cleanup/containment record.

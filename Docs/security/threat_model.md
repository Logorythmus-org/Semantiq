# SemantIQ Threat Model

**Status**: `NORMATIVE MODEL`  
**Current maturity**: Public Alpha (Experimental)  
**Scope**: Headless runtime, CLI/HTTP surfaces, evidence workflows, repository-local integrations

---

## 1. Purpose

This threat model records security-relevant risks and the mitigations currently
visible in code, tests, or repository configuration.

A listed mitigation is scoped to the implementation/test path that supports it.
It is not a claim that every deployment or integration is penetration-tested or
free of vulnerabilities.

## 2. Threats and current mitigations

### 2.1 Secret leakage and credential exposure

**Threat**  
Execution traces, diagnostics, errors, logs, fixtures, or exported artifacts may
capture credentials or other sensitive values.

**Current evidence**
- configuration diagnostics mask tested provider-token values;
- `SecretRedactor` redacts registered secret values/custom patterns;
- `CredentialBoundaryValidator` detects several common credential formats;
- security tests verify that selected sensitive values are absent from tested
  logs/events.

**Boundary**  
These tests do not establish a universal guarantee that every unknown credential
format, third-party process, provider SDK, or output artifact can never leak a
secret.

### 2.2 Malicious or malformed input

**Threat**  
Untrusted benchmark, API, dataset, or imported content may attempt parser abuse,
resource exhaustion, injection, or unsafe interpretation.

**Current evidence**
- schema/contract validation exists for defined product contracts;
- question/security tests cover bounded query sizes, malformed structures,
  authorization context, and sanitized failure output in tested API paths.

**Boundary**  
Schema validation is not equivalent to sandboxing arbitrary code or malware
analysis.

### 2.3 Path traversal and filesystem escape

**Threat**  
A crafted path may attempt to read or write outside an intended local directory.

**Current evidence**
- configuration tests verify that configured child paths escaping the configured
  data root are rejected.

**Not established**
- a universal path-traversal proof for every CLI import, archive extraction,
  bundle loader, static-file route, adapter, and external runtime path.

Any public claim should identify the exact path/loader whose containment behavior
was tested.

### 2.4 Tampered evidence or research bundles

**Threat**  
An artifact may be modified after generation or supplied with inconsistent
integrity data.

**Current evidence**
- SHA-256/Merkle-based bundle/evidence integrity mechanisms are implemented in
  specific workflows;
- HTTP/API tests exercise bundle export and verification behavior.

**Boundary**  
Integrity verification does not prove scientific truth, source authorization, or
confidentiality.

### 2.5 Dependency and supply-chain compromise

**Threat**  
A compromised package, action, installer, or upstream dependency may execute
malicious behavior.

**Current evidence**
- pnpm uses a committed lockfile and required CI uses frozen installation;
- the repository has a GitHub dependency-review workflow for pull requests;
- package and dependency updates are managed through repository review.

**Not established by this audit**
- a required recurring `pnpm audit` gate;
- a required recurring `pip-audit` gate;
- complete license/security clearance of every transitive dependency;
- signed provenance for every dependency.

### 2.6 HTTP exposure and CORS

**Threat**  
Exposing the headless HTTP API beyond a trusted local environment may allow
unintended remote access.

**Current implementation**
- `createSemantiqHttpServer` defaults to host `127.0.0.1`;
- the HTTP router currently defaults CORS to **enabled**;
- when enabled, it emits `Access-Control-Allow-Origin: *`.

Therefore the repository must **not** claim that CORS is disabled by default.

Localhost binding reduces default network exposure, but wildcard CORS remains a
configuration/hardening concern if the server is deliberately exposed through a
different bind address, proxy, tunnel, or deployment profile.

SemantIQ Public Alpha is not a production-hardened network service.

### 2.7 Forged provenance and fabricated evidence

**Threat**  
An external submission may contain fabricated traces, altered parameters,
incomplete provenance, or misleading attestations.

**Current evidence**
- external-evidence eligibility and deviation/governance mechanisms exist in the
  repository;
- public claim policy states that attestation alone does not establish verified
  external evidence.

**Boundary**  
These controls are evidence-governance mechanisms, not identity-proofing,
forensic verification, or protection against every form of fabrication.

## 3. Repository-host security

GitHub branch/ruleset and repository-protection evidence is tracked separately in
[`github_repository_protection.md`](github_repository_protection.md).

Do not infer GitHub Secret Scanning, Push Protection, Dependabot security-update
settings, or other account-level controls from local source files unless the
specific setting has been directly verified.

## 4. Deployment responsibility

Operators who expose SemantIQ outside a local test/research environment should
perform deployment-specific hardening, authentication/authorization review,
network controls, secret management, dependency review, logging review, backup
policy, and threat assessment.

The current Public Alpha repository does not provide a universal production
security certification.

# SemantIQ Threat Model

**Milestone**: SemantIQ Behavioral Evidence Infrastructure 1.0.0  
**Scope**: Headless Runtime, CLI, REST API, Evidence Engine, Partner Exchange  

---

## 1. Overview & STRIDE Analysis

This threat model identifies potential attack vectors against SemantIQ, its evaluation pipelines, and research governance mechanisms.

```
       [ External Partner / Attestation ]
                      │ (Unverified Manifests / Tampered Bundles)
                      ▼
[ CLI / HTTP Router ] ──► [ Eligibility Gate ] ──► [ Evidence Graph ]
         │                        │
         ▼                        ▼
[ Trace Mapper Engine ] ──► [ Evaluation Ledger ] (SHA-256 Merkle Chaining)
```

---

## 2. Threat Vectors & Mitigations

### 2.1 Secret Leakage & Credential Exfiltration
- **Threat**: Evaluation traces or error logs accidentally capture API keys, tokens, or private environment variables passed to tested agents.
- **Impact**: Compromise of cloud providers, proprietary model endpoints, or benchmark databases.
- **Mitigation**:
  - `CredentialResolutionContext` redacts all secrets at the ingestion boundary.
  - Test run ledgers and `ResearchBundle` exports scrub environment blocks.
  - Zero default external telemetry egress.

### 2.2 Malicious Files & Benchmark Payload Injection
- **Threat**: An attacker submits a benchmark case or dataset containing code injection, prompt injection, or malicious payload strings designed to exploit parsers.
- **Impact**: Arbitrary code execution or parser crashes during benchmark runs.
- **Mitigation**:
  - Strict JSON schema validation (`packages/sandbox-contracts`) on all inputs before deserialization.
  - Offline deterministic runner isolates evaluation processes without executing untrusted external script snippets.

### 2.3 Path Traversal Attacks (`..` Directory Traversal)
- **Threat**: Attacker crafts bundle artifact relative paths (e.g. `../../etc/passwd` or `..\..\Windows\System32`) in manifest or bundle tarballs.
- **Impact**: Unauthorized file reading, arbitrary file overwrite, or local privilege escalation.
- **Mitigation**:
  - Strict path resolution checks ensuring all extracted files remain within the designated temporary or sandbox directory.
  - Rejection of paths containing `..`, absolute root prefixes, or illegal path characters.

### 2.4 Tampered Research Bundles & Hash Mismatches
- **Threat**: An adversary alters evaluation results or claims within a published `.bundle.json` without updating the cryptographic proof.
- **Impact**: Compromised scientific integrity and false claim acceptance.
- **Mitigation**:
  - `ResearchBundleVerifier` computes canonical SHA-256 hashes of every individual run, evaluation, and claim artifact.
  - Merkle tree root hash verification detects single-bit tampering and causes immediate verification failure (`verified: false`).

### 2.5 Dependency Compromise & Supply-Chain Poisoning
- **Threat**: Malicious dependency injected into npm or PyPI transitive packages.
- **Impact**: Remote code execution or data exfiltration during CI/CD or local test execution.
- **Mitigation**:
  - Strict dependency minimization (core engine and contracts have zero non-essential runtime dependencies).
  - Lockfile integrity enforced via `pnpm-lock.yaml` with frozen installs in CI.
  - Regular automated vulnerability scanning (`pnpm audit`, `pip-audit`).

### 2.6 Unsafe HTTP Exposure & CORS Misconfiguration
- **Threat**: SemantIQ HTTP server exposed to public network interfaces without authentication or with overly permissive CORS headers.
- **Impact**: Unauthorized remote trigger of benchmark runs, claim modifications, or bundle generation.
- **Mitigation**:
  - Default host binding strictly locked to `127.0.0.1`.
  - Configurable CORS policy (`enableCors: false` by default for production profiles).
  - Pure headless REST posture when UI static directory is omitted.

### 2.7 Forged Provenance, Fabricated Traces & Manifest Manipulation
- **Threat**: An external partner attempts to promote evidence by fabricating execution traces, modifying sample counts, or submitting synthetic runs as observed physical runs.
- **Impact**: Evidence Graph corruption and unjustified E-level promotion.
- **Mitigation**:
  - External Evidence Eligibility Gate enforces deterministic verification against frozen preregistrations.
  - Invariant: *No attestation alone promotes evidence*.
  - Strict separation of `EpistemicNature.OBSERVED` vs `INFERRED` tags.
  - Material deviations automatically cap evidence promotion (`CAP_E2_LOCAL_CONSISTENT`).

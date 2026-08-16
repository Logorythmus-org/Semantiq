# SemantIQ Sandbox Specification: Credential and Secret Boundary

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 23)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

Benchmarks and autonomous agent evaluations frequently require interactions with external services, tools, databases, and APIs. These operations require secrets (e.g. API keys, git authentication tokens, certificate bundles, cloud credentials).

If SemantIQ Core stores, persists, logs, or directly manages raw secret keys, it introduces severe security vulnerabilities, compromises third-party reproducibility, and creates vendor lock-in.

This specification establishes a **Zero-Secret Core Architecture**:
1. **SemantIQ Core** declares *Secret Requirements* and *Redaction Rules* as abstract metadata. It never stores plaintext secrets.
2. **Provider Adapters / Orchestrators** resolve secrets from secure external storage (environment variables, vault, or ephemeral synthetic mock issuers) and inject them directly into isolated execution runtimes (via tmpfs files, env vars, or pipes).
3. **Evidence & Normalization Subsystems** redact all stdout, stderr, process arguments, network logs, and state deltas using multi-pattern secret redactors before generating cryptographic evidence manifests.

---

## 2. Scope

- Definition of provider-neutral secret injection contracts.
- Declaration formats for required benchmark credentials (`SecretRequirement`).
- Lifecycle management of ephemeral and environment-backed secrets.
- Automatic redaction of secrets in streams, logs, filesystem diffs, and evidence records.
- Provenance recording without revealing plaintext secret material.
- Failure handling when credentials are missing, expired, or invalid.

---

## 3. Non-Goals

- Building an internal Secret Manager or Key Vault inside SemantIQ Core.
- Storing or persisting plaintext API keys or certificates in the repository, database, or benchmark packages.
- Bypassing sandbox network or filesystem isolation policies for credential validation.
- Replacing external identity and key management systems (e.g. HashiCorp Vault, AWS KMS, 1Password, local env).

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                                  SemantIQ Core                                    |
|  [Benchmark Suite]                                                                |
|         |                                                                         |
|         v                                                                         |
|  [EnvironmentSpec with SecretRequirements]                                        |
|         | (Abstract References, Target Names, Redaction Patterns)                 |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Router & Provider Adapter Layer                            |
|  [ICredentialResolver]                                                            |
|         | (Resolves from Env / Vault / Synthetic Mock)                            |
|         v                                                                         |
|  [Injection into Isolated Runtime: tmpfs / env / pipe]                            |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                       Isolated Execution Runtime (Sandbox)                        |
|  [Isolated Container / MicroVM / Process]                                         |
|         |                                                                         |
|         v (Raw Output, Process Diffs, Exit Code)                                  |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                      Evidence Normalizer & Secret Redactor                        |
|  [SecretRedactor] (Applies dynamic mask: [REDACTED_SECRET:KEY])                   |
|  [CredentialBoundaryValidator] (Verifies zero raw secret leakage)                 |
|         |                                                                         |
|         v                                                                         |
|  [Sanitized StateDelta & Sealed Evidence Manifest]                                |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Secret Requirement
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SecretRequirement",
  "type": "object",
  "required": ["secretKey", "targetName", "injectionTarget", "source", "isOptional", "isSyntheticMockAllowed", "description"],
  "properties": {
    "secretKey": { "type": "string" },
    "targetName": { "type": "string" },
    "injectionTarget": { "type": "string", "enum": ["env", "tmpfs_file", "stdin_pipe"] },
    "source": { "type": "string", "enum": ["env_var", "file_mount", "vault_ref", "ephemeral_token", "synthetic_mock"] },
    "sourcePathOrEnv": { "type": "string" },
    "isOptional": { "type": "boolean" },
    "isSyntheticMockAllowed": { "type": "boolean" },
    "redactionPattern": { "type": "string" },
    "description": { "type": "string" }
  }
}
```

---

## 6. Interfaces

- `ICredentialResolver`: Resolves a required secret from local environment or mock provider.
- `SecretRedactor`: Redacts registered secret values and regex patterns from text and logs.
- `CredentialBoundaryValidator`: Audits text payloads to ensure zero secret leakage.

---

## 7. Lifecycle & State Machine

```
[DECLARED] ──> [RESOLVING] ──> [INJECTED] ──> [EXECUTING] ──> [REDACTING] ──> [PURGED]
      |              |
      v              v
 [SKIPPED]      [FAILED_AUTH]
```

1. **DECLARED**: Benchmark declares `SecretRequirement` metadata.
2. **RESOLVING**: Adapter queries `ICredentialResolver`.
3. **INJECTED**: Secret is passed to runtime via secure tmpfs mount or environment variable.
4. **EXECUTING**: Task executes inside isolated boundary.
5. **REDACTING**: `SecretRedactor` filters all standard streams and delta diffs.
6. **PURGED**: Runtime terminates; tmpfs and ephemeral memory are zeroed.

---

## 8. Security Model

- **Zero-Storage Principle**: SemantIQ Core never saves plaintext secrets in databases, configuration files, or test evidence.
- **Dynamic Redaction**: Any secret injected into a sandbox is automatically registered with `SecretRedactor`.
- **Pre-Publication Audit**: `CredentialBoundaryValidator` scans all evidence artifacts for regex signatures (e.g. `ghp_`, `sk-`, RSA headers).

---

## 9. Reproducibility Model

- **Synthetic Mock Fallback**: Benchmarks declare whether synthetic mock credentials can satisfy evaluation criteria.
- **Masked Provenance Hashes**: Provenance manifests record `valueMaskedSha256` (HMAC/SHA256 of the token) to prove identical credential configuration across runs without revealing the secret value.

---

## 10. Behavioral Chain Compatibility

| Chain Step | Role in Credential Handling |
| :--- | :--- |
| **Context** | Injected credential requirements declared in benchmark spec. |
| **Interpretation** | Agent detects authorized tools and endpoints. |
| **Decision** | Agent chooses whether to invoke authenticated action. |
| **Action** | Command executed in sandbox with isolated credentials. |
| **Result** | Sandbox returns execution output and state diffs. |
| **Consequence** | Redactor cleanses output; Evidence Normalizer seals proof. |
| **Recovery** | Invalid credentials trigger `FAILED_AUTH` with safe retry path. |

---

## 11. Provider-Neutral Design

Adapters for Docker/OCI, MicroVMs, OpenSandbox, or remote replay runtimes implement the same `SecretInjectionTarget` mappings:
- `env`: Injected into container/VM environment map.
- `tmpfs_file`: Written to in-memory temporary filesystem mounted at `/run/secrets/<targetName>`.
- `stdin_pipe`: Piped via secure stdin stream during initialization.

---

## 12. Failure Modes & Mitigations

1. **Missing Mandatory Secret**: Adapter halts execution before sandbox provisioning with clear diagnostic error `ERR_MISSING_CREDENTIAL`.
2. **Secret Leakage in Error Output**: `SecretRedactor` intercepts stack traces, stderr, and exception messages prior to logging.
3. **Expired Ephemeral Token**: Adapter reports `ERR_CREDENTIAL_EXPIRED` without storing token.

---

## 13. Acceptance Criteria

- [x] Zero raw secrets stored in SemantIQ Core packages or evidence manifests.
- [x] Full automated redaction of registered secrets from stdout/stderr streams.
- [x] Provenance manifests record masked SHA-256 fingerprints.
- [x] Unit tests pass across redactor, boundary validator, and schema definitions.

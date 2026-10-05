# SemantIQ Data Handling & Privacy Policy

**Status**: `NORMATIVE POLICY`  
**Current maturity**: Public Alpha (Experimental)

---

## 1. Scope and evidence boundary

This document describes intended handling rules and the controls currently visible
in the repository. It does not establish that every integration, deployment, or
external provider has been independently privacy- or security-audited.

## 2. Data categories

| Category | Typical examples | Current handling boundary |
| --- | --- | --- |
| Public/synthetic project material | benchmark fixtures, public examples, schemas | May be stored in the repository or local artifacts subject to file-specific licensing/provenance rules. |
| Evaluation artifacts | traces, metrics, comparison outputs, research bundles | Primarily local/project-controlled storage paths in the current source-checkout workflows. |
| Governed claims and review records | claim drafts, review decisions, evidence references | Stored by the active local/application persistence path used by the selected workflow. |
| External submissions | execution manifests, imported artifacts, replication material | Must be treated as untrusted until the applicable validation/eligibility checks complete. |
| Credentials/secrets | API keys, tokens, passwords | Current tests verify masking/redaction in several configuration, diagnostic, and credential-boundary paths. Universal non-persistence across every integration is not established. |

A category label is a policy aid, not a guarantee that every file has been
correctly classified.

## 3. Local-first storage

Current SemantIQ workflows are designed around local/source-checkout execution and
local artifact paths by default.

Configuration code:
- uses a local data root and child directories;
- rejects configured child paths that escape the configured data root in the
  tested configuration path;
- keeps optional AI/provider integrations disabled unless explicitly configured
  in the tested default settings path.

External providers, remote APIs, databases, container runtimes, or networked
services may introduce additional data flows when an operator explicitly enables
or configures them.

## 4. Telemetry and network boundary

SemantIQ does not require a mandatory hosted telemetry service for its core
source-checkout workflows.

[`Docs/TELEMETRY_POLICY.md`](../TELEMETRY_POLICY.md) states that telemetry is off
by default.

This repository audit does **not** establish the stronger universal claim that
every default execution path produces zero external network requests. Network
behavior depends on the selected command, runtime, provider, database, container
engine, and operator configuration.

## 5. Secrets and redaction

Current tests establish bounded controls including:

- configuration diagnostics that do not print tested provider-token values;
- `SecretRedactor` replacement of registered secret values and custom patterns;
- `CredentialBoundaryValidator` detection of several known secret formats;
- security tests that keep selected sensitive request content and idempotency
  values out of tested logs/events.

These controls reduce exposure risk but do not prove that every possible secret,
format, third-party library, external process, or integration path can never
persist or emit a credential.

Operators should continue to:
- use least-privilege credentials;
- avoid embedding secrets in benchmark fixtures or public artifacts;
- review generated artifacts/logs before sharing them;
- rotate credentials if exposure is suspected.

## 6. Integrity mechanisms

SHA-256 and Merkle-based integrity mechanisms are implemented in specific
research-bundle/evidence paths.

Integrity verification can detect certain modifications to the protected
artifact structure. It does not establish truth, authorization, confidentiality,
or universal immutability of every file written by SemantIQ.

## 7. External submissions

Where external evidence/manifest eligibility gates are used, imported material
remains untrusted until the applicable validation, provenance, and deviation
checks complete.

A `quarantined`, `rejected`, or `eligible` state is a repository/application
decision within that workflow; it is not a malware scan, legal clearance, or
general security certification.

## 8. Retention and deletion

The current local-first architecture gives operators direct access to local
artifact and data locations used by their selected workflow.

The repository does not currently establish a universal retention/deletion
guarantee across every database, provider, external runtime, backup, or imported
integration.

Deployment-specific retention, backup, deletion, and regulatory requirements
remain operator responsibilities unless a narrower implementation contract
explicitly provides them.

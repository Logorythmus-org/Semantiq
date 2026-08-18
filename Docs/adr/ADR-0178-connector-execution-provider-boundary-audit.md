# ADR-0178: Connector and Execution Provider Boundary Audit (Prompt 05)

## Status
Accepted

## Context
SemantIQ Core evaluates agent behavior objectively across multiple execution providers. To ensure long-term sustainability, legal compliance, and benchmark integrity, external execution runtimes must never leak proprietary interfaces, copyleft constraints, or unredacted secrets into the evaluation core.

## Decision
1. **Interface Boundaries Enforced**:
   - All external execution runtimes interface through `ISandboxAdapter` using JSON-serializable payloads over standard IPC/RPC transports.
2. **Credential Redaction Across Boundaries**:
   - `CredentialBoundaryValidator` strips sensitive tokens (`ghp_`, `sk-`, Bearer auth, RSA keys) from observation streams before telemetry enters the evaluation engine.
3. **Failure Isolation**:
   - `ProviderFallbackEngine` intercepts infrastructure crashes and network errors, mapping them to `INFRASTRUCTURE_FAILURE` and preventing distortion of agent behavioral scores.
4. **Behavioral Grounding**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Evaluation is strictly grounded in observable external actions and environment state transitions.

## Consequences
- SemantIQ Core remains decoupled, secure, and vendor-neutral.
- Adapters can be developed independently without modifying core code.
- Verdict: `PASS`.

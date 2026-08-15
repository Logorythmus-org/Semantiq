# SemantIQ Sandbox Specification: Security Boundary

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 21)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

Autonomous AI agents executing arbitrary benchmark tasks (installing third-party packages, running untrusted shell scripts, compiling C/Rust code, invoking system tools, browsing web pages) pose critical security risks.

This specification establishes the **6-Layer Security Boundary Architecture**:
1. **Agent ↔ Sandbox Boundary**: Unprivileged user execution, read-only root filesystems, dropped Linux capabilities, and syscall filtering (seccomp).
2. **Sandbox ↔ Host Boundary**: Hypervisor/kernel namespace isolation (MicroVMs / cgroups v2 / user namespaces), zero host bind mounts, and no access to host docker sockets.
3. **Sandbox ↔ Network / External Services Boundary**: Strict `NetworkMode` (`none`, `isolated_bridge`, `whitelisted_egress`), DNS sinkholing, and automated cloud metadata endpoint blocking (`169.254.169.254`).
4. **Agent ↔ Tool Boundary**: Schema-validated JSON-RPC and structured pipes with permission auditing.
5. **Sandbox ↔ Provider Boundary**: External control plane management; guest cannot inspect or access provider control sockets or cloud credentials.
6. **Provider ↔ SemantIQ Core Boundary**: Tamper-evident evidence normalization, cryptographic manifest sealing, and containment auditing.

```
Benchmark Spec ──> Security Boundary Enforcer ──> Isolated Runtime ──> Containment Audit Report ──> Evidence Manifest
```

---

## 2. Scope

- Definition of isolation policies across all 6 architectural boundaries.
- Runtime violation detection (`SecurityViolationEvent`) for host escapes, metadata probing, and unauthorized network egress.
- Containment reporting and automated emergency quarantine protocols (`SecurityContainmentReport`).
- Dropped Linux capabilities, seccomp filters, and cgroups v2 resource bounds.

---

## 3. Non-Goals

- Permitting unconstrained root access to the host workstation or evaluation server.
- Relying on trust or safety self-attestations from evaluating LLMs.
- Weakening isolation boundaries for performance shortcuts.

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                                  SemantIQ Core                                    |
|  [Benchmark Definition] ──> [SecurityBoundaryPolicy]                              |
+------------------------------------------|----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        Router & Provider Adapter Layer                            |
|  [SecurityBoundaryEnforcer]                                                       |
|         | (Applies seccomp, drops CAPs, configures egress proxies)                |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                       Isolated Execution Runtime (Sandbox)                        |
|   +---------------------------------------------------------------------------+   |
|   | [Boundary 1: Agent ↔ Sandbox] (uid=1000, read-only root, tmpfs /workspace)|   |
|   | [Boundary 2: Sandbox ↔ Host] (User namespaces, zero host bind mounts)     |   |
|   | [Boundary 3: Sandbox ↔ Network] (Egress whitelist, metadata blocked)      |   |
|   | [Boundary 4: Agent ↔ Tools] (Schema-validated JSON-RPC)                   |   |
|   | [Boundary 5: Sandbox ↔ Provider] (External control plane)                 |   |
|   +---------------------------------------------------------------------------+   |
+------------------------------------------|----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        Evidence & Containment Normalizer                          |
|  [Audits Syscalls, Network Logs, and State Deltas]                                |
|  [Emits SecurityContainmentReport; Triggers Quarantine on Breach Attempt]         |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Security Boundary Policy Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "SecurityBoundaryPolicy",
  "type": "object",
  "required": [
    "networkMode",
    "blockedCidrRanges",
    "whitelistedHosts",
    "readOnlyRootFilesystem",
    "dropCapabilities",
    "allowHostBindMounts",
    "maxProcesses",
    "blockCloudMetadata"
  ],
  "properties": {
    "networkMode": { "type": "string", "enum": ["none", "isolated_bridge", "whitelisted_egress", "full"] },
    "blockedCidrRanges": { "type": "array", "items": { "type": "string" } },
    "whitelistedHosts": { "type": "array", "items": { "type": "string" } },
    "readOnlyRootFilesystem": { "type": "boolean" },
    "dropCapabilities": { "type": "array", "items": { "type": "string" } },
    "allowHostBindMounts": { "type": "boolean" },
    "maxProcesses": { "type": "integer" },
    "blockCloudMetadata": { "type": "boolean" }
  }
}
```

---

## 6. Interfaces

- `SecurityBoundaryEnforcer`: Inspects execution paths, network requests, and syscalls to detect violations.
- `SecurityViolationEvent`: Captures boundary, severity, target resource, and description of violation attempts.
- `SecurityContainmentReport`: Structured summary of containment status and quarantine decisions.

---

## 7. Lifecycle & State Machine

```
[CONFINED] ──(Execution)──> [MONITORING] ──(Violation Detected)──> [QUARANTINED]
    |                              |
    v                              v
[CLEAN_EXIT]                [EVIDENCE_SEALED]
```

1. **CONFINED**: Sandbox initialized with dropped capabilities and read-only mounts.
2. **MONITORING**: Enforcer checks in-flight syscalls, paths, and outbound packets.
3. **QUARANTINED**: Any high/critical breach (e.g. host escape, metadata probe) instantly isolates the sandbox.
4. **EVIDENCE_SEALED**: Violation logs captured into immutable evaluation evidence.

---

## 8. Security Model (The 6 Boundaries)

| Boundary | Containment Mechanism | Enforcement Target |
| :--- | :--- | :--- |
| **Agent ↔ Sandbox** | `unprivilegedUser`, read-only root, tmpfs workspace. | Prevents root privilege escalation. |
| **Sandbox ↔ Host** | Hypervisor / user namespace isolation, no docker socket mounts. | Prevents host escape and node takeover. |
| **Sandbox ↔ Network** | Egress whitelist, metadata firewall (`169.254.169.254/32` blocked). | Prevents data exfiltration and SSRF. |
| **Agent ↔ Tools** | JSON-RPC schema validation, permission scoping. | Prevents arbitrary command injection. |
| **Sandbox ↔ Provider** | Out-of-band lifecycle control. | Prevents tampering with provider daemon. |
| **Provider ↔ SemantIQ** | Cryptographic evidence signing and TCK verification. | Prevents forged benchmark scores. |

---

## 9. Reproducibility & Provenance

- **Deterministic Security Context**: Security policies are declared explicitly in `EnvironmentSpec`, ensuring benchmarks run under identical security constraints across all test runs.

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Security Boundary Role |
| :--- | :--- |
| **Context** | Security permissions and read-only filesystem limits presented to agent. |
| **Interpretation** | Agent interprets authorized tools and accessible paths. |
| **Decision** | Agent chooses action within permissible boundaries. |
| **Action** | Action dispatched inside unprivileged container environment. |
| **Result** | Sandbox executes command; unauthorized operations blocked by kernel. |
| **Consequence** | `SecurityBoundaryEnforcer` audits output for breach attempts. |
| **Recovery** | Policy violations trigger containment logs and isolate instance. |

---

## 11. Provider-Neutral Design

Whether running on local Docker, Firecracker microVMs, Kata Containers, or cloud providers, the 6 security boundaries are enforced consistently via provider adapters.

---

## 12. Failure Modes & Mitigations

1. **Host Escape Attempt**: Instantly blocked by container hypervisor/namespaces and flagged as `CRITICAL_BREACH`.
2. **Cloud Metadata Probing**: Network firewall drops packet and triggers `CRITICAL_BREACH` quarantine.
3. **Fork Bomb / CPU Exhaustion**: Enforced by `maxProcesses` and cgroups CPU quotas.

---

## 13. Acceptance Criteria

- [x] Comprehensive 6-layer security boundary model.
- [x] Automated detection of metadata probing, host filesystem traversal, and unauthorized network calls.
- [x] Instant quarantine protocol on critical containment breaches.
- [x] Complete unit tests passing with zero typecheck or boundary errors.

# SemantIQ Sandbox Specification: Multi-Agent Sandbox

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 26)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

Benchmarking multi-agent systems (collaborative software engineering, autonomous security red-teaming, decentralized planning, multi-agent negotiation, and adversarial simulation) requires orchestrating multiple distinct agent instances interacting within shared or partitioned sandboxes.

This specification defines **Provider-Neutral Multi-Agent Execution Contracts**:
1. **SemantIQ Core** declares declarative topologies (`MultiAgentTopologySpec`), participant roles (`AgentParticipantSpec`), shared resource mounts (`SharedResourceSpec`), and communication boundaries (`CommunicationPolicy`).
2. **Provider Adapters** provision and interconnect the physical execution boundaries (multi-container bridge networks, shared volume mounts, or isolated microVM networks).
3. **Causal Evidence Normalization** assigns monotonic causal sequence numbers and strict action attributions (`actorId`, `actorRole`, `action`, `target`) to all inter-agent messages and state mutations.

```
Benchmark → Multi-Agent Topology Contract → Router → Provider Adapter → Multi-Agent Runtime → Evidence → SemantIQ
```

---

## 2. Scope

- Declarative specifications for multi-agent network topologies and shared workspace volumes.
- Role-based participant declarations with granular capability and isolation tiers (`shared_process`, `isolated_container`, `isolated_microvm`).
- Inter-agent message dispatch and observation protocols (`AgentMessage`).
- Unambiguous action attribution (`AttributedExecutionRequest`, `AttributedMutationEvent`) for shared filesystem and network state deltas.
- Causal tracking and event ordering for deterministic replay.

---

## 3. Non-Goals

- Implementing a monolithic multi-agent framework inside SemantIQ Core.
- Mandating a specific agent orchestrator (e.g. AutoGen, CrewAI, LangGraph).
- Permitting un-monitored covert channels or side-channel communication between sandboxed agents.

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                                  SemantIQ Core                                    |
|  [Multi-Agent Benchmark Definition]                                               |
|         |                                                                         |
|         v                                                                         |
|  [MultiAgentTopologySpec: Participants, Roles, Shared Resources, Policies]        |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Router & Provider Adapter Layer                            |
|  [IMultiAgentSandboxSession]                                                      |
|         | (Provisions Agent A, Agent B, Shared Volume, and Isolated Network)      |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                       Isolated Execution Runtime (Sandbox)                        |
|  +------------------------+  (Message Bus / Pipe)  +------------------------+     |
|  |  [Agent A: Container]  | <────────────────────> |  [Agent B: Container]  |     |
|  +------------------------+                        +------------------------+     |
|               \                                                 /                 |
|                \──> [Shared Volume: /workspace/shared] <──────/                  |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Evidence & Causal Normalizer                               |
|  [MultiAgentCausalTracker] (Assigns Monotonic Sequence Numbers & Validates ACL)   |
|  [Attributed StateDelta Engine] (Binds Every Mutation to Specific Actor & Role)   |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 Multi-Agent Topology Specification
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "MultiAgentTopologySpec",
  "type": "object",
  "required": ["topologyId", "participants", "sharedResources", "communicationPolicies", "maxExecutionDurationSeconds"],
  "properties": {
    "topologyId": { "type": "string" },
    "participants": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["agentId", "role", "isolationLevel", "permissions"],
        "properties": {
          "agentId": { "type": "string" },
          "role": { "type": "string" },
          "isolationLevel": { "type": "string", "enum": ["shared_process", "isolated_container", "isolated_microvm"] },
          "permissions": { "type": "array", "items": { "type": "string" } },
          "environmentOverrides": { "type": "object", "additionalProperties": { "type": "string" } }
        }
      }
    },
    "sharedResources": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["resourceId", "resourceType", "accessMode", "accessibleByAgentIds"],
        "properties": {
          "resourceId": { "type": "string" },
          "resourceType": { "type": "string", "enum": ["shared_filesystem", "message_bus", "shared_memory", "database"] },
          "mountPath": { "type": "string" },
          "accessMode": { "type": "string", "enum": ["read_write", "read_only"] },
          "accessibleByAgentIds": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "communicationPolicies": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["fromAgentId", "toAgentId", "isAllowed", "isMonitored"],
        "properties": {
          "fromAgentId": { "type": "string" },
          "toAgentId": { "type": "string" },
          "isAllowed": { "type": "boolean" },
          "isMonitored": { "type": "boolean" }
        }
      }
    },
    "maxExecutionDurationSeconds": { "type": "integer" }
  }
}
```

---

## 6. Interfaces

- `IMultiAgentSandboxSession`: Coordinates multi-agent execution, message exchange, and session lifecycle.
- `MultiAgentCausalTracker`: Enforces ACL communication policies and tags events with monotonic sequence numbers.

---

## 7. Lifecycle & State Machine

```
[TOPOLOGY_CONFIGURED] ──> [PROVISIONING_AGENTS] ──> [MESH_READY] ──> [COLLABORATING] ──> [TEARDOWN]
          |                         |                                      |
          v                         v                                      v
      [SKIPPED]              [NETWORK_FAILED]                       [DEADLOCK_TIMEOUT]
```

1. **TOPOLOGY_CONFIGURED**: Topology and communication matrix declared.
2. **PROVISIONING_AGENTS**: Participant containers/VMs and shared volumes created.
3. **MESH_READY**: Internal communication routes and message buses initialized.
4. **COLLABORATING**: Agents execute attributed actions and exchange structured messages.
5. **TEARDOWN**: All participant instances terminated and shared state deltas sealed.

---

## 8. Security & Isolation Model

- **Policy-Enforced Communication**: Communication pairs not explicitly listed as `isAllowed: true` in `communicationPolicies` are blocked by packet filters.
- **Resource Segmentation**: Read-only shared volumes prevent unauthorized mutations by junior or untrusted worker agents.
- **Attribution Auditing**: Every command executed inside any container is bound to the requesting `actorId`.

---

## 9. Reproducibility & Provenance

- **Causal Sequence Ordering**: Sequential numbers eliminate non-deterministic race condition discrepancies during trace analysis.
- **Replay Transport**: Inter-agent messages are captured in full and replayable through synthetic mock providers.

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Multi-Agent Role |
| :--- | :--- |
| **Context** | Team roles, shared files, and communication channels declared. |
| **Interpretation** | Agent inspects role responsibilities and incoming messages. |
| **Decision** | Agent decides whether to delegate, write to shared volume, or reply. |
| **Action** | Action dispatched with `actorId` and `actorRole` attribution tags. |
| **Result** | Sandbox updates shared state or delivers message to peer. |
| **Consequence** | `MultiAgentCausalTracker` records sequence number and state delta. |
| **Recovery** | Deadlock or unhandled message triggers timeout recovery or role re-assignment. |

---

## 11. Provider-Neutral Design

Adapters map `MultiAgentTopologySpec` to Docker Compose, Kubernetes Pod meshes, Kata Containers, or in-process mock harnesses without changing benchmark logic.

---

## 12. Failure Modes & Mitigations

1. **Inter-Agent Deadlock**: Global `maxExecutionDurationSeconds` prevents infinite waiting loops.
2. **Unauthorized Message Injection**: Blocked at adapter level by checking `MultiAgentCausalTracker.isCommunicationAllowed`.
3. **Concurrent Mutation Collision**: File diffs track microsecond timestamps and causal sequence numbers.

---

## 13. Acceptance Criteria

- [x] Standardized `MultiAgentTopologySpec` and `AgentParticipantSpec` interfaces.
- [x] Accurate communication policy enforcement and action attribution.
- [x] Monotonic causal event sequencing across multi-agent sessions.
- [x] Comprehensive test coverage with zero boundary or typecheck errors.

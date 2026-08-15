# SemantIQ Sandbox Specification: MCP Provider Integration

**Version**: 1.0.0  
**Phase**: Sandbox Phase (Prompt 24)  
**Status**: Approved Specification  
**Date**: 2026-08-15  

---

## 1. Executive Summary

The Model Context Protocol (MCP) defines an open JSON-RPC standard for AI agents to query contextual tools, resources, and prompts. In benchmark evaluations, agents interact with MCP servers across diverse runtime topologies (in-container stdio, host-bridged SSE, or mocked transports).

This specification defines **Provider-Neutral MCP Integration**:
1. **SemantIQ Core** declares declarative `McpServerSpec` and `McpToolDefinition` contracts in `EnvironmentSpec` and normalizes observations.
2. **Provider Adapters** manage the process lifecycle and communication transports (stdio, loopback SSE/HTTP, or synthetic mock) inside the sandbox.
3. **Observation & Evidence Layer** intercepts tool invocations, computing argument hashes, capturing duration, verifying response schemas, and linking tool actions directly to filesystem and network state deltas.

```
Benchmark → Execution Contract → Router → Provider Adapter → Runtime (MCP Server) → Evidence → SemantIQ
```

---

## 2. Scope

- Declarative contracts for MCP servers (`McpServerSpec`) and tools (`McpToolDefinition`).
- Standardized tool call requests (`McpToolCallRequest`) and responses (`McpToolCallResult`).
- Normalization of MCP events into `McpObservationEvent` records for evidence generation.
- Observation of stdio, SSE, and synthetic mock transports across OCI, MicroVM, and remote runtimes.
- Verification of tool permissions and sandboxed isolation boundaries.

---

## 3. Non-Goals

- Implementing a custom or proprietary alternative to the Model Context Protocol.
- Mandating a single specific MCP SDK or transport implementation.
- Exposing un-sandboxed host tools directly to untrusted benchmark agents.
- Persisting un-redacted tool arguments containing secrets.

---

## 4. Architecture

```
+-----------------------------------------------------------------------------------+
|                                  SemantIQ Core                                    |
|  [Benchmark Definition]                                                           |
|         |                                                                         |
|         v                                                                         |
|  [EnvironmentSpec with McpServerSpecs]                                            |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Router & Provider Adapter Layer                            |
|  [IMcpCapabilityProvider]                                                         |
|         | (Negotiates stdio / sse / synthetic mock transport)                     |
|         v                                                                         |
|  [Spawns MCP Server Process inside Sandbox Boundary]                              |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                       Isolated Execution Runtime (Sandbox)                        |
|  [Agent Process] <──JSON-RPC (stdio/sse)──> [Sandboxed MCP Tool Server]          |
|         |                                                                         |
|         v (Emits Tool Call Request & Tool Call Response)                          |
+---------|-------------------------------------------------------------------------+
          |
          v
+-----------------------------------------------------------------------------------+
|                        Evidence & Observation Normalizer                          |
|  [McpCallNormalizer] (Generates McpObservationEvent with arguments SHA256)        |
|  [StateDelta Correlator] (Links MCP action to filesystem & process mutations)      |
+-----------------------------------------------------------------------------------+
```

---

## 5. Data & Event Schemas

### 5.1 MCP Server Specification
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "McpServerSpec",
  "type": "object",
  "required": ["serverName", "transport", "isSandboxed"],
  "properties": {
    "serverName": { "type": "string" },
    "transport": { "type": "string", "enum": ["stdio", "sse", "http_jsonrpc", "synthetic_mock"] },
    "command": { "type": "string" },
    "args": { "type": "array", "items": { "type": "string" } },
    "url": { "type": "string" },
    "environment": { "type": "object", "additionalProperties": { "type": "string" } },
    "isSandboxed": { "type": "boolean" }
  }
}
```

---

## 6. Interfaces

- `IMcpCapabilityProvider`: Defines tool discovery (`listMcpTools`) and tool dispatch (`invokeMcpTool`).
- `McpCallNormalizer`: Creates reproducible, sanitized observation events from raw JSON-RPC payloads.

---

## 7. Lifecycle & State Machine

```
[SPECIFIED] ──> [INITIALIZING] ──> [READY] ──> [INVOKING] ──> [NORMALIZING] ──> [TERMINATED]
      |               |                             |
      v               v                             v
  [SKIPPED]     [SPAWN_FAILED]                [TOOL_TIMEOUT]
```

1. **SPECIFIED**: Benchmark environment declares required MCP servers.
2. **INITIALIZING**: Adapter spawns MCP server process inside sandbox or connects to mock endpoint.
3. **READY**: Server responds to `tools/list` handshake.
4. **INVOKING**: Agent dispatches `tools/call`.
5. **NORMALIZING**: `McpCallNormalizer` records duration, status, and arguments fingerprint.
6. **TERMINATED**: Server process gracefully shuts down with sandbox teardown.

---

## 8. Security Model

- **Sandboxed Execution**: MCP server processes run inside the same resource-constrained sandbox container or microVM as the agent, preventing host escape.
- **Permission Scoping**: Tools declare required permissions; unauthorized system calls are blocked by seccomp/apparmor.
- **Redaction Integration**: Any arguments matching `SecretRequirement` patterns are filtered before inclusion in `McpObservationEvent`.

---

## 9. Reproducibility & Provenance

- **Deterministic Tool Mocking**: In `HERMETIC_DETERMINISTIC` mode, external network-dependent MCP tools are replaced by replay mocks (`synthetic_mock`).
- **Cryptographic Provenance**: `argumentsSha256` ensures identical input arguments are recorded without inflating trace logs with redundant data.

---

## 10. Behavioral Chain Compatibility

| Behavioral Chain Stage | Role in MCP Integration |
| :--- | :--- |
| **Context** | MCP tool schemas discovered via `tools/list`. |
| **Interpretation** | Agent inspects tool documentation and input parameters. |
| **Decision** | Agent decides which MCP tool to call with specific arguments. |
| **Action** | JSON-RPC `tools/call` dispatched across sandbox transport. |
| **Result** | MCP server returns content payloads and execution status. |
| **Consequence** | Filesystem mutations tied to `associatedStateDeltaId`. |
| **Recovery** | `isError: true` triggers agent retry or fallback behavior. |

---

## 11. Provider-Neutral Design

Whether running on local Docker containers, Kata Containers, firecracker microVMs, or remote harnesses, adapters map the standard MCP transports:
- `stdio`: Intercepted via standard process stdin/stdout streams.
- `sse` / `http_jsonrpc`: Bound to local container loopback interface `127.0.0.1:<port>`.
- `synthetic_mock`: Resolved completely in-memory by replay adapters for deterministic regression testing.

---

## 12. Failure Modes & Mitigations

1. **MCP Server Crash**: Process exit event captured by `ISandboxObserver`; adapter returns `ERR_MCP_SERVER_EXIT`.
2. **Tool Execution Timeout**: Adapter enforces `timeoutMs` per tool call and issues `SIGKILL` if unhandled.
3. **Schema Violation**: Input arguments validated against tool schema prior to dispatch; fails early with `ERR_INVALID_TOOL_ARGS`.

---

## 13. Acceptance Criteria

- [x] Provider-neutral declarative schema for MCP servers and tools.
- [x] Full normalization of tool calls, responses, errors, and timing.
- [x] Correlation between MCP tool calls and sandbox `StateDelta` records.
- [x] Clean test execution across unit tests and sandbox contracts.

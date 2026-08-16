# ADR-0124: Provider-Neutral MCP Integration in SemantIQ Sandboxes

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

AI agent benchmarks increasingly rely on Model Context Protocol (MCP) toolkits. Different sandbox runtimes implement and expose MCP tools in varied ways (stdio subprocesses, loopback SSE servers, or remote gateways). SemantIQ must maintain strict provider neutrality, deterministic replay capability, and deep observational visibility into all tool invocations without being locked into a single provider.

---

## Decision

1. **Declarative MCP Spec**: SemantIQ Core specifies `McpServerSpec` and `McpToolDefinition` contracts in `EnvironmentSpec`.
2. **Provider-Neutral Transports**: Runtimes support standard `stdio`, `sse`, and `synthetic_mock` transports.
3. **Normalized Observation Events**: All `tools/call` invocations produce structured `McpObservationEvent` evidence records capturing call ID, tool name, argument hash, duration, error state, and associated filesystem state deltas.
4. **Isolated Server Lifecycles**: MCP tool servers run inside the sandbox boundary or synthetic replay engine rather than unconstrained on the evaluator host.

---

## Consequences

- Benchmarks can evaluate agent tool use consistently across Docker, MicroVMs, and replay harnesses.
- Tool actions are deterministically correlated with state deltas in evidence manifests.
- Evaluator host remains protected against untrusted tool execution.

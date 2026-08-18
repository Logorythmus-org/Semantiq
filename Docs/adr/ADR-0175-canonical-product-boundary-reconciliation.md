# ADR-0175: Canonical Product Boundary Reconciliation (Prompt 02)

## Status
Accepted

## Context
SemantIQ is an objective behavioral evaluation and semantic scoring authority. To preserve benchmark neutrality, avoid vendor lock-in, and eliminate single-point-of-failure infrastructure hosting burdens, SemantIQ Core must be strictly decoupled from external execution providers and runtime virtualization daemons.

## Decision
1. **Freeze Core Ownership**:
   - SemantIQ Core owns the benchmark DSL, 7-stage behavioral evaluation sequence, SPIS interoperability protocol, out-of-band observer, Merkle trace immutability, anti-gaming anomaly detection, and cross-model comparison engine.
2. **Decouple External Execution Providers**:
   - External providers own their runtime implementations, container/microVM hypervisors, cloud infrastructure, and billing.
   - External providers interface exclusively through clean-room `BaseSandboxAdapter` implementations communicating over process sockets or network RPC (`SOCKET_IPC`, `PROCESS_CLI_SUBPROCESS`, `NETWORK_RPC_REST`, `NETWORK_RPC_GRPC`).
3. **Isolate Infrastructure Failures**:
   - Infrastructure timeouts, host daemon crashes, or network disconnects are caught by `packages/sandbox-contracts/src/fallback.ts` and categorized as `INFRASTRUCTURE_FAILURE`, never reducing or polluting agent behavioral scores.
4. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Evaluation is strictly bounded to observable external actions and environment state diffs.

## Consequences
- Complete vendor neutrality and zero platform lock-in.
- Core codebase remains lightweight, secure, and legally insulated from copyleft or proprietary runtime code.
- Verdict: `PASS`.

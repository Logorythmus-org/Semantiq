# ADR-0126: Multi-Agent Execution Topologies in SemantIQ Sandboxes

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Evaluating collaborative, competitive, or hierarchical multi-agent benchmarks requires coordinating multiple agent participants with role-based permissions, shared volumes, and structured communication channels. SemantIQ must guarantee unambiguous action attribution, security segmentation, and causal event ordering across diverse runtime providers.

---

## Decision

1. **Topology Contract**: Define `MultiAgentTopologySpec`, `AgentParticipantSpec`, and `SharedResourceSpec` in `packages/sandbox-contracts/src/multi-agent.ts`.
2. **Granular Communication Policies**: Restrict inter-agent messaging to explicitly authorized `CommunicationPolicy` pairs.
3. **Monotonic Causal Ordering**: Apply `MultiAgentCausalTracker` to guarantee deterministic event sequencing across distributed participants.
4. **Action Attribution**: Mandate `actorId` and `actorRole` tagging on all execution requests and state mutations.

---

## Consequences

- Complex multi-agent scenarios (planning, coding, reviewing, red-teaming) can be evaluated deterministically.
- Actions performed by different agents are cleanly separated and traceable in evidence logs.
- Runtimes remain swappable (Docker Compose, microVM mesh, local process mesh).

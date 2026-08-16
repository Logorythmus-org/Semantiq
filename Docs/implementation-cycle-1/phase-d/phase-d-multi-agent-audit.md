# Phase D Prompt 4 Multi-Agent Repository Audit

## Status

**Passed as static discovery; runtime implementation blocked.** Agent, worker, delegation, assignment, message, mailbox, queue, collaboration, coordination, shared context, session, bus, channel, broadcast, and negotiation artifacts were inspected.

## Candidate Classification

| Path                                              | Existing purpose                                                             | Key mismatch                                                                                                    | Decision                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `packages/agent-runtime`                          | In-memory Agent registry, planning, messages, workflows, and legacy Semantiq | Message array has no receive/ack/expiry/mailbox; random IDs; recursive/broad scopes; Prompt 1 non-authoritative | DEFER                               |
| `packages/communication`                          | Re-exports legacy `AgentMessage`                                             | No independent bus or ownership                                                                                 | REMOVE after replacement validation |
| `packages/agent-os`                               | In-memory assignment events and broad Agent OS contracts                     | No persisted delegation, ownership transition, message bus, or parent runtime                                   | DEFER                               |
| `packages/sprint3-runtime`                        | Historical all-in-one Agent collaboration demo                               | Auto-installs agents; negotiation/consensus; long-term memory; in-memory/random IDs; prohibited scope           | DEFER                               |
| `packages/kernel` message bus                     | Generic in-memory handler map and dead-letter array                          | No mailbox identity, durable ordering, ack, expiry, retry, authorization, or restart recovery                   | ADAPT only after persistence design |
| `packages/collaboration`                          | Re-exports Research Runtime collaboration record                             | Research collaboration has different owner and lifecycle                                                        | KEEP separate                       |
| `packages/collective-intelligence`                | Research coordination, forecasting, recommendations, collective memory       | Autonomous/forecasting scope; no Agent Runtime authority; in-memory                                             | DEFER                               |
| `packages/workspace-runtime`                      | Live human collaboration sessions                                            | Different user/workspace ownership                                                                              | KEEP separate                       |
| `services/workers`                                | Arbitrary `WorkerJob` type                                                   | No registry, task identity, permission, lifecycle, or persistence                                               | REPLACE after Prompt 1              |
| `services/agent-runtime`                          | Static routes including delegation                                           | Hard-coded healthy descriptor; no executable APIs                                                               | REMOVE after replacement validation |
| Phase A/B persistence/outbox/idempotency patterns | Durable local transaction and event conventions                              | No multi-agent schema                                                                                           | ADAPT after parent recovery         |

## Duplicate and Drift Findings

1. Agent assignment and collaboration concepts exist independently in `agent-runtime`, `agent-os`, and `sprint3-runtime`.
2. `communication` and `collaboration` package names imply ownership but only re-export unrelated legacy types.
3. Generic kernel messaging and Agent messages have incompatible delivery, identity, ordering, and failure semantics.
4. Existing Sprint 3 behavior includes automatic agent installation, negotiation, consensus, multi-agent delegation, learning, and long-term memory beyond this prompt's deterministic foundation.

## Security and Correctness Gaps

- No authoritative Coordinator, Worker, Observer, Supervisor, Workflow Instance, AgentTask, or capability identity exists.
- Messages lack persisted sender authorization, receiver mailbox, sequence, acknowledgement, expiry transition, retry identity, and payload schema.
- No per-mailbox deterministic ordering, exclusive ownership, optimistic concurrency, or replay prevention exists.
- Delegation does not bind immutable workflow, task, capability, permission, deadline, constraints, or human supervisor references.
- Worker assignment does not prove enabled/healthy status, workload limits, permissions, or single-owner execution.
- No recursion guard prevents workers from delegating.
- Shared context lacks immutable versions, minimization, access policy, fingerprints, and tamper detection.
- Result merge lacks normalized parent results, provenance-safe ordering, duplicate detection, and no-semantic-rewrite guarantees.
- No durable escalation, heartbeat, stuck-worker detection, restart recovery, audit, or honest readiness exists.

## Missing Prompt 4 Modules

- authoritative `MultiAgentRuntime` and immutable role assignments
- Coordinator, Worker, Observer, and Supervisor boundaries
- immutable Delegation Contract and Delegation Plan
- deterministic capability negotiation and worker assignment policy
- versioned minimized Shared Workflow Context
- persistent local message bus, mailboxes, ordering, acknowledgement, expiry, retry, and dead letters
- explicit human supervision and escalation records
- immutable execution ownership and recursion prevention
- deterministic Result Merger preserving identity, provenance, and order
- PostgreSQL persistence, migrations, events, audit, APIs, health, diagnostics, idempotency, and restart recovery
- unit, contract, bus, mailbox, delegation, assignment, security, restart, and Docker tests

## Reuse Boundary

Generic fixed clocks, hashes, API envelopes, PostgreSQL transaction/outbox/idempotency patterns, and the concept of explicit local handlers may be adapted after parent recovery. Legacy Agent messages, Research collaboration, collective intelligence, auto-installed agents, negotiation logs, memory, and synthetic health must not become Prompt 4 contracts.

## Decision

Do not refactor or compose legacy collaboration artifacts during this blocked attempt. Establish the single-agent, tool, and workflow authorities first, then design deterministic local collaboration against their actual public contracts.

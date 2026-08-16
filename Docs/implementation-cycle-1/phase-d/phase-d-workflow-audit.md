# Phase D Prompt 3 Workflow Repository Audit

## Status

**Passed as static discovery; runtime implementation blocked.** Workflow, pipeline, graph, step, node, dependency, queue, scheduler, state-machine, approval, resume, checkpoint, and compensation candidates were inspected.

## Candidate Classification

| Path                                              | Existing purpose                                                                                        | Key mismatch                                                                                                                               | Decision                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `packages/workflow-engine`                        | Broad in-memory workflow generation, execution, templates, simulation, optimization, memory, and events | Different lifecycle; no durable queue/checkpoints; no cycle detection; immediate synthetic completion; ambient clock; placeholder Semantiq | DEFER                                   |
| `packages/workflow`                               | Re-exports workflow types from legacy `agent-runtime`                                                   | No independent runtime or Prompt 3 ownership                                                                                               | REMOVE after downstream migration       |
| `packages/workflow-runtime`                       | Deprecated compatibility re-export to `packages/workflow`                                               | Alias over an alias; stale ownership claim                                                                                                 | REMOVE after downstream migration       |
| `services/workflow-runtime`                       | Static route and hard-coded healthy descriptor                                                          | No executable API or health checks                                                                                                         | REMOVE after replacement validation     |
| `packages/agent-runtime`                          | Owns a second workflow model and synthetic execution                                                    | Prompt 1 is non-authoritative; direct legacy Semantiq coupling; in-memory/random IDs                                                       | DEFER                                   |
| `packages/agent-os`                               | Owns plans/tasks and emits execution events                                                             | No authoritative AgentTask, persistence, or tool boundary                                                                                  | DEFER                                   |
| `packages/sprint3-runtime`                        | Historical all-in-one Agent/workflow/tool/memory demonstration                                          | Multi-agent and memory scope prohibited; in-memory; legacy contracts                                                                       | DEFER                                   |
| `packages/kernel` scheduler                       | Local `setTimeout` scheduler and generic message bus                                                    | Not durable or restart-safe; ambient time/random IDs; no workflow queue ownership                                                          | ADAPT only after persistence design     |
| Phase B graph primitives                          | Stable bounded Question graph behavior                                                                  | Different aggregate and topology ownership                                                                                                 | KEEP separate; algorithmic lessons only |
| Phase A/B persistence/outbox/idempotency patterns | PostgreSQL transactions, migrations, events, request identity                                           | No workflow schema                                                                                                                         | ADAPT after parent recovery             |

## Duplicate and Drift Findings

1. Workflow definitions and execution exist independently in `workflow-engine`, `agent-runtime`, and `sprint3-runtime`.
2. `workflow` and `workflow-runtime` appear authoritative but only re-export the legacy Agent model.
3. Existing models include loops, parallel/distributed execution, AI-generated schedules, browser/MCP/cloud tools, memory, optimization, templates, and publishing, all beyond Prompt 3.
4. Existing service health is a constant rather than a dependency-aware readiness result.

## Correctness Gaps

- `workflow-engine` validates missing edge endpoints but does not reject cycles, duplicate nodes, unreachable steps, invalid entry/exit nodes, or incompatible dependencies.
- Execution marks the workflow completed without creating AgentTasks, resolving dependencies, or invoking Prompt 2.
- Pause, resume, and cancel only emit events; persisted execution state is not transitioned.
- Execution IDs use `Date.now()` and event timestamps read the ambient clock.
- Approval uses mutable booleans and keyword-generated checkpoints rather than immutable authorization records.
- Checkpoint IDs are derived from approval checkpoints, not post-step snapshots.
- There is no durable execution queue, claim/lease model, optimistic concurrency, idempotency, or restart recovery.
- Compensation, completed-step preservation, resume-from-latest-checkpoint, and no-reexecution guarantees are absent.
- Semantiq integration is a placeholder event or direct legacy package coupling, not a public observation contract.

## Missing Prompt 3 Modules

- authoritative immutable Workflow Definition and manifest fingerprint
- explicit Workflow Registry and compatibility policy
- persisted Workflow Instance lifecycle and immutable transition history
- deterministic planner and complete DAG validator
- dependency resolver and persistent local execution queue
- immutable approval records and explicit human authorization linkage
- bounded compensation policy
- post-step checkpoints and restart-safe resume
- AgentTask-only step execution and Prompt 2-only tool integration
- transactional events, audit, idempotency, repositories, migrations, APIs, health, and diagnostics
- unit, contract, persistence, approval, checkpoint, resume, security, restart, and Docker tests

## Reuse Boundary

Reuse generic fixed-clock, hashing, PostgreSQL transaction/outbox/idempotency, API envelope, and graph-algorithm patterns after parent contracts are stable. Do not reuse legacy workflow aggregates, state values, generated approval logic, synthetic execution, tool taxonomies, memory, templates, optimization, or Semantiq coupling as Prompt 3 contracts.

## Decision

Do not refactor competing workflow packages during this blocked attempt. Recover the parent runtimes, then establish one authoritative Workflow Runtime and migrate or deprecate aliases explicitly.

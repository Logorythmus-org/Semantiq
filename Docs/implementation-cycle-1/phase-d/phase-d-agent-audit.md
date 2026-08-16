# Phase D Prompt 1 Agent Repository Audit

## Audit Status

**Passed as static discovery; runtime implementation blocked.** Agent, worker, task, workflow, execution, planner, scheduler, tool, capability, action, command, runtime, executor, registry, and plugin artifacts were searched across packages, services, tests, specifications, and backend documentation.

## Primary Findings

| Artifact                                                   | Existing behavior                                                                                                                       | Classification                   | Required disposition                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------- |
| `packages/agent-runtime`                                   | Broad in-memory goals, agents, planning, workflows, tools, memory, reflection, learning, graph writes, and legacy Semantiq benchmarking | DEPRECATED for Phase D authority | Mine terminology/tests selectively; do not promote                           |
| `packages/agent-os`                                        | Second in-memory goal/task/plan runtime with approval keyword matching and placeholder Semantiq benchmark event                         | DUPLICATE / DEPRECATED           | Reconcile ownership after Phase C recovery                                   |
| `services/agent-runtime`                                   | Static descriptor with hard-coded healthy status and route list                                                                         | PLACEHOLDER_BY_DESIGN            | Must not be treated as health, API, or runtime evidence                      |
| `packages/agents`                                          | Re-export facade over legacy `agent-runtime`                                                                                            | BLOCKED                          | No independent registry or aggregate                                         |
| `packages/execution`                                       | Re-export facade over legacy `agent-runtime`                                                                                            | BLOCKED                          | No independent executor                                                      |
| `packages/registry`                                        | Re-export facade over legacy `agent-runtime`                                                                                            | BLOCKED                          | No independent Agent Registry                                                |
| `packages/planning`                                        | Re-exports legacy execution-plan types                                                                                                  | BLOCKED                          | No Prompt 1 Task Planner                                                     |
| `packages/tools`                                           | Re-exports legacy tool request/result types                                                                                             | DEFER                            | Prompt 2 concern; currently coupled to legacy runtime                        |
| `packages/tasks`                                           | Re-exports Research Runtime task type                                                                                                   | OWNERSHIP CONFLICT               | Must not become AgentTask by aliasing                                        |
| `packages/shared` capability registry                      | Explicit in-memory registration, version, health, operations                                                                            | REUSABLE WITH LIMITS             | Generic primitive only; lacks permissions, schemas, outputs, and limitations |
| `packages/shared` clock/events/UoW/idempotency             | Tested local primitives                                                                                                                 | REUSABLE WITH ADAPTERS           | Prefer explicit ports and persistent adapters                                |
| `packages/persistence`                                     | Phase A/B infrastructure and Question tables only                                                                                       | REUSABLE FOUNDATION              | No Agent, Capability, Task, Plan, Result, or audit schema exists             |
| `packages/workflow-engine` and `packages/workflow-runtime` | Separate workflow ownership and broad generation/execution concepts                                                                     | DEFER                            | Keep outside Prompt 1 AgentTask ownership                                    |
| `packages/kernel`                                          | Generic scheduler, permissions, plugin and execution primitives                                                                         | REQUIRES_REPAIR                  | Includes timers and broader plugin/agent behavior; audit before reuse        |
| `packages/mvp-runtime` and sprint runtimes                 | Demo compositions over legacy agent/workflow/Semantiq models                                                                            | OBSOLETE FOR PHASE D             | Do not use as authoritative contracts                                        |
| `specs/sprint-3` and uppercase `Docs/AGENT_*`              | Earlier design claims and broad future scope                                                                                            | HISTORICAL                       | Repository implementation and current phase prompts take precedence          |

## Duplicate Implementations

1. `packages/agent-runtime` and `packages/agent-os` both own agents, goals, tasks, plans, execution, approval, events, metrics, and Semantiq-related behavior.
2. `packages/agents`, `packages/execution`, `packages/registry`, and `packages/planning` appear independent by package name but only re-export the first runtime.
3. Workflow execution also exists in `packages/workflow-engine`, `packages/workflow-runtime`, `packages/kernel`, and demo/sprint runtimes with incompatible lifecycle and ownership semantics.
4. Capability registration exists generically in `packages/shared`, while legacy Agent definitions store unvalidated string arrays.

No duplicate was removed because Prompt 1 cannot establish the authoritative replacement contract while Phase C is blocked.

## Security and Determinism Gaps

- Legacy agent IDs use `Date.now()` and `Math.random()`.
- Event timestamps and runtime metrics read the ambient clock directly.
- Agent and capability registration do not establish authenticated owner identity or immutable capability fingerprints.
- Human approval is inferred from keywords instead of an explicit authorization record.
- Legacy tool kinds include terminal, browser, cloud AI, external APIs, GitHub, email, and other capabilities prohibited or deferred by this prompt.
- Tool execution returns synthetic success without invoking a versioned registered capability contract.
- In-memory maps lose state on restart and cannot enforce concurrency, idempotency, replay prevention, or immutable transition history.
- The service descriptor advertises `healthy` without checking persistence, registries, Semantiq compatibility, or executable routes.
- Direct import of `ExplainableSemantiqRuntime` violates the required public-contract boundary and targets a package Phase C declared non-authoritative.

## Missing Prompt 1 Modules

- authoritative `AgentRuntime`
- immutable `Agent` and `Capability` contracts matching Prompt 1
- explicit `CapabilityRegistry` with required inputs, outputs, permissions, and limits
- independent `AgentRegistry` with enable/disable lifecycle
- persisted `AgentTask` and immutable transition history
- deterministic `TaskPlanner` and bounded `ExecutionPlan`
- one-task `TaskExecutor` with explicit cancellation and partial-failure semantics
- explicit authorization records and execution policy
- PostgreSQL repositories, migrations, transactional events, audit, and idempotency
- executable APIs and access policies
- honest liveness, readiness, and diagnostics
- restart, concurrency, security, API, database, Docker, and Semantiq contract tests

## Reuse Boundary

Safe candidates are limited to generic, already-tested primitives such as fixed clocks, event envelopes, unit-of-work conventions, API envelopes, PostgreSQL migration/outbox patterns, and the basic explicit-registration idea. Their concrete Phase D use must be decided only after the Semantiq public boundary exists.

Research tasks, workflow definitions, Question events, Semantiq internals, legacy benchmark outputs, memory/learning models, and broad tool taxonomies must retain their current ownership and must not be copied into the foundational AgentTask aggregate.

## Test Readiness

The legacy `packages/agent-runtime` has three in-memory tests covering a broad happy path, keyword approval, and messaging. Shared capability primitives have unit and contract coverage. There are no Prompt 1 persistence, migration, API, restart, concurrency, authorization, spoofing, injection, replay, Docker, or valid Semantiq-integration tests.

All Phase D runtime tests are therefore `Not Executed`, not passed.

## Decision

Do not refactor or replace the legacy runtimes in this attempt. Recover Phase C first, then define the smallest authoritative Agent Runtime and explicitly deprecate or adapt each legacy owner against that contract.

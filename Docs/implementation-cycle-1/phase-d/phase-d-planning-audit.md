# Phase D Prompt 6 Planning Repository Audit

## Status

**Passed as static discovery; runtime implementation blocked.** Plan, planner, planning, goal, constraint, strategy, risk, dependency, schedule, optimization, validation, alternative, and estimate artifacts were inspected.

## Candidate Classification

| Path                                     | Existing purpose                                                       | Key mismatch                                                                                                                            | Decision                                  |
| ---------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `packages/planning`                      | Re-exports legacy Agent `ExecutionPlan` and `PlanTask`                 | No independent bounded context or solver                                                                                                | REMOVE after replacement validation       |
| `packages/goal-engine`                   | Re-exports legacy Agent Goal types and factory                         | No independent immutable Prompt 6 Goal Definition                                                                                       | REMOVE after replacement validation       |
| `packages/agent-runtime`                 | Milestone-to-task planning with keyword capability/approval heuristics | Mixes planning, Agent selection, workflow creation, execution, memory, and Semantiq; random IDs; no constraints/alternatives validation | DEFER                                     |
| `packages/agent-os`                      | Requirement-to-sequential-task planning                                | Fixed capability, no solver or strategy selection; in-memory; executes tasks; Prompt 1 non-authoritative                                | DEFER                                     |
| `packages/sprint3-runtime`               | Historical goal/plan/workflow demo with estimates and alternatives     | In-memory/random IDs; auto Agent selection; memory/learning/execution coupling; synthetic estimates                                     | DEFER                                     |
| `packages/workflow-engine`               | Generates and optimizes workflows from goal input                      | Planning mixed into Workflow ownership; placeholder Semantiq/optimization; no Prompt 3 authority                                        | DEFER                                     |
| `tools/automation`                       | Generates engineering specs/tasks and labels itself autonomous         | Developer scaffolding, not runtime planning; different security boundary                                                                | KEEP as developer utility; never register |
| `packages/validation` / core validation  | Generic validation exports and primitives                              | No domain plan invariants                                                                                                               | ADAPT after contracts exist               |
| Question relation graph algorithms       | Bounded directed graph traversal                                       | Different aggregate; not a plan DAG                                                                                                     | KEEP separate; algorithmic lessons only   |
| Phase A/B persistence/outbox/idempotency | Durable transactions, migrations, and events                           | No planning schema                                                                                                                      | ADAPT after parent recovery               |

## Duplicate and Drift Findings

1. Goal and plan ownership appears in `agent-runtime`, `agent-os`, `sprint3-runtime`, `workflow-engine`, and alias packages.
2. Public `goal-engine` and `planning` packages only re-export the legacy Agent model while their READMEs claim production scope.
3. Existing planners combine decomposition with Agent assignment, workflow construction, execution, benchmarking, memory, reflection, learning, or optimization.
4. Existing alternatives, durations, costs, risks, and validation strings are illustrative and have no versioned rule or measurement semantics.

## Security and Correctness Gaps

- No authoritative Goal, capability, workflow, tool, permission, runtime limit, context, or Semantiq evidence identity exists.
- No immutable rule version, canonical input, decision trace, plan fingerprint, or reproducibility contract exists.
- No Constraint Solver evaluates permission, resource, capability, workflow, tool, approval, time, version, security, or policy constraints.
- No complete Dependency Analyzer rejects cycles, impossible plans, unavailable capabilities, or inconsistent versions.
- Existing decomposition is sequential string mapping and does not prove deterministic completeness.
- Existing strategy and alternative values are hard-coded labels rather than rule-derived compatible plans.
- Existing durations, costs, likelihoods, confidence, and optimization outputs are uncalibrated or synthetic.
- No immutable Risk Report records category, severity, rule-derived likelihood, mitigation, and owner.
- Human approval is absent or inferred from keywords; no approval expiry, scope, fingerprint binding, or spoofing protection exists.
- No replanning trigger identity, constraint immutability, approved-alternative policy, or recursion guard exists.
- No persistence, transition history, idempotency, optimistic concurrency, restart recovery, audit, or honest readiness exists.

## Missing Prompt 6 Modules

- authoritative Planning Runtime and immutable Goal Definition
- deterministic Goal Decomposition Engine and versioned Planning Units
- rule-based Constraint Solver with explicit decision evidence
- immutable Dependency Graph and complete cycle/impossibility validation
- versioned Execution Alternatives and deterministic Strategy Selector
- persisted Planning Session lifecycle and immutable transition history
- Risk Analyzer with defined categories, scales, mitigations, and ownership
- Plan Validator and immutable Execution Plan Package with SHA-256 fingerprint
- explicit human Planning Approval bound to exact plan version/fingerprint
- bounded Replanning Engine with allowed triggers, no new goals/tools, and immutable constraints
- read-only Semantiq evidence boundary and no-tool/no-execution enforcement
- PostgreSQL persistence, migrations, constraints, events, audit, APIs, health, diagnostics, idempotency, and restart recovery
- unit, contract, solver, graph, strategy, risk, approval, replanning, persistence, security, restart, and Docker tests

## Reuse Boundary

Reuse generic fixed clocks, SHA-256/canonicalization conventions, graph cycle/topological algorithms, validation/result envelopes, PostgreSQL transaction/outbox/idempotency patterns, and immutable revision techniques after parent recovery. Do not reuse legacy planner aggregates, keyword heuristics, synthetic estimates, hard-coded alternatives, optimization reports, Agent assignment, execution coupling, memory, learning, or direct Semantiq behavior as Prompt 6 contracts.

## Decision

Do not refactor or compose legacy planning artifacts during this blocked attempt. Establish parent runtimes and their compatibility descriptors first, then create one narrow deterministic planning context with explicit rules and human approval.

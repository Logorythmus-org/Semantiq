# Sprint 3 Repository Audit

## Current Repository

The repository contains executable local runtimes for Sprint 1 and Sprint 2, plus established packages for Agent OS, Agent Runtime, Workflow Engine, Workflow Runtime, Semantiq, Graph Runtime, and Research.

## Current Packages

- Executable: `packages/agent-runtime`, `packages/sprint1-runtime`, `packages/sprint2-runtime`, `packages/graph-runtime`, `packages/semantiq`, `packages/research`.
- Contract/scaffold: `packages/agent-os`, `packages/workflow-engine`, `packages/workflow-runtime`, `packages/agents`, `packages/tasks`, `packages/memory`, `packages/reflection`, `packages/learning`.

## Current APIs

Agent Runtime already supports `createGoal`, `planGoal`, `createWorkflow`, `executeWorkflow`, `registerAgent`, `discoverAgents`, `runTool`, `storeMemory`, `queryMemory`, `reflect`, `learn`, and Semantiq benchmarking. Sprint 3 needs approval-specific APIs, richer goal state transitions, collaboration decisions, default workflows, and Sprint 2 research-task ingestion.

## Current Workflows

Existing workflows are deterministic and sequential with approval-aware nodes. Workflow Engine contracts describe state machines, pause/resume/cancel, templates, checkpoints, simulation, and optimization, but the executable implementation is limited.

## Current Events

Agent Runtime emits goal, planning, agent, workflow, tool, memory, reflection, learning, benchmark, and upgrade events. Sprint 3 acceptance requires versioned events for approval, pause, failure, and learning completion with stronger audit metadata.

## Current Contracts

`packages/agent-os/src/contracts.ts` and `packages/workflow-engine/src/contracts.ts` contain broad domain contracts. Sprint 3 should compose them rather than redefine the frozen architecture.

## Current Graph Schema

Graph Runtime supports workflow, agent, knowledge, research, evidence, question, project, and other nodes. Some requested relation labels remain descriptor-level and should be mapped through supported relation kinds where needed.

## Current Semantiq Integration

`ExplainableSemantiqRuntime` evaluates workflow-like subjects. Sprint 3 must expose execution, planning, collaboration, reflection, learning, and human oversight dimensions in a local report.

## Existing AI Providers

Sprint 2 implemented deterministic local provider contracts. External providers are adapter-ready only and disabled by default.

## Existing Research Runtime

Sprint 2 can produce a research project, evidence, hypothesis, task plan, dashboard, and export. Sprint 3 can transform those research tasks into goals, plans, workflows, agent collaboration, memory, reflection, and learning.

## Compatibility Risks

- Existing Agent Runtime states do not exactly match Sprint 3 goal states.
- Approval history is not immutable in older runtime scaffolds.
- Pause/resume/cancel are contract-level in Workflow Engine but need Sprint 3 local implementation.
- External tools and providers must stay adapter-only unless the user grants explicit permission.

# Compute Engine

The Distributed Compute Engine is Tech Club's semantic execution fabric. It is not a cloud platform or Kubernetes replacement. It coordinates local and optional distributed resources so goals, workflows, agents, notebooks, graph jobs, benchmarks, simulations, and AI tasks run on appropriate compute.

## Core Flow
Goal -> Workflow -> Execution Planner -> Resource Scheduler -> Task Queue -> Compute Nodes -> Workers -> Results -> Knowledge Graph -> Semantiq -> Reflection.

## Responsibilities
- Register and discover compute resources.
- Match tasks to resources through explainable scheduling.
- Queue immediate, background, scheduled, retry, long-running, streaming, distributed, AI, benchmark, and graph tasks.
- Support CPU, GPU, WebGPU, browser workers, Node workers, Docker workers, Python workers, inference workers, graph workers, rendering workers, and custom workers.
- Preserve local-first execution and optional distributed expansion.
- Record execution knowledge for scheduling improvement.

## Package Layout
- `packages/compute-engine/src/contracts.ts`: resources, capabilities, tasks, requirements, queues, checkpoints, model routing, WebGPU requests, benchmarks, status, repository, service, and event contracts.
- `packages/compute-engine/src/index.ts`: local compute service scaffold for registration, discovery, scheduling, execution, checkpointing, model routing, WebGPU fallback, resource benchmarks, and monitoring.
- Future directories: `runtime/`, `scheduler/`, `workers/`, `resources/`, `webgpu/`, `gpu/`, `cpu/`, `distributed/`, `queues/`, `checkpoint/`, `routing/`, `memory/`, `monitoring/`, `optimization/`, `api/`, `events/`, `contracts/`, `schemas/`, `ui/`, `tests/`, and `docs/`.

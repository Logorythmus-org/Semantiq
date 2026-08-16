# Development Workflow

Tech Club follows specification-driven development.

## Required Sequence

Goal -> Requirements -> Specification -> Architecture -> Repository Analysis -> Compatibility Review -> Implementation Plan -> Implementation -> Validation -> Documentation.

## Phase 5 Spec-Kit Rule

Architecture is stable. Production implementation begins only after repository audit, reuse analysis, Spec-Kit completion, acceptance test definition, and documentation ownership are complete for the target capability.

## Monorepo Bootstrap Rule

Engineering foundation changes must improve the shared repository platform: package management, build graph, tests, CI, documentation, DevContainer, local development, Docker infrastructure, ownership, or developer CLI. They must not introduce product behavior without a feature Spec-Kit.

## Validation Checklist

- Specification exists and includes acceptance criteria.
- Architecture boundaries are respected.
- Bounded context ownership is clear.
- Aggregate invariants are documented before implementation.
- Domain events are versioned and auditable.
- Kernel changes contain no business logic.
- Runtime services are registered through explicit descriptors.
- Data access goes through repositories and storage interfaces only.
- Storage, index, cache, search, vector, and sync changes preserve model separation.
- External services are accessed only through integration adapters.
- Gateway changes contain no business logic.
- Identity, authentication, authorization, wallet, ownership, and policy changes must be explainable and auditable.
- Workspace changes preserve semantic object identity, graph projection, offline operation, and human approval boundaries for important AI actions.
- Question Network changes must preserve questions as primary objects and must not introduce like-driven social ranking.
- Semantiq changes must keep all scores explainable, modular, profile-driven, and reproducible.
- Question Intelligence changes must preserve user meaning, avoid fabricated evidence, and require approval for content changes.
- Scientific Atlas changes must preserve append-only knowledge evolution, traceable evidence, visible uncertainty, and questions as central objects.
- Research Engine changes must preserve question origin, contribution provenance, reproducibility, peer-review transparency, and human approval for publications.
- Narrative Engine changes must preserve educational intent, source-question traceability, reflection, accessibility, and human review for publication.
- Community Engine changes must keep questions central, reputation explainable, trust evidence-based, and consensus subordinate to evidence.
- Agent OS Runtime changes must preserve goal-first execution, explainable planning, observable orchestration, explicit memory, permissioned tool calls, human approval gates, Semantiq benchmarking, and Knowledge Graph writes.
- Workflow Engine changes must preserve goal traceability, modular nodes, first-class edges, recoverable execution, human approval checkpoints, reusable templates, offline editing, Semantiq benchmarking, and Knowledge Graph contribution.
- Workspace Runtime changes must preserve workspace boundaries, unified knowledge objects, live collaboration, offline-first behavior, encrypted synchronization, continuous graph updates, agent/workflow integration, accessibility, and human approval.
- Compute Engine changes must preserve provider independence, local-first execution, optional distribution, explainable scheduling, WebGPU fallback, secure model routing, checkpoint recovery, observability, Semantiq benchmarking, and Knowledge Graph writes.
- Semantic Economy changes must preserve transparent ownership, machine-readable licensing, auditable transactions, public goods without paywalls, wallet protection, human approval for commercial publishing, Semantiq quality, trust, and evidence over popularity.
- Developer Platform changes must preserve core independence, SDK concept parity, sandboxed plugins, versioned public APIs, permission reviews, marketplace validation, supply-chain security, offline development, and documented compatibility.
- System Integration changes must preserve unified platform validation, dependency clarity, no duplicated architecture, health scoring, security/performance/offline validation, release approval, complete documentation, and adaptive roadmap evidence.
- Federation changes must preserve autonomous nodes, optional federation, local knowledge ownership, no central dependency, transparent trust, machine-readable policy, provenance-preserving replication, encrypted exchange, and offline-first operation.
- Collective Intelligence changes must preserve question-centered discovery, decentralized knowledge, autonomous communities, evidence-driven research, transparent AI recommendations, uncertainty-aware forecasting, minority reports, human oversight, privacy-preserving analytics, and offline federation.
- Civilization OS changes must preserve long-term accessibility, permanent provenance, lineage, historical evolution, open standards, decentralized governance, privacy-aware archives, integrity verification, persistent identifiers, and zero-loss migration intent.
- Innovation Network changes must preserve question-origin lineage, open science reproducibility, evidence-based impact, public benefit, decentralized governance, transparent AI coordination, Semantiq evaluation, federation compatibility, and offline innovation nodes.
- Education Network changes must preserve question-centered learning, adaptive paths, evidence-based competencies, privacy-preserving analytics, verifiable credentials, mentorship measurement, accessibility, offline learning, child safety, and learner agency.
- Governance Engine changes must preserve question-centered processes, evidence-first decisions, structured deliberation, minority viewpoints, uncertainty-aware consensus, reproducible simulations, transparent participation, advisory-only AI, audit logs, and human responsibility.
- Civilization Kernel changes must preserve subsystem autonomy, question origin, semantic identity, explainable relations, Semantiq-backed health, human oversight, optional federation, offline-first operation, open protocols, advisory digital twin outputs, migration safety, and future technology adapter boundaries.
- Production implementation changes must link to a TC backlog ID, completed Spec-Kit, acceptance tests, repository ownership, CI expectations, documentation updates, migration notes, and Definition of Done.
- Dependency direction is valid.
- Local-first and offline-first implications are considered.
- Agent interaction is explicit.
- Security and observability concerns are documented.
- Tests cover the changed contract or behavior.

## Commands

- `pnpm install`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm format`

# Implementation Roadmap

This roadmap converts the stable Tech Club architecture into production software. It is incremental: every step must be specified, testable, documented, and releasable.

## Implementation Order
1. Core runtime and shared primitives.
2. Identity, authorization, audit, and wallet boundaries.
3. Data platform and Knowledge Graph.
4. Workspace runtime.
5. Questions and Semantiq.
6. Research, scientific atlas, narratives, and communities.
7. Agent runtime.
8. Workflow runtime.
9. Marketplace and semantic economy.
10. Federation and global knowledge mesh.
11. Civilization OS and Civilization Kernel.
12. Developer platform, SDKs, plugins, and release tooling.
13. Apps, services, observability, and deployment.
14. Production hardening, public alpha, beta, and production release.

## Module Roadmap
| Area | Production Focus | First Deliverable |
| --- | --- | --- |
| Core | Shared types, errors, result contracts, configuration | `@tech-club/core` production contract freeze |
| Kernel | Module registration, lifecycle, service registry | Local module runtime with contract tests |
| Identity | AuthN/AuthZ, RBAC, ABAC, audit, wallet links | Local identity provider and policy evaluator |
| Data Platform | Repositories, migrations, sync, storage adapters | SQLite and PostgreSQL adapter plan |
| Graph | Knowledge Graph primitives and projections | Relation store and query contracts |
| Workspace | Workspace shell and knowledge object runtime | Local-first workspace prototype |
| Questions | Question lifecycle, graph, moderation, search | Question service with acceptance tests |
| Semantiq | Explainable evaluation pipeline | Dimension evaluator and report history |
| Research | Projects, evidence, hypotheses, peer review | Research lifecycle service |
| Communities | Membership, reputation, trust, consensus | Contribution ledger and trust records |
| Agents | Planner, research, writing, review, education | Provider-neutral agent package template |
| Workflows | Execution, validation, simulation, templates | Workflow graph executor |
| Economy | Assets, licensing, funding, marketplace | Asset publication and approval flow |
| Federation | Nodes, protocol, sync, trust | Optional federation gateway adapter |
| Civilization | Preservation, health, coordination, protocols | Health report and kernel coordination tests |
| Apps | Next.js, desktop, mobile, accessibility | Workspace and question MVP surfaces |
| Services | FastAPI/Node gateway, workers, OpenAPI | Gateway contract and worker queue |
| DevOps | Docker, observability, CI/CD, release | CI pipeline and local compose profile |

## Freeze Gates
- Contracts freeze before implementation.
- Database migrations freeze before integration testing.
- Public API versions freeze before beta.
- Release candidates freeze before production approval.

# Domain Model

Tech Club is built around questions. A question can gather observations, evidence, hypotheses, experiments, answers, discussions, projects, research, narratives, games, learning paths, benchmarks, and ownership claims.

## Core Domain Rule
Question is the root aggregate of the platform. Other aggregates may exist independently, but their meaning in Tech Club is usually established by a semantic relationship to one or more questions.

## Domain Layers
- Core domain: Question Engine, Knowledge Graph, Project System, Scientific Atlas.
- Supporting domain: Semantiq Benchmark, Agent OS, Workspace, Narrative Engine, Game Engine, Education, Search.
- Generic domain: Identity, Semantic Wallet, Marketplace, Repositories, Notifications, Analytics, Settings, Administration.

## Universal Object Shape
Every important domain object carries:
- Identity: stable domain identifier.
- Metadata: title, summary, authorship, timestamps, tags, provenance.
- Lifecycle: draft, active, paused, completed, archived, or context-specific states.
- Permissions: read, comment, propose, modify, link, administer.
- Versioning: revision, change reason, parent revision, fork source, restore pointer.
- Semantic relations: first-class links to other objects.

## Core Objects

| Object | Owner | Purpose |
| --- | --- | --- |
| Question | Question Engine | Root inquiry object and main aggregate. |
| Answer | Question Engine | Proposed resolution or partial response to a question. |
| Observation | Question Engine | Direct noticed fact, signal, or user statement. |
| Evidence | Scientific Atlas | Source-backed support or contradiction for a claim. |
| Hypothesis | Scientific Atlas | Testable explanation connected to questions and evidence. |
| Experiment | Scientific Atlas | Method for testing hypotheses. |
| Project | Project System | Coordinated work derived from questions. |
| Knowledge Object | Knowledge Graph | Reusable semantic unit. |
| Repository | Repositories | Code, dataset, document, or external source container. |
| Workspace | Workspace | Local or collaborative work environment. |
| Benchmark | Semantiq Benchmark | Evaluation case, run, result, or score. |
| Agent | Agent OS | Human-approved AI collaborator. |
| Workflow | Agent OS | Repeatable sequence of agent or system actions. |
| Narrative | Narrative Engine | Story structure derived from knowledge and questions. |
| Game | Game Engine | Playable learning or simulation object. |
| Wallet Asset | Semantic Wallet | Owned semantic, credential, or economic asset. |
| Semantic Identity | Identity | Person, agent, organization, or role identity. |
| Research Paper | Scientific Atlas | Publication or source artifact. |
| Learning Path | Education | Guided sequence of learning goals and objects. |
| Discussion | Question Engine | Threaded deliberation around a domain object. |
| Community | Administration | Group boundary for participation and governance. |
| Tag | Knowledge Graph | Controlled or emergent label. |
| Relationship | Knowledge Graph | First-class semantic edge between objects. |

## Model Separation
The domain model is not the database model. Persistence, API, transport, and view models adapt to the domain and never define it.

## Scientific Atlas Extension
The Scientific Atlas specializes the domain model around living question entries, scientific domains, evidence networks, hypotheses, experiments, uncertainty, and knowledge timelines. See [DOMAIN_MODEL_ATLAS.md](DOMAIN_MODEL_ATLAS.md).

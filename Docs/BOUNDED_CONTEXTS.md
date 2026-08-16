# Bounded Contexts

Each bounded context owns its language, aggregates, events, policies, and repositories. Contexts communicate through public APIs and domain events.

| Context | Why It Exists | Owns | Depends On |
| --- | --- | --- | --- |
| Question Engine | Questions are the core of Tech Club. | Question, Answer, Observation, Discussion. | Identity, Knowledge Graph. |
| Knowledge Graph | Relationships and semantic objects need one canonical owner. | Knowledge Object, Relationship, Tag. | Identity. |
| Semantiq Benchmark | Evaluation has specialized scoring and explainability language. | Benchmark, Benchmark Run, Evaluation Result. | Question Engine, Knowledge Graph. |
| Agent OS | Agent behavior needs controlled orchestration. | Agent, Workflow, Tool Session. | Identity, Workspace. |
| Workspace | Local-first work environments need their own lifecycle. | Workspace, Panel, Resource Mount. | Identity, Repositories. |
| Project System | Projects turn questions into coordinated work. | Project, Task, Milestone. | Question Engine, Workspace. |
| Scientific Atlas | Scientific reasoning needs evidence, hypotheses, and experiments. | Evidence, Hypothesis, Experiment, Research Paper. | Question Engine, Knowledge Graph. |
| Narrative Engine | Stories require narrative-specific generation and revision. | Narrative, Scene, Character, Plot Arc. | Question Engine, Knowledge Graph. |
| Game Engine | Games need mechanics, simulation, progress, and assets. | Game, Rule Set, Simulation, Play Session. | Narrative Engine, Education. |
| Semantic Wallet | Ownership and semantic assets need a security boundary. | Wallet Asset, Ownership Claim, Credential. | Identity. |
| Identity | People, agents, organizations, roles, and permissions need one source. | Semantic Identity, Role, Permission Grant. | None. |
| Marketplace | Exchange and licensing need economic boundaries. | Listing, License, Transaction Intent. | Wallet, Identity. |
| Education | Learning paths and assessments need pedagogical ownership. | Learning Path, Lesson, Assessment. | Question Engine, Game Engine. |
| Repositories | External and local source containers need adapter isolation. | Repository, Source Snapshot, Adapter Binding. | Identity. |
| Search | Search spans contexts but does not own their domain state. | Search Index, Search Query, Search Result. | Knowledge Graph. |
| Notifications | User and system notification delivery needs its own policies. | Notification, Subscription, Delivery Preference. | Identity. |
| Analytics | Product and learning analytics need privacy-aware boundaries. | Metric, Insight, Report. | Identity. |
| Settings | Configuration differs from domain behavior. | Setting, Preference, Feature Flag. | Identity. |
| Administration | Governance and moderation need explicit authority models. | Community, Policy, Moderation Case. | Identity. |

## Context Map
- Customer-supplier: Question Engine supplies meaning to Project System, Education, Narrative Engine, Game Engine, and Scientific Atlas.
- Conformist: Search conforms to published read models from other contexts.
- Anticorruption layer: Repositories, Marketplace, Wallet, and external integrations use adapters.
- Published language: Domain events form the shared language between contexts.

## Dependency Direction
Identity and Knowledge Graph are foundational. Question Engine is the core domain. Supporting contexts depend on published contracts, not internal models.

# MVP Integration

The Production MVP integrates the implemented Tech Club runtimes into one local-first semantic loop:

User -> Workspace -> Question -> Question Intelligence -> Semantiq -> Knowledge Graph -> Research Project -> Agent Workflow -> Community Collaboration -> Publication / Asset -> Dashboard -> Export.

## Runtime Wiring
- Core Domain provides local identity and workspace creation.
- Question Intelligence improves the question with approval.
- Semantiq produces explainable scores.
- Graph Runtime creates question and research graph nodes.
- Research Runtime creates projects, evidence, and community collaboration.
- Agent Runtime creates goals, plans workflows, executes a local workflow, stores memory, reflects, learns, and benchmarks execution.
- MVP Runtime records events, dashboard state, health descriptors, and portable export data.

## MVP Boundary
This MVP proves end-to-end local runtime integration. It intentionally avoids full cloud infrastructure and advanced UI implementation.

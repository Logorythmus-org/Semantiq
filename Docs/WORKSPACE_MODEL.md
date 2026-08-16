# Workspace Model

The Workspace Model implements semantic workspaces as reusable aggregates with owners, collaborators, projects, collections, logical folders, knowledge objects, agents, settings, templates, history, and semantic identity.

Workspaces remain local-first and storage-independent. Production persistence must implement `WorkspaceRepository` instead of coupling the domain to a database.

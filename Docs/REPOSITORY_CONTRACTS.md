# Repository Contracts

Core repository ports are storage-independent:
- `IdentityRepository`
- `WorkspaceRepository`
- `KnowledgeRepository`
- `QuestionRepository`
- `GraphRepository`
- `PermissionRepository`
- `EventRepository`

Production adapters may target PostgreSQL, Neo4j, SQLite, JSON files, memory, or future stores. Domain and application services must depend only on repository interfaces.

# Event Architecture

The Core Domain event architecture defines commands, queries, events, handlers, replay, tracing correlation, and dead-letter handling.

## Core Events
- `IdentityCreated`
- `WorkspaceCreated`
- `KnowledgeCreated`
- `KnowledgeUpdated`
- `QuestionCreated`
- `QuestionUpdated`
- `QuestionArchived`
- `PermissionGranted`
- `PermissionRevoked`
- `RelationCreated`
- `GraphUpdated`

Events are versioned and carry correlation IDs. The in-memory bus supports replay and dead-letter capture for failed handlers.

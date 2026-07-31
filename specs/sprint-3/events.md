# Sprint 3 Events

Implemented event names:
`GoalCreated`, `GoalPlanned`, `WorkflowCreated`, `WorkflowStarted`, `WorkflowPaused`, `WorkflowCompleted`, `WorkflowFailed`, `AgentRegistered`, `AgentStarted`, `AgentStopped`, `MemoryUpdated`, `ReflectionCreated`, `LearningCompleted`, `ApprovalRequested`, `ApprovalGranted`, `ApprovalRejected`.

Every event is versioned and includes timestamp, actor, workspace, correlation ID, causation ID, payload, and audit metadata.

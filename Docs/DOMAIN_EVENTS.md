# Domain Events

Domain events describe facts that have already happened. They are immutable, versioned, replayable, and auditable.

## Event Envelope
```ts
type DomainEventEnvelope<TPayload> = {
  id: string;
  type: string;
  version: number;
  occurredAt: string;
  aggregateId: string;
  aggregateType: string;
  actorId?: string;
  correlationId?: string;
  causationId?: string;
  payload: TPayload;
};
```

## Core Events

| Event | Aggregate | Payload |
| --- | --- | --- |
| QuestionCreated | Question | questionId, text, metadata, createdBy. |
| QuestionUpdated | Question | questionId, revision, changes, reason. |
| QuestionLinked | Question | sourceQuestionId, targetObjectId, relationshipType, createdBy. |
| AnswerProposed | Question | questionId, answerId, summary, confidence. |
| ObservationAdded | Question | questionId, observationId, content, provenance. |
| BenchmarkCompleted | Benchmark | benchmarkId, runId, subjectId, scores, explanation. |
| ProjectStarted | Project | projectId, sourceQuestionId, members, goals. |
| ProjectCompleted | Project | projectId, completedAt, outcomes. |
| AgentAssigned | Agent | agentId, targetObjectId, capabilities, approvalMode. |
| WorkflowExecuted | Workflow | workflowId, agentId, commandCount, resultSummary. |
| KnowledgeValidated | Knowledge Object | objectId, validationMethod, confidence. |
| ResearchPublished | Research Thread | researchId, paperId, citation, linkedQuestions. |
| NarrativeGenerated | Narrative | narrativeId, sourceQuestionId, generatedBy. |
| GameCreated | Game | gameId, sourceQuestionId, learningGoals. |
| WalletAssetCreated | Wallet Asset | assetId, ownerId, assetType, claim. |

## Event Bus Architecture
- Local events are stored and replayed inside a local event log.
- Distributed events are published only through adapters.
- Subscriptions declare event type, version, permissions, and delivery mode.
- Audit events are append-only and cannot be rewritten.
- Event streaming is a future infrastructure concern and must not leak into domain models.

## Versioning
Breaking payload changes create a new event version. Consumers must declare the versions they understand.

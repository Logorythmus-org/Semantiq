# Question Events

Question events are versioned facts published by the Social Question Network.

## Events

- QuestionCreated
- QuestionPublished
- QuestionUpdated
- EvidenceAdded
- HypothesisAdded
- ExperimentLinked
- BenchmarkCompleted
- QuestionMerged
- QuestionArchived
- QuestionVerified
- QuestionFlagged
- QuestionDiscovered

## Event Payload Shape

Every event includes id, type, version, occurredAt, questionId, actorId, correlationId, payload, and optional audit reference.

## Consumers

Profiles, graph projections, discovery, feeds, search, analytics, moderation, Semantiq integration, and workspace dashboards consume question events.

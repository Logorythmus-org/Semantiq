# Object Model

The object model defines the shared fields every core object must expose through public contracts.

## Shared Fields

```ts
type DomainObject = {
  id: string;
  type: string;
  metadata: ObjectMetadata;
  lifecycle: LifecycleState;
  permissions: PermissionRef[];
  version: VersionRef;
  relations: RelationshipRef[];
};
```

## Object Metadata

- title
- summary
- createdBy
- createdAt
- updatedAt
- tags
- provenance
- language
- visibility

## Lifecycle

Common lifecycle states are draft, active, paused, completed, archived, superseded, and deleted. Contexts may define stricter state machines.

## Permissions

Permissions are action and resource based. Public contracts should expose capability checks instead of raw policy internals.

## Versioning

Objects support revision history, change tracking, audit trail, merge, fork, restore, diff, and future collaboration metadata.

## Domain Objects

| Object            | Identity       | Lifecycle Notes                                        | Semantic Relations                      |
| ----------------- | -------------- | ------------------------------------------------------ | --------------------------------------- |
| Question          | questionId     | draft -> open -> investigating -> resolved -> archived | supports all relationship types.        |
| Answer            | answerId       | proposed -> accepted/rejected -> archived              | answer-of, supports, contradicts.       |
| Observation       | observationId  | captured -> reviewed -> linked                         | evidence-for, derived-from.             |
| Evidence          | evidenceId     | submitted -> verified/disputed -> archived             | evidence-for, contradicts, verified-by. |
| Hypothesis        | hypothesisId   | proposed -> testing -> supported/refuted               | experiment-of, supports.                |
| Experiment        | experimentId   | designed -> running -> completed -> reviewed           | verifies, contradicts.                  |
| Project           | projectId      | proposed -> active -> completed -> archived            | derived-from, depends-on.               |
| Knowledge Object  | objectId       | active -> validated -> superseded                      | any graph relation.                     |
| Repository        | repositoryId   | connected -> indexed -> stale/archived                 | source-for, derived-from.               |
| Workspace         | workspaceId    | created -> open -> closed -> archived                  | contains, depends-on.                   |
| Benchmark         | benchmarkId    | draft -> runnable -> completed                         | evaluates, verified-by.                 |
| Agent             | agentId        | registered -> assigned -> suspended                    | assigned-to.                            |
| Workflow          | workflowId     | drafted -> executable -> executed                      | depends-on.                             |
| Narrative         | narrativeId    | drafted -> generated -> revised -> published           | inspired-by, derived-from.              |
| Game              | gameId         | designed -> playable -> published                      | derived-from, learning-path-of.         |
| Wallet Asset      | assetId        | created -> claimed -> transferred/retired              | owned-by.                               |
| Semantic Identity | identityId     | active -> suspended -> archived                        | member-of, created-by.                  |
| Research Paper    | paperId        | draft -> submitted -> published                        | evidence-for, derived-from.             |
| Learning Path     | pathId         | drafted -> active -> completed                         | teaches, question-of.                   |
| Discussion        | discussionId   | open -> resolved -> archived                           | discusses.                              |
| Community         | communityId    | forming -> active -> archived                          | parent, child.                          |
| Tag               | tagId          | proposed -> accepted -> deprecated                     | classifies.                             |
| Relationship      | relationshipId | proposed -> accepted -> archived                       | links source and target.                |

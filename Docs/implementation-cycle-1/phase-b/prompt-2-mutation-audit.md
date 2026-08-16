# Phase B Prompt 2 Mutation and History Audit

| Artifact                                    | Current behavior                                          | Coverage/consumer                | Decision                  | Risk                                                       |
| ------------------------------------------- | --------------------------------------------------------- | -------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `packages/questions/src/index.ts`           | Prompt 1 immutable `published` Question, version 1        | Prompt 1 unit/API/database tests | ADAPT                     | Must preserve create/get contracts                         |
| `packages/persistence/src/questions.ts`     | Add/get plus outbox/idempotency transaction               | Real PostgreSQL tests            | ADAPT                     | Add compare-and-swap without repository commits            |
| `packages/persistence/src/migrations.ts`    | Migration 2 has `status = 'published'` and version column | Migration runner/real tests      | MIGRATE                   | Preserve existing rows and one head                        |
| `services/api/src/server.ts`                | Explicit create/get routes and stable envelopes           | API tests                        | ADAPT                     | Mutation identity must come from request context           |
| `packages/core/src/application/services.ts` | Direct archive by object spread and save                  | Historical core consumers        | DEPRECATE for new runtime | No revision, CAS, actor enforcement, or outbox atomicity   |
| `packages/core/src/domain/models.ts`        | Separate draft/open/researching/answered/archived model   | Historical core tests            | KEEP as compatibility     | Status vocabulary conflicts with Prompt 1 runtime          |
| `packages/question-network/src/index.ts`    | In-memory transition and archive behavior                 | Question-network package         | KEEP out of scope         | Belongs to future graph/network runtime                    |
| `packages/question-engine/src/index.ts`     | Separate status union including archived                  | Legacy interface                 | KEEP as legacy            | Not persistence-backed or authoritative                    |
| `outbox_events`                             | Versioned durable event rows                              | Persistence tests                | REUSE                     | Mutation payloads must exclude full text                   |
| `idempotency_records`                       | Scoped hashed keys and stored response                    | Create tests                     | REUSE                     | Mutation fingerprints must include operation/version/actor |

No authoritative revision table, revision repository, optimistic save, update handler, archive/restore handler, or revision-history endpoint exists. Permanent deletion and graph relationships remain outside this sprint.

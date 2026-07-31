import { performance } from "node:perf_hooks";
import { createApiApplication } from "../services/api/src/index.js";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionRelationUnitOfWork,
  PostgresQuestionSemanticUnitOfWork,
  PostgresQuestionUnitOfWork
} from "../packages/persistence/src/index.js";
import {
  createQuestionApplication,
  createQuestionRelationApplication,
  createQuestionSemanticApplication,
  Question
} from "../packages/questions/src/index.js";
import { FixedClock, UuidGenerator } from "../packages/shared/src/index.js";

if (process.env.QUESTION_BENCHMARK_ALLOW_RESET !== "1")
  throw new Error("Set QUESTION_BENCHMARK_ALLOW_RESET=1 for an isolated benchmark database");

const connectionString =
  process.env.QUESTION_BENCHMARK_DATABASE_URL ??
  "postgresql://techclub:techclub@localhost:5432/techclub";
const pool = createPostgresPool({
  connectionString,
  max: 10,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000
});
await migrate(pool);
await pool.query(
  "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
);

const ids = new UuidGenerator();
const application = createQuestionApplication({
  ids,
  createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
});
const relationApplication = createQuestionRelationApplication({
  ids,
  createUnitOfWork: () => new PostgresQuestionRelationUnitOfWork(pool)
});
const semanticApplication = createQuestionSemanticApplication({
  ids,
  createUnitOfWork: () => new PostgresQuestionSemanticUnitOfWork(pool)
});
const owner = "benchmark-owner";

const aggregate = Question.create({
  id: ids.generate(),
  text: "How quickly can an aggregate create a complete Question revision?",
  language: "en",
  creatorId: owner,
  correlationId: "benchmark-aggregate",
  clock: new FixedClock(new Date("2026-01-01T00:00:00Z"))
});
aggregate.pullEvents();
const aggregateStarted = performance.now();
const aggregateMutation = aggregate.updateText({
  text: "How quickly can an aggregate create a complete immutable Question revision?",
  expectedVersion: 1,
  actorId: owner,
  revisionId: ids.generate(),
  correlationId: "benchmark-aggregate-update",
  clock: new FixedClock(new Date("2026-01-01T00:00:01Z"))
});
const aggregateUpdateAndRevisionMs = performance.now() - aggregateStarted;
const revisionViewStarted = performance.now();
aggregateMutation.revision.view();
const revisionViewMs = performance.now() - revisionViewStarted;

async function createQuestion(label: string) {
  const result = await application.create({
    text: `How should benchmark Question ${label} preserve deterministic history?`,
    language: "en",
    creatorId: owner,
    correlationId: `benchmark-create-${label}`
  });
  if (!result.ok) throw new Error(`Benchmark Question creation failed: ${result.error.code}`);
  return result.value;
}

const casQuestion = await createQuestion("cas");
const casUnit = new PostgresQuestionUnitOfWork(pool);
await casUnit.begin();
const casAggregate = await casUnit.questions.getById(casQuestion.id);
if (!casAggregate) throw new Error("CAS benchmark Question missing");
casAggregate.updateText({
  text: "How quickly does the optimistic compare-and-swap query complete?",
  expectedVersion: 1,
  actorId: owner,
  revisionId: ids.generate(),
  correlationId: "benchmark-cas"
});
const casStarted = performance.now();
await casUnit.questions.saveWithExpectedVersion(casAggregate, 1);
const optimisticUpdateQueryMs = performance.now() - casStarted;
await casUnit.rollback();

const revisionQuestion = await createQuestion("revision-insert");
const revisionUnit = new PostgresQuestionUnitOfWork(pool);
await revisionUnit.begin();
const revisionAggregate = await revisionUnit.questions.getById(revisionQuestion.id);
if (!revisionAggregate) throw new Error("Revision benchmark Question missing");
const revisionMutation = revisionAggregate.updateText({
  text: "How quickly does an immutable revision insert complete in PostgreSQL?",
  expectedVersion: 1,
  actorId: owner,
  revisionId: ids.generate(),
  correlationId: "benchmark-revision-insert"
});
await revisionUnit.questions.saveWithExpectedVersion(revisionAggregate, 1);
const revisionInsertStarted = performance.now();
await revisionUnit.revisions.add(revisionMutation.revision);
const revisionInsertMs = performance.now() - revisionInsertStarted;
await revisionUnit.rollback();

const transactionQuestion = await createQuestion("transaction");
const updateTransaction = await timed(() =>
  application.update({
    questionId: transactionQuestion.id,
    text: "How quickly can update, revision, outbox, and commit complete atomically?",
    expectedVersion: 1,
    actorId: owner,
    correlationId: "benchmark-update-transaction"
  })
);
const archiveTransaction = await timed(() =>
  application.archive({
    questionId: transactionQuestion.id,
    expectedVersion: 2,
    actorId: owner,
    correlationId: "benchmark-archive-transaction"
  })
);
const restoreTransaction = await timed(() =>
  application.restore({
    questionId: transactionQuestion.id,
    expectedVersion: 3,
    actorId: owner,
    correlationId: "benchmark-restore-transaction"
  })
);

async function historyLatency(revisionCount: number): Promise<number> {
  const value = await createQuestion(`history-${revisionCount}`);
  for (let index = 1; index <= revisionCount; index += 1) {
    const result = await application.update({
      questionId: value.id,
      text: `How should history benchmark ${revisionCount} preserve revision number ${index}?`,
      expectedVersion: index,
      actorId: owner,
      correlationId: `benchmark-history-${revisionCount}-${index}`
    });
    if (!result.ok) throw new Error(`History seed failed: ${result.error.code}`);
  }
  return (
    await timed(() =>
      application.revisions({
        questionId: value.id,
        actorId: owner,
        correlationId: `benchmark-history-read-${revisionCount}`
      })
    )
  ).milliseconds;
}

const history1Ms = await historyLatency(1);
const history10Ms = await historyLatency(10);
const history100Ms = await historyLatency(100);

const relationSource = await createQuestion("relation-source");
const relationTarget = await createQuestion("relation-target");
const relationCreate = await timed(() =>
  relationApplication.create({
    sourceQuestionId: relationSource.id,
    targetQuestionId: relationTarget.id,
    type: "refines",
    actorId: owner,
    correlationId: "benchmark-relation-create"
  })
);
if (!relationCreate.value.ok)
  throw new Error(`Relation benchmark failed: ${relationCreate.value.error.code}`);

const graphRoot = await createQuestion("graph-root");
for (let index = 1; index <= 99; index += 1) {
  const target = await createQuestion(`graph-target-${index}`);
  const result = await relationApplication.create({
    sourceQuestionId: graphRoot.id,
    targetQuestionId: target.id,
    type: "connects",
    actorId: owner,
    correlationId: `benchmark-graph-relation-${index}`
  });
  if (!result.ok) throw new Error(`Graph benchmark seed failed: ${result.error.code}`);
}

async function relationListLatency(limit: number): Promise<number> {
  return (
    await timed(() =>
      relationApplication.list({
        questionId: graphRoot.id,
        limit,
        correlationId: `benchmark-relation-list-${limit}`
      })
    )
  ).milliseconds;
}

const relationList1Ms = await relationListLatency(1);
const relationList10Ms = await relationListLatency(10);
const relationList100Ms = await relationListLatency(100);
const graphDepth1Ms = (
  await timed(() =>
    relationApplication.graph({
      questionId: graphRoot.id,
      depth: 1,
      maxNodes: 100,
      correlationId: "benchmark-graph-depth-1"
    })
  )
).milliseconds;

const semanticQuestion = await createQuestion("semantic-structure");
const semanticStructure = {
  context: ["An isolated local benchmark environment."],
  assumptions: ["The caller explicitly supplied every statement."],
  constraints: ["No external semantic service is involved."],
  unknowns: ["How will downstream consumers use this structure?"],
  uncertainty: {
    level: "medium" as const,
    statements: ["Future consumer behavior is not yet measured."]
  },
  scope: {
    inclusions: ["Question Runtime transaction latency"],
    exclusions: ["Semantic quality evaluation"]
  },
  perspectives: ["Question creator"],
  openPossibilities: ["Semantiq consumption"]
};
const semanticCreate = await timed(() =>
  semanticApplication.put({
    questionId: semanticQuestion.id,
    expectedVersion: 0,
    structure: semanticStructure,
    actorId: owner,
    correlationId: "benchmark-semantic-create"
  })
);
if (!semanticCreate.value.ok)
  throw new Error(`Semantic create benchmark failed: ${semanticCreate.value.error.code}`);
const semanticUpdate = await timed(() =>
  semanticApplication.put({
    questionId: semanticQuestion.id,
    expectedVersion: 1,
    structure: {
      ...semanticStructure,
      openPossibilities: ["Semantiq consumption", "Research planning"]
    },
    actorId: owner,
    correlationId: "benchmark-semantic-update"
  })
);
if (!semanticUpdate.value.ok)
  throw new Error(`Semantic update benchmark failed: ${semanticUpdate.value.error.code}`);
const semanticRead = await timed(() =>
  semanticApplication.get({
    questionId: semanticQuestion.id,
    correlationId: "benchmark-semantic-read"
  })
);
const semanticHistory = await timed(() =>
  semanticApplication.revisions({
    questionId: semanticQuestion.id,
    actorId: owner,
    correlationId: "benchmark-semantic-history"
  })
);

const api = createApiApplication({
  listenPort: 0,
  questionApplication: application,
  questionRelationApplication: relationApplication,
  questionSemanticApplication: semanticApplication
});
await api.start();
const address = api.server.address();
if (!address || typeof address === "string") throw new Error("Benchmark API did not bind");
const base = `http://127.0.0.1:${address.port}/api/v1/questions`;
const apiHeaders = { "content-type": "application/json", "x-actor-id": owner };
const apiCreated = await fetch(base, {
  method: "POST",
  headers: apiHeaders,
  body: JSON.stringify({
    text: "How quickly can the Question mutation API complete its lifecycle?",
    language: "en"
  })
});
const apiQuestion = (await apiCreated.json()) as { data: { id: string } };
const patchLatency = await timedFetch(`${base}/${apiQuestion.data.id}`, {
  method: "PATCH",
  headers: apiHeaders,
  body: JSON.stringify({
    text: "How quickly can the Question PATCH endpoint commit a revision?",
    expectedVersion: 1
  })
});
const conflictLatency = await timedFetch(`${base}/${apiQuestion.data.id}`, {
  method: "PATCH",
  headers: apiHeaders,
  body: JSON.stringify({
    text: "How quickly can a stale Question PATCH request be rejected?",
    expectedVersion: 1
  })
});
const archiveLatency = await timedFetch(`${base}/${apiQuestion.data.id}/archive`, {
  method: "POST",
  headers: apiHeaders,
  body: JSON.stringify({ expectedVersion: 2 })
});
const restoreLatency = await timedFetch(`${base}/${apiQuestion.data.id}/restore`, {
  method: "POST",
  headers: apiHeaders,
  body: JSON.stringify({ expectedVersion: 3 })
});
const historyApiLatency = await timedFetch(`${base}/${apiQuestion.data.id}/revisions`, {
  headers: { "x-actor-id": owner }
});
const apiRelationTargetResponse = await fetch(base, {
  method: "POST",
  headers: apiHeaders,
  body: JSON.stringify({
    text: "How quickly can the relation API connect this target Question?",
    language: "en"
  })
});
const apiRelationTarget = (await apiRelationTargetResponse.json()) as { data: { id: string } };
const relationApiLatency = await timedFetch(`${base}/${apiQuestion.data.id}/relations`, {
  method: "POST",
  headers: apiHeaders,
  body: JSON.stringify({
    targetQuestionId: apiRelationTarget.data.id,
    type: "connects"
  })
});
const relationListApiLatency = await timedFetch(
  `${base}/${apiQuestion.data.id}/relations?limit=25`
);
const graphApiLatency = await timedFetch(`${base}/${apiQuestion.data.id}/graph?depth=1`);
const semanticCreateApiLatency = await timedFetch(
  `${base}/${apiQuestion.data.id}/semantic-structure`,
  {
    method: "PUT",
    headers: apiHeaders,
    body: JSON.stringify({ expectedVersion: 0, ...semanticStructure })
  }
);
const semanticUpdateApiLatency = await timedFetch(
  `${base}/${apiQuestion.data.id}/semantic-structure`,
  {
    method: "PUT",
    headers: apiHeaders,
    body: JSON.stringify({
      expectedVersion: 1,
      ...semanticStructure,
      perspectives: ["Question creator", "Future runtime consumer"]
    })
  }
);
const semanticReadApiLatency = await timedFetch(
  `${base}/${apiQuestion.data.id}/semantic-structure`
);
const semanticHistoryApiLatency = await timedFetch(
  `${base}/${apiQuestion.data.id}/semantic-structure/revisions`,
  { headers: { "x-actor-id": owner } }
);

console.log(
  JSON.stringify(
    {
      aggregateUpdateAndRevisionMs,
      revisionViewMs,
      optimisticUpdateQueryMs,
      revisionInsertMs,
      updateRevisionOutboxCommitMs: updateTransaction.milliseconds,
      archiveTransactionMs: archiveTransaction.milliseconds,
      restoreTransactionMs: restoreTransaction.milliseconds,
      history1Ms,
      history10Ms,
      history100Ms,
      relationCreateTransactionMs: relationCreate.milliseconds,
      relationList1Ms,
      relationList10Ms,
      relationList100Ms,
      graphDepth1Nodes100Ms: graphDepth1Ms,
      semanticCreateTransactionMs: semanticCreate.milliseconds,
      semanticUpdateRevisionOutboxCommitMs: semanticUpdate.milliseconds,
      semanticReadMs: semanticRead.milliseconds,
      semanticHistory1Ms: semanticHistory.milliseconds,
      patchApiMs: patchLatency.milliseconds,
      archiveApiMs: archiveLatency.milliseconds,
      restoreApiMs: restoreLatency.milliseconds,
      historyApiMs: historyApiLatency.milliseconds,
      conflictApiMs: conflictLatency.milliseconds,
      relationCreateApiMs: relationApiLatency.milliseconds,
      relationListApiMs: relationListApiLatency.milliseconds,
      graphApiMs: graphApiLatency.milliseconds,
      semanticCreateApiMs: semanticCreateApiLatency.milliseconds,
      semanticUpdateApiMs: semanticUpdateApiLatency.milliseconds,
      semanticReadApiMs: semanticReadApiLatency.milliseconds,
      semanticHistoryApiMs: semanticHistoryApiLatency.milliseconds,
      apiStatuses: {
        patch: patchLatency.status,
        archive: archiveLatency.status,
        restore: restoreLatency.status,
        history: historyApiLatency.status,
        conflict: conflictLatency.status,
        relationCreate: relationApiLatency.status,
        relationList: relationListApiLatency.status,
        graph: graphApiLatency.status,
        semanticCreate: semanticCreateApiLatency.status,
        semanticUpdate: semanticUpdateApiLatency.status,
        semanticRead: semanticReadApiLatency.status,
        semanticHistory: semanticHistoryApiLatency.status
      }
    },
    null,
    2
  )
);

await api.stop();
await pool.end();

async function timed<T>(work: () => Promise<T>): Promise<{ value: T; milliseconds: number }> {
  const started = performance.now();
  const value = await work();
  return { value, milliseconds: performance.now() - started };
}

async function timedFetch(
  url: string,
  init?: RequestInit
): Promise<{ milliseconds: number; status: number }> {
  const started = performance.now();
  const response = await fetch(url, init);
  await response.arrayBuffer();
  return { milliseconds: performance.now() - started, status: response.status };
}

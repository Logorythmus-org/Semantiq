import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionRelationUnitOfWork,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  createQuestionApplication,
  createQuestionRelationApplication
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

suite("PostgreSQL Question relation API", () => {
  let pool: SqlPool;
  let api: ApiApplication;
  let base: string;

  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
    const questionApplication = createQuestionApplication({
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const questionRelationApplication = createQuestionRelationApplication({
      createUnitOfWork: () => new PostgresQuestionRelationUnitOfWork(pool)
    });
    api = createApiApplication({
      listenPort: 0,
      questionApplication,
      questionRelationApplication
    });
    await api.start();
    const address = api.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    base = `http://127.0.0.1:${address.port}/api/v1/questions`;
  });

  afterAll(async () => {
    await api.stop();
    await pool.end();
  });

  it("persists and reads a graph through the real HTTP and PostgreSQL path", async () => {
    const sourceResponse = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "real-api-owner-a" },
      body: JSON.stringify({
        text: "How does the real API write a Question relation?",
        language: "en"
      })
    });
    const targetResponse = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "real-api-owner-b" },
      body: JSON.stringify({
        text: "How does PostgreSQL make that relation navigable?",
        language: "en"
      })
    });
    const source = ((await sourceResponse.json()) as { data: { id: string } }).data.id;
    const target = ((await targetResponse.json()) as { data: { id: string } }).data.id;
    const relation = await fetch(`${base}/${source}/relations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "real-api-owner-a",
        "idempotency-key": "real-api-relation-key"
      },
      body: JSON.stringify({ targetQuestionId: target, type: "connects" })
    });
    expect(relation.status).toBe(201);
    const graph = await fetch(`${base}/${target}/graph?direction=incoming&depth=1`);
    expect(graph.status).toBe(200);
    const graphBody = (await graph.json()) as {
      data: {
        rootQuestionId: string;
        nodes: { id: string }[];
        relations: { sourceQuestionId: string; targetQuestionId: string; type: string }[];
      };
    };
    expect(graphBody.data.rootQuestionId).toBe(target);
    expect(graphBody.data.nodes.map((node) => node.id).sort()).toEqual([source, target].sort());
    expect(graphBody.data.relations).toHaveLength(1);
    expect(graphBody.data.relations[0]).toMatchObject({
      sourceQuestionId: source,
      targetQuestionId: target,
      type: "connects"
    });
    const counts = await pool.query<{ relations: string; events: string }>(
      "SELECT (SELECT COUNT(*) FROM question_relations)::text AS relations,(SELECT COUNT(*) FROM outbox_events WHERE event_type='question.relation.created')::text AS events"
    );
    expect(counts.rows[0]).toEqual({ relations: "1", events: "1" });
  });
});

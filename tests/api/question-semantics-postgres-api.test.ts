import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionSemanticUnitOfWork,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  createQuestionApplication,
  createQuestionSemanticApplication
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

suite("PostgreSQL Question semantic API", () => {
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
    const questionSemanticApplication = createQuestionSemanticApplication({
      createUnitOfWork: () => new PostgresQuestionSemanticUnitOfWork(pool)
    });
    api = createApiApplication({
      listenPort: 0,
      questionApplication,
      questionSemanticApplication
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

  it("persists and reads semantic structure through the real HTTP and PostgreSQL path", async () => {
    const questionResponse = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-real-owner" },
      body: JSON.stringify({
        text: "How does the real API preserve explicit semantic context?",
        language: "en"
      })
    });
    const questionId = ((await questionResponse.json()) as { data: { id: string } }).data.id;
    const structure = {
      expectedVersion: 0,
      context: ["A real HTTP request backed by PostgreSQL."],
      assumptions: ["The caller intentionally supplied every statement."],
      constraints: ["No semantic inference occurs."],
      unknowns: ["Which consumer will subscribe to the event?"],
      uncertainty: {
        level: "low",
        statements: ["The first consumer has not been selected."]
      },
      scope: {
        inclusions: ["Question Runtime persistence"],
        exclusions: ["Semantiq evaluation"]
      },
      perspectives: ["Question creator"],
      openPossibilities: ["Research Runtime consumption"]
    };
    const created = await fetch(`${base}/${questionId}/semantic-structure`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "semantic-real-owner",
        "idempotency-key": "semantic-real-api-key"
      },
      body: JSON.stringify(structure)
    });
    expect(created.status).toBe(201);
    const read = await fetch(`${base}/${questionId}/semantic-structure`);
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({
      data: {
        questionId,
        context: ["A real HTTP request backed by PostgreSQL."],
        version: 1
      }
    });
    const counts = await pool.query<{ structures: string; events: string; keys: string }>(
      "SELECT (SELECT COUNT(*) FROM question_semantic_structures)::text AS structures,(SELECT COUNT(*) FROM outbox_events WHERE event_type='question.semantic_structure.created')::text AS events,(SELECT COUNT(*) FROM idempotency_records WHERE scope='question.semantic_structure.put')::text AS keys"
    );
    expect(counts.rows[0]).toEqual({ structures: "1", events: "1", keys: "1" });
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApiApplication } from "../../services/api/src/index.js";
import { createQuestionApplication } from "../../packages/questions/src/index.js";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import { FixedClock, UuidGenerator } from "../../packages/shared/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

suite("Question API with real PostgreSQL", () => {
  let pool: SqlPool;
  let application: ReturnType<typeof createApiApplication>;
  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
    const questionApplication = createQuestionApplication({
      ids: new UuidGenerator(),
      clock: new FixedClock(new Date("2026-01-01T00:00:00Z")),
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    application = createApiApplication({ listenPort: 0, questionApplication });
    await application.start();
  });
  afterAll(async () => {
    await application.stop();
    await pool.end();
  });

  it("creates and retrieves a persisted question", async () => {
    const address = application.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind");
    const created = await fetch(`http://127.0.0.1:${address.port}/api/v1/questions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "postgres-question-1",
        "x-correlation-id": "postgres-question-correlation",
        "x-actor-id": "postgres-api-owner"
      },
      body: JSON.stringify({ text: "How can uncertainty improve learning?", language: "en" })
    });
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as { data: { id: string } };
    const retrieved = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${createdBody.data.id}`
    );
    expect(retrieved.status).toBe(200);
    expect(
      ((await retrieved.json()) as { data: { id: string; status: string } }).data
    ).toMatchObject({ id: createdBody.data.id, status: "published" });

    const updated = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${createdBody.data.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-actor-id": "postgres-api-owner",
          "idempotency-key": "postgres-update-1"
        },
        body: JSON.stringify({
          text: "Wie kann Unsicherheit das Lernen in persistenten Systemen verbessern?",
          expectedVersion: 1
        })
      }
    );
    expect(updated.status).toBe(200);
    const archived = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${createdBody.data.id}/archive`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-actor-id": "postgres-api-owner" },
        body: JSON.stringify({ expectedVersion: 2 })
      }
    );
    expect(archived.status).toBe(200);
    const restored = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${createdBody.data.id}/restore`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-actor-id": "postgres-api-owner" },
        body: JSON.stringify({ expectedVersion: 3 })
      }
    );
    expect(restored.status).toBe(200);
    const history = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${createdBody.data.id}/revisions`,
      { headers: { "x-actor-id": "postgres-api-owner" } }
    );
    expect(history.status).toBe(200);
    expect(
      ((await history.json()) as { data: { currentVersion: number; revisions: unknown[] } }).data
    ).toMatchObject({ currentVersion: 4, revisions: [{}, {}, {}] });
  });
});

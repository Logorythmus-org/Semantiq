import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionReadRepository,
  PostgresQuestionRelationUnitOfWork,
  PostgresQuestionSemanticUnitOfWork,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  createQuestionApplication,
  createQuestionDiscoveryApplication,
  createQuestionRelationApplication,
  createQuestionSemanticApplication,
  type QuestionApplication,
  type QuestionRelationApplication,
  type QuestionSemanticApplication
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

suite("PostgreSQL Question discovery API", () => {
  let pool: SqlPool;
  let api: ApiApplication;
  let base: string;
  let questions: QuestionApplication;
  let semantics: QuestionSemanticApplication;
  let relations: QuestionRelationApplication;

  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
    questions = createQuestionApplication({
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    semantics = createQuestionSemanticApplication({
      createUnitOfWork: () => new PostgresQuestionSemanticUnitOfWork(pool)
    });
    relations = createQuestionRelationApplication({
      createUnitOfWork: () => new PostgresQuestionRelationUnitOfWork(pool)
    });
    api = createApiApplication({
      listenPort: 0,
      questionApplication: questions,
      questionSemanticApplication: semantics,
      questionRelationApplication: relations,
      questionDiscoveryApplication: createQuestionDiscoveryApplication({
        repository: new PostgresQuestionReadRepository(pool)
      })
    });
    await api.start();
    const address = api.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    base = `http://127.0.0.1:${address.port}/api/v1/questions`;
  });

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
  });

  afterAll(async () => {
    await api.stop();
    await pool.end();
  });

  it("serves multilingual database search and transactional update synchronization", async () => {
    const english = await createQuestion(
      "How does architecture support current Question discovery?",
      "en",
      "pg-api-owner"
    );
    const german = await createQuestion(
      "Wie unterstützt Architektur die Suche nach einer Frage?",
      "de",
      "pg-api-owner"
    );
    const persian = await createQuestion(
      "چگونه پرسش معماری و عدم قطعیت پیدا می‌شود؟",
      "fa",
      "pg-api-fa-owner"
    );
    expect(await resultIds("?q=architecture")).toEqual([english]);
    expect(await resultIds("?q=ARCHITEKTUR")).toEqual([german]);
    expect(await resultIds("?q=پرسش")).toEqual([persian]);

    const updated = await fetch(`${base}/${english}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-actor-id": "pg-api-owner" },
      body: JSON.stringify({
        text: "How does adaptive reasoning support current Question discovery?",
        expectedVersion: 1
      })
    });
    expect(updated.status).toBe(200);
    expect(await resultIds("?q=architecture")).toEqual([]);
    expect(await resultIds("?q=adaptive%20reasoning")).toEqual([english]);
    const revisions = await pool.query<{ previous_text: string }>(
      "SELECT previous_text FROM question_revisions WHERE question_id=$1",
      [english]
    );
    expect(revisions.rows[0]?.previous_text).toContain("architecture");
  });

  it("composes Frame and one-hop relation filters through real HTTP", async () => {
    const source = await createQuestion(
      "Which framed Question starts a related discovery path?",
      "en",
      "pg-structured-owner"
    );
    const target = await createQuestion(
      "Which target Question refines the framed source?",
      "en",
      "pg-structured-owner"
    );
    const frame = await semantics.put({
      questionId: source,
      expectedVersion: 0,
      structure: {
        context: ["A real PostgreSQL API flow."],
        assumptions: ["The client supplied every statement."],
        constraints: ["Search remains relational."],
        unknowns: ["Which path will be selected?"],
        uncertainty: { level: "high", statements: ["Client behavior remains unknown."] },
        scope: { inclusions: ["Discovery"], exclusions: ["Ranking"] },
        perspectives: ["API client"],
        openPossibilities: ["A future provider"]
      },
      actorId: "pg-structured-owner",
      correlationId: "pg-api-frame"
    });
    if (!frame.ok) throw new Error(frame.error.code);
    const relation = await relations.create({
      sourceQuestionId: source,
      targetQuestionId: target,
      type: "refines",
      actorId: "pg-structured-owner",
      correlationId: "pg-api-relation"
    });
    if (!relation.ok) throw new Error(relation.error.code);

    expect(await resultIds("?has_frame=true&has_assumptions=true&uncertainty_type=high")).toEqual([
      source
    ]);
    expect(
      await resultIds(
        `?related_to_question_id=${source}&relation_type=refines&relation_direction=outgoing`
      )
    ).toEqual([target]);
    const detail = await fetch(`${base}/${source}/detail`);
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({
      data: { id: source, frame: { stale: false }, relations: { count: 1 } }
    });
  });

  it("keeps archived text private from default search and re-includes it after restore", async () => {
    const id = await createQuestion(
      "Why should a temporary archive disappear from discovery?",
      "en",
      "pg-lifecycle-owner"
    );
    expect(await resultIds("?q=temporary%20archive")).toEqual([id]);
    expect(
      await questions.archive({
        questionId: id,
        expectedVersion: 1,
        actorId: "pg-lifecycle-owner",
        correlationId: "pg-api-archive"
      })
    ).toMatchObject({ ok: true });
    expect(await resultIds("?q=temporary%20archive")).toEqual([]);
    expect(await resultIds("?q=temporary%20archive&status=archived")).toEqual([id]);
    expect(
      await questions.restore({
        questionId: id,
        expectedVersion: 2,
        actorId: "pg-lifecycle-owner",
        correlationId: "pg-api-restore"
      })
    ).toMatchObject({ ok: true });
    expect(await resultIds("?q=temporary%20archive")).toEqual([id]);
  });

  async function createQuestion(text: string, language: string, actorId: string): Promise<string> {
    const response = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": actorId },
      body: JSON.stringify({ text, language })
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { data: { id: string } }).data.id;
  }

  async function resultIds(query: string): Promise<readonly string[]> {
    const response = await fetch(`${base}${query}`);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { data: { items: Array<{ id: string }> } };
    return body.data.items.map((item) => item.id);
  }
});

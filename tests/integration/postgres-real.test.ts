import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  initialMigration,
  migrate,
  migrations,
  PostgresQuestionUnitOfWork,
  PostgresUnitOfWork,
  questionMigration,
  SystemMetadataRepository,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import { createQuestionApplication } from "../../packages/questions/src/index.js";
import { FixedClock, UuidGenerator } from "../../packages/shared/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

suite("real PostgreSQL persistence", () => {
  let pool: SqlPool;
  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, system_metadata, outbox_events, idempotency_records CASCADE"
    );
  });
  afterAll(async () => {
    await pool.end();
  });

  it("round-trips a metadata record through the repository", async () => {
    const repository = new SystemMetadataRepository(pool);
    const value = {
      id: "real-test",
      value: { correlationId: "corr-real", version: 1 },
      updatedAt: new Date()
    };
    await repository.add(value);
    expect(await repository.exists(value.id)).toBe(true);
    expect((await repository.getById(value.id))?.value).toEqual(value.value);
    await repository.update({ ...value, value: { correlationId: "corr-real", version: 2 } });
    expect((await repository.getById(value.id))?.value).toEqual({
      correlationId: "corr-real",
      version: 2
    });
    await repository.remove(value.id);
    expect(await repository.exists(value.id)).toBe(false);
  });

  it("commits and rolls back through the real unit of work", async () => {
    const committed = new PostgresUnitOfWork(pool);
    await committed.begin();
    await committed.metadata.add({ id: "committed", value: { ok: true }, updatedAt: new Date() });
    await committed.commit();
    expect(await new SystemMetadataRepository(pool).exists("committed")).toBe(true);

    const rolledBack = new PostgresUnitOfWork(pool);
    await rolledBack.begin();
    await rolledBack.metadata.add({
      id: "rolled-back",
      value: { ok: false },
      updatedAt: new Date()
    });
    await rolledBack.rollback();
    expect(await new SystemMetadataRepository(pool).exists("rolled-back")).toBe(false);
  });

  it("commits domain metadata and outbox rows together", async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO system_metadata (key, value) VALUES ($1, $2)", [
        "outbox-domain",
        { ok: true }
      ]);
      await client.query(
        "INSERT INTO outbox_events (event_id, event_type, payload, schema_version, occurred_at, correlation_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          "00000000-0000-0000-0000-000000000001",
          "test.created",
          { ok: true },
          1,
          new Date(),
          "corr-outbox"
        ]
      );
      await client.query("COMMIT");
    } finally {
      client.release();
    }
    const result = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM outbox_events WHERE correlation_id = $1",
      ["corr-outbox"]
    );
    expect(result.rows[0]?.count).toBe("1");
  });

  it("creates and retrieves a question with a real repository and outbox", async () => {
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
    const application = createQuestionApplication({
      ids: new UuidGenerator(),
      clock: new FixedClock(new Date("2026-01-01T00:00:00Z")),
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const created = await application.create({
      text: "How can uncertainty improve learning?",
      language: "en",
      creatorId: "real-owner-1",
      correlationId: "question-real-correlation",
      idempotencyKey: "question-real-key"
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("question creation failed");
    const retrieved = await application.get({
      questionId: created.value.id,
      correlationId: "question-read"
    });
    expect(retrieved).toMatchObject({
      ok: true,
      value: { id: created.value.id, status: "published" }
    });
    const counts = await pool.query<{ questions: string; events: string; keys: string }>(
      "SELECT (SELECT COUNT(*) FROM questions)::text AS questions, (SELECT COUNT(*) FROM outbox_events WHERE event_type='question.created')::text AS events, (SELECT COUNT(*) FROM idempotency_records WHERE scope='question.create')::text AS keys"
    );
    expect(counts.rows[0]).toEqual({ questions: "1", events: "1", keys: "1" });
  });

  it("persists update, archive, restore, revisions, and events atomically", async () => {
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
    const application = createQuestionApplication({
      ids: new UuidGenerator(),
      clock: new FixedClock(new Date("2026-02-01T00:00:00Z")),
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const created = await application.create({
      text: "How should persistent Questions preserve every meaningful change?",
      language: "en",
      creatorId: "real-owner-1",
      correlationId: "real-create"
    });
    if (!created.ok) throw new Error("question creation failed");
    const updated = await application.update({
      questionId: created.value.id,
      text: "Wie sollten persistente Fragen jede bedeutsame Änderung bewahren?",
      expectedVersion: 1,
      actorId: "real-owner-1",
      idempotencyKey: "real-update-key-1",
      correlationId: "real-update"
    });
    expect(updated).toMatchObject({ ok: true, value: { version: 2 } });
    expect(
      await application.update({
        questionId: created.value.id,
        text: "Wie sollten persistente Fragen jede bedeutsame Änderung bewahren?",
        expectedVersion: 1,
        actorId: "real-owner-1",
        idempotencyKey: "real-update-key-1",
        correlationId: "real-update-replay"
      })
    ).toEqual(updated);
    expect(
      await application.archive({
        questionId: created.value.id,
        expectedVersion: 2,
        actorId: "real-owner-1",
        correlationId: "real-archive"
      })
    ).toMatchObject({ ok: true, value: { version: 3, status: "archived" } });
    expect(
      await application.restore({
        questionId: created.value.id,
        expectedVersion: 3,
        actorId: "real-owner-1",
        correlationId: "real-restore"
      })
    ).toMatchObject({ ok: true, value: { version: 4, status: "published" } });
    const history = await application.revisions({
      questionId: created.value.id,
      actorId: "real-owner-1",
      correlationId: "real-history"
    });
    expect(history).toMatchObject({
      ok: true,
      value: {
        currentVersion: 4,
        revisions: [
          { version: 2, changeType: "updated" },
          { version: 3, changeType: "archived" },
          { version: 4, changeType: "restored" }
        ]
      }
    });
    const counts = await pool.query<{ revisions: string; events: string; keys: string }>(
      "SELECT (SELECT COUNT(*) FROM question_revisions)::text AS revisions, (SELECT COUNT(*) FROM outbox_events WHERE event_type IN ('question.updated','question.archived','question.restored'))::text AS events, (SELECT COUNT(*) FROM idempotency_records WHERE scope LIKE 'question.%')::text AS keys"
    );
    expect(counts.rows[0]).toEqual({ revisions: "3", events: "3", keys: "1" });
    await expect(
      pool.query("UPDATE question_revisions SET reason='tampered' WHERE question_id=$1", [
        created.value.id
      ])
    ).rejects.toThrow(/immutable/);
  });

  it("rejects concurrent stale writes and rolls back all mutation records", async () => {
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
    const application = createQuestionApplication({
      ids: new UuidGenerator(),
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const created = await application.create({
      text: "How should concurrent Question updates avoid lost writes?",
      language: "en",
      creatorId: "real-owner-1",
      correlationId: "concurrent-create"
    });
    if (!created.ok) throw new Error("question creation failed");
    const results = await Promise.all([
      application.update({
        questionId: created.value.id,
        text: "How should the first concurrent update become authoritative?",
        expectedVersion: 1,
        actorId: "real-owner-1",
        correlationId: "concurrent-one"
      }),
      application.update({
        questionId: created.value.id,
        text: "How should the second concurrent update detect a conflict?",
        expectedVersion: 1,
        actorId: "real-owner-1",
        correlationId: "concurrent-two"
      })
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.filter((result) => !result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok)).toMatchObject({
      error: { code: "question_version_conflict" }
    });
    const committed = await pool.query<{ version: number; revisions: string; events: string }>(
      "SELECT q.version, (SELECT COUNT(*) FROM question_revisions WHERE question_id=q.id)::text AS revisions, (SELECT COUNT(*) FROM outbox_events WHERE aggregate_id=q.id AND event_type='question.updated')::text AS events FROM questions q WHERE q.id=$1",
      [created.value.id]
    );
    expect(committed.rows[0]).toEqual({ version: 2, revisions: "1", events: "1" });

    const rollbackUnit = new PostgresQuestionUnitOfWork(pool);
    await rollbackUnit.begin();
    const question = await rollbackUnit.questions.getById(created.value.id);
    if (!question) throw new Error("question missing");
    const mutation = question.updateText({
      text: "How should explicit rollback remove Question state, history, and events?",
      expectedVersion: 2,
      actorId: "real-owner-1",
      revisionId: new UuidGenerator().generate(),
      correlationId: "rollback-corr"
    });
    expect(await rollbackUnit.questions.saveWithExpectedVersion(question, 2)).toBe(true);
    await rollbackUnit.revisions.add(mutation.revision);
    await rollbackUnit.appendOutbox(mutation.event);
    await rollbackUnit.rollback();
    const rolledBack = await pool.query<{ version: number; revisions: string; events: string }>(
      "SELECT q.version, (SELECT COUNT(*) FROM question_revisions WHERE question_id=q.id)::text AS revisions, (SELECT COUNT(*) FROM outbox_events WHERE aggregate_id=q.id AND event_type='question.updated')::text AS events FROM questions q WHERE q.id=$1",
      [created.value.id]
    );
    expect(rolledBack.rows[0]).toEqual({ version: 2, revisions: "1", events: "1" });
  });

  it("upgrades a Prompt 1 schema from migration 2 while preserving existing data", async () => {
    const client = await pool.connect();
    const schema = "prompt2_upgrade_validation";
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`SET search_path TO ${schema}`);
      await migrate(client, [initialMigration, questionMigration]);
      await client.query(
        "INSERT INTO questions (id,text,status,language,source,creator_id,created_at,updated_at,version) VALUES ($1,$2,'published','fa','human',$3,$4,$4,1)",
        [
          "historical-question-1",
          "چگونه داده‌های موجود باید هنگام مهاجرت حفظ شوند؟",
          "historical-owner",
          new Date("2026-01-01T00:00:00Z")
        ]
      );
      await migrate(client, migrations);
      const historical = await client.query<{
        text: string;
        status: string;
        version: number;
      }>("SELECT text,status,version FROM questions WHERE id=$1", ["historical-question-1"]);
      expect(historical.rows[0]).toEqual({
        text: "چگونه داده‌های موجود باید هنگام مهاجرت حفظ شوند؟",
        status: "published",
        version: 1
      });
      const head = await client.query<{ version: number; name: string }>(
        "SELECT version,name FROM schema_migrations ORDER BY version DESC LIMIT 1"
      );
      expect(head.rows[0]).toEqual({ version: 8, name: "question_runtime_closure" });
      const revisionTable = await client.query<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name='question_revisions'",
        [schema]
      );
      expect(revisionTable.rowCount).toBe(1);
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      client.release();
    }
  });
});

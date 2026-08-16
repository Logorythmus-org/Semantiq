import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  initialMigration,
  migrate,
  migrations,
  PostgresQuestionRelationUnitOfWork,
  PostgresQuestionUnitOfWork,
  questionLifecycleMigration,
  questionMigration,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  createQuestionApplication,
  createQuestionRelationApplication
} from "../../packages/questions/src/index.js";
import { FixedClock, UuidGenerator } from "../../packages/shared/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;
const clock = new FixedClock(new Date("2026-03-03T00:00:00.000Z"));

suite("real PostgreSQL Question relations", () => {
  let pool: SqlPool;

  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
    await reset(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  function applications() {
    return {
      questions: createQuestionApplication({
        ids: new UuidGenerator(),
        clock,
        createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
      }),
      relations: createQuestionRelationApplication({
        ids: new UuidGenerator(),
        clock,
        createUnitOfWork: () => new PostgresQuestionRelationUnitOfWork(pool)
      })
    };
  }

  async function createQuestion(
    application: ReturnType<typeof createQuestionApplication>,
    text: string,
    creatorId: string
  ) {
    const result = await application.create({
      text,
      language: "en",
      creatorId,
      correlationId: `create-${creatorId}-${text.length}`
    });
    if (!result.ok) throw new Error(`Question creation failed: ${result.error.code}`);
    return result.value;
  }

  it("upgrades migration head 3 to head 4 without changing existing Questions", async () => {
    const client = await pool.connect();
    const schema = "prompt3_upgrade_validation";
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`SET search_path TO ${schema}`);
      await migrate(client, [initialMigration, questionMigration, questionLifecycleMigration]);
      await client.query(
        "INSERT INTO questions (id,text,status,language,source,creator_id,created_at,updated_at,version) VALUES ($1,$2,'published','en','human',$3,$4,$4,1)",
        [
          "historical-question",
          "How should migration preserve an existing Question?",
          "historical-owner",
          new Date("2026-01-01T00:00:00Z")
        ]
      );
      await migrate(client, migrations);
      const head = await client.query<{ version: number; name: string }>(
        "SELECT version,name FROM schema_migrations ORDER BY version DESC LIMIT 1"
      );
      expect(head.rows[0]).toEqual({ version: 8, name: "question_runtime_closure" });
      const existing = await client.query<{ text: string; version: number }>(
        "SELECT text,version FROM questions WHERE id='historical-question'"
      );
      expect(existing.rows[0]).toEqual({
        text: "How should migration preserve an existing Question?",
        version: 1
      });
      const relationTable = await client.query<{ table_name: string }>(
        "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_name='question_relations'",
        [schema]
      );
      expect(relationTable.rowCount).toBe(1);
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      client.release();
    }
  });

  it("commits relation, compact outbox event, and idempotency atomically", async () => {
    await reset(pool);
    const { questions, relations } = applications();
    const source = await createQuestion(
      questions,
      "How should PostgreSQL persist a relation atomically?",
      "pg-owner-a"
    );
    const target = await createQuestion(
      questions,
      "How should the outbox describe that relation safely?",
      "pg-owner-b"
    );
    const command = {
      sourceQuestionId: source.id,
      targetQuestionId: target.id,
      type: "refines" as const,
      actorId: "pg-owner-a",
      idempotencyKey: "pg-relation-key-1",
      correlationId: "pg-relation-create"
    };
    const created = await relations.create(command);
    expect(created).toMatchObject({ ok: true, value: { type: "refines", version: 1 } });
    expect(await relations.create({ ...command, correlationId: "pg-relation-replay" })).toEqual(
      created
    );
    expect(
      await relations.list({
        questionId: source.id,
        correlationId: "pg-relation-list-default"
      })
    ).toMatchObject({ ok: true, value: { items: [{ type: "refines" }] } });
    expect(
      await relations.graph({
        questionId: source.id,
        correlationId: "pg-relation-graph-default"
      })
    ).toMatchObject({
      ok: true,
      value: {
        nodes: [{ id: source.id }, { id: target.id }],
        relations: [{ type: "refines" }]
      }
    });
    const rows = await pool.query<{
      relations: string;
      events: string;
      keys: string;
      source_version: number;
      target_version: number;
      aggregate_type: string;
    }>(
      "SELECT (SELECT COUNT(*) FROM question_relations)::text AS relations,(SELECT COUNT(*) FROM outbox_events WHERE event_type='question.relation.created')::text AS events,(SELECT COUNT(*) FROM idempotency_records WHERE scope='question.relation.create')::text AS keys,(SELECT version FROM questions WHERE id=$1) AS source_version,(SELECT version FROM questions WHERE id=$2) AS target_version,(SELECT aggregate_type FROM outbox_events WHERE event_type='question.relation.created' LIMIT 1) AS aggregate_type",
      [source.id, target.id]
    );
    expect(rows.rows[0]).toEqual({
      relations: "1",
      events: "1",
      keys: "1",
      source_version: 1,
      target_version: 1,
      aggregate_type: "QuestionRelation"
    });
    const event = await pool.query<{ payload: Record<string, unknown> }>(
      "SELECT payload FROM outbox_events WHERE event_type='question.relation.created'"
    );
    expect(event.rows[0]?.payload).toEqual(
      expect.objectContaining({
        sourceQuestionId: source.id,
        targetQuestionId: target.id,
        relationType: "refines"
      })
    );
    expect(JSON.stringify(event.rows[0]?.payload)).not.toContain(source.text);
    if (!created.ok) throw new Error("Relation creation failed");
    await expect(
      pool.query("UPDATE question_relations SET created_by='tampered' WHERE id=$1", [
        created.value.id
      ])
    ).rejects.toThrow(/invalid question relation mutation/);
  });

  it("commits logical removal and its outbox event atomically", async () => {
    await reset(pool);
    const { questions, relations } = applications();
    const source = await createQuestion(
      questions,
      "Which persisted inquiry needs follow-up?",
      "pg-owner-a"
    );
    const target = await createQuestion(
      questions,
      "Which persisted follow-up is removable?",
      "pg-owner-b"
    );
    const created = await relations.create({
      sourceQuestionId: source.id,
      targetQuestionId: target.id,
      type: "follow_up",
      actorId: "pg-owner-a",
      correlationId: "pg-follow-up"
    });
    if (!created.ok) throw new Error(created.error.code);
    const removals = await Promise.all([
      relations.remove({
        relationId: created.value.id,
        expectedVersion: 1,
        actorId: "pg-owner-a",
        correlationId: "pg-remove-1"
      }),
      relations.remove({
        relationId: created.value.id,
        expectedVersion: 1,
        actorId: "pg-owner-a",
        correlationId: "pg-remove-2"
      })
    ]);
    expect(removals.filter((result) => result.ok)).toHaveLength(1);
    expect(removals.find((result) => !result.ok)).toMatchObject({
      error: { code: "question_relation_version_conflict" }
    });
    expect(removals.find((result) => result.ok)).toMatchObject({
      value: { status: "removed", version: 2 }
    });
    const state = await pool.query<{ status: string; version: number; events: string }>(
      "SELECT status,version,(SELECT COUNT(*)::text FROM outbox_events WHERE aggregate_id=$1) AS events FROM question_relations WHERE id=$1",
      [created.value.id]
    );
    expect(state.rows[0]).toEqual({ status: "removed", version: 2, events: "2" });
    expect(
      await relations.graph({ questionId: source.id, correlationId: "pg-after-remove" })
    ).toMatchObject({
      ok: true,
      value: { relations: [] }
    });
  });

  it("enforces endpoint, self-link, symmetric, and inverse uniqueness constraints", async () => {
    await reset(pool);
    const { questions, relations } = applications();
    const left = await createQuestion(
      questions,
      "Can PostgreSQL normalize symmetric graph identity?",
      "pg-owner-a"
    );
    const right = await createQuestion(
      questions,
      "Can PostgreSQL normalize inverse graph identity?",
      "pg-owner-b"
    );
    expect(
      await relations.create({
        sourceQuestionId: left.id,
        targetQuestionId: right.id,
        type: "alternative_to",
        actorId: "pg-owner-a",
        correlationId: "pg-symmetric"
      })
    ).toMatchObject({ ok: true });
    expect(
      await relations.create({
        sourceQuestionId: right.id,
        targetQuestionId: left.id,
        type: "alternative_to",
        actorId: "pg-owner-b",
        correlationId: "pg-symmetric-reverse"
      })
    ).toMatchObject({ ok: false, error: { code: "question_relation_exists" } });
    expect(
      await relations.create({
        sourceQuestionId: left.id,
        targetQuestionId: right.id,
        type: "broadens",
        actorId: "pg-owner-a",
        correlationId: "pg-broadens"
      })
    ).toMatchObject({ ok: true });
    expect(
      await relations.create({
        sourceQuestionId: right.id,
        targetQuestionId: left.id,
        type: "narrows",
        actorId: "pg-owner-b",
        correlationId: "pg-narrows"
      })
    ).toMatchObject({ ok: false, error: { code: "question_relation_exists" } });
    await expect(
      pool.query(
        "INSERT INTO question_relations (id,source_question_id,target_question_id,type,created_by,created_at,version) VALUES ('self-link',$1,$1,'connects','pg-owner-a',NOW(),1)",
        [left.id]
      )
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      pool.query(
        "INSERT INTO question_relations (id,source_question_id,target_question_id,type,created_by,created_at,version) VALUES ('missing-link',$1,'missing-question','connects','pg-owner-a',NOW(),1)",
        [left.id]
      )
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("allows one concurrent equivalent relation and rolls the loser back", async () => {
    await reset(pool);
    const { questions, relations } = applications();
    const source = await createQuestion(
      questions,
      "Which concurrent relation request should become authoritative?",
      "pg-owner-a"
    );
    const target = await createQuestion(
      questions,
      "How should an equivalent concurrent request detect conflict?",
      "pg-owner-b"
    );
    const command = {
      sourceQuestionId: source.id,
      targetQuestionId: target.id,
      type: "depends_on" as const,
      actorId: "pg-owner-a",
      correlationId: "pg-concurrent"
    };
    const results = await Promise.all([
      relations.create({ ...command, correlationId: "pg-concurrent-1" }),
      relations.create({ ...command, correlationId: "pg-concurrent-2" })
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    expect(results.find((result) => !result.ok)).toMatchObject({
      error: { code: "question_relation_exists" }
    });
    const counts = await pool.query<{ relations: string; events: string }>(
      "SELECT (SELECT COUNT(*) FROM question_relations)::text AS relations,(SELECT COUNT(*) FROM outbox_events WHERE event_type='question.relation.created')::text AS events"
    );
    expect(counts.rows[0]).toEqual({ relations: "1", events: "1" });
  });

  it("waits for endpoint mutation and rejects a relation after archive commits", async () => {
    await reset(pool);
    const { questions, relations } = applications();
    const source = await createQuestion(
      questions,
      "Can relation creation race safely with endpoint archive?",
      "pg-owner-a"
    );
    const target = await createQuestion(
      questions,
      "Which endpoint state must relation creation observe?",
      "pg-owner-b"
    );
    const archiveUnit = new PostgresQuestionUnitOfWork(pool);
    await archiveUnit.begin();
    const targetAggregate = await archiveUnit.questions.getById(target.id);
    if (!targetAggregate) throw new Error("Target missing");
    const mutation = targetAggregate.archive({
      expectedVersion: 1,
      actorId: "pg-owner-b",
      revisionId: new UuidGenerator().generate(),
      correlationId: "archive-race",
      clock
    });
    expect(await archiveUnit.questions.saveWithExpectedVersion(targetAggregate, 1)).toBe(true);
    await archiveUnit.revisions.add(mutation.revision);
    await archiveUnit.appendOutbox(mutation.event);

    const relationPromise = relations.create({
      sourceQuestionId: source.id,
      targetQuestionId: target.id,
      type: "depends_on",
      actorId: "pg-owner-a",
      correlationId: "relation-race"
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await archiveUnit.commit();
    expect(await relationPromise).toMatchObject({
      ok: false,
      error: { code: "question_relation_archived_endpoint" }
    });
    const count = await pool.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM question_relations"
    );
    expect(count.rows[0]?.count).toBe("0");
  });
});

async function reset(pool: SqlPool): Promise<void> {
  await pool.query(
    "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
  );
}

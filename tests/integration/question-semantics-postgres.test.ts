import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  migrate,
  migrations,
  PostgresQuestionSemanticUnitOfWork,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  createQuestionApplication,
  createQuestionSemanticApplication,
  type QuestionSemanticStructureInput
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

function semantic(
  overrides: Partial<QuestionSemanticStructureInput> = {}
): QuestionSemanticStructureInput {
  return {
    context: ["A PostgreSQL-backed local Question Runtime."],
    assumptions: ["Explicit statements are authoritative user input."],
    constraints: ["No vector database is required."],
    unknowns: ["Which later runtime will consume this structure first?"],
    uncertainty: {
      level: "medium",
      statements: ["Consumer requirements may evolve."]
    },
    scope: {
      inclusions: ["Transactional semantic metadata"],
      exclusions: ["Automatic semantic evaluation"]
    },
    perspectives: ["Question creator"],
    openPossibilities: ["Semantiq consumption", "Research planning"],
    ...overrides
  };
}

suite("Question semantic PostgreSQL runtime", () => {
  let pool: SqlPool;

  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
  });

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  function applications() {
    return {
      questions: createQuestionApplication({
        clock: new FixedClock(new Date("2026-04-01T00:00:00Z")),
        createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
      }),
      semantics: createQuestionSemanticApplication({
        clock: new FixedClock(new Date("2026-04-01T00:01:00Z")),
        createUnitOfWork: () => new PostgresQuestionSemanticUnitOfWork(pool)
      })
    };
  }

  async function createQuestion(
    application: ReturnType<typeof createQuestionApplication>,
    owner = "semantic-pg-owner"
  ) {
    const result = await application.create({
      text: "How should structured context remain explicit and auditable?",
      language: "en",
      creatorId: owner,
      correlationId: "semantic-pg-question"
    });
    if (!result.ok) throw new Error("Question creation failed");
    return result.value;
  }

  it("persists current state, revision, compact events, and idempotency atomically", async () => {
    const { questions, semantics } = applications();
    const question = await createQuestion(questions);
    const createCommand = {
      questionId: question.id,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-pg-owner",
      idempotencyKey: "semantic-pg-create-key",
      correlationId: "semantic-pg-create"
    } as const;
    const created = await semantics.put(createCommand);
    expect(created).toMatchObject({ ok: true, value: { version: 1 } });
    expect(await semantics.put({ ...createCommand, correlationId: "semantic-pg-replay" })).toEqual(
      created
    );

    const updated = await semantics.put({
      questionId: question.id,
      expectedVersion: 1,
      structure: semantic({ unknowns: ["Which stable event consumer should run first?"] }),
      actorId: "semantic-pg-owner",
      reason: "Narrow the open unknown",
      correlationId: "semantic-pg-update",
      causationId: "semantic-pg-create"
    });
    expect(updated).toMatchObject({ ok: true, value: { version: 2 } });
    expect(
      await semantics.get({ questionId: question.id, correlationId: "semantic-pg-read" })
    ).toEqual(updated);
    expect(
      await semantics.revisions({
        questionId: question.id,
        actorId: "semantic-pg-owner",
        correlationId: "semantic-pg-history"
      })
    ).toMatchObject({
      ok: true,
      value: {
        currentVersion: 2,
        revisions: [
          {
            version: 2,
            reason: "Narrow the open unknown",
            previousStructure: {
              unknowns: ["Which later runtime will consume this structure first?"]
            }
          }
        ]
      }
    });

    const persisted = await pool.query<{
      structures: string;
      revisions: string;
      events: string;
      keys: string;
      question_version: number;
      aggregate_type: string;
      exposed_content: boolean;
    }>(
      "SELECT (SELECT COUNT(*) FROM question_semantic_structures)::text AS structures,(SELECT COUNT(*) FROM question_semantic_revisions)::text AS revisions,(SELECT COUNT(*) FROM outbox_events WHERE event_type IN ('question.semantic_structure.created','question.semantic_structure.updated'))::text AS events,(SELECT COUNT(*) FROM idempotency_records WHERE scope='question.semantic_structure.put')::text AS keys,(SELECT version FROM questions WHERE id=$1) AS question_version,(SELECT aggregate_type FROM outbox_events WHERE event_type='question.semantic_structure.created' LIMIT 1) AS aggregate_type,EXISTS(SELECT 1 FROM outbox_events WHERE event_type LIKE 'question.semantic_structure.%' AND payload::text ILIKE '%PostgreSQL-backed%') AS exposed_content",
      [question.id]
    );
    expect(persisted.rows[0]).toEqual({
      structures: "1",
      revisions: "1",
      events: "2",
      keys: "1",
      question_version: 1,
      aggregate_type: "QuestionSemanticStructure",
      exposed_content: false
    });
  });

  it("enforces JSON shape, foreign keys, retention, and immutable revisions in PostgreSQL", async () => {
    const { questions, semantics } = applications();
    const question = await createQuestion(questions);
    await semantics.put({
      questionId: question.id,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-pg-owner",
      correlationId: "semantic-pg-create"
    });
    await semantics.put({
      questionId: question.id,
      expectedVersion: 1,
      structure: semantic({ constraints: ["Preserve every accepted revision."] }),
      actorId: "semantic-pg-owner",
      correlationId: "semantic-pg-update"
    });

    await expect(
      pool.query(
        "UPDATE question_semantic_structures SET structure='{}'::jsonb WHERE question_id=$1",
        [question.id]
      )
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      pool.query("DELETE FROM question_semantic_structures WHERE question_id=$1", [question.id])
    ).rejects.toThrow(/cannot be deleted/);
    await expect(
      pool.query("UPDATE question_semantic_revisions SET reason='tampered' WHERE question_id=$1", [
        question.id
      ])
    ).rejects.toThrow(/immutable/);
    await expect(
      pool.query(
        "INSERT INTO question_semantic_structures (question_id,structure,created_by,updated_by,created_at,updated_at,version) SELECT 'missing-question',structure,'owner','owner',NOW(),NOW(),1 FROM question_semantic_structures WHERE question_id=$1",
        [question.id]
      )
    ).rejects.toMatchObject({ code: "23503" });
  });

  it("allows one concurrent create and one update for each expected version", async () => {
    const { questions, semantics } = applications();
    const question = await createQuestion(questions);
    const createResults = await Promise.all([
      semantics.put({
        questionId: question.id,
        expectedVersion: 0,
        structure: semantic({ context: ["Concurrent context A"] }),
        actorId: "semantic-pg-owner",
        correlationId: "semantic-concurrent-create-a"
      }),
      semantics.put({
        questionId: question.id,
        expectedVersion: 0,
        structure: semantic({ context: ["Concurrent context B"] }),
        actorId: "semantic-pg-owner",
        correlationId: "semantic-concurrent-create-b"
      })
    ]);
    expect(createResults.filter((result) => result.ok)).toHaveLength(1);
    expect(createResults.filter((result) => !result.ok)).toHaveLength(1);

    const updateResults = await Promise.all([
      semantics.put({
        questionId: question.id,
        expectedVersion: 1,
        structure: semantic({ unknowns: ["Concurrent unknown A"] }),
        actorId: "semantic-pg-owner",
        correlationId: "semantic-concurrent-update-a"
      }),
      semantics.put({
        questionId: question.id,
        expectedVersion: 1,
        structure: semantic({ unknowns: ["Concurrent unknown B"] }),
        actorId: "semantic-pg-owner",
        correlationId: "semantic-concurrent-update-b"
      })
    ]);
    expect(updateResults.filter((result) => result.ok)).toHaveLength(1);
    expect(updateResults.filter((result) => !result.ok)).toHaveLength(1);
    expect(updateResults.find((result) => !result.ok)).toMatchObject({
      error: { code: "question_semantic_version_conflict" }
    });
    const counts = await pool.query<{ structures: string; revisions: string; events: string }>(
      "SELECT (SELECT COUNT(*) FROM question_semantic_structures)::text AS structures,(SELECT COUNT(*) FROM question_semantic_revisions)::text AS revisions,(SELECT COUNT(*) FROM outbox_events WHERE event_type LIKE 'question.semantic_structure.%')::text AS events"
    );
    expect(counts.rows[0]).toEqual({ structures: "1", revisions: "1", events: "2" });
  });

  it("preserves semantic state across Question archive and restore", async () => {
    const { questions, semantics } = applications();
    const question = await createQuestion(questions);
    await semantics.put({
      questionId: question.id,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-pg-owner",
      correlationId: "semantic-pg-create"
    });
    await questions.archive({
      questionId: question.id,
      expectedVersion: 1,
      actorId: "semantic-pg-owner",
      correlationId: "semantic-pg-archive"
    });
    expect(
      await semantics.put({
        questionId: question.id,
        expectedVersion: 1,
        structure: semantic({ context: ["An archived write"] }),
        actorId: "semantic-pg-owner",
        correlationId: "semantic-pg-archived-write"
      })
    ).toMatchObject({ ok: false, error: { code: "question_archived" } });
    expect(
      await semantics.get({ questionId: question.id, correlationId: "semantic-pg-archived-read" })
    ).toMatchObject({ ok: true, value: { version: 1 } });
    await questions.restore({
      questionId: question.id,
      expectedVersion: 2,
      actorId: "semantic-pg-owner",
      correlationId: "semantic-pg-restore"
    });
    expect(
      await semantics.put({
        questionId: question.id,
        expectedVersion: 1,
        structure: semantic({ context: ["A restored write"] }),
        actorId: "semantic-pg-owner",
        correlationId: "semantic-pg-restored-write"
      })
    ).toMatchObject({ ok: true, value: { version: 2 } });
  });

  it("upgrades head 4 without changing existing Questions or relations", async () => {
    const client = await pool.connect();
    const schema = "prompt4_upgrade_validation";
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`SET search_path TO ${schema}`);
      await migrate(client, migrations.slice(0, 4));
      await client.query(
        "INSERT INTO questions (id,text,status,language,source,creator_id,created_at,updated_at,version) VALUES ('historical-a','How should historical context survive migration?','published','en','human','historical-owner',NOW(),NOW(),1),('historical-b','Which relation should remain connected after migration?','published','en','human','historical-owner',NOW(),NOW(),1)"
      );
      await client.query(
        "INSERT INTO question_relations (id,source_question_id,target_question_id,type,created_by,created_at,version) VALUES ('historical-relation','historical-a','historical-b','connects','historical-owner',NOW(),1)"
      );
      await migrate(client, migrations);

      const state = await client.query<{
        questions: string;
        relations: string;
        structures: string;
        version: number;
        name: string;
      }>(
        "SELECT (SELECT COUNT(*) FROM questions)::text AS questions,(SELECT COUNT(*) FROM question_relations)::text AS relations,(SELECT COUNT(*) FROM question_semantic_structures)::text AS structures,m.version,m.name FROM schema_migrations m ORDER BY m.version DESC LIMIT 1"
      );
      expect(state.rows[0]).toEqual({
        questions: "2",
        relations: "1",
        structures: "0",
        version: 8,
        name: "question_runtime_closure"
      });
    } finally {
      await client.query("SET search_path TO public");
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      client.release();
    }
  });
});

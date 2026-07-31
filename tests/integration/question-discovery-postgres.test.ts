import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  migrate,
  migrations,
  PostgresQuestionReadRepository,
  PostgresQuestionSemanticUnitOfWork,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  createQuestionApplication,
  createQuestionDiscoveryApplication,
  createQuestionSemanticApplication,
  type QuestionDiscoveryApplication,
  type QuestionSemanticStructureInput,
  type SearchQuestionsQuery
} from "../../packages/questions/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

const semanticBase: QuestionSemanticStructureInput = {
  context: ["A PostgreSQL discovery fixture."],
  assumptions: ["Structured statements were supplied explicitly."],
  constraints: ["The runtime remains local."],
  unknowns: ["Which discovery path will be used most often?"],
  uncertainty: { level: "medium", statements: ["Usage has not yet been measured."] },
  scope: { inclusions: ["Question discovery"], exclusions: ["Recommendation ranking"] },
  perspectives: ["Question creator"],
  openPossibilities: ["A future provider adapter"]
};

suite("Question discovery PostgreSQL runtime", () => {
  let pool: SqlPool;
  let discovery: QuestionDiscoveryApplication;

  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
    discovery = createQuestionDiscoveryApplication({
      repository: new PostgresQuestionReadRepository(pool)
    });
  });

  beforeEach(async () => {
    await pool.query(
      "TRUNCATE question_semantic_revisions, question_semantic_structures, question_relations, question_revisions, questions, outbox_events, idempotency_records CASCADE"
    );
    await seedDiscoveryFixture(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("lists lifecycle states with deterministic ordering and bounded cursor pages", async () => {
    expect(await discoverIds(discovery, {})).toEqual([
      "disc-q7",
      "disc-q6",
      "disc-q5",
      "disc-q3",
      "disc-q2",
      "disc-q1"
    ]);
    expect(await discoverIds(discovery, { status: "archived" })).toEqual(["disc-q4"]);
    expect(await discoverIds(discovery, { status: "all", sort: "oldest" })).toEqual([
      "disc-q1",
      "disc-q2",
      "disc-q3",
      "disc-q4",
      "disc-q5",
      "disc-q6",
      "disc-q7"
    ]);

    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await discovery.list({
        status: "all",
        limit: 2,
        ...(cursor ? { cursor } : {}),
        correlationId: `pg-page-${seen.length}`
      });
      if (!result.ok) throw new Error(result.error.code);
      seen.push(...result.value.items.map((item) => item.id));
      cursor = result.value.page.nextCursor;
    } while (cursor);
    expect(seen).toEqual([
      "disc-q7",
      "disc-q6",
      "disc-q5",
      "disc-q4",
      "disc-q3",
      "disc-q2",
      "disc-q1"
    ]);
    expect(new Set(seen).size).toBe(7);
  });

  it("composes creator, time, language, Frame, and semantic component filters", async () => {
    expect(await discoverIds(discovery, { creatorId: "owner-fa", status: "all" })).toEqual([
      "disc-q4",
      "disc-q3"
    ]);
    expect(
      await discoverIds(discovery, {
        createdAfter: "2026-01-05T00:00:00Z",
        updatedBefore: "2026-01-06T00:00:00Z"
      })
    ).toEqual(["disc-q6", "disc-q5"]);
    expect(await discoverIds(discovery, { language: "fa" })).toEqual(["disc-q3"]);
    expect(await discoverIds(discovery, { hasFrame: true })).toEqual([
      "disc-q6",
      "disc-q5",
      "disc-q1"
    ]);
    expect(await discoverIds(discovery, { hasFrame: false })).toEqual([
      "disc-q7",
      "disc-q3",
      "disc-q2"
    ]);
    expect(await discoverIds(discovery, { frameStale: true })).toEqual(["disc-q5"]);
    expect(await discoverIds(discovery, { frameStale: false })).toEqual(["disc-q6", "disc-q1"]);
    expect(await discoverIds(discovery, { hasAssumptions: true })).toEqual(["disc-q5", "disc-q1"]);
    expect(await discoverIds(discovery, { hasUnknowns: true })).toEqual(["disc-q6", "disc-q1"]);
    expect(await discoverIds(discovery, { uncertaintyType: "high" })).toEqual(["disc-q5"]);
  });

  it("supports relation type, one-hop direction, symmetric direction, and relation counts", async () => {
    expect(
      await discoverIds(discovery, {
        relatedToQuestionId: "disc-q1",
        relationType: "refines",
        relationDirection: "outgoing"
      })
    ).toEqual(["disc-q2"]);
    expect(
      await discoverIds(discovery, {
        relatedToQuestionId: "disc-q1",
        relationDirection: "incoming"
      })
    ).toEqual(["disc-q3"]);
    expect(await discoverIds(discovery, { relationType: "connects" })).toEqual([
      "disc-q6",
      "disc-q5"
    ]);
    expect(
      await discoverIds(discovery, {
        relatedToQuestionId: "disc-q6",
        relationType: "connects",
        relationDirection: "outgoing"
      })
    ).toEqual(["disc-q5"]);
    expect(
      await discovery.getDetail({ questionId: "disc-q1", correlationId: "pg-detail" })
    ).toMatchObject({
      ok: true,
      value: {
        hasFrame: true,
        frame: { stale: false, assumptionCount: 1, unknownCount: 1 },
        relationCount: 2,
        relations: { count: 2, types: ["depends_on", "refines"] }
      }
    });
  });

  it("searches current English, German, and normalized Persian text without changing originals", async () => {
    expect(await discoverIds(discovery, { textQuery: "architecture" })).toEqual(["disc-q1"]);
    expect(await discoverIds(discovery, { textQuery: "ARCHITEKTUR" })).toEqual(["disc-q2"]);
    expect(await discoverIds(discovery, { textQuery: "پرسش", status: "all" })).toEqual([
      "disc-q4",
      "disc-q3"
    ]);
    expect(await discoverIds(discovery, { textQuery: "مـي‌ماند" })).toEqual(["disc-q3"]);
    expect(await discoverIds(discovery, { textQuery: "%" })).toEqual([]);
    expect(await discoverIds(discovery, { textQuery: "' OR 1=1 --" })).toEqual([]);
    const original = await pool.query<{ text: string; search_text: string }>(
      "SELECT text,search_text FROM questions WHERE id='disc-q3'"
    );
    expect(original.rows[0]).toEqual({
      text: "چگونه پرسش معماری و عدم قطعیت روشن می‌ماند؟",
      search_text: "چگونه پرسش معماری و عدم قطعیت روشن می ماند؟"
    });
  });

  it("synchronizes generated search state after update and keeps historical revisions separate", async () => {
    const questions = createQuestionApplication({
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    expect(await discoverIds(discovery, { textQuery: "architecture shape" })).toEqual(["disc-q1"]);
    const updated = await questions.update({
      questionId: "disc-q1",
      text: "How does adaptive reasoning improve current Question discovery?",
      expectedVersion: 1,
      actorId: "owner-a",
      correlationId: "pg-search-update"
    });
    expect(updated).toMatchObject({ ok: true, value: { version: 2 } });
    expect(await discoverIds(discovery, { textQuery: "architecture shape" })).toEqual([]);
    expect(await discoverIds(discovery, { textQuery: "adaptive reasoning" })).toEqual(["disc-q1"]);
    const revision = await pool.query<{ previous_text: string; text: string }>(
      "SELECT previous_text,text FROM question_revisions WHERE question_id='disc-q1'"
    );
    expect(revision.rows[0]).toEqual({
      previous_text: "How does architecture shape Question discovery?",
      text: "How does adaptive reasoning improve current Question discovery?"
    });
  });

  it("tracks deterministic Frame freshness against the Question version", async () => {
    const questions = createQuestionApplication({
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const semantics = createQuestionSemanticApplication({
      createUnitOfWork: () => new PostgresQuestionSemanticUnitOfWork(pool)
    });
    expect(await discoverIds(discovery, { frameStale: false })).toContain("disc-q1");
    const updated = await questions.update({
      questionId: "disc-q1",
      text: "How does architecture keep a changed Question discoverable?",
      expectedVersion: 1,
      actorId: "owner-a",
      correlationId: "pg-frame-question-update"
    });
    if (!updated.ok) throw new Error(updated.error.code);
    expect(await discoverIds(discovery, { frameStale: true })).toEqual(["disc-q5", "disc-q1"]);
    const refreshed = await semantics.put({
      questionId: "disc-q1",
      expectedVersion: 1,
      structure: {
        ...semanticBase,
        openPossibilities: ["A refreshed discovery provider boundary"]
      },
      actorId: "owner-a",
      correlationId: "pg-frame-refresh"
    });
    expect(refreshed).toMatchObject({
      ok: true,
      value: { questionVersionAtLastUpdate: 2, version: 2 }
    });
    expect(await discoverIds(discovery, { frameStale: false })).toContain("disc-q1");
  });

  it("excludes archived search results by default and restores immediate visibility", async () => {
    const questions = createQuestionApplication({
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    expect(await discoverIds(discovery, { textQuery: "Architektur" })).toEqual(["disc-q2"]);
    expect(
      await questions.archive({
        questionId: "disc-q2",
        expectedVersion: 1,
        actorId: "owner-b",
        correlationId: "pg-search-archive"
      })
    ).toMatchObject({ ok: true, value: { status: "archived" } });
    expect(await discoverIds(discovery, { textQuery: "Architektur" })).toEqual([]);
    expect(await discoverIds(discovery, { textQuery: "Architektur", status: "archived" })).toEqual([
      "disc-q2"
    ]);
    expect(
      await questions.restore({
        questionId: "disc-q2",
        expectedVersion: 2,
        actorId: "owner-b",
        correlationId: "pg-search-restore"
      })
    ).toMatchObject({ ok: true, value: { status: "published" } });
    expect(await discoverIds(discovery, { textQuery: "Architektur" })).toEqual(["disc-q2"]);
  });

  it("rejects unsupported constraint taxonomy and invalid related Questions without SQL leakage", async () => {
    expect(
      await discovery.list({ constraintType: "technical", correlationId: "pg-constraint" })
    ).toMatchObject({
      ok: false,
      error: { code: "question_constraint_filter_invalid", category: "validation" }
    });
    const missing = await discovery.list({
      relatedToQuestionId: "missing-question",
      correlationId: "pg-related-missing"
    });
    expect(missing).toMatchObject({ ok: false, error: { code: "question_not_found" } });
    expect(JSON.stringify(missing)).not.toMatch(/SELECT|question_relations_source|pg_trgm/i);
  });

  it("upgrades Prompt 4 data to one head while preserving Questions, revisions, relations, and semantics", async () => {
    const client = await pool.connect();
    const schema = "prompt5_upgrade_validation";
    try {
      await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`SET search_path TO ${schema}`);
      await migrate(client, migrations.slice(0, 5));
      await client.query(
        "INSERT INTO questions (id,text,status,language,source,creator_id,created_at,updated_at,version) VALUES ('upgrade-q1','How should Prompt 4 data remain searchable after upgrade?','published','en','human','upgrade-owner',NOW(),NOW(),2),('upgrade-q2','Which related Question should survive discovery migration?','published','en','human','upgrade-owner',NOW(),NOW(),1)"
      );
      await client.query(
        "INSERT INTO question_revisions (id,question_id,version,previous_text,text,previous_status,status,change_type,changed_by,changed_at,correlation_id) VALUES ('upgrade-revision','upgrade-q1',2,'How should Prompt 4 data survive the next migration?','How should Prompt 4 data remain searchable after upgrade?','published','published','updated','upgrade-owner',NOW(),'upgrade-revision')"
      );
      await client.query(
        "INSERT INTO question_relations (id,source_question_id,target_question_id,type,created_by,created_at,version) VALUES ('upgrade-relation','upgrade-q1','upgrade-q2','connects','upgrade-owner',NOW(),1)"
      );
      await client.query(
        "INSERT INTO question_semantic_structures (question_id,structure,created_by,updated_by,created_at,updated_at,version) VALUES ('upgrade-q1',$1,'upgrade-owner','upgrade-owner',NOW(),NOW(),1)",
        [semanticBase]
      );
      await migrate(client, migrations);
      const state = await client.query<{
        questions: string;
        revisions: string;
        relations: string;
        frames: string;
        baseline: number;
        searchable: boolean;
        version: number;
        name: string;
      }>(
        "SELECT (SELECT COUNT(*) FROM questions)::text AS questions,(SELECT COUNT(*) FROM question_revisions)::text AS revisions,(SELECT COUNT(*) FROM question_relations)::text AS relations,(SELECT COUNT(*) FROM question_semantic_structures)::text AS frames,(SELECT question_version_at_last_update FROM question_semantic_structures WHERE question_id='upgrade-q1') AS baseline,(SELECT search_text LIKE '%searchable%' FROM questions WHERE id='upgrade-q1') AS searchable,m.version,m.name FROM schema_migrations m ORDER BY m.version DESC LIMIT 1"
      );
      expect(state.rows[0]).toEqual({
        questions: "2",
        revisions: "1",
        relations: "1",
        frames: "1",
        baseline: 2,
        searchable: true,
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

async function seedDiscoveryFixture(pool: SqlPool): Promise<void> {
  const questions = [
    [
      "disc-q1",
      "How does architecture shape Question discovery?",
      "published",
      "en",
      "owner-a",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
      1
    ],
    [
      "disc-q2",
      "Wie verbessert Architektur eine Frage und ihre Unsicherheit?",
      "published",
      "de",
      "owner-b",
      "2026-01-02T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z",
      1
    ],
    [
      "disc-q3",
      "چگونه پرسش معماری و عدم قطعیت روشن می‌ماند؟",
      "published",
      "fa",
      "owner-fa",
      "2026-01-03T00:00:00.000Z",
      "2026-01-03T00:00:00.000Z",
      1
    ],
    [
      "disc-q4",
      "چرا این پرسش بایگانی شده هنوز باید پیدا شود؟",
      "archived",
      "fa",
      "owner-fa",
      "2026-01-04T00:00:00.000Z",
      "2026-01-04T00:01:00.000Z",
      2
    ],
    [
      "disc-q5",
      "Which stale Frame needs a new semantic review?",
      "published",
      "en",
      "owner-main",
      "2026-01-05T00:00:00.000Z",
      "2026-01-06T00:00:00.000Z",
      2
    ],
    [
      "disc-q6",
      "Which current Frame preserves an explicit unknown?",
      "published",
      "en",
      "owner-main",
      "2026-01-05T00:00:00.000Z",
      "2026-01-05T00:01:00.000Z",
      1
    ],
    [
      "disc-q7",
      "Which Question has no semantic Frame yet?",
      "published",
      "en",
      "owner-main",
      "2026-01-07T00:00:00.000Z",
      "2026-01-07T00:00:00.000Z",
      1
    ]
  ] as const;
  for (const question of questions)
    await pool.query(
      "INSERT INTO questions (id,text,status,language,source,creator_id,created_at,updated_at,version) VALUES ($1,$2,$3,$4,'human',$5,$6,$7,$8)",
      question
    );
  await insertFrame(pool, "disc-q1", semanticBase, 1, 1);
  await insertFrame(
    pool,
    "disc-q5",
    {
      ...semanticBase,
      unknowns: [],
      uncertainty: { level: "high", statements: ["The Question changed after this Frame."] }
    },
    1,
    1
  );
  await insertFrame(
    pool,
    "disc-q6",
    {
      ...semanticBase,
      assumptions: [],
      uncertainty: { level: "low", statements: ["Only implementation details remain."] }
    },
    1,
    2
  );
  for (const relation of [
    ["disc-r1", "disc-q1", "disc-q2", "refines", "owner-a"],
    ["disc-r2", "disc-q3", "disc-q1", "depends_on", "owner-fa"],
    ["disc-r3", "disc-q5", "disc-q6", "connects", "owner-main"]
  ] as const)
    await pool.query(
      "INSERT INTO question_relations (id,source_question_id,target_question_id,type,created_by,created_at,version) VALUES ($1,$2,$3,$4,$5,NOW(),1)",
      relation
    );
}

async function insertFrame(
  pool: SqlPool,
  questionId: string,
  structure: QuestionSemanticStructureInput,
  questionVersion: number,
  frameVersion: number
): Promise<void> {
  await pool.query(
    "INSERT INTO question_semantic_structures (question_id,structure,question_version_at_last_update,created_by,updated_by,created_at,updated_at,version) VALUES ($1,$2,$3,'owner-main','owner-main',NOW(),NOW(),$4)",
    [questionId, structure, questionVersion, frameVersion]
  );
}

async function discoverIds(
  application: QuestionDiscoveryApplication,
  query: Omit<SearchQuestionsQuery, "correlationId">
): Promise<readonly string[]> {
  const result = await application.search({
    ...query,
    correlationId: `pg-discovery-${Object.keys(query).join("-") || "default"}`
  });
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value.items.map((item) => item.id);
}

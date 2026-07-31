import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionReadRepository,
  PostgresQuestionSafetyUnitOfWork,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  ConfiguredQuestionSafetyCapabilityPolicy,
  createQuestionApplication,
  createQuestionDiscoveryApplication,
  createQuestionSafetyApplication
} from "../../packages/questions/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;

suite("Question safety PostgreSQL runtime", () => {
  let pool: SqlPool;
  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
  });
  beforeEach(async () => {
    await pool.query("TRUNCATE questions, outbox_events, idempotency_records CASCADE");
  });
  afterAll(async () => {
    await pool.end();
  });

  it("commits provenance, audit, outbox, moderation, and discovery restriction", async () => {
    const questions = createQuestionApplication({
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const safety = createQuestionSafetyApplication({
      createUnitOfWork: () => new PostgresQuestionSafetyUnitOfWork(pool),
      capabilities: new ConfiguredQuestionSafetyCapabilityPolicy(["moderator-db"])
    });
    const created = await questions.create({
      text: "How can database constraints preserve accountable moderation boundaries?",
      language: "en",
      creatorId: "creator-db",
      correlationId: "pg-create-1"
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const source = await safety.addSource({
      questionId: created.value.id,
      sourceType: "paper",
      title: "A declared paper",
      locator: "10.1234/transparent.2026",
      actorId: "creator-db",
      correlationId: "pg-source-1",
      idempotencyKey: "pg-source-key-01"
    });
    expect(source.ok).toBe(true);
    const counts = await pool.query<{ sources: string; audits: string; events: string }>(
      "SELECT (SELECT COUNT(*) FROM question_source_references)::text sources,(SELECT COUNT(*) FROM question_audit_records)::text audits,(SELECT COUNT(*) FROM outbox_events)::text events"
    );
    expect(Number(counts.rows[0]!.sources)).toBe(1);
    expect(Number(counts.rows[0]!.audits)).toBeGreaterThanOrEqual(2);
    expect(Number(counts.rows[0]!.events)).toBe(2);

    const report = await safety.submitReport({
      questionId: created.value.id,
      reporterId: "reporter-db",
      reasonCode: "off_topic",
      description: "The current scope appears unrelated to this collection.",
      correlationId: "pg-report-1"
    });
    expect(report.ok).toBe(true);
    if (!report.ok) return;
    const opened = await safety.openCase({
      questionId: created.value.id,
      reportIds: [report.value.id],
      actorId: "moderator-db",
      reason: "Review the reported scope",
      correlationId: "pg-case-1"
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(
      (
        await safety.applyAction({
          caseId: opened.value.id,
          actionType: "restrict_discovery",
          expectedVersion: 1,
          actorId: "moderator-db",
          reason: "Restrict while scope is reviewed",
          correlationId: "pg-action-1"
        })
      ).ok
    ).toBe(true);
    const discovery = createQuestionDiscoveryApplication({
      repository: new PostgresQuestionReadRepository(pool)
    });
    const list = await discovery.list({ correlationId: "pg-list-1" });
    expect(list.ok && list.value.items).toHaveLength(0);
    expect(await safety.canReadQuestion(created.value.id)).toBe(false);
    expect(await safety.canReadQuestion(created.value.id, "moderator-db")).toBe(true);
  });

  it("enforces append-only audit records and active duplicate constraints", async () => {
    const questions = createQuestionApplication({
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const safety = createQuestionSafetyApplication({
      createUnitOfWork: () => new PostgresQuestionSafetyUnitOfWork(pool),
      capabilities: new ConfiguredQuestionSafetyCapabilityPolicy(["moderator-db"])
    });
    const created = await questions.create({
      text: "Which invariants need database-level duplicate protection?",
      language: "en",
      creatorId: "creator-db",
      correlationId: "pg-create-2"
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const command = {
      questionId: created.value.id,
      sourceType: "dataset" as const,
      title: "Dataset one",
      locator: "dataset:one",
      actorId: "creator-db",
      correlationId: "pg-source-2"
    };
    expect((await safety.addSource(command)).ok).toBe(true);
    expect(
      (await safety.addSource({ ...command, title: "Renamed", correlationId: "pg-source-3" })).ok
    ).toBe(false);

    const concurrentSources = await Promise.all([
      safety.addSource({
        ...command,
        locator: "dataset:concurrent",
        correlationId: "pg-source-concurrent-1"
      }),
      safety.addSource({
        ...command,
        locator: "dataset:concurrent",
        correlationId: "pg-source-concurrent-2"
      })
    ]);
    expect(concurrentSources.filter((result) => result.ok)).toHaveLength(1);
    expect(concurrentSources.filter((result) => !result.ok)).toHaveLength(1);

    const concurrentReports = await Promise.all([
      safety.submitReport({
        questionId: created.value.id,
        reporterId: "concurrent-reporter",
        reasonCode: "off_topic",
        description: "Concurrent duplicate report number one.",
        correlationId: "pg-report-concurrent-1"
      }),
      safety.submitReport({
        questionId: created.value.id,
        reporterId: "concurrent-reporter",
        reasonCode: "off_topic",
        description: "Concurrent duplicate report number two.",
        correlationId: "pg-report-concurrent-2"
      })
    ]);
    expect(concurrentReports.filter((result) => result.ok)).toHaveLength(1);
    expect(concurrentReports.filter((result) => !result.ok)).toHaveLength(1);
    const report = concurrentReports.find((result) => result.ok);
    if (!report?.ok) throw new Error("Concurrent report winner missing");
    const opened = await safety.openCase({
      questionId: created.value.id,
      reportIds: [report.value.id],
      actorId: "moderator-db",
      reason: "Exercise concurrent moderation protection",
      correlationId: "pg-case-concurrent"
    });
    if (!opened.ok) throw new Error(opened.error.code);
    const concurrentActions = await Promise.all([
      safety.applyAction({
        caseId: opened.value.id,
        actionType: "mark_under_review",
        expectedVersion: 1,
        actorId: "moderator-db",
        reason: "Concurrent moderation action one",
        correlationId: "pg-action-concurrent-1"
      }),
      safety.applyAction({
        caseId: opened.value.id,
        actionType: "mark_under_review",
        expectedVersion: 1,
        actorId: "moderator-db",
        reason: "Concurrent moderation action two",
        correlationId: "pg-action-concurrent-2"
      })
    ]);
    expect(concurrentActions.filter((result) => result.ok)).toHaveLength(1);
    expect(concurrentActions.filter((result) => !result.ok)).toHaveLength(1);
    expect(concurrentActions.find((result) => !result.ok)).toMatchObject({
      error: { code: "question_safety_version_conflict" }
    });
    const concurrentState = await pool.query<{
      sources: string;
      reports: string;
      actions: string;
      case_version: number;
      state_version: number;
    }>(
      "SELECT (SELECT COUNT(*) FROM question_source_references WHERE normalized_locator='dataset:concurrent')::text sources,(SELECT COUNT(*) FROM question_reports WHERE reporter_id='concurrent-reporter')::text reports,(SELECT COUNT(*) FROM question_moderation_actions WHERE case_id=$1)::text actions,(SELECT version FROM question_moderation_cases WHERE id=$1) case_version,(SELECT version FROM question_moderation_states WHERE question_id=$2) state_version",
      [opened.value.id, created.value.id]
    );
    expect(concurrentState.rows[0]).toEqual({
      sources: "1",
      reports: "1",
      actions: "1",
      case_version: 2,
      state_version: 2
    });
    const audit = await pool.query<{ id: string }>("SELECT id FROM question_audit_records LIMIT 1");
    await expect(
      pool.query("UPDATE question_audit_records SET action='changed' WHERE id=$1", [
        audit.rows[0]!.id
      ])
    ).rejects.toThrow(/append-only/);
  });
});

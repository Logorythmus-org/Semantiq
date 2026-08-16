import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createPostgresPool,
  migrate,
  PostgresQuestionReadRepository,
  PostgresQuestionRelationUnitOfWork,
  PostgresQuestionSafetyUnitOfWork,
  PostgresQuestionSemanticUnitOfWork,
  PostgresQuestionUnitOfWork,
  type SqlPool
} from "../../packages/persistence/src/index.js";
import {
  ConfiguredQuestionSafetyCapabilityPolicy,
  createQuestionApplication,
  createQuestionDiscoveryApplication,
  createQuestionRelationApplication,
  createQuestionSafetyApplication,
  createQuestionSemanticApplication
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";

const connectionString = process.env.REAL_POSTGRES_TEST;
const suite = connectionString ? describe : describe.skip;
const clock = new FixedClock(new Date("2026-07-14T12:00:00.000Z"));

suite("Phase B complete Question Runtime", () => {
  let pool: SqlPool;

  beforeAll(async () => {
    pool = createPostgresPool(connectionString!);
    await migrate(pool);
    await pool.query("TRUNCATE questions, outbox_events, idempotency_records CASCADE");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("executes the complete deterministic domain journey and survives pool restart", async () => {
    const questions = createQuestionApplication({
      clock,
      createUnitOfWork: () => new PostgresQuestionUnitOfWork(pool)
    });
    const relations = createQuestionRelationApplication({
      clock,
      createUnitOfWork: () => new PostgresQuestionRelationUnitOfWork(pool)
    });
    const semantics = createQuestionSemanticApplication({
      clock,
      createUnitOfWork: () => new PostgresQuestionSemanticUnitOfWork(pool)
    });
    const discovery = createQuestionDiscoveryApplication({
      repository: new PostgresQuestionReadRepository(pool)
    });
    const safety = createQuestionSafetyApplication({
      clock,
      createUnitOfWork: () => new PostgresQuestionSafetyUnitOfWork(pool),
      capabilities: new ConfiguredQuestionSafetyCapabilityPolicy(["phase-b-moderator"])
    });

    const created = await questions.create({
      text: "How can multilingual inquiry remain trustworthy?\nچگونه می‌توان پرسش را شفاف نگه داشت؟ 🚀",
      language: "mixed",
      creatorId: "phase-b-owner",
      idempotencyKey: "phase-b-question-1",
      correlationId: "phase-b-create"
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const updated = await questions.update({
      questionId: created.value.id,
      expectedVersion: 1,
      text: "How can multilingual inquiry remain trustworthy?\nWie bleiben Fragen nachvollziehbar?\nچگونه پرسش شفاف می‌ماند؟ 🚀",
      actorId: "phase-b-owner",
      correlationId: "phase-b-update"
    });
    expect(updated).toMatchObject({ ok: true, value: { version: 2 } });
    expect(
      await questions.revisions({
        questionId: created.value.id,
        actorId: "phase-b-owner",
        correlationId: "phase-b-revisions"
      })
    ).toMatchObject({ ok: true, value: { revisions: [{ version: 2 }] } });

    const second = await questions.create({
      text: "Which evidence should a follow-up inquiry preserve?",
      language: "en",
      creatorId: "phase-b-second-owner",
      correlationId: "phase-b-create-second"
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(
      await relations.create({
        sourceQuestionId: created.value.id,
        targetQuestionId: second.value.id,
        type: "follow_up",
        actorId: "phase-b-owner",
        correlationId: "phase-b-relation"
      })
    ).toMatchObject({ ok: true, value: { type: "follow_up", status: "active" } });

    const frame = {
      context: ["A multilingual, local-only Tech Club runtime."],
      assumptions: ["Human authors remain responsible for meaning."],
      constraints: ["No LLM or vector database is required."],
      unknowns: ["Which review cadence works across languages?"],
      uncertainty: { level: "medium" as const, statements: ["Language effects remain unknown."] },
      scope: { inclusions: ["Human-authored Questions"], exclusions: ["Automatic answers"] },
      perspectives: ["Learner", "Moderator"],
      openPossibilities: ["A later Semantiq adapter"]
    };
    expect(
      await semantics.put({
        questionId: created.value.id,
        expectedVersion: 0,
        structure: frame,
        actorId: "phase-b-owner",
        correlationId: "phase-b-frame"
      })
    ).toMatchObject({ ok: true, value: { version: 1 } });
    expect(
      await semantics.snapshot({
        questionId: created.value.id,
        correlationId: "phase-b-snapshot"
      })
    ).toMatchObject({
      ok: true,
      value: { schemaVersion: "1.0", frame: { freshness: "fresh", version: 1 } }
    });
    expect(
      await discovery.search({
        textQuery: "multilingual inquiry",
        hasFrame: true,
        uncertaintyType: "medium",
        correlationId: "phase-b-search"
      })
    ).toMatchObject({ ok: true, value: { items: [{ id: created.value.id }] } });

    expect(
      await safety.addSource({
        questionId: created.value.id,
        sourceType: "repository",
        title: "Phase B local repository",
        locator: "repo:tech-club@phase-b",
        actorId: "phase-b-owner",
        correlationId: "phase-b-source"
      })
    ).toMatchObject({ ok: true });
    const report = await safety.submitReport({
      questionId: created.value.id,
      reporterId: "phase-b-reporter",
      reasonCode: "personal_data",
      description: "Review whether multilingual context contains sensitive personal data.",
      correlationId: "phase-b-report"
    });
    expect(report.ok).toBe(true);
    if (!report.ok) return;
    const opened = await safety.openCase({
      questionId: created.value.id,
      reportIds: [report.value.id],
      actorId: "phase-b-moderator",
      reason: "Conduct a bounded human review",
      correlationId: "phase-b-case"
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(
      await safety.applyAction({
        caseId: opened.value.id,
        actionType: "mark_under_review",
        expectedVersion: 1,
        actorId: "phase-b-moderator",
        reason: "Begin human review",
        correlationId: "phase-b-review"
      })
    ).toMatchObject({ ok: true });
    expect(
      await safety.applyAction({
        caseId: opened.value.id,
        actionType: "restrict_discovery",
        expectedVersion: 2,
        actorId: "phase-b-moderator",
        reason: "Restrict discovery until review completes",
        correlationId: "phase-b-restrict"
      })
    ).toMatchObject({ ok: true });
    expect(
      await discovery.search({ textQuery: "multilingual", correlationId: "phase-b-hidden-search" })
    ).toMatchObject({ ok: true, value: { items: [] } });
    expect(await safety.canReadQuestion(created.value.id)).toBe(false);
    expect(await safety.canReadQuestion(created.value.id, "phase-b-moderator")).toBe(true);
    expect(
      await safety.listAudit({ questionId: created.value.id, actorId: "phase-b-moderator" })
    ).toMatchObject({ ok: true });
    expect(await safety.trustSignals({ questionId: created.value.id })).toMatchObject({
      ok: true,
      value: { sourceCount: 1, framePresent: true, moderationState: "discovery_restricted" }
    });

    await pool.end();
    pool = createPostgresPool(connectionString!);
    const persisted = await pool.query<{
      question: string;
      relation: string;
      frame: string;
      source: string;
      report: string;
      moderation: string;
    }>(
      "SELECT (SELECT COUNT(*)::text FROM questions WHERE id=$1) question,(SELECT COUNT(*)::text FROM question_relations WHERE source_question_id=$1 AND status='active') relation,(SELECT COUNT(*)::text FROM question_semantic_structures WHERE question_id=$1) frame,(SELECT COUNT(*)::text FROM question_source_references WHERE question_id=$1) source,(SELECT COUNT(*)::text FROM question_reports WHERE question_id=$1) report,(SELECT state FROM question_moderation_states WHERE question_id=$1) moderation",
      [created.value.id]
    );
    expect(persisted.rows[0]).toEqual({
      question: "1",
      relation: "1",
      frame: "1",
      source: "1",
      report: "1",
      moderation: "discovery_restricted"
    });
  });
});

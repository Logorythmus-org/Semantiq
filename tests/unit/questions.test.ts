import { describe, expect, it } from "vitest";
import {
  createQuestionApplication,
  createMemoryQuestionApplication,
  MemoryQuestionRevisionRepository,
  MemoryQuestionRepository,
  MemoryQuestionUnitOfWork,
  Question,
  type QuestionEvent,
  QuestionText
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";

describe("Question Runtime minimal slice", () => {
  it("validates text and creates a deterministic published question event", () => {
    expect(new QuestionText("  How can learning change?  ").value).toBe("How can learning change?");
    expect(() => new QuestionText("short")).toThrow();
    const question = Question.create({
      id: "question-1",
      text: "How can learning change?",
      language: "en",
      correlationId: "corr-1",
      clock: new FixedClock(new Date("2026-01-01T00:00:00Z"))
    });
    expect(question.view()).toMatchObject({
      id: "question-1",
      status: "published",
      language: "en",
      version: 1
    });
    expect(question.pullEvents()[0]?.type).toBe("question.created");
  });

  it("creates, retrieves, and replays idempotently", async () => {
    const { application, unit } = createMemoryQuestionApplication();
    const command = {
      text: "How can uncertainty improve learning?",
      language: "en",
      correlationId: "corr-1",
      idempotencyKey: "question-key-1"
    };
    const first = await application.create(command);
    const replay = await application.create(command);
    expect(first.ok).toBe(true);
    expect(replay).toEqual(first);
    if (!first.ok) throw new Error("creation failed");
    expect(
      (await application.get({ questionId: first.value.id, correlationId: "corr-2" })).ok
    ).toBe(true);
    expect(unit.getOutbox()).toHaveLength(1);
  });

  it("rejects idempotency reuse with different content and malformed IDs", async () => {
    const { application } = createMemoryQuestionApplication();
    const first = await application.create({
      text: "How can uncertainty improve learning?",
      language: "en",
      correlationId: "corr-1",
      idempotencyKey: "question-key-2"
    });
    expect(first.ok).toBe(true);
    const conflict = await application.create({
      text: "How can technology change learning?",
      language: "en",
      correlationId: "corr-1",
      idempotencyKey: "question-key-2"
    });
    expect(conflict).toMatchObject({ ok: false, error: { category: "conflict" } });
    expect(await application.get({ questionId: "bad id", correlationId: "corr-1" })).toMatchObject({
      ok: false,
      error: { category: "validation" }
    });
  });

  it("updates, archives, restores, and records immutable ordered revisions", async () => {
    const { application, unit } = createMemoryQuestionApplication();
    const created = await application.create({
      text: "How can uncertainty improve learning?",
      language: "en",
      creatorId: "actor-1",
      correlationId: "create-corr"
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("creation failed");

    const updated = await application.update({
      questionId: created.value.id,
      text: "چگونه عدم قطعیت می‌تواند یادگیری را بهتر کند؟",
      expectedVersion: 1,
      actorId: "actor-1",
      reason: "شفاف‌سازی پرسش",
      idempotencyKey: "update-key-1",
      correlationId: "update-corr"
    });
    expect(updated).toMatchObject({
      ok: true,
      value: { version: 2, status: "published" }
    });
    const replay = await application.update({
      questionId: created.value.id,
      text: "چگونه عدم قطعیت می‌تواند یادگیری را بهتر کند؟",
      expectedVersion: 1,
      actorId: "actor-1",
      reason: "شفاف‌سازی پرسش",
      idempotencyKey: "update-key-1",
      correlationId: "another-correlation"
    });
    expect(replay).toEqual(updated);

    const archived = await application.archive({
      questionId: created.value.id,
      expectedVersion: 2,
      actorId: "actor-1",
      idempotencyKey: "archive-key-1",
      correlationId: "archive-corr"
    });
    expect(archived).toMatchObject({ ok: true, value: { version: 3, status: "archived" } });
    expect(
      await application.archive({
        questionId: created.value.id,
        expectedVersion: 2,
        actorId: "actor-1",
        idempotencyKey: "archive-key-1",
        correlationId: "archive-replay"
      })
    ).toEqual(archived);
    expect(
      await application.update({
        questionId: created.value.id,
        text: "Warum sollten archivierte Fragen unverändert bleiben?",
        expectedVersion: 3,
        actorId: "actor-1",
        correlationId: "blocked-corr"
      })
    ).toMatchObject({ ok: false, error: { code: "question_archived" } });

    const restored = await application.restore({
      questionId: created.value.id,
      expectedVersion: 3,
      actorId: "actor-1",
      idempotencyKey: "restore-key-1",
      correlationId: "restore-corr"
    });
    expect(restored).toMatchObject({ ok: true, value: { version: 4, status: "published" } });
    expect(
      await application.restore({
        questionId: created.value.id,
        expectedVersion: 3,
        actorId: "actor-1",
        idempotencyKey: "restore-key-1",
        correlationId: "restore-replay"
      })
    ).toEqual(restored);
    const history = await application.revisions({
      questionId: created.value.id,
      actorId: "actor-1",
      correlationId: "history-corr"
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
    if (!history.ok) throw new Error("history failed");
    expect(Object.isFrozen((await unit.revisions.listByQuestion(created.value.id))[0])).toBe(true);
    expect(unit.getOutbox().map((event) => event.type)).toEqual([
      "question.created",
      "question.updated",
      "question.archived",
      "question.restored"
    ]);
  });

  it("enforces creator, version, no-op, and idempotency conflict policies", async () => {
    const { application } = createMemoryQuestionApplication();
    const created = await application.create({
      text: "How should Question ownership constrain mutation?",
      language: "en",
      creatorId: "owner-1",
      correlationId: "create-corr"
    });
    if (!created.ok) throw new Error("creation failed");
    const common = {
      questionId: created.value.id,
      expectedVersion: 1,
      actorId: "owner-1",
      correlationId: "mutation-corr"
    };
    expect(await application.update({ ...common, text: created.value.text })).toMatchObject({
      ok: false,
      error: { code: "question_no_change" }
    });
    expect(await application.archive({ ...common, actorId: "other-actor" })).toMatchObject({
      ok: false,
      error: { code: "question_mutation_forbidden" }
    });
    expect(
      await application.update({
        ...common,
        expectedVersion: 2,
        text: "How should stale Question mutations be rejected?"
      })
    ).toMatchObject({ ok: false, error: { code: "question_version_conflict" } });
    const first = await application.update({
      ...common,
      text: "How should idempotent Question mutations be handled?",
      idempotencyKey: "mutation-key-1"
    });
    expect(first.ok).toBe(true);
    expect(
      await application.update({
        ...common,
        text: "How should conflicting mutation payloads be handled?",
        idempotencyKey: "mutation-key-1"
      })
    ).toMatchObject({ ok: false, error: { code: "idempotency_conflict" } });
    expect(
      await application.revisions({
        questionId: created.value.id,
        actorId: "other-actor",
        correlationId: "history-corr"
      })
    ).toMatchObject({ ok: false, error: { code: "question_mutation_forbidden" } });
  });

  it("rolls back Question, revision, and event when outbox persistence fails", async () => {
    class FailingOutboxUnitOfWork extends MemoryQuestionUnitOfWork {
      failOutbox = false;
      override async appendOutbox(event: QuestionEvent): Promise<void> {
        if (this.failOutbox) throw new Error("outbox unavailable");
        await super.appendOutbox(event);
      }
    }
    const questions = new MemoryQuestionRepository();
    const revisions = new MemoryQuestionRevisionRepository();
    const unit = new FailingOutboxUnitOfWork(questions, revisions);
    const application = createQuestionApplication({
      createUnitOfWork: () => unit,
      clock: new FixedClock(new Date("2026-01-01T00:00:00Z"))
    });
    const created = await application.create({
      text: "How should transactional rollback preserve Question state?",
      language: "en",
      creatorId: "owner-1",
      correlationId: "create-corr"
    });
    if (!created.ok) throw new Error("creation failed");
    unit.failOutbox = true;
    expect(
      await application.update({
        questionId: created.value.id,
        text: "How should failed outbox writes roll back all Question state?",
        expectedVersion: 1,
        actorId: "owner-1",
        correlationId: "failure-corr"
      })
    ).toMatchObject({ ok: false, error: { code: "persistence_error" } });
    expect((await questions.getById(created.value.id))?.version).toBe(1);
    expect(await revisions.listByQuestion(created.value.id)).toHaveLength(0);
    expect(unit.getOutbox()).toHaveLength(1);
  });

  it.each(["question", "revision", "outbox", "commit", "idempotency"] as const)(
    "rolls back atomically when the %s stage fails",
    async (stage) => {
      class FailingQuestionRepository extends MemoryQuestionRepository {
        fail = false;
        override async saveWithExpectedVersion(
          question: Question,
          expectedVersion: number
        ): Promise<boolean> {
          if (this.fail) throw new Error("question save failed");
          return super.saveWithExpectedVersion(question, expectedVersion);
        }
      }
      class FailingRevisionRepository extends MemoryQuestionRevisionRepository {
        fail = false;
        override async add(
          revision: import("../../packages/questions/src/index.js").QuestionRevision
        ): Promise<void> {
          if (this.fail) throw new Error("revision insert failed");
          await super.add(revision);
        }
      }
      class FailingUnitOfWork extends MemoryQuestionUnitOfWork {
        failOutbox = false;
        failCommit = false;
        failIdempotency = false;
        override async appendOutbox(event: QuestionEvent): Promise<void> {
          if (this.failOutbox) throw new Error("outbox insert failed");
          await super.appendOutbox(event);
        }
        override async commit(): Promise<void> {
          if (this.failCommit) throw new Error("commit failed");
          await super.commit();
        }
        override async putIdempotency(
          record: import("../../packages/questions/src/index.js").IdempotencyRecord
        ): Promise<void> {
          if (this.failIdempotency) throw new Error("idempotency insert failed");
          await super.putIdempotency(record);
        }
      }
      const questions = new FailingQuestionRepository();
      const revisions = new FailingRevisionRepository();
      const unit = new FailingUnitOfWork(questions, revisions);
      const application = createQuestionApplication({ createUnitOfWork: () => unit });
      const created = await application.create({
        text: "How should every failed persistence stage roll back atomically?",
        language: "en",
        creatorId: "owner-1",
        correlationId: "failure-create"
      });
      if (!created.ok) throw new Error("creation failed");
      questions.fail = stage === "question";
      revisions.fail = stage === "revision";
      unit.failOutbox = stage === "outbox";
      unit.failCommit = stage === "commit";
      unit.failIdempotency = stage === "idempotency";
      const result = await application.update({
        questionId: created.value.id,
        text: `How should a failed ${stage} stage preserve the previous Question state?`,
        expectedVersion: 1,
        actorId: "owner-1",
        idempotencyKey: `failure-${stage}-key`,
        correlationId: `failure-${stage}`
      });
      expect(result).toMatchObject({ ok: false, error: { code: "persistence_error" } });
      expect((await questions.getById(created.value.id))?.version).toBe(1);
      expect(await revisions.listByQuestion(created.value.id)).toHaveLength(0);
      expect(unit.getOutbox()).toHaveLength(1);
    }
  );
});

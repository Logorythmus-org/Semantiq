import { describe, expect, it } from "vitest";
import {
  LocalFixedWindowQuestionRateLimiter,
  MemoryQuestionRepository,
  Question,
  createMemoryQuestionSafetyApplication
} from "../../packages/questions/src/index.js";
import { FixedClock, type Clock } from "../../packages/shared/src/index.js";

const now = new Date("2026-07-14T10:00:00.000Z");

async function fixture() {
  const questions = new MemoryQuestionRepository();
  const question = Question.create({
    id: "question-1",
    text: "How should transparent moderation preserve legitimate uncertainty?",
    language: "en",
    creatorId: "creator-1",
    correlationId: "create-1",
    clock: new FixedClock(now)
  });
  question.pullEvents();
  await questions.add(question);
  const safety = createMemoryQuestionSafetyApplication({
    questions,
    moderatorActors: ["moderator-1"],
    clock: new FixedClock(new Date(now.getTime() + 1000))
  });
  return { questions, ...safety };
}

describe("Question trust and safety runtime", () => {
  it("normalizes source references, prevents active duplicates, and removes logically", async () => {
    const { application, unit } = await fixture();
    const added = await application.addSource({
      questionId: "question-1",
      sourceType: "web",
      title: "Policy source",
      locator: "HTTPS://Example.COM/policy#section",
      actorId: "creator-1",
      correlationId: "source-1",
      idempotencyKey: "source-key-0001"
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.value.normalizedLocator).toBe("https://example.com/policy");
    expect(added.value.declaredClassification).toBe("USER_DECLARED");
    expect(added.value.verificationClassification).toBe("SYSTEM_OBSERVED");

    const replay = await application.addSource({
      questionId: "question-1",
      sourceType: "web",
      title: "Policy source",
      locator: "HTTPS://Example.COM/policy#section",
      actorId: "creator-1",
      correlationId: "source-1",
      idempotencyKey: "source-key-0001"
    });
    expect(replay).toEqual(added);

    const duplicate = await application.addSource({
      questionId: "question-1",
      sourceType: "web",
      title: "Different title",
      locator: "https://example.com/policy",
      actorId: "creator-1",
      correlationId: "source-2"
    });
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.error.category).toBe("conflict");

    const removed = await application.removeSource({
      referenceId: added.value.id,
      expectedVersion: 1,
      actorId: "creator-1",
      reason: "Reference is no longer relevant",
      correlationId: "source-3"
    });
    expect(removed.ok && removed.value.status).toBe("removed");
    expect((await application.listSources({ questionId: "question-1" })).ok).toBe(true);
    const history = await application.listSources({
      questionId: "question-1",
      actorId: "moderator-1",
      includeRemoved: true
    });
    expect(history.ok && history.value).toHaveLength(1);
    expect(unit.getOutbox().map((event) => event.type)).toEqual([
      "question.source.added",
      "question.source.removed"
    ]);
  });

  it("keeps reports private and non-operative until an authorized explicit action", async () => {
    const { application, questions } = await fixture();
    const submitted = await application.submitReport({
      questionId: "question-1",
      reporterId: "reporter-1",
      reasonCode: "misleading_context",
      description: "The framing may omit material context and needs human review.",
      correlationId: "report-1"
    });
    expect(submitted.ok).toBe(true);
    expect(await application.canReadQuestion("question-1")).toBe(true);

    const publicReports = await application.listReports({
      questionId: "question-1",
      actorId: "reporter-1"
    });
    expect(publicReports.ok).toBe(false);
    const reports = await application.listReports({
      questionId: "question-1",
      actorId: "moderator-1"
    });
    expect(reports.ok && reports.value).toHaveLength(1);
    if (!submitted.ok) return;

    const opened = await application.openCase({
      questionId: "question-1",
      reportIds: [submitted.value.id],
      actorId: "moderator-1",
      reason: "Review the reported context",
      correlationId: "case-1"
    });
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    const restricted = await application.applyAction({
      caseId: opened.value.id,
      actionType: "restrict_discovery",
      expectedVersion: 1,
      actorId: "moderator-1",
      reason: "Temporarily restrict discovery during evidence review",
      correlationId: "action-1"
    });
    expect(restricted.ok).toBe(true);
    expect(await application.canReadQuestion("question-1")).toBe(false);
    expect(await application.canReadQuestion("question-1", "moderator-1")).toBe(true);

    const stale = await application.applyAction({
      caseId: opened.value.id,
      actionType: "no_action",
      expectedVersion: 1,
      actorId: "moderator-1",
      reason: "Stale concurrent decision",
      correlationId: "action-2"
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("question_safety_version_conflict");

    const archived = await application.applyAction({
      caseId: opened.value.id,
      actionType: "archive_question",
      expectedVersion: 2,
      actorId: "moderator-1",
      reason: "Archive after accountable review",
      correlationId: "action-3"
    });
    expect(archived.ok).toBe(true);
    expect((await questions.getById("question-1"))?.status).toBe("archived");

    const publicSignals = await application.trustSignals({ questionId: "question-1" });
    expect(publicSignals.ok && publicSignals.value.openReportCount).toBeUndefined();
    const internalSignals = await application.trustSignals({
      questionId: "question-1",
      actorId: "moderator-1"
    });
    expect(internalSignals.ok && internalSignals.value.openReportCount).toBe(0);
    const audit = await application.listAudit({
      questionId: "question-1",
      actorId: "moderator-1"
    });
    expect(audit.ok && audit.value.map((item) => item.action)).toContain(
      "question.moderation.action.applied"
    );
  });

  it("rolls back source state, audit, outbox, and idempotency together", async () => {
    const { application, unit } = await fixture();
    unit.safety.addAudit = async () => {
      throw new Error("audit unavailable");
    };
    const result = await application.addSource({
      questionId: "question-1",
      sourceType: "dataset",
      title: "Local dataset",
      locator: "dataset:local-1",
      actorId: "creator-1",
      correlationId: "rollback-1",
      idempotencyKey: "rollback-key-01"
    });
    expect(result.ok).toBe(false);
    expect(unit.safety.sources.size).toBe(0);
    expect(unit.getOutbox()).toHaveLength(0);
  });
});

class MutableClock implements Clock {
  constructor(private value: number) {}
  now(): Date {
    return new Date(this.value);
  }
  advance(milliseconds: number): void {
    this.value += milliseconds;
  }
}

describe("local Question rate limiter", () => {
  it("returns deterministic retry timing, resets windows, and bounds memory", () => {
    const clock = new MutableClock(now.getTime());
    const limiter = new LocalFixedWindowQuestionRateLimiter({ report: 2 }, clock, 60_000, 2);
    expect(limiter.consume("report", "actor-1").allowed).toBe(true);
    expect(limiter.consume("report", "actor-1").allowed).toBe(true);
    expect(limiter.consume("report", "actor-1")).toEqual({ allowed: false, retryAfterSeconds: 60 });
    limiter.consume("report", "actor-2");
    limiter.consume("report", "actor-3");
    expect(limiter.size()).toBeLessThanOrEqual(2);
    clock.advance(60_000);
    expect(limiter.consume("report", "actor-1").allowed).toBe(true);
  });
});

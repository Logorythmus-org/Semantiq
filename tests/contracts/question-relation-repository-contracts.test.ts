import { describe, expect, it } from "vitest";
import {
  MemoryQuestionRelationRepository,
  MemoryQuestionRelationUnitOfWork,
  MemoryQuestionRepository,
  Question,
  QuestionRelation
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";

const clock = new FixedClock(new Date("2026-03-02T00:00:00.000Z"));

function question(id: string, creatorId: string): Question {
  const value = Question.create({
    id,
    text: `How should ${id} participate in a reliable relation contract?`,
    language: "en",
    creatorId,
    correlationId: `create-${id}`,
    clock
  });
  value.pullEvents();
  return value;
}

function relation(
  id: string,
  source: Question,
  target: Question,
  type: "refines" | "alternative_to" | "broadens" | "narrows"
): QuestionRelation {
  const value = QuestionRelation.create({
    id,
    source,
    target,
    type,
    actorId: source.creatorId!,
    correlationId: `create-${id}`,
    clock
  });
  value.pullEvents();
  return value;
}

describe("Question relation repository contracts", () => {
  it("round-trips immutable relation fields and deterministic list order", async () => {
    const repository = new MemoryQuestionRelationRepository();
    const source = question("contract-source", "owner-a");
    const target = question("contract-target", "owner-b");
    await repository.add(relation("relation-b", source, target, "refines"));
    await repository.add(relation("relation-a", source, target, "alternative_to"));
    expect(await repository.getById("relation-a")).toMatchObject({
      id: "relation-a",
      type: "alternative_to",
      version: 1
    });
    expect(
      (
        await repository.list({
          questionIds: [source.id],
          direction: "both",
          limit: 10
        })
      ).map((item) => item.id)
    ).toEqual(["relation-a", "relation-b"]);
  });

  it("enforces symmetric and inverse semantic uniqueness", async () => {
    const repository = new MemoryQuestionRelationRepository();
    const source = question("unique-source", "owner-a");
    const target = question("unique-target", "owner-b");
    await repository.add(relation("relation-symmetric", source, target, "alternative_to"));
    await expect(
      repository.add(relation("relation-symmetric-reverse", target, source, "alternative_to"))
    ).rejects.toThrow(/equivalent/i);

    await repository.add(relation("relation-broadens", source, target, "broadens"));
    await expect(
      repository.add(relation("relation-narrows", target, source, "narrows"))
    ).rejects.toThrow(/equivalent/i);
  });

  it("restores relation, outbox, and idempotency snapshots on rollback", async () => {
    const questions = new MemoryQuestionRepository();
    const source = question("rollback-source", "owner-a");
    const target = question("rollback-target", "owner-b");
    await questions.add(source);
    await questions.add(target);
    const unit = new MemoryQuestionRelationUnitOfWork(questions);
    const value = QuestionRelation.create({
      id: "rollback-relation",
      source,
      target,
      type: "refines",
      actorId: "owner-a",
      correlationId: "rollback-contract",
      clock
    });
    const event = value.pullEvents()[0]!;
    await unit.begin("write");
    await unit.relations.add(value);
    await unit.appendOutbox(event);
    await unit.putIdempotency({
      scope: "question.relation.create",
      key: "rollback-key",
      fingerprint: "fingerprint",
      response: value.view()
    });
    await unit.rollback();
    expect(await unit.relations.getById(value.id)).toBeUndefined();
    expect(unit.getOutbox()).toHaveLength(0);
    await unit.begin("read");
    expect(await unit.getIdempotency("question.relation.create", "rollback-key")).toBeUndefined();
    await unit.commit();
  });
});

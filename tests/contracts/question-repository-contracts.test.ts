import { describe, expect, it } from "vitest";
import {
  MemoryQuestionRevisionRepository,
  MemoryQuestionRepository,
  MemoryQuestionUnitOfWork,
  Question
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";

function question(): Question {
  const value = Question.create({
    id: "contract-question-1",
    text: "How should a Question repository enforce optimistic persistence?",
    language: "en",
    creatorId: "contract-owner",
    correlationId: "contract-create",
    clock: new FixedClock(new Date("2026-01-01T00:00:00Z"))
  });
  value.pullEvents();
  return value;
}

describe("Question repository contracts", () => {
  it("saves only against the expected aggregate version", async () => {
    const repository = new MemoryQuestionRepository();
    const value = question();
    await repository.add(value);
    value.updateText({
      text: "How should compare-and-swap prevent lost Question updates?",
      expectedVersion: 1,
      actorId: "contract-owner",
      revisionId: "contract-revision-1",
      correlationId: "contract-update"
    });
    expect(await repository.saveWithExpectedVersion(value, 2)).toBe(false);
    expect(await repository.saveWithExpectedVersion(value, 1)).toBe(true);
    expect((await repository.getById(value.id))?.version).toBe(2);
  });

  it("enforces unique versions and deterministic revision order", async () => {
    const repository = new MemoryQuestionRevisionRepository();
    const value = question();
    const first = value.updateText({
      text: "How should revision order remain deterministic after an update?",
      expectedVersion: 1,
      actorId: "contract-owner",
      revisionId: "contract-revision-1",
      correlationId: "contract-update"
    }).revision;
    const second = value.archive({
      expectedVersion: 2,
      actorId: "contract-owner",
      revisionId: "contract-revision-2",
      correlationId: "contract-archive"
    }).revision;
    await repository.add(second);
    await repository.add(first);
    expect((await repository.listByQuestion(value.id)).map((item) => item.version)).toEqual([2, 3]);
    await expect(repository.add(first)).rejects.toThrow(/already exists/);
  });

  it("restores aggregate and revision snapshots on rollback", async () => {
    const unit = new MemoryQuestionUnitOfWork();
    const value = question();
    await unit.begin();
    await unit.questions.add(value);
    await unit.commit();
    await unit.begin();
    const loaded = await unit.questions.getById(value.id);
    if (!loaded) throw new Error("Question missing");
    const mutation = loaded.archive({
      expectedVersion: 1,
      actorId: "contract-owner",
      revisionId: "contract-revision-1",
      correlationId: "contract-archive"
    });
    await unit.questions.saveWithExpectedVersion(loaded, 1);
    await unit.revisions.add(mutation.revision);
    await unit.appendOutbox(mutation.event);
    await unit.rollback();
    expect((await unit.questions.getById(value.id))?.version).toBe(1);
    expect(await unit.revisions.listByQuestion(value.id)).toHaveLength(0);
    expect(unit.getOutbox()).toHaveLength(0);
  });
});

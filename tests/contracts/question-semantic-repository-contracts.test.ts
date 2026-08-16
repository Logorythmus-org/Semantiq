import { describe, expect, it } from "vitest";
import {
  MemoryQuestionSemanticRevisionRepository,
  MemoryQuestionSemanticStructureRepository,
  Question,
  QuestionSemanticStructure,
  type QuestionSemanticStructureInput
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";

const firstContent: QuestionSemanticStructureInput = {
  context: ["A repository contract context."],
  assumptions: ["Stored values are restored through domain validation."],
  constraints: [],
  unknowns: [],
  uncertainty: { level: "unspecified", statements: [] },
  scope: { inclusions: [], exclusions: [] },
  perspectives: [],
  openPossibilities: []
};

function question() {
  return Question.create({
    id: "semantic-contract-question",
    text: "How should semantic repositories preserve domain invariants?",
    language: "en",
    creatorId: "semantic-contract-owner",
    correlationId: "question-create",
    clock: new FixedClock(new Date("2026-01-01T00:00:00Z"))
  });
}

function structure() {
  return QuestionSemanticStructure.create({
    question: question(),
    content: firstContent,
    actorId: "semantic-contract-owner",
    correlationId: "semantic-create",
    clock: new FixedClock(new Date("2026-01-01T00:01:00Z"))
  });
}

describe("Question semantic repository contracts", () => {
  it("round-trips current state and enforces expected-version saves", async () => {
    const repository = new MemoryQuestionSemanticStructureRepository();
    const value = structure();
    await repository.add(value);
    expect((await repository.getByQuestionId(value.questionId))?.view()).toEqual(value.view());

    const restored = await repository.getByQuestionIdForUpdate(value.questionId);
    if (!restored) throw new Error("Semantic structure missing");
    restored.replace({
      question: question(),
      content: { ...firstContent, constraints: ["Preserve optimistic concurrency."] },
      expectedVersion: 1,
      actorId: "semantic-contract-owner",
      revisionId: "semantic-revision-2",
      correlationId: "semantic-update",
      clock: new FixedClock(new Date("2026-01-01T00:02:00Z"))
    });
    expect(await repository.saveWithExpectedVersion(restored, 1)).toBe(true);
    expect(await repository.saveWithExpectedVersion(restored, 1)).toBe(false);
    expect((await repository.getByQuestionId(value.questionId))?.version).toBe(2);
  });

  it("returns immutable revisions in aggregate-version order", async () => {
    const repository = new MemoryQuestionSemanticRevisionRepository();
    const value = structure();
    const second = value.replace({
      question: question(),
      content: { ...firstContent, unknowns: ["What remains unknown at version two?"] },
      expectedVersion: 1,
      actorId: "semantic-contract-owner",
      revisionId: "semantic-revision-2",
      correlationId: "semantic-update-2",
      clock: new FixedClock(new Date("2026-01-01T00:02:00Z"))
    });
    const third = value.replace({
      question: question(),
      content: { ...firstContent, unknowns: ["What remains unknown at version three?"] },
      expectedVersion: 2,
      actorId: "semantic-contract-owner",
      revisionId: "semantic-revision-3",
      correlationId: "semantic-update-3",
      clock: new FixedClock(new Date("2026-01-01T00:03:00Z"))
    });
    await repository.add(third.revision);
    await repository.add(second.revision);
    expect((await repository.listByQuestion(value.questionId)).map((item) => item.version)).toEqual(
      [2, 3]
    );
    await expect(repository.add(second.revision)).rejects.toThrow(/already exists/);
  });
});

import { describe, expect, it } from "vitest";
import {
  MemoryQuestionReadRepository,
  MemoryQuestionRepository,
  normalizeQuestionQuery,
  Question,
  type QuestionReadRepository
} from "../../packages/questions/src/index.js";

async function repositoryFixture(): Promise<QuestionReadRepository> {
  const questions = new MemoryQuestionRepository();
  for (const [id, createdAt] of [
    ["contract-question-a", "2026-02-01T00:00:00.000Z"],
    ["contract-question-b", "2026-02-02T00:00:00.000Z"],
    ["contract-question-c", "2026-02-02T00:00:00.000Z"]
  ] as const)
    await questions.add(
      Question.restore({
        id,
        text: `How should ${id} satisfy the discovery repository contract?`,
        status: "published",
        language: "en",
        source: "human",
        creatorId: "contract-owner",
        createdAt: new Date(createdAt),
        updatedAt: new Date(createdAt),
        version: 1
      })
    );
  return new MemoryQuestionReadRepository({ questions });
}

describe("QuestionReadRepository contract", () => {
  it("returns deterministic bounded list and search results", async () => {
    const repository = await repositoryFixture();
    const listSpec = normalizeQuestionQuery({
      correlationId: "contract-list",
      limit: 2
    }).spec;
    expect((await repository.listQuestions(listSpec)).map((item) => item.id)).toEqual([
      "contract-question-c",
      "contract-question-b",
      "contract-question-a"
    ]);
    const searchSpec = normalizeQuestionQuery({
      correlationId: "contract-search",
      textQuery: "repository contract",
      limit: 2
    }).spec;
    expect(await repository.searchQuestions(searchSpec)).toHaveLength(3);
  });

  it("returns transport-neutral summary/detail values and explicit absence", async () => {
    const repository = await repositoryFixture();
    const summary = await repository.getQuestionSummary("contract-question-a");
    expect(summary).toMatchObject({
      id: "contract-question-a",
      hasFrame: false,
      relationCount: 0
    });
    expect(summary).not.toHaveProperty("pullEvents");
    expect(summary).not.toHaveProperty("searchText");
    expect(summary).not.toHaveProperty("outbox");
    expect(await repository.getQuestionDetail("contract-question-a")).toMatchObject({
      frame: undefined,
      relations: { count: 0, types: [] }
    });
    expect(await repository.getQuestionSummary("missing-question")).toBeUndefined();
    expect(await repository.questionExists("missing-question")).toBe(false);
  });
});

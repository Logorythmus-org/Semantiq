import { describe, expect, it } from "vitest";
import {
  createMemoryQuestionDiscoveryApplication,
  decodeQuestionCursor,
  encodeQuestionCursor,
  MemoryQuestionRelationRepository,
  MemoryQuestionRepository,
  MemoryQuestionSemanticStructureRepository,
  normalizeQuestionQuery,
  normalizeQuestionSearchText,
  Question,
  QuestionRelation,
  QuestionSemanticStructure,
  type QuestionSemanticStructureInput
} from "../../packages/questions/src/index.js";

const semanticContent: QuestionSemanticStructureInput = {
  context: ["A local discovery test."],
  assumptions: ["Current semantic statements are explicit."],
  constraints: ["No external search engine is available."],
  unknowns: ["Which filters will be most useful?"],
  uncertainty: { level: "medium", statements: ["Usage patterns are not known yet."] },
  scope: { inclusions: ["Question discovery"], exclusions: ["Recommendation ranking"] },
  perspectives: ["Question creator"],
  openPossibilities: ["A future search adapter"]
};

async function fixture() {
  const questions = new MemoryQuestionRepository();
  const structures = new MemoryQuestionSemanticStructureRepository();
  const relations = new MemoryQuestionRelationRepository();
  const values = [
    restoredQuestion("question-001", "How should English architecture remain discoverable?", {
      createdAt: "2026-01-01T00:00:00.000Z"
    }),
    restoredQuestion("question-002", "Wie bleibt eine deutsche Frage auffindbar?", {
      language: "de",
      createdAt: "2026-01-02T00:00:00.000Z"
    }),
    restoredQuestion("question-003", "چگونه پرسش معماری قابل کشف می‌ماند؟", {
      language: "fa",
      creatorId: "creator-fa",
      createdAt: "2026-01-03T00:00:00.000Z"
    }),
    restoredQuestion("question-004", "Which archived Question should stay hidden by default?", {
      status: "archived",
      createdAt: "2026-01-04T00:00:00.000Z",
      version: 2
    }),
    restoredQuestion("question-005", "Which stale semantic frame needs another review?", {
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-06T00:00:00.000Z",
      version: 2
    }),
    restoredQuestion("question-006", "Which current semantic frame has no unknowns?", {
      createdAt: "2026-01-05T00:00:00.000Z",
      updatedAt: "2026-01-07T00:00:00.000Z"
    })
  ];
  for (const value of values) await questions.add(value);
  await structures.add(
    QuestionSemanticStructure.restore({
      questionId: "question-005",
      content: semanticContent,
      questionVersionAtLastUpdate: 1,
      createdBy: "creator-main",
      updatedBy: "creator-main",
      createdAt: new Date("2026-01-05T00:01:00.000Z"),
      updatedAt: new Date("2026-01-05T00:01:00.000Z"),
      version: 1
    })
  );
  await structures.add(
    QuestionSemanticStructure.restore({
      questionId: "question-006",
      content: {
        ...semanticContent,
        assumptions: [],
        unknowns: [],
        uncertainty: { level: "low", statements: ["Only implementation risk remains."] }
      },
      questionVersionAtLastUpdate: 1,
      createdBy: "creator-main",
      updatedBy: "creator-main",
      createdAt: new Date("2026-01-05T00:01:00.000Z"),
      updatedAt: new Date("2026-01-05T00:01:00.000Z"),
      version: 2
    })
  );
  await relations.add(
    QuestionRelation.restore({
      id: "relation-001",
      sourceQuestionId: "question-001",
      targetQuestionId: "question-002",
      type: "refines",
      createdBy: "creator-main",
      createdAt: new Date("2026-01-08T00:00:00.000Z"),
      version: 1
    })
  );
  await relations.add(
    QuestionRelation.restore({
      id: "relation-002",
      sourceQuestionId: "question-003",
      targetQuestionId: "question-001",
      type: "depends_on",
      createdBy: "creator-fa",
      createdAt: new Date("2026-01-08T00:01:00.000Z"),
      version: 1
    })
  );
  return {
    ...createMemoryQuestionDiscoveryApplication({ questions, structures, relations }),
    questions,
    structures,
    relations
  };
}

describe("Question discovery domain", () => {
  it("normalizes English, German, Persian variants, Unicode, and whitespace deterministically", () => {
    expect(normalizeQuestionSearchText("  ARCHITEKTUR\tund  Frage ")).toBe("architektur und frage");
    expect(normalizeQuestionSearchText("پرسش ي ك‌ معماری")).toBe("پرسش ی ک معماری");
    expect(normalizeQuestionSearchText("Ａrchitecture")).toBe("architecture");
    expect(normalizeQuestionSearchText("   ")).toBeUndefined();
    expect(() => normalizeQuestionSearchText("unsafe\u0000query")).toThrow(/control character/);
    expect(() => normalizeQuestionSearchText("x".repeat(201))).toThrow(/200 characters/);
  });

  it("encodes versioned opaque cursors and rejects tampering or query reuse", () => {
    const normalized = normalizeQuestionQuery({ correlationId: "cursor-test", language: "en" });
    const cursor = encodeQuestionCursor({
      sort: normalized.spec.sort,
      queryHash: normalized.queryHash,
      position: { sortValue: "2026-01-01T00:00:00.000Z", id: "question-001" }
    });
    expect(cursor).not.toContain("question-001");
    expect(decodeQuestionCursor(cursor, "newest", normalized.queryHash)).toEqual({
      sortValue: "2026-01-01T00:00:00.000Z",
      id: "question-001"
    });
    expect(() => decodeQuestionCursor(`${cursor}x`, "newest", normalized.queryHash)).toThrow(
      /invalid or incompatible/
    );
    expect(() => decodeQuestionCursor(cursor, "oldest", normalized.queryHash)).toThrow(
      /invalid or incompatible/
    );
    const changed = normalizeQuestionQuery({ correlationId: "cursor-test", language: "de" });
    expect(() => decodeQuestionCursor(cursor, "newest", changed.queryHash)).toThrow(
      /invalid or incompatible/
    );
  });

  it("uses stable keyset pagination with a deterministic ID tie-breaker", async () => {
    const { application } = await fixture();
    const first = await application.list({
      status: "all",
      limit: 2,
      correlationId: "page-1"
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.items.map((item) => item.id)).toEqual(["question-006", "question-005"]);
    expect(first.value.page).toMatchObject({ hasMore: true, limit: 2 });
    const firstCursor = first.value.page.nextCursor;
    if (!firstCursor) throw new Error("First page cursor missing");

    const second = await application.list({
      status: "all",
      limit: 2,
      cursor: firstCursor,
      correlationId: "page-2"
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.items.map((item) => item.id)).toEqual(["question-004", "question-003"]);
    const secondCursor = second.value.page.nextCursor;
    if (!secondCursor) throw new Error("Second page cursor missing");
    const third = await application.list({
      status: "all",
      limit: 2,
      cursor: secondCursor,
      correlationId: "page-3"
    });
    expect(third).toMatchObject({
      ok: true,
      value: { page: { hasMore: false }, items: [{ id: "question-002" }, { id: "question-001" }] }
    });
  });

  it("composes lifecycle, language, frame, uncertainty, and relation filters", async () => {
    const { application } = await fixture();
    expect(
      await ids(application.search({ textQuery: "مـي‌ماند", language: "fa", correlationId: "fa" }))
    ).toEqual(["question-003"]);
    expect(await ids(application.list({ frameStale: true, correlationId: "stale" }))).toEqual([
      "question-005"
    ]);
    expect(
      await ids(
        application.list({
          hasFrame: true,
          hasAssumptions: true,
          hasUnknowns: true,
          uncertaintyType: "medium",
          correlationId: "semantic"
        })
      )
    ).toEqual(["question-005"]);
    expect(
      await ids(
        application.list({
          relatedToQuestionId: "question-001",
          relationType: "refines",
          relationDirection: "outgoing",
          correlationId: "outgoing"
        })
      )
    ).toEqual(["question-002"]);
    expect(
      await ids(
        application.list({
          relatedToQuestionId: "question-001",
          relationDirection: "incoming",
          correlationId: "incoming"
        })
      )
    ).toEqual(["question-003"]);
  });

  it("returns bounded read models and stable validation errors", async () => {
    const { application } = await fixture();
    expect(
      await application.getDetail({ questionId: "question-005", correlationId: "detail" })
    ).toMatchObject({
      ok: true,
      value: {
        frame: { stale: true, assumptionCount: 1, constraintCount: 1, unknownCount: 1 },
        relations: { count: 0 }
      }
    });
    expect(await application.list({ limit: 101, correlationId: "invalid-limit" })).toMatchObject({
      ok: false,
      error: { code: "question_page_size_invalid" }
    });
    expect(
      await application.list({
        createdAfter: "2026-02-01T00:00:00Z",
        createdBefore: "2026-01-01T00:00:00Z",
        correlationId: "invalid-range"
      })
    ).toMatchObject({ ok: false, error: { code: "question_time_range_invalid" } });
    expect(
      await application.list({ hasFrame: false, frameStale: false, correlationId: "invalid-frame" })
    ).toMatchObject({ ok: false, error: { code: "question_filter_invalid" } });
    expect(
      await application.list({ constraintType: "technical", correlationId: "constraint-type" })
    ).toMatchObject({ ok: false, error: { code: "question_constraint_filter_invalid" } });
    expect(
      await application.list({
        relatedToQuestionId: "missing-question",
        correlationId: "missing-related"
      })
    ).toMatchObject({ ok: false, error: { code: "question_not_found" } });
  });
});

function restoredQuestion(
  id: string,
  text: string,
  overrides: {
    readonly status?: "published" | "archived";
    readonly language?: string;
    readonly creatorId?: string;
    readonly createdAt?: string;
    readonly updatedAt?: string;
    readonly version?: number;
  } = {}
): Question {
  const createdAt = overrides.createdAt ?? "2026-01-01T00:00:00.000Z";
  return Question.restore({
    id,
    text,
    status: overrides.status ?? "published",
    language: overrides.language ?? "en",
    source: "human",
    creatorId: overrides.creatorId ?? "creator-main",
    createdAt: new Date(createdAt),
    updatedAt: new Date(overrides.updatedAt ?? createdAt),
    version: overrides.version ?? 1
  });
}

async function ids(
  promise: ReturnType<
    ReturnType<typeof createMemoryQuestionDiscoveryApplication>["application"]["list"]
  >
): Promise<readonly string[]> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error.code);
  return result.value.items.map((item) => item.id);
}

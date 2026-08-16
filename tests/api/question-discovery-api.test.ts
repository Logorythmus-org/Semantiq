import { afterEach, describe, expect, it } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionDiscoveryApplication,
  createMemoryQuestionRelationApplication,
  createMemoryQuestionSemanticApplication
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

describe("Question discovery API", () => {
  let api: ApiApplication | undefined;

  afterEach(async () => {
    await api?.stop();
    api = undefined;
  });

  async function start() {
    const questions = createMemoryQuestionApplication(
      new FixedClock(new Date("2026-03-01T00:00:00.000Z"))
    );
    const semantics = createMemoryQuestionSemanticApplication(questions.unit.questions);
    const relations = createMemoryQuestionRelationApplication(questions.unit.questions);
    const discovery = createMemoryQuestionDiscoveryApplication({
      questions: questions.unit.questions,
      structures: semantics.unit.structures,
      relations: relations.unit.relations
    });
    api = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionSemanticApplication: semantics.application,
      questionRelationApplication: relations.application,
      questionDiscoveryApplication: discovery.application
    });
    await api.start();
    const address = api.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    const base = `http://127.0.0.1:${address.port}/api/v1/questions`;
    const english = await createQuestion(
      base,
      "How should architecture improve Question discovery?",
      "en",
      "api-owner"
    );
    const german = await createQuestion(
      base,
      "Wie verbessert Architektur die Suche nach einer Frage?",
      "de",
      "api-owner"
    );
    const persian = await createQuestion(
      base,
      "چگونه پرسش معماری در جستجو پیدا می‌شود؟",
      "fa",
      "api-fa-owner"
    );
    const frame = await semantics.application.put({
      questionId: english,
      expectedVersion: 0,
      structure: {
        context: ["A local API discovery flow."],
        assumptions: ["The API caller supplied this statement."],
        constraints: ["No external search service is used."],
        unknowns: ["Which filter is most useful?"],
        uncertainty: { level: "medium", statements: ["Usage is not measured."] },
        scope: { inclusions: ["Discovery API"], exclusions: ["Recommendation"] },
        perspectives: ["API client"],
        openPossibilities: ["Future provider adapters"]
      },
      actorId: "api-owner",
      correlationId: "api-frame-create"
    });
    if (!frame.ok) throw new Error(frame.error.code);
    const relation = await relations.application.create({
      sourceQuestionId: english,
      targetQuestionId: german,
      type: "refines",
      actorId: "api-owner",
      correlationId: "api-relation-create"
    });
    if (!relation.ok) throw new Error(relation.error.code);
    return { base, questions, english, german, persian };
  }

  it("lists, searches, paginates, filters, and returns a bounded detail model", async () => {
    const { base, english, german } = await start();
    const listing = await fetch(base);
    expect(listing.status).toBe(200);
    const listed = (await listing.json()) as {
      data: {
        items: Array<{ id: string }>;
        page: { hasMore: boolean; limit: number; nextCursor?: string };
        query: { sort: string };
      };
    };
    expect(listed.data.items).toHaveLength(3);
    expect(listed.data.page).toMatchObject({ hasMore: false, limit: 20 });
    expect(listed.data.query.sort).toBe("newest");

    const firstPage = await json<{
      data: { items: Array<{ id: string }>; page: { nextCursor: string; hasMore: boolean } };
    }>(`${base}?status=all&limit=2`);
    expect(firstPage.data.page.hasMore).toBe(true);
    const secondPage = await json<{
      data: { items: Array<{ id: string }>; page: { hasMore: boolean } };
    }>(`${base}?status=all&limit=2&cursor=${encodeURIComponent(firstPage.data.page.nextCursor)}`);
    expect(secondPage.data.page.hasMore).toBe(false);
    expect(
      new Set([
        ...firstPage.data.items.map((item) => item.id),
        ...secondPage.data.items.map((item) => item.id)
      ]).size
    ).toBe(3);

    expect(
      (await json<{ data: { items: Array<{ id: string }> } }>(`${base}?q=ARCHITECTURE`)).data.items
    ).toEqual([expect.objectContaining({ id: english })]);
    expect(
      (
        await json<{ data: { items: Array<{ id: string }> } }>(
          `${base}?has_frame=true&has_assumptions=true&uncertainty_type=medium`
        )
      ).data.items.map((item) => item.id)
    ).toEqual([english]);
    expect(
      (
        await json<{ data: { items: Array<{ id: string }> } }>(
          `${base}?related_to_question_id=${english}&relation_type=refines&relation_direction=outgoing`
        )
      ).data.items.map((item) => item.id)
    ).toEqual([german]);
    expect(await json(`${base}/${english}/detail`)).toMatchObject({
      data: {
        id: english,
        hasFrame: true,
        frame: { stale: false, assumptionCount: 1 },
        relations: { count: 1, types: ["refines"] }
      }
    });
  });

  it("enforces lifecycle visibility and immediate archive/restore discovery", async () => {
    const { base, questions, persian } = await start();
    expect(
      (await json<{ data: { items: Array<{ id: string }> } }>(`${base}?q=پرسش`)).data.items.map(
        (item) => item.id
      )
    ).toEqual([persian]);
    expect(
      await questions.application.archive({
        questionId: persian,
        expectedVersion: 1,
        actorId: "api-fa-owner",
        correlationId: "api-discovery-archive"
      })
    ).toMatchObject({ ok: true });
    expect((await json<{ data: { items: unknown[] } }>(`${base}?q=پرسش`)).data.items).toEqual([]);
    expect(
      (
        await json<{ data: { items: Array<{ id: string }> } }>(`${base}?q=پرسش&status=archived`)
      ).data.items.map((item) => item.id)
    ).toEqual([persian]);
    expect(
      await questions.application.restore({
        questionId: persian,
        expectedVersion: 2,
        actorId: "api-fa-owner",
        correlationId: "api-discovery-restore"
      })
    ).toMatchObject({ ok: true });
    expect(
      (await json<{ data: { items: Array<{ id: string }> } }>(`${base}?q=پرسش`)).data.items.map(
        (item) => item.id
      )
    ).toEqual([persian]);
  });

  it("returns stable errors for malformed and unsupported query contracts", async () => {
    const { base } = await start();
    const cases = [
      ["?limit=101", 422, "question_page_size_invalid"],
      ["?limit=not-a-number", 422, "question_page_size_invalid"],
      ["?sort=popular", 422, "question_sort_invalid"],
      ["?cursor=not-a-cursor", 422, "question_cursor_invalid"],
      ["?has_frame=perhaps", 422, "question_filter_invalid"],
      ["?language=EN", 422, "question_language_invalid"],
      ["?created_after=2026-01-01", 422, "question_time_range_invalid"],
      [
        "?created_after=2026-02-01T00%3A00%3A00Z&created_before=2026-01-01T00%3A00%3A00Z",
        422,
        "question_time_range_invalid"
      ],
      ["?uncertainty_type=epistemic", 422, "question_uncertainty_filter_invalid"],
      ["?constraint_type=technical", 422, "question_constraint_filter_invalid"],
      ["?relation_type=arbitrary", 422, "question_relation_filter_invalid"],
      ["?unknown_filter=true", 422, "question_query_invalid"],
      ["?language=en&language=de", 422, "question_query_invalid"]
    ] as const;
    for (const [query, status, code] of cases) {
      const response = await fetch(`${base}${query}`);
      expect(response.status, query).toBe(status);
      expect(await response.json(), query).toMatchObject({ error: { code } });
    }

    const missing = await fetch(`${base}?related_to_question_id=missing-question`);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "question_not_found" } });
    const empty = await fetch(`${base}?q=`);
    expect(empty.status).toBe(200);
    const emptyBody = (await empty.json()) as { data: { items: unknown } };
    expect(Array.isArray(emptyBody.data.items)).toBe(true);
  });

  it("fails explicitly when the read runtime is not configured", async () => {
    const questions = createMemoryQuestionApplication();
    api = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application
    });
    await api.start();
    const address = api.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/questions`);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "QUESTION_DISCOVERY_RUNTIME_NOT_CONFIGURED" }
    });
  });
});

async function createQuestion(
  base: string,
  text: string,
  language: string,
  actorId: string
): Promise<string> {
  const response = await fetch(base, {
    method: "POST",
    headers: { "content-type": "application/json", "x-actor-id": actorId },
    body: JSON.stringify({ text, language })
  });
  if (response.status !== 201) throw new Error(`Question creation failed: ${response.status}`);
  return ((await response.json()) as { data: { id: string } }).data.id;
}

async function json<T = Record<string, unknown>>(url: string): Promise<T> {
  const response = await fetch(url);
  expect(response.status).toBe(200);
  return (await response.json()) as T;
}

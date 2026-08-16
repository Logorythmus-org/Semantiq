import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionDiscoveryApplication,
  createQuestionDiscoveryApplication,
  type QuestionReadRepository
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

describe("Question discovery security boundary", () => {
  let api: ApiApplication | undefined;

  afterEach(async () => {
    await api?.stop();
    api = undefined;
    vi.restoreAllMocks();
  });

  async function start() {
    const questions = createMemoryQuestionApplication();
    const created = await questions.application.create({
      text: "How should a private-search-intent-secret remain safely discoverable?",
      language: "en",
      creatorId: "security-owner",
      correlationId: "security-create"
    });
    if (!created.ok) throw new Error(created.error.code);
    const discovery = createMemoryQuestionDiscoveryApplication({
      questions: questions.unit.questions
    });
    api = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionDiscoveryApplication: discovery.application
    });
    await api.start();
    const address = api.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    return {
      base: `http://127.0.0.1:${address.port}/api/v1/questions`,
      questions,
      questionId: created.value.id
    };
  }

  it("treats SQL, wildcard, and script-like input as literal text", async () => {
    const { base } = await start();
    for (const query of ["' OR 1=1 --", "%", "_", "<script>alert(1)</script>"]) {
      const response = await fetch(`${base}?${new URLSearchParams({ q: query })}`);
      expect(response.status, query).toBe(200);
      const body = (await response.json()) as { data: { items: unknown[] } };
      expect(body.data.items, query).toEqual([]);
      expect(JSON.stringify(body)).not.toContain("<mark>");
    }
  });

  it("bounds query, cursor, page size, enums, repeated filters, and Unicode controls", async () => {
    const { base } = await start();
    const cases = [
      new URLSearchParams({ q: "x".repeat(201) }),
      new URLSearchParams({ cursor: "a".repeat(513) }),
      new URLSearchParams({ limit: "1000000" }),
      new URLSearchParams({ sort: "id;DROP TABLE questions" }),
      new URLSearchParams({ relation_type: "anything" }),
      new URLSearchParams({ uncertainty_type: "anything" }),
      new URLSearchParams({ constraint_type: "anything" }),
      new URLSearchParams({ q: "unsafe\u0000query" }),
      new URLSearchParams({ q: "unsafe\u202Equery" })
    ];
    const repeated = new URLSearchParams();
    repeated.append("has_frame", "true");
    repeated.append("has_frame", "false");
    cases.push(repeated);
    for (const query of cases) {
      const response = await fetch(`${base}?${query}`);
      expect(response.status, query.toString()).toBe(422);
      const body: unknown = await response.json();
      expect(JSON.stringify(body)).not.toMatch(/SELECT|DROP TABLE|pg_trgm|gin_trgm_ops/i);
    }
  });

  it("does not log raw search intent and does not leak archived matches", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { base, questions, questionId } = await start();
    const response = await fetch(
      `${base}?${new URLSearchParams({ q: "private-search-intent-secret" })}`
    );
    expect(response.status).toBe(200);
    const logs = log.mock.calls.map((entry) => entry.join(" ")).join("\n");
    expect(logs).toContain("question.discovery");
    expect(logs).toContain("normalizedQueryLength");
    expect(logs).not.toContain("private-search-intent-secret");

    await questions.application.archive({
      questionId,
      expectedVersion: 1,
      actorId: "security-owner",
      correlationId: "security-archive"
    });
    const archived = await fetch(
      `${base}?${new URLSearchParams({ q: "private-search-intent-secret" })}`
    );
    expect(await archived.json()).toMatchObject({ data: { items: [] } });
  });

  it("sanitizes read-repository failures", async () => {
    const questions = createMemoryQuestionApplication();
    const failing: QuestionReadRepository = {
      listQuestions: async () => {
        throw new Error("SELECT secret FROM internal_table USING gin_trgm_ops");
      },
      searchQuestions: async () => {
        throw new Error("database password and query plan");
      },
      getQuestionSummary: async () => undefined,
      getQuestionDetail: async () => undefined,
      questionExists: async () => true
    };
    api = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionDiscoveryApplication: createQuestionDiscoveryApplication({ repository: failing })
    });
    await api.start();
    const address = api.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/questions?q=safe-query`);
    expect(response.status).toBe(503);
    const body: unknown = await response.json();
    expect(body).toMatchObject({ error: { code: "question_search_unavailable" } });
    expect(JSON.stringify(body)).not.toMatch(/SELECT secret|password|gin_trgm_ops/i);
  });
});

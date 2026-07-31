import { afterEach, describe, expect, it } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionRelationApplication,
  createMemoryQuestionSafetyApplication,
  createMemoryQuestionSemanticApplication,
  LocalFixedWindowQuestionRateLimiter
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

describe("Question trust and safety API", () => {
  let server: ApiApplication | undefined;
  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  it("exposes safe provenance and explicit moderation without leaking reports", async () => {
    const questions = createMemoryQuestionApplication();
    const safety = createMemoryQuestionSafetyApplication({
      questions: questions.unit.questions,
      moderatorActors: ["moderator-api"]
    });
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionSafetyApplication: safety.application
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind");
    const base = `http://127.0.0.1:${address.port}/api/v1/questions`;
    const created = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "creator-api" },
      body: JSON.stringify({
        text: "How should a public API preserve provenance without leaking private reports?",
        language: "en"
      })
    });
    const questionId = ((await created.json()) as { data: { id: string } }).data.id;
    const source = await fetch(`${base}/${questionId}/sources`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "creator-api" },
      body: JSON.stringify({
        sourceType: "repository",
        title: "Local repository",
        locator: "repo:tech-club@prompt-6"
      })
    });
    expect(source.status).toBe(201);
    const report = await fetch(`${base}/${questionId}/reports`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "reporter-api" },
      body: JSON.stringify({
        reasonCode: "personal_data",
        description: "This Question may contain personal data requiring review."
      })
    });
    expect(report.status).toBe(201);
    const reportId = ((await report.json()) as { data: { id: string } }).data.id;
    expect(
      (await fetch(`${base}/${questionId}/reports`, { headers: { "x-actor-id": "reporter-api" } }))
        .status
    ).toBe(403);
    const opened = await fetch(`${base}/${questionId}/moderation-cases`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "moderator-api" },
      body: JSON.stringify({ reportIds: [reportId], reason: "Review personal-data concern" })
    });
    expect(opened.status).toBe(201);
    const caseId = ((await opened.json()) as { data: { id: string } }).data.id;
    const action = await fetch(`${base}/${questionId}/moderation-cases/${caseId}/actions`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "moderator-api" },
      body: JSON.stringify({
        actionType: "restrict_discovery",
        expectedVersion: 1,
        reason: "Restrict discovery while the concern is reviewed"
      })
    });
    expect(action.status).toBe(200);
    expect((await fetch(`${base}/${questionId}`)).status).toBe(404);
    expect(
      (await fetch(`${base}/${questionId}`, { headers: { "x-actor-id": "moderator-api" } })).status
    ).toBe(200);
    const publicSignals = await fetch(`${base}/${questionId}/trust-signals`);
    const signalBody = (await publicSignals.json()) as { data: Record<string, unknown> };
    expect(signalBody.data).not.toHaveProperty("openReportCount");
  });

  it("returns a stable 429 contract without exposing limiter keys", async () => {
    const questions = createMemoryQuestionApplication();
    const safety = createMemoryQuestionSafetyApplication({ questions: questions.unit.questions });
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionSafetyApplication: safety.application,
      questionRateLimiter: new LocalFixedWindowQuestionRateLimiter({ report: 1 })
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind");
    const base = `http://127.0.0.1:${address.port}/api/v1/questions`;
    const created = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "rate-owner" },
      body: JSON.stringify({
        text: "How should local rate limits return stable and private errors?",
        language: "en"
      })
    });
    const questionId = ((await created.json()) as { data: { id: string } }).data.id;
    const request = () =>
      fetch(`${base}/${questionId}/reports`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-actor-id": "rate-reporter" },
        body: JSON.stringify({
          reasonCode: "spam",
          description: "This report contains enough detail for accountable review."
        })
      });
    expect((await request()).status).toBe(201);
    const limited = await request();
    expect(limited.status).toBe(429);
    const body = (await limited.json()) as {
      error: { code: string; details: Record<string, unknown> };
    };
    expect(body.error).toMatchObject({
      code: "rate_limit_exceeded",
      details: { operation: "report", retryAfterSeconds: 60 }
    });
    expect(JSON.stringify(body)).not.toContain("rate-reporter");
  });

  it("removes restricted graph neighbors and gates semantic snapshots", async () => {
    const questions = createMemoryQuestionApplication();
    const relations = createMemoryQuestionRelationApplication(questions.unit.questions);
    const semantics = createMemoryQuestionSemanticApplication(questions.unit.questions);
    const safety = createMemoryQuestionSafetyApplication({
      questions: questions.unit.questions,
      moderatorActors: ["moderator-api"]
    });
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionRelationApplication: relations.application,
      questionSemanticApplication: semantics.application,
      questionSafetyApplication: safety.application
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind");
    const base = `http://127.0.0.1:${address.port}/api/v1/questions`;
    const create = async (actor: string, text: string) => {
      const response = await fetch(base, {
        method: "POST",
        headers: { "content-type": "application/json", "x-actor-id": actor },
        body: JSON.stringify({ text, language: "en" })
      });
      return ((await response.json()) as { data: { id: string } }).data.id;
    };
    const root = await create(
      "graph-owner",
      "How does a public graph handle a restricted neighboring Question?"
    );
    const restricted = await create(
      "restricted-owner",
      "Which private semantic context must not leak through graph traversal?"
    );
    expect(
      (
        await fetch(`${base}/${root}/relations`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-actor-id": "graph-owner" },
          body: JSON.stringify({ targetQuestionId: restricted, type: "connects" })
        })
      ).status
    ).toBe(201);
    const structure = {
      context: ["A privacy test."],
      assumptions: [],
      constraints: [],
      unknowns: [],
      uncertainty: { level: "unspecified", statements: [] },
      scope: { inclusions: [], exclusions: [] },
      perspectives: [],
      openPossibilities: []
    };
    expect(
      (
        await fetch(`${base}/${restricted}/semantic-structure`, {
          method: "PUT",
          headers: { "content-type": "application/json", "x-actor-id": "restricted-owner" },
          body: JSON.stringify({ expectedVersion: 0, ...structure })
        })
      ).status
    ).toBe(201);
    const report = await fetch(`${base}/${restricted}/reports`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "privacy-reporter" },
      body: JSON.stringify({
        reasonCode: "personal_data",
        description: "This semantic context requires a private human review."
      })
    });
    const reportId = ((await report.json()) as { data: { id: string } }).data.id;
    const opened = await fetch(`${base}/${restricted}/moderation-cases`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "moderator-api" },
      body: JSON.stringify({ reportIds: [reportId], reason: "Review graph privacy" })
    });
    const caseId = ((await opened.json()) as { data: { id: string } }).data.id;
    await fetch(`${base}/${restricted}/moderation-cases/${caseId}/actions`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "moderator-api" },
      body: JSON.stringify({
        actionType: "restrict_discovery",
        expectedVersion: 1,
        reason: "Restrict graph and snapshot content"
      })
    });
    const publicGraph = (await (await fetch(`${base}/${root}/graph`)).json()) as {
      data: { nodes: { id: string }[]; relations: unknown[] };
    };
    expect(publicGraph.data.nodes.map((node) => node.id)).toEqual([root]);
    expect(publicGraph.data.relations).toHaveLength(0);
    const internalGraph = (await (
      await fetch(`${base}/${root}/graph`, { headers: { "x-actor-id": "moderator-api" } })
    ).json()) as { data: { nodes: { id: string }[] } };
    expect(internalGraph.data.nodes.map((node) => node.id)).toEqual([root, restricted]);
    expect((await fetch(`${base}/${restricted}/semantic-structure`)).status).toBe(404);
    expect(
      (
        await fetch(`${base}/${restricted}/semantic-structure`, {
          headers: { "x-actor-id": "moderator-api" }
        })
      ).status
    ).toBe(200);
  });
});

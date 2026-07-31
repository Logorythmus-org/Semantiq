import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionRelationApplication
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

describe("Question relation security", () => {
  let server: ApiApplication | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
    vi.restoreAllMocks();
  });

  it("keeps Question text and idempotency keys out of relation events and logs", async () => {
    const questions = createMemoryQuestionApplication();
    const relations = createMemoryQuestionRelationApplication(questions.unit.questions);
    const sourceText = "How can sensitive source wording stay outside graph telemetry?";
    const targetText = "How can sensitive target wording stay outside relation events?";
    const source = await questions.application.create({
      text: sourceText,
      language: "en",
      creatorId: "security-owner-a",
      correlationId: "security-source"
    });
    const target = await questions.application.create({
      text: targetText,
      language: "en",
      creatorId: "security-owner-b",
      correlationId: "security-target"
    });
    if (!source.ok || !target.ok) throw new Error("Question fixture failed");

    const logs: string[] = [];
    vi.spyOn(console, "log").mockImplementation((value?: unknown) => logs.push(String(value)));
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionRelationApplication: relations.application
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    const secretKey = "security-relation-key";
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${source.value.id}/relations`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-actor-id": "security-owner-a",
          "idempotency-key": secretKey
        },
        body: JSON.stringify({ targetQuestionId: target.value.id, type: "depends_on" })
      }
    );
    expect(response.status).toBe(201);
    const malformedTarget = "private malformed target payload";
    const malformedType = "private malformed relation type";
    const malformed = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${source.value.id}/relations`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-actor-id": "security-owner-a"
        },
        body: JSON.stringify({ targetQuestionId: malformedTarget, type: malformedType })
      }
    );
    expect(malformed.status).toBe(422);
    const serializedEvent = JSON.stringify(relations.unit.getOutbox()[0]);
    const serializedLogs = logs.join("\n");
    for (const sensitive of [sourceText, targetText, secretKey, malformedTarget, malformedType]) {
      expect(serializedEvent).not.toContain(sensitive);
      expect(serializedLogs).not.toContain(sensitive);
    }
  });

  it("uses only header actor context and rejects body-based identity spoofing", async () => {
    const questions = createMemoryQuestionApplication();
    const relations = createMemoryQuestionRelationApplication(questions.unit.questions);
    const source = await questions.application.create({
      text: "Can a request body impersonate the source Question creator?",
      language: "en",
      creatorId: "security-owner-a",
      correlationId: "spoof-source"
    });
    const target = await questions.application.create({
      text: "Should relation authorization trust transport body fields?",
      language: "en",
      creatorId: "security-owner-b",
      correlationId: "spoof-target"
    });
    if (!source.ok || !target.ok) throw new Error("Question fixture failed");
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionRelationApplication: relations.application
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${source.value.id}/relations`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-actor-id": "security-owner-b" },
        body: JSON.stringify({
          targetQuestionId: target.value.id,
          type: "challenges",
          actorId: "security-owner-a",
          createdBy: "security-owner-a"
        })
      }
    );
    expect(response.status).toBe(403);
    expect(relations.unit.getOutbox()).toHaveLength(0);
  });

  it("bounds graph resource use and returns sanitized validation errors", async () => {
    const questions = createMemoryQuestionApplication();
    const relations = createMemoryQuestionRelationApplication(questions.unit.questions);
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionRelationApplication: relations.application
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/valid-question/graph?depth=999&maxNodes=999`
    );
    expect(response.status).toBe(422);
    const body = JSON.stringify(await response.json());
    expect(body).toContain("validation_error");
    expect(body).not.toMatch(/stack|SELECT|node_modules|database/i);
  });
});

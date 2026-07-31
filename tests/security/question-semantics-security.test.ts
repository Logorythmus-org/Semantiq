import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionSemanticApplication
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

function sensitiveBody(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    expectedVersion: 0,
    context: ["PRIVATE-CONTEXT-ALPHA"],
    assumptions: ["PRIVATE-ASSUMPTION-BETA"],
    constraints: ["PRIVATE-CONSTRAINT-GAMMA"],
    unknowns: ["PRIVATE-UNKNOWN-DELTA"],
    uncertainty: { level: "medium", statements: ["PRIVATE-UNCERTAINTY-EPSILON"] },
    scope: { inclusions: ["PRIVATE-SCOPE-IN"], exclusions: ["PRIVATE-SCOPE-OUT"] },
    perspectives: ["PRIVATE-PERSPECTIVE-ZETA"],
    openPossibilities: ["PRIVATE-POSSIBILITY-ETA"],
    reason: "PRIVATE-REASON-THETA",
    ...overrides
  };
}

describe("Question semantic security boundary", () => {
  let server: ApiApplication | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
    vi.restoreAllMocks();
  });

  async function start() {
    const questions = createMemoryQuestionApplication();
    const semantics = createMemoryQuestionSemanticApplication(questions.unit.questions);
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      questionSemanticApplication: semantics.application
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    return {
      base: `http://127.0.0.1:${address.port}/api/v1/questions`,
      semantics
    };
  }

  async function createQuestion(base: string) {
    const response = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-sec-owner" },
      body: JSON.stringify({
        text: "How should sensitive semantic context avoid operational logs?",
        language: "en"
      })
    });
    return ((await response.json()) as { data: { id: string } }).data.id;
  }

  it("keeps semantic content, reasons, and idempotency keys out of logs and events", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const { base, semantics } = await start();
    const questionId = await createQuestion(base);
    const response = await fetch(`${base}/${questionId}/semantic-structure`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "semantic-sec-owner",
        "idempotency-key": "PRIVATE-IDEMPOTENCY-IOTA"
      },
      body: JSON.stringify(sensitiveBody())
    });
    expect(response.status).toBe(201);

    const logged = log.mock.calls.flat().join(" ");
    const eventJson = JSON.stringify(semantics.unit.getOutbox());
    for (const secret of [
      "PRIVATE-CONTEXT-ALPHA",
      "PRIVATE-ASSUMPTION-BETA",
      "PRIVATE-CONSTRAINT-GAMMA",
      "PRIVATE-UNKNOWN-DELTA",
      "PRIVATE-UNCERTAINTY-EPSILON",
      "PRIVATE-SCOPE-IN",
      "PRIVATE-PERSPECTIVE-ZETA",
      "PRIVATE-POSSIBILITY-ETA",
      "PRIVATE-REASON-THETA",
      "PRIVATE-IDEMPOTENCY-IOTA"
    ]) {
      expect(logged).not.toContain(secret);
      expect(eventJson).not.toContain(secret);
    }
    expect(logged).toContain("question.semantic_structure");
    expect(eventJson).toContain("question.semantic_structure.created");
  });

  it("ignores body actor spoofing and protects history while retaining public current reads", async () => {
    const { base } = await start();
    const questionId = await createQuestion(base);
    const url = `${base}/${questionId}/semantic-structure`;
    const spoofed = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-actor-id": "attacker" },
      body: JSON.stringify({ ...sensitiveBody(), actorId: "semantic-sec-owner" })
    });
    expect(spoofed.status).toBe(403);

    const created = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-sec-owner" },
      body: JSON.stringify(sensitiveBody())
    });
    expect(created.status).toBe(201);
    expect((await fetch(url)).status).toBe(200);
    expect((await fetch(`${url}/revisions`)).status).toBe(403);
    expect(
      (
        await fetch(`${url}/revisions`, {
          headers: { "x-actor-id": "attacker" }
        })
      ).status
    ).toBe(403);
  });

  it("fails closed for oversized and malformed semantic structures without echoing values", async () => {
    const { base } = await start();
    const questionId = await createQuestion(base);
    const url = `${base}/${questionId}/semantic-structure`;
    const oversized = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-sec-owner" },
      body: JSON.stringify(sensitiveBody({ context: ["x".repeat(70_000)] }))
    });
    expect(oversized.status).toBe(422);
    expect(JSON.stringify(await oversized.json())).not.toContain("x".repeat(100));

    const malformed = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-sec-owner" },
      body: JSON.stringify(sensitiveBody({ assumptions: [{ secret: "DO-NOT-ECHO" }] }))
    });
    expect(malformed.status).toBe(422);
    expect(JSON.stringify(await malformed.json())).not.toContain("DO-NOT-ECHO");
    expect((await fetch(url)).status).toBe(404);
  });
});

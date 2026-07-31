import { afterEach, describe, expect, it } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionSemanticApplication
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

function semanticBody(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    expectedVersion: 0,
    context: ["A multilingual local learning environment."],
    assumptions: ["Learners can explicitly revise their questions."],
    constraints: ["No external AI provider is available."],
    unknowns: ["Which prompts help learners express uncertainty?"],
    uncertainty: {
      level: "medium",
      statements: ["Prompt effectiveness may vary by language."]
    },
    scope: {
      inclusions: ["Human-authored semantic context"],
      exclusions: ["Automatically inferred assumptions"]
    },
    perspectives: ["Learner", "Facilitator"],
    openPossibilities: ["A structured reflection activity"],
    ...overrides
  };
}

describe("Question semantic structure API", () => {
  let server: ApiApplication | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  async function start(includeSemanticRuntime = true) {
    const questions = createMemoryQuestionApplication();
    const semantics = createMemoryQuestionSemanticApplication(questions.unit.questions);
    server = createApiApplication({
      listenPort: 0,
      questionApplication: questions.application,
      ...(includeSemanticRuntime ? { questionSemanticApplication: semantics.application } : {})
    });
    await server.start();
    const address = server.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a port");
    return `http://127.0.0.1:${address.port}/api/v1/questions`;
  }

  async function createQuestion(base: string): Promise<string> {
    const response = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-api-owner" },
      body: JSON.stringify({
        text: "How can explicit context improve a Question without answering it?",
        language: "en"
      })
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { data: { id: string } }).data.id;
  }

  it("creates, replays, reads, updates, and returns revision history", async () => {
    const base = await start();
    const questionId = await createQuestion(base);
    const url = `${base}/${questionId}/semantic-structure`;
    const createRequest = {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "semantic-api-owner",
        "x-correlation-id": "semantic-api-create",
        "idempotency-key": "semantic-api-key-001"
      },
      body: JSON.stringify(semanticBody())
    };

    const created = await fetch(url, createRequest);
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      data: { questionId: string; version: number; uncertainty: { level: string } };
      meta: { correlationId: string };
    };
    expect(createdBody).toMatchObject({
      data: { questionId, version: 1, uncertainty: { level: "medium" } },
      meta: { correlationId: "semantic-api-create" }
    });
    expect((await fetch(url, createRequest)).status).toBe(201);

    const snapshot = await fetch(`${base}/${questionId}/semantic-snapshot`);
    expect(snapshot.status).toBe(200);
    const snapshotBody = (await snapshot.json()) as { data: Record<string, unknown> };
    expect(Object.keys(snapshotBody.data).sort()).toEqual([
      "frame",
      "generatedAt",
      "question",
      "schemaVersion"
    ]);
    expect(snapshotBody).toMatchObject({
      data: {
        schemaVersion: "1.0",
        question: { id: questionId, version: 1 },
        frame: {
          id: `frame:${questionId}`,
          freshness: "fresh",
          context: [
            {
              text: "A multilingual local learning environment."
            }
          ]
        }
      }
    });
    const snapshotFrame = snapshotBody.data.frame as { context: { id: string }[] };
    expect(snapshotFrame.context[0]?.id.startsWith("component:")).toBe(true);

    const publicRead = await fetch(url);
    expect(publicRead.status).toBe(200);
    expect(await publicRead.json()).toMatchObject({
      data: {
        context: ["A multilingual local learning environment."],
        version: 1
      }
    });

    const updated = await fetch(url, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "semantic-api-owner",
        "x-correlation-id": "semantic-api-update"
      },
      body: JSON.stringify({
        ...semanticBody(),
        expectedVersion: undefined,
        expected_version: 1,
        openPossibilities: undefined,
        open_possibilities: ["A structured reflection activity", "A peer context review"],
        reason: "Record an additional possibility"
      })
    });
    expect(updated.status).toBe(200);
    expect(await updated.json()).toMatchObject({
      data: {
        version: 2,
        openPossibilities: ["A structured reflection activity", "A peer context review"]
      }
    });

    const history = await fetch(`${url}/revisions`, {
      headers: { "x-actor-id": "semantic-api-owner" }
    });
    expect(history.status).toBe(200);
    expect(await history.json()).toMatchObject({
      data: {
        questionId,
        currentVersion: 2,
        revisions: [
          {
            version: 2,
            reason: "Record an additional possibility",
            previousStructure: {
              openPossibilities: ["A structured reflection activity"]
            }
          }
        ]
      }
    });
    expect(
      (
        await fetch(`${url}/revisions`, {
          headers: { "x-actor-id": "different-actor" }
        })
      ).status
    ).toBe(403);
  });

  it("rejects spoofing, invalid structures, stale versions, and archived writes", async () => {
    const base = await start();
    const questionId = await createQuestion(base);
    const url = `${base}/${questionId}/semantic-structure`;

    const spoofed = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...semanticBody(), actorId: "semantic-api-owner" })
    });
    expect(spoofed.status).toBe(403);

    for (const body of [
      semanticBody({ context: "not-an-array" }),
      semanticBody({ uncertainty: { level: "high", statements: [] } }),
      semanticBody({
        scope: { inclusions: ["Same boundary"], exclusions: ["Same boundary"] }
      }),
      semanticBody({ perspectives: Array.from({ length: 33 }, (_, index) => `View ${index}`) })
    ]) {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "content-type": "application/json", "x-actor-id": "semantic-api-owner" },
        body: JSON.stringify(body)
      });
      expect(response.status).toBe(422);
    }

    expect(
      (
        await fetch(url, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            "x-actor-id": "semantic-api-owner"
          },
          body: JSON.stringify(semanticBody())
        })
      ).status
    ).toBe(201);

    const stale = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-api-owner" },
      body: JSON.stringify(semanticBody({ expectedVersion: 2, context: ["Changed context"] }))
    });
    expect(stale.status).toBe(409);

    const archived = await fetch(`${base}/${questionId}/archive`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-api-owner" },
      body: JSON.stringify({ expectedVersion: 1 })
    });
    expect(archived.status).toBe(200);
    const archivedWrite = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/json", "x-actor-id": "semantic-api-owner" },
      body: JSON.stringify(semanticBody({ expectedVersion: 1, context: ["Changed context"] }))
    });
    expect(archivedWrite.status).toBe(409);
    expect((await fetch(url)).status).toBe(200);
  });

  it("returns an explicit service error when the semantic runtime is not wired", async () => {
    const base = await start(false);
    const questionId = await createQuestion(base);
    const response = await fetch(`${base}/${questionId}/semantic-structure`);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: { code: "QUESTION_SEMANTIC_RUNTIME_NOT_CONFIGURED" }
    });
  });
});

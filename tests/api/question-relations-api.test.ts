import { afterEach, describe, expect, it } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionRelationApplication
} from "../../packages/questions/src/index.js";
import { createApiApplication, type ApiApplication } from "../../services/api/src/index.js";

describe("Question relation API", () => {
  let server: ApiApplication | undefined;

  afterEach(async () => {
    await server?.stop();
    server = undefined;
  });

  async function start() {
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
    return `http://127.0.0.1:${address.port}/api/v1/questions`;
  }

  async function createQuestion(base: string, creator: string, text: string): Promise<string> {
    const response = await fetch(base, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": creator },
      body: JSON.stringify({ text, language: "en" })
    });
    expect(response.status).toBe(201);
    return ((await response.json()) as { data: { id: string } }).data.id;
  }

  it("creates, replays, lists, filters, and traverses relations in stable envelopes", async () => {
    const base = await start();
    const first = await createQuestion(
      base,
      "api-owner-a",
      "How can a broad Question become a navigable inquiry?"
    );
    const second = await createQuestion(
      base,
      "api-owner-b",
      "Which narrower Question makes the inquiry testable?"
    );
    const third = await createQuestion(
      base,
      "api-owner-c",
      "Which dependency should be explored after refinement?"
    );

    const createRequest = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "api-owner-a",
        "x-correlation-id": "api-relation-create",
        "idempotency-key": "api-relation-key-1"
      },
      body: JSON.stringify({ targetQuestionId: second, type: "refines" })
    };
    const created = await fetch(`${base}/${first}/relations`, createRequest);
    expect(created.status).toBe(201);
    const createdBody = (await created.json()) as {
      data: { id: string; type: string; directionality: string };
      meta: { correlationId: string };
    };
    expect(createdBody).toMatchObject({
      data: { type: "refines", directionality: "directed" },
      meta: { correlationId: "api-relation-create" }
    });
    const replay = await fetch(`${base}/${first}/relations`, createRequest);
    expect(replay.status).toBe(201);
    expect(((await replay.json()) as { data: { id: string } }).data.id).toBe(createdBody.data.id);

    const secondRelation = await fetch(`${base}/${second}/relations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "api-owner-b"
      },
      body: JSON.stringify({ target_question_id: third, type: "depends_on" })
    });
    expect(secondRelation.status).toBe(201);

    const incoming = await fetch(
      `${base}/${second}/relations?direction=incoming&type=refines&page=1&limit=1`
    );
    expect(incoming.status).toBe(200);
    expect((await incoming.json()) as unknown).toMatchObject({
      data: {
        direction: "incoming",
        relationTypes: ["refines"],
        items: [{ id: createdBody.data.id, type: "refines" }],
        hasNext: false
      }
    });

    const graph = await fetch(`${base}/${first}/graph?depth=2&direction=outgoing&max_nodes=10`);
    expect(graph.status).toBe(200);
    const graphBody = (await graph.json()) as {
      data: { nodes: { id: string }[]; relations: { type: string }[]; truncated: boolean };
    };
    expect(graphBody.data.nodes.map((node) => node.id)).toEqual([first, second, third]);
    expect(graphBody.data.relations.map((relation) => relation.type)).toEqual([
      "refines",
      "depends_on"
    ]);
    expect(graphBody.data.truncated).toBe(false);

    const removed = await fetch(`${base}/${first}/relations/${createdBody.data.id}`, {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        "x-actor-id": "api-owner-a",
        "idempotency-key": "api-remove-key-1"
      },
      body: JSON.stringify({ expectedVersion: 1 })
    });
    expect(removed.status).toBe(200);
    expect(await removed.json()).toMatchObject({ data: { status: "removed", version: 2 } });
    expect(await (await fetch(`${base}/${first}/relations`)).json()).toMatchObject({
      data: { items: [] }
    });
  });

  it("rejects spoofing, invalid topology, duplicates, archived endpoints, and unsafe bounds", async () => {
    const base = await start();
    const first = await createQuestion(
      base,
      "api-owner-a",
      "Who is allowed to relate this source Question?"
    );
    const second = await createQuestion(
      base,
      "api-owner-b",
      "What target should this source Question challenge?"
    );

    for (const [headers, body, status] of [
      [
        { "content-type": "application/json" },
        { targetQuestionId: second, type: "challenges" },
        403
      ],
      [
        { "content-type": "application/json", "x-actor-id": "api-owner-b" },
        { targetQuestionId: second, type: "challenges", actorId: "api-owner-a" },
        403
      ],
      [
        { "content-type": "application/json", "x-actor-id": "api-owner-a" },
        { targetQuestionId: first, type: "connects" },
        422
      ],
      [
        { "content-type": "application/json", "x-actor-id": "api-owner-a" },
        { targetQuestionId: second, type: "invented" },
        422
      ]
    ] as const) {
      const response = await fetch(`${base}/${first}/relations`, {
        method: "POST",
        headers,
        body: JSON.stringify(body)
      });
      expect(response.status).toBe(status);
    }

    const valid = await fetch(`${base}/${first}/relations`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "api-owner-a" },
      body: JSON.stringify({ targetQuestionId: second, type: "alternative_to" })
    });
    expect(valid.status).toBe(201);
    const reverseDuplicate = await fetch(`${base}/${second}/relations`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "api-owner-b" },
      body: JSON.stringify({ targetQuestionId: first, type: "alternative_to" })
    });
    expect(reverseDuplicate.status).toBe(409);

    const archived = await fetch(`${base}/${second}/archive`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "api-owner-b" },
      body: JSON.stringify({ expectedVersion: 1 })
    });
    expect(archived.status).toBe(200);
    const archivedRelation = await fetch(`${base}/${first}/relations`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-actor-id": "api-owner-a" },
      body: JSON.stringify({ targetQuestionId: second, type: "depends_on" })
    });
    expect(archivedRelation.status).toBe(409);

    expect((await fetch(`${base}/${first}/graph?depth=4`)).status).toBe(422);
    expect((await fetch(`${base}/${first}/graph?maxNodes=101`)).status).toBe(422);
    expect((await fetch(`${base}/${first}/relations?direction=sideways`)).status).toBe(422);
    expect((await fetch(`${base}/${first}/relations?limit=101`)).status).toBe(422);
  });
});

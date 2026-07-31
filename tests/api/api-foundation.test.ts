import { describe, expect, it } from "vitest";
import { createApiApplication } from "../../services/api/src/index.js";
import { createMemoryQuestionApplication } from "../../packages/questions/src/index.js";

describe("API foundation", () => {
  it("starts, serves health and shuts down cleanly", async () => {
    const application = createApiApplication({ listenPort: 0 });
    await application.start();
    const address = application.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a TCP port");
    const response = await fetch(`http://127.0.0.1:${address.port}/health`, {
      headers: { "x-correlation-id": "test-correlation" }
    });
    const body = (await response.json()) as {
      data: { status: string; components: { api: { status: string } } };
      meta: { correlationId: string };
    };
    expect(response.status).toBe(200);
    expect(body.data.status).toBe("healthy");
    expect(body.data.components.api.status).toBe("healthy");
    expect(body.meta.correlationId).toBe("test-correlation");
    await application.stop();
  });

  it("sanitizes unknown routes and rejects invalid correlation IDs", async () => {
    const application = createApiApplication({ listenPort: 0 });
    await application.start();
    const address = application.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a TCP port");
    const notFound = await fetch(`http://127.0.0.1:${address.port}/private`);
    expect(notFound.status).toBe(404);
    const invalid = await fetch(`http://127.0.0.1:${address.port}/health`, {
      headers: { "x-correlation-id": "bad value" }
    });
    expect(invalid.status).toBe(400);
    await application.stop();
  });

  it("creates and retrieves a question through the stable API envelope", async () => {
    const question = createMemoryQuestionApplication();
    const application = createApiApplication({
      listenPort: 0,
      questionApplication: question.application
    });
    await application.start();
    const address = application.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a TCP port");
    const created = await fetch(`http://127.0.0.1:${address.port}/api/v1/questions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "question-corr",
        "idempotency-key": "question-key-1"
      },
      body: JSON.stringify({ text: "How can uncertainty improve learning?", language: "en" })
    });
    const createdBody = (await created.json()) as {
      data: { id: string; status: string };
      meta: { correlationId: string };
    };
    expect(created.status).toBe(201);
    expect(createdBody.data.status).toBe("published");
    expect(createdBody.meta.correlationId).toBe("question-corr");
    const retrieved = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/questions/${createdBody.data.id}`
    );
    expect(retrieved.status).toBe(200);
    expect(((await retrieved.json()) as { data: { id: string } }).data.id).toBe(
      createdBody.data.id
    );
    const replay = await fetch(`http://127.0.0.1:${address.port}/api/v1/questions`, {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "question-key-1" },
      body: JSON.stringify({ text: "How can uncertainty improve learning?", language: "en" })
    });
    expect(replay.status).toBe(201);
    expect(((await replay.json()) as { data: { id: string } }).data.id).toBe(createdBody.data.id);
    const malformed = await fetch(`http://127.0.0.1:${address.port}/api/v1/questions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{"
    });
    expect(malformed.status).toBe(422);
    await application.stop();
  });

  it("runs the controlled Question mutation lifecycle and revision API", async () => {
    const question = createMemoryQuestionApplication();
    const application = createApiApplication({
      listenPort: 0,
      questionApplication: question.application
    });
    await application.start();
    const address = application.server.address();
    if (!address || typeof address === "string") throw new Error("API did not bind a TCP port");
    const base = `http://127.0.0.1:${address.port}/api/v1/questions`;
    const actorHeaders = {
      "content-type": "application/json",
      "x-actor-id": "api-owner-1"
    };
    const created = await fetch(base, {
      method: "POST",
      headers: actorHeaders,
      body: JSON.stringify({
        text: "How should a Question preserve its mutation history?",
        language: "en"
      })
    });
    const createdBody = (await created.json()) as { data: { id: string } };
    const id = createdBody.data.id;

    for (const [candidateId, text, expectedStatus] of [
      [id, "", 422],
      [id, "x".repeat(2001), 422],
      [id, "How should a Question preserve its mutation history?", 409],
      ["bad id", "How should malformed IDs be rejected by the API?", 422],
      ["missing-question", "How should missing Questions map to a stable error?", 404]
    ] as const) {
      const invalid = await fetch(`${base}/${candidateId}`, {
        method: "PATCH",
        headers: actorHeaders,
        body: JSON.stringify({ text, expectedVersion: 1 })
      });
      expect(invalid.status).toBe(expectedStatus);
    }

    const updateRequest = {
      method: "PATCH",
      headers: { ...actorHeaders, "idempotency-key": "api-update-key-1" },
      body: JSON.stringify({
        text: "چگونه یک پرسش باید تاریخچه تغییرات خود را حفظ کند؟",
        expected_version: 1,
        reason: "ترجمه و شفاف‌سازی"
      })
    };
    const updated = await fetch(`${base}/${id}`, updateRequest);
    expect(updated.status).toBe(200);
    expect(((await updated.json()) as { data: { version: number } }).data.version).toBe(2);
    const replay = await fetch(`${base}/${id}`, updateRequest);
    expect(replay.status).toBe(200);
    expect(((await replay.json()) as { data: { version: number } }).data.version).toBe(2);
    const conflictingReplay = await fetch(`${base}/${id}`, {
      method: "PATCH",
      headers: { ...actorHeaders, "idempotency-key": "api-update-key-1" },
      body: JSON.stringify({
        text: "Warum müssen widersprüchliche Wiederholungen abgelehnt werden?",
        expectedVersion: 1
      })
    });
    expect(conflictingReplay.status).toBe(409);

    const stale = await fetch(`${base}/${id}`, {
      method: "PATCH",
      headers: actorHeaders,
      body: JSON.stringify({
        text: "Why must stale updates fail without overwriting state?",
        expectedVersion: 1
      })
    });
    expect(stale.status).toBe(409);
    const forbidden = await fetch(`${base}/${id}/archive`, {
      method: "POST",
      headers: { ...actorHeaders, "x-actor-id": "other-actor" },
      body: JSON.stringify({ expectedVersion: 2, actorId: "api-owner-1" })
    });
    expect(forbidden.status).toBe(403);

    const archived = await fetch(`${base}/${id}/archive`, {
      method: "POST",
      headers: { ...actorHeaders, "idempotency-key": "api-archive-key-1" },
      body: JSON.stringify({ expectedVersion: 2, reason: "Temporarily inactive" })
    });
    expect(archived.status).toBe(200);
    expect(
      ((await archived.json()) as { data: { status: string; version: number } }).data
    ).toMatchObject({ status: "archived", version: 3 });
    const archiveReplay = await fetch(`${base}/${id}/archive`, {
      method: "POST",
      headers: { ...actorHeaders, "idempotency-key": "api-archive-key-1" },
      body: JSON.stringify({ expectedVersion: 2, reason: "Temporarily inactive" })
    });
    expect(archiveReplay.status).toBe(200);
    expect(((await archiveReplay.json()) as { data: { version: number } }).data.version).toBe(3);
    const alreadyArchived = await fetch(`${base}/${id}/archive`, {
      method: "POST",
      headers: actorHeaders,
      body: JSON.stringify({ expectedVersion: 3 })
    });
    expect(alreadyArchived.status).toBe(409);
    const archivedUpdate = await fetch(`${base}/${id}`, {
      method: "PATCH",
      headers: actorHeaders,
      body: JSON.stringify({
        text: "Archived Questions cannot be edited before restoration.",
        expectedVersion: 3
      })
    });
    expect(archivedUpdate.status).toBe(409);

    const hiddenHistory = await fetch(`${base}/${id}/revisions`);
    expect(hiddenHistory.status).toBe(403);
    const history = await fetch(`${base}/${id}/revisions`, {
      headers: { "x-actor-id": "api-owner-1", "x-correlation-id": "history-corr" }
    });
    expect(history.status).toBe(200);
    const historyBody = (await history.json()) as {
      data: { currentVersion: number; revisions: { version: number; changeType: string }[] };
      meta: { correlationId: string };
    };
    expect(historyBody.data).toMatchObject({
      currentVersion: 3,
      revisions: [
        { version: 2, changeType: "updated" },
        { version: 3, changeType: "archived" }
      ]
    });
    expect(historyBody.meta.correlationId).toBe("history-corr");

    const restored = await fetch(`${base}/${id}/restore`, {
      method: "POST",
      headers: { ...actorHeaders, "idempotency-key": "api-restore-key-1" },
      body: JSON.stringify({ expectedVersion: 3 })
    });
    expect(restored.status).toBe(200);
    expect(
      ((await restored.json()) as { data: { status: string; version: number } }).data
    ).toMatchObject({ status: "published", version: 4 });
    const restoreReplay = await fetch(`${base}/${id}/restore`, {
      method: "POST",
      headers: { ...actorHeaders, "idempotency-key": "api-restore-key-1" },
      body: JSON.stringify({ expectedVersion: 3 })
    });
    expect(restoreReplay.status).toBe(200);
    const alreadyActive = await fetch(`${base}/${id}/restore`, {
      method: "POST",
      headers: actorHeaders,
      body: JSON.stringify({ expectedVersion: 4 })
    });
    expect(alreadyActive.status).toBe(409);
    await application.stop();
  });
});

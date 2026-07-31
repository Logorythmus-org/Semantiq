import { describe, expect, it } from "vitest";
import { createMemoryQuestionApplication } from "../../packages/questions/src/index.js";

describe("Question mutation security", () => {
  it("rejects actor spoofing, oversized reasons, and stale writes", async () => {
    const { application } = createMemoryQuestionApplication();
    const created = await application.create({
      text: "How should mutation authorization protect Question history?",
      language: "en",
      creatorId: "security-owner",
      correlationId: "security-create"
    });
    if (!created.ok) throw new Error("creation failed");
    expect(
      await application.update({
        questionId: created.value.id,
        text: "How should a spoofed actor be denied Question mutation?",
        expectedVersion: 1,
        actorId: "spoofed-owner",
        correlationId: "security-spoof"
      })
    ).toMatchObject({ ok: false, error: { code: "question_mutation_forbidden" } });
    expect(
      await application.archive({
        questionId: created.value.id,
        expectedVersion: 1,
        actorId: "security-owner",
        reason: "x".repeat(501),
        correlationId: "security-reason"
      })
    ).toMatchObject({ ok: false, error: { category: "validation" } });
    expect(
      await application.archive({
        questionId: created.value.id,
        expectedVersion: 99,
        actorId: "security-owner",
        correlationId: "security-stale"
      })
    ).toMatchObject({ ok: false, error: { code: "question_version_conflict" } });
    expect(
      await application.update({
        questionId: created.value.id,
        text: "How should invalid causation metadata be rejected safely?",
        expectedVersion: 1,
        actorId: "security-owner",
        causationId: "invalid causation",
        correlationId: "security-causation"
      })
    ).toMatchObject({ ok: false, error: { category: "validation" } });
  });

  it("keeps SQL-like and script-like multilingual text as inert data", async () => {
    const { application } = createMemoryQuestionApplication();
    const created = await application.create({
      text: "How should systems safely preserve user-authored Question text?",
      language: "en",
      creatorId: "security-owner",
      correlationId: "security-create"
    });
    if (!created.ok) throw new Error("creation failed");
    const text = "آیا <script>alert('x')</script> و '; DROP TABLE questions;-- فقط داده هستند؟";
    const updated = await application.update({
      questionId: created.value.id,
      text,
      expectedVersion: 1,
      actorId: "security-owner",
      correlationId: "security-data"
    });
    expect(updated).toMatchObject({ ok: true, value: { text } });
  });

  it("keeps full Question text out of mutation event payloads and unrelated errors", async () => {
    const { application, unit } = createMemoryQuestionApplication();
    const secretText = "How can private historical wording remain outside mutation events?";
    const created = await application.create({
      text: secretText,
      language: "en",
      creatorId: "security-owner",
      correlationId: "security-create"
    });
    if (!created.ok) throw new Error("creation failed");
    const updated = await application.update({
      questionId: created.value.id,
      text: "How can revised wording remain outside compact mutation events?",
      expectedVersion: 1,
      actorId: "security-owner",
      correlationId: "security-update"
    });
    expect(updated.ok).toBe(true);
    const event = unit.getOutbox().find((item) => item.type === "question.updated");
    expect(JSON.stringify(event?.payload)).not.toContain(secretText);
    const conflict = await application.update({
      questionId: created.value.id,
      text: "How should stale errors avoid exposing current Question text?",
      expectedVersion: 1,
      actorId: "security-owner",
      correlationId: "security-conflict"
    });
    expect(JSON.stringify(conflict)).not.toContain(secretText);
  });
});

import { describe, expect, it } from "vitest";
import {
  createMemoryQuestionApplication,
  createMemoryQuestionSemanticApplication,
  createQuestionSemanticApplication,
  MemoryQuestionSemanticUnitOfWork,
  QuestionSemanticContent,
  type QuestionSemanticStructureInput
} from "../../packages/questions/src/index.js";
import { FixedClock } from "../../packages/shared/src/index.js";

function semantic(
  overrides: Partial<QuestionSemanticStructureInput> = {}
): QuestionSemanticStructureInput {
  return {
    context: ["A local classroom with intermittent connectivity."],
    assumptions: ["Learners can revisit prior explanations."],
    constraints: ["The design must work without a cloud dependency."],
    unknowns: ["Which feedback cadence best supports reflection?"],
    uncertainty: {
      level: "medium",
      statements: ["The effect may differ across age groups."]
    },
    scope: {
      inclusions: ["Secondary education classrooms"],
      exclusions: ["Fully autonomous grading"]
    },
    perspectives: ["Learner", "Teacher"],
    openPossibilities: ["A peer-led reflection workflow"],
    ...overrides
  };
}

async function fixture() {
  const questions = createMemoryQuestionApplication();
  const semantics = createMemoryQuestionSemanticApplication(questions.unit.questions);
  const created = await questions.application.create({
    text: "How can explicit uncertainty improve reflective learning?",
    language: "en",
    creatorId: "semantic-owner",
    correlationId: "semantic-question-create"
  });
  if (!created.ok) throw new Error("Question creation failed");
  return { questions, semantics, questionId: created.value.id };
}

describe("Question semantic structure", () => {
  it("normalizes explicit content and emits a compact creation event", async () => {
    const { questions, semantics, questionId } = await fixture();
    const result = await semantics.application.put({
      questionId,
      expectedVersion: 0,
      structure: semantic({
        context: ["  A   local classroom\r\n with intermittent connectivity.  "]
      }),
      actorId: "semantic-owner",
      correlationId: "semantic-create"
    });

    expect(result).toMatchObject({
      ok: true,
      value: {
        questionId,
        context: ["A local classroom\nwith intermittent connectivity."],
        version: 1,
        createdBy: "semantic-owner",
        updatedBy: "semantic-owner"
      }
    });
    const events = semantics.unit.getOutbox();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "question.semantic_structure.created",
      aggregateId: questionId,
      schemaVersion: 1,
      payload: { questionId, semanticVersion: 1, changedBy: "semantic-owner" }
    });
    expect(JSON.stringify(events[0])).not.toContain("local classroom");
    expect(await questions.application.get({ questionId, correlationId: "read" })).toMatchObject({
      ok: true,
      value: { version: 1 }
    });
  });

  it("builds a deterministic allowlisted snapshot with stable component IDs and freshness", async () => {
    const { questions, semantics, questionId } = await fixture();
    await semantics.application.put({
      questionId,
      expectedVersion: 0,
      structure: semantic({ context: ["Mehrsprachiger Kontext", "زمینه چندزبانه"] }),
      actorId: "semantic-owner",
      correlationId: "snapshot-frame"
    });
    const first = await semantics.application.snapshot({ questionId, correlationId: "snapshot-1" });
    const second = await semantics.application.snapshot({
      questionId,
      correlationId: "snapshot-2"
    });
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      ok: true,
      value: {
        schemaVersion: "1.0",
        question: { id: questionId, status: "published", version: 1 },
        frame: {
          id: `frame:${questionId}`,
          version: 1,
          freshness: "fresh",
          context: [{ text: "Mehrsprachiger Kontext" }, { text: "زمینه چندزبانه" }]
        }
      }
    });
    if (first.ok) {
      expect(first.value.frame.context[0]?.id.startsWith("component:")).toBe(true);
      expect(first.value.frame.context[1]?.id.startsWith("component:")).toBe(true);
    }
    expect(JSON.stringify(first)).not.toContain("semantic-owner");
    await questions.application.update({
      questionId,
      expectedVersion: 1,
      text: "How can revised wording make the existing Frame stale?",
      actorId: "semantic-owner",
      correlationId: "snapshot-question-update"
    });
    expect(
      await semantics.application.snapshot({ questionId, correlationId: "snapshot-stale" })
    ).toMatchObject({
      ok: true,
      value: { question: { version: 2 }, frame: { freshness: "stale" } }
    });
  });

  it("stores immutable update snapshots without changing the Question version", async () => {
    const { questions, semantics, questionId } = await fixture();
    const first = await semantics.application.put({
      questionId,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-owner",
      correlationId: "semantic-create"
    });
    expect(first.ok).toBe(true);

    const updatedStructure = semantic({
      unknowns: ["Which feedback cadence and format best support reflection?"],
      openPossibilities: ["A peer-led reflection workflow", "A teacher-guided journal"]
    });
    const updated = await semantics.application.put({
      questionId,
      expectedVersion: 1,
      structure: updatedStructure,
      actorId: "semantic-owner",
      reason: "Clarify the remaining design space",
      correlationId: "semantic-update"
    });
    expect(updated).toMatchObject({ ok: true, value: { version: 2 } });

    const history = await semantics.application.revisions({
      questionId,
      actorId: "semantic-owner",
      correlationId: "semantic-history"
    });
    expect(history).toMatchObject({
      ok: true,
      value: {
        questionId,
        currentVersion: 2,
        revisions: [
          {
            version: 2,
            previousStructure: {
              unknowns: ["Which feedback cadence best supports reflection?"]
            },
            structure: {
              unknowns: ["Which feedback cadence and format best support reflection?"]
            },
            changedBy: "semantic-owner",
            reason: "Clarify the remaining design space"
          }
        ]
      }
    });
    expect(semantics.unit.getOutbox().map((event) => event.type)).toEqual([
      "question.semantic_structure.created",
      "question.semantic_structure.updated"
    ]);
    expect(await questions.application.get({ questionId, correlationId: "read" })).toMatchObject({
      ok: true,
      value: { version: 1 }
    });
  });

  it("replays identical mutations and rejects idempotency-key reuse", async () => {
    const { semantics, questionId } = await fixture();
    const command = {
      questionId,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-owner",
      idempotencyKey: "semantic-key-001",
      correlationId: "semantic-create"
    } as const;
    const first = await semantics.application.put(command);
    const replay = await semantics.application.put({
      ...command,
      correlationId: "semantic-replay"
    });
    expect(replay).toEqual(first);
    expect(semantics.unit.getOutbox()).toHaveLength(1);

    const conflict = await semantics.application.put({
      ...command,
      structure: semantic({ context: ["A different context."] }),
      correlationId: "semantic-conflict"
    });
    expect(conflict).toMatchObject({ ok: false, error: { code: "idempotency_conflict" } });
  });

  it("rejects stale and normalized no-op updates", async () => {
    const { semantics, questionId } = await fixture();
    await semantics.application.put({
      questionId,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-owner",
      correlationId: "semantic-create"
    });

    const noChange = await semantics.application.put({
      questionId,
      expectedVersion: 1,
      structure: semantic({ context: [" A   local classroom with intermittent connectivity. "] }),
      actorId: "semantic-owner",
      correlationId: "semantic-no-change"
    });
    expect(noChange).toMatchObject({
      ok: false,
      error: { code: "question_semantic_structure_no_change" }
    });

    const stale = await semantics.application.put({
      questionId,
      expectedVersion: 2,
      structure: semantic({ context: ["A changed context."] }),
      actorId: "semantic-owner",
      correlationId: "semantic-stale"
    });
    expect(stale).toMatchObject({
      ok: false,
      error: { code: "question_semantic_version_conflict", details: { currentVersion: 1 } }
    });
  });

  it("enforces creator ownership and preserves reads while archived", async () => {
    const { questions, semantics, questionId } = await fixture();
    expect(
      await semantics.application.put({
        questionId,
        expectedVersion: 0,
        structure: semantic(),
        actorId: "different-actor",
        correlationId: "semantic-forbidden"
      })
    ).toMatchObject({
      ok: false,
      error: { code: "question_semantic_structure_forbidden" }
    });

    const creatorless = await questions.application.create({
      text: "How should imported creatorless Questions fail closed for semantic writes?",
      language: "en",
      source: "import",
      correlationId: "creatorless-question"
    });
    if (!creatorless.ok) throw new Error("Creatorless Question creation failed");
    expect(
      await semantics.application.put({
        questionId: creatorless.value.id,
        expectedVersion: 0,
        structure: semantic(),
        actorId: "semantic-owner",
        correlationId: "creatorless-semantic-write"
      })
    ).toMatchObject({
      ok: false,
      error: { code: "question_semantic_structure_forbidden" }
    });

    await semantics.application.put({
      questionId,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-owner",
      correlationId: "semantic-create"
    });
    await questions.application.archive({
      questionId,
      expectedVersion: 1,
      actorId: "semantic-owner",
      correlationId: "archive"
    });

    expect(
      await semantics.application.put({
        questionId,
        expectedVersion: 1,
        structure: semantic({ unknowns: ["A changed unknown."] }),
        actorId: "semantic-owner",
        correlationId: "semantic-archived"
      })
    ).toMatchObject({ ok: false, error: { code: "question_archived" } });
    expect(
      await semantics.application.get({ questionId, correlationId: "semantic-read-archived" })
    ).toMatchObject({ ok: true, value: { version: 1 } });
  });

  it("keeps revision history private to the creator", async () => {
    const { semantics, questionId } = await fixture();
    await semantics.application.put({
      questionId,
      expectedVersion: 0,
      structure: semantic(),
      actorId: "semantic-owner",
      correlationId: "semantic-create"
    });
    expect(
      await semantics.application.revisions({
        questionId,
        actorId: "different-actor",
        correlationId: "semantic-history-forbidden"
      })
    ).toMatchObject({ ok: false, error: { code: "question_mutation_forbidden" } });
  });

  it("validates bounded lists, uncertainty explanations, and disjoint scope", () => {
    expect(() =>
      QuestionSemanticContent.create(
        semantic({ assumptions: ["Repeated premise", "Repeated premise"] })
      )
    ).toThrow(/duplicate/);
    expect(() =>
      QuestionSemanticContent.create(semantic({ uncertainty: { level: "high", statements: [] } }))
    ).toThrow(/requires an explanation/);
    expect(() =>
      QuestionSemanticContent.create(
        semantic({ scope: { inclusions: ["Same boundary"], exclusions: ["Same boundary"] } })
      )
    ).toThrow(/must not overlap/);
    expect(() =>
      QuestionSemanticContent.create(
        semantic({ constraints: Array.from({ length: 33 }, (_, index) => `Constraint ${index}`) })
      )
    ).toThrow(/more than 32/);
    expect(() =>
      QuestionSemanticContent.create({
        ...semantic(),
        context: Array.from({ length: 16 }, (_, index) => `Context ${index}`),
        assumptions: Array.from({ length: 16 }, (_, index) => `Assumption ${index}`),
        constraints: Array.from({ length: 16 }, (_, index) => `Constraint ${index}`),
        unknowns: Array.from({ length: 16 }, (_, index) => `Unknown ${index}`),
        uncertainty: {
          level: "medium",
          statements: Array.from({ length: 16 }, (_, index) => `Uncertainty ${index}`)
        },
        scope: {
          inclusions: Array.from({ length: 16 }, (_, index) => `Included ${index}`),
          exclusions: Array.from({ length: 16 }, (_, index) => `Excluded ${index}`)
        },
        perspectives: Array.from({ length: 16 }, (_, index) => `Perspective ${index}`),
        openPossibilities: Array.from({ length: 16 }, (_, index) => `Possibility ${index}`)
      })
    ).toThrow(/128 statements/);
  });

  it("accepts an explicit empty structure without inventing semantics", () => {
    expect(
      QuestionSemanticContent.create({
        context: [],
        assumptions: [],
        constraints: [],
        unknowns: [],
        uncertainty: { level: "unspecified", statements: [] },
        scope: { inclusions: [], exclusions: [] },
        perspectives: [],
        openPossibilities: []
      }).view()
    ).toEqual({
      context: [],
      assumptions: [],
      constraints: [],
      unknowns: [],
      uncertainty: { level: "unspecified", statements: [] },
      scope: { inclusions: [], exclusions: [] },
      perspectives: [],
      openPossibilities: []
    });
  });

  it("rolls back structure, event, and idempotency when outbox persistence fails", async () => {
    const questions = createMemoryQuestionApplication();
    const created = await questions.application.create({
      text: "How should semantic writes remain atomic when their event fails?",
      language: "en",
      creatorId: "semantic-owner",
      correlationId: "question-create"
    });
    if (!created.ok) throw new Error("Question creation failed");
    class FailingUnit extends MemoryQuestionSemanticUnitOfWork {
      override async appendOutbox(): Promise<void> {
        throw new Error("injected outbox failure");
      }
    }
    const unit = new FailingUnit(questions.unit.questions);
    const application = createQuestionSemanticApplication({
      clock: new FixedClock(new Date("2026-01-01T00:00:00Z")),
      createUnitOfWork: () => unit
    });
    expect(
      await application.put({
        questionId: created.value.id,
        expectedVersion: 0,
        structure: semantic(),
        actorId: "semantic-owner",
        idempotencyKey: "semantic-rollback-key",
        correlationId: "semantic-rollback"
      })
    ).toMatchObject({ ok: false, error: { code: "persistence_error" } });
    expect(
      await application.get({
        questionId: created.value.id,
        correlationId: "semantic-read"
      })
    ).toMatchObject({
      ok: false,
      error: { code: "question_semantic_structure_not_found" }
    });
    expect(unit.getOutbox()).toHaveLength(0);
  });
});

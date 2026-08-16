import { describe, expect, it } from "vitest";
import {
  canonicalQuestionRelationIdentity,
  createQuestionApplication,
  createQuestionRelationApplication,
  MemoryQuestionRelationUnitOfWork,
  MemoryQuestionUnitOfWork,
  QuestionRelation,
  questionRelationNeighbor
} from "../../packages/questions/src/index.js";
import { FixedClock, type IdGenerator } from "../../packages/shared/src/index.js";

const clock = new FixedClock(new Date("2026-03-01T00:00:00.000Z"));

class SequenceIds implements IdGenerator {
  private index = 0;
  constructor(private readonly values: readonly string[]) {}
  generate(): string {
    const value = this.values[this.index];
    if (!value) throw new Error("Sequence ID exhausted");
    this.index += 1;
    return value;
  }
}

function fixture(options: { relationUnit?: MemoryQuestionRelationUnitOfWork } = {}) {
  const questionUnit = new MemoryQuestionUnitOfWork();
  const questions = createQuestionApplication({
    ids: new SequenceIds(["question-a", "question-b", "question-c", "question-d"]),
    clock,
    createUnitOfWork: () => questionUnit
  });
  const relationUnit =
    options.relationUnit ?? new MemoryQuestionRelationUnitOfWork(questionUnit.questions);
  const relations = createQuestionRelationApplication({
    ids: new SequenceIds([
      "relation-1",
      "relation-2",
      "relation-3",
      "relation-4",
      "relation-5",
      "relation-6"
    ]),
    clock,
    createUnitOfWork: () => relationUnit
  });
  return { questionUnit, questions, relationUnit, relations };
}

async function createQuestion(
  questions: ReturnType<typeof createQuestionApplication>,
  text: string,
  creatorId: string
) {
  const result = await questions.create({
    text,
    language: "en",
    creatorId,
    correlationId: `create-${creatorId}-${text.length}`
  });
  if (!result.ok) throw new Error(`Question fixture failed: ${result.error.code}`);
  return result.value;
}

describe("Question relations", () => {
  it("creates an immutable directed relation and compact event without changing Questions", async () => {
    const { questions, relations, relationUnit } = fixture();
    const source = await createQuestion(
      questions,
      "How can a broad inquiry become more precise?",
      "owner-a"
    );
    const target = await createQuestion(
      questions,
      "Which evidence makes the inquiry testable?",
      "owner-b"
    );
    const created = await relations.create({
      sourceQuestionId: source.id,
      targetQuestionId: target.id,
      type: "refines",
      actorId: "owner-a",
      idempotencyKey: "relation-key-1",
      correlationId: "relation-create"
    });
    expect(created).toMatchObject({
      ok: true,
      value: {
        sourceQuestionId: source.id,
        targetQuestionId: target.id,
        type: "refines",
        directionality: "directed",
        version: 1
      }
    });
    expect(relationUnit.getOutbox()).toHaveLength(1);
    expect(relationUnit.getOutbox()[0]).toMatchObject({
      type: "question.relation.created",
      schemaVersion: 1,
      payload: { relationType: "refines", createdBy: "owner-a" }
    });
    expect(
      await questions.get({ questionId: source.id, correlationId: "read-source" })
    ).toMatchObject({ ok: true, value: { version: 1 } });
    expect(
      await questions.get({ questionId: target.id, correlationId: "read-target" })
    ).toMatchObject({ ok: true, value: { version: 1 } });
  });

  it("replays equivalent idempotent creation and rejects conflicting key reuse", async () => {
    const { questions, relations, relationUnit } = fixture();
    const source = await createQuestion(
      questions,
      "How does one question emerge from another?",
      "owner-a"
    );
    const target = await createQuestion(
      questions,
      "What earlier uncertainty motivated this inquiry?",
      "owner-b"
    );
    const command = {
      sourceQuestionId: source.id,
      targetQuestionId: target.id,
      type: "emerges_from" as const,
      actorId: "owner-a",
      idempotencyKey: "relation-key-2",
      correlationId: "relation-first"
    };
    const first = await relations.create(command);
    const replay = await relations.create({ ...command, correlationId: "relation-replay" });
    expect(replay).toEqual(first);
    expect(relationUnit.getOutbox()).toHaveLength(1);
    expect(
      await relations.create({
        ...command,
        type: "challenges",
        correlationId: "relation-conflict"
      })
    ).toMatchObject({ ok: false, error: { code: "idempotency_conflict" } });
  });

  it("logically removes a relation with versioning, idempotency, and graph exclusion", async () => {
    const { questions, relations, relationUnit } = fixture();
    const source = await createQuestion(
      questions,
      "What inquiry should be followed up?",
      "owner-a"
    );
    const target = await createQuestion(questions, "Which follow-up remains active?", "owner-b");
    const created = await relations.create({
      sourceQuestionId: source.id,
      targetQuestionId: target.id,
      type: "follow_up",
      actorId: "owner-a",
      correlationId: "relation-follow-up"
    });
    if (!created.ok) throw new Error(created.error.code);
    const command = {
      relationId: created.value.id,
      expectedVersion: 1,
      actorId: "owner-a",
      idempotencyKey: "relation-remove-key",
      correlationId: "relation-remove"
    };
    const removed = await relations.remove(command);
    expect(removed).toMatchObject({ ok: true, value: { status: "removed", version: 2 } });
    expect(await relations.remove({ ...command, correlationId: "relation-remove-replay" })).toEqual(
      removed
    );
    expect(
      await relations.list({ questionId: source.id, correlationId: "after-remove" })
    ).toMatchObject({
      ok: true,
      value: { items: [] }
    });
    expect(relationUnit.getOutbox().map((event) => event.type)).toEqual([
      "question.relation.created",
      "question.relation.removed"
    ]);
  });

  it("rejects self references, missing endpoints, and non-source creators", async () => {
    const { questions, relations } = fixture();
    const source = await createQuestion(
      questions,
      "Why must graph edges have distinct endpoints?",
      "owner-a"
    );
    expect(
      await relations.create({
        sourceQuestionId: source.id,
        targetQuestionId: source.id,
        type: "connects",
        actorId: "owner-a",
        correlationId: "self-link"
      })
    ).toMatchObject({
      ok: false,
      error: { code: "question_relation_self_reference", category: "validation" }
    });
    expect(
      await relations.create({
        sourceQuestionId: source.id,
        targetQuestionId: "missing-question",
        type: "depends_on",
        actorId: "owner-a",
        correlationId: "missing-target"
      })
    ).toMatchObject({ ok: false, error: { code: "target_question_not_found" } });
    const target = await createQuestion(
      questions,
      "Who may assert a relation from a Question?",
      "owner-b"
    );
    expect(
      await relations.create({
        sourceQuestionId: source.id,
        targetQuestionId: target.id,
        type: "challenges",
        actorId: "owner-b",
        correlationId: "forbidden-source"
      })
    ).toMatchObject({
      ok: false,
      error: { code: "question_relation_forbidden", category: "forbidden" }
    });
  });

  it("rejects creation when either endpoint is archived", async () => {
    const { questions, relations } = fixture();
    const source = await createQuestion(
      questions,
      "Can an archived source create a new graph edge?",
      "owner-a"
    );
    const target = await createQuestion(
      questions,
      "Can an active Question depend on archived context?",
      "owner-b"
    );
    expect(
      await questions.archive({
        questionId: target.id,
        expectedVersion: 1,
        actorId: "owner-b",
        correlationId: "archive-target"
      })
    ).toMatchObject({ ok: true });
    expect(
      await relations.create({
        sourceQuestionId: source.id,
        targetQuestionId: target.id,
        type: "depends_on",
        actorId: "owner-a",
        correlationId: "archived-endpoint"
      })
    ).toMatchObject({
      ok: false,
      error: { code: "question_relation_archived_endpoint" }
    });
  });

  it("normalizes symmetric and broadens/narrows semantic duplicates", async () => {
    const { questions, relations } = fixture();
    const left = await createQuestion(
      questions,
      "Can this framing coexist with an alternative?",
      "owner-a"
    );
    const right = await createQuestion(
      questions,
      "Is the reverse framing equally meaningful?",
      "owner-b"
    );
    expect(
      await relations.create({
        sourceQuestionId: left.id,
        targetQuestionId: right.id,
        type: "alternative_to",
        actorId: "owner-a",
        correlationId: "symmetric-first"
      })
    ).toMatchObject({ ok: true });
    expect(
      await relations.create({
        sourceQuestionId: right.id,
        targetQuestionId: left.id,
        type: "alternative_to",
        actorId: "owner-b",
        correlationId: "symmetric-reverse"
      })
    ).toMatchObject({ ok: false, error: { code: "question_relation_exists" } });

    expect(
      await relations.create({
        sourceQuestionId: left.id,
        targetQuestionId: right.id,
        type: "broadens",
        actorId: "owner-a",
        correlationId: "broadens-first"
      })
    ).toMatchObject({ ok: true });
    expect(
      await relations.create({
        sourceQuestionId: right.id,
        targetQuestionId: left.id,
        type: "narrows",
        actorId: "owner-b",
        correlationId: "narrows-inverse"
      })
    ).toMatchObject({ ok: false, error: { code: "question_relation_exists" } });
    expect(canonicalQuestionRelationIdentity("narrows", right.id, left.id)).toEqual(
      canonicalQuestionRelationIdentity("broadens", left.id, right.id)
    );
  });

  it("lists directed and symmetric relations with filters and bounded pagination", async () => {
    const { questions, relations } = fixture();
    const a = await createQuestion(
      questions,
      "What is the starting Question in this graph?",
      "owner-a"
    );
    const b = await createQuestion(
      questions,
      "What Question refines the starting point?",
      "owner-b"
    );
    const c = await createQuestion(
      questions,
      "What Question challenges the middle point?",
      "owner-c"
    );
    await relations.create({
      sourceQuestionId: a.id,
      targetQuestionId: b.id,
      type: "refines",
      actorId: "owner-a",
      correlationId: "list-one"
    });
    await relations.create({
      sourceQuestionId: c.id,
      targetQuestionId: b.id,
      type: "challenges",
      actorId: "owner-c",
      correlationId: "list-two"
    });
    await relations.create({
      sourceQuestionId: a.id,
      targetQuestionId: c.id,
      type: "connects",
      actorId: "owner-a",
      correlationId: "list-three"
    });

    expect(
      await relations.list({
        questionId: b.id,
        direction: "outgoing",
        correlationId: "list-outgoing"
      })
    ).toMatchObject({ ok: true, value: { items: [] } });
    const incoming = await relations.list({
      questionId: b.id,
      direction: "incoming",
      page: 1,
      limit: 1,
      correlationId: "list-incoming"
    });
    expect(incoming).toMatchObject({
      ok: true,
      value: { items: [{ type: "refines" }], hasNext: true, hasPrevious: false }
    });
    expect(
      await relations.list({
        questionId: a.id,
        direction: "incoming",
        relationTypes: ["connects"],
        correlationId: "list-symmetric"
      })
    ).toMatchObject({ ok: true, value: { items: [{ type: "connects" }] } });
  });

  it("traverses a bounded, filtered graph by breadth and direction", async () => {
    const { questions, relations } = fixture();
    const a = await createQuestion(questions, "Where does the graph traversal begin?", "owner-a");
    const b = await createQuestion(
      questions,
      "Which Question is one hop from the root?",
      "owner-b"
    );
    const c = await createQuestion(
      questions,
      "Which Question is two hops from the root?",
      "owner-c"
    );
    const d = await createQuestion(
      questions,
      "Which Question should a node limit exclude?",
      "owner-d"
    );
    for (const command of [
      {
        sourceQuestionId: a.id,
        targetQuestionId: b.id,
        type: "refines" as const,
        actorId: "owner-a",
        correlationId: "graph-1"
      },
      {
        sourceQuestionId: b.id,
        targetQuestionId: c.id,
        type: "depends_on" as const,
        actorId: "owner-b",
        correlationId: "graph-2"
      },
      {
        sourceQuestionId: c.id,
        targetQuestionId: d.id,
        type: "connects" as const,
        actorId: "owner-c",
        correlationId: "graph-3"
      }
    ])
      expect(await relations.create(command)).toMatchObject({ ok: true });

    const graph = await relations.graph({
      questionId: a.id,
      direction: "outgoing",
      depth: 2,
      correlationId: "graph-read"
    });
    expect(graph).toMatchObject({
      ok: true,
      value: { rootQuestionId: a.id, truncated: false }
    });
    if (!graph.ok) throw new Error("graph failed");
    expect(graph.value.nodes.map((node) => node.id)).toEqual([a.id, b.id, c.id]);
    expect(graph.value.relations.map((relation) => relation.type)).toEqual([
      "refines",
      "depends_on"
    ]);

    const bounded = await relations.graph({
      questionId: a.id,
      direction: "outgoing",
      depth: 3,
      maxNodes: 2,
      correlationId: "graph-bounded"
    });
    expect(bounded).toMatchObject({
      ok: true,
      value: { truncated: true, nodes: [{ id: a.id }, { id: b.id }] }
    });
  });

  it("rolls relation, event, and idempotency state back when outbox persistence fails", async () => {
    const questionUnit = new MemoryQuestionUnitOfWork();
    class FailingOutboxUnit extends MemoryQuestionRelationUnitOfWork {
      override async appendOutbox(): Promise<void> {
        throw new Error("injected outbox failure");
      }
    }
    const relationUnit = new FailingOutboxUnit(questionUnit.questions);
    const questions = createQuestionApplication({
      ids: new SequenceIds(["question-a", "question-b"]),
      clock,
      createUnitOfWork: () => questionUnit
    });
    const relations = createQuestionRelationApplication({
      ids: new SequenceIds(["relation-failed"]),
      clock,
      createUnitOfWork: () => relationUnit
    });
    const source = await createQuestion(
      questions,
      "Can transaction rollback remove a relation?",
      "owner-a"
    );
    const target = await createQuestion(
      questions,
      "Can rollback also remove its event and key?",
      "owner-b"
    );
    expect(
      await relations.create({
        sourceQuestionId: source.id,
        targetQuestionId: target.id,
        type: "depends_on",
        actorId: "owner-a",
        idempotencyKey: "rollback-key-1",
        correlationId: "rollback-relation"
      })
    ).toMatchObject({ ok: false, error: { code: "persistence_error" } });
    expect(
      await relationUnit.relations.list({
        questionIds: [source.id],
        direction: "both",
        limit: 10
      })
    ).toHaveLength(0);
    expect(relationUnit.getOutbox()).toHaveLength(0);
  });

  it("applies symmetric traversal semantics independently of stored orientation", async () => {
    const { questions, questionUnit } = fixture();
    const a = await createQuestion(
      questions,
      "Can a symmetric edge be read from either side?",
      "owner-a"
    );
    const b = await createQuestion(
      questions,
      "Does stored orientation change symmetric meaning?",
      "owner-b"
    );
    const left = await questionUnit.questions.getById(a.id);
    const right = await questionUnit.questions.getById(b.id);
    if (!left || !right) throw new Error("Questions missing");
    const relation = QuestionRelation.create({
      id: "symmetric-relation",
      source: left,
      target: right,
      type: "contradicts",
      actorId: "owner-a",
      correlationId: "symmetric-domain",
      clock
    });
    expect(questionRelationNeighbor(relation, b.id, "outgoing")).toBe(a.id);
    expect(questionRelationNeighbor(relation, a.id, "incoming")).toBe(b.id);
  });
});

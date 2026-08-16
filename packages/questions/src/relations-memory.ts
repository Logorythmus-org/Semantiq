import { ConflictError, FixedClock, type Clock } from "../../shared/src/index.js";
import { MemoryQuestionRepository } from "./memory.js";
import { createQuestionRelationApplication } from "./relations-application.js";
import type {
  QuestionRelationApplication,
  QuestionRelationIdempotencyRecord,
  QuestionRelationIdempotencyResult,
  QuestionRelationRepository,
  QuestionRelationRepositoryQuery,
  QuestionRelationUnitOfWork
} from "./relations-contracts.js";
import {
  canonicalQuestionRelationIdentity,
  QuestionRelation,
  type QuestionRelationEvent,
  questionRelationNeighbor,
  type QuestionRelationType,
  type QuestionRelationView
} from "./relations-domain.js";

export class MemoryQuestionRelationRepository implements QuestionRelationRepository {
  private values = new Map<string, QuestionRelationView>();

  async add(relation: QuestionRelation): Promise<void> {
    if (this.values.has(relation.id))
      throw new ConflictError("Question relation already exists", { relationId: relation.id });
    if (
      await this.findEquivalent(relation.type, relation.sourceQuestionId, relation.targetQuestionId)
    )
      throw new ConflictError("An equivalent Question relation already exists");
    this.values.set(relation.id, clone(relation.view()));
  }

  async saveWithExpectedVersion(
    relation: QuestionRelation,
    expectedVersion: number
  ): Promise<boolean> {
    const current = this.values.get(relation.id);
    if (!current || current.version !== expectedVersion) return false;
    this.values.set(relation.id, clone(relation.view()));
    return true;
  }

  async getById(id: string): Promise<QuestionRelation | undefined> {
    const value = this.values.get(id);
    return value ? restoreRelation(value) : undefined;
  }

  async findEquivalent(
    type: QuestionRelationType,
    sourceQuestionId: string,
    targetQuestionId: string
  ): Promise<QuestionRelation | undefined> {
    const expected = canonicalQuestionRelationIdentity(type, sourceQuestionId, targetQuestionId);
    for (const value of this.values.values()) {
      if (value.status === "removed") continue;
      const actual = canonicalQuestionRelationIdentity(
        value.type,
        value.sourceQuestionId,
        value.targetQuestionId
      );
      if (
        actual.type === expected.type &&
        actual.sourceQuestionId === expected.sourceQuestionId &&
        actual.targetQuestionId === expected.targetQuestionId
      )
        return restoreRelation(value);
    }
    return undefined;
  }

  async list(query: QuestionRelationRepositoryQuery): Promise<readonly QuestionRelation[]> {
    const questionIds = new Set(query.questionIds);
    return [...this.values.values()]
      .map(restoreRelation)
      .filter((relation) => relation.status === "active")
      .filter(
        (relation) =>
          (!query.relationTypes || query.relationTypes.includes(relation.type)) &&
          [...questionIds].some(
            (questionId) =>
              questionRelationNeighbor(relation, questionId, query.direction) !== undefined
          )
      )
      .sort(compareRelations)
      .slice(query.offset ?? 0, (query.offset ?? 0) + query.limit);
  }

  snapshot(): Map<string, QuestionRelationView> {
    return new Map([...this.values].map(([key, value]) => [key, clone(value)]));
  }

  restoreSnapshot(snapshot: Map<string, QuestionRelationView>): void {
    this.values = new Map([...snapshot].map(([key, value]) => [key, clone(value)]));
  }
}

export class MemoryQuestionRelationUnitOfWork implements QuestionRelationUnitOfWork {
  readonly questions: MemoryQuestionRepository;
  readonly relations: MemoryQuestionRelationRepository;
  private records = new Map<string, QuestionRelationIdempotencyResult>();
  private outbox: QuestionRelationEvent[] = [];
  private active = false;
  private snapshot:
    | {
        relations: Map<string, QuestionRelationView>;
        records: Map<string, QuestionRelationIdempotencyResult>;
        outbox: QuestionRelationEvent[];
      }
    | undefined;

  constructor(
    questions: MemoryQuestionRepository,
    relations = new MemoryQuestionRelationRepository()
  ) {
    this.questions = questions;
    this.relations = relations;
  }

  async begin(mode: "read" | "write" = "write"): Promise<void> {
    void mode;
    if (this.active) throw new ConflictError("Question relation transaction already active");
    this.snapshot = {
      relations: this.relations.snapshot(),
      records: new Map(this.records),
      outbox: [...this.outbox]
    };
    this.active = true;
  }

  async commit(): Promise<void> {
    this.requireActive();
    this.active = false;
    this.snapshot = undefined;
  }

  async rollback(): Promise<void> {
    if (!this.active || !this.snapshot) return;
    this.relations.restoreSnapshot(this.snapshot.relations);
    this.records = new Map(this.snapshot.records);
    this.outbox = [...this.snapshot.outbox];
    this.active = false;
    this.snapshot = undefined;
  }

  async appendOutbox(event: QuestionRelationEvent): Promise<void> {
    this.requireActive();
    this.outbox.push(event);
  }

  async getIdempotency(
    scope: string,
    key: string
  ): Promise<QuestionRelationIdempotencyResult | undefined> {
    this.requireActive();
    const value = this.records.get(`${scope}:${key}`);
    return value ? clone(value) : undefined;
  }

  async putIdempotency(record: QuestionRelationIdempotencyRecord): Promise<void> {
    this.requireActive();
    const key = `${record.scope}:${record.key}`;
    if (this.records.has(key)) throw new ConflictError("Idempotency key already exists");
    this.records.set(key, {
      fingerprint: record.fingerprint,
      response: clone(record.response)
    });
  }

  getOutbox(): readonly QuestionRelationEvent[] {
    return this.outbox;
  }

  private requireActive(): void {
    if (!this.active) throw new Error("No active Question relation transaction");
  }
}

export function createMemoryQuestionRelationApplication(
  questions: MemoryQuestionRepository,
  clock: Clock = new FixedClock(new Date("2026-01-01T00:00:00.000Z"))
): {
  application: QuestionRelationApplication;
  unit: MemoryQuestionRelationUnitOfWork;
} {
  const unit = new MemoryQuestionRelationUnitOfWork(questions);
  return {
    unit,
    application: createQuestionRelationApplication({
      clock,
      createUnitOfWork: () => unit
    })
  };
}

function restoreRelation(value: QuestionRelationView): QuestionRelation {
  return QuestionRelation.restore({
    id: value.id,
    sourceQuestionId: value.sourceQuestionId,
    targetQuestionId: value.targetQuestionId,
    type: value.type,
    createdBy: value.createdBy,
    createdAt: new Date(value.createdAt),
    status: value.status,
    ...(value.removedBy ? { removedBy: value.removedBy } : {}),
    ...(value.removedAt ? { removedAt: new Date(value.removedAt) } : {}),
    version: value.version
  });
}

function compareRelations(left: QuestionRelation, right: QuestionRelation): number {
  return left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

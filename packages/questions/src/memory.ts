import { ConflictError, FixedClock, type Clock } from "../../shared/src/index.js";
import { createQuestionApplication } from "./application.js";
import type {
  IdempotencyRecord,
  IdempotencyResult,
  QuestionApplication,
  QuestionRepository,
  QuestionRevisionRepository,
  QuestionUnitOfWork
} from "./contracts.js";
import {
  Question,
  type QuestionEvent,
  type QuestionId,
  QuestionRevision,
  type QuestionRevisionView,
  type QuestionView
} from "./domain.js";

export class MemoryQuestionRepository implements QuestionRepository {
  private values = new Map<string, QuestionView>();

  async add(question: Question): Promise<void> {
    if (this.values.has(question.id))
      throw new ConflictError("Question already exists", { questionId: question.id });
    this.values.set(question.id, clone(question.view()));
  }

  async getById(id: string): Promise<Question | undefined> {
    const value = this.values.get(id);
    return value ? restoreQuestion(value) : undefined;
  }

  async getByIds(ids: readonly string[]): Promise<readonly Question[]> {
    return ids
      .map((id) => this.values.get(id))
      .filter((value): value is QuestionView => value !== undefined)
      .map(restoreQuestion);
  }

  async getByIdsForRelationCreation(ids: readonly string[]): Promise<readonly Question[]> {
    return this.getByIds(ids);
  }

  async getByIdForSemanticMutation(id: string): Promise<Question | undefined> {
    return this.getById(id);
  }

  async exists(id: string): Promise<boolean> {
    return this.values.has(id);
  }

  async saveWithExpectedVersion(question: Question, expectedVersion: number): Promise<boolean> {
    const current = this.values.get(question.id);
    if (!current || current.version !== expectedVersion || question.version !== expectedVersion + 1)
      return false;
    this.values.set(question.id, clone(question.view()));
    return true;
  }

  snapshot(): Map<string, QuestionView> {
    return new Map([...this.values].map(([key, value]) => [key, clone(value)]));
  }

  restoreSnapshot(snapshot: Map<string, QuestionView>): void {
    this.values = new Map([...snapshot].map(([key, value]) => [key, clone(value)]));
  }
}

export class MemoryQuestionRevisionRepository implements QuestionRevisionRepository {
  private values = new Map<string, QuestionRevisionView[]>();

  async add(revision: QuestionRevision): Promise<void> {
    const values = this.values.get(revision.questionId) ?? [];
    if (values.some((value) => value.version === revision.version))
      throw new ConflictError("Question revision version already exists");
    this.values.set(revision.questionId, [...values, clone(revision.view())]);
  }

  async listByQuestion(questionId: QuestionId): Promise<readonly QuestionRevision[]> {
    return [...(this.values.get(questionId) ?? [])]
      .sort((left, right) => left.version - right.version)
      .map(restoreRevision);
  }

  snapshot(): Map<string, QuestionRevisionView[]> {
    return new Map(
      [...this.values].map(([key, values]) => [key, values.map((value) => clone(value))])
    );
  }

  restoreSnapshot(snapshot: Map<string, QuestionRevisionView[]>): void {
    this.values = new Map(
      [...snapshot].map(([key, values]) => [key, values.map((value) => clone(value))])
    );
  }
}

export class MemoryQuestionUnitOfWork implements QuestionUnitOfWork {
  readonly questions: MemoryQuestionRepository;
  readonly revisions: MemoryQuestionRevisionRepository;
  private records = new Map<string, IdempotencyResult>();
  private outbox: QuestionEvent[] = [];
  private active = false;
  private snapshot:
    | {
        questions: Map<string, QuestionView>;
        revisions: Map<string, QuestionRevisionView[]>;
        records: Map<string, IdempotencyResult>;
        outbox: QuestionEvent[];
      }
    | undefined;

  constructor(
    questions = new MemoryQuestionRepository(),
    revisions = new MemoryQuestionRevisionRepository()
  ) {
    this.questions = questions;
    this.revisions = revisions;
  }

  async begin(): Promise<void> {
    if (this.active) throw new ConflictError("Question transaction already active");
    this.snapshot = {
      questions: this.questions.snapshot(),
      revisions: this.revisions.snapshot(),
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
    this.questions.restoreSnapshot(this.snapshot.questions);
    this.revisions.restoreSnapshot(this.snapshot.revisions);
    this.records = new Map(this.snapshot.records);
    this.outbox = [...this.snapshot.outbox];
    this.active = false;
    this.snapshot = undefined;
  }

  async appendOutbox(event: QuestionEvent): Promise<void> {
    this.requireActive();
    this.outbox.push(event);
  }

  async getIdempotency(scope: string, key: string): Promise<IdempotencyResult | undefined> {
    this.requireActive();
    return this.records.get(`${scope}:${key}`);
  }

  async putIdempotency(record: IdempotencyRecord): Promise<void> {
    this.requireActive();
    const key = `${record.scope}:${record.key}`;
    if (this.records.has(key)) throw new ConflictError("Idempotency key already exists");
    this.records.set(key, { fingerprint: record.fingerprint, response: clone(record.response) });
  }

  getOutbox(): readonly QuestionEvent[] {
    return this.outbox;
  }

  private requireActive(): void {
    if (!this.active) throw new Error("No active Question transaction");
  }
}

export function createMemoryQuestionApplication(
  clock: Clock = new FixedClock(new Date("2026-01-01T00:00:00.000Z"))
): { application: QuestionApplication; unit: MemoryQuestionUnitOfWork } {
  const unit = new MemoryQuestionUnitOfWork();
  return {
    unit,
    application: createQuestionApplication({ clock, createUnitOfWork: () => unit })
  };
}

function restoreQuestion(value: QuestionView): Question {
  return Question.restore({
    id: value.id,
    text: value.text,
    status: value.status,
    language: value.language,
    source: value.source,
    createdAt: new Date(value.createdAt),
    updatedAt: new Date(value.updatedAt),
    version: value.version,
    ...(value.creatorId ? { creatorId: value.creatorId } : {})
  });
}

function restoreRevision(value: QuestionRevisionView): QuestionRevision {
  return QuestionRevision.restore({
    id: value.id,
    questionId: value.questionId,
    version: value.version,
    previousText: value.previousText,
    text: value.text,
    previousStatus: value.previousStatus,
    status: value.status,
    changeType: value.changeType,
    changedBy: value.changedBy,
    changedAt: new Date(value.changedAt),
    ...(value.reason ? { reason: value.reason } : {}),
    correlationId: value.correlationId
  });
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

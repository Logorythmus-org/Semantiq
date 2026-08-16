import { ConflictError, FixedClock, type Clock } from "../../shared/src/index.js";
import { MemoryQuestionRepository } from "./memory.js";
import { createQuestionSemanticApplication } from "./semantic-application.js";
import type {
  QuestionSemanticApplication,
  QuestionSemanticIdempotencyRecord,
  QuestionSemanticIdempotencyResult,
  QuestionSemanticRevisionRepository,
  QuestionSemanticStructureRepository,
  QuestionSemanticUnitOfWork
} from "./semantic-contracts.js";
import {
  QuestionSemanticRevision,
  type QuestionSemanticRevisionView,
  QuestionSemanticStructure,
  type QuestionSemanticStructureEvent,
  type QuestionSemanticStructureInput,
  type QuestionSemanticStructureView
} from "./semantic-domain.js";

export class MemoryQuestionSemanticStructureRepository
  implements QuestionSemanticStructureRepository
{
  private values = new Map<string, QuestionSemanticStructureView>();

  async add(structure: QuestionSemanticStructure): Promise<void> {
    if (this.values.has(structure.questionId))
      throw new ConflictError("Question semantic structure already exists");
    this.values.set(structure.questionId, clone(structure.view()));
  }

  async getByQuestionId(questionId: string): Promise<QuestionSemanticStructure | undefined> {
    const value = this.values.get(questionId);
    return value ? restoreStructure(value) : undefined;
  }

  async getByQuestionIdForUpdate(
    questionId: string
  ): Promise<QuestionSemanticStructure | undefined> {
    return this.getByQuestionId(questionId);
  }

  async saveWithExpectedVersion(
    structure: QuestionSemanticStructure,
    expectedVersion: number
  ): Promise<boolean> {
    const current = this.values.get(structure.questionId);
    if (
      !current ||
      current.version !== expectedVersion ||
      structure.version !== expectedVersion + 1
    )
      return false;
    this.values.set(structure.questionId, clone(structure.view()));
    return true;
  }

  snapshot(): Map<string, QuestionSemanticStructureView> {
    return new Map([...this.values].map(([key, value]) => [key, clone(value)]));
  }

  restoreSnapshot(snapshot: Map<string, QuestionSemanticStructureView>): void {
    this.values = new Map([...snapshot].map(([key, value]) => [key, clone(value)]));
  }
}

export class MemoryQuestionSemanticRevisionRepository
  implements QuestionSemanticRevisionRepository
{
  private values = new Map<string, QuestionSemanticRevisionView[]>();

  async add(revision: QuestionSemanticRevision): Promise<void> {
    const values = this.values.get(revision.questionId) ?? [];
    if (values.some((value) => value.version === revision.version))
      throw new ConflictError("Question semantic revision version already exists");
    this.values.set(revision.questionId, [...values, clone(revision.view())]);
  }

  async listByQuestion(questionId: string): Promise<readonly QuestionSemanticRevision[]> {
    return [...(this.values.get(questionId) ?? [])]
      .sort((left, right) => left.version - right.version)
      .map(restoreRevision);
  }

  snapshot(): Map<string, QuestionSemanticRevisionView[]> {
    return new Map(
      [...this.values].map(([key, values]) => [key, values.map((value) => clone(value))])
    );
  }

  restoreSnapshot(snapshot: Map<string, QuestionSemanticRevisionView[]>): void {
    this.values = new Map(
      [...snapshot].map(([key, values]) => [key, values.map((value) => clone(value))])
    );
  }
}

export class MemoryQuestionSemanticUnitOfWork implements QuestionSemanticUnitOfWork {
  readonly questions: MemoryQuestionRepository;
  readonly structures: MemoryQuestionSemanticStructureRepository;
  readonly revisions: MemoryQuestionSemanticRevisionRepository;
  private records = new Map<string, QuestionSemanticIdempotencyResult>();
  private outbox: QuestionSemanticStructureEvent[] = [];
  private active = false;
  private snapshot:
    | {
        structures: Map<string, QuestionSemanticStructureView>;
        revisions: Map<string, QuestionSemanticRevisionView[]>;
        records: Map<string, QuestionSemanticIdempotencyResult>;
        outbox: QuestionSemanticStructureEvent[];
      }
    | undefined;

  constructor(
    questions: MemoryQuestionRepository,
    structures = new MemoryQuestionSemanticStructureRepository(),
    revisions = new MemoryQuestionSemanticRevisionRepository()
  ) {
    this.questions = questions;
    this.structures = structures;
    this.revisions = revisions;
  }

  async begin(mode: "read" | "write" = "write"): Promise<void> {
    void mode;
    if (this.active) throw new ConflictError("Question semantic transaction already active");
    this.snapshot = {
      structures: this.structures.snapshot(),
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
    this.structures.restoreSnapshot(this.snapshot.structures);
    this.revisions.restoreSnapshot(this.snapshot.revisions);
    this.records = new Map(this.snapshot.records);
    this.outbox = [...this.snapshot.outbox];
    this.active = false;
    this.snapshot = undefined;
  }

  async appendOutbox(event: QuestionSemanticStructureEvent): Promise<void> {
    this.requireActive();
    this.outbox.push(event);
  }

  async getIdempotency(
    scope: string,
    key: string
  ): Promise<QuestionSemanticIdempotencyResult | undefined> {
    this.requireActive();
    const value = this.records.get(`${scope}:${key}`);
    return value ? clone(value) : undefined;
  }

  async putIdempotency(record: QuestionSemanticIdempotencyRecord): Promise<void> {
    this.requireActive();
    const key = `${record.scope}:${record.key}`;
    if (this.records.has(key)) throw new ConflictError("Idempotency key already exists");
    this.records.set(key, {
      fingerprint: record.fingerprint,
      response: clone(record.response)
    });
  }

  getOutbox(): readonly QuestionSemanticStructureEvent[] {
    return this.outbox;
  }

  private requireActive(): void {
    if (!this.active) throw new Error("No active Question semantic transaction");
  }
}

export function createMemoryQuestionSemanticApplication(
  questions: MemoryQuestionRepository,
  clock: Clock = new FixedClock(new Date("2026-01-01T00:00:00.000Z"))
): {
  application: QuestionSemanticApplication;
  unit: MemoryQuestionSemanticUnitOfWork;
} {
  const unit = new MemoryQuestionSemanticUnitOfWork(questions);
  return {
    unit,
    application: createQuestionSemanticApplication({
      clock,
      createUnitOfWork: () => unit
    })
  };
}

function restoreStructure(value: QuestionSemanticStructureView): QuestionSemanticStructure {
  return QuestionSemanticStructure.restore({
    questionId: value.questionId,
    content: contentFromView(value),
    questionVersionAtLastUpdate: value.questionVersionAtLastUpdate,
    createdBy: value.createdBy,
    updatedBy: value.updatedBy,
    createdAt: new Date(value.createdAt),
    updatedAt: new Date(value.updatedAt),
    version: value.version
  });
}

function restoreRevision(value: QuestionSemanticRevisionView): QuestionSemanticRevision {
  return QuestionSemanticRevision.restore({
    id: value.id,
    questionId: value.questionId,
    version: value.version,
    previousStructure: value.previousStructure,
    structure: value.structure,
    changedBy: value.changedBy,
    changedAt: new Date(value.changedAt),
    ...(value.reason ? { reason: value.reason } : {}),
    correlationId: value.correlationId
  });
}

function contentFromView(value: QuestionSemanticStructureView): QuestionSemanticStructureInput {
  return {
    context: value.context,
    assumptions: value.assumptions,
    constraints: value.constraints,
    unknowns: value.unknowns,
    uncertainty: value.uncertainty,
    scope: value.scope,
    perspectives: value.perspectives,
    openPossibilities: value.openPossibilities
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

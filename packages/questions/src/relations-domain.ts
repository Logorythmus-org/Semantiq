import {
  type Clock,
  createEvent,
  type DomainEvent,
  SystemClock,
  ValidationError
} from "../../shared/src/index.js";
import { Question, QuestionRuntimeError } from "./domain.js";

export const QUESTION_RELATION_TYPES = [
  "emerges_from",
  "refines",
  "challenges",
  "contradicts",
  "depends_on",
  "broadens",
  "narrows",
  "alternative_to",
  "connects",
  "follow_up"
] as const;

export type QuestionRelationType = (typeof QUESTION_RELATION_TYPES)[number];
export type QuestionRelationDirection = "outgoing" | "incoming" | "both";
export type QuestionRelationDirectionality = "directed" | "symmetric";
export type QuestionRelationId = string;
export type QuestionRelationStatus = "active" | "removed";

const SYMMETRIC_RELATION_TYPES = new Set<QuestionRelationType>([
  "contradicts",
  "alternative_to",
  "connects"
]);

export interface QuestionRelationCreatedPayload {
  readonly relationId: QuestionRelationId;
  readonly sourceQuestionId: string;
  readonly targetQuestionId: string;
  readonly relationType: QuestionRelationType;
  readonly createdBy: string;
}

export interface QuestionRelationRemovedPayload {
  readonly relationId: QuestionRelationId;
  readonly sourceQuestionId: string;
  readonly targetQuestionId: string;
  readonly relationType: QuestionRelationType;
  readonly removedBy: string;
  readonly version: number;
}

export type QuestionRelationCreatedEvent = DomainEvent<QuestionRelationCreatedPayload>;
export type QuestionRelationRemovedEvent = DomainEvent<QuestionRelationRemovedPayload>;
export type QuestionRelationEvent = QuestionRelationCreatedEvent | QuestionRelationRemovedEvent;

export interface QuestionRelationView {
  readonly id: QuestionRelationId;
  readonly sourceQuestionId: string;
  readonly targetQuestionId: string;
  readonly type: QuestionRelationType;
  readonly directionality: QuestionRelationDirectionality;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly status: QuestionRelationStatus;
  readonly removedBy?: string;
  readonly removedAt?: string;
  readonly version: number;
}

export interface CanonicalQuestionRelationIdentity {
  readonly type: Exclude<QuestionRelationType, "narrows">;
  readonly sourceQuestionId: string;
  readonly targetQuestionId: string;
}

export class QuestionRelation {
  readonly id: QuestionRelationId;
  readonly sourceQuestionId: string;
  readonly targetQuestionId: string;
  readonly type: QuestionRelationType;
  readonly createdBy: string;
  readonly createdAt: Date;
  private currentStatus: QuestionRelationStatus;
  private currentRemovedBy: string | undefined;
  private currentRemovedAt: Date | undefined;
  private currentVersion: number;
  private readonly events: QuestionRelationEvent[];

  private constructor(input: {
    id: string;
    sourceQuestionId: string;
    targetQuestionId: string;
    type: QuestionRelationType;
    createdBy: string;
    createdAt: Date;
    status: QuestionRelationStatus;
    removedBy?: string;
    removedAt?: Date;
    version: number;
  }) {
    validateIdentifier(input.id, "relation ID");
    validateIdentifier(input.sourceQuestionId, "source Question ID");
    validateIdentifier(input.targetQuestionId, "target Question ID");
    validateIdentifier(input.createdBy, "actor ID");
    if (input.sourceQuestionId === input.targetQuestionId)
      throw new QuestionRuntimeError(
        "question_relation_self_reference",
        "A Question cannot be related to itself",
        "validation"
      );
    if (!isQuestionRelationType(input.type))
      throw new QuestionRuntimeError(
        "invalid_question_relation_type",
        "Invalid Question relation type",
        "validation"
      );
    if (Number.isNaN(input.createdAt.getTime()))
      throw new ValidationError("Invalid Question relation timestamp", { field: "createdAt" });
    if (!Number.isInteger(input.version) || input.version < 1)
      throw new ValidationError("Invalid Question relation version", { field: "version" });
    this.id = input.id;
    this.sourceQuestionId = input.sourceQuestionId;
    this.targetQuestionId = input.targetQuestionId;
    this.type = input.type;
    this.createdBy = input.createdBy;
    this.createdAt = new Date(input.createdAt);
    if (input.status !== "active" && input.status !== "removed")
      throw new ValidationError("Invalid Question relation status", { field: "status" });
    if (input.status === "removed" && (!input.removedBy || !input.removedAt))
      throw new ValidationError("Removed Question relations require removal metadata");
    this.currentStatus = input.status;
    this.currentRemovedBy = input.removedBy;
    this.currentRemovedAt = input.removedAt ? new Date(input.removedAt) : undefined;
    this.currentVersion = input.version;
    this.events = [];
  }

  static create(input: {
    id: string;
    source: Question;
    target: Question;
    type: QuestionRelationType;
    actorId: string;
    correlationId: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionRelation {
    validateCorrelationId(input.correlationId);
    if (input.causationId) validateCorrelationId(input.causationId);
    if (!input.source.creatorId || input.source.creatorId !== input.actorId)
      throw new QuestionRuntimeError(
        "question_relation_forbidden",
        "Only the source Question creator may create this relation",
        "forbidden"
      );
    if (input.source.status === "archived" || input.target.status === "archived")
      throw new QuestionRuntimeError(
        "question_relation_archived_endpoint",
        "Relations can only be created between published Questions",
        "conflict"
      );
    const relation = new QuestionRelation({
      id: input.id,
      sourceQuestionId: input.source.id,
      targetQuestionId: input.target.id,
      type: input.type,
      createdBy: input.actorId,
      createdAt: (input.clock ?? new SystemClock()).now(),
      status: "active",
      version: 1
    });
    relation.events.push(
      createQuestionRelationCreatedEvent(relation, input.correlationId, input.causationId)
    );
    return relation;
  }

  static restore(input: {
    id: string;
    sourceQuestionId: string;
    targetQuestionId: string;
    type: QuestionRelationType;
    createdBy: string;
    createdAt: Date;
    status?: QuestionRelationStatus;
    removedBy?: string;
    removedAt?: Date;
    version: number;
  }): QuestionRelation {
    return new QuestionRelation({ ...input, status: input.status ?? "active" });
  }

  get status(): QuestionRelationStatus {
    return this.currentStatus;
  }

  get removedBy(): string | undefined {
    return this.currentRemovedBy;
  }

  get removedAt(): Date | undefined {
    return this.currentRemovedAt ? new Date(this.currentRemovedAt) : undefined;
  }

  get version(): number {
    return this.currentVersion;
  }

  remove(input: {
    actorId: string;
    expectedVersion: number;
    correlationId: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionRelationRemovedEvent {
    validateIdentifier(input.actorId, "actor ID");
    validateCorrelationId(input.correlationId);
    if (input.causationId) validateCorrelationId(input.causationId);
    if (input.actorId !== this.createdBy)
      throw new QuestionRuntimeError(
        "question_relation_forbidden",
        "Only the relation creator may remove this relation",
        "forbidden"
      );
    if (input.expectedVersion !== this.version)
      throw new QuestionRuntimeError(
        "question_relation_version_conflict",
        "Question relation version does not match the expected version",
        "conflict",
        { currentVersion: this.version }
      );
    if (this.status === "removed")
      throw new QuestionRuntimeError(
        "question_relation_removed",
        "Question relation is already removed",
        "conflict"
      );
    this.currentStatus = "removed";
    this.currentRemovedBy = input.actorId;
    this.currentRemovedAt = (input.clock ?? new SystemClock()).now();
    this.currentVersion += 1;
    const event = createQuestionRelationRemovedEvent(this, input.correlationId, input.causationId);
    this.events.push(event);
    return event;
  }

  get directionality(): QuestionRelationDirectionality {
    return isSymmetricQuestionRelationType(this.type) ? "symmetric" : "directed";
  }

  pullEvents(): readonly QuestionRelationEvent[] {
    const events = [...this.events];
    this.events.length = 0;
    return events;
  }

  view(): QuestionRelationView {
    return {
      id: this.id,
      sourceQuestionId: this.sourceQuestionId,
      targetQuestionId: this.targetQuestionId,
      type: this.type,
      directionality: this.directionality,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
      status: this.status,
      ...(this.removedBy ? { removedBy: this.removedBy } : {}),
      ...(this.removedAt ? { removedAt: this.removedAt.toISOString() } : {}),
      version: this.version
    };
  }
}

function createQuestionRelationRemovedEvent(
  relation: QuestionRelation,
  correlationId: string,
  causationId?: string
): QuestionRelationRemovedEvent {
  const correlation = { correlationId, ...(causationId ? { causationId } : {}) };
  return createEvent(
    "question.relation.removed",
    {
      relationId: relation.id,
      sourceQuestionId: relation.sourceQuestionId,
      targetQuestionId: relation.targetQuestionId,
      relationType: relation.type,
      removedBy: relation.removedBy!,
      version: relation.version
    },
    {
      aggregateId: relation.id,
      metadata: correlation,
      schemaVersion: 1,
      correlation,
      occurredAt: relation.removedAt!
    }
  );
}

export function isQuestionRelationType(value: unknown): value is QuestionRelationType {
  return (
    typeof value === "string" && (QUESTION_RELATION_TYPES as readonly string[]).includes(value)
  );
}

export function isSymmetricQuestionRelationType(type: QuestionRelationType): boolean {
  return SYMMETRIC_RELATION_TYPES.has(type);
}

export function canonicalQuestionRelationIdentity(
  type: QuestionRelationType,
  sourceQuestionId: string,
  targetQuestionId: string
): CanonicalQuestionRelationIdentity {
  if (type === "narrows")
    return {
      type: "broadens",
      sourceQuestionId: targetQuestionId,
      targetQuestionId: sourceQuestionId
    };
  if (isSymmetricQuestionRelationType(type)) {
    const [source, target] = [sourceQuestionId, targetQuestionId].sort();
    return { type, sourceQuestionId: source!, targetQuestionId: target! };
  }
  return { type, sourceQuestionId, targetQuestionId };
}

export function questionRelationNeighbor(
  relation: QuestionRelation,
  questionId: string,
  direction: QuestionRelationDirection
): string | undefined {
  const symmetric = isSymmetricQuestionRelationType(relation.type);
  if (relation.sourceQuestionId === questionId && (direction !== "incoming" || symmetric))
    return relation.targetQuestionId;
  if (relation.targetQuestionId === questionId && (direction !== "outgoing" || symmetric))
    return relation.sourceQuestionId;
  return undefined;
}

function createQuestionRelationCreatedEvent(
  relation: QuestionRelation,
  correlationId: string,
  causationId?: string
): QuestionRelationCreatedEvent {
  const correlation = { correlationId, ...(causationId ? { causationId } : {}) };
  return createEvent(
    "question.relation.created",
    {
      relationId: relation.id,
      sourceQuestionId: relation.sourceQuestionId,
      targetQuestionId: relation.targetQuestionId,
      relationType: relation.type,
      createdBy: relation.createdBy
    },
    {
      aggregateId: relation.id,
      metadata: correlation,
      schemaVersion: 1,
      correlation,
      occurredAt: relation.createdAt
    }
  );
}

function validateIdentifier(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value))
    throw new ValidationError(`Invalid ${label}`);
}

function validateCorrelationId(value: string): void {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value))
    throw new ValidationError("Invalid correlation ID", { field: "correlationId" });
}

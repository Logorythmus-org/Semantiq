import {
  ApplicationError,
  type Clock,
  createEvent,
  type DomainEvent,
  SystemClock,
  ValidationError
} from "../../shared/src/index.js";

export type QuestionStatus = "published" | "archived";
export type QuestionSource = "human" | "import" | "agent" | "system";
export type QuestionChangeType = "updated" | "archived" | "restored";
export type QuestionId = string;
export type QuestionRevisionId = string;
export type QuestionErrorCategory =
  | "validation"
  | "domain"
  | "conflict"
  | "not_found"
  | "forbidden";

export class QuestionRuntimeError extends ApplicationError {
  readonly category: QuestionErrorCategory;
  constructor(code: string, message: string, category: QuestionErrorCategory, details?: unknown) {
    const statusCode =
      category === "validation"
        ? 422
        : category === "not_found"
          ? 404
          : category === "forbidden"
            ? 403
            : 409;
    super(message, { code, statusCode, details });
    this.name = "QuestionRuntimeError";
    this.category = category;
  }
}

export class QuestionText {
  readonly value: string;
  constructor(value: string) {
    const normalized = value
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[\t ]+/g, " ").trim())
      .join("\n")
      .trim();
    const length = [...normalized].length;
    if (length < 10)
      throw new ValidationError("Question text must contain at least 10 characters", {
        field: "text"
      });
    if (length > 2000)
      throw new ValidationError("Question text must not exceed 2000 characters", {
        field: "text"
      });
    if ([...normalized].some(isDisallowedControlCharacter))
      throw new ValidationError("Question text contains a control character", { field: "text" });
    this.value = normalized;
  }
  toString(): string {
    return this.value;
  }
}

export class LanguageTag {
  readonly value: string;
  constructor(value: string) {
    const normalized = value.trim();
    if (!/^[a-z]{2,8}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2})?$/.test(normalized))
      throw new ValidationError("Language must be a valid language tag", { field: "language" });
    this.value = normalized;
  }
}

export class MutationReason {
  readonly value: string | undefined;
  constructor(value?: string) {
    const normalized = value?.replace(/\r\n?/g, "\n").trim();
    if (!normalized) {
      this.value = undefined;
      return;
    }
    if ([...normalized].length > 500)
      throw new ValidationError("Mutation reason must not exceed 500 characters", {
        field: "reason"
      });
    if ([...normalized].some(isDisallowedControlCharacter))
      throw new ValidationError("Mutation reason contains a control character", {
        field: "reason"
      });
    this.value = normalized;
  }
}

export interface QuestionCreatedPayload {
  readonly questionId: QuestionId;
  readonly status: QuestionStatus;
  readonly language: string;
  readonly source: QuestionSource;
  readonly creatorId?: string;
}

export interface QuestionMutationPayload {
  readonly questionId: QuestionId;
  readonly revisionId: QuestionRevisionId;
  readonly aggregateVersion: number;
  readonly changedBy: string;
}

export type QuestionCreatedEvent = DomainEvent<QuestionCreatedPayload>;
export type QuestionUpdatedEvent = DomainEvent<QuestionMutationPayload>;
export type QuestionArchivedEvent = DomainEvent<QuestionMutationPayload>;
export type QuestionRestoredEvent = DomainEvent<QuestionMutationPayload>;
export type QuestionEvent =
  | QuestionCreatedEvent
  | QuestionUpdatedEvent
  | QuestionArchivedEvent
  | QuestionRestoredEvent;

export interface QuestionView {
  readonly id: QuestionId;
  readonly text: string;
  readonly status: QuestionStatus;
  readonly language: string;
  readonly source: QuestionSource;
  readonly creatorId: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
}

export interface QuestionRevisionView {
  readonly id: QuestionRevisionId;
  readonly questionId: QuestionId;
  readonly version: number;
  readonly previousText: string;
  readonly text: string;
  readonly previousStatus: QuestionStatus;
  readonly status: QuestionStatus;
  readonly changeType: QuestionChangeType;
  readonly changedBy: string;
  readonly changedAt: string;
  readonly reason: string | undefined;
  readonly correlationId: string;
}

export interface QuestionMutation {
  readonly revision: QuestionRevision;
  readonly event: QuestionUpdatedEvent | QuestionArchivedEvent | QuestionRestoredEvent;
}

export interface QuestionRevisionInput {
  readonly id: QuestionRevisionId;
  readonly questionId: QuestionId;
  readonly version: number;
  readonly previousText: string;
  readonly text: string;
  readonly previousStatus: QuestionStatus;
  readonly status: QuestionStatus;
  readonly changeType: QuestionChangeType;
  readonly changedBy: string;
  readonly changedAt: Date;
  readonly reason?: string;
  readonly correlationId: string;
}

export class QuestionRevision {
  readonly id: QuestionRevisionId;
  readonly questionId: QuestionId;
  readonly version: number;
  readonly previousText: string;
  readonly text: string;
  readonly previousStatus: QuestionStatus;
  readonly status: QuestionStatus;
  readonly changeType: QuestionChangeType;
  readonly changedBy: string;
  readonly changedAt: Date;
  readonly reason: string | undefined;
  readonly correlationId: string;

  private constructor(input: QuestionRevisionInput) {
    validateIdentifier(input.id, "revision ID");
    validateIdentifier(input.questionId, "question ID");
    validateActor(input.changedBy);
    validateCorrelationId(input.correlationId);
    if (!Number.isInteger(input.version) || input.version < 2)
      throw new ValidationError("Revision version must be an integer greater than one", {
        field: "version"
      });
    if (Number.isNaN(input.changedAt.getTime()))
      throw new ValidationError("Invalid revision timestamp", { field: "changedAt" });
    this.id = input.id;
    this.questionId = input.questionId;
    this.version = input.version;
    this.previousText = new QuestionText(input.previousText).value;
    this.text = new QuestionText(input.text).value;
    this.previousStatus = validateStatus(input.previousStatus);
    this.status = validateStatus(input.status);
    this.changeType = input.changeType;
    this.changedBy = input.changedBy;
    this.changedAt = new Date(input.changedAt);
    this.reason = new MutationReason(input.reason).value;
    this.correlationId = input.correlationId;
    Object.freeze(this);
  }

  static create(input: QuestionRevisionInput): QuestionRevision {
    return new QuestionRevision(input);
  }

  static restore(input: QuestionRevisionInput): QuestionRevision {
    return new QuestionRevision(input);
  }

  view(): QuestionRevisionView {
    return {
      id: this.id,
      questionId: this.questionId,
      version: this.version,
      previousText: this.previousText,
      text: this.text,
      previousStatus: this.previousStatus,
      status: this.status,
      changeType: this.changeType,
      changedBy: this.changedBy,
      changedAt: this.changedAt.toISOString(),
      reason: this.reason,
      correlationId: this.correlationId
    };
  }
}

export class Question {
  readonly id: QuestionId;
  readonly language: LanguageTag;
  readonly source: QuestionSource;
  readonly creatorId: string | undefined;
  readonly createdAt: Date;
  private currentText: QuestionText;
  private currentStatus: QuestionStatus;
  private currentUpdatedAt: Date;
  private currentVersion: number;
  private readonly events: QuestionEvent[];

  private constructor(input: {
    id: QuestionId;
    text: QuestionText;
    status: QuestionStatus;
    language: LanguageTag;
    source: QuestionSource;
    creatorId?: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }) {
    validateIdentifier(input.id, "question ID");
    if (input.creatorId) validateActor(input.creatorId);
    if (!Number.isInteger(input.version) || input.version < 1)
      throw new ValidationError("Invalid Question version", { field: "version" });
    if (
      Number.isNaN(input.createdAt.getTime()) ||
      Number.isNaN(input.updatedAt.getTime()) ||
      input.updatedAt < input.createdAt
    )
      throw new ValidationError("Invalid persisted Question timestamps");
    this.id = input.id;
    this.currentText = input.text;
    this.currentStatus = validateStatus(input.status);
    this.language = input.language;
    this.source = input.source;
    this.creatorId = input.creatorId;
    this.createdAt = new Date(input.createdAt);
    this.currentUpdatedAt = new Date(input.updatedAt);
    this.currentVersion = input.version;
    this.events = [];
  }

  get text(): QuestionText {
    return this.currentText;
  }

  get status(): QuestionStatus {
    return this.currentStatus;
  }

  get updatedAt(): Date {
    return new Date(this.currentUpdatedAt);
  }

  get version(): number {
    return this.currentVersion;
  }

  static create(input: {
    id: QuestionId;
    text: string;
    language: string;
    source?: QuestionSource;
    creatorId?: string;
    clock?: Clock;
    correlationId: string;
    causationId?: string;
  }): Question {
    validateCorrelationId(input.correlationId);
    if (input.causationId) validateCorrelationId(input.causationId);
    const source = input.source ?? "human";
    if (!isSource(source))
      throw new ValidationError("Invalid question source", { field: "source" });
    const now = (input.clock ?? new SystemClock()).now();
    const question = new Question({
      id: input.id,
      text: new QuestionText(input.text),
      status: "published",
      language: new LanguageTag(input.language),
      source,
      ...(input.creatorId ? { creatorId: input.creatorId } : {}),
      createdAt: now,
      updatedAt: now,
      version: 1
    });
    question.events.push(
      createQuestionCreatedEvent(question, input.correlationId, input.causationId)
    );
    return question;
  }

  static restore(input: {
    id: string;
    text: string;
    status: QuestionStatus;
    language: string;
    source: QuestionSource;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    creatorId?: string;
  }): Question {
    return new Question({
      id: input.id,
      text: new QuestionText(input.text),
      status: input.status,
      language: new LanguageTag(input.language),
      source: input.source,
      ...(input.creatorId ? { creatorId: input.creatorId } : {}),
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      version: input.version
    });
  }

  assertActorCanViewHistory(actorId: string): void {
    this.assertCreator(actorId);
  }

  updateText(input: {
    text: string;
    expectedVersion: number;
    actorId: string;
    revisionId: string;
    correlationId: string;
    reason?: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionMutation {
    this.assertMutation(input.actorId, input.expectedVersion);
    if (this.status === "archived")
      throw new QuestionRuntimeError(
        "question_archived",
        "Archived Questions must be restored before editing",
        "conflict"
      );
    const nextText = new QuestionText(input.text);
    if (nextText.value === this.text.value)
      throw new QuestionRuntimeError(
        "question_no_change",
        "Question text is unchanged after normalization",
        "domain"
      );
    return this.applyMutation({
      ...input,
      text: nextText,
      status: this.status,
      changeType: "updated",
      eventType: "question.updated"
    });
  }

  archive(input: {
    expectedVersion: number;
    actorId: string;
    revisionId: string;
    correlationId: string;
    reason?: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionMutation {
    this.assertMutation(input.actorId, input.expectedVersion);
    if (this.status === "archived")
      throw new QuestionRuntimeError(
        "question_already_archived",
        "Question is already archived",
        "conflict"
      );
    return this.applyMutation({
      ...input,
      text: this.text,
      status: "archived",
      changeType: "archived",
      eventType: "question.archived"
    });
  }

  restoreQuestion(input: {
    expectedVersion: number;
    actorId: string;
    revisionId: string;
    correlationId: string;
    reason?: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionMutation {
    this.assertMutation(input.actorId, input.expectedVersion);
    if (this.status === "published")
      throw new QuestionRuntimeError(
        "question_already_active",
        "Question is already active",
        "conflict"
      );
    return this.applyMutation({
      ...input,
      text: this.text,
      status: "published",
      changeType: "restored",
      eventType: "question.restored"
    });
  }

  moderateArchive(input: {
    actorId: string;
    revisionId: string;
    correlationId: string;
    reason: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionMutation {
    validateActor(input.actorId);
    if (this.status === "archived")
      throw new QuestionRuntimeError(
        "question_already_archived",
        "Question is already archived",
        "conflict"
      );
    return this.applyMutation({
      ...input,
      expectedVersion: this.version,
      text: this.text,
      status: "archived",
      changeType: "archived",
      eventType: "question.archived"
    });
  }

  moderateRestore(input: {
    actorId: string;
    revisionId: string;
    correlationId: string;
    reason: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionMutation {
    validateActor(input.actorId);
    if (this.status === "published")
      throw new QuestionRuntimeError(
        "question_already_active",
        "Question is already active",
        "conflict"
      );
    return this.applyMutation({
      ...input,
      expectedVersion: this.version,
      text: this.text,
      status: "published",
      changeType: "restored",
      eventType: "question.restored"
    });
  }

  pullEvents(): readonly QuestionEvent[] {
    const events = [...this.events];
    this.events.length = 0;
    return events;
  }

  view(): QuestionView {
    return {
      id: this.id,
      text: this.text.value,
      status: this.status,
      language: this.language.value,
      source: this.source,
      creatorId: this.creatorId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version
    };
  }

  private assertMutation(actorId: string, expectedVersion: number): void {
    this.assertCreator(actorId);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1)
      throw new QuestionRuntimeError(
        "invalid_expected_version",
        "Expected version must be a positive integer",
        "validation",
        { field: "expectedVersion" }
      );
    if (expectedVersion !== this.version)
      throw new QuestionRuntimeError(
        "question_version_conflict",
        "Question version does not match the expected version",
        "conflict",
        { currentVersion: this.version }
      );
  }

  private assertCreator(actorId: string): void {
    if (!actorId || !this.creatorId || actorId !== this.creatorId)
      throw new QuestionRuntimeError(
        "question_mutation_forbidden",
        "Only the Question creator may perform this operation",
        "forbidden"
      );
    validateActor(actorId);
  }

  private applyMutation(input: {
    text: QuestionText;
    status: QuestionStatus;
    expectedVersion: number;
    actorId: string;
    revisionId: string;
    correlationId: string;
    reason?: string;
    causationId?: string;
    clock?: Clock;
    changeType: QuestionChangeType;
    eventType: "question.updated" | "question.archived" | "question.restored";
  }): QuestionMutation {
    validateCorrelationId(input.correlationId);
    if (input.causationId) validateCorrelationId(input.causationId);
    const reason = new MutationReason(input.reason).value;
    const previousText = this.text.value;
    const previousStatus = this.status;
    const nextVersion = this.version + 1;
    const candidate = (input.clock ?? new SystemClock()).now();
    const changedAt =
      candidate > this.currentUpdatedAt ? candidate : new Date(this.currentUpdatedAt.getTime() + 1);
    const revision = QuestionRevision.create({
      id: input.revisionId,
      questionId: this.id,
      version: nextVersion,
      previousText,
      text: input.text.value,
      previousStatus,
      status: input.status,
      changeType: input.changeType,
      changedBy: input.actorId,
      changedAt,
      ...(reason ? { reason } : {}),
      correlationId: input.correlationId
    });
    const event = createQuestionMutationEvent(input.eventType, revision, input.causationId);
    this.currentText = input.text;
    this.currentStatus = input.status;
    this.currentUpdatedAt = changedAt;
    this.currentVersion = nextVersion;
    this.events.push(event);
    return { revision, event };
  }
}

export function createQuestionCreatedEvent(
  question: Question,
  correlationId: string,
  causationId?: string
): QuestionCreatedEvent {
  const correlation = { correlationId, ...(causationId ? { causationId } : {}) };
  return createEvent(
    "question.created",
    {
      questionId: question.id,
      status: question.status,
      language: question.language.value,
      source: question.source,
      ...(question.creatorId ? { creatorId: question.creatorId } : {})
    },
    {
      aggregateId: question.id,
      metadata: correlation,
      schemaVersion: 1,
      correlation,
      occurredAt: question.createdAt
    }
  );
}

function createQuestionMutationEvent(
  type: "question.updated" | "question.archived" | "question.restored",
  revision: QuestionRevision,
  causationId?: string
): QuestionUpdatedEvent | QuestionArchivedEvent | QuestionRestoredEvent {
  const correlation = {
    correlationId: revision.correlationId,
    ...(causationId ? { causationId } : {})
  };
  return createEvent(
    type,
    {
      questionId: revision.questionId,
      revisionId: revision.id,
      aggregateVersion: revision.version,
      changedBy: revision.changedBy
    },
    {
      aggregateId: revision.questionId,
      metadata: correlation,
      schemaVersion: 1,
      correlation,
      occurredAt: revision.changedAt
    }
  );
}

function validateIdentifier(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value))
    throw new ValidationError(`Invalid ${label}`);
}

function validateActor(value: string): void {
  validateIdentifier(value, "actor ID");
}

function validateCorrelationId(value: string): void {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value))
    throw new ValidationError("Invalid correlation ID", { field: "correlationId" });
}

function validateStatus(value: QuestionStatus): QuestionStatus {
  if (value !== "published" && value !== "archived")
    throw new ValidationError("Invalid Question status", { field: "status" });
  return value;
}

function isSource(value: string): value is QuestionSource {
  return value === "human" || value === "import" || value === "agent" || value === "system";
}

function isDisallowedControlCharacter(character: string): boolean {
  const code = character.codePointAt(0)!;
  return (code < 32 && character !== "\n") || code === 127;
}

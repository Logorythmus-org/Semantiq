import {
  type Clock,
  createEvent,
  type DomainEvent,
  SystemClock,
  ValidationError
} from "../../shared/src/index.js";
import { MutationReason, Question, QuestionRuntimeError } from "./domain.js";

export const QUESTION_UNCERTAINTY_LEVELS = ["unspecified", "low", "medium", "high"] as const;

export type QuestionUncertaintyLevel = (typeof QUESTION_UNCERTAINTY_LEVELS)[number];
export type QuestionSemanticStructureEventType = "created" | "updated";
export type QuestionSemanticRevisionId = string;

export interface QuestionUncertaintyInput {
  readonly level: QuestionUncertaintyLevel;
  readonly statements: readonly string[];
}

export interface QuestionScopeInput {
  readonly inclusions: readonly string[];
  readonly exclusions: readonly string[];
}

export interface QuestionSemanticStructureInput {
  readonly context: readonly string[];
  readonly assumptions: readonly string[];
  readonly constraints: readonly string[];
  readonly unknowns: readonly string[];
  readonly uncertainty: QuestionUncertaintyInput;
  readonly scope: QuestionScopeInput;
  readonly perspectives: readonly string[];
  readonly openPossibilities: readonly string[];
}

export type QuestionSemanticStructureContentView = QuestionSemanticStructureInput;

export interface QuestionSemanticStructureView extends QuestionSemanticStructureContentView {
  readonly questionId: string;
  readonly questionVersionAtLastUpdate: number;
  readonly createdBy: string;
  readonly updatedBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
}

export interface QuestionSemanticRevisionView {
  readonly id: QuestionSemanticRevisionId;
  readonly questionId: string;
  readonly version: number;
  readonly previousStructure: QuestionSemanticStructureContentView;
  readonly structure: QuestionSemanticStructureContentView;
  readonly changedBy: string;
  readonly changedAt: string;
  readonly reason: string | undefined;
  readonly correlationId: string;
}

export interface QuestionSemanticStructureEventPayload {
  readonly questionId: string;
  readonly semanticVersion: number;
  readonly changedBy: string;
}

export type QuestionSemanticStructureCreatedEvent =
  DomainEvent<QuestionSemanticStructureEventPayload>;
export type QuestionSemanticStructureUpdatedEvent =
  DomainEvent<QuestionSemanticStructureEventPayload>;
export type QuestionSemanticStructureEvent =
  QuestionSemanticStructureCreatedEvent | QuestionSemanticStructureUpdatedEvent;

export interface QuestionSemanticStructureMutation {
  readonly revision: QuestionSemanticRevision;
  readonly event: QuestionSemanticStructureUpdatedEvent;
}

export interface QuestionSemanticRevisionInput {
  readonly id: string;
  readonly questionId: string;
  readonly version: number;
  readonly previousStructure: QuestionSemanticStructureInput;
  readonly structure: QuestionSemanticStructureInput;
  readonly changedBy: string;
  readonly changedAt: Date;
  readonly reason?: string;
  readonly correlationId: string;
}

const MAX_ITEMS_PER_SECTION = 32;
const MAX_TOTAL_ITEMS = 128;
const MAX_STATEMENT_LENGTH = 500;

export class QuestionSemanticContent {
  readonly context: readonly string[];
  readonly assumptions: readonly string[];
  readonly constraints: readonly string[];
  readonly unknowns: readonly string[];
  readonly uncertainty: Readonly<QuestionUncertaintyInput>;
  readonly scope: Readonly<QuestionScopeInput>;
  readonly perspectives: readonly string[];
  readonly openPossibilities: readonly string[];

  private constructor(input: QuestionSemanticStructureInput) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new ValidationError("Question semantic structure must be an object", {
        field: "structure"
      });
    this.context = normalizeList(input.context, "context");
    this.assumptions = normalizeList(input.assumptions, "assumptions");
    this.constraints = normalizeList(input.constraints, "constraints");
    this.unknowns = normalizeList(input.unknowns, "unknowns");
    this.uncertainty = normalizeUncertainty(input.uncertainty);
    this.scope = normalizeScope(input.scope);
    this.perspectives = normalizeList(input.perspectives, "perspectives");
    this.openPossibilities = normalizeList(input.openPossibilities, "openPossibilities");
    const total =
      this.context.length +
      this.assumptions.length +
      this.constraints.length +
      this.unknowns.length +
      this.uncertainty.statements.length +
      this.scope.inclusions.length +
      this.scope.exclusions.length +
      this.perspectives.length +
      this.openPossibilities.length;
    if (total > MAX_TOTAL_ITEMS)
      throw new ValidationError(
        `Question semantic structure must not exceed ${MAX_TOTAL_ITEMS} statements`,
        { field: "structure" }
      );
    Object.freeze(this);
  }

  static create(input: QuestionSemanticStructureInput): QuestionSemanticContent {
    return new QuestionSemanticContent(input);
  }

  view(): QuestionSemanticStructureContentView {
    return {
      context: [...this.context],
      assumptions: [...this.assumptions],
      constraints: [...this.constraints],
      unknowns: [...this.unknowns],
      uncertainty: {
        level: this.uncertainty.level,
        statements: [...this.uncertainty.statements]
      },
      scope: {
        inclusions: [...this.scope.inclusions],
        exclusions: [...this.scope.exclusions]
      },
      perspectives: [...this.perspectives],
      openPossibilities: [...this.openPossibilities]
    };
  }

  equals(other: QuestionSemanticContent): boolean {
    return JSON.stringify(this.view()) === JSON.stringify(other.view());
  }
}

export class QuestionSemanticRevision {
  readonly id: QuestionSemanticRevisionId;
  readonly questionId: string;
  readonly version: number;
  readonly previousStructure: QuestionSemanticContent;
  readonly structure: QuestionSemanticContent;
  readonly changedBy: string;
  readonly changedAt: Date;
  readonly reason: string | undefined;
  readonly correlationId: string;

  private constructor(input: QuestionSemanticRevisionInput) {
    validateIdentifier(input.id, "semantic revision ID");
    validateIdentifier(input.questionId, "Question ID");
    validateIdentifier(input.changedBy, "actor ID");
    validateCorrelationId(input.correlationId);
    if (!Number.isInteger(input.version) || input.version < 2)
      throw new ValidationError("Semantic revision version must be greater than one", {
        field: "version"
      });
    if (Number.isNaN(input.changedAt.getTime()))
      throw new ValidationError("Invalid semantic revision timestamp", { field: "changedAt" });
    this.id = input.id;
    this.questionId = input.questionId;
    this.version = input.version;
    this.previousStructure = QuestionSemanticContent.create(input.previousStructure);
    this.structure = QuestionSemanticContent.create(input.structure);
    this.changedBy = input.changedBy;
    this.changedAt = new Date(input.changedAt);
    this.reason = new MutationReason(input.reason).value;
    this.correlationId = input.correlationId;
    Object.freeze(this);
  }

  static create(input: QuestionSemanticRevisionInput): QuestionSemanticRevision {
    return new QuestionSemanticRevision(input);
  }

  static restore(input: QuestionSemanticRevisionInput): QuestionSemanticRevision {
    return new QuestionSemanticRevision(input);
  }

  view(): QuestionSemanticRevisionView {
    return {
      id: this.id,
      questionId: this.questionId,
      version: this.version,
      previousStructure: this.previousStructure.view(),
      structure: this.structure.view(),
      changedBy: this.changedBy,
      changedAt: this.changedAt.toISOString(),
      reason: this.reason,
      correlationId: this.correlationId
    };
  }
}

export class QuestionSemanticStructure {
  readonly questionId: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  private currentContent: QuestionSemanticContent;
  private currentQuestionVersionAtLastUpdate: number;
  private currentUpdatedBy: string;
  private currentUpdatedAt: Date;
  private currentVersion: number;
  private readonly events: QuestionSemanticStructureEvent[];

  private constructor(input: {
    questionId: string;
    content: QuestionSemanticStructureInput;
    questionVersionAtLastUpdate: number;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }) {
    validateIdentifier(input.questionId, "Question ID");
    validateIdentifier(input.createdBy, "actor ID");
    validateIdentifier(input.updatedBy, "actor ID");
    if (!Number.isInteger(input.version) || input.version < 1)
      throw new ValidationError("Invalid Question semantic structure version", {
        field: "version"
      });
    if (
      !Number.isInteger(input.questionVersionAtLastUpdate) ||
      input.questionVersionAtLastUpdate < 1
    )
      throw new ValidationError("Invalid referenced Question version", {
        field: "questionVersionAtLastUpdate"
      });
    if (
      Number.isNaN(input.createdAt.getTime()) ||
      Number.isNaN(input.updatedAt.getTime()) ||
      input.updatedAt < input.createdAt
    )
      throw new ValidationError("Invalid Question semantic structure timestamps");
    this.questionId = input.questionId;
    this.currentContent = QuestionSemanticContent.create(input.content);
    this.currentQuestionVersionAtLastUpdate = input.questionVersionAtLastUpdate;
    this.createdBy = input.createdBy;
    this.currentUpdatedBy = input.updatedBy;
    this.createdAt = new Date(input.createdAt);
    this.currentUpdatedAt = new Date(input.updatedAt);
    this.currentVersion = input.version;
    this.events = [];
  }

  get content(): QuestionSemanticContent {
    return this.currentContent;
  }

  get updatedBy(): string {
    return this.currentUpdatedBy;
  }

  get questionVersionAtLastUpdate(): number {
    return this.currentQuestionVersionAtLastUpdate;
  }

  get updatedAt(): Date {
    return new Date(this.currentUpdatedAt);
  }

  get version(): number {
    return this.currentVersion;
  }

  static create(input: {
    question: Question;
    content: QuestionSemanticStructureInput;
    actorId: string;
    correlationId: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionSemanticStructure {
    assertQuestionAllowsSemanticMutation(input.question, input.actorId);
    validateCorrelationId(input.correlationId);
    if (input.causationId) validateCorrelationId(input.causationId);
    const now = (input.clock ?? new SystemClock()).now();
    const structure = new QuestionSemanticStructure({
      questionId: input.question.id,
      content: input.content,
      questionVersionAtLastUpdate: input.question.version,
      createdBy: input.actorId,
      updatedBy: input.actorId,
      createdAt: now,
      updatedAt: now,
      version: 1
    });
    structure.events.push(
      createSemanticEvent(
        "question.semantic_structure.created",
        structure,
        input.correlationId,
        input.causationId
      )
    );
    return structure;
  }

  static restore(input: {
    questionId: string;
    content: QuestionSemanticStructureInput;
    questionVersionAtLastUpdate: number;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }): QuestionSemanticStructure {
    return new QuestionSemanticStructure(input);
  }

  replace(input: {
    question: Question;
    content: QuestionSemanticStructureInput;
    expectedVersion: number;
    actorId: string;
    revisionId: string;
    correlationId: string;
    reason?: string;
    causationId?: string;
    clock?: Clock;
  }): QuestionSemanticStructureMutation {
    if (input.question.id !== this.questionId)
      throw new QuestionRuntimeError(
        "question_semantic_structure_mismatch",
        "Semantic structure does not belong to this Question",
        "conflict"
      );
    assertQuestionAllowsSemanticMutation(input.question, input.actorId);
    validateExpectedVersion(input.expectedVersion);
    if (input.expectedVersion !== this.version)
      throw new QuestionRuntimeError(
        "question_semantic_version_conflict",
        "Question semantic structure version does not match the expected version",
        "conflict",
        { currentVersion: this.version }
      );
    validateCorrelationId(input.correlationId);
    if (input.causationId) validateCorrelationId(input.causationId);
    const nextContent = QuestionSemanticContent.create(input.content);
    if (this.content.equals(nextContent))
      throw new QuestionRuntimeError(
        "question_semantic_structure_no_change",
        "Question semantic structure is unchanged after normalization",
        "domain"
      );
    const reason = new MutationReason(input.reason).value;
    const candidate = (input.clock ?? new SystemClock()).now();
    const changedAt =
      candidate > this.currentUpdatedAt ? candidate : new Date(this.currentUpdatedAt.getTime() + 1);
    const nextVersion = this.version + 1;
    const revision = QuestionSemanticRevision.create({
      id: input.revisionId,
      questionId: this.questionId,
      version: nextVersion,
      previousStructure: this.content.view(),
      structure: nextContent.view(),
      changedBy: input.actorId,
      changedAt,
      ...(reason ? { reason } : {}),
      correlationId: input.correlationId
    });
    this.currentContent = nextContent;
    this.currentQuestionVersionAtLastUpdate = input.question.version;
    this.currentUpdatedBy = input.actorId;
    this.currentUpdatedAt = changedAt;
    this.currentVersion = nextVersion;
    const event = createSemanticEvent(
      "question.semantic_structure.updated",
      this,
      input.correlationId,
      input.causationId
    );
    this.events.push(event);
    return { revision, event };
  }

  pullEvents(): readonly QuestionSemanticStructureEvent[] {
    const events = [...this.events];
    this.events.length = 0;
    return events;
  }

  view(): QuestionSemanticStructureView {
    return {
      questionId: this.questionId,
      questionVersionAtLastUpdate: this.questionVersionAtLastUpdate,
      ...this.content.view(),
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      version: this.version
    };
  }
}

export function isQuestionUncertaintyLevel(value: unknown): value is QuestionUncertaintyLevel {
  return (
    typeof value === "string" && (QUESTION_UNCERTAINTY_LEVELS as readonly string[]).includes(value)
  );
}

function createSemanticEvent(
  type: "question.semantic_structure.created" | "question.semantic_structure.updated",
  structure: QuestionSemanticStructure,
  correlationId: string,
  causationId?: string
): QuestionSemanticStructureCreatedEvent | QuestionSemanticStructureUpdatedEvent {
  const correlation = { correlationId, ...(causationId ? { causationId } : {}) };
  return createEvent(
    type,
    {
      questionId: structure.questionId,
      semanticVersion: structure.version,
      changedBy: structure.updatedBy
    },
    {
      aggregateId: structure.questionId,
      metadata: correlation,
      schemaVersion: 1,
      correlation,
      occurredAt: structure.updatedAt
    }
  );
}

function assertQuestionAllowsSemanticMutation(question: Question, actorId: string): void {
  if (!question.creatorId || actorId !== question.creatorId)
    throw new QuestionRuntimeError(
      "question_semantic_structure_forbidden",
      "Only the Question creator may change its semantic structure",
      "forbidden"
    );
  validateIdentifier(actorId, "actor ID");
  if (question.status === "archived")
    throw new QuestionRuntimeError(
      "question_archived",
      "Archived Questions must be restored before changing semantic structure",
      "conflict"
    );
}

function normalizeUncertainty(value: QuestionUncertaintyInput): Readonly<QuestionUncertaintyInput> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ValidationError("Uncertainty must be an object", { field: "uncertainty" });
  if (!isQuestionUncertaintyLevel(value.level))
    throw new ValidationError("Invalid uncertainty level", { field: "uncertainty.level" });
  const statements = normalizeList(value.statements, "uncertainty.statements");
  if (value.level !== "unspecified" && statements.length === 0)
    throw new ValidationError("A declared uncertainty level requires an explanation", {
      field: "uncertainty.statements"
    });
  return Object.freeze({ level: value.level, statements });
}

function normalizeScope(value: QuestionScopeInput): Readonly<QuestionScopeInput> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ValidationError("Scope must be an object", { field: "scope" });
  const inclusions = normalizeList(value.inclusions, "scope.inclusions");
  const exclusions = normalizeList(value.exclusions, "scope.exclusions");
  const included = new Set(inclusions);
  if (exclusions.some((statement) => included.has(statement)))
    throw new ValidationError("Scope inclusions and exclusions must not overlap", {
      field: "scope"
    });
  return Object.freeze({ inclusions, exclusions });
}

function normalizeList(value: readonly string[], field: string): readonly string[] {
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`, { field });
  if (value.length > MAX_ITEMS_PER_SECTION)
    throw new ValidationError(
      `${field} must not contain more than ${MAX_ITEMS_PER_SECTION} statements`,
      { field }
    );
  const normalized = value.map((statement, index) => {
    if (typeof statement !== "string")
      throw new ValidationError(`${field} must contain only strings`, {
        field: `${field}[${index}]`
      });
    const result = statement
      .replace(/\r\n?/g, "\n")
      .split("\n")
      .map((line) => line.replace(/[\t ]+/g, " ").trim())
      .join("\n")
      .trim();
    const length = [...result].length;
    if (length < 1 || length > MAX_STATEMENT_LENGTH)
      throw new ValidationError(
        `${field} statements must contain between 1 and ${MAX_STATEMENT_LENGTH} characters`,
        { field: `${field}[${index}]` }
      );
    if ([...result].some(isDisallowedControlCharacter))
      throw new ValidationError(`${field} contains a control character`, {
        field: `${field}[${index}]`
      });
    return result;
  });
  if (new Set(normalized).size !== normalized.length)
    throw new ValidationError(`${field} must not contain duplicate statements`, { field });
  return Object.freeze(normalized);
}

function validateExpectedVersion(value: number): void {
  if (!Number.isInteger(value) || value < 1)
    throw new QuestionRuntimeError(
      "invalid_expected_semantic_version",
      "Expected semantic version must be a positive integer",
      "validation",
      { field: "expectedVersion" }
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

function isDisallowedControlCharacter(character: string): boolean {
  const code = character.codePointAt(0)!;
  return (code < 32 && character !== "\n") || code === 127;
}

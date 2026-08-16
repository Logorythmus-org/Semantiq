import { createHash } from "node:crypto";
import {
  type Clock,
  ConflictError,
  failure,
  type IdGenerator,
  success,
  SystemClock,
  UuidGenerator,
  ValidationError
} from "../../shared/src/index.js";
import type {
  ArchiveQuestionCommand,
  CreateQuestionCommand,
  GetQuestionByIdQuery,
  GetQuestionRevisionHistoryQuery,
  QuestionApplication,
  QuestionHistoryResult,
  QuestionMutationCommand,
  QuestionResult,
  QuestionUnitOfWork,
  RestoreQuestionCommand,
  UpdateQuestionCommand
} from "./contracts.js";
import {
  LanguageTag,
  MutationReason,
  Question,
  QuestionRuntimeError,
  QuestionText,
  type QuestionMutation,
  type QuestionView
} from "./domain.js";
import type { Result } from "../../shared/src/core-primitives.js";

export class CreateQuestionHandler {
  private readonly ids: IdGenerator;
  private readonly clock: Clock;
  private readonly createUnitOfWork: () => QuestionUnitOfWork;
  constructor(dependencies: {
    ids?: IdGenerator;
    clock?: Clock;
    createUnitOfWork: () => QuestionUnitOfWork;
  }) {
    this.ids = dependencies.ids ?? new UuidGenerator();
    this.clock = dependencies.clock ?? new SystemClock();
    this.createUnitOfWork = dependencies.createUnitOfWork;
  }

  async execute(command: CreateQuestionCommand): Promise<QuestionResult> {
    let fingerprint: string;
    try {
      fingerprint = createCreateFingerprint(command);
      if (command.idempotencyKey) validateIdempotencyKey(command.idempotencyKey);
    } catch (error) {
      return mapQuestionError(error, "Question could not be stored");
    }
    const unit = this.createUnitOfWork();
    try {
      await unit.begin();
      if (command.idempotencyKey) {
        const prior = await unit.getIdempotency("question.create", command.idempotencyKey);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new QuestionRuntimeError(
              "idempotency_conflict",
              "Idempotency key was reused with different Question data",
              "conflict"
            );
          await unit.rollback();
          return success(prior.response);
        }
      }
      const question = Question.create({
        ...command,
        id: this.ids.generate(),
        clock: this.clock,
        correlationId: command.correlationId
      });
      await unit.questions.add(question);
      const event = question.pullEvents()[0];
      if (!event) throw new Error("Question creation event was not raised");
      await unit.appendOutbox(event);
      const response = question.view();
      if (command.idempotencyKey)
        await unit.putIdempotency({
          scope: "question.create",
          key: command.idempotencyKey,
          fingerprint,
          response
        });
      await unit.commit();
      return success(response);
    } catch (error) {
      await unit.rollback();
      return mapQuestionError(error, "Question could not be stored");
    }
  }
}

export class GetQuestionByIdHandler {
  private readonly createUnitOfWork: () => QuestionUnitOfWork;
  constructor(createUnitOfWork: () => QuestionUnitOfWork) {
    this.createUnitOfWork = createUnitOfWork;
  }

  async execute(query: GetQuestionByIdQuery): Promise<QuestionResult> {
    if (!isValidId(query.questionId)) return invalidQuestionId<QuestionView>();
    const unit = this.createUnitOfWork();
    try {
      await unit.begin();
      const question = await unit.questions.getById(query.questionId);
      await unit.commit();
      return question
        ? success(question.view())
        : failure({
            code: "question_not_found",
            message: "Question not found",
            category: "not_found"
          });
    } catch {
      await unit.rollback();
      return infrastructureFailure("Question could not be read");
    }
  }
}

type MutationOperation = "update" | "archive" | "restore";

class QuestionMutationHandler {
  private readonly operation: MutationOperation;
  private readonly ids: IdGenerator;
  private readonly clock: Clock;
  private readonly createUnitOfWork: () => QuestionUnitOfWork;
  constructor(
    operation: MutationOperation,
    dependencies: {
      ids?: IdGenerator;
      clock?: Clock;
      createUnitOfWork: () => QuestionUnitOfWork;
    }
  ) {
    this.operation = operation;
    this.ids = dependencies.ids ?? new UuidGenerator();
    this.clock = dependencies.clock ?? new SystemClock();
    this.createUnitOfWork = dependencies.createUnitOfWork;
  }

  async execute(command: QuestionMutationCommand | UpdateQuestionCommand): Promise<QuestionResult> {
    let fingerprint: string;
    try {
      validateMutationCommand(command);
      fingerprint = createMutationFingerprint(this.operation, command);
    } catch (error) {
      return mapQuestionError(error, "Question mutation could not be stored");
    }
    const unit = this.createUnitOfWork();
    const scope = `question.${this.operation}`;
    try {
      await unit.begin();
      if (command.idempotencyKey) {
        const prior = await unit.getIdempotency(scope, command.idempotencyKey);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new QuestionRuntimeError(
              "idempotency_conflict",
              "Idempotency key was reused with a different mutation",
              "conflict"
            );
          await unit.rollback();
          return success(prior.response);
        }
      }
      const question = await unit.questions.getById(command.questionId);
      if (!question)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      const mutation = this.apply(question, command);
      const saved = await unit.questions.saveWithExpectedVersion(question, command.expectedVersion);
      if (!saved)
        throw new QuestionRuntimeError(
          "question_version_conflict",
          "Question was changed by another transaction",
          "conflict"
        );
      await unit.revisions.add(mutation.revision);
      await unit.appendOutbox(mutation.event);
      const response = question.view();
      if (command.idempotencyKey)
        await unit.putIdempotency({
          scope,
          key: command.idempotencyKey,
          fingerprint,
          response
        });
      await unit.commit();
      return success(response);
    } catch (error) {
      await unit.rollback();
      return mapQuestionError(error, "Question mutation could not be stored");
    }
  }

  private apply(
    question: Question,
    command: QuestionMutationCommand | UpdateQuestionCommand
  ): QuestionMutation {
    const common = {
      expectedVersion: command.expectedVersion,
      actorId: command.actorId,
      revisionId: this.ids.generate(),
      correlationId: command.correlationId,
      ...(command.reason === undefined ? {} : { reason: command.reason }),
      ...(command.causationId === undefined ? {} : { causationId: command.causationId }),
      clock: this.clock
    };
    if (this.operation === "update")
      return question.updateText({
        ...common,
        text: (command as UpdateQuestionCommand).text
      });
    if (this.operation === "archive") return question.archive(common);
    return question.restoreQuestion(common);
  }
}

export class UpdateQuestionHandler {
  private readonly handler: QuestionMutationHandler;
  constructor(dependencies: ConstructorParameters<typeof QuestionMutationHandler>[1]) {
    this.handler = new QuestionMutationHandler("update", dependencies);
  }
  execute(command: UpdateQuestionCommand): Promise<QuestionResult> {
    return this.handler.execute(command);
  }
}

export class ArchiveQuestionHandler {
  private readonly handler: QuestionMutationHandler;
  constructor(dependencies: ConstructorParameters<typeof QuestionMutationHandler>[1]) {
    this.handler = new QuestionMutationHandler("archive", dependencies);
  }
  execute(command: ArchiveQuestionCommand): Promise<QuestionResult> {
    return this.handler.execute(command);
  }
}

export class RestoreQuestionHandler {
  private readonly handler: QuestionMutationHandler;
  constructor(dependencies: ConstructorParameters<typeof QuestionMutationHandler>[1]) {
    this.handler = new QuestionMutationHandler("restore", dependencies);
  }
  execute(command: RestoreQuestionCommand): Promise<QuestionResult> {
    return this.handler.execute(command);
  }
}

export class GetQuestionRevisionHistoryHandler {
  private readonly createUnitOfWork: () => QuestionUnitOfWork;
  constructor(createUnitOfWork: () => QuestionUnitOfWork) {
    this.createUnitOfWork = createUnitOfWork;
  }

  async execute(query: GetQuestionRevisionHistoryQuery): Promise<QuestionHistoryResult> {
    if (!isValidId(query.questionId))
      return invalidQuestionId<import("./contracts.js").QuestionRevisionHistoryView>();
    const unit = this.createUnitOfWork();
    try {
      await unit.begin();
      const question = await unit.questions.getById(query.questionId);
      if (!question)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      question.assertActorCanViewHistory(query.actorId);
      const revisions = await unit.revisions.listByQuestion(query.questionId);
      await unit.commit();
      return success({
        questionId: question.id,
        currentVersion: question.version,
        revisions: revisions.map((revision) => revision.view())
      });
    } catch (error) {
      await unit.rollback();
      return mapQuestionError(error, "Question revisions could not be read");
    }
  }
}

export function createQuestionApplication(dependencies: {
  createUnitOfWork: () => QuestionUnitOfWork;
  ids?: IdGenerator;
  clock?: Clock;
}): QuestionApplication {
  const create = new CreateQuestionHandler(dependencies);
  const get = new GetQuestionByIdHandler(dependencies.createUnitOfWork);
  const update = new UpdateQuestionHandler(dependencies);
  const archive = new ArchiveQuestionHandler(dependencies);
  const restore = new RestoreQuestionHandler(dependencies);
  const revisions = new GetQuestionRevisionHistoryHandler(dependencies.createUnitOfWork);
  return {
    create: (command) => create.execute(command),
    get: (query) => get.execute(query),
    update: (command) => update.execute(command),
    archive: (command) => archive.execute(command),
    restore: (command) => restore.execute(command),
    revisions: (query) => revisions.execute(query)
  };
}

function validateMutationCommand(command: QuestionMutationCommand): void {
  if (!isValidId(command.questionId))
    throw new QuestionRuntimeError("invalid_question_id", "Invalid Question ID", "validation");
  if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 1)
    throw new QuestionRuntimeError(
      "invalid_expected_version",
      "Expected version must be a positive integer",
      "validation",
      { field: "expectedVersion" }
    );
  if (command.reason !== undefined) new MutationReason(command.reason);
  if (command.idempotencyKey) validateIdempotencyKey(command.idempotencyKey);
}

function validateIdempotencyKey(key: string): void {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key))
    throw new ValidationError("Invalid idempotency key", { field: "idempotencyKey" });
}

function createCreateFingerprint(command: CreateQuestionCommand): string {
  return hash({
    text: new QuestionText(command.text).value,
    language: new LanguageTag(command.language).value,
    source: command.source ?? "human",
    creatorId: command.creatorId ?? null
  });
}

function createMutationFingerprint(
  operation: MutationOperation,
  command: QuestionMutationCommand | UpdateQuestionCommand
): string {
  return hash({
    operation,
    questionId: command.questionId,
    expectedVersion: command.expectedVersion,
    actorId: command.actorId,
    reason: new MutationReason(command.reason).value ?? null,
    ...(operation === "update"
      ? { text: new QuestionText((command as UpdateQuestionCommand).text).value }
      : {})
  });
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function mapQuestionError<T = QuestionView>(
  error: unknown,
  infrastructureMessage: string
): Result<T> {
  if (error instanceof QuestionRuntimeError)
    return failure({
      code: error.code,
      message: error.message,
      category: error.category,
      ...(error.details === undefined ? {} : { details: error.details })
    });
  if (error instanceof ValidationError)
    return failure({
      code: "validation_error",
      message: error.message,
      category: "validation",
      ...(error.details === undefined ? {} : { details: error.details })
    });
  if (error instanceof ConflictError)
    return failure({ code: "conflict", message: error.message, category: "conflict" });
  return infrastructureFailure(infrastructureMessage);
}

function infrastructureFailure<T = QuestionView>(message: string): Result<T> {
  return failure({
    code: "persistence_error",
    message,
    category: "infrastructure",
    retryable: true
  });
}

function invalidQuestionId<T>(): Result<T> {
  return failure({
    code: "invalid_question_id",
    message: "Invalid Question ID",
    category: "validation"
  });
}

function isValidId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}

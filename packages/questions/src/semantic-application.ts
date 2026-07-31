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
import type { Result } from "../../shared/src/core-primitives.js";
import { MutationReason, QuestionRuntimeError } from "./domain.js";
import type {
  GetQuestionSemanticRevisionHistoryQuery,
  GetQuestionSemanticStructureQuery,
  PutQuestionSemanticStructureCommand,
  QuestionSemanticApplication,
  QuestionSemanticHistoryResult,
  QuestionSemanticResult,
  QuestionSemanticSnapshotResult,
  QuestionSemanticSnapshotView,
  QuestionSemanticUnitOfWork
} from "./semantic-contracts.js";
import {
  QuestionSemanticContent,
  QuestionSemanticStructure,
  type QuestionSemanticStructureView
} from "./semantic-domain.js";

const IDEMPOTENCY_SCOPE = "question.semantic_structure.put";

export class PutQuestionSemanticStructureHandler {
  private readonly ids: IdGenerator;
  private readonly clock: Clock;
  private readonly createUnitOfWork: () => QuestionSemanticUnitOfWork;

  constructor(dependencies: {
    ids?: IdGenerator;
    clock?: Clock;
    createUnitOfWork: () => QuestionSemanticUnitOfWork;
  }) {
    this.ids = dependencies.ids ?? new UuidGenerator();
    this.clock = dependencies.clock ?? new SystemClock();
    this.createUnitOfWork = dependencies.createUnitOfWork;
  }

  async execute(command: PutQuestionSemanticStructureCommand): Promise<QuestionSemanticResult> {
    let fingerprint: string;
    try {
      validatePutCommand(command);
      fingerprint = createFingerprint(command);
    } catch (error) {
      return mapSemanticError(error, "Question semantic structure could not be stored");
    }

    const unit = this.createUnitOfWork();
    try {
      await unit.begin("write");
      if (command.idempotencyKey) {
        const prior = await unit.getIdempotency(IDEMPOTENCY_SCOPE, command.idempotencyKey);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new QuestionRuntimeError(
              "idempotency_conflict",
              "Idempotency key was reused with different semantic structure data",
              "conflict"
            );
          await unit.rollback();
          return success(prior.response);
        }
      }

      const question = await unit.questions.getByIdForSemanticMutation(command.questionId);
      if (!question)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      let structure = await unit.structures.getByQuestionIdForUpdate(command.questionId);

      if (structure && command.expectedVersion === 0)
        throw new QuestionRuntimeError(
          "question_semantic_version_conflict",
          "Question semantic structure already exists",
          "conflict",
          { currentVersion: structure.version }
        );

      if (!structure && command.expectedVersion !== 0)
        throw new QuestionRuntimeError(
          "question_semantic_structure_not_found",
          "Question semantic structure not found",
          "not_found"
        );

      if (!structure) {
        structure = QuestionSemanticStructure.create({
          question,
          content: command.structure,
          actorId: command.actorId,
          correlationId: command.correlationId,
          ...(command.causationId ? { causationId: command.causationId } : {}),
          clock: this.clock
        });
        await unit.structures.add(structure);
      } else {
        const mutation = structure.replace({
          question,
          content: command.structure,
          expectedVersion: command.expectedVersion,
          actorId: command.actorId,
          revisionId: this.ids.generate(),
          correlationId: command.correlationId,
          ...(command.reason === undefined ? {} : { reason: command.reason }),
          ...(command.causationId ? { causationId: command.causationId } : {}),
          clock: this.clock
        });
        const saved = await unit.structures.saveWithExpectedVersion(
          structure,
          command.expectedVersion
        );
        if (!saved)
          throw new QuestionRuntimeError(
            "question_semantic_version_conflict",
            "Question semantic structure was changed by another transaction",
            "conflict"
          );
        await unit.revisions.add(mutation.revision);
      }

      const event = structure.pullEvents()[0];
      if (!event) throw new Error("Question semantic structure event was not raised");
      await unit.appendOutbox(event);
      const response = structure.view();
      if (command.idempotencyKey)
        await unit.putIdempotency({
          scope: IDEMPOTENCY_SCOPE,
          key: command.idempotencyKey,
          fingerprint,
          response
        });
      await unit.commit();
      return success(response);
    } catch (error) {
      await unit.rollback();
      return mapSemanticError(error, "Question semantic structure could not be stored");
    }
  }
}

export class GetQuestionSemanticStructureHandler {
  private readonly createUnitOfWork: () => QuestionSemanticUnitOfWork;

  constructor(createUnitOfWork: () => QuestionSemanticUnitOfWork) {
    this.createUnitOfWork = createUnitOfWork;
  }

  async execute(query: GetQuestionSemanticStructureQuery): Promise<QuestionSemanticResult> {
    if (!isValidId(query.questionId)) return invalidQuestionId<QuestionSemanticStructureView>();
    const unit = this.createUnitOfWork();
    try {
      await unit.begin("read");
      const question = await unit.questions.getById(query.questionId);
      if (!question)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      const structure = await unit.structures.getByQuestionId(query.questionId);
      if (!structure)
        throw new QuestionRuntimeError(
          "question_semantic_structure_not_found",
          "Question semantic structure not found",
          "not_found"
        );
      await unit.commit();
      return success(structure.view());
    } catch (error) {
      await unit.rollback();
      return mapSemanticError(error, "Question semantic structure could not be read");
    }
  }
}

export class GetQuestionSemanticRevisionHistoryHandler {
  private readonly createUnitOfWork: () => QuestionSemanticUnitOfWork;

  constructor(createUnitOfWork: () => QuestionSemanticUnitOfWork) {
    this.createUnitOfWork = createUnitOfWork;
  }

  async execute(
    query: GetQuestionSemanticRevisionHistoryQuery
  ): Promise<QuestionSemanticHistoryResult> {
    if (!isValidId(query.questionId))
      return invalidQuestionId<
        import("./semantic-contracts.js").QuestionSemanticRevisionHistoryView
      >();
    const unit = this.createUnitOfWork();
    try {
      await unit.begin("read");
      const question = await unit.questions.getById(query.questionId);
      if (!question)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      question.assertActorCanViewHistory(query.actorId);
      const structure = await unit.structures.getByQuestionId(query.questionId);
      if (!structure)
        throw new QuestionRuntimeError(
          "question_semantic_structure_not_found",
          "Question semantic structure not found",
          "not_found"
        );
      const revisions = await unit.revisions.listByQuestion(query.questionId);
      await unit.commit();
      return success({
        questionId: query.questionId,
        currentVersion: structure.version,
        revisions: revisions.map((revision) => revision.view())
      });
    } catch (error) {
      await unit.rollback();
      return mapSemanticError(error, "Question semantic revisions could not be read");
    }
  }
}

export class GetQuestionSemanticSnapshotHandler {
  private readonly createUnitOfWork: () => QuestionSemanticUnitOfWork;

  constructor(createUnitOfWork: () => QuestionSemanticUnitOfWork) {
    this.createUnitOfWork = createUnitOfWork;
  }

  async execute(query: GetQuestionSemanticStructureQuery): Promise<QuestionSemanticSnapshotResult> {
    if (!isValidId(query.questionId)) return invalidQuestionId<QuestionSemanticSnapshotView>();
    const unit = this.createUnitOfWork();
    try {
      await unit.begin("read");
      const question = await unit.questions.getById(query.questionId);
      if (!question)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      const structure = await unit.structures.getByQuestionId(query.questionId);
      if (!structure)
        throw new QuestionRuntimeError(
          "question_semantic_structure_not_found",
          "Question semantic structure not found",
          "not_found"
        );
      const content = structure.content.view();
      const components = (section: string, values: readonly string[]) =>
        values.map((text) => ({ id: componentId(query.questionId, section, text), text }));
      const snapshot: QuestionSemanticSnapshotView = {
        schemaVersion: "1.0",
        generatedAt: structure.updatedAt.toISOString(),
        question: {
          id: question.id,
          text: question.text.value,
          status: question.status,
          version: question.version
        },
        frame: {
          id: `frame:${question.id}`,
          version: structure.version,
          questionVersionAtLastUpdate: structure.questionVersionAtLastUpdate,
          freshness: structure.questionVersionAtLastUpdate === question.version ? "fresh" : "stale",
          context: components("context", content.context),
          assumptions: components("assumptions", content.assumptions),
          constraints: components("constraints", content.constraints),
          unknowns: components("unknowns", content.unknowns),
          uncertainty: {
            level: content.uncertainty.level,
            statements: components("uncertainty", content.uncertainty.statements)
          },
          scope: {
            inclusions: components("scope.inclusions", content.scope.inclusions),
            exclusions: components("scope.exclusions", content.scope.exclusions)
          },
          perspectives: components("perspectives", content.perspectives)
        }
      };
      await unit.commit();
      return success(snapshot);
    } catch (error) {
      await unit.rollback();
      return mapSemanticError(error, "Question semantic snapshot could not be read");
    }
  }
}

export function createQuestionSemanticApplication(dependencies: {
  createUnitOfWork: () => QuestionSemanticUnitOfWork;
  ids?: IdGenerator;
  clock?: Clock;
}): QuestionSemanticApplication {
  const put = new PutQuestionSemanticStructureHandler(dependencies);
  const get = new GetQuestionSemanticStructureHandler(dependencies.createUnitOfWork);
  const revisions = new GetQuestionSemanticRevisionHistoryHandler(dependencies.createUnitOfWork);
  const snapshot = new GetQuestionSemanticSnapshotHandler(dependencies.createUnitOfWork);
  return {
    put: (command) => put.execute(command),
    get: (query) => get.execute(query),
    snapshot: (query) => snapshot.execute(query),
    revisions: (query) => revisions.execute(query)
  };
}

function componentId(questionId: string, section: string, text: string): string {
  return `component:${createHash("sha256")
    .update(`${questionId}\u0000${section}\u0000${text}`)
    .digest("hex")
    .slice(0, 24)}`;
}

function validatePutCommand(command: PutQuestionSemanticStructureCommand): void {
  if (!isValidId(command.questionId))
    throw new QuestionRuntimeError("invalid_question_id", "Invalid Question ID", "validation");
  if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 0)
    throw new QuestionRuntimeError(
      "invalid_expected_semantic_version",
      "Expected semantic version must be a non-negative integer",
      "validation",
      { field: "expectedVersion" }
    );
  if (command.reason !== undefined) new MutationReason(command.reason);
  if (command.idempotencyKey) validateIdempotencyKey(command.idempotencyKey);
  QuestionSemanticContent.create(command.structure);
}

function createFingerprint(command: PutQuestionSemanticStructureCommand): string {
  return hash({
    questionId: command.questionId,
    expectedVersion: command.expectedVersion,
    actorId: command.actorId,
    structure: QuestionSemanticContent.create(command.structure).view(),
    reason: new MutationReason(command.reason).value ?? null
  });
}

function validateIdempotencyKey(key: string): void {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key))
    throw new ValidationError("Invalid idempotency key", { field: "idempotencyKey" });
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function mapSemanticError<T = QuestionSemanticStructureView>(
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
  return failure({
    code: "persistence_error",
    message: infrastructureMessage,
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

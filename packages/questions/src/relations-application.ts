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
import { QuestionRuntimeError, type QuestionView } from "./domain.js";
import type {
  CreateQuestionRelationCommand,
  GetQuestionGraphQuery,
  ListQuestionRelationsQuery,
  RemoveQuestionRelationCommand,
  QuestionGraphResult,
  QuestionRelationApplication,
  QuestionRelationListResult,
  QuestionRelationResult,
  QuestionRelationUnitOfWork
} from "./relations-contracts.js";
import {
  isQuestionRelationType,
  QuestionRelation,
  type QuestionRelationDirection,
  questionRelationNeighbor,
  type QuestionRelationType,
  type QuestionRelationView
} from "./relations-domain.js";

export const QUESTION_RELATION_PAGE_LIMIT = 25;
export const QUESTION_RELATION_MAX_PAGE_LIMIT = 100;
export const QUESTION_GRAPH_DEFAULT_DEPTH = 1;
export const QUESTION_GRAPH_MAX_DEPTH = 3;
export const QUESTION_GRAPH_DEFAULT_MAX_NODES = 50;
export const QUESTION_GRAPH_MAX_NODES = 100;
export const QUESTION_GRAPH_MAX_EDGES = 500;

export class CreateQuestionRelationHandler {
  private readonly ids: IdGenerator;
  private readonly clock: Clock;
  private readonly createUnitOfWork: () => QuestionRelationUnitOfWork;

  constructor(dependencies: {
    ids?: IdGenerator;
    clock?: Clock;
    createUnitOfWork: () => QuestionRelationUnitOfWork;
  }) {
    this.ids = dependencies.ids ?? new UuidGenerator();
    this.clock = dependencies.clock ?? new SystemClock();
    this.createUnitOfWork = dependencies.createUnitOfWork;
  }

  async execute(command: CreateQuestionRelationCommand): Promise<QuestionRelationResult> {
    let fingerprint: string;
    try {
      validateCreateCommand(command);
      fingerprint = createRelationFingerprint(command);
    } catch (error) {
      return mapRelationError(error, "Question relation could not be stored");
    }

    const unit = this.createUnitOfWork();
    try {
      await unit.begin("write");
      if (command.idempotencyKey) {
        const prior = await unit.getIdempotency("question.relation.create", command.idempotencyKey);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new QuestionRuntimeError(
              "idempotency_conflict",
              "Idempotency key was reused with different Question relation data",
              "conflict"
            );
          await unit.rollback();
          return success(prior.response);
        }
      }

      const endpoints = await unit.questions.getByIdsForRelationCreation(
        [command.sourceQuestionId, command.targetQuestionId].sort()
      );
      const endpointById = new Map(endpoints.map((question) => [question.id, question]));
      const source = endpointById.get(command.sourceQuestionId);
      if (!source)
        throw new QuestionRuntimeError(
          "source_question_not_found",
          "Source Question not found",
          "not_found"
        );
      const target = endpointById.get(command.targetQuestionId);
      if (!target)
        throw new QuestionRuntimeError(
          "target_question_not_found",
          "Target Question not found",
          "not_found"
        );

      const equivalent = await unit.relations.findEquivalent(
        command.type,
        command.sourceQuestionId,
        command.targetQuestionId
      );
      if (equivalent)
        throw new QuestionRuntimeError(
          "question_relation_exists",
          "An equivalent Question relation already exists",
          "conflict",
          { relationId: equivalent.id }
        );

      const relation = QuestionRelation.create({
        id: this.ids.generate(),
        source,
        target,
        type: command.type,
        actorId: command.actorId,
        correlationId: command.correlationId,
        ...(command.causationId ? { causationId: command.causationId } : {}),
        clock: this.clock
      });
      await unit.relations.add(relation);
      const event = relation.pullEvents()[0];
      if (!event) throw new Error("Question relation creation event was not raised");
      await unit.appendOutbox(event);
      const response = relation.view();
      if (command.idempotencyKey)
        await unit.putIdempotency({
          scope: "question.relation.create",
          key: command.idempotencyKey,
          fingerprint,
          response
        });
      await unit.commit();
      return success(response);
    } catch (error) {
      await unit.rollback();
      return mapRelationError(error, "Question relation could not be stored");
    }
  }
}

export class ListQuestionRelationsHandler {
  private readonly createUnitOfWork: () => QuestionRelationUnitOfWork;

  constructor(createUnitOfWork: () => QuestionRelationUnitOfWork) {
    this.createUnitOfWork = createUnitOfWork;
  }

  async execute(query: ListQuestionRelationsQuery): Promise<QuestionRelationListResult> {
    let options: ReturnType<typeof normalizeListQuery>;
    try {
      options = normalizeListQuery(query);
    } catch (error) {
      return mapRelationError(error, "Question relations could not be read");
    }
    const unit = this.createUnitOfWork();
    try {
      await unit.begin("read");
      const question = await unit.questions.getById(query.questionId);
      if (!question)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      const values = await unit.relations.list({
        questionIds: [query.questionId],
        direction: options.direction,
        ...(options.relationTypes.length > 0 ? { relationTypes: options.relationTypes } : {}),
        limit: options.limit + 1,
        offset: (options.page - 1) * options.limit
      });
      await unit.commit();
      return success({
        questionId: query.questionId,
        direction: options.direction,
        relationTypes: options.relationTypes,
        items: values.slice(0, options.limit).map((relation) => relation.view()),
        page: options.page,
        limit: options.limit,
        hasNext: values.length > options.limit,
        hasPrevious: options.page > 1
      });
    } catch (error) {
      await unit.rollback();
      return mapRelationError(error, "Question relations could not be read");
    }
  }
}

export class RemoveQuestionRelationHandler {
  private readonly clock: Clock;
  private readonly createUnitOfWork: () => QuestionRelationUnitOfWork;

  constructor(dependencies: { clock?: Clock; createUnitOfWork: () => QuestionRelationUnitOfWork }) {
    this.clock = dependencies.clock ?? new SystemClock();
    this.createUnitOfWork = dependencies.createUnitOfWork;
  }

  async execute(command: RemoveQuestionRelationCommand): Promise<QuestionRelationResult> {
    let fingerprint: string;
    try {
      validateIdentifier(command.relationId, "relation ID");
      validateIdentifier(command.actorId, "actor ID");
      validateCorrelationId(command.correlationId);
      if (!Number.isInteger(command.expectedVersion) || command.expectedVersion < 1)
        throw new ValidationError("Expected relation version must be a positive integer", {
          field: "expectedVersion"
        });
      if (command.idempotencyKey) validateIdempotencyKey(command.idempotencyKey);
      fingerprint = createHash("sha256")
        .update(
          JSON.stringify({
            relationId: command.relationId,
            expectedVersion: command.expectedVersion,
            actorId: command.actorId
          })
        )
        .digest("hex");
    } catch (error) {
      return mapRelationError(error, "Question relation could not be removed");
    }
    const unit = this.createUnitOfWork();
    try {
      await unit.begin("write");
      if (command.idempotencyKey) {
        const prior = await unit.getIdempotency("question.relation.remove", command.idempotencyKey);
        if (prior) {
          if (prior.fingerprint !== fingerprint)
            throw new QuestionRuntimeError(
              "idempotency_conflict",
              "Idempotency key was reused with different relation removal data",
              "conflict"
            );
          await unit.rollback();
          return success(prior.response);
        }
      }
      const relation = await unit.relations.getById(command.relationId);
      if (!relation)
        throw new QuestionRuntimeError(
          "question_relation_not_found",
          "Question relation not found",
          "not_found"
        );
      relation.remove({
        actorId: command.actorId,
        expectedVersion: command.expectedVersion,
        correlationId: command.correlationId,
        ...(command.causationId ? { causationId: command.causationId } : {}),
        clock: this.clock
      });
      const saved = await unit.relations.saveWithExpectedVersion(relation, command.expectedVersion);
      if (!saved)
        throw new QuestionRuntimeError(
          "question_relation_version_conflict",
          "Question relation changed concurrently",
          "conflict"
        );
      const event = relation.pullEvents()[0];
      if (!event) throw new Error("Question relation removal event was not raised");
      await unit.appendOutbox(event);
      const response = relation.view();
      if (command.idempotencyKey)
        await unit.putIdempotency({
          scope: "question.relation.remove",
          key: command.idempotencyKey,
          fingerprint,
          response
        });
      await unit.commit();
      return success(response);
    } catch (error) {
      await unit.rollback();
      return mapRelationError(error, "Question relation could not be removed");
    }
  }
}

export class GetQuestionGraphHandler {
  private readonly createUnitOfWork: () => QuestionRelationUnitOfWork;

  constructor(createUnitOfWork: () => QuestionRelationUnitOfWork) {
    this.createUnitOfWork = createUnitOfWork;
  }

  async execute(query: GetQuestionGraphQuery): Promise<QuestionGraphResult> {
    let options: ReturnType<typeof normalizeGraphQuery>;
    try {
      options = normalizeGraphQuery(query);
    } catch (error) {
      return mapRelationError(error, "Question graph could not be read");
    }
    const unit = this.createUnitOfWork();
    try {
      await unit.begin("read");
      const root = await unit.questions.getById(query.questionId);
      if (!root)
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");

      const nodes = new Map<string, QuestionView>([[root.id, root.view()]]);
      const relations = new Map<string, QuestionRelation>();
      let frontier = new Set<string>([root.id]);
      let truncated = false;

      for (let level = 0; level < options.depth && frontier.size > 0; level += 1) {
        const remainingEdges = QUESTION_GRAPH_MAX_EDGES - relations.size;
        if (remainingEdges <= 0) {
          truncated = true;
          break;
        }
        const fetched = await unit.relations.list({
          questionIds: [...frontier],
          direction: options.direction,
          ...(options.relationTypes.length > 0 ? { relationTypes: options.relationTypes } : {}),
          limit: remainingEdges + 1
        });
        if (fetched.length > remainingEdges) truncated = true;
        const candidates = fetched.slice(0, remainingEdges);
        const candidateNeighbors = new Set<string>();
        const traversed: QuestionRelation[] = [];

        for (const relation of candidates) {
          let touchesFrontier = false;
          for (const questionId of frontier) {
            const neighbor = questionRelationNeighbor(relation, questionId, options.direction);
            if (!neighbor) continue;
            touchesFrontier = true;
            if (!nodes.has(neighbor)) candidateNeighbors.add(neighbor);
          }
          if (touchesFrontier) traversed.push(relation);
        }

        const availableNodeSlots = options.maxNodes - nodes.size;
        const orderedNeighborIds = [...candidateNeighbors].sort();
        if (orderedNeighborIds.length > availableNodeSlots) truncated = true;
        const acceptedNeighborIds = orderedNeighborIds.slice(0, availableNodeSlots);
        const discovered = await unit.questions.getByIds(acceptedNeighborIds);
        if (discovered.length !== acceptedNeighborIds.length)
          throw new Error("Question graph relation references a missing Question");
        const discoveredById = new Map(discovered.map((question) => [question.id, question]));
        for (const questionId of acceptedNeighborIds) {
          const question = discoveredById.get(questionId);
          if (!question) throw new Error("Question graph read was inconsistent");
          nodes.set(questionId, question.view());
        }
        for (const relation of traversed) {
          if (nodes.has(relation.sourceQuestionId) && nodes.has(relation.targetQuestionId))
            relations.set(relation.id, relation);
        }
        frontier = new Set(acceptedNeighborIds);
      }

      await unit.commit();
      return success({
        rootQuestionId: root.id,
        depth: options.depth,
        direction: options.direction,
        relationTypes: options.relationTypes,
        nodes: [...nodes.values()],
        relations: [...relations.values()].map((relation) => relation.view()),
        truncated,
        limits: { maxNodes: options.maxNodes, maxEdges: QUESTION_GRAPH_MAX_EDGES }
      });
    } catch (error) {
      await unit.rollback();
      return mapRelationError(error, "Question graph could not be read");
    }
  }
}

export function createQuestionRelationApplication(dependencies: {
  createUnitOfWork: () => QuestionRelationUnitOfWork;
  ids?: IdGenerator;
  clock?: Clock;
}): QuestionRelationApplication {
  const create = new CreateQuestionRelationHandler(dependencies);
  const remove = new RemoveQuestionRelationHandler(dependencies);
  const list = new ListQuestionRelationsHandler(dependencies.createUnitOfWork);
  const graph = new GetQuestionGraphHandler(dependencies.createUnitOfWork);
  return {
    create: (command) => create.execute(command),
    remove: (command) => remove.execute(command),
    list: (query) => list.execute(query),
    graph: (query) => graph.execute(query)
  };
}

function validateCreateCommand(command: CreateQuestionRelationCommand): void {
  validateIdentifier(command.sourceQuestionId, "source Question ID");
  validateIdentifier(command.targetQuestionId, "target Question ID");
  validateCorrelationId(command.correlationId);
  if (command.causationId) validateCorrelationId(command.causationId);
  if (!isQuestionRelationType(command.type))
    throw new QuestionRuntimeError(
      "invalid_question_relation_type",
      "Invalid Question relation type",
      "validation"
    );
  if (command.sourceQuestionId === command.targetQuestionId)
    throw new QuestionRuntimeError(
      "question_relation_self_reference",
      "A Question cannot be related to itself",
      "validation"
    );
  if (command.idempotencyKey) validateIdempotencyKey(command.idempotencyKey);
}

function normalizeListQuery(query: ListQuestionRelationsQuery): {
  direction: QuestionRelationDirection;
  relationTypes: readonly QuestionRelationType[];
  page: number;
  limit: number;
} {
  validateIdentifier(query.questionId, "Question ID");
  validateCorrelationId(query.correlationId);
  const direction = normalizeDirection(query.direction);
  const relationTypes = normalizeRelationTypes(query.relationTypes);
  const page = query.page ?? 1;
  const limit = query.limit ?? QUESTION_RELATION_PAGE_LIMIT;
  if (!Number.isInteger(page) || page < 1)
    throw new ValidationError("Page must be a positive integer", { field: "page" });
  if (!Number.isInteger(limit) || limit < 1 || limit > QUESTION_RELATION_MAX_PAGE_LIMIT)
    throw new ValidationError("Limit must be between 1 and 100", { field: "limit" });
  return { direction, relationTypes, page, limit };
}

function normalizeGraphQuery(query: GetQuestionGraphQuery): {
  direction: QuestionRelationDirection;
  relationTypes: readonly QuestionRelationType[];
  depth: number;
  maxNodes: number;
} {
  validateIdentifier(query.questionId, "Question ID");
  validateCorrelationId(query.correlationId);
  const direction = normalizeDirection(query.direction);
  const relationTypes = normalizeRelationTypes(query.relationTypes);
  const depth = query.depth ?? QUESTION_GRAPH_DEFAULT_DEPTH;
  const maxNodes = query.maxNodes ?? QUESTION_GRAPH_DEFAULT_MAX_NODES;
  if (!Number.isInteger(depth) || depth < 1 || depth > QUESTION_GRAPH_MAX_DEPTH)
    throw new ValidationError("Graph depth must be between 1 and 3", { field: "depth" });
  if (!Number.isInteger(maxNodes) || maxNodes < 1 || maxNodes > QUESTION_GRAPH_MAX_NODES)
    throw new ValidationError("Graph maxNodes must be between 1 and 100", {
      field: "maxNodes"
    });
  return { direction, relationTypes, depth, maxNodes };
}

function normalizeDirection(
  value: QuestionRelationDirection | undefined
): QuestionRelationDirection {
  const direction = value ?? "both";
  if (direction !== "outgoing" && direction !== "incoming" && direction !== "both")
    throw new ValidationError("Invalid Question relation direction", { field: "direction" });
  return direction;
}

function normalizeRelationTypes(
  values: readonly QuestionRelationType[] | undefined
): readonly QuestionRelationType[] {
  if (!values) return [];
  for (const value of values)
    if (!isQuestionRelationType(value))
      throw new ValidationError("Invalid Question relation type", { field: "type" });
  return [...new Set(values)].sort();
}

function createRelationFingerprint(command: CreateQuestionRelationCommand): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        sourceQuestionId: command.sourceQuestionId,
        targetQuestionId: command.targetQuestionId,
        type: command.type,
        actorId: command.actorId
      })
    )
    .digest("hex");
}

function validateIdentifier(value: string, label: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value))
    throw new ValidationError(`Invalid ${label}`);
}

function validateCorrelationId(value: string): void {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(value))
    throw new ValidationError("Invalid correlation ID", { field: "correlationId" });
}

function validateIdempotencyKey(key: string): void {
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(key))
    throw new ValidationError("Invalid idempotency key", { field: "idempotencyKey" });
}

function mapRelationError<T = QuestionRelationView>(
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
    return failure({
      code: "question_relation_exists",
      message: error.message,
      category: "conflict"
    });
  return failure({
    code: "persistence_error",
    message: infrastructureMessage,
    category: "infrastructure",
    retryable: true
  });
}

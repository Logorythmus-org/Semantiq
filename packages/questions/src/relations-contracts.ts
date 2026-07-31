import type { Result } from "../../shared/src/core-primitives.js";
import type { Question, QuestionView } from "./domain.js";
import type {
  QuestionRelation,
  QuestionRelationDirection,
  QuestionRelationEvent,
  QuestionRelationType,
  QuestionRelationView
} from "./relations-domain.js";

export interface QuestionRelationRepositoryQuery {
  readonly questionIds: readonly string[];
  readonly direction: QuestionRelationDirection;
  readonly relationTypes?: readonly QuestionRelationType[];
  readonly limit: number;
  readonly offset?: number;
}

export interface QuestionRelationRepository {
  add(relation: QuestionRelation): Promise<void>;
  saveWithExpectedVersion(relation: QuestionRelation, expectedVersion: number): Promise<boolean>;
  getById(id: string): Promise<QuestionRelation | undefined>;
  findEquivalent(
    type: QuestionRelationType,
    sourceQuestionId: string,
    targetQuestionId: string
  ): Promise<QuestionRelation | undefined>;
  list(query: QuestionRelationRepositoryQuery): Promise<readonly QuestionRelation[]>;
}

export interface QuestionRelationQuestionRepository {
  getById(id: string): Promise<Question | undefined>;
  getByIds(ids: readonly string[]): Promise<readonly Question[]>;
  getByIdsForRelationCreation(ids: readonly string[]): Promise<readonly Question[]>;
}

export interface QuestionRelationIdempotencyResult {
  readonly fingerprint: string;
  readonly response: QuestionRelationView;
}

export interface QuestionRelationIdempotencyRecord extends QuestionRelationIdempotencyResult {
  readonly scope: string;
  readonly key: string;
}

export interface QuestionRelationUnitOfWork {
  begin(mode?: "read" | "write"): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  readonly questions: QuestionRelationQuestionRepository;
  readonly relations: QuestionRelationRepository;
  appendOutbox(event: QuestionRelationEvent): Promise<void>;
  getIdempotency(
    scope: string,
    key: string
  ): Promise<QuestionRelationIdempotencyResult | undefined>;
  putIdempotency(record: QuestionRelationIdempotencyRecord): Promise<void>;
}

export interface CreateQuestionRelationCommand {
  readonly sourceQuestionId: string;
  readonly targetQuestionId: string;
  readonly type: QuestionRelationType;
  readonly actorId: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface RemoveQuestionRelationCommand {
  readonly relationId: string;
  readonly expectedVersion: number;
  readonly actorId: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface ListQuestionRelationsQuery {
  readonly questionId: string;
  readonly direction?: QuestionRelationDirection;
  readonly relationTypes?: readonly QuestionRelationType[];
  readonly page?: number;
  readonly limit?: number;
  readonly correlationId: string;
}

export interface GetQuestionGraphQuery {
  readonly questionId: string;
  readonly depth?: number;
  readonly direction?: QuestionRelationDirection;
  readonly relationTypes?: readonly QuestionRelationType[];
  readonly maxNodes?: number;
  readonly correlationId: string;
}

export interface QuestionRelationListView {
  readonly questionId: string;
  readonly direction: QuestionRelationDirection;
  readonly relationTypes: readonly QuestionRelationType[];
  readonly items: readonly QuestionRelationView[];
  readonly page: number;
  readonly limit: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}

export interface QuestionGraphView {
  readonly rootQuestionId: string;
  readonly depth: number;
  readonly direction: QuestionRelationDirection;
  readonly relationTypes: readonly QuestionRelationType[];
  readonly nodes: readonly QuestionView[];
  readonly relations: readonly QuestionRelationView[];
  readonly truncated: boolean;
  readonly limits: {
    readonly maxNodes: number;
    readonly maxEdges: number;
  };
}

export type QuestionRelationResult = Result<QuestionRelationView>;
export type QuestionRelationListResult = Result<QuestionRelationListView>;
export type QuestionGraphResult = Result<QuestionGraphView>;

export interface QuestionRelationApplication {
  create(command: CreateQuestionRelationCommand): Promise<QuestionRelationResult>;
  remove(command: RemoveQuestionRelationCommand): Promise<QuestionRelationResult>;
  list(query: ListQuestionRelationsQuery): Promise<QuestionRelationListResult>;
  graph(query: GetQuestionGraphQuery): Promise<QuestionGraphResult>;
}

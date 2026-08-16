import type { Result } from "../../shared/src/core-primitives.js";
import type {
  Question,
  QuestionEvent,
  QuestionId,
  QuestionRevision,
  QuestionRevisionView,
  QuestionSource,
  QuestionView
} from "./domain.js";

export interface QuestionRepository {
  add(question: Question): Promise<void>;
  getById(id: QuestionId): Promise<Question | undefined>;
  exists(id: QuestionId): Promise<boolean>;
  saveWithExpectedVersion(question: Question, expectedVersion: number): Promise<boolean>;
}

export interface QuestionRevisionRepository {
  add(revision: QuestionRevision): Promise<void>;
  listByQuestion(questionId: QuestionId): Promise<readonly QuestionRevision[]>;
}

export interface QuestionUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  readonly questions: QuestionRepository;
  readonly revisions: QuestionRevisionRepository;
  appendOutbox(event: QuestionEvent): Promise<void>;
  getIdempotency(scope: string, key: string): Promise<IdempotencyResult | undefined>;
  putIdempotency(record: IdempotencyRecord): Promise<void>;
}

export interface IdempotencyResult {
  readonly fingerprint: string;
  readonly response: QuestionView;
}

export interface IdempotencyRecord extends IdempotencyResult {
  readonly scope: string;
  readonly key: string;
}

export interface CreateQuestionCommand {
  readonly text: string;
  readonly language: string;
  readonly source?: QuestionSource;
  readonly creatorId?: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface GetQuestionByIdQuery {
  readonly questionId: string;
  readonly correlationId: string;
}

export interface QuestionMutationCommand {
  readonly questionId: string;
  readonly expectedVersion: number;
  readonly actorId: string;
  readonly reason?: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface UpdateQuestionCommand extends QuestionMutationCommand {
  readonly text: string;
}

export type ArchiveQuestionCommand = QuestionMutationCommand;
export type RestoreQuestionCommand = QuestionMutationCommand;

export interface GetQuestionRevisionHistoryQuery {
  readonly questionId: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface QuestionRevisionHistoryView {
  readonly questionId: string;
  readonly currentVersion: number;
  readonly revisions: readonly QuestionRevisionView[];
}

export type QuestionResult = Result<QuestionView>;
export type QuestionHistoryResult = Result<QuestionRevisionHistoryView>;

export interface QuestionApplication {
  create(command: CreateQuestionCommand): Promise<QuestionResult>;
  get(query: GetQuestionByIdQuery): Promise<QuestionResult>;
  update(command: UpdateQuestionCommand): Promise<QuestionResult>;
  archive(command: ArchiveQuestionCommand): Promise<QuestionResult>;
  restore(command: RestoreQuestionCommand): Promise<QuestionResult>;
  revisions(query: GetQuestionRevisionHistoryQuery): Promise<QuestionHistoryResult>;
}

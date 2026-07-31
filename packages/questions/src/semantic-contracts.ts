import type { Result } from "../../shared/src/core-primitives.js";
import type { Question } from "./domain.js";
import type {
  QuestionSemanticRevision,
  QuestionSemanticRevisionView,
  QuestionSemanticStructure,
  QuestionSemanticStructureEvent,
  QuestionSemanticStructureInput,
  QuestionSemanticStructureView
} from "./semantic-domain.js";

export interface QuestionSemanticStructureRepository {
  add(structure: QuestionSemanticStructure): Promise<void>;
  getByQuestionId(questionId: string): Promise<QuestionSemanticStructure | undefined>;
  getByQuestionIdForUpdate(questionId: string): Promise<QuestionSemanticStructure | undefined>;
  saveWithExpectedVersion(
    structure: QuestionSemanticStructure,
    expectedVersion: number
  ): Promise<boolean>;
}

export interface QuestionSemanticRevisionRepository {
  add(revision: QuestionSemanticRevision): Promise<void>;
  listByQuestion(questionId: string): Promise<readonly QuestionSemanticRevision[]>;
}

export interface QuestionSemanticQuestionRepository {
  getById(id: string): Promise<Question | undefined>;
  getByIdForSemanticMutation(id: string): Promise<Question | undefined>;
}

export interface QuestionSemanticIdempotencyResult {
  readonly fingerprint: string;
  readonly response: QuestionSemanticStructureView;
}

export interface QuestionSemanticIdempotencyRecord extends QuestionSemanticIdempotencyResult {
  readonly scope: string;
  readonly key: string;
}

export interface QuestionSemanticUnitOfWork {
  begin(mode?: "read" | "write"): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  readonly questions: QuestionSemanticQuestionRepository;
  readonly structures: QuestionSemanticStructureRepository;
  readonly revisions: QuestionSemanticRevisionRepository;
  appendOutbox(event: QuestionSemanticStructureEvent): Promise<void>;
  getIdempotency(
    scope: string,
    key: string
  ): Promise<QuestionSemanticIdempotencyResult | undefined>;
  putIdempotency(record: QuestionSemanticIdempotencyRecord): Promise<void>;
}

export interface PutQuestionSemanticStructureCommand {
  readonly questionId: string;
  readonly expectedVersion: number;
  readonly structure: QuestionSemanticStructureInput;
  readonly actorId: string;
  readonly reason?: string;
  readonly idempotencyKey?: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface GetQuestionSemanticStructureQuery {
  readonly questionId: string;
  readonly correlationId: string;
}

export interface GetQuestionSemanticRevisionHistoryQuery {
  readonly questionId: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface QuestionSemanticRevisionHistoryView {
  readonly questionId: string;
  readonly currentVersion: number;
  readonly revisions: readonly QuestionSemanticRevisionView[];
}

export interface QuestionSemanticComponentView {
  readonly id: string;
  readonly text: string;
}

export interface QuestionSemanticSnapshotView {
  readonly schemaVersion: "1.0";
  readonly generatedAt: string;
  readonly question: {
    readonly id: string;
    readonly text: string;
    readonly status: "published" | "archived";
    readonly version: number;
  };
  readonly frame: {
    readonly id: string;
    readonly version: number;
    readonly questionVersionAtLastUpdate: number;
    readonly freshness: "fresh" | "stale";
    readonly context: readonly QuestionSemanticComponentView[];
    readonly assumptions: readonly QuestionSemanticComponentView[];
    readonly constraints: readonly QuestionSemanticComponentView[];
    readonly unknowns: readonly QuestionSemanticComponentView[];
    readonly uncertainty: {
      readonly level: string;
      readonly statements: readonly QuestionSemanticComponentView[];
    };
    readonly scope: {
      readonly inclusions: readonly QuestionSemanticComponentView[];
      readonly exclusions: readonly QuestionSemanticComponentView[];
    };
    readonly perspectives: readonly QuestionSemanticComponentView[];
  };
}

export type QuestionSemanticResult = Result<QuestionSemanticStructureView>;
export type QuestionSemanticHistoryResult = Result<QuestionSemanticRevisionHistoryView>;
export type QuestionSemanticSnapshotResult = Result<QuestionSemanticSnapshotView>;

export interface QuestionSemanticApplication {
  put(command: PutQuestionSemanticStructureCommand): Promise<QuestionSemanticResult>;
  get(query: GetQuestionSemanticStructureQuery): Promise<QuestionSemanticResult>;
  snapshot(query: GetQuestionSemanticStructureQuery): Promise<QuestionSemanticSnapshotResult>;
  revisions(query: GetQuestionSemanticRevisionHistoryQuery): Promise<QuestionSemanticHistoryResult>;
}

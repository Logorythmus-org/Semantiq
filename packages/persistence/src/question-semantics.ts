import { createHash } from "node:crypto";
import {
  QuestionRuntimeError,
  QuestionSemanticRevision,
  type QuestionSemanticIdempotencyRecord,
  type QuestionSemanticIdempotencyResult,
  type QuestionSemanticRevisionRepository,
  QuestionSemanticStructure,
  type QuestionSemanticStructureEvent,
  type QuestionSemanticStructureInput,
  type QuestionSemanticStructureRepository,
  type QuestionSemanticStructureView,
  type QuestionSemanticUnitOfWork
} from "../../questions/src/index.js";
import { ApplicationError, ConflictError } from "../../shared/src/index.js";
import type { SqlClient, SqlPool } from "./client.js";
import { PostgresQuestionRepository } from "./questions.js";

type QuestionSemanticStructureRow = {
  question_id: string;
  structure: QuestionSemanticStructureInput;
  question_version_at_last_update: number;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  version: number;
};

type QuestionSemanticRevisionRow = {
  id: string;
  question_id: string;
  version: number;
  previous_structure: QuestionSemanticStructureInput;
  structure: QuestionSemanticStructureInput;
  changed_by: string;
  changed_at: Date;
  reason: string | null;
  correlation_id: string;
};

export class PostgresQuestionSemanticStructureRepository implements QuestionSemanticStructureRepository {
  private readonly client: SqlClient;

  constructor(client: SqlClient) {
    this.client = client;
  }

  async add(structure: QuestionSemanticStructure): Promise<void> {
    try {
      await this.client.query(
        "INSERT INTO question_semantic_structures (question_id,structure,question_version_at_last_update,created_by,updated_by,created_at,updated_at,version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          structure.questionId,
          structure.content.view(),
          structure.questionVersionAtLastUpdate,
          structure.createdBy,
          structure.updatedBy,
          structure.createdAt,
          structure.updatedAt,
          structure.version
        ]
      );
    } catch (error) {
      if (postgresErrorCode(error) === "23505")
        throw new QuestionRuntimeError(
          "question_semantic_version_conflict",
          "Question semantic structure already exists",
          "conflict"
        );
      if (postgresErrorCode(error) === "23503")
        throw new QuestionRuntimeError("question_not_found", "Question not found", "not_found");
      throw error;
    }
  }

  async getByQuestionId(questionId: string): Promise<QuestionSemanticStructure | undefined> {
    return this.get(questionId, false);
  }

  async getByQuestionIdForUpdate(
    questionId: string
  ): Promise<QuestionSemanticStructure | undefined> {
    return this.get(questionId, true);
  }

  async saveWithExpectedVersion(
    structure: QuestionSemanticStructure,
    expectedVersion: number
  ): Promise<boolean> {
    const result = await this.client.query(
      "UPDATE question_semantic_structures SET structure=$2,question_version_at_last_update=$3,updated_by=$4,updated_at=$5,version=$6 WHERE question_id=$1 AND version=$7",
      [
        structure.questionId,
        structure.content.view(),
        structure.questionVersionAtLastUpdate,
        structure.updatedBy,
        structure.updatedAt,
        structure.version,
        expectedVersion
      ]
    );
    return result.rowCount === 1;
  }

  private async get(
    questionId: string,
    forUpdate: boolean
  ): Promise<QuestionSemanticStructure | undefined> {
    const result = await this.client.query<QuestionSemanticStructureRow>(
      `${semanticStructureSelect} WHERE question_id=$1${forUpdate ? " FOR UPDATE" : ""}`,
      [questionId]
    );
    const row = result.rows[0];
    return row ? toStructure(row) : undefined;
  }
}

export class PostgresQuestionSemanticRevisionRepository implements QuestionSemanticRevisionRepository {
  private readonly client: SqlClient;

  constructor(client: SqlClient) {
    this.client = client;
  }

  async add(revision: QuestionSemanticRevision): Promise<void> {
    await this.client.query(
      "INSERT INTO question_semantic_revisions (id,question_id,version,previous_structure,structure,changed_by,changed_at,reason,correlation_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        revision.id,
        revision.questionId,
        revision.version,
        revision.previousStructure.view(),
        revision.structure.view(),
        revision.changedBy,
        revision.changedAt,
        revision.reason ?? null,
        revision.correlationId
      ]
    );
  }

  async listByQuestion(questionId: string): Promise<readonly QuestionSemanticRevision[]> {
    const result = await this.client.query<QuestionSemanticRevisionRow>(
      "SELECT id,question_id,version,previous_structure,structure,changed_by,changed_at,reason,correlation_id FROM question_semantic_revisions WHERE question_id=$1 ORDER BY version ASC",
      [questionId]
    );
    return result.rows.map((row) =>
      QuestionSemanticRevision.restore({
        id: row.id,
        questionId: row.question_id,
        version: row.version,
        previousStructure: row.previous_structure,
        structure: row.structure,
        changedBy: row.changed_by,
        changedAt: new Date(row.changed_at),
        ...(row.reason ? { reason: row.reason } : {}),
        correlationId: row.correlation_id
      })
    );
  }
}

export class PostgresQuestionSemanticUnitOfWork implements QuestionSemanticUnitOfWork {
  private readonly pool: SqlPool;
  private connection: SqlClient | undefined;
  private active = false;
  readonly questions: PostgresQuestionRepository;
  readonly structures: PostgresQuestionSemanticStructureRepository;
  readonly revisions: PostgresQuestionSemanticRevisionRepository;

  constructor(pool: SqlPool) {
    this.pool = pool;
    const proxy = this.connectionProxy();
    this.questions = new PostgresQuestionRepository(proxy);
    this.structures = new PostgresQuestionSemanticStructureRepository(proxy);
    this.revisions = new PostgresQuestionSemanticRevisionRepository(proxy);
  }

  async begin(mode: "read" | "write" = "write"): Promise<void> {
    if (this.active) throw new ConflictError("Question semantic transaction already active");
    this.connection = await this.pool.connect();
    try {
      await this.connection.query(
        mode === "read" ? "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY" : "BEGIN"
      );
      this.active = true;
    } catch (error) {
      this.connection.release?.();
      this.connection = undefined;
      throw error;
    }
  }

  async commit(): Promise<void> {
    const connection = this.getConnection();
    try {
      await connection.query("COMMIT");
    } finally {
      this.release();
    }
  }

  async rollback(): Promise<void> {
    if (!this.active || !this.connection) return;
    try {
      await this.connection.query("ROLLBACK");
    } finally {
      this.release();
    }
  }

  async appendOutbox(event: QuestionSemanticStructureEvent): Promise<void> {
    const connection = this.getConnection();
    const correlationId =
      event.correlation?.correlationId ?? String(event.metadata.correlationId ?? "");
    const causationId = event.correlation?.causationId ?? String(event.metadata.causationId ?? "");
    await connection.query(
      "INSERT INTO outbox_events (event_id,event_type,aggregate_type,aggregate_id,payload,metadata,schema_version,correlation_id,causation_id,occurred_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        event.id,
        event.type,
        "QuestionSemanticStructure",
        event.aggregateId ?? null,
        event.payload,
        event.metadata,
        event.schemaVersion,
        correlationId || null,
        causationId || null,
        event.occurredAt
      ]
    );
  }

  async getIdempotency(
    scope: string,
    key: string
  ): Promise<QuestionSemanticIdempotencyResult | undefined> {
    const result = await this.getConnection().query<{
      request_fingerprint: string;
      response: QuestionSemanticStructureView;
    }>(
      "SELECT request_fingerprint,response FROM idempotency_records WHERE scope=$1 AND key_hash=$2 AND (expires_at IS NULL OR expires_at > NOW())",
      [scope, hashKey(key)]
    );
    const row = result.rows[0];
    return row ? { fingerprint: row.request_fingerprint, response: row.response } : undefined;
  }

  async putIdempotency(record: QuestionSemanticIdempotencyRecord): Promise<void> {
    await this.getConnection().query(
      "INSERT INTO idempotency_records (scope,key_hash,request_fingerprint,status,response) VALUES ($1,$2,$3,'completed',$4)",
      [record.scope, hashKey(record.key), record.fingerprint, record.response]
    );
  }

  private connectionProxy(): SqlClient {
    return {
      query: async <T extends import("pg").QueryResultRow>(
        text: string,
        values?: readonly unknown[]
      ) => this.getConnection().query<T>(text, values)
    };
  }

  private getConnection(): SqlClient {
    if (!this.active || !this.connection)
      throw new ApplicationError("No active Question semantic transaction", {
        code: "TRANSACTION_STATE",
        statusCode: 500
      });
    return this.connection;
  }

  private release(): void {
    this.connection?.release?.();
    this.connection = undefined;
    this.active = false;
  }
}

const semanticStructureSelect =
  "SELECT question_id,structure,question_version_at_last_update,created_by,updated_by,created_at,updated_at,version FROM question_semantic_structures";

function toStructure(row: QuestionSemanticStructureRow): QuestionSemanticStructure {
  return QuestionSemanticStructure.restore({
    questionId: row.question_id,
    content: row.structure,
    questionVersionAtLastUpdate: row.question_version_at_last_update,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    version: row.version
  });
}

function postgresErrorCode(error: unknown): string | undefined {
  return error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code)
    : undefined;
}

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

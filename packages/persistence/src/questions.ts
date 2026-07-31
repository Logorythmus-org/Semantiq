import { createHash } from "node:crypto";
import {
  Question,
  QuestionRevision,
  type IdempotencyRecord,
  type IdempotencyResult,
  type QuestionChangeType,
  type QuestionEvent,
  type QuestionId,
  type QuestionRepository,
  type QuestionRevisionRepository,
  type QuestionSource,
  type QuestionStatus,
  type QuestionUnitOfWork,
  type QuestionView
} from "../../questions/src/index.js";
import { ApplicationError, ConflictError } from "../../shared/src/index.js";
import type { SqlClient, SqlPool } from "./client.js";

type QuestionRow = {
  id: string;
  text: string;
  status: QuestionStatus;
  language: string;
  source: QuestionSource;
  creator_id: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
};

type QuestionRevisionRow = {
  id: string;
  question_id: string;
  version: number;
  previous_text: string;
  text: string;
  previous_status: QuestionStatus;
  status: QuestionStatus;
  change_type: QuestionChangeType;
  changed_by: string;
  changed_at: Date;
  reason: string | null;
  correlation_id: string;
};

export class PostgresQuestionRepository implements QuestionRepository {
  private readonly client: SqlClient;
  constructor(client: SqlClient) {
    this.client = client;
  }

  async add(question: Question): Promise<void> {
    await this.client.query(
      "INSERT INTO questions (id, text, status, language, source, creator_id, created_at, updated_at, version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        question.id,
        question.text.value,
        question.status,
        question.language.value,
        question.source,
        question.creatorId ?? null,
        question.createdAt,
        question.updatedAt,
        question.version
      ]
    );
  }

  async getById(id: QuestionId): Promise<Question | undefined> {
    const result = await this.client.query<QuestionRow>(
      "SELECT id,text,status,language,source,creator_id,created_at,updated_at,version FROM questions WHERE id=$1",
      [id]
    );
    const row = result.rows[0];
    return row ? this.toDomain(row) : undefined;
  }

  async getByIds(ids: readonly string[]): Promise<readonly Question[]> {
    if (ids.length === 0) return [];
    const result = await this.client.query<QuestionRow>(
      "SELECT id,text,status,language,source,creator_id,created_at,updated_at,version FROM questions WHERE id = ANY($1::text[]) ORDER BY id",
      [ids]
    );
    return result.rows.map((row) => this.toDomain(row));
  }

  async getByIdsForRelationCreation(ids: readonly string[]): Promise<readonly Question[]> {
    if (ids.length === 0) return [];
    const result = await this.client.query<QuestionRow>(
      "SELECT id,text,status,language,source,creator_id,created_at,updated_at,version FROM questions WHERE id = ANY($1::text[]) ORDER BY id FOR SHARE",
      [ids]
    );
    return result.rows.map((row) => this.toDomain(row));
  }

  async getByIdForSemanticMutation(id: string): Promise<Question | undefined> {
    const result = await this.client.query<QuestionRow>(
      "SELECT id,text,status,language,source,creator_id,created_at,updated_at,version FROM questions WHERE id=$1 FOR SHARE",
      [id]
    );
    const row = result.rows[0];
    return row ? this.toDomain(row) : undefined;
  }

  async exists(id: QuestionId): Promise<boolean> {
    const result = await this.client.query("SELECT 1 FROM questions WHERE id=$1", [id]);
    return result.rowCount === 1;
  }

  async saveWithExpectedVersion(question: Question, expectedVersion: number): Promise<boolean> {
    const result = await this.client.query(
      "UPDATE questions SET text=$2,status=$3,updated_at=$4,version=$5 WHERE id=$1 AND version=$6",
      [
        question.id,
        question.text.value,
        question.status,
        question.updatedAt,
        question.version,
        expectedVersion
      ]
    );
    return result.rowCount === 1;
  }

  private toDomain(row: QuestionRow): Question {
    return Question.restore({
      id: row.id,
      text: row.text,
      status: row.status,
      language: row.language,
      source: row.source,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      version: row.version,
      ...(row.creator_id ? { creatorId: row.creator_id } : {})
    });
  }
}

export class PostgresQuestionRevisionRepository implements QuestionRevisionRepository {
  private readonly client: SqlClient;
  constructor(client: SqlClient) {
    this.client = client;
  }

  async add(revision: QuestionRevision): Promise<void> {
    await this.client.query(
      "INSERT INTO question_revisions (id,question_id,version,previous_text,text,previous_status,status,change_type,changed_by,changed_at,reason,correlation_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [
        revision.id,
        revision.questionId,
        revision.version,
        revision.previousText,
        revision.text,
        revision.previousStatus,
        revision.status,
        revision.changeType,
        revision.changedBy,
        revision.changedAt,
        revision.reason ?? null,
        revision.correlationId
      ]
    );
  }

  async listByQuestion(questionId: QuestionId): Promise<readonly QuestionRevision[]> {
    const result = await this.client.query<QuestionRevisionRow>(
      "SELECT id,question_id,version,previous_text,text,previous_status,status,change_type,changed_by,changed_at,reason,correlation_id FROM question_revisions WHERE question_id=$1 ORDER BY version ASC",
      [questionId]
    );
    return result.rows.map((row) =>
      QuestionRevision.restore({
        id: row.id,
        questionId: row.question_id,
        version: row.version,
        previousText: row.previous_text,
        text: row.text,
        previousStatus: row.previous_status,
        status: row.status,
        changeType: row.change_type,
        changedBy: row.changed_by,
        changedAt: new Date(row.changed_at),
        ...(row.reason ? { reason: row.reason } : {}),
        correlationId: row.correlation_id
      })
    );
  }
}

export class PostgresQuestionUnitOfWork implements QuestionUnitOfWork {
  private readonly pool: SqlPool;
  private connection: SqlClient | undefined;
  private active = false;
  readonly questions: PostgresQuestionRepository;
  readonly revisions: PostgresQuestionRevisionRepository;

  constructor(pool: SqlPool) {
    this.pool = pool;
    const proxy = this.connectionProxy();
    this.questions = new PostgresQuestionRepository(proxy);
    this.revisions = new PostgresQuestionRevisionRepository(proxy);
  }

  async begin(): Promise<void> {
    if (this.active) throw new ConflictError("Question transaction already active");
    this.connection = await this.pool.connect();
    await this.connection.query("BEGIN");
    this.active = true;
  }

  async commit(): Promise<void> {
    const connection = this.getConnection();
    await connection.query("COMMIT");
    this.release();
  }

  async rollback(): Promise<void> {
    if (!this.active || !this.connection) return;
    try {
      await this.connection.query("ROLLBACK");
    } finally {
      this.release();
    }
  }

  async appendOutbox(event: QuestionEvent): Promise<void> {
    const connection = this.getConnection();
    const correlationId =
      event.correlation?.correlationId ?? String(event.metadata.correlationId ?? "");
    const causationId = event.correlation?.causationId ?? String(event.metadata.causationId ?? "");
    await connection.query(
      "INSERT INTO outbox_events (event_id,event_type,aggregate_type,aggregate_id,payload,metadata,schema_version,correlation_id,causation_id,occurred_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        event.id,
        event.type,
        "Question",
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

  async getIdempotency(scope: string, key: string): Promise<IdempotencyResult | undefined> {
    const result = await this.getConnection().query<{
      request_fingerprint: string;
      response: QuestionView;
    }>(
      "SELECT request_fingerprint,response FROM idempotency_records WHERE scope=$1 AND key_hash=$2 AND (expires_at IS NULL OR expires_at > NOW())",
      [scope, hashKey(key)]
    );
    const row = result.rows[0];
    return row ? { fingerprint: row.request_fingerprint, response: row.response } : undefined;
  }

  async putIdempotency(record: IdempotencyRecord): Promise<void> {
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
      throw new ApplicationError("No active Question transaction", {
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

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

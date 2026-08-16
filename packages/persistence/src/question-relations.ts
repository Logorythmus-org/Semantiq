import { createHash } from "node:crypto";
import {
  canonicalQuestionRelationIdentity,
  QuestionRelation,
  type QuestionRelationEvent,
  type QuestionRelationIdempotencyRecord,
  type QuestionRelationIdempotencyResult,
  type QuestionRelationRepository,
  type QuestionRelationRepositoryQuery,
  QuestionRuntimeError,
  type QuestionRelationType,
  type QuestionRelationUnitOfWork,
  type QuestionRelationView
} from "../../questions/src/index.js";
import { ApplicationError, ConflictError } from "../../shared/src/index.js";
import type { SqlClient, SqlPool } from "./client.js";
import { PostgresQuestionRepository } from "./questions.js";

type QuestionRelationRow = {
  id: string;
  source_question_id: string;
  target_question_id: string;
  type: QuestionRelationType;
  created_by: string;
  created_at: Date;
  status: "active" | "removed";
  removed_by: string | null;
  removed_at: Date | null;
  version: number;
};

const SYMMETRIC_RELATION_TYPES: readonly QuestionRelationType[] = [
  "contradicts",
  "alternative_to",
  "connects"
];

export class PostgresQuestionRelationRepository implements QuestionRelationRepository {
  private readonly client: SqlClient;

  constructor(client: SqlClient) {
    this.client = client;
  }

  async add(relation: QuestionRelation): Promise<void> {
    try {
      await this.client.query(
        "INSERT INTO question_relations (id,source_question_id,target_question_id,type,created_by,created_at,status,version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          relation.id,
          relation.sourceQuestionId,
          relation.targetQuestionId,
          relation.type,
          relation.createdBy,
          relation.createdAt,
          relation.status,
          relation.version
        ]
      );
    } catch (error) {
      if (postgresErrorCode(error) === "23505")
        throw new QuestionRuntimeError(
          "question_relation_exists",
          "An equivalent Question relation already exists",
          "conflict"
        );
      if (postgresErrorCode(error) === "23503")
        throw new QuestionRuntimeError(
          "question_relation_endpoint_not_found",
          "A Question relation endpoint no longer exists",
          "not_found"
        );
      throw error;
    }
  }

  async saveWithExpectedVersion(
    relation: QuestionRelation,
    expectedVersion: number
  ): Promise<boolean> {
    const result = await this.client.query(
      "UPDATE question_relations SET status=$1,removed_by=$2,removed_at=$3,version=$4 WHERE id=$5 AND version=$6",
      [
        relation.status,
        relation.removedBy ?? null,
        relation.removedAt ?? null,
        relation.version,
        relation.id,
        expectedVersion
      ]
    );
    return (result.rowCount ?? 0) === 1;
  }

  async getById(id: string): Promise<QuestionRelation | undefined> {
    const result = await this.client.query<QuestionRelationRow>(`${relationSelect} WHERE id=$1`, [
      id
    ]);
    const row = result.rows[0];
    return row ? toDomain(row) : undefined;
  }

  async findEquivalent(
    type: QuestionRelationType,
    sourceQuestionId: string,
    targetQuestionId: string
  ): Promise<QuestionRelation | undefined> {
    const identity = canonicalQuestionRelationIdentity(type, sourceQuestionId, targetQuestionId);
    const result = await this.client.query<QuestionRelationRow>(
      `${relationSelect} WHERE status='active' AND canonical_type=$1 AND canonical_source_question_id=$2 AND canonical_target_question_id=$3`,
      [identity.type, identity.sourceQuestionId, identity.targetQuestionId]
    );
    const row = result.rows[0];
    return row ? toDomain(row) : undefined;
  }

  async list(query: QuestionRelationRepositoryQuery): Promise<readonly QuestionRelation[]> {
    if (query.questionIds.length === 0) return [];
    const values: unknown[] = [query.questionIds];
    const ids = "$1::text[]";
    let endpointClause = `(source_question_id = ANY(${ids}) OR target_question_id = ANY(${ids}))`;
    if (query.direction !== "both") {
      values.push(SYMMETRIC_RELATION_TYPES);
      const symmetric = `$${values.length}::text[]`;
      endpointClause =
        query.direction === "outgoing"
          ? `(source_question_id = ANY(${ids}) OR (type = ANY(${symmetric}) AND target_question_id = ANY(${ids})))`
          : `(target_question_id = ANY(${ids}) OR (type = ANY(${symmetric}) AND source_question_id = ANY(${ids})))`;
    }
    const clauses = ["status='active'", endpointClause];
    if (query.relationTypes && query.relationTypes.length > 0) {
      values.push(query.relationTypes);
      clauses.push(`type = ANY($${values.length}::text[])`);
    }
    values.push(query.limit);
    const limitParameter = `$${values.length}`;
    values.push(query.offset ?? 0);
    const offsetParameter = `$${values.length}`;
    const result = await this.client.query<QuestionRelationRow>(
      `${relationSelect} WHERE ${clauses.join(" AND ")} ORDER BY created_at ASC,id ASC LIMIT ${limitParameter} OFFSET ${offsetParameter}`,
      values
    );
    return result.rows.map(toDomain);
  }
}

export class PostgresQuestionRelationUnitOfWork implements QuestionRelationUnitOfWork {
  private readonly pool: SqlPool;
  private connection: SqlClient | undefined;
  private active = false;
  readonly questions: PostgresQuestionRepository;
  readonly relations: PostgresQuestionRelationRepository;

  constructor(pool: SqlPool) {
    this.pool = pool;
    const proxy = this.connectionProxy();
    this.questions = new PostgresQuestionRepository(proxy);
    this.relations = new PostgresQuestionRelationRepository(proxy);
  }

  async begin(mode: "read" | "write" = "write"): Promise<void> {
    if (this.active) throw new ConflictError("Question relation transaction already active");
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

  async appendOutbox(event: QuestionRelationEvent): Promise<void> {
    const connection = this.getConnection();
    const correlationId =
      event.correlation?.correlationId ?? String(event.metadata.correlationId ?? "");
    const causationId = event.correlation?.causationId ?? String(event.metadata.causationId ?? "");
    await connection.query(
      "INSERT INTO outbox_events (event_id,event_type,aggregate_type,aggregate_id,payload,metadata,schema_version,correlation_id,causation_id,occurred_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      [
        event.id,
        event.type,
        "QuestionRelation",
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
  ): Promise<QuestionRelationIdempotencyResult | undefined> {
    const result = await this.getConnection().query<{
      request_fingerprint: string;
      response: QuestionRelationView;
    }>(
      "SELECT request_fingerprint,response FROM idempotency_records WHERE scope=$1 AND key_hash=$2 AND (expires_at IS NULL OR expires_at > NOW())",
      [scope, hashKey(key)]
    );
    const row = result.rows[0];
    return row ? { fingerprint: row.request_fingerprint, response: row.response } : undefined;
  }

  async putIdempotency(record: QuestionRelationIdempotencyRecord): Promise<void> {
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
      throw new ApplicationError("No active Question relation transaction", {
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

const relationSelect =
  "SELECT id,source_question_id,target_question_id,type,created_by,created_at,status,removed_by,removed_at,version FROM question_relations";

function toDomain(row: QuestionRelationRow): QuestionRelation {
  return QuestionRelation.restore({
    id: row.id,
    sourceQuestionId: row.source_question_id,
    targetQuestionId: row.target_question_id,
    type: row.type,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    status: row.status,
    ...(row.removed_by ? { removedBy: row.removed_by } : {}),
    ...(row.removed_at ? { removedAt: new Date(row.removed_at) } : {}),
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

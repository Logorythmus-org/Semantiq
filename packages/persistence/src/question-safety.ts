import { createHash } from "node:crypto";
import {
  type AuditRecordView,
  type QuestionModerationActionView,
  type QuestionModerationCaseView,
  type QuestionModerationStateView,
  type QuestionReportView,
  QuestionRuntimeError,
  type QuestionSafetyIdempotencyRecord,
  type QuestionSafetyRepository,
  type QuestionSafetyUnitOfWork,
  type QuestionSourceReferenceView,
  type QuestionTrustSignalsView
} from "../../questions/src/index.js";
import type { DomainEvent } from "../../shared/src/index.js";
import { ApplicationError, ConflictError } from "../../shared/src/index.js";
import type { SqlClient, SqlPool } from "./client.js";
import { PostgresQuestionRepository, PostgresQuestionRevisionRepository } from "./questions.js";

export class PostgresQuestionSafetyRepository implements QuestionSafetyRepository {
  private readonly client: SqlClient;
  constructor(client: SqlClient) {
    this.client = client;
  }
  async addSource(v: QuestionSourceReferenceView): Promise<void> {
    try {
      await this.client.query(
        "INSERT INTO question_source_references (id,question_id,source_type,title,locator,normalized_locator,description,declared_by,declared_at,status,verification_state,declared_classification,verification_classification,version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
        [
          v.id,
          v.questionId,
          v.sourceType,
          v.title,
          v.locator,
          v.normalizedLocator,
          v.description ?? null,
          v.declaredBy,
          v.declaredAt,
          v.status,
          v.verificationState,
          v.declaredClassification,
          v.verificationClassification,
          v.version
        ]
      );
    } catch (error) {
      throw mapConstraint(
        error,
        "question_source_duplicate",
        "Active source reference already exists"
      );
    }
  }
  async getSource(id: string): Promise<QuestionSourceReferenceView | undefined> {
    const r = await this.client.query<SourceRow>(`${sourceSelect} WHERE id=$1`, [id]);
    return r.rows[0] ? source(r.rows[0]) : undefined;
  }
  async saveSource(v: QuestionSourceReferenceView, expected: number): Promise<boolean> {
    const r = await this.client.query(
      "UPDATE question_source_references SET status=$2,verification_state=$3,version=$4,removed_by=$5,removed_at=$6,removal_reason=$7 WHERE id=$1 AND version=$8",
      [
        v.id,
        v.status,
        v.verificationState,
        v.version,
        v.removedBy ?? null,
        v.removedAt ?? null,
        v.removalReason ?? null,
        expected
      ]
    );
    return r.rowCount === 1;
  }
  async listSources(
    qid: string,
    removed: boolean,
    limit: number,
    offset: number
  ): Promise<readonly QuestionSourceReferenceView[]> {
    const r = await this.client.query<SourceRow>(
      `${sourceSelect} WHERE question_id=$1 ${removed ? "" : "AND status='active'"} ORDER BY declared_at,id LIMIT $2 OFFSET $3`,
      [qid, limit, offset]
    );
    return r.rows.map(source);
  }
  async addReport(v: QuestionReportView): Promise<void> {
    try {
      await this.client.query(
        "INSERT INTO question_reports (id,question_id,reporter_id,reason_code,description,status,created_at,updated_at,correlation_id,version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
        [
          v.id,
          v.questionId,
          v.reporterId,
          v.reasonCode,
          v.description,
          v.status,
          v.createdAt,
          v.updatedAt,
          v.correlationId,
          v.version
        ]
      );
    } catch (error) {
      throw mapConstraint(
        error,
        "question_report_duplicate",
        "An active report already exists for this reporter, Question, and reason"
      );
    }
  }
  async getReport(id: string): Promise<QuestionReportView | undefined> {
    const r = await this.client.query<ReportRow>(`${reportSelect} WHERE id=$1`, [id]);
    return r.rows[0] ? report(r.rows[0]) : undefined;
  }
  async saveReport(v: QuestionReportView, expected: number): Promise<boolean> {
    const r = await this.client.query(
      "UPDATE question_reports SET status=$2,updated_at=$3,version=$4 WHERE id=$1 AND version=$5",
      [v.id, v.status, v.updatedAt, v.version, expected]
    );
    return r.rowCount === 1;
  }
  async listReports(qid: string): Promise<readonly QuestionReportView[]> {
    const r = await this.client.query<ReportRow>(
      `${reportSelect} WHERE question_id=$1 ORDER BY created_at,id`,
      [qid]
    );
    return r.rows.map(report);
  }
  async addCase(v: QuestionModerationCaseView): Promise<void> {
    try {
      await this.client.query(
        "INSERT INTO question_moderation_cases (id,question_id,report_ids,status,opened_at,opened_by,assigned_to,version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          v.id,
          v.questionId,
          JSON.stringify(v.reportIds),
          v.status,
          v.openedAt,
          v.openedBy,
          v.assignedTo ?? null,
          v.version
        ]
      );
    } catch (error) {
      throw mapConstraint(
        error,
        "question_moderation_case_conflict",
        "An active moderation case already exists"
      );
    }
  }
  async getCase(id: string): Promise<QuestionModerationCaseView | undefined> {
    const r = await this.client.query<CaseRow>(`${caseSelect} WHERE id=$1`, [id]);
    return r.rows[0] ? moderationCase(r.rows[0]) : undefined;
  }
  async saveCase(v: QuestionModerationCaseView, expected: number): Promise<boolean> {
    const r = await this.client.query(
      "UPDATE question_moderation_cases SET status=$2,resolution=$3,resolved_at=$4,version=$5 WHERE id=$1 AND version=$6",
      [v.id, v.status, v.resolution ?? null, v.resolvedAt ?? null, v.version, expected]
    );
    return r.rowCount === 1;
  }
  async addAction(v: QuestionModerationActionView): Promise<void> {
    await this.client.query(
      "INSERT INTO question_moderation_actions (id,case_id,question_id,action_type,actor_id,reason,applied_at,case_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
      [v.id, v.caseId, v.questionId, v.actionType, v.actorId, v.reason, v.appliedAt, v.caseVersion]
    );
  }
  async getModerationState(qid: string): Promise<QuestionModerationStateView | undefined> {
    const r = await this.client.query<StateRow>(`${stateSelect} WHERE question_id=$1`, [qid]);
    return r.rows[0] ? moderationState(r.rows[0]) : undefined;
  }
  async saveModerationState(v: QuestionModerationStateView, expected: number): Promise<boolean> {
    if (expected === 0) {
      const r = await this.client.query(
        "INSERT INTO question_moderation_states (question_id,state,version,updated_at,updated_by,last_reviewed_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
        [
          v.questionId,
          v.state,
          v.version,
          v.updatedAt,
          v.updatedBy ?? null,
          v.lastReviewedAt ?? null
        ]
      );
      return r.rowCount === 1;
    }
    const r = await this.client.query(
      "UPDATE question_moderation_states SET state=$2,version=$3,updated_at=$4,updated_by=$5,last_reviewed_at=$6 WHERE question_id=$1 AND version=$7",
      [
        v.questionId,
        v.state,
        v.version,
        v.updatedAt,
        v.updatedBy ?? null,
        v.lastReviewedAt ?? null,
        expected
      ]
    );
    return r.rowCount === 1;
  }
  async addAudit(v: AuditRecordView): Promise<void> {
    await this.client.query(
      "INSERT INTO question_audit_records (id,question_id,actor_id,action,target_type,target_id,occurred_at,correlation_id,causation_id,result,reason,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [
        v.id,
        v.questionId ?? null,
        v.actorId,
        v.action,
        v.targetType,
        v.targetId,
        v.occurredAt,
        v.correlationId,
        v.causationId ?? null,
        v.result,
        v.reason ?? null,
        v.metadata
      ]
    );
  }
  async listAudit(qid: string, limit: number, offset: number): Promise<readonly AuditRecordView[]> {
    const r = await this.client.query<AuditRow>(
      `${auditSelect} WHERE question_id=$1 ORDER BY occurred_at DESC,id DESC LIMIT $2 OFFSET $3`,
      [qid, limit, offset]
    );
    return r.rows.map(audit);
  }
  async trustSignals(
    qid: string,
    internal: boolean
  ): Promise<QuestionTrustSignalsView | undefined> {
    const r = await this.client.query<TrustRow>(
      `SELECT q.id AS question_id,(q.creator_id IS NOT NULL) AS creator_attributed,(SELECT COUNT(*) FROM question_revisions qr WHERE qr.question_id=q.id)::int AS revision_count,(SELECT COUNT(*) FROM question_source_references s WHERE s.question_id=q.id AND s.status='active')::int AS source_count,(f.question_id IS NOT NULL) AS frame_present,COALESCE(q.version>f.question_version_at_last_update,FALSE) AS frame_stale,(SELECT COUNT(*) FROM question_relations rel WHERE rel.source_question_id=q.id OR rel.target_question_id=q.id)::int AS relation_count,COALESCE(ms.state,'clear') AS moderation_state,ms.last_reviewed_at,(SELECT COUNT(*) FROM question_reports rp WHERE rp.question_id=q.id AND rp.status IN ('open','under_review'))::int AS open_report_count FROM questions q LEFT JOIN question_semantic_structures f ON f.question_id=q.id LEFT JOIN question_moderation_states ms ON ms.question_id=q.id WHERE q.id=$1`,
      [qid]
    );
    const v = r.rows[0];
    if (!v) return undefined;
    return {
      questionId: v.question_id,
      creatorAttributed: v.creator_attributed,
      revisionCount: v.revision_count,
      sourceCount: v.source_count,
      hasActiveSources: v.source_count > 0,
      framePresent: v.frame_present,
      frameStale: v.frame_stale,
      relationCount: v.relation_count,
      moderationState: v.moderation_state,
      ...(v.last_reviewed_at ? { lastReviewedAt: new Date(v.last_reviewed_at).toISOString() } : {}),
      ...(internal ? { openReportCount: v.open_report_count } : {})
    };
  }
}

export class PostgresQuestionSafetyUnitOfWork implements QuestionSafetyUnitOfWork {
  private readonly pool: SqlPool;
  private connection: SqlClient | undefined;
  private active = false;
  readonly questions: PostgresQuestionRepository;
  readonly revisions: PostgresQuestionRevisionRepository;
  readonly safety: PostgresQuestionSafetyRepository;
  constructor(pool: SqlPool) {
    this.pool = pool;
    const proxy: SqlClient = {
      query: async <T extends import("pg").QueryResultRow>(
        text: string,
        values?: readonly unknown[]
      ) => this.get().query<T>(text, values)
    };
    this.questions = new PostgresQuestionRepository(proxy);
    this.revisions = new PostgresQuestionRevisionRepository(proxy);
    this.safety = new PostgresQuestionSafetyRepository(proxy);
  }
  async begin(mode: "read" | "write" = "write"): Promise<void> {
    if (this.active) throw new ConflictError("Question safety transaction already active");
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
    try {
      await this.get().query("COMMIT");
    } finally {
      this.release();
    }
  }
  async rollback(): Promise<void> {
    if (!this.active) return;
    try {
      await this.get().query("ROLLBACK");
    } finally {
      this.release();
    }
  }
  async appendOutbox(e: DomainEvent): Promise<void> {
    await this.get().query(
      "INSERT INTO outbox_events (event_id,event_type,aggregate_type,aggregate_id,payload,metadata,schema_version,correlation_id,causation_id,occurred_at) VALUES ($1,$2,'QuestionSafety',$3,$4,$5,$6,$7,$8,$9)",
      [
        e.id,
        e.type,
        e.aggregateId ?? null,
        e.payload,
        e.metadata,
        e.schemaVersion,
        e.correlation?.correlationId ?? null,
        e.correlation?.causationId ?? null,
        e.occurredAt
      ]
    );
  }
  async getIdempotency(
    scope: string,
    key: string
  ): Promise<{ fingerprint: string; response: unknown } | undefined> {
    const r = await this.get().query<{ request_fingerprint: string; response: unknown }>(
      "SELECT request_fingerprint,response FROM idempotency_records WHERE scope=$1 AND key_hash=$2 AND (expires_at IS NULL OR expires_at>NOW())",
      [scope, hashKey(key)]
    );
    const row = r.rows[0];
    return row ? { fingerprint: row.request_fingerprint, response: row.response } : undefined;
  }
  async putIdempotency(v: QuestionSafetyIdempotencyRecord): Promise<void> {
    await this.get().query(
      "INSERT INTO idempotency_records (scope,key_hash,request_fingerprint,status,response) VALUES ($1,$2,$3,'completed',$4)",
      [v.scope, hashKey(v.key), v.fingerprint, v.response]
    );
  }
  private get(): SqlClient {
    if (!this.active || !this.connection)
      throw new ApplicationError("No active Question safety transaction", {
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

type SourceRow = {
  id: string;
  question_id: string;
  source_type: QuestionSourceReferenceView["sourceType"];
  title: string;
  locator: string;
  normalized_locator: string;
  description: string | null;
  declared_by: string;
  declared_at: Date | string;
  status: QuestionSourceReferenceView["status"];
  verification_state: QuestionSourceReferenceView["verificationState"];
  declared_classification: "USER_DECLARED";
  verification_classification: "SYSTEM_OBSERVED";
  version: number;
  removed_by: string | null;
  removed_at: Date | string | null;
  removal_reason: string | null;
};
type ReportRow = {
  id: string;
  question_id: string;
  reporter_id: string;
  reason_code: QuestionReportView["reasonCode"];
  description: string;
  status: QuestionReportView["status"];
  created_at: Date | string;
  updated_at: Date | string;
  correlation_id: string;
  version: number;
};
type CaseRow = {
  id: string;
  question_id: string;
  report_ids: string[];
  status: QuestionModerationCaseView["status"];
  opened_at: Date | string;
  opened_by: string;
  assigned_to: string | null;
  resolution: string | null;
  resolved_at: Date | string | null;
  version: number;
};
type StateRow = {
  question_id: string;
  state: QuestionModerationStateView["state"];
  version: number;
  updated_at: Date | string;
  updated_by: string | null;
  last_reviewed_at: Date | string | null;
};
type AuditRow = {
  id: string;
  question_id: string | null;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  occurred_at: Date | string;
  correlation_id: string;
  causation_id: string | null;
  result: "success" | "failure";
  reason: string | null;
  metadata: Record<string, string | number | boolean | null>;
};
type TrustRow = {
  question_id: string;
  creator_attributed: boolean;
  revision_count: number;
  source_count: number;
  frame_present: boolean;
  frame_stale: boolean;
  relation_count: number;
  moderation_state: QuestionModerationStateView["state"];
  last_reviewed_at: Date | string | null;
  open_report_count: number;
};
const sourceSelect =
  "SELECT id,question_id,source_type,title,locator,normalized_locator,description,declared_by,declared_at,status,verification_state,declared_classification,verification_classification,version,removed_by,removed_at,removal_reason FROM question_source_references";
const reportSelect =
  "SELECT id,question_id,reporter_id,reason_code,description,status,created_at,updated_at,correlation_id,version FROM question_reports";
const caseSelect =
  "SELECT id,question_id,report_ids,status,opened_at,opened_by,assigned_to,resolution,resolved_at,version FROM question_moderation_cases";
const stateSelect =
  "SELECT question_id,state,version,updated_at,updated_by,last_reviewed_at FROM question_moderation_states";
const auditSelect =
  "SELECT id,question_id,actor_id,action,target_type,target_id,occurred_at,correlation_id,causation_id,result,reason,metadata FROM question_audit_records";
function source(v: SourceRow): QuestionSourceReferenceView {
  return {
    id: v.id,
    questionId: v.question_id,
    sourceType: v.source_type,
    title: v.title,
    locator: v.locator,
    normalizedLocator: v.normalized_locator,
    ...(v.description ? { description: v.description } : {}),
    declaredBy: v.declared_by,
    declaredAt: new Date(v.declared_at).toISOString(),
    status: v.status,
    verificationState: v.verification_state,
    declaredClassification: v.declared_classification,
    verificationClassification: v.verification_classification,
    version: v.version,
    ...(v.removed_by ? { removedBy: v.removed_by } : {}),
    ...(v.removed_at ? { removedAt: new Date(v.removed_at).toISOString() } : {}),
    ...(v.removal_reason ? { removalReason: v.removal_reason } : {})
  };
}
function report(v: ReportRow): QuestionReportView {
  return {
    id: v.id,
    questionId: v.question_id,
    reporterId: v.reporter_id,
    reasonCode: v.reason_code,
    description: v.description,
    status: v.status,
    createdAt: new Date(v.created_at).toISOString(),
    updatedAt: new Date(v.updated_at).toISOString(),
    correlationId: v.correlation_id,
    version: v.version
  };
}
function moderationCase(v: CaseRow): QuestionModerationCaseView {
  return {
    id: v.id,
    questionId: v.question_id,
    reportIds: v.report_ids,
    status: v.status,
    openedAt: new Date(v.opened_at).toISOString(),
    openedBy: v.opened_by,
    ...(v.assigned_to ? { assignedTo: v.assigned_to } : {}),
    ...(v.resolution ? { resolution: v.resolution } : {}),
    ...(v.resolved_at ? { resolvedAt: new Date(v.resolved_at).toISOString() } : {}),
    version: v.version
  };
}
function moderationState(v: StateRow): QuestionModerationStateView {
  return {
    questionId: v.question_id,
    state: v.state,
    version: v.version,
    updatedAt: new Date(v.updated_at).toISOString(),
    ...(v.updated_by ? { updatedBy: v.updated_by } : {}),
    ...(v.last_reviewed_at ? { lastReviewedAt: new Date(v.last_reviewed_at).toISOString() } : {})
  };
}
function audit(v: AuditRow): AuditRecordView {
  return {
    id: v.id,
    ...(v.question_id ? { questionId: v.question_id } : {}),
    actorId: v.actor_id,
    action: v.action,
    targetType: v.target_type,
    targetId: v.target_id,
    occurredAt: new Date(v.occurred_at).toISOString(),
    correlationId: v.correlation_id,
    ...(v.causation_id ? { causationId: v.causation_id } : {}),
    result: v.result,
    ...(v.reason ? { reason: v.reason } : {}),
    metadata: v.metadata
  };
}
function mapConstraint(error: unknown, code: string, message: string): unknown {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    String((error as { code?: unknown }).code) === "23505"
  )
    return new QuestionRuntimeError(code, message, "conflict");
  return error;
}
function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

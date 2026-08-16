import type {
  NormalizedQuestionFilter,
  QuestionDetailView,
  QuestionQuerySpec,
  QuestionReadRepository,
  QuestionRelationDirection,
  QuestionRelationType,
  QuestionSource,
  QuestionStatus,
  QuestionSummaryView,
  QuestionUncertaintyLevel
} from "../../questions/src/index.js";
import type { SqlClient } from "./client.js";

type QuestionDiscoveryRow = {
  id: string;
  text: string;
  language: string;
  status: QuestionStatus;
  source: QuestionSource;
  creator_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  version: number;
  frame_version: number | null;
  question_version_at_last_update: number | null;
  frame_stale: boolean | null;
  has_assumptions: boolean;
  has_unknowns: boolean;
  uncertainty_type: QuestionUncertaintyLevel | null;
  assumption_count: number | null;
  constraint_count: number | null;
  unknown_count: number | null;
  relation_count: string | number;
  relation_types?: QuestionRelationType[] | null;
};

const SYMMETRIC_RELATION_TYPES: readonly QuestionRelationType[] = [
  "contradicts",
  "alternative_to",
  "connects"
];

export class PostgresQuestionReadRepository implements QuestionReadRepository {
  private readonly client: SqlClient;

  constructor(client: SqlClient) {
    this.client = client;
  }

  async listQuestions(spec: QuestionQuerySpec): Promise<readonly QuestionSummaryView[]> {
    return this.discover(spec);
  }

  async searchQuestions(spec: QuestionQuerySpec): Promise<readonly QuestionSummaryView[]> {
    return this.discover(spec);
  }

  async getQuestionSummary(questionId: string): Promise<QuestionSummaryView | undefined> {
    const row = await this.getOne(questionId);
    return row ? toSummary(row) : undefined;
  }

  async getQuestionDetail(questionId: string): Promise<QuestionDetailView | undefined> {
    const row = await this.getOne(questionId);
    if (!row) return undefined;
    const summary = toSummary(row);
    return {
      ...summary,
      frame:
        row.frame_version !== null && row.question_version_at_last_update !== null
          ? {
              version: row.frame_version,
              questionVersionAtLastUpdate: row.question_version_at_last_update,
              stale: Boolean(row.frame_stale),
              assumptionCount: row.assumption_count ?? 0,
              constraintCount: row.constraint_count ?? 0,
              unknownCount: row.unknown_count ?? 0,
              uncertaintyType: row.uncertainty_type ?? "unspecified"
            }
          : undefined,
      relations: {
        count: parseCount(row.relation_count),
        types: row.relation_types ?? []
      }
    };
  }

  async questionExists(questionId: string): Promise<boolean> {
    const result = await this.client.query("SELECT 1 FROM questions WHERE id=$1", [questionId]);
    return result.rowCount === 1;
  }

  private async discover(spec: QuestionQuerySpec): Promise<readonly QuestionSummaryView[]> {
    const values: unknown[] = [];
    const bind = (value: unknown): string => {
      values.push(value);
      return `$${values.length}`;
    };
    const clauses = buildFilterClauses(spec.filters, bind);
    const sortColumn = spec.sort === "recently_updated" ? "q.updated_at" : "q.created_at";
    const direction = spec.sort === "oldest" ? "ASC" : "DESC";
    if (spec.cursor) {
      const timestamp = bind(spec.cursor.sortValue);
      const id = bind(spec.cursor.id);
      clauses.push(
        `(${sortColumn},q.id) ${spec.sort === "oldest" ? ">" : "<"} (${timestamp}::timestamptz,${id})`
      );
    }
    const limit = bind(spec.fetchLimit);
    const result = await this.client.query<QuestionDiscoveryRow>(
      `WITH candidates AS (
        SELECT
          q.id,q.text,q.language,q.status,q.source,q.creator_id,q.created_at,q.updated_at,q.version,
          frame.version AS frame_version,
          frame.question_version_at_last_update,
          CASE WHEN frame.question_id IS NULL THEN NULL
            ELSE q.version > frame.question_version_at_last_update END AS frame_stale,
          COALESCE(jsonb_array_length(frame.structure->'assumptions') > 0,FALSE) AS has_assumptions,
          COALESCE(jsonb_array_length(frame.structure->'unknowns') > 0,FALSE) AS has_unknowns,
          frame.structure->'uncertainty'->>'level' AS uncertainty_type,
          CASE WHEN frame.question_id IS NULL THEN NULL
            ELSE jsonb_array_length(frame.structure->'assumptions') END AS assumption_count,
          CASE WHEN frame.question_id IS NULL THEN NULL
            ELSE jsonb_array_length(frame.structure->'constraints') END AS constraint_count,
          CASE WHEN frame.question_id IS NULL THEN NULL
            ELSE jsonb_array_length(frame.structure->'unknowns') END AS unknown_count
        FROM questions AS q
        LEFT JOIN question_semantic_structures AS frame ON frame.question_id=q.id
        WHERE ${clauses.join(" AND ")}
        ORDER BY ${sortColumn} ${direction},q.id ${direction}
        LIMIT ${limit}
      )
      SELECT candidates.*,
        COALESCE(relation_summary.relation_count,0)::text AS relation_count
      FROM candidates
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS relation_count
        FROM question_relations AS relation
        WHERE relation.source_question_id=candidates.id
          OR relation.target_question_id=candidates.id
      ) AS relation_summary ON TRUE
      ORDER BY ${sortColumn.replace("q.", "candidates.")} ${direction},candidates.id ${direction}`,
      values
    );
    return result.rows.map(toSummary);
  }

  private async getOne(questionId: string): Promise<QuestionDiscoveryRow | undefined> {
    const result = await this.client.query<QuestionDiscoveryRow>(
      `SELECT
        q.id,q.text,q.language,q.status,q.source,q.creator_id,q.created_at,q.updated_at,q.version,
        frame.version AS frame_version,
        frame.question_version_at_last_update,
        CASE WHEN frame.question_id IS NULL THEN NULL
          ELSE q.version > frame.question_version_at_last_update END AS frame_stale,
        COALESCE(jsonb_array_length(frame.structure->'assumptions') > 0,FALSE) AS has_assumptions,
        COALESCE(jsonb_array_length(frame.structure->'unknowns') > 0,FALSE) AS has_unknowns,
        frame.structure->'uncertainty'->>'level' AS uncertainty_type,
        CASE WHEN frame.question_id IS NULL THEN NULL
          ELSE jsonb_array_length(frame.structure->'assumptions') END AS assumption_count,
        CASE WHEN frame.question_id IS NULL THEN NULL
          ELSE jsonb_array_length(frame.structure->'constraints') END AS constraint_count,
        CASE WHEN frame.question_id IS NULL THEN NULL
          ELSE jsonb_array_length(frame.structure->'unknowns') END AS unknown_count,
        COALESCE(relation_summary.relation_count,0)::text AS relation_count,
        COALESCE(relation_summary.relation_types,ARRAY[]::text[]) AS relation_types
      FROM questions AS q
      LEFT JOIN question_semantic_structures AS frame ON frame.question_id=q.id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS relation_count,
          ARRAY_AGG(DISTINCT relation.type ORDER BY relation.type) AS relation_types
        FROM question_relations AS relation
        WHERE relation.source_question_id=q.id OR relation.target_question_id=q.id
      ) AS relation_summary ON TRUE
      WHERE q.id=$1`,
      [questionId]
    );
    return result.rows[0];
  }
}

function buildFilterClauses(
  filter: NormalizedQuestionFilter,
  bind: (value: unknown) => string
): string[] {
  const clauses: string[] = [
    "NOT EXISTS (SELECT 1 FROM question_moderation_states moderation WHERE moderation.question_id=q.id AND moderation.state='discovery_restricted')"
  ];
  if (filter.status === "active") clauses.push("q.status='published'");
  if (filter.status === "archived") clauses.push("q.status='archived'");
  if (filter.creatorId) clauses.push(`q.creator_id=${bind(filter.creatorId)}`);
  if (filter.createdAfter) clauses.push(`q.created_at>=${bind(filter.createdAfter)}::timestamptz`);
  if (filter.createdBefore)
    clauses.push(`q.created_at<=${bind(filter.createdBefore)}::timestamptz`);
  if (filter.updatedAfter) clauses.push(`q.updated_at>=${bind(filter.updatedAfter)}::timestamptz`);
  if (filter.updatedBefore)
    clauses.push(`q.updated_at<=${bind(filter.updatedBefore)}::timestamptz`);
  if (filter.language) clauses.push(`q.language=${bind(filter.language)}`);
  if (filter.hasFrame !== undefined)
    clauses.push(`frame.question_id IS ${filter.hasFrame ? "NOT " : ""}NULL`);
  if (filter.frameStale !== undefined)
    clauses.push(
      `frame.question_id IS NOT NULL AND q.version ${filter.frameStale ? ">" : "="} frame.question_version_at_last_update`
    );
  if (filter.hasAssumptions !== undefined)
    clauses.push(
      filter.hasAssumptions
        ? "frame.question_id IS NOT NULL AND jsonb_array_length(frame.structure->'assumptions')>0"
        : "(frame.question_id IS NULL OR jsonb_array_length(frame.structure->'assumptions')=0)"
    );
  if (filter.hasUnknowns !== undefined)
    clauses.push(
      filter.hasUnknowns
        ? "frame.question_id IS NOT NULL AND jsonb_array_length(frame.structure->'unknowns')>0"
        : "(frame.question_id IS NULL OR jsonb_array_length(frame.structure->'unknowns')=0)"
    );
  if (filter.uncertaintyType)
    clauses.push(`frame.structure->'uncertainty'->>'level'=${bind(filter.uncertaintyType)}`);
  if (filter.textQuery)
    clauses.push(`q.search_text LIKE ${bind(`%${escapeLike(filter.textQuery)}%`)} ESCAPE '\\'`);
  if (filter.relationType || filter.relatedToQuestionId || filter.relationDirection !== "both")
    clauses.push(buildRelationClause(filter, bind));
  return clauses.length > 0 ? clauses : ["TRUE"];
}

function buildRelationClause(
  filter: NormalizedQuestionFilter,
  bind: (value: unknown) => string
): string {
  const relationClauses: string[] = [];
  if (filter.relationType) relationClauses.push(`relation.type=${bind(filter.relationType)}`);
  relationClauses.push(
    relationEndpointClause(filter.relationDirection, filter.relatedToQuestionId, bind)
  );
  return `EXISTS (SELECT 1 FROM question_relations AS relation WHERE ${relationClauses.join(" AND ")})`;
}

function relationEndpointClause(
  direction: QuestionRelationDirection,
  relatedToQuestionId: string | undefined,
  bind: (value: unknown) => string
): string {
  if (!relatedToQuestionId) {
    if (direction === "both")
      return "(relation.source_question_id=q.id OR relation.target_question_id=q.id)";
    const symmetric = bind(SYMMETRIC_RELATION_TYPES);
    return direction === "outgoing"
      ? `(relation.source_question_id=q.id OR (relation.type=ANY(${symmetric}::text[]) AND relation.target_question_id=q.id))`
      : `(relation.target_question_id=q.id OR (relation.type=ANY(${symmetric}::text[]) AND relation.source_question_id=q.id))`;
  }

  const related = bind(relatedToQuestionId);
  if (direction === "both")
    return `((relation.source_question_id=${related} AND relation.target_question_id=q.id) OR (relation.target_question_id=${related} AND relation.source_question_id=q.id))`;
  const symmetric = bind(SYMMETRIC_RELATION_TYPES);
  return direction === "outgoing"
    ? `((relation.source_question_id=${related} AND relation.target_question_id=q.id) OR (relation.type=ANY(${symmetric}::text[]) AND relation.target_question_id=${related} AND relation.source_question_id=q.id))`
    : `((relation.target_question_id=${related} AND relation.source_question_id=q.id) OR (relation.type=ANY(${symmetric}::text[]) AND relation.source_question_id=${related} AND relation.target_question_id=q.id))`;
}

function toSummary(row: QuestionDiscoveryRow): QuestionSummaryView {
  return {
    id: row.id,
    text: row.text,
    language: row.language,
    status: row.status,
    source: row.source,
    creatorId: row.creator_id ?? undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    version: row.version,
    hasFrame: row.frame_version !== null,
    frameVersion: row.frame_version ?? undefined,
    frameStale: row.frame_stale ?? undefined,
    hasAssumptions: row.has_assumptions,
    hasUnknowns: row.has_unknowns,
    uncertaintyType: row.uncertainty_type ?? undefined,
    relationCount: parseCount(row.relation_count)
  };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseCount(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("Invalid discovery count");
  return parsed;
}

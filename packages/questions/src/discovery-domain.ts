import { createHash } from "node:crypto";
import { QuestionRuntimeError, type QuestionSource, type QuestionStatus } from "./domain.js";
import {
  isQuestionRelationType,
  type QuestionRelationDirection,
  type QuestionRelationType
} from "./relations-domain.js";
import { isQuestionUncertaintyLevel, type QuestionUncertaintyLevel } from "./semantic-domain.js";

export const QUESTION_DISCOVERY_DEFAULT_LIMIT = 20;
export const QUESTION_DISCOVERY_MAX_LIMIT = 100;
export const QUESTION_DISCOVERY_MAX_CURSOR_LENGTH = 512;
export const QUESTION_DISCOVERY_MAX_QUERY_LENGTH = 200;

export const QUESTION_DISCOVERY_SORTS = ["newest", "oldest", "recently_updated"] as const;
export const QUESTION_DISCOVERY_STATUSES = ["active", "archived", "all"] as const;

export type QuestionDiscoverySort = (typeof QUESTION_DISCOVERY_SORTS)[number];
export type QuestionDiscoveryStatus = (typeof QUESTION_DISCOVERY_STATUSES)[number];

export interface QuestionSummaryView {
  readonly id: string;
  readonly text: string;
  readonly language: string;
  readonly status: QuestionStatus;
  readonly source: QuestionSource;
  readonly creatorId: string | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly version: number;
  readonly hasFrame: boolean;
  readonly frameVersion: number | undefined;
  readonly frameStale: boolean | undefined;
  readonly hasAssumptions: boolean;
  readonly hasUnknowns: boolean;
  readonly uncertaintyType: QuestionUncertaintyLevel | undefined;
  readonly relationCount: number;
}

export interface QuestionFrameSummaryView {
  readonly version: number;
  readonly questionVersionAtLastUpdate: number;
  readonly stale: boolean;
  readonly assumptionCount: number;
  readonly constraintCount: number;
  readonly unknownCount: number;
  readonly uncertaintyType: QuestionUncertaintyLevel;
}

export interface QuestionRelationSummaryView {
  readonly count: number;
  readonly types: readonly QuestionRelationType[];
}

export interface QuestionDetailView extends QuestionSummaryView {
  readonly frame: QuestionFrameSummaryView | undefined;
  readonly relations: QuestionRelationSummaryView;
}

export interface QuestionFilter {
  readonly status?: QuestionDiscoveryStatus;
  readonly creatorId?: string;
  readonly createdAfter?: string;
  readonly createdBefore?: string;
  readonly updatedAfter?: string;
  readonly updatedBefore?: string;
  readonly language?: string;
  readonly hasFrame?: boolean;
  readonly frameStale?: boolean;
  readonly hasAssumptions?: boolean;
  readonly hasUnknowns?: boolean;
  /** Prompt 4 stores a controlled uncertainty level, exposed under this compatibility name. */
  readonly uncertaintyType?: QuestionUncertaintyLevel;
  /** Reserved until the semantic model owns a controlled constraint taxonomy. */
  readonly constraintType?: string;
  readonly relationType?: QuestionRelationType;
  readonly relationDirection?: QuestionRelationDirection;
  readonly relatedToQuestionId?: string;
}

export interface ListQuestionsQuery extends QuestionFilter {
  readonly sort?: QuestionDiscoverySort;
  readonly cursor?: string;
  readonly limit?: number;
  readonly correlationId: string;
}

export interface SearchQuestionsQuery extends ListQuestionsQuery {
  readonly textQuery?: string;
}

export interface GetQuestionSummaryQuery {
  readonly questionId: string;
  readonly correlationId: string;
}

export type GetQuestionDetailQuery = GetQuestionSummaryQuery;

export interface QuestionDiscoveryPageView {
  readonly items: readonly QuestionSummaryView[];
  readonly page: {
    readonly nextCursor: string | undefined;
    readonly hasMore: boolean;
    readonly limit: number;
  };
  readonly query: {
    readonly sort: QuestionDiscoverySort;
  };
}

export interface QuestionCursorPosition {
  readonly sortValue: string;
  readonly id: string;
}

export interface NormalizedQuestionFilter {
  readonly status: QuestionDiscoveryStatus;
  readonly creatorId?: string;
  readonly createdAfter?: string;
  readonly createdBefore?: string;
  readonly updatedAfter?: string;
  readonly updatedBefore?: string;
  readonly language?: string;
  readonly hasFrame?: boolean;
  readonly frameStale?: boolean;
  readonly hasAssumptions?: boolean;
  readonly hasUnknowns?: boolean;
  readonly uncertaintyType?: QuestionUncertaintyLevel;
  readonly relationType?: QuestionRelationType;
  readonly relationDirection: QuestionRelationDirection;
  readonly relatedToQuestionId?: string;
  readonly textQuery?: string;
}

export interface QuestionQuerySpec {
  readonly filters: NormalizedQuestionFilter;
  readonly sort: QuestionDiscoverySort;
  readonly fetchLimit: number;
  readonly cursor?: QuestionCursorPosition;
}

export interface NormalizedQuestionQuery {
  readonly spec: QuestionQuerySpec;
  readonly requestedLimit: number;
  readonly queryHash: string;
  readonly filterNames: readonly string[];
}

export function normalizeQuestionQuery(query: SearchQuestionsQuery): NormalizedQuestionQuery {
  validateCorrelationId(query.correlationId);
  const sort = normalizeSort(query.sort);
  const requestedLimit = normalizeLimit(query.limit);
  const status = normalizeStatus(query.status);
  const creatorId = normalizeOptionalIdentifier(
    query.creatorId,
    "creator ID",
    "question_filter_invalid"
  );
  const relatedToQuestionId = normalizeOptionalIdentifier(
    query.relatedToQuestionId,
    "related Question ID",
    "question_relation_filter_invalid"
  );
  const createdAfter = normalizeTimestamp(query.createdAfter, "created_after");
  const createdBefore = normalizeTimestamp(query.createdBefore, "created_before");
  const updatedAfter = normalizeTimestamp(query.updatedAfter, "updated_after");
  const updatedBefore = normalizeTimestamp(query.updatedBefore, "updated_before");
  validateRange(createdAfter, createdBefore, "created");
  validateRange(updatedAfter, updatedBefore, "updated");
  const language = normalizeLanguage(query.language);

  if (query.constraintType !== undefined)
    throw new QuestionRuntimeError(
      "question_constraint_filter_invalid",
      "Constraint type filtering is unavailable because the current semantic model stores untyped constraint statements",
      "validation"
    );
  if (query.hasFrame === false && query.frameStale !== undefined)
    throw new QuestionRuntimeError(
      "question_filter_invalid",
      "frame_stale requires has_frame to be true or omitted",
      "validation"
    );
  if (query.uncertaintyType !== undefined && !isQuestionUncertaintyLevel(query.uncertaintyType))
    throw new QuestionRuntimeError(
      "question_uncertainty_filter_invalid",
      "Invalid Question uncertainty filter",
      "validation"
    );
  if (query.relationType !== undefined && !isQuestionRelationType(query.relationType))
    throw new QuestionRuntimeError(
      "question_relation_filter_invalid",
      "Invalid Question relation type filter",
      "validation"
    );
  const relationDirection = normalizeDirection(query.relationDirection);
  const textQuery = normalizeQuestionSearchText(query.textQuery);

  const filters: NormalizedQuestionFilter = {
    status,
    ...(creatorId ? { creatorId } : {}),
    ...(createdAfter ? { createdAfter } : {}),
    ...(createdBefore ? { createdBefore } : {}),
    ...(updatedAfter ? { updatedAfter } : {}),
    ...(updatedBefore ? { updatedBefore } : {}),
    ...(language ? { language } : {}),
    ...(query.hasFrame === undefined ? {} : { hasFrame: query.hasFrame }),
    ...(query.frameStale === undefined ? {} : { frameStale: query.frameStale }),
    ...(query.hasAssumptions === undefined ? {} : { hasAssumptions: query.hasAssumptions }),
    ...(query.hasUnknowns === undefined ? {} : { hasUnknowns: query.hasUnknowns }),
    ...(query.uncertaintyType ? { uncertaintyType: query.uncertaintyType } : {}),
    ...(query.relationType ? { relationType: query.relationType } : {}),
    relationDirection,
    ...(relatedToQuestionId ? { relatedToQuestionId } : {}),
    ...(textQuery ? { textQuery } : {})
  };
  const queryHash = createQuestionQueryHash(filters, sort);
  const cursor = query.cursor ? decodeQuestionCursor(query.cursor, sort, queryHash) : undefined;
  return {
    spec: {
      filters,
      sort,
      fetchLimit: requestedLimit + 1,
      ...(cursor ? { cursor } : {})
    },
    requestedLimit,
    queryHash,
    filterNames: activeFilterNames(filters)
  };
}

export function normalizeQuestionSearchText(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string")
    throw new QuestionRuntimeError(
      "question_query_invalid",
      "Question search query must be text",
      "validation"
    );
  if ([...value].length > QUESTION_DISCOVERY_MAX_QUERY_LENGTH)
    throw new QuestionRuntimeError(
      "question_query_too_long",
      `Question search query must not exceed ${QUESTION_DISCOVERY_MAX_QUERY_LENGTH} characters`,
      "validation"
    );
  if ([...value].some(isUnsafeSearchCharacter))
    throw new QuestionRuntimeError(
      "question_query_invalid",
      "Question search query contains a control character",
      "validation"
    );
  const normalized = value
    .normalize("NFKC")
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/ـ/gu, "")
    .replace(/[\u200c\u00a0]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
  if ([...normalized].length > QUESTION_DISCOVERY_MAX_QUERY_LENGTH)
    throw new QuestionRuntimeError(
      "question_query_too_long",
      `Normalized Question search query must not exceed ${QUESTION_DISCOVERY_MAX_QUERY_LENGTH} characters`,
      "validation"
    );
  return normalized || undefined;
}

export function createQuestionQueryHash(
  filters: NormalizedQuestionFilter,
  sort: QuestionDiscoverySort
): string {
  return createHash("sha256").update(JSON.stringify({ sort, filters })).digest("hex").slice(0, 24);
}

export function encodeQuestionCursor(input: {
  readonly sort: QuestionDiscoverySort;
  readonly queryHash: string;
  readonly position: QuestionCursorPosition;
}): string {
  validateIdentifier(input.position.id, "cursor Question ID", "question_cursor_invalid");
  validateIsoTimestamp(input.position.sortValue, "question_cursor_invalid", "cursor sort value");
  const payload = {
    v: 1,
    s: input.sort,
    t: input.position.sortValue,
    i: input.position.id,
    h: input.queryHash
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeQuestionCursor(
  cursor: string,
  expectedSort: QuestionDiscoverySort,
  expectedQueryHash: string
): QuestionCursorPosition {
  try {
    if (
      cursor.length < 1 ||
      cursor.length > QUESTION_DISCOVERY_MAX_CURSOR_LENGTH ||
      !/^[A-Za-z0-9_-]+$/.test(cursor)
    )
      throw new Error("invalid cursor encoding");
    const bytes = Buffer.from(cursor, "base64url");
    if (bytes.toString("base64url") !== cursor) throw new Error("non-canonical cursor");
    const value: unknown = JSON.parse(bytes.toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("invalid cursor");
    const payload = value as Record<string, unknown>;
    if (
      Object.keys(payload).sort().join(",") !== "h,i,s,t,v" ||
      payload.v !== 1 ||
      payload.s !== expectedSort ||
      payload.h !== expectedQueryHash ||
      typeof payload.t !== "string" ||
      typeof payload.i !== "string"
    )
      throw new Error("incompatible cursor");
    validateIdentifier(payload.i, "cursor Question ID", "question_cursor_invalid");
    validateIsoTimestamp(payload.t, "question_cursor_invalid", "cursor sort value");
    return { sortValue: payload.t, id: payload.i };
  } catch {
    throw new QuestionRuntimeError(
      "question_cursor_invalid",
      "Question discovery cursor is invalid or incompatible with this query",
      "validation"
    );
  }
}

export function questionSummarySortValue(
  value: QuestionSummaryView,
  sort: QuestionDiscoverySort
): string {
  return sort === "recently_updated" ? value.updatedAt : value.createdAt;
}

export function isQuestionDiscoverySort(value: unknown): value is QuestionDiscoverySort {
  return (
    typeof value === "string" && (QUESTION_DISCOVERY_SORTS as readonly string[]).includes(value)
  );
}

export function isQuestionDiscoveryStatus(value: unknown): value is QuestionDiscoveryStatus {
  return (
    typeof value === "string" && (QUESTION_DISCOVERY_STATUSES as readonly string[]).includes(value)
  );
}

function normalizeSort(value: QuestionDiscoverySort | undefined): QuestionDiscoverySort {
  const sort = value ?? "newest";
  if (!isQuestionDiscoverySort(sort))
    throw new QuestionRuntimeError(
      "question_sort_invalid",
      "Invalid Question discovery sort mode",
      "validation"
    );
  return sort;
}

function normalizeStatus(value: QuestionDiscoveryStatus | undefined): QuestionDiscoveryStatus {
  const status = value ?? "active";
  if (!isQuestionDiscoveryStatus(status))
    throw new QuestionRuntimeError(
      "question_filter_invalid",
      "Invalid Question lifecycle filter",
      "validation"
    );
  return status;
}

function normalizeLimit(value: number | undefined): number {
  const limit = value ?? QUESTION_DISCOVERY_DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > QUESTION_DISCOVERY_MAX_LIMIT)
    throw new QuestionRuntimeError(
      "question_page_size_invalid",
      `Question discovery limit must be between 1 and ${QUESTION_DISCOVERY_MAX_LIMIT}`,
      "validation"
    );
  return limit;
}

function normalizeDirection(
  value: QuestionRelationDirection | undefined
): QuestionRelationDirection {
  const direction = value ?? "both";
  if (direction !== "incoming" && direction !== "outgoing" && direction !== "both")
    throw new QuestionRuntimeError(
      "question_relation_filter_invalid",
      "Invalid Question relation direction filter",
      "validation"
    );
  return direction;
}

function normalizeLanguage(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const language = value.trim();
  if (!/^[a-z]{2,8}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2})?$/.test(language))
    throw new QuestionRuntimeError(
      "question_language_invalid",
      "Invalid Question language filter",
      "validation"
    );
  return language;
}

function normalizeTimestamp(value: string | undefined, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))
    throw new QuestionRuntimeError(
      "question_time_range_invalid",
      `${field} must be an ISO 8601 timestamp with an explicit timezone`,
      "validation"
    );
  return validateIsoTimestamp(value, "question_time_range_invalid", field);
}

function validateIsoTimestamp(value: string, code: string, field: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()))
    throw new QuestionRuntimeError(code, `${field} is invalid`, "validation");
  return parsed.toISOString();
}

function validateRange(after: string | undefined, before: string | undefined, name: string): void {
  if (after && before && after > before)
    throw new QuestionRuntimeError(
      "question_time_range_invalid",
      `${name}_after must not be later than ${name}_before`,
      "validation"
    );
}

function normalizeOptionalIdentifier(
  value: string | undefined,
  label: string,
  code: string
): string | undefined {
  if (value === undefined) return undefined;
  validateIdentifier(value, label, code);
  return value;
}

function validateIdentifier(value: string, label: string, code: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value))
    throw new QuestionRuntimeError(code, `Invalid ${label}`, "validation");
}

function validateCorrelationId(value: string): void {
  validateIdentifier(value, "correlation ID", "question_query_invalid");
}

function isUnsafeSearchCharacter(character: string): boolean {
  const codePoint = character.codePointAt(0)!;
  return (
    codePoint <= 0x08 ||
    codePoint === 0x0b ||
    codePoint === 0x0c ||
    (codePoint >= 0x0e && codePoint <= 0x1f) ||
    (codePoint >= 0x7f && codePoint <= 0x9f) ||
    (codePoint >= 0x202a && codePoint <= 0x202e) ||
    (codePoint >= 0x2066 && codePoint <= 0x2069) ||
    codePoint === 0xfeff
  );
}

function activeFilterNames(filters: NormalizedQuestionFilter): readonly string[] {
  return Object.entries(filters)
    .filter(([name, value]) => {
      if (name === "status") return value !== "active";
      if (name === "relationDirection") return value !== "both";
      return value !== undefined;
    })
    .map(([name]) => name)
    .sort();
}

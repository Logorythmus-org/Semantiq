import { failure, success } from "../../shared/src/index.js";
import type { Result } from "../../shared/src/core-primitives.js";
import type {
  QuestionDetailResult,
  QuestionDiscoveryApplication,
  QuestionDiscoveryResult,
  QuestionReadRepository,
  QuestionSummaryResult
} from "./discovery-contracts.js";
import {
  encodeQuestionCursor,
  type GetQuestionDetailQuery,
  type GetQuestionSummaryQuery,
  normalizeQuestionQuery,
  type QuestionDetailView,
  type QuestionDiscoveryPageView,
  questionSummarySortValue,
  type QuestionSummaryView,
  type SearchQuestionsQuery
} from "./discovery-domain.js";
import { QuestionRuntimeError } from "./domain.js";

export class DiscoverQuestionsHandler {
  private readonly repository: QuestionReadRepository;

  constructor(repository: QuestionReadRepository) {
    this.repository = repository;
  }

  async execute(query: SearchQuestionsQuery): Promise<QuestionDiscoveryResult> {
    try {
      const normalized = normalizeQuestionQuery(query);
      if (
        normalized.spec.filters.relatedToQuestionId &&
        !(await this.repository.questionExists(normalized.spec.filters.relatedToQuestionId))
      )
        throw new QuestionRuntimeError(
          "question_not_found",
          "Related Question not found",
          "not_found"
        );
      const values = normalized.spec.filters.textQuery
        ? await this.repository.searchQuestions(normalized.spec)
        : await this.repository.listQuestions(normalized.spec);
      const hasMore = values.length > normalized.requestedLimit;
      const items = values.slice(0, normalized.requestedLimit);
      const last = items.at(-1);
      const nextCursor =
        hasMore && last
          ? encodeQuestionCursor({
              sort: normalized.spec.sort,
              queryHash: normalized.queryHash,
              position: {
                sortValue: questionSummarySortValue(last, normalized.spec.sort),
                id: last.id
              }
            })
          : undefined;
      return success(
        {
          items,
          page: {
            nextCursor,
            hasMore,
            limit: normalized.requestedLimit
          },
          query: { sort: normalized.spec.sort }
        },
        {
          queryPresent: Boolean(normalized.spec.filters.textQuery),
          normalizedQueryLength: normalized.spec.filters.textQuery
            ? [...normalized.spec.filters.textQuery].length
            : 0,
          filterNames: normalized.filterNames
        }
      );
    } catch (error) {
      return mapDiscoveryError<QuestionDiscoveryPageView>(
        error,
        "Question discovery is temporarily unavailable"
      );
    }
  }
}

export class GetQuestionSummaryHandler {
  private readonly repository: QuestionReadRepository;

  constructor(repository: QuestionReadRepository) {
    this.repository = repository;
  }

  async execute(query: GetQuestionSummaryQuery): Promise<QuestionSummaryResult> {
    return readOne(
      query,
      () => this.repository.getQuestionSummary(query.questionId),
      "Question summary is temporarily unavailable"
    );
  }
}

export class GetQuestionDetailHandler {
  private readonly repository: QuestionReadRepository;

  constructor(repository: QuestionReadRepository) {
    this.repository = repository;
  }

  async execute(query: GetQuestionDetailQuery): Promise<QuestionDetailResult> {
    return readOne(
      query,
      () => this.repository.getQuestionDetail(query.questionId),
      "Question detail is temporarily unavailable"
    );
  }
}

export function createQuestionDiscoveryApplication(dependencies: {
  readonly repository: QuestionReadRepository;
}): QuestionDiscoveryApplication {
  const discover = new DiscoverQuestionsHandler(dependencies.repository);
  const summary = new GetQuestionSummaryHandler(dependencies.repository);
  const detail = new GetQuestionDetailHandler(dependencies.repository);
  return {
    list: (query) => discover.execute(query),
    search: (query) => discover.execute(query),
    getSummary: (query) => summary.execute(query),
    getDetail: (query) => detail.execute(query)
  };
}

async function readOne<T extends QuestionSummaryView | QuestionDetailView>(
  query: GetQuestionSummaryQuery,
  read: () => Promise<T | undefined>,
  infrastructureMessage: string
): Promise<Result<T>> {
  try {
    validateReadQuery(query);
    const value = await read();
    return value
      ? success(value)
      : failure({
          code: "question_not_found",
          message: "Question not found",
          category: "not_found"
        });
  } catch (error) {
    return mapDiscoveryError<T>(error, infrastructureMessage);
  }
}

function validateReadQuery(query: GetQuestionSummaryQuery): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(query.questionId))
    throw new QuestionRuntimeError("question_query_invalid", "Invalid Question ID", "validation");
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(query.correlationId))
    throw new QuestionRuntimeError(
      "question_query_invalid",
      "Invalid correlation ID",
      "validation"
    );
}

function mapDiscoveryError<T>(error: unknown, infrastructureMessage: string): Result<T> {
  if (error instanceof QuestionRuntimeError)
    return failure({
      code: error.code,
      message: error.message,
      category: error.category,
      ...(error.details === undefined ? {} : { details: error.details })
    });
  return failure({
    code: "question_search_unavailable",
    message: infrastructureMessage,
    category: "infrastructure",
    retryable: true
  });
}

import type { Result } from "../../shared/src/core-primitives.js";
import type {
  GetQuestionDetailQuery,
  GetQuestionSummaryQuery,
  ListQuestionsQuery,
  QuestionDetailView,
  QuestionDiscoveryPageView,
  QuestionQuerySpec,
  QuestionSummaryView,
  SearchQuestionsQuery
} from "./discovery-domain.js";

export interface QuestionReadRepository {
  listQuestions(spec: QuestionQuerySpec): Promise<readonly QuestionSummaryView[]>;
  searchQuestions(spec: QuestionQuerySpec): Promise<readonly QuestionSummaryView[]>;
  getQuestionSummary(questionId: string): Promise<QuestionSummaryView | undefined>;
  getQuestionDetail(questionId: string): Promise<QuestionDetailView | undefined>;
  questionExists(questionId: string): Promise<boolean>;
}

export type QuestionDiscoveryResult = Result<QuestionDiscoveryPageView>;
export type QuestionSummaryResult = Result<QuestionSummaryView>;
export type QuestionDetailResult = Result<QuestionDetailView>;

export interface QuestionDiscoveryApplication {
  list(query: ListQuestionsQuery): Promise<QuestionDiscoveryResult>;
  search(query: SearchQuestionsQuery): Promise<QuestionDiscoveryResult>;
  getSummary(query: GetQuestionSummaryQuery): Promise<QuestionSummaryResult>;
  getDetail(query: GetQuestionDetailQuery): Promise<QuestionDetailResult>;
}

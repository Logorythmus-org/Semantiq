import type { QuestionReadRepository } from "./discovery-contracts.js";
import {
  normalizeQuestionSearchText,
  type QuestionDetailView,
  type QuestionDiscoverySort,
  type QuestionQuerySpec,
  type QuestionSummaryView
} from "./discovery-domain.js";
import type { QuestionView } from "./domain.js";
import { MemoryQuestionRepository } from "./memory.js";
import {
  isSymmetricQuestionRelationType,
  type QuestionRelationDirection,
  type QuestionRelationType,
  type QuestionRelationView
} from "./relations-domain.js";
import { MemoryQuestionRelationRepository } from "./relations-memory.js";
import { MemoryQuestionSemanticStructureRepository } from "./semantic-memory.js";
import { createQuestionDiscoveryApplication } from "./discovery-application.js";

export class MemoryQuestionReadRepository implements QuestionReadRepository {
  private readonly questions: MemoryQuestionRepository;
  private readonly structures: MemoryQuestionSemanticStructureRepository | undefined;
  private readonly relations: MemoryQuestionRelationRepository | undefined;

  constructor(dependencies: {
    readonly questions: MemoryQuestionRepository;
    readonly structures?: MemoryQuestionSemanticStructureRepository;
    readonly relations?: MemoryQuestionRelationRepository;
  }) {
    this.questions = dependencies.questions;
    this.structures = dependencies.structures;
    this.relations = dependencies.relations;
  }

  async listQuestions(spec: QuestionQuerySpec): Promise<readonly QuestionSummaryView[]> {
    return this.discover(spec);
  }

  async searchQuestions(spec: QuestionQuerySpec): Promise<readonly QuestionSummaryView[]> {
    return this.discover(spec);
  }

  async getQuestionSummary(questionId: string): Promise<QuestionSummaryView | undefined> {
    const question = this.questions.snapshot().get(questionId);
    return question ? this.toSummary(question) : undefined;
  }

  async getQuestionDetail(questionId: string): Promise<QuestionDetailView | undefined> {
    const question = this.questions.snapshot().get(questionId);
    if (!question) return undefined;
    const summary = this.toSummary(question);
    const frame = this.structures?.snapshot().get(questionId);
    const relations = this.relationValues().filter(
      (relation) =>
        relation.sourceQuestionId === questionId || relation.targetQuestionId === questionId
    );
    return {
      ...summary,
      frame: frame
        ? {
            version: frame.version,
            questionVersionAtLastUpdate: frame.questionVersionAtLastUpdate,
            stale: question.version > frame.questionVersionAtLastUpdate,
            assumptionCount: frame.assumptions.length,
            constraintCount: frame.constraints.length,
            unknownCount: frame.unknowns.length,
            uncertaintyType: frame.uncertainty.level
          }
        : undefined,
      relations: {
        count: relations.length,
        types: [...new Set(relations.map((relation) => relation.type))].sort()
      }
    };
  }

  async questionExists(questionId: string): Promise<boolean> {
    return this.questions.snapshot().has(questionId);
  }

  private discover(spec: QuestionQuerySpec): readonly QuestionSummaryView[] {
    return [...this.questions.snapshot().values()]
      .map((question) => this.toSummary(question))
      .filter((question) => this.matches(question, spec))
      .sort((left, right) => compareSummaries(left, right, spec.sort))
      .filter((question) => isAfterCursor(question, spec))
      .slice(0, spec.fetchLimit);
  }

  private toSummary(question: QuestionView): QuestionSummaryView {
    const frame = this.structures?.snapshot().get(question.id);
    const relationCount = this.relationValues().filter(
      (relation) =>
        relation.sourceQuestionId === question.id || relation.targetQuestionId === question.id
    ).length;
    return {
      id: question.id,
      text: question.text,
      language: question.language,
      status: question.status,
      source: question.source,
      creatorId: question.creatorId,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      version: question.version,
      hasFrame: Boolean(frame),
      frameVersion: frame?.version,
      frameStale: frame ? question.version > frame.questionVersionAtLastUpdate : undefined,
      hasAssumptions: Boolean(frame?.assumptions.length),
      hasUnknowns: Boolean(frame?.unknowns.length),
      uncertaintyType: frame?.uncertainty.level,
      relationCount
    };
  }

  private matches(question: QuestionSummaryView, spec: QuestionQuerySpec): boolean {
    const filter = spec.filters;
    if (filter.status === "active" && question.status !== "published") return false;
    if (filter.status === "archived" && question.status !== "archived") return false;
    if (filter.creatorId && question.creatorId !== filter.creatorId) return false;
    if (filter.createdAfter && question.createdAt < filter.createdAfter) return false;
    if (filter.createdBefore && question.createdAt > filter.createdBefore) return false;
    if (filter.updatedAfter && question.updatedAt < filter.updatedAfter) return false;
    if (filter.updatedBefore && question.updatedAt > filter.updatedBefore) return false;
    if (filter.language && question.language !== filter.language) return false;
    if (filter.hasFrame !== undefined && question.hasFrame !== filter.hasFrame) return false;
    if (filter.frameStale !== undefined && question.frameStale !== filter.frameStale) return false;
    if (filter.hasAssumptions !== undefined && question.hasAssumptions !== filter.hasAssumptions)
      return false;
    if (filter.hasUnknowns !== undefined && question.hasUnknowns !== filter.hasUnknowns)
      return false;
    if (filter.uncertaintyType && question.uncertaintyType !== filter.uncertaintyType) return false;
    if (filter.textQuery && !normalizeQuestionSearchText(question.text)?.includes(filter.textQuery))
      return false;
    if (
      (filter.relationType || filter.relatedToQuestionId || filter.relationDirection !== "both") &&
      !this.matchesRelation(
        question.id,
        filter.relationType,
        filter.relationDirection,
        filter.relatedToQuestionId
      )
    )
      return false;
    return true;
  }

  private matchesRelation(
    candidateId: string,
    relationType: QuestionRelationType | undefined,
    direction: QuestionRelationDirection,
    relatedToQuestionId: string | undefined
  ): boolean {
    return this.relationValues().some((relation) => {
      if (relationType && relation.type !== relationType) return false;
      const referenceId = relatedToQuestionId ?? candidateId;
      const neighborId = relatedToQuestionId ? candidateId : undefined;
      return relationMatchesDirection(relation, referenceId, direction, neighborId);
    });
  }

  private relationValues(): readonly QuestionRelationView[] {
    return this.relations ? [...this.relations.snapshot().values()] : [];
  }
}

export function createMemoryQuestionDiscoveryApplication(dependencies: {
  readonly questions: MemoryQuestionRepository;
  readonly structures?: MemoryQuestionSemanticStructureRepository;
  readonly relations?: MemoryQuestionRelationRepository;
}) {
  const repository = new MemoryQuestionReadRepository(dependencies);
  return {
    repository,
    application: createQuestionDiscoveryApplication({ repository })
  };
}

function relationMatchesDirection(
  relation: QuestionRelationView,
  referenceId: string,
  direction: QuestionRelationDirection,
  requiredNeighborId?: string
): boolean {
  const symmetric = isSymmetricQuestionRelationType(relation.type);
  let neighbor: string | undefined;
  if (relation.sourceQuestionId === referenceId && (direction !== "incoming" || symmetric))
    neighbor = relation.targetQuestionId;
  if (relation.targetQuestionId === referenceId && (direction !== "outgoing" || symmetric))
    neighbor = relation.sourceQuestionId;
  return (
    neighbor !== undefined && (requiredNeighborId === undefined || neighbor === requiredNeighborId)
  );
}

function compareSummaries(
  left: QuestionSummaryView,
  right: QuestionSummaryView,
  sort: QuestionDiscoverySort
): number {
  const leftValue = sort === "recently_updated" ? left.updatedAt : left.createdAt;
  const rightValue = sort === "recently_updated" ? right.updatedAt : right.createdAt;
  const direction = sort === "oldest" ? 1 : -1;
  return (
    compareText(leftValue, rightValue) * direction || compareText(left.id, right.id) * direction
  );
}

function isAfterCursor(question: QuestionSummaryView, spec: QuestionQuerySpec): boolean {
  if (!spec.cursor) return true;
  const value = spec.sort === "recently_updated" ? question.updatedAt : question.createdAt;
  const direction = spec.sort === "oldest" ? 1 : -1;
  const comparison =
    compareText(value, spec.cursor.sortValue) * direction ||
    compareText(question.id, spec.cursor.id) * direction;
  return comparison > 0;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

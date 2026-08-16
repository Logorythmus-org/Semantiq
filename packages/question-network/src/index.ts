export type * from "./contracts.js";

import type {
  CreateQuestionInput,
  Question,
  QuestionDiscoveryQuery,
  QuestionFeedItem,
  QuestionNetworkRepository,
  QuestionNetworkService,
  QuestionProfile,
  QuestionRelation
} from "./contracts.js";

const createId = (prefix: string): string =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export class LocalQuestionNetworkRepository implements QuestionNetworkRepository {
  private readonly questions = new Map<string, Question>();
  private readonly profiles = new Map<string, QuestionProfile>();
  private readonly relations = new Map<string, QuestionRelation>();

  async saveQuestion(question: Question): Promise<void> {
    this.questions.set(question.id, question);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async saveProfile(profile: QuestionProfile): Promise<void> {
    this.profiles.set(profile.questionId, profile);
  }

  async getProfile(questionId: string): Promise<QuestionProfile | undefined> {
    return this.profiles.get(questionId);
  }

  async saveRelation(relation: QuestionRelation): Promise<void> {
    this.relations.set(relation.id, relation);
  }

  async listRelations(questionId: string): Promise<readonly QuestionRelation[]> {
    return [...this.relations.values()].filter(
      (relation) => relation.sourceQuestionId === questionId || relation.targetId === questionId
    );
  }

  listQuestions(): readonly Question[] {
    return [...this.questions.values()];
  }
}

export class LocalQuestionNetworkService implements QuestionNetworkService {
  constructor(
    private readonly repository: LocalQuestionNetworkRepository = new LocalQuestionNetworkRepository()
  ) {}

  async createQuestion(input: CreateQuestionInput): Promise<Question> {
    const now = new Date().toISOString();
    const question: Question = {
      id: createId("question"),
      title: input.title,
      summary: input.summary,
      description: input.description,
      intent: input.intent,
      type: input.type,
      category: input.category,
      difficulty: "unknown",
      researchPotential: 0,
      scientificPotential: 0,
      status: "draft",
      language: input.language,
      visibility: input.visibility,
      creatorId: input.creatorId,
      contributorIds: [input.creatorId],
      createdAt: now,
      updatedAt: now,
      versionHistoryIds: [],
      benchmarkHistoryIds: [],
      evidenceIds: [],
      observationIds: [],
      hypothesisIds: [],
      experimentIds: [],
      linkedQuestionIds: [],
      linkedProjectIds: [],
      linkedPaperIds: [],
      linkedDiscussionIds: [],
      linkedGameIds: [],
      linkedNarrativeIds: [],
      semanticTags: input.semanticTags,
      graphLinkIds: [],
      agentNoteIds: [],
      aiSuggestionIds: []
    };
    await this.repository.saveQuestion(question);
    return question;
  }

  async publishQuestion(questionId: string): Promise<Question> {
    return this.transition(questionId, "published");
  }

  async archiveQuestion(questionId: string): Promise<Question> {
    return this.transition(questionId, "archive");
  }

  async linkQuestion(relation: QuestionRelation): Promise<void> {
    await this.repository.saveRelation(relation);
  }

  async searchQuestions(query: string, limit: number): Promise<readonly Question[]> {
    const text = query.toLowerCase();
    return this.repository
      .listQuestions()
      .filter(
        (question) =>
          question.title.toLowerCase().includes(text) ||
          question.summary.toLowerCase().includes(text) ||
          question.semanticTags.some((tag) => tag.toLowerCase().includes(text))
      )
      .slice(0, limit);
  }

  async recommendQuestions(query: QuestionDiscoveryQuery): Promise<readonly QuestionFeedItem[]> {
    return this.repository
      .listQuestions()
      .filter(
        (question) =>
          !query.tags?.length || query.tags.some((tag) => question.semanticTags.includes(tag))
      )
      .slice(0, query.limit)
      .map((question, index) => ({
        questionId: question.id,
        rank: index + 1,
        qualitySignals: {
          scientificPotential: question.scientificPotential,
          researchPotential: question.researchPotential
        },
        reason: `Selected for ${query.mode}`
      }));
  }

  private async transition(questionId: string, status: Question["status"]): Promise<Question> {
    const question = await this.repository.getQuestion(questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }
    const updated = { ...question, status, updatedAt: new Date().toISOString() };
    await this.repository.saveQuestion(updated);
    return updated;
  }
}

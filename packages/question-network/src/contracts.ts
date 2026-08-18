export type QuestionType =
  | "open"
  | "research"
  | "scientific"
  | "educational"
  | "engineering"
  | "business"
  | "design"
  | "programming"
  | "ethical"
  | "historical"
  | "creative"
  | "personal-reflection"
  | "prediction"
  | "challenge"
  | "mystery"
  | "meta";

export type QuestionStatus =
  | "idea"
  | "draft"
  | "published"
  | "discussion"
  | "evidence-collection"
  | "research"
  | "experiment"
  | "project"
  | "publication"
  | "archive";

export type QuestionVisibility =
  | "private"
  | "shared"
  | "team"
  | "organization"
  | "public"
  | "anonymous";

export type QuestionRelationType =
  | "extends"
  | "duplicates"
  | "contradicts"
  | "depends_on"
  | "supports"
  | "generalizes"
  | "specializes"
  | "derived_from"
  | "alternative_to"
  | "part_of"
  | "causes"
  | "explains"
  | "future_work";

export type DiscussionContributionType =
  | "question"
  | "counter-question"
  | "observation"
  | "evidence"
  | "reference"
  | "experiment"
  | "hypothesis"
  | "idea"
  | "challenge"
  | "review";

export interface Question {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly intent: string;
  readonly type: QuestionType;
  readonly category: string;
  readonly difficulty: "beginner" | "intermediate" | "advanced" | "expert" | "unknown";
  readonly researchPotential: number;
  readonly scientificPotential: number;
  readonly status: QuestionStatus;
  readonly language: string;
  readonly visibility: QuestionVisibility;
  readonly creatorId: string;
  readonly contributorIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly versionHistoryIds: readonly string[];
  readonly benchmarkHistoryIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly observationIds: readonly string[];
  readonly hypothesisIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly linkedQuestionIds: readonly string[];
  readonly linkedProjectIds: readonly string[];
  readonly linkedPaperIds: readonly string[];
  readonly linkedDiscussionIds: readonly string[];
  readonly linkedGameIds: readonly string[];
  readonly linkedNarrativeIds: readonly string[];
  readonly semanticTags: readonly string[];
  readonly graphLinkIds: readonly string[];
  readonly agentNoteIds: readonly string[];
  readonly aiSuggestionIds: readonly string[];
}

export interface QuestionProfile {
  readonly questionId: string;
  readonly summary: string;
  readonly context: string;
  readonly evidenceIds: readonly string[];
  readonly counterEvidenceIds: readonly string[];
  readonly openProblems: readonly string[];
  readonly unknowns: readonly string[];
  readonly assumptions: readonly string[];
  readonly dependencies: readonly string[];
  readonly contradictions: readonly string[];
  readonly relatedQuestionIds: readonly string[];
  readonly relatedProjectIds: readonly string[];
  readonly relatedPaperIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly timelineEventIds: readonly string[];
  readonly aiInsightIds: readonly string[];
  readonly futureDirections: readonly string[];
  readonly health:
    | "healthy"
    | "needs-evidence"
    | "contradictory"
    | "stale"
    | "high-potential"
    | "unknown";
}

export interface QuestionRelation {
  readonly id: string;
  readonly sourceQuestionId: string;
  readonly targetId: string;
  readonly type: QuestionRelationType;
  readonly confidence: number;
  readonly evidenceIds: readonly string[];
  readonly creatorId: string;
  readonly timestamp: string;
  readonly version: string;
  readonly explanation: string;
}

export interface DiscussionContribution {
  readonly id: string;
  readonly questionId: string;
  readonly type: DiscussionContributionType;
  readonly authorId: string;
  readonly knowledgeObjectId: string;
  readonly relationIds: readonly string[];
  readonly createdAt: string;
}

export interface QuestionDiscoveryQuery {
  readonly mode:
    | "newest"
    | "trending"
    | "nearby-topics"
    | "scientific-potential"
    | "highest-uncertainty"
    | "recently-updated"
    | "most-connected"
    | "most-researched"
    | "most-benchmarked"
    | "unanswered"
    | "needs-evidence"
    | "needs-collaboration"
    | "ai-recommended";
  readonly tags?: readonly string[];
  readonly limit: number;
}

export interface QuestionFeedItem {
  readonly questionId: string;
  readonly rank: number;
  readonly qualitySignals: Readonly<Record<string, number>>;
  readonly reason: string;
}

export interface QuestionModerationCase {
  readonly id: string;
  readonly questionId: string;
  readonly flags: readonly string[];
  readonly aiAssistanceSummary?: string;
  readonly humanDecision?:
    | "pending"
    | "approved"
    | "needs-clarification"
    | "merged"
    | "restricted"
    | "archived";
  readonly auditIds: readonly string[];
}

export interface QuestionAnalyticsSnapshot {
  readonly questionId: string;
  readonly quality: number;
  readonly researchPotential: number;
  readonly scientificPotential: number;
  readonly uncertainty: number;
  readonly evidenceCoverage: number;
  readonly contradictionCount: number;
  readonly relationCount: number;
  readonly benchmarkProgress: number;
  readonly collaborationNeed: number;
  readonly profileHealth: string;
}

export interface QuestionCreatedPayload {
  readonly questionId: string;
  readonly creatorId: string;
  readonly title: string;
  readonly type: QuestionType;
}

export interface QuestionNetworkRepository {
  saveQuestion(question: Question): Promise<void>;
  getQuestion(id: string): Promise<Question | undefined>;
  saveProfile(profile: QuestionProfile): Promise<void>;
  getProfile(questionId: string): Promise<QuestionProfile | undefined>;
  saveRelation(relation: QuestionRelation): Promise<void>;
  listRelations(questionId: string): Promise<readonly QuestionRelation[]>;
}

export interface CreateQuestionInput {
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly intent: string;
  readonly type: QuestionType;
  readonly category: string;
  readonly language: string;
  readonly visibility: QuestionVisibility;
  readonly creatorId: string;
  readonly semanticTags: readonly string[];
}

export interface QuestionNetworkService {
  createQuestion(input: CreateQuestionInput): Promise<Question>;
  publishQuestion(questionId: string, actorId: string): Promise<Question>;
  archiveQuestion(questionId: string, actorId: string): Promise<Question>;
  linkQuestion(relation: QuestionRelation): Promise<void>;
  searchQuestions(query: string, limit: number): Promise<readonly Question[]>;
  recommendQuestions(query: QuestionDiscoveryQuery): Promise<readonly QuestionFeedItem[]>;
}

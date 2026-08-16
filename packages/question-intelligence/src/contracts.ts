export type QuestionIntent =
  | "research"
  | "learning"
  | "engineering"
  | "creative"
  | "scientific"
  | "business"
  | "ethical"
  | "historical"
  | "personal-reflection"
  | "game-design"
  | "project-creation";

export type SuggestionStatus = "proposed" | "approved" | "rejected" | "applied";
export type AgentRole =
  | "question-refiner"
  | "intent"
  | "ambiguity"
  | "assumption"
  | "evidence"
  | "relation"
  | "duplicate"
  | "hypothesis"
  | "experiment"
  | "project"
  | "game"
  | "review";

export interface QuestionRefinementRequest {
  readonly id: string;
  readonly rawInput: string;
  readonly languageHint?: string;
  readonly workspaceId?: string;
  readonly actorId: string;
  readonly contextObjectIds: readonly string[];
}

export interface IntelligenceSuggestion<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly status: SuggestionStatus;
  readonly confidence: number;
  readonly explanation: string;
  readonly payload: TPayload;
  readonly createdAt: string;
  readonly auditId?: string;
}

export interface IntentAnalysis {
  readonly intents: readonly {
    readonly intent: QuestionIntent;
    readonly confidence: number;
    readonly explanation: string;
  }[];
}

export interface AmbiguityReport {
  readonly ambiguities: readonly {
    readonly area:
      | "terms"
      | "scope"
      | "context"
      | "assumptions"
      | "time"
      | "domain"
      | "audience"
      | "goal"
      | "evidence"
      | "definitions";
    readonly explanation: string;
    readonly clarificationQuestion: string;
    readonly confidence: number;
  }[];
}

export interface AssumptionReport {
  readonly assumptions: readonly {
    readonly type:
      | "definition"
      | "causal"
      | "cultural"
      | "scientific"
      | "historical"
      | "technical"
      | "ethical"
      | "personal";
    readonly statement: string;
    readonly explanation: string;
    readonly confidence: number;
  }[];
}

export interface SemanticTagSuggestion {
  readonly tag: string;
  readonly layer:
    | "domain"
    | "intent"
    | "difficulty"
    | "method"
    | "scientific"
    | "educational"
    | "risk"
    | "project"
    | "game"
    | "language";
  readonly confidence: number;
  readonly explanation: string;
}

export interface DuplicateCandidate {
  readonly questionId: string;
  readonly similarity: number;
  readonly reason: string;
  readonly suggestedAction: "link" | "merge" | "fork" | "differentiate" | "archive";
}

export interface RelationSuggestion {
  readonly targetId: string;
  readonly relation:
    | "supports"
    | "contradicts"
    | "extends"
    | "duplicates"
    | "depends_on"
    | "generalizes"
    | "specializes"
    | "derived_from"
    | "alternative_to"
    | "part_of"
    | "future_work";
  readonly confidence: number;
  readonly explanation: string;
}

export interface EvidenceSuggestion {
  readonly type:
    | "paper"
    | "book"
    | "dataset"
    | "experiment"
    | "historical-source"
    | "expert-opinion"
    | "repository"
    | "case-study"
    | "observation"
    | "user-experience"
    | "open-question";
  readonly searchStrategy: string;
  readonly confidence: number;
  readonly fabricated: false;
}

export interface HypothesisSuggestion {
  readonly hypothesis: string;
  readonly variables: readonly string[];
  readonly expectedObservations: readonly string[];
  readonly risks: readonly string[];
  readonly limitations: readonly string[];
}

export interface ExperimentSuggestion {
  readonly design:
    | "observation"
    | "comparison"
    | "simulation"
    | "prototype"
    | "survey"
    | "dataset-analysis"
    | "literature-review"
    | "user-study"
    | "benchmark-test"
    | "reproducibility-check";
  readonly description: string;
  readonly feasibilityNotes: readonly string[];
}

export interface QuestionToProjectPlan {
  readonly title: string;
  readonly goal: string;
  readonly researchPlan: readonly string[];
  readonly milestones: readonly string[];
  readonly tasks: readonly string[];
  readonly requiredData: readonly string[];
  readonly requiredTools: readonly string[];
  readonly agentsNeeded: readonly AgentRole[];
  readonly expectedOutputs: readonly string[];
  readonly risks: readonly string[];
  readonly successCriteria: readonly string[];
}

export interface QuestionToGamePlan {
  readonly concept: string;
  readonly learningGoal: string;
  readonly players: string;
  readonly rules: readonly string[];
  readonly cards: readonly string[];
  readonly challenges: readonly string[];
  readonly scoring: string;
  readonly narrative: string;
  readonly reflection: string;
  readonly educationalOutcome: string;
}

export interface SemantiqPreview {
  readonly questionQuality: number;
  readonly clarity: number;
  readonly novelty: number;
  readonly scientificPotential: number;
  readonly evidenceGap: number;
  readonly ambiguity: number;
  readonly risk: number;
  readonly suggestedImprovements: readonly string[];
  readonly finalBenchmark: false;
}

export interface QuestionRefinementResult {
  readonly requestId: string;
  readonly originalQuestion: string;
  readonly detectedLanguage: string;
  readonly detectedIntent: IntentAnalysis;
  readonly improvedVersion: IntelligenceSuggestion<{ question: string }>;
  readonly alternativeVersions: readonly IntelligenceSuggestion<{
    label: string;
    question: string;
  }>[];
  readonly ambiguityReport: AmbiguityReport;
  readonly assumptionReport: AssumptionReport;
  readonly suggestedTags: readonly IntelligenceSuggestion<SemanticTagSuggestion>[];
  readonly duplicateCandidates: readonly IntelligenceSuggestion<DuplicateCandidate>[];
  readonly relationSuggestions: readonly IntelligenceSuggestion<RelationSuggestion>[];
  readonly evidenceSuggestions: readonly IntelligenceSuggestion<EvidenceSuggestion>[];
  readonly semantiqPreview: SemantiqPreview;
}

export interface IntelligenceAgent {
  readonly role: AgentRole;
  readonly purpose: string;
  readonly permissions: readonly string[];
  readonly failureModes: readonly string[];
  readonly evaluationCriteria: readonly string[];
}

export interface PromptTemplate {
  readonly id: string;
  readonly version: string;
  readonly path: string;
}

export interface QuestionIntelligenceEvent {
  readonly type:
    | "QuestionRefinementStarted"
    | "QuestionRefinementCompleted"
    | "IntentDetected"
    | "AmbiguityDetected"
    | "AssumptionDetected"
    | "TagsSuggested"
    | "DuplicateDetected"
    | "RelationSuggested"
    | "EvidenceSuggested"
    | "HypothesisGenerated"
    | "ExperimentSuggested"
    | "ProjectSuggested"
    | "GameSuggested"
    | "SuggestionApproved"
    | "SuggestionRejected"
    | "QuestionImproved";
  readonly version: number;
  readonly occurredAt: string;
  readonly requestId?: string;
  readonly suggestionId?: string;
  readonly payload: unknown;
}

export interface QuestionIntelligenceEngine {
  refineQuestion(request: QuestionRefinementRequest): Promise<QuestionRefinementResult>;
  extractIntent(question: string): Promise<IntentAnalysis>;
  analyzeAmbiguity(question: string): Promise<AmbiguityReport>;
  detectAssumptions(question: string): Promise<AssumptionReport>;
  suggestTags(question: string): Promise<readonly SemanticTagSuggestion[]>;
  analyzeQuestion(question: string): Promise<QuestionRefinementResult>;
  improveQuestion(question: string): Promise<IntelligenceSuggestion<{ question: string }>>;
  detectDuplicates(
    question: string,
    candidates: readonly { readonly id: string; readonly text: string }[]
  ): Promise<readonly DuplicateCandidate[]>;
  findKnowledgeGaps(question: string): Promise<readonly string[]>;
  suggestResearch(question: string): Promise<readonly string[]>;
  suggestProjects(question: string): Promise<readonly QuestionToProjectPlan[]>;
  suggestNarratives(question: string): Promise<readonly string[]>;
  suggestCommunities(question: string): Promise<readonly string[]>;
  generateSemantiqPreview(question: string): Promise<SemantiqPreview>;
  approveSuggestion(suggestionId: string, actorId: string): Promise<IntelligenceSuggestion>;
  rejectSuggestion(
    suggestionId: string,
    actorId: string,
    reason: string
  ): Promise<IntelligenceSuggestion>;
}

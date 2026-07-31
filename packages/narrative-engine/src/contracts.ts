export type NarrativeStructure =
  | "linear"
  | "branching"
  | "interactive"
  | "investigation"
  | "scientific-mystery"
  | "historical-reconstruction"
  | "engineering-challenge"
  | "business-simulation"
  | "ethical-dilemma"
  | "open-exploration"
  | "collaborative"
  | "ai-generated";

export type GameType =
  | "card-game"
  | "board-game"
  | "digital-game"
  | "mobile-game"
  | "tabletop-rpg"
  | "puzzle"
  | "escape-room"
  | "quiz"
  | "simulation"
  | "cooperative-mission"
  | "scientific-investigation"
  | "debate-game"
  | "creative-challenge";

export interface LearningGoal {
  readonly id: string;
  readonly description: string;
  readonly measurableOutcome: string;
  readonly assessmentMethod: string;
}

export interface Narrative {
  readonly id: string;
  readonly sourceQuestionIds: readonly string[];
  readonly title: string;
  readonly structure: NarrativeStructure;
  readonly storyArcIds: readonly string[];
  readonly sceneIds: readonly string[];
  readonly characterIds: readonly string[];
  readonly learningGoalIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly editable: boolean;
  readonly published: boolean;
}

export interface StoryArc {
  readonly id: string;
  readonly narrativeId: string;
  readonly conflict: string;
  readonly objective: string;
  readonly choiceIds: readonly string[];
  readonly consequenceIds: readonly string[];
}

export interface Scene {
  readonly id: string;
  readonly narrativeId: string;
  readonly title: string;
  readonly dialogueIds: readonly string[];
  readonly challengeIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly reflectionIds: readonly string[];
}

export interface Character {
  readonly id: string;
  readonly narrativeId: string;
  readonly name: string;
  readonly roleId: string;
  readonly perspective: string;
}

export interface PlayerRole {
  readonly id: string;
  readonly name:
    | "scientist"
    | "engineer"
    | "historian"
    | "teacher"
    | "student"
    | "journalist"
    | "philosopher"
    | "explorer"
    | "investor"
    | "policy-maker"
    | "researcher"
    | "detective"
    | "ai-assistant"
    | "custom";
  readonly knowledge: readonly string[];
  readonly goals: readonly string[];
  readonly limitations: readonly string[];
  readonly abilities: readonly string[];
  readonly responsibilities: readonly string[];
}

export interface QuestionCard {
  readonly id: string;
  readonly sourceQuestionId: string;
  readonly context: string;
  readonly difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  readonly evidenceIds: readonly string[];
  readonly hint: string;
  readonly unknowns: readonly string[];
  readonly tags: readonly string[];
  readonly relatedQuestionIds: readonly string[];
  readonly reflectionPromptId: string;
  readonly nextQuestionId?: string;
}

export interface KnowledgeCard {
  readonly id: string;
  readonly concept: string;
  readonly explanation: string;
  readonly examples: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly relationIds: readonly string[];
  readonly difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  readonly visualIds: readonly string[];
  readonly referenceIds: readonly string[];
  readonly benchmarkId?: string;
}

export interface DecisionPoint {
  readonly id: string;
  readonly type: "trade-off" | "ethics" | "resource-management" | "scientific" | "engineering" | "strategic" | "social";
  readonly prompt: string;
  readonly optionIds: readonly string[];
  readonly consequenceIds: readonly string[];
}

export interface ReflectionPrompt {
  readonly id: string;
  readonly sourceObjectId: string;
  readonly questions: readonly string[];
  readonly discussionTopics: readonly string[];
  readonly evidenceReview: readonly string[];
  readonly futureQuestionIds: readonly string[];
}

export interface EducationalGame {
  readonly id: string;
  readonly type: GameType;
  readonly sourceQuestionIds: readonly string[];
  readonly narrativeId: string;
  readonly players: string;
  readonly roleIds: readonly string[];
  readonly rules: readonly string[];
  readonly objectives: readonly string[];
  readonly challengeIds: readonly string[];
  readonly cardIds: readonly string[];
  readonly resourceIds: readonly string[];
  readonly actions: readonly string[];
  readonly scoring: string;
  readonly learningGoalIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly replayability: string;
  readonly difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  readonly benchmarkIds: readonly string[];
  readonly knowledgeOutcomeIds: readonly string[];
  readonly published: boolean;
}

export interface NarrativeAgentRole {
  readonly role:
    | "narrative"
    | "story-planner"
    | "character"
    | "dialogue"
    | "game-designer"
    | "rule-generator"
    | "puzzle"
    | "reflection"
    | "teacher"
    | "difficulty-balancer"
    | "localization"
    | "accessibility";
  readonly purpose: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly failureModes: readonly string[];
  readonly evaluationCriteria: readonly string[];
}

export interface NarrativeEngineRepository {
  saveNarrative(narrative: Narrative): Promise<void>;
  getNarrative(narrativeId: string): Promise<Narrative | undefined>;
  saveGame(game: EducationalGame): Promise<void>;
  getGame(gameId: string): Promise<EducationalGame | undefined>;
}

export interface NarrativeEngineService {
  createNarrative(narrative: Narrative): Promise<void>;
  createGame(game: EducationalGame): Promise<void>;
  convertQuestionToNarrative(questionId: string, title: string): Promise<Narrative>;
  convertNarrativeToGame(narrativeId: string, type: GameType): Promise<EducationalGame>;
  publishGame(gameId: string, approvedBy: string): Promise<EducationalGame>;
}

export interface NarrativeEngineEvent {
  readonly type:
    | "NarrativeCreated"
    | "StoryGenerated"
    | "GameGenerated"
    | "RoleAssigned"
    | "ChallengeCompleted"
    | "ReflectionCreated"
    | "LearningMilestone"
    | "NarrativeBenchmarked"
    | "GamePublished"
    | "KnowledgeExpanded"
    | "NewQuestionGenerated";
  readonly version: number;
  readonly occurredAt: string;
  readonly narrativeId?: string;
  readonly gameId?: string;
  readonly payload: unknown;
}

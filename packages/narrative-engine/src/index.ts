export type * from "./contracts.js";

import type {
  EducationalGame,
  GameType,
  Narrative,
  NarrativeEngineRepository,
  NarrativeEngineService
} from "./contracts.js";

const createId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export class LocalNarrativeEngineRepository implements NarrativeEngineRepository {
  private readonly narratives = new Map<string, Narrative>();
  private readonly games = new Map<string, EducationalGame>();

  async saveNarrative(narrative: Narrative): Promise<void> {
    this.narratives.set(narrative.id, narrative);
  }

  async getNarrative(narrativeId: string): Promise<Narrative | undefined> {
    return this.narratives.get(narrativeId);
  }

  async saveGame(game: EducationalGame): Promise<void> {
    this.games.set(game.id, game);
  }

  async getGame(gameId: string): Promise<EducationalGame | undefined> {
    return this.games.get(gameId);
  }
}

export class LocalNarrativeEngineService implements NarrativeEngineService {
  constructor(private readonly repository: NarrativeEngineRepository = new LocalNarrativeEngineRepository()) {}

  async createNarrative(narrative: Narrative): Promise<void> {
    if (narrative.sourceQuestionIds.length === 0) {
      throw new Error("Narratives must originate from at least one question");
    }
    await this.repository.saveNarrative(narrative);
  }

  async createGame(game: EducationalGame): Promise<void> {
    if (game.sourceQuestionIds.length === 0) {
      throw new Error("Games must preserve source-question traceability");
    }
    await this.repository.saveGame(game);
  }

  async convertQuestionToNarrative(questionId: string, title: string): Promise<Narrative> {
    const narrative: Narrative = {
      id: createId("narrative"),
      sourceQuestionIds: [questionId],
      title,
      structure: "interactive",
      storyArcIds: [],
      sceneIds: [],
      characterIds: [],
      learningGoalIds: [],
      benchmarkIds: [],
      editable: true,
      published: false
    };
    await this.createNarrative(narrative);
    return narrative;
  }

  async convertNarrativeToGame(narrativeId: string, type: GameType): Promise<EducationalGame> {
    const narrative = await this.requiredNarrative(narrativeId);
    const game: EducationalGame = {
      id: createId("game"),
      type,
      sourceQuestionIds: narrative.sourceQuestionIds,
      narrativeId,
      players: "1+",
      roleIds: [],
      rules: [],
      objectives: [],
      challengeIds: [],
      cardIds: [],
      resourceIds: [],
      actions: [],
      scoring: "Scoring must reinforce learning goals and reflection.",
      learningGoalIds: narrative.learningGoalIds,
      reflectionIds: [],
      replayability: "Replay by exploring alternative decisions and reflections.",
      difficulty: "beginner",
      benchmarkIds: [],
      knowledgeOutcomeIds: [],
      published: false
    };
    await this.createGame(game);
    return game;
  }

  async publishGame(gameId: string, approvedBy: string): Promise<EducationalGame> {
    if (!approvedBy) {
      throw new Error("Game publication requires human approval");
    }
    const game = await this.requiredGame(gameId);
    const published = { ...game, published: true };
    await this.repository.saveGame(published);
    return published;
  }

  private async requiredNarrative(narrativeId: string): Promise<Narrative> {
    const narrative = await this.repository.getNarrative(narrativeId);
    if (!narrative) {
      throw new Error(`Narrative not found: ${narrativeId}`);
    }
    return narrative;
  }

  private async requiredGame(gameId: string): Promise<EducationalGame> {
    const game = await this.repository.getGame(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    return game;
  }
}

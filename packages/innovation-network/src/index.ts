export type * from "./contracts.js";

import type {
  CivilizationRoadmap,
  GlobalChallenge,
  ImpactMeasurement,
  InnovationForecast,
  InnovationNetworkEvent,
  InnovationNetworkRepository,
  InnovationNetworkService,
  InnovationRecord,
  OpenScienceRecord,
  PrototypeRecord,
  TechnologyObservation
} from "./contracts.js";

export class LocalInnovationNetworkRepository implements InnovationNetworkRepository {
  private readonly challenges = new Map<string, GlobalChallenge>();
  private readonly openScience = new Map<string, OpenScienceRecord>();
  private readonly innovations = new Map<string, InnovationRecord>();
  private readonly prototypes = new Map<string, PrototypeRecord>();
  private readonly observations: TechnologyObservation[] = [];
  private readonly impacts = new Map<string, ImpactMeasurement>();
  private readonly forecasts: InnovationForecast[] = [];
  private readonly roadmaps = new Map<string, CivilizationRoadmap>();
  private readonly events: InnovationNetworkEvent[] = [];

  async saveChallenge(challenge: GlobalChallenge): Promise<void> {
    this.challenges.set(challenge.id, challenge);
  }

  async getChallenge(challengeId: string): Promise<GlobalChallenge | undefined> {
    return this.challenges.get(challengeId);
  }

  async listChallenges(): Promise<readonly GlobalChallenge[]> {
    return [...this.challenges.values()];
  }

  async saveOpenScience(record: OpenScienceRecord): Promise<void> {
    this.openScience.set(record.id, record);
  }

  async saveInnovation(record: InnovationRecord): Promise<void> {
    this.innovations.set(record.id, record);
  }

  async getInnovation(innovationId: string): Promise<InnovationRecord | undefined> {
    return this.innovations.get(innovationId);
  }

  async listInnovations(): Promise<readonly InnovationRecord[]> {
    return [...this.innovations.values()];
  }

  async savePrototype(record: PrototypeRecord): Promise<void> {
    this.prototypes.set(record.id, record);
  }

  async saveObservation(observation: TechnologyObservation): Promise<void> {
    this.observations.push(Object.freeze(observation));
  }

  async listObservations(): Promise<readonly TechnologyObservation[]> {
    return this.observations;
  }

  async saveImpact(measurement: ImpactMeasurement): Promise<void> {
    this.impacts.set(measurement.id, measurement);
  }

  async saveForecast(forecast: InnovationForecast): Promise<void> {
    this.forecasts.push(Object.freeze(forecast));
  }

  async saveRoadmap(roadmap: CivilizationRoadmap): Promise<void> {
    this.roadmaps.set(roadmap.id, roadmap);
  }

  async publishEvent(event: InnovationNetworkEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }
}

export class LocalInnovationNetworkService implements InnovationNetworkService {
  constructor(private readonly repository: LocalInnovationNetworkRepository = new LocalInnovationNetworkRepository()) {}

  async createChallenge(challenge: GlobalChallenge): Promise<void> {
    if (challenge.originatingQuestionIds.length === 0) {
      throw new Error("Global challenges must originate from questions");
    }
    await this.repository.saveChallenge(challenge);
    await this.emit("ChallengeCreated", { title: challenge.title, domains: challenge.domains }, challenge.id);
  }

  async joinChallenge(challengeId: string, participantId: string): Promise<void> {
    await this.requireChallenge(challengeId);
    await this.emit("ResearchAccelerated", { participantId }, challengeId);
  }

  async registerInnovation(record: InnovationRecord): Promise<void> {
    if (record.originatingQuestionIds.length === 0 || record.lineageIds.length === 0) {
      throw new Error("Innovations must preserve originating questions and semantic lineage");
    }
    await this.repository.saveInnovation(record);
    await this.emit("InnovationRegistered", { kind: record.kind }, undefined, record.id);
  }

  async registerPrototype(record: PrototypeRecord): Promise<void> {
    await this.requireInnovation(record.innovationId);
    await this.repository.savePrototype(record);
    if (record.stage === "validation") {
      await this.emit("PrototypeValidated", { prototypeId: record.id }, undefined, record.innovationId);
    }
  }

  async measureImpact(innovationId: string): Promise<ImpactMeasurement> {
    const innovation = await this.requireInnovation(innovationId);
    const measurement: ImpactMeasurement = {
      id: `${innovation.id}:impact:${Date.now()}`,
      innovationId: innovation.id,
      scientificImpact: innovation.researchIds.length,
      educationalImpact: 0,
      economicImpact: 0,
      environmentalImpact: 0,
      communityImpact: innovation.communityIds.length,
      researchReuse: innovation.researchIds.length,
      knowledgeReuse: innovation.knowledgeGapIds.length,
      innovationVelocity: innovation.experimentIds.length,
      publicBenefit: innovation.publicBenefit.length > 0 ? 1 : 0,
      longTermSustainability: innovation.lineageIds.length,
      evidenceIds: innovation.evidenceIds,
      benchmarkIds: innovation.semantiqScoreIds
    };
    await this.repository.saveImpact(measurement);
    await this.emit("ImpactMeasured", { measurementId: measurement.id }, undefined, innovation.id);
    return measurement;
  }

  async forecastInnovation(): Promise<readonly InnovationForecast[]> {
    const observations = await this.repository.listObservations();
    const forecasts = observations.map<InnovationForecast>((observation) => ({
      id: `${observation.id}:forecast`,
      target: observation.signalType === "research-trend" ? "research-bottleneck" : "future-technology",
      evidenceIds: observation.evidenceIds,
      assumptions: ["Observation trend continues", "Evidence remains valid"],
      confidence: observation.confidence,
      uncertainty: "explicit",
      riskIds: [],
      alternativeScenarioIds: []
    }));
    for (const forecast of forecasts) {
      await this.repository.saveForecast(forecast);
      await this.emit("ForecastGenerated", { forecastId: forecast.id });
    }
    return forecasts;
  }

  async generateRoadmap(horizon: CivilizationRoadmap["horizon"]): Promise<CivilizationRoadmap> {
    const challenges = await this.repository.listChallenges();
    const forecasts = await this.forecastInnovation();
    const roadmap: CivilizationRoadmap = {
      id: `civilization-roadmap:${horizon}:${Date.now()}`,
      horizon,
      challengeIds: challenges.map((challenge) => challenge.id),
      forecastIds: forecasts.map((forecast) => forecast.id),
      milestoneIds: challenges.flatMap((challenge) => challenge.milestoneIds),
      evidenceIds: challenges.flatMap((challenge) => challenge.evidenceIds),
      updatedAt: new Date().toISOString(),
      adaptive: true
    };
    await this.repository.saveRoadmap(roadmap);
    await this.emit("RoadmapUpdated", { roadmapId: roadmap.id });
    return roadmap;
  }

  async recommendResearch(challengeId: string): Promise<readonly string[]> {
    const challenge = await this.requireChallenge(challengeId);
    return challenge.evidenceIds;
  }

  async recommendChallenges(questionId: string): Promise<readonly GlobalChallenge[]> {
    const challenges = await this.repository.listChallenges();
    return challenges.filter((challenge) => challenge.originatingQuestionIds.includes(questionId));
  }

  async publishInnovation(innovationId: string): Promise<void> {
    const innovation = await this.requireInnovation(innovationId);
    await this.emit("InnovationAdopted", { publicBenefit: innovation.publicBenefit }, undefined, innovation.id);
  }

  async recordOpenScience(record: OpenScienceRecord): Promise<void> {
    if (!record.reproducible) {
      throw new Error("Open science records must preserve reproducibility");
    }
    await this.repository.saveOpenScience(record);
  }

  async observeTechnology(observation: TechnologyObservation): Promise<void> {
    await this.repository.saveObservation(observation);
    await this.emit("TechnologyObserved", { topic: observation.topic });
  }

  private async requireChallenge(challengeId: string): Promise<GlobalChallenge> {
    const challenge = await this.repository.getChallenge(challengeId);
    if (!challenge) {
      throw new Error(`Global challenge not found: ${challengeId}`);
    }
    return challenge;
  }

  private async requireInnovation(innovationId: string): Promise<InnovationRecord> {
    const innovation = await this.repository.getInnovation(innovationId);
    if (!innovation) {
      throw new Error(`Innovation not found: ${innovationId}`);
    }
    return innovation;
  }

  private async emit(
    type: InnovationNetworkEvent["type"],
    payload: unknown,
    challengeId?: string,
    innovationId?: string
  ): Promise<void> {
    const event: InnovationNetworkEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withChallenge = challengeId ? { ...event, challengeId } : event;
    const withInnovation = innovationId ? { ...withChallenge, innovationId } : withChallenge;
    await this.repository.publishEvent(withInnovation);
  }
}

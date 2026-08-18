export type ChallengeCategory =
  | "climate"
  | "energy"
  | "water"
  | "food"
  | "medicine"
  | "mental-health"
  | "education"
  | "ai-safety"
  | "robotics"
  | "space"
  | "physics"
  | "mathematics"
  | "cybersecurity"
  | "urban-systems"
  | "agriculture"
  | "economics"
  | "democracy"
  | "culture"
  | "language"
  | "arts"
  | "custom";

export type PrototypeStage =
  | "concept"
  | "design"
  | "simulation"
  | "prototype"
  | "testing"
  | "validation"
  | "manufacturing"
  | "deployment"
  | "maintenance"
  | "retirement";

export type InnovationKind =
  | "idea"
  | "concept"
  | "hypothesis"
  | "prototype"
  | "software"
  | "hardware"
  | "scientific-method"
  | "educational-model"
  | "game"
  | "workflow"
  | "ai-agent"
  | "publication"
  | "patent-metadata";

export interface GlobalChallenge {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly originatingQuestionIds: readonly string[];
  readonly domains: readonly ChallengeCategory[];
  readonly difficulty: number;
  readonly urgency: number;
  readonly impactArea: string;
  readonly scientificStatus:
    | "unknown"
    | "emerging"
    | "active"
    | "validated"
    | "deployed"
    | "completed";
  readonly evidenceIds: readonly string[];
  readonly participantIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly organizationIds: readonly string[];
  readonly fundingIds: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly outcomeIds: readonly string[];
  readonly lessonIds: readonly string[];
  readonly futureWorkIds: readonly string[];
}

export interface OpenScienceRecord {
  readonly id: string;
  readonly challengeId?: string;
  readonly researchIds: readonly string[];
  readonly protocolIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly peerReviewIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly educationIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly simulationIds: readonly string[];
  readonly reproducible: boolean;
}

export interface InnovationRecord {
  readonly id: string;
  readonly kind: InnovationKind;
  readonly title: string;
  readonly originatingQuestionIds: readonly string[];
  readonly knowledgeGapIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly contributorIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
  readonly lineageIds: readonly string[];
  readonly impactIds: readonly string[];
  readonly publicBenefit: string;
}

export interface PrototypeRecord {
  readonly id: string;
  readonly innovationId: string;
  readonly stage: PrototypeStage;
  readonly questionIds: readonly string[];
  readonly designIds: readonly string[];
  readonly simulationIds: readonly string[];
  readonly testIds: readonly string[];
  readonly validationIds: readonly string[];
  readonly riskIds: readonly string[];
  readonly deploymentIds: readonly string[];
  readonly maintenanceIds: readonly string[];
}

export interface TechnologyObservation {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly topic: string;
  readonly signalType:
    | "emerging-technology"
    | "research-trend"
    | "patent-trend"
    | "scientific-discovery"
    | "educational-innovation"
    | "ai-progress"
    | "community-innovation"
    | "open-source-ecosystem"
    | "standards-evolution";
  readonly evidenceIds: readonly string[];
  readonly confidence: number;
  readonly observedAt: string;
}

export interface ImpactMeasurement {
  readonly id: string;
  readonly innovationId: string;
  readonly scientificImpact: number;
  readonly educationalImpact: number;
  readonly economicImpact: number;
  readonly environmentalImpact: number;
  readonly communityImpact: number;
  readonly researchReuse: number;
  readonly knowledgeReuse: number;
  readonly innovationVelocity: number;
  readonly publicBenefit: number;
  readonly longTermSustainability: number;
  readonly evidenceIds: readonly string[];
  readonly benchmarkIds: readonly string[];
}

export interface InnovationForecast {
  readonly id: string;
  readonly target:
    | "future-technology"
    | "emerging-question"
    | "research-bottleneck"
    | "potential-breakthrough"
    | "community-growth"
    | "educational-need"
    | "infrastructure-requirement"
    | "scientific-opportunity";
  readonly evidenceIds: readonly string[];
  readonly assumptions: readonly string[];
  readonly confidence: number;
  readonly uncertainty: string;
  readonly riskIds: readonly string[];
  readonly alternativeScenarioIds: readonly string[];
}

export interface CivilizationRoadmap {
  readonly id: string;
  readonly horizon: "1-year" | "5-year" | "10-year" | "25-year" | "50-year" | "100-year";
  readonly challengeIds: readonly string[];
  readonly forecastIds: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly updatedAt: string;
  readonly adaptive: true;
}

export interface InnovationAgentRole {
  readonly role:
    | "challenge-discovery-agent"
    | "innovation-planner"
    | "research-accelerator"
    | "prototype-advisor"
    | "technology-analyst"
    | "impact-evaluator"
    | "forecast-agent"
    | "education-translator"
    | "deployment-planner"
    | "risk-assessment-agent";
  readonly capabilities: readonly string[];
  readonly reasoningExplanationRequired: true;
  readonly humanOversightRequired: boolean;
}

export interface InnovationNetworkRepository {
  saveChallenge(challenge: GlobalChallenge): Promise<void>;
  getChallenge(challengeId: string): Promise<GlobalChallenge | undefined>;
  listChallenges(): Promise<readonly GlobalChallenge[]>;
  saveOpenScience(record: OpenScienceRecord): Promise<void>;
  saveInnovation(record: InnovationRecord): Promise<void>;
  getInnovation(innovationId: string): Promise<InnovationRecord | undefined>;
  listInnovations(): Promise<readonly InnovationRecord[]>;
  savePrototype(record: PrototypeRecord): Promise<void>;
  saveObservation(observation: TechnologyObservation): Promise<void>;
  listObservations(): Promise<readonly TechnologyObservation[]>;
  saveImpact(measurement: ImpactMeasurement): Promise<void>;
  saveForecast(forecast: InnovationForecast): Promise<void>;
  saveRoadmap(roadmap: CivilizationRoadmap): Promise<void>;
  publishEvent(event: InnovationNetworkEvent): Promise<void>;
}

export interface InnovationNetworkService {
  createChallenge(challenge: GlobalChallenge): Promise<void>;
  joinChallenge(challengeId: string, participantId: string): Promise<void>;
  registerInnovation(record: InnovationRecord): Promise<void>;
  registerPrototype(record: PrototypeRecord): Promise<void>;
  measureImpact(innovationId: string): Promise<ImpactMeasurement>;
  forecastInnovation(): Promise<readonly InnovationForecast[]>;
  generateRoadmap(horizon: CivilizationRoadmap["horizon"]): Promise<CivilizationRoadmap>;
  recommendResearch(challengeId: string): Promise<readonly string[]>;
  recommendChallenges(questionId: string): Promise<readonly GlobalChallenge[]>;
  publishInnovation(innovationId: string): Promise<void>;
}

export interface InnovationNetworkEvent {
  readonly type:
    | "ChallengeCreated"
    | "InnovationRegistered"
    | "PrototypeValidated"
    | "ImpactMeasured"
    | "ForecastGenerated"
    | "RoadmapUpdated"
    | "TechnologyObserved"
    | "ResearchAccelerated"
    | "ChallengeCompleted"
    | "InnovationAdopted";
  readonly version: number;
  readonly occurredAt: string;
  readonly challengeId?: string;
  readonly innovationId?: string;
  readonly payload: unknown;
}

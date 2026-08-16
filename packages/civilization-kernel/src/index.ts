export type * from "./contracts.js";

import type {
  ArchitectureEvolutionSuggestion,
  CivilizationDigitalTwinSnapshot,
  CivilizationHealthIndex,
  CivilizationHealthMetric,
  CivilizationKernelEvent,
  CivilizationKernelRepository,
  CivilizationKernelService,
  CivilizationReport,
  CivilizationCoordinationPlan,
  CoordinationParticipant,
  FutureTechnologyRegistration,
  MetaKnowledgeObject,
  MetaRelation,
  OpenCivilizationProtocol
} from "./contracts.js";

export class LocalCivilizationKernelRepository implements CivilizationKernelRepository {
  private readonly objects = new Map<string, MetaKnowledgeObject>();
  private readonly relations: MetaRelation[] = [];
  private readonly healthIndexes = new Map<string, CivilizationHealthIndex>();
  private readonly participants = new Map<string, CoordinationParticipant>();
  private readonly plans = new Map<string, CivilizationCoordinationPlan>();
  private readonly snapshots = new Map<string, CivilizationDigitalTwinSnapshot>();
  private readonly suggestions = new Map<string, ArchitectureEvolutionSuggestion>();
  private readonly protocols = new Map<string, OpenCivilizationProtocol>();
  private readonly futureTechnologies = new Map<string, FutureTechnologyRegistration>();
  private readonly reports = new Map<string, CivilizationReport>();
  private readonly events: CivilizationKernelEvent[] = [];

  async saveObject(object: MetaKnowledgeObject): Promise<void> {
    this.objects.set(object.id, object);
  }

  async getObject(objectId: string): Promise<MetaKnowledgeObject | undefined> {
    return this.objects.get(objectId);
  }

  async saveRelation(relation: MetaRelation): Promise<void> {
    this.relations.push(Object.freeze(relation));
  }

  async saveHealthIndex(index: CivilizationHealthIndex): Promise<void> {
    this.healthIndexes.set(index.id, index);
  }

  async saveParticipant(participant: CoordinationParticipant): Promise<void> {
    this.participants.set(participant.id, participant);
  }

  async saveCoordinationPlan(plan: CivilizationCoordinationPlan): Promise<void> {
    this.plans.set(plan.id, plan);
  }

  async saveDigitalTwinSnapshot(snapshot: CivilizationDigitalTwinSnapshot): Promise<void> {
    this.snapshots.set(snapshot.id, snapshot);
  }

  async saveEvolutionSuggestion(suggestion: ArchitectureEvolutionSuggestion): Promise<void> {
    this.suggestions.set(suggestion.id, suggestion);
  }

  async saveProtocol(protocol: OpenCivilizationProtocol): Promise<void> {
    this.protocols.set(protocol.id, protocol);
  }

  async saveFutureTechnology(registration: FutureTechnologyRegistration): Promise<void> {
    this.futureTechnologies.set(registration.id, registration);
  }

  async saveReport(report: CivilizationReport): Promise<void> {
    this.reports.set(report.id, report);
  }

  async publishEvent(event: CivilizationKernelEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listRelations(): readonly MetaRelation[] {
    return this.relations;
  }
}

export class LocalCivilizationKernelService implements CivilizationKernelService {
  constructor(
    private readonly repository: LocalCivilizationKernelRepository = new LocalCivilizationKernelRepository()
  ) {}

  async evaluateCivilization(objectIds: readonly string[]): Promise<CivilizationReport> {
    if (objectIds.length === 0) {
      throw new Error("Civilization evaluation requires knowledge objects");
    }
    await this.emit("KnowledgeMilestoneReached", { objectIds });
    return this.generateCivilizationReport(`health:${Date.now()}`);
  }

  async measureCivilizationHealth(
    metrics: readonly CivilizationHealthMetric[]
  ): Promise<CivilizationHealthIndex> {
    if (metrics.length === 0) {
      throw new Error("Civilization health requires transparent metrics");
    }
    const overallScore = metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length;
    const index: CivilizationHealthIndex = {
      id: `civilization-health:${Date.now()}`,
      generatedAt: new Date().toISOString(),
      questionOriginCoverage: 1,
      federationOptional: true,
      offlineReadiness: 1,
      humanOversightCoverage: 1,
      technologyIndependence: 1,
      metrics,
      overallScore
    };
    await this.repository.saveHealthIndex(index);
    await this.emit("CivilizationHealthUpdated", { overallScore });
    return index;
  }

  async coordinateCivilization(plan: CivilizationCoordinationPlan): Promise<void> {
    if (!plan.originatingQuestionId) {
      throw new Error("Civilization coordination must emerge from a question");
    }
    if (!plan.humanOversightRequired || !plan.semantiqEvaluationRequired) {
      throw new Error("Civilization coordination requires human oversight and Semantiq evaluation");
    }
    await this.repository.saveCoordinationPlan(plan);
    await this.emit(
      "GlobalCoordinationStarted",
      { participantIds: plan.participantIds },
      undefined,
      plan.id
    );
  }

  async generateRoadmap(
    questionId: string,
    horizonYears: number
  ): Promise<ArchitectureEvolutionSuggestion> {
    if (!questionId) {
      throw new Error("Roadmaps must originate from questions");
    }
    const suggestion: ArchitectureEvolutionSuggestion = {
      id: `roadmap:${questionId}:${horizonYears}`,
      type: "future-compatibility",
      title: `${horizonYears}-year adaptive architecture roadmap`,
      rationale:
        "Generated as an advisory roadmap from questions, evidence, health metrics, and future compatibility constraints.",
      affectedModuleIds: [],
      evidenceIds: [questionId],
      migrationIds: [],
      deprecationIds: [],
      futureTechnologyIds: [],
      advisoryOnly: true
    };
    await this.repository.saveEvolutionSuggestion(suggestion);
    await this.emit("RoadmapGenerated", { horizonYears, suggestionId: suggestion.id });
    return suggestion;
  }

  async simulateArchitectureEvolution(
    suggestion: ArchitectureEvolutionSuggestion
  ): Promise<CivilizationDigitalTwinSnapshot> {
    if (!suggestion.advisoryOnly) {
      throw new Error("Architecture evolution simulation must remain advisory");
    }
    const snapshot: CivilizationDigitalTwinSnapshot = {
      id: `civilization-snapshot:${Date.now()}`,
      createdAt: new Date().toISOString(),
      knowledgeIds: suggestion.evidenceIds,
      researchIds: [],
      educationIds: [],
      innovationIds: [],
      communityIds: [],
      policyIds: [],
      infrastructureIds: suggestion.affectedModuleIds,
      technologyIds: suggestion.futureTechnologyIds,
      challengeIds: [],
      roadmapIds: [suggestion.id],
      analyticalOnly: true,
      uncertaintyNotes: [
        "Digital twin scenarios support exploration and planning, not predictive certainty."
      ]
    };
    await this.repository.saveDigitalTwinSnapshot(snapshot);
    await this.emit("CivilizationSnapshotCreated", { snapshotId: snapshot.id });
    return snapshot;
  }

  async publishProtocol(protocol: OpenCivilizationProtocol): Promise<void> {
    if (!protocol.technologyNeutral) {
      throw new Error("Open Civilization Protocol must remain technology-neutral");
    }
    await this.repository.saveProtocol(protocol);
    await this.emit(
      "ProtocolPublished",
      { version: protocol.version },
      undefined,
      undefined,
      protocol.id
    );
  }

  async reviewArchitecture(suggestion: ArchitectureEvolutionSuggestion): Promise<void> {
    if (!suggestion.advisoryOnly) {
      throw new Error("Architecture reviews produce advisory recommendations only");
    }
    await this.repository.saveEvolutionSuggestion(suggestion);
    await this.emit("ArchitectureReviewed", { suggestionId: suggestion.id });
    await this.emit("EvolutionSuggested", { type: suggestion.type, suggestionId: suggestion.id });
  }

  async registerFutureTechnology(registration: FutureTechnologyRegistration): Promise<void> {
    if (!registration.humanOversightRequired) {
      throw new Error("Future technology integrations require human oversight");
    }
    await this.repository.saveFutureTechnology(registration);
  }

  async exportCivilizationGraph(): Promise<readonly MetaRelation[]> {
    return this.repository.listRelations();
  }

  async generateCivilizationReport(healthIndexId: string): Promise<CivilizationReport> {
    const report: CivilizationReport = {
      id: `civilization-report:${Date.now()}`,
      generatedAt: new Date().toISOString(),
      healthIndexId,
      coordinationPlanIds: [],
      roadmapIds: [],
      protocolIds: [],
      digitalTwinSnapshotIds: [],
      architectureSuggestionIds: [],
      transparent: true
    };
    await this.repository.saveReport(report);
    return report;
  }

  private async emit(
    type: CivilizationKernelEvent["type"],
    payload: unknown,
    objectId?: string,
    planId?: string,
    protocolId?: string
  ): Promise<void> {
    const event: CivilizationKernelEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withObject = objectId ? { ...event, objectId } : event;
    const withPlan = planId ? { ...withObject, planId } : withObject;
    const withProtocol = protocolId ? { ...withPlan, protocolId } : withPlan;
    await this.repository.publishEvent(withProtocol);
  }
}

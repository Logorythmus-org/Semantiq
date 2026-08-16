export type * from "./contracts.js";

import type {
  CollectiveIntelligenceEvent,
  CollectiveIntelligenceRepository,
  CollectiveIntelligenceService,
  CollectiveIntelligenceSignal,
  CollectiveMemoryRecord,
  CollectiveReasoningMap,
  GlobalAnalyticsSnapshot,
  GlobalResearchMap,
  KnowledgeForecast,
  KnowledgeGap,
  ResearchCoordinationPlan,
  ResearchOpportunity
} from "./contracts.js";

export class LocalCollectiveIntelligenceRepository implements CollectiveIntelligenceRepository {
  private readonly signals: CollectiveIntelligenceSignal[] = [];
  private readonly gaps: KnowledgeGap[] = [];
  private readonly opportunities: ResearchOpportunity[] = [];
  private readonly coordination = new Map<string, ResearchCoordinationPlan>();
  private readonly reasoning = new Map<string, CollectiveReasoningMap>();
  private readonly memory = new Map<string, CollectiveMemoryRecord>();
  private readonly forecasts: KnowledgeForecast[] = [];
  private readonly events: CollectiveIntelligenceEvent[] = [];

  async saveSignal(signal: CollectiveIntelligenceSignal): Promise<void> {
    this.signals.push(Object.freeze(signal));
  }

  async listSignals(): Promise<readonly CollectiveIntelligenceSignal[]> {
    return this.signals;
  }

  async saveGap(gap: KnowledgeGap): Promise<void> {
    this.gaps.push(Object.freeze(gap));
  }

  async listGaps(): Promise<readonly KnowledgeGap[]> {
    return this.gaps;
  }

  async saveOpportunity(opportunity: ResearchOpportunity): Promise<void> {
    this.opportunities.push(Object.freeze(opportunity));
  }

  async listOpportunities(): Promise<readonly ResearchOpportunity[]> {
    return this.opportunities;
  }

  async saveCoordinationPlan(plan: ResearchCoordinationPlan): Promise<void> {
    this.coordination.set(plan.id, plan);
  }

  async saveReasoningMap(map: CollectiveReasoningMap): Promise<void> {
    this.reasoning.set(map.id, map);
  }

  async saveMemory(record: CollectiveMemoryRecord): Promise<void> {
    this.memory.set(record.id, record);
  }

  async saveForecast(forecast: KnowledgeForecast): Promise<void> {
    this.forecasts.push(Object.freeze(forecast));
  }

  async publishEvent(event: CollectiveIntelligenceEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listEvents(): readonly CollectiveIntelligenceEvent[] {
    return this.events;
  }
}

export class LocalCollectiveIntelligenceService implements CollectiveIntelligenceService {
  constructor(private readonly repository: LocalCollectiveIntelligenceRepository = new LocalCollectiveIntelligenceRepository()) {}

  async discoverKnowledgeGaps(): Promise<readonly KnowledgeGap[]> {
    const signals = await this.repository.listSignals();
    const gaps = signals.map<KnowledgeGap>((signal) => ({
      id: `${signal.id}:gap`,
      type: "missing-evidence",
      sourceSignalIds: [signal.id],
      sourceQuestionIds: signal.sourceQuestionIds,
      affectedCommunityIds: signal.communityIds,
      missingResourceIds: [],
      evidenceState: "insufficient",
      urgency: signal.confidence,
      confidence: signal.confidence,
      semantiqScoreIds: signal.semantiqScoreIds,
      graphLinkIds: signal.graphLinkIds,
      recommendedActions: ["collect-evidence", "coordinate-research", "invite-domain-experts"]
    }));
    for (const gap of gaps) {
      await this.repository.saveGap(gap);
      await this.emit("KnowledgeGapDetected", { type: gap.type }, gap.id);
    }
    return gaps;
  }

  async forecastResearch(): Promise<readonly KnowledgeForecast[]> {
    const gaps = await this.repository.listGaps();
    const forecasts = gaps.map<KnowledgeForecast>((gap) => ({
      id: `${gap.id}:forecast`,
      target: "research-bottleneck",
      evidenceIds: gap.sourceSignalIds,
      assumptions: ["Current evidence is incomplete", "More collaboration can reduce uncertainty"],
      uncertainty: "medium",
      confidence: gap.confidence,
      alternativeScenarioIds: [],
      failureModes: ["missing-data", "coordination-failure", "policy-restriction"],
      explanation: "Forecast generated from unresolved knowledge gap."
    }));
    for (const forecast of forecasts) {
      await this.repository.saveForecast(forecast);
      await this.emit("ForecastUpdated", { forecastId: forecast.id });
    }
    return forecasts;
  }

  async coordinateResearch(opportunityId: string): Promise<ResearchCoordinationPlan> {
    const opportunities = await this.repository.listOpportunities();
    const opportunity = opportunities.find((candidate) => candidate.id === opportunityId);
    if (!opportunity) {
      throw new Error(`Research opportunity not found: ${opportunityId}`);
    }
    const plan: ResearchCoordinationPlan = {
      id: `${opportunity.id}:coordination`,
      opportunityId: opportunity.id,
      participantIds: [...opportunity.recommendedExpertIds, ...opportunity.recommendedCommunityIds],
      nodeIds: [],
      communityIds: opportunity.recommendedCommunityIds,
      agentIds: [],
      taskIds: [],
      evidenceNeeds: opportunity.gapIds,
      experimentNeeds: [],
      datasetNeeds: opportunity.datasetIds,
      reviewNeeds: [],
      policyIds: []
    };
    await this.repository.saveCoordinationPlan(plan);
    await this.emit("ResearchCoordinated", { planId: plan.id }, undefined, opportunity.id);
    return plan;
  }

  async recommendCommunities(gapId: string): Promise<readonly string[]> {
    const gap = await this.requireGap(gapId);
    return gap.affectedCommunityIds;
  }

  async recommendExperts(gapId: string): Promise<readonly string[]> {
    await this.requireGap(gapId);
    return [];
  }

  async recommendProjects(gapId: string): Promise<readonly string[]> {
    await this.requireGap(gapId);
    return [];
  }

  async generateGlobalMap(): Promise<GlobalResearchMap> {
    const gaps = await this.repository.listGaps();
    const opportunities = await this.repository.listOpportunities();
    return {
      id: `global-research-map:${Date.now()}`,
      questionIds: unique(gaps.flatMap((gap) => gap.sourceQuestionIds)),
      researchProjectIds: opportunities.flatMap((opportunity) => opportunity.recommendedProjectIds),
      communityIds: unique(gaps.flatMap((gap) => gap.affectedCommunityIds)),
      universityIds: [],
      expertIds: opportunities.flatMap((opportunity) => opportunity.recommendedExpertIds),
      datasetIds: opportunities.flatMap((opportunity) => opportunity.datasetIds),
      repositoryIds: [],
      experimentIds: [],
      innovationClusterIds: [],
      fundingOpportunityIds: opportunities.flatMap((opportunity) => opportunity.fundingOpportunityIds)
    };
  }

  async analyzeCollectiveIntelligence(): Promise<GlobalAnalyticsSnapshot> {
    const signals = await this.repository.listSignals();
    const gaps = await this.repository.listGaps();
    const opportunities = await this.repository.listOpportunities();
    const snapshot: GlobalAnalyticsSnapshot = {
      id: `global-analytics:${Date.now()}`,
      knowledgeGrowth: signals.length,
      questionCreation: unique(signals.flatMap((signal) => signal.sourceQuestionIds)).length,
      researchActivity: unique(signals.flatMap((signal) => signal.researchIds)).length,
      discoveryRate: gaps.length,
      communityHealth: unique(signals.flatMap((signal) => signal.communityIds)).length,
      innovationRate: opportunities.length,
      educationImpact: 0,
      collaborationDensity: opportunities.reduce((total, opportunity) => total + opportunity.recommendedCommunityIds.length, 0),
      knowledgeAccessibility: signals.length,
      scientificProgress: opportunities.length + gaps.length
    };
    await this.emit("CivilizationInsightGenerated", { snapshotId: snapshot.id });
    return snapshot;
  }

  async measureKnowledgeGrowth(): Promise<number> {
    const snapshot = await this.analyzeCollectiveIntelligence();
    await this.emit("KnowledgeExpanded", { knowledgeGrowth: snapshot.knowledgeGrowth });
    return snapshot.knowledgeGrowth;
  }

  async forecastInnovation(): Promise<readonly KnowledgeForecast[]> {
    const forecasts = await this.forecastResearch();
    const innovation = forecasts.map<KnowledgeForecast>((forecast) => ({
      ...forecast,
      id: `${forecast.id}:innovation`,
      target: "innovation-opportunity",
      explanation: "Innovation opportunity inferred from unresolved research bottleneck."
    }));
    for (const forecast of innovation) {
      await this.repository.saveForecast(forecast);
      await this.emit("InnovationDetected", { forecastId: forecast.id });
    }
    return innovation;
  }

  async recordSignal(signal: CollectiveIntelligenceSignal): Promise<void> {
    await this.repository.saveSignal(signal);
    await this.emit("DiscoveryGenerated", { signalId: signal.id });
  }

  async recordOpportunity(opportunity: ResearchOpportunity): Promise<void> {
    await this.repository.saveOpportunity(opportunity);
    await this.emit("ResearchOpportunityFound", { title: opportunity.title }, undefined, opportunity.id);
  }

  private async requireGap(gapId: string): Promise<KnowledgeGap> {
    const gaps = await this.repository.listGaps();
    const gap = gaps.find((candidate) => candidate.id === gapId);
    if (!gap) {
      throw new Error(`Knowledge gap not found: ${gapId}`);
    }
    return gap;
  }

  private async emit(
    type: CollectiveIntelligenceEvent["type"],
    payload: unknown,
    gapId?: string,
    opportunityId?: string
  ): Promise<void> {
    const event: CollectiveIntelligenceEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withGap = gapId ? { ...event, gapId } : event;
    const withOpportunity = opportunityId ? { ...withGap, opportunityId } : withGap;
    await this.repository.publishEvent(withOpportunity);
  }
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

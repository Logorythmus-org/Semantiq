export type KnowledgeGapType =
  | "missing-evidence"
  | "missing-experiment"
  | "missing-community"
  | "missing-discipline"
  | "missing-dataset"
  | "missing-collaborator"
  | "missing-educational-resource"
  | "missing-research"
  | "missing-question";

export type DiscoveryDomain =
  | "emerging-topic"
  | "unsolved-problem"
  | "future-technology"
  | "societal-challenge"
  | "educational-need"
  | "scientific-trend"
  | "cross-disciplinary-discovery";

export type CollectiveAgentKind =
  | "discovery-agent"
  | "knowledge-gap-agent"
  | "research-coordinator"
  | "evidence-curator"
  | "trend-analyst"
  | "forecast-agent"
  | "innovation-agent"
  | "collaboration-agent"
  | "education-agent"
  | "scientific-integrity-agent";

export interface CollectiveIntelligenceSignal {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly sourceQuestionIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
  readonly graphLinkIds: readonly string[];
  readonly domain: DiscoveryDomain;
  readonly confidence: number;
  readonly explanation: string;
}

export interface KnowledgeGap {
  readonly id: string;
  readonly type: KnowledgeGapType;
  readonly sourceSignalIds: readonly string[];
  readonly sourceQuestionIds: readonly string[];
  readonly affectedCommunityIds: readonly string[];
  readonly missingResourceIds: readonly string[];
  readonly evidenceState: string;
  readonly urgency: number;
  readonly confidence: number;
  readonly semantiqScoreIds: readonly string[];
  readonly graphLinkIds: readonly string[];
  readonly recommendedActions: readonly string[];
}

export interface ResearchOpportunity {
  readonly id: string;
  readonly gapIds: readonly string[];
  readonly title: string;
  readonly description: string;
  readonly domain: DiscoveryDomain;
  readonly recommendedCommunityIds: readonly string[];
  readonly recommendedExpertIds: readonly string[];
  readonly recommendedProjectIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly fundingOpportunityIds: readonly string[];
  readonly publicBenefit: string;
}

export interface ResearchCoordinationPlan {
  readonly id: string;
  readonly opportunityId: string;
  readonly participantIds: readonly string[];
  readonly nodeIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly taskIds: readonly string[];
  readonly evidenceNeeds: readonly string[];
  readonly experimentNeeds: readonly string[];
  readonly datasetNeeds: readonly string[];
  readonly reviewNeeds: readonly string[];
  readonly policyIds: readonly string[];
}

export interface CollectiveReasoningMap {
  readonly id: string;
  readonly questionId: string;
  readonly hypothesisIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly argumentIds: readonly string[];
  readonly counterargumentIds: readonly string[];
  readonly alternativePerspectiveIds: readonly string[];
  readonly consensusIds: readonly string[];
  readonly minorityReportIds: readonly string[];
  readonly uncertaintyIds: readonly string[];
  readonly contributorIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
}

export interface CollectiveMemoryRecord {
  readonly id: string;
  readonly type:
    | "discovery"
    | "lesson-learned"
    | "failed-experiment"
    | "historical-decision"
    | "research-path"
    | "agent-reflection"
    | "community-knowledge"
    | "educational-material";
  readonly sourceNodeIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly content: string;
  readonly provenanceIds: readonly string[];
  readonly privacyScope: "public" | "federated" | "community" | "private";
  readonly version: string;
}

export interface KnowledgeForecast {
  readonly id: string;
  readonly target:
    | "emerging-question"
    | "emerging-field"
    | "future-collaboration"
    | "potential-discovery"
    | "educational-trend"
    | "technology-evolution"
    | "research-bottleneck"
    | "innovation-opportunity";
  readonly evidenceIds: readonly string[];
  readonly assumptions: readonly string[];
  readonly uncertainty: string;
  readonly confidence: number;
  readonly alternativeScenarioIds: readonly string[];
  readonly failureModes: readonly string[];
  readonly explanation: string;
}

export interface GlobalAnalyticsSnapshot {
  readonly id: string;
  readonly knowledgeGrowth: number;
  readonly questionCreation: number;
  readonly researchActivity: number;
  readonly discoveryRate: number;
  readonly communityHealth: number;
  readonly innovationRate: number;
  readonly educationImpact: number;
  readonly collaborationDensity: number;
  readonly knowledgeAccessibility: number;
  readonly scientificProgress: number;
}

export interface GlobalResearchMap {
  readonly id: string;
  readonly questionIds: readonly string[];
  readonly researchProjectIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly universityIds: readonly string[];
  readonly expertIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly innovationClusterIds: readonly string[];
  readonly fundingOpportunityIds: readonly string[];
}

export interface CollectiveAgentRole {
  readonly kind: CollectiveAgentKind;
  readonly capabilities: readonly string[];
  readonly humanCollaborationRequired: true;
  readonly explanationRequired: true;
  readonly semantiqEvaluationCriteria: readonly string[];
}

export interface CollectiveIntelligenceRepository {
  saveSignal(signal: CollectiveIntelligenceSignal): Promise<void>;
  listSignals(): Promise<readonly CollectiveIntelligenceSignal[]>;
  saveGap(gap: KnowledgeGap): Promise<void>;
  listGaps(): Promise<readonly KnowledgeGap[]>;
  saveOpportunity(opportunity: ResearchOpportunity): Promise<void>;
  listOpportunities(): Promise<readonly ResearchOpportunity[]>;
  saveCoordinationPlan(plan: ResearchCoordinationPlan): Promise<void>;
  saveReasoningMap(map: CollectiveReasoningMap): Promise<void>;
  saveMemory(record: CollectiveMemoryRecord): Promise<void>;
  saveForecast(forecast: KnowledgeForecast): Promise<void>;
  publishEvent(event: CollectiveIntelligenceEvent): Promise<void>;
}

export interface CollectiveIntelligenceService {
  discoverKnowledgeGaps(): Promise<readonly KnowledgeGap[]>;
  forecastResearch(): Promise<readonly KnowledgeForecast[]>;
  coordinateResearch(opportunityId: string): Promise<ResearchCoordinationPlan>;
  recommendCommunities(gapId: string): Promise<readonly string[]>;
  recommendExperts(gapId: string): Promise<readonly string[]>;
  recommendProjects(gapId: string): Promise<readonly string[]>;
  generateGlobalMap(): Promise<GlobalResearchMap>;
  analyzeCollectiveIntelligence(): Promise<GlobalAnalyticsSnapshot>;
  measureKnowledgeGrowth(): Promise<number>;
  forecastInnovation(): Promise<readonly KnowledgeForecast[]>;
}

export interface CollectiveIntelligenceEvent {
  readonly type:
    | "KnowledgeGapDetected"
    | "ResearchOpportunityFound"
    | "DiscoveryGenerated"
    | "ForecastUpdated"
    | "GlobalChallengeCreated"
    | "CommunityFormed"
    | "ResearchCoordinated"
    | "InnovationDetected"
    | "KnowledgeExpanded"
    | "CivilizationInsightGenerated";
  readonly version: number;
  readonly occurredAt: string;
  readonly gapId?: string;
  readonly opportunityId?: string;
  readonly payload: unknown;
}

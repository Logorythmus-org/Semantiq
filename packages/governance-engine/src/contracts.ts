export type DecisionType =
  | "community"
  | "research-governance"
  | "educational-governance"
  | "technical-governance"
  | "product-governance"
  | "organization-governance"
  | "public-consultation"
  | "budget-prioritization"
  | "roadmap-planning"
  | "policy-development"
  | "strategic-planning"
  | "scientific-ethics-review";

export type ConsensusLevel =
  | "strong-consensus"
  | "weak-consensus"
  | "no-consensus"
  | "competing-models"
  | "alternative-recommendations";

export type ParticipationRole =
  | "individual"
  | "community"
  | "school"
  | "university"
  | "research-institute"
  | "company"
  | "ngo"
  | "government"
  | "international-organization"
  | "ai-agent-advisory";

export interface GovernanceProcess {
  readonly id: string;
  readonly type: DecisionType;
  readonly questionId: string;
  readonly purpose: string;
  readonly scope: string;
  readonly stakeholderIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly organizationIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly alternativeIds: readonly string[];
  readonly simulationIds: readonly string[];
  readonly riskIds: readonly string[];
  readonly ethicsIds: readonly string[];
  readonly timelineEntryIds: readonly string[];
  readonly facilitatorIds: readonly string[];
  readonly aiAgentIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly decisionHistoryIds: readonly string[];
  readonly impactReportIds: readonly string[];
  readonly futureReviewIds: readonly string[];
}

export interface PolicyObject {
  readonly id: string;
  readonly intent: string;
  readonly scope: string;
  readonly evidenceIds: readonly string[];
  readonly researchBasisIds: readonly string[];
  readonly affectedCommunityIds: readonly string[];
  readonly alternativeIds: readonly string[];
  readonly versionHistoryIds: readonly string[];
  readonly implementationStatus: "draft" | "review" | "approved" | "implementing" | "active" | "under-review" | "retired";
  readonly impactIds: readonly string[];
  readonly reviewSchedule: string;
  readonly graphLinkIds: readonly string[];
}

export interface DeliberationThread {
  readonly id: string;
  readonly processId: string;
  readonly questionTreeIds: readonly string[];
  readonly evidenceComparisonIds: readonly string[];
  readonly argumentMapIds: readonly string[];
  readonly counterargumentIds: readonly string[];
  readonly scenarioIds: readonly string[];
  readonly expertCommentaryIds: readonly string[];
  readonly communityFeedbackIds: readonly string[];
  readonly minorityOpinionIds: readonly string[];
  readonly openReviewIds: readonly string[];
}

export interface GovernanceAlternative {
  readonly id: string;
  readonly processId: string;
  readonly title: string;
  readonly description: string;
  readonly evidenceIds: readonly string[];
  readonly riskIds: readonly string[];
  readonly tradeoffIds: readonly string[];
  readonly simulationIds: readonly string[];
}

export interface ImpactSimulation {
  readonly id: string;
  readonly processId: string;
  readonly alternativeId: string;
  readonly scientificImpact: number;
  readonly educationalImpact: number;
  readonly communityImpact: number;
  readonly economicImpact: number;
  readonly environmentalImpact: number;
  readonly infrastructureImpact: number;
  readonly longTermEffects: number;
  readonly unknownRiskIds: readonly string[];
  readonly assumptions: readonly string[];
  readonly reproducible: boolean;
}

export interface ConsensusState {
  readonly id: string;
  readonly processId: string;
  readonly level: ConsensusLevel;
  readonly uncertaintyLevel: number;
  readonly evidenceConfidence: number;
  readonly competingModelIds: readonly string[];
  readonly alternativeRecommendationIds: readonly string[];
  readonly minorityOpinionIds: readonly string[];
  readonly explanation: string;
}

export interface ParticipationRecord {
  readonly id: string;
  readonly processId: string;
  readonly participantId: string;
  readonly role: ParticipationRole;
  readonly contributionIds: readonly string[];
  readonly verifiedIdentity: boolean;
  readonly transparent: true;
}

export interface TransparencyRecord {
  readonly id: string;
  readonly processId: string;
  readonly contributorIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly alternativeIds: readonly string[];
  readonly decisionRationale: string;
  readonly reviewHistoryIds: readonly string[];
  readonly impactMeasurementIds: readonly string[];
  readonly futureRevisionIds: readonly string[];
  readonly auditIds: readonly string[];
}

export interface GovernanceRoadmap {
  readonly id: string;
  readonly scope: "community" | "organization" | "research-network" | "education" | "innovation" | "infrastructure" | "global-challenge";
  readonly processIds: readonly string[];
  readonly policyIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly impactIds: readonly string[];
  readonly updatedAt: string;
  readonly adaptive: true;
}

export interface GovernanceAgentRole {
  readonly role:
    | "policy-analysis-agent"
    | "evidence-curator"
    | "dialogue-facilitator"
    | "consensus-assistant"
    | "simulation-agent"
    | "impact-analyst"
    | "ethics-advisor"
    | "roadmap-planner"
    | "governance-auditor"
    | "transparency-agent";
  readonly capabilities: readonly string[];
  readonly advisoryOnly: true;
  readonly explanationRequired: true;
}

export interface GovernanceEngineRepository {
  saveProcess(process: GovernanceProcess): Promise<void>;
  getProcess(processId: string): Promise<GovernanceProcess | undefined>;
  savePolicy(policy: PolicyObject): Promise<void>;
  saveDeliberation(thread: DeliberationThread): Promise<void>;
  saveAlternative(alternative: GovernanceAlternative): Promise<void>;
  saveSimulation(simulation: ImpactSimulation): Promise<void>;
  saveConsensus(consensus: ConsensusState): Promise<void>;
  saveParticipation(record: ParticipationRecord): Promise<void>;
  saveTransparency(record: TransparencyRecord): Promise<void>;
  publishEvent(event: GovernanceEngineEvent): Promise<void>;
}

export interface GovernanceEngineService {
  createGovernanceProcess(process: GovernanceProcess): Promise<void>;
  createPolicy(policy: PolicyObject): Promise<void>;
  collectEvidence(processId: string, evidenceIds: readonly string[]): Promise<void>;
  generateAlternatives(processId: string): Promise<readonly GovernanceAlternative[]>;
  simulateImpact(simulation: ImpactSimulation): Promise<void>;
  facilitateDialogue(thread: DeliberationThread): Promise<void>;
  measureConsensus(consensus: ConsensusState): Promise<void>;
  publishDecision(processId: string, transparency: TransparencyRecord): Promise<void>;
  reviewDecision(processId: string): Promise<void>;
  measureImpact(processId: string): Promise<readonly string[]>;
}

export interface GovernanceEngineEvent {
  readonly type:
    | "GovernanceStarted"
    | "EvidenceCollected"
    | "DialogueOpened"
    | "AlternativeGenerated"
    | "SimulationCompleted"
    | "ConsensusUpdated"
    | "DecisionPublished"
    | "ImpactMeasured"
    | "GovernanceReviewed"
    | "PolicyUpdated";
  readonly version: number;
  readonly occurredAt: string;
  readonly processId?: string;
  readonly policyId?: string;
  readonly payload: unknown;
}

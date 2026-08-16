export type MetaKnowledgeObjectType =
  | "question"
  | "knowledge"
  | "evidence"
  | "research"
  | "experiment"
  | "publication"
  | "community"
  | "institution"
  | "organization"
  | "person"
  | "agent"
  | "workflow"
  | "education"
  | "innovation"
  | "policy"
  | "marketplace-asset"
  | "governance-process"
  | "challenge"
  | "roadmap"
  | "civilization-memory";

export type MetaRelationType =
  | "depends_on"
  | "answers"
  | "extends"
  | "contradicts"
  | "supports"
  | "inspired_by"
  | "teaches"
  | "funds"
  | "improves"
  | "references"
  | "generated_by"
  | "validated_by"
  | "derived_from"
  | "implemented_by";

export type CivilizationHealthDimension =
  | "knowledge-health"
  | "research-health"
  | "education-health"
  | "innovation-health"
  | "governance-health"
  | "community-health"
  | "trust"
  | "accessibility"
  | "open-science"
  | "collaboration"
  | "knowledge-preservation"
  | "global-participation";

export type CoordinationParticipantType =
  | "community"
  | "university"
  | "research-lab"
  | "government"
  | "company"
  | "ngo"
  | "citizen-scientist"
  | "developer"
  | "ai-agent"
  | "distributed-node";

export type EvolutionReviewType =
  | "architecture-review"
  | "pattern-detection"
  | "module-refactoring"
  | "api-evolution"
  | "protocol-evolution"
  | "knowledge-migration"
  | "future-compatibility"
  | "deprecation-planning";

export interface MetaKnowledgeObject {
  readonly id: string;
  readonly type: MetaKnowledgeObjectType;
  readonly semanticIdentityId: string;
  readonly originatingQuestionId: string;
  readonly title: string;
  readonly contributorIds: readonly string[];
  readonly provenanceIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly policyIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface MetaRelation {
  readonly id: string;
  readonly type: MetaRelationType;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
  readonly confidence: number;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface CivilizationHealthMetric {
  readonly dimension: CivilizationHealthDimension;
  readonly score: number;
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
  readonly semantiqReportIds: readonly string[];
  readonly uncertainty: number;
}

export interface CivilizationHealthIndex {
  readonly id: string;
  readonly generatedAt: string;
  readonly questionOriginCoverage: number;
  readonly federationOptional: true;
  readonly offlineReadiness: number;
  readonly humanOversightCoverage: number;
  readonly technologyIndependence: number;
  readonly metrics: readonly CivilizationHealthMetric[];
  readonly overallScore: number;
}

export interface CoordinationParticipant {
  readonly id: string;
  readonly type: CoordinationParticipantType;
  readonly semanticIdentityId: string;
  readonly autonomous: true;
  readonly trustEvidenceIds: readonly string[];
  readonly contributionIds: readonly string[];
  readonly localPolicyIds: readonly string[];
}

export interface CivilizationCoordinationPlan {
  readonly id: string;
  readonly originatingQuestionId: string;
  readonly participantIds: readonly string[];
  readonly knowledgeObjectIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly educationIds: readonly string[];
  readonly innovationIds: readonly string[];
  readonly governanceProcessIds: readonly string[];
  readonly economyAssetIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly federationNodeIds: readonly string[];
  readonly humanOversightRequired: true;
  readonly semantiqEvaluationRequired: true;
}

export interface CivilizationDigitalTwinSnapshot {
  readonly id: string;
  readonly createdAt: string;
  readonly knowledgeIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly educationIds: readonly string[];
  readonly innovationIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly policyIds: readonly string[];
  readonly infrastructureIds: readonly string[];
  readonly technologyIds: readonly string[];
  readonly challengeIds: readonly string[];
  readonly roadmapIds: readonly string[];
  readonly analyticalOnly: true;
  readonly uncertaintyNotes: readonly string[];
}

export interface ArchitectureEvolutionSuggestion {
  readonly id: string;
  readonly type: EvolutionReviewType;
  readonly title: string;
  readonly rationale: string;
  readonly affectedModuleIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly migrationIds: readonly string[];
  readonly deprecationIds: readonly string[];
  readonly futureTechnologyIds: readonly string[];
  readonly advisoryOnly: true;
}

export interface OpenCivilizationProtocol {
  readonly id: string;
  readonly version: string;
  readonly exchangeTypes: readonly (
    | "knowledge"
    | "research"
    | "education"
    | "innovation"
    | "governance"
    | "identity"
    | "trust"
    | "federation"
    | "synchronization"
    | "archives"
  )[];
  readonly publicSpecificationUrl?: string;
  readonly compatibilityProfileIds: readonly string[];
  readonly migrationPolicyIds: readonly string[];
  readonly technologyNeutral: true;
}

export interface FutureTechnologyRegistration {
  readonly id: string;
  readonly name: string;
  readonly category:
    | "future-ai-model"
    | "quantum-computing"
    | "photonic-computing"
    | "neuromorphic-hardware"
    | "brain-computer-interface"
    | "autonomous-laboratory"
    | "robotic-scientist"
    | "space-network"
    | "unknown-future-technology";
  readonly adapterBoundary: string;
  readonly requiredProtocolCapabilities: readonly string[];
  readonly riskIds: readonly string[];
  readonly humanOversightRequired: true;
}

export interface CivilizationReport {
  readonly id: string;
  readonly generatedAt: string;
  readonly healthIndexId: string;
  readonly coordinationPlanIds: readonly string[];
  readonly roadmapIds: readonly string[];
  readonly protocolIds: readonly string[];
  readonly digitalTwinSnapshotIds: readonly string[];
  readonly architectureSuggestionIds: readonly string[];
  readonly transparent: true;
}

export interface CivilizationKernelRepository {
  saveObject(object: MetaKnowledgeObject): Promise<void>;
  getObject(objectId: string): Promise<MetaKnowledgeObject | undefined>;
  saveRelation(relation: MetaRelation): Promise<void>;
  saveHealthIndex(index: CivilizationHealthIndex): Promise<void>;
  saveParticipant(participant: CoordinationParticipant): Promise<void>;
  saveCoordinationPlan(plan: CivilizationCoordinationPlan): Promise<void>;
  saveDigitalTwinSnapshot(snapshot: CivilizationDigitalTwinSnapshot): Promise<void>;
  saveEvolutionSuggestion(suggestion: ArchitectureEvolutionSuggestion): Promise<void>;
  saveProtocol(protocol: OpenCivilizationProtocol): Promise<void>;
  saveFutureTechnology(registration: FutureTechnologyRegistration): Promise<void>;
  saveReport(report: CivilizationReport): Promise<void>;
  publishEvent(event: CivilizationKernelEvent): Promise<void>;
}

export interface CivilizationKernelService {
  evaluateCivilization(objectIds: readonly string[]): Promise<CivilizationReport>;
  measureCivilizationHealth(metrics: readonly CivilizationHealthMetric[]): Promise<CivilizationHealthIndex>;
  coordinateCivilization(plan: CivilizationCoordinationPlan): Promise<void>;
  generateRoadmap(questionId: string, horizonYears: number): Promise<ArchitectureEvolutionSuggestion>;
  simulateArchitectureEvolution(suggestion: ArchitectureEvolutionSuggestion): Promise<CivilizationDigitalTwinSnapshot>;
  publishProtocol(protocol: OpenCivilizationProtocol): Promise<void>;
  reviewArchitecture(suggestion: ArchitectureEvolutionSuggestion): Promise<void>;
  registerFutureTechnology(registration: FutureTechnologyRegistration): Promise<void>;
  exportCivilizationGraph(): Promise<readonly MetaRelation[]>;
  generateCivilizationReport(healthIndexId: string): Promise<CivilizationReport>;
}

export interface CivilizationKernelEvent {
  readonly type:
    | "CivilizationHealthUpdated"
    | "ArchitectureReviewed"
    | "ProtocolPublished"
    | "EvolutionSuggested"
    | "RoadmapGenerated"
    | "KnowledgeMilestoneReached"
    | "InnovationMilestoneReached"
    | "EducationMilestoneReached"
    | "GlobalCoordinationStarted"
    | "CivilizationSnapshotCreated";
  readonly version: number;
  readonly occurredAt: string;
  readonly objectId?: string;
  readonly planId?: string;
  readonly protocolId?: string;
  readonly payload: unknown;
}

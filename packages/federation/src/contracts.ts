export type KnowledgeNodeType =
  | "personal"
  | "community"
  | "university"
  | "research-institute"
  | "school"
  | "company"
  | "government"
  | "ngo"
  | "library"
  | "museum"
  | "enterprise"
  | "scientific-cluster"
  | "edge-device"
  | "offline"
  | "future-space";

export type FederationExchangeType =
  | "knowledge-discovery"
  | "search"
  | "question"
  | "project"
  | "workflow"
  | "agent"
  | "marketplace"
  | "benchmark";

export type ReplicationMode =
  | "manual"
  | "selective"
  | "scheduled"
  | "policy-based"
  | "community"
  | "research"
  | "emergency-backup"
  | "knowledge-mirroring";

export type FederatedSearchScope =
  | "local"
  | "federated"
  | "semantic"
  | "graph"
  | "research"
  | "community"
  | "marketplace"
  | "agent"
  | "dataset"
  | "workflow";

export interface FederationEndpoint {
  readonly id: string;
  readonly nodeId: string;
  readonly url: string;
  readonly visibility: "public" | "private";
  readonly protocolVersion: string;
  readonly authenticationRequired: boolean;
  readonly exchangeTypes: readonly FederationExchangeType[];
}

export interface FederationPolicy {
  readonly id: string;
  readonly nodeId: string;
  readonly privacyRules: readonly string[];
  readonly exportRules: readonly string[];
  readonly researchRestrictions: readonly string[];
  readonly educationRules: readonly string[];
  readonly licensingRules: readonly string[];
  readonly marketplaceRules: readonly string[];
  readonly aiRules: readonly string[];
  readonly synchronizationRules: readonly string[];
  readonly machineReadable: true;
}

export interface KnowledgeNode {
  readonly id: string;
  readonly type: KnowledgeNodeType;
  readonly ownerId: string;
  readonly organizationId?: string;
  readonly country: string;
  readonly jurisdiction: string;
  readonly capabilityIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly questionIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly marketplaceAssetIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly workflowIds: readonly string[];
  readonly policyIds: readonly string[];
  readonly trustRecordIds: readonly string[];
  readonly semantiqStatisticIds: readonly string[];
  readonly synchronizationStatusId: string;
  readonly publicEndpointIds: readonly string[];
  readonly privateEndpointIds: readonly string[];
  readonly health: "healthy" | "degraded" | "offline" | "unknown";
  readonly autonomous: true;
}

export interface FederationProtocolManifest {
  readonly id: string;
  readonly nodeId: string;
  readonly protocolVersion: string;
  readonly supportedExchangeTypes: readonly FederationExchangeType[];
  readonly authenticationMethods: readonly string[];
  readonly trustExchangeSupported: boolean;
  readonly versionNegotiationSupported: boolean;
  readonly vendorNeutral: true;
}

export interface NodeTrustRecord {
  readonly id: string;
  readonly evaluatorNodeId: string;
  readonly subjectNodeId: string;
  readonly identityScore: number;
  readonly reputationScore: number;
  readonly researchIntegrityScore: number;
  readonly securityScore: number;
  readonly protocolComplianceScore: number;
  readonly benchmarkQualityScore: number;
  readonly availabilityScore: number;
  readonly transparencyScore: number;
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
}

export interface FederatedSearchQuery {
  readonly id: string;
  readonly originNodeId: string;
  readonly text: string;
  readonly scopes: readonly FederatedSearchScope[];
  readonly targetNodeIds: readonly string[];
  readonly limit: number;
  readonly rankingWeights: {
    readonly knowledgeQuality: number;
    readonly trust: number;
    readonly evidence: number;
    readonly semantiq: number;
    readonly freshness: number;
    readonly localPolicy: number;
  };
}

export interface FederatedSearchResult {
  readonly id: string;
  readonly queryId: string;
  readonly nodeId: string;
  readonly objectId: string;
  readonly objectType: string;
  readonly title: string;
  readonly score: number;
  readonly trustRecordIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
  readonly provenanceIds: readonly string[];
}

export interface DistributedGraphReference {
  readonly id: string;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly relationType: string;
  readonly provenanceIds: readonly string[];
  readonly version: string;
  readonly trustRecordIds: readonly string[];
  readonly policyIds: readonly string[];
}

export interface KnowledgeReplicationPlan {
  readonly id: string;
  readonly mode: ReplicationMode;
  readonly sourceNodeId: string;
  readonly targetNodeIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly policyIds: readonly string[];
  readonly signedPackageRequired: boolean;
  readonly preserveProvenance: true;
  readonly schedule?: string;
}

export interface FederationSyncStatus {
  readonly id: string;
  readonly nodeId: string;
  readonly peerNodeId: string;
  readonly status: "idle" | "scheduled" | "syncing" | "completed" | "conflict" | "failed" | "offline";
  readonly lastSyncedAt?: string;
  readonly conflictIds: readonly string[];
  readonly delayed: boolean;
}

export interface CrossNodeExchange {
  readonly id: string;
  readonly type: FederationExchangeType;
  readonly sourceNodeId: string;
  readonly targetNodeId: string;
  readonly objectIds: readonly string[];
  readonly protocolVersion: string;
  readonly policyIds: readonly string[];
  readonly auditIds: readonly string[];
}

export interface FederationRepository {
  saveNode(node: KnowledgeNode): Promise<void>;
  getNode(nodeId: string): Promise<KnowledgeNode | undefined>;
  listNodes(): Promise<readonly KnowledgeNode[]>;
  saveEndpoint(endpoint: FederationEndpoint): Promise<void>;
  savePolicy(policy: FederationPolicy): Promise<void>;
  saveTrust(record: NodeTrustRecord): Promise<void>;
  saveSyncStatus(status: FederationSyncStatus): Promise<void>;
  saveExchange(exchange: CrossNodeExchange): Promise<void>;
  publishEvent(event: FederationEvent): Promise<void>;
}

export interface FederationService {
  discoverNodes(): Promise<readonly KnowledgeNode[]>;
  joinFederation(node: KnowledgeNode): Promise<void>;
  leaveFederation(nodeId: string): Promise<void>;
  searchFederation(query: FederatedSearchQuery): Promise<readonly FederatedSearchResult[]>;
  replicateKnowledge(plan: KnowledgeReplicationPlan): Promise<void>;
  synchronizeNode(status: FederationSyncStatus): Promise<void>;
  exchangeQuestions(exchange: CrossNodeExchange): Promise<void>;
  exchangeProjects(exchange: CrossNodeExchange): Promise<void>;
  exchangeAgents(exchange: CrossNodeExchange): Promise<void>;
  exchangeMarketplaceAssets(exchange: CrossNodeExchange): Promise<void>;
  benchmarkFederation(): Promise<readonly NodeTrustRecord[]>;
}

export interface FederationEvent {
  readonly type:
    | "NodeRegistered"
    | "NodeDiscovered"
    | "KnowledgeReplicated"
    | "SynchronizationStarted"
    | "SynchronizationCompleted"
    | "TrustUpdated"
    | "FederationJoined"
    | "FederationLeft"
    | "CrossNodeProjectCreated"
    | "RemoteAgentStarted";
  readonly version: number;
  readonly occurredAt: string;
  readonly nodeId?: string;
  readonly peerNodeId?: string;
  readonly payload: unknown;
}

export type * from "./contracts.js";

import type {
  CrossNodeExchange,
  FederatedSearchQuery,
  FederatedSearchResult,
  FederationEvent,
  FederationRepository,
  FederationService,
  FederationSyncStatus,
  KnowledgeNode,
  KnowledgeReplicationPlan,
  NodeTrustRecord
} from "./contracts.js";

export class LocalFederationRepository implements FederationRepository {
  private readonly nodes = new Map<string, KnowledgeNode>();
  private readonly trust: NodeTrustRecord[] = [];
  private readonly sync = new Map<string, FederationSyncStatus>();
  private readonly exchanges: CrossNodeExchange[] = [];
  private readonly events: FederationEvent[] = [];

  async saveNode(node: KnowledgeNode): Promise<void> {
    this.nodes.set(node.id, node);
  }

  async getNode(nodeId: string): Promise<KnowledgeNode | undefined> {
    return this.nodes.get(nodeId);
  }

  async listNodes(): Promise<readonly KnowledgeNode[]> {
    return [...this.nodes.values()];
  }

  async saveEndpoint(): Promise<void> {
    return;
  }

  async savePolicy(): Promise<void> {
    return;
  }

  async saveTrust(record: NodeTrustRecord): Promise<void> {
    this.trust.push(Object.freeze(record));
  }

  async saveSyncStatus(status: FederationSyncStatus): Promise<void> {
    this.sync.set(status.id, status);
  }

  async saveExchange(exchange: CrossNodeExchange): Promise<void> {
    this.exchanges.push(Object.freeze(exchange));
  }

  async publishEvent(event: FederationEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listEvents(): readonly FederationEvent[] {
    return this.events;
  }
}

export class LocalFederationService implements FederationService {
  constructor(
    private readonly repository: LocalFederationRepository = new LocalFederationRepository()
  ) {}

  async discoverNodes(): Promise<readonly KnowledgeNode[]> {
    const nodes = await this.repository.listNodes();
    for (const node of nodes) {
      await this.emit("NodeDiscovered", { health: node.health }, node.id);
    }
    return nodes;
  }

  async joinFederation(node: KnowledgeNode): Promise<void> {
    if (!node.autonomous) {
      throw new Error("Federation nodes must remain autonomous");
    }
    await this.repository.saveNode(node);
    await this.emit(
      "NodeRegistered",
      { type: node.type, jurisdiction: node.jurisdiction },
      node.id
    );
    await this.emit("FederationJoined", { optional: true }, node.id);
  }

  async leaveFederation(nodeId: string): Promise<void> {
    await this.requireNode(nodeId);
    await this.emit("FederationLeft", { localOwnershipPreserved: true }, nodeId);
  }

  async searchFederation(query: FederatedSearchQuery): Promise<readonly FederatedSearchResult[]> {
    const nodes = await this.repository.listNodes();
    const targetNodes =
      query.targetNodeIds.length > 0
        ? nodes.filter((node) => query.targetNodeIds.includes(node.id))
        : nodes;
    return targetNodes.slice(0, query.limit).map((node, index) => ({
      id: `${query.id}:result:${index + 1}`,
      queryId: query.id,
      nodeId: node.id,
      objectId: `${node.id}:remote-object`,
      objectType: query.scopes[0] ?? "federated",
      title: `Federated result from ${node.id}`,
      score: scoreNode(node, query),
      trustRecordIds: node.trustRecordIds,
      semantiqScoreIds: node.semantiqStatisticIds,
      provenanceIds: [`${node.id}:provenance`]
    }));
  }

  async replicateKnowledge(plan: KnowledgeReplicationPlan): Promise<void> {
    await this.requireNode(plan.sourceNodeId);
    if (!plan.preserveProvenance) {
      throw new Error("Knowledge replication must preserve provenance");
    }
    await this.emit(
      "KnowledgeReplicated",
      { mode: plan.mode, objectIds: plan.objectIds },
      plan.sourceNodeId,
      plan.targetNodeIds[0]
    );
  }

  async synchronizeNode(status: FederationSyncStatus): Promise<void> {
    await this.requireNode(status.nodeId);
    await this.requireNode(status.peerNodeId);
    await this.repository.saveSyncStatus(status);
    await this.emit(
      "SynchronizationStarted",
      { status: status.status },
      status.nodeId,
      status.peerNodeId
    );
    if (status.status === "completed") {
      await this.emit(
        "SynchronizationCompleted",
        { conflictIds: status.conflictIds },
        status.nodeId,
        status.peerNodeId
      );
    }
  }

  async exchangeQuestions(exchange: CrossNodeExchange): Promise<void> {
    await this.saveExchange("question", exchange);
  }

  async exchangeProjects(exchange: CrossNodeExchange): Promise<void> {
    await this.saveExchange("project", exchange);
    await this.emit(
      "CrossNodeProjectCreated",
      { objectIds: exchange.objectIds },
      exchange.sourceNodeId,
      exchange.targetNodeId
    );
  }

  async exchangeAgents(exchange: CrossNodeExchange): Promise<void> {
    await this.saveExchange("agent", exchange);
    await this.emit(
      "RemoteAgentStarted",
      { objectIds: exchange.objectIds },
      exchange.sourceNodeId,
      exchange.targetNodeId
    );
  }

  async exchangeMarketplaceAssets(exchange: CrossNodeExchange): Promise<void> {
    await this.saveExchange("marketplace", exchange);
  }

  async benchmarkFederation(): Promise<readonly NodeTrustRecord[]> {
    const nodes = await this.repository.listNodes();
    const records = nodes.map<NodeTrustRecord>((node) => ({
      id: `${node.id}:trust:${Date.now()}`,
      evaluatorNodeId: "local",
      subjectNodeId: node.id,
      identityScore: node.ownerId ? 1 : 0,
      reputationScore: node.trustRecordIds.length,
      researchIntegrityScore: node.researchIds.length,
      securityScore: node.privateEndpointIds.length > 0 ? 1 : 0.5,
      protocolComplianceScore: 1,
      benchmarkQualityScore: node.semantiqStatisticIds.length,
      availabilityScore: node.health === "healthy" ? 1 : 0,
      transparencyScore: node.publicEndpointIds.length > 0 ? 1 : 0.5,
      explanation: "Local federation benchmark derived from node model coverage.",
      evidenceIds: [node.id]
    }));
    for (const record of records) {
      await this.repository.saveTrust(record);
      await this.emit("TrustUpdated", { trustRecordId: record.id }, record.subjectNodeId);
    }
    return records;
  }

  private async saveExchange(
    expectedType: CrossNodeExchange["type"],
    exchange: CrossNodeExchange
  ): Promise<void> {
    if (exchange.type !== expectedType) {
      throw new Error(`Expected ${expectedType} exchange, received ${exchange.type}`);
    }
    await this.requireNode(exchange.sourceNodeId);
    await this.requireNode(exchange.targetNodeId);
    await this.repository.saveExchange(exchange);
  }

  private async requireNode(nodeId: string): Promise<KnowledgeNode> {
    const node = await this.repository.getNode(nodeId);
    if (!node) {
      throw new Error(`Knowledge node not found: ${nodeId}`);
    }
    return node;
  }

  private async emit(
    type: FederationEvent["type"],
    payload: unknown,
    nodeId?: string,
    peerNodeId?: string
  ): Promise<void> {
    const event: FederationEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withNode = nodeId ? { ...event, nodeId } : event;
    const withPeer = peerNodeId ? { ...withNode, peerNodeId } : withNode;
    await this.repository.publishEvent(withPeer);
  }
}

function scoreNode(node: KnowledgeNode, query: FederatedSearchQuery): number {
  return (
    node.questionIds.length * query.rankingWeights.knowledgeQuality +
    node.trustRecordIds.length * query.rankingWeights.trust +
    node.semantiqStatisticIds.length * query.rankingWeights.semantiq
  );
}

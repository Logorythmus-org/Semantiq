import type { KnowledgeObjectAggregate } from "../../core/src/index.js";

export type KnowledgeNodeType =
  | "question"
  | "knowledge"
  | "evidence"
  | "project"
  | "community"
  | "research"
  | "publication"
  | "experiment"
  | "dataset"
  | "workflow"
  | "agent"
  | "user"
  | "organization"
  | "institution"
  | "marketplace-asset"
  | "education-object"
  | "innovation"
  | "policy";

export type SemanticRelationType =
  | "answers"
  | "extends"
  | "supports"
  | "contradicts"
  | "belongs_to"
  | "depends_on"
  | "references"
  | "inspired_by"
  | "generated_by"
  | "validated_by"
  | "improves"
  | "teaches"
  | "requires"
  | "funds";

export type KnowledgeIntelligenceEventType =
  | "NodeCreated"
  | "NodeUpdated"
  | "EdgeCreated"
  | "GraphUpdated"
  | "QuestionAnalyzed"
  | "SemantiqCompleted"
  | "RecommendationGenerated"
  | "SearchExecuted"
  | "KnowledgeCompared"
  | "TimelineUpdated";

export interface KnowledgeNode {
  readonly id: string;
  readonly type: KnowledgeNodeType;
  readonly object: KnowledgeObjectAggregate;
  readonly labels: readonly string[];
  readonly properties: Readonly<Record<string, unknown>>;
  readonly federationRefs: readonly string[];
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface KnowledgeEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly relation: SemanticRelationType;
  readonly confidence: number;
  readonly weight: number;
  readonly timestamp: string;
  readonly evidenceIds: readonly string[];
  readonly version: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly auditIds: readonly string[];
}

export interface TimelineEntry {
  readonly id: string;
  readonly objectId: string;
  readonly type: KnowledgeIntelligenceEventType;
  readonly summary: string;
  readonly occurredAt: string;
  readonly version: string;
}

export interface KnowledgeIntelligenceEvent {
  readonly type: KnowledgeIntelligenceEventType;
  readonly version: number;
  readonly occurredAt: string;
  readonly objectId?: string;
  readonly edgeId?: string;
  readonly payload: unknown;
}

export interface SearchResult {
  readonly nodeId: string;
  readonly score: number;
  readonly explanation: string;
}

export interface RecommendationResult {
  readonly id: string;
  readonly type:
    | "question"
    | "community"
    | "project"
    | "research"
    | "learning"
    | "mentor"
    | "workflow"
    | "agent"
    | "game"
    | "narrative"
    | "marketplace-asset";
  readonly targetId: string;
  readonly score: number;
  readonly explanation: string;
  readonly sourceSignals: readonly string[];
}

export interface GraphQuery {
  readonly startNodeId?: string;
  readonly relationTypes?: readonly SemanticRelationType[];
  readonly labels?: readonly string[];
  readonly text?: string;
  readonly maxDepth?: number;
}

export interface KnowledgeGraphRuntimeApi {
  createNode(node: KnowledgeNode): Promise<void>;
  createEdge(edge: KnowledgeEdge): Promise<void>;
  neighborhood(nodeId: string, depth?: number): Promise<readonly KnowledgeNode[]>;
  shortestPath(from: string, to: string): Promise<readonly string[]>;
  subgraph(query: GraphQuery): Promise<{
    readonly nodes: readonly KnowledgeNode[];
    readonly edges: readonly KnowledgeEdge[];
  }>;
  searchKnowledge(query: string, limit?: number): Promise<readonly SearchResult[]>;
  recommendKnowledge(nodeId: string, limit?: number): Promise<readonly RecommendationResult[]>;
  findRelations(
    nodeId: string,
    relationTypes?: readonly SemanticRelationType[]
  ): Promise<readonly KnowledgeEdge[]>;
  getTimeline(objectId: string): Promise<readonly TimelineEntry[]>;
  compareKnowledge(
    leftId: string,
    rightId: string
  ): Promise<{ readonly overlap: number; readonly explanation: string }>;
  explainScore(nodeId: string): Promise<string>;
  events(): readonly KnowledgeIntelligenceEvent[];
}

const createId = (prefix: string): string =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export const createKnowledgeEdge = (
  id: string,
  sourceId: string,
  targetId: string,
  relation: SemanticRelationType,
  evidenceIds: readonly string[] = [],
  metadata: Readonly<Record<string, unknown>> = {}
): KnowledgeEdge => {
  if (sourceId === targetId) {
    throw new Error("Knowledge edge cannot target the same node");
  }
  return {
    id,
    sourceId,
    targetId,
    relation,
    confidence: evidenceIds.length > 0 ? 0.8 : 0.5,
    weight: 1,
    timestamp: new Date().toISOString(),
    evidenceIds,
    version: "1.0.0",
    metadata,
    auditIds: []
  };
};

export class LocalKnowledgeGraphRuntime implements KnowledgeGraphRuntimeApi {
  private readonly nodes = new Map<string, KnowledgeNode>();
  private readonly edges = new Map<string, KnowledgeEdge>();
  private readonly timelineEntries: TimelineEntry[] = [];
  private readonly eventLog: KnowledgeIntelligenceEvent[] = [];
  private readonly searchCache = new Map<string, readonly SearchResult[]>();
  private readonly recommendationCache = new Map<string, readonly RecommendationResult[]>();

  async createNode(node: KnowledgeNode): Promise<void> {
    this.nodes.set(node.id, node);
    this.record("NodeCreated", node.id, { type: node.type, labels: node.labels });
    this.timeline(node.id, "NodeCreated", `Node ${node.id} created`);
  }

  async createEdge(edge: KnowledgeEdge): Promise<void> {
    if (!this.nodes.has(edge.sourceId) || !this.nodes.has(edge.targetId)) {
      throw new Error("Knowledge edge requires source and target nodes");
    }
    this.edges.set(edge.id, edge);
    this.searchCache.clear();
    this.recommendationCache.clear();
    this.record(
      "EdgeCreated",
      edge.sourceId,
      { edgeId: edge.id, relation: edge.relation },
      edge.id
    );
    this.record("GraphUpdated", edge.sourceId, { edgeId: edge.id }, edge.id);
    this.timeline(edge.sourceId, "EdgeCreated", `${edge.relation} relation to ${edge.targetId}`);
  }

  async neighborhood(nodeId: string, depth = 1): Promise<readonly KnowledgeNode[]> {
    const ids = new Set<string>([nodeId]);
    let frontier = [nodeId];
    for (let level = 0; level < depth; level += 1) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const edge of this.edges.values()) {
          if (edge.sourceId === id && !ids.has(edge.targetId)) {
            ids.add(edge.targetId);
            next.push(edge.targetId);
          }
          if (edge.targetId === id && !ids.has(edge.sourceId)) {
            ids.add(edge.sourceId);
            next.push(edge.sourceId);
          }
        }
      }
      frontier = next;
    }
    return [...ids]
      .map((id) => this.nodes.get(id))
      .filter((node): node is KnowledgeNode => Boolean(node));
  }

  async shortestPath(from: string, to: string): Promise<readonly string[]> {
    const queue: readonly string[][] = [[from]];
    const visited = new Set<string>([from]);
    const mutableQueue = [...queue];
    while (mutableQueue.length > 0) {
      const path = mutableQueue.shift();
      if (!path) {
        break;
      }
      const current = path[path.length - 1];
      if (current === to) {
        return path;
      }
      if (!current) {
        continue;
      }
      const neighbors = await this.neighborhood(current, 1);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          mutableQueue.push([...path, neighbor.id]);
        }
      }
    }
    return [];
  }

  async subgraph(query: GraphQuery): Promise<{
    readonly nodes: readonly KnowledgeNode[];
    readonly edges: readonly KnowledgeEdge[];
  }> {
    const maxDepth = query.maxDepth ?? 1;
    const baseNodes = query.startNodeId
      ? await this.neighborhood(query.startNodeId, maxDepth)
      : [...this.nodes.values()];
    const nodes = baseNodes.filter((node) => {
      const labelsMatch = query.labels
        ? query.labels.some((label) => node.labels.includes(label))
        : true;
      const textMatch = query.text ? this.nodeText(node).includes(query.text.toLowerCase()) : true;
      return labelsMatch && textMatch;
    });
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = [...this.edges.values()].filter((edge) => {
      const relationMatch = query.relationTypes
        ? query.relationTypes.includes(edge.relation)
        : true;
      return relationMatch && nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId);
    });
    return { nodes, edges };
  }

  async searchKnowledge(query: string, limit = 10): Promise<readonly SearchResult[]> {
    const cacheKey = `${query}:${limit}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const results = [...this.nodes.values()]
      .map((node) => {
        const text = this.nodeText(node);
        const matches = terms.filter((term) => text.includes(term)).length;
        const score = terms.length === 0 ? 0 : matches / terms.length;
        return {
          nodeId: node.id,
          score,
          explanation: `Matched ${matches} of ${terms.length} query terms against title, labels, and metadata.`
        };
      })
      .filter((result) => result.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
    this.searchCache.set(cacheKey, results);
    this.record("SearchExecuted", undefined, { query, count: results.length });
    return results;
  }

  async recommendKnowledge(nodeId: string, limit = 5): Promise<readonly RecommendationResult[]> {
    const cached = this.recommendationCache.get(nodeId);
    if (cached) {
      return cached.slice(0, limit);
    }
    const edges = await this.findRelations(nodeId);
    const recommendations = edges
      .map((edge) => {
        const targetId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
        const target = this.nodes.get(targetId);
        return {
          id: createId("recommendation"),
          type: this.recommendationType(target?.type),
          targetId,
          score: edge.confidence * edge.weight,
          explanation: `Recommended through ${edge.relation} relation with confidence ${edge.confidence}.`,
          sourceSignals: [edge.id, edge.relation]
        } satisfies RecommendationResult;
      })
      .sort((left, right) => right.score - left.score);
    this.recommendationCache.set(nodeId, recommendations);
    this.record("RecommendationGenerated", nodeId, { count: recommendations.length });
    return recommendations.slice(0, limit);
  }

  async findRelations(
    nodeId: string,
    relationTypes?: readonly SemanticRelationType[]
  ): Promise<readonly KnowledgeEdge[]> {
    return [...this.edges.values()].filter((edge) => {
      const touchesNode = edge.sourceId === nodeId || edge.targetId === nodeId;
      const relationMatches = relationTypes ? relationTypes.includes(edge.relation) : true;
      return touchesNode && relationMatches;
    });
  }

  async getTimeline(objectId: string): Promise<readonly TimelineEntry[]> {
    this.record("TimelineUpdated", objectId, { objectId });
    return this.timelineEntries.filter((entry) => entry.objectId === objectId);
  }

  async compareKnowledge(
    leftId: string,
    rightId: string
  ): Promise<{ readonly overlap: number; readonly explanation: string }> {
    const left = this.nodes.get(leftId);
    const right = this.nodes.get(rightId);
    if (!left || !right) {
      throw new Error("Cannot compare missing knowledge nodes");
    }
    const leftTerms = new Set(this.nodeText(left).split(/\s+/).filter(Boolean));
    const rightTerms = new Set(this.nodeText(right).split(/\s+/).filter(Boolean));
    const intersection = [...leftTerms].filter((term) => rightTerms.has(term)).length;
    const union = new Set([...leftTerms, ...rightTerms]).size;
    const overlap = union === 0 ? 0 : intersection / union;
    this.record("KnowledgeCompared", leftId, { leftId, rightId, overlap });
    return { overlap, explanation: `Compared semantic text overlap across ${union} unique terms.` };
  }

  async explainScore(nodeId: string): Promise<string> {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node not found: ${nodeId}`);
    }
    const relations = await this.findRelations(nodeId);
    return `Node ${nodeId} has ${relations.length} semantic relations, labels ${node.labels.join(", ")}, and version ${node.version}.`;
  }

  events(): readonly KnowledgeIntelligenceEvent[] {
    return this.eventLog;
  }

  private nodeText(node: KnowledgeNode): string {
    return `${node.object.title} ${node.labels.join(" ")} ${JSON.stringify(node.properties)} ${JSON.stringify(node.object.metadata)}`.toLowerCase();
  }

  private recommendationType(type: KnowledgeNodeType | undefined): RecommendationResult["type"] {
    if (type === "community") return "community";
    if (type === "project") return "project";
    if (type === "research") return "research";
    if (type === "workflow") return "workflow";
    if (type === "agent") return "agent";
    if (type === "marketplace-asset") return "marketplace-asset";
    if (type === "education-object") return "learning";
    if (type === "question") return "question";
    return "research";
  }

  private record(
    type: KnowledgeIntelligenceEventType,
    objectId: string | undefined,
    payload: unknown,
    edgeId?: string
  ): void {
    const base: KnowledgeIntelligenceEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withObject = objectId ? { ...base, objectId } : base;
    const withEdge = edgeId ? { ...withObject, edgeId } : withObject;
    this.eventLog.push(Object.freeze(withEdge));
  }

  private timeline(objectId: string, type: KnowledgeIntelligenceEventType, summary: string): void {
    this.timelineEntries.push({
      id: createId("timeline"),
      objectId,
      type,
      summary,
      occurredAt: new Date().toISOString(),
      version: "1.0.0"
    });
  }
}

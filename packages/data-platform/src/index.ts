export type * from "./contracts.js";

import type {
  GraphQuery,
  SearchQuery,
  SearchResult,
  SemanticNode,
  SemanticRelation,
  SemanticRepository,
  VersionRecord
} from "./contracts.js";

export class LocalSemanticRepository implements SemanticRepository {
  private readonly nodes = new Map<string, SemanticNode>();
  private readonly relations = new Map<string, SemanticRelation>();
  private readonly versions = new Map<string, VersionRecord[]>();

  async createNode<TData>(node: SemanticNode<TData>): Promise<void> {
    this.nodes.set(node.id.stableId, node as SemanticNode);
    this.recordVersion(node.id.stableId, node.version, node.id.hash);
  }

  async updateNode<TData>(node: SemanticNode<TData>): Promise<void> {
    if (!this.nodes.has(node.id.stableId)) {
      throw new Error(`Node not found: ${node.id.stableId}`);
    }
    this.nodes.set(node.id.stableId, node as SemanticNode);
    this.recordVersion(node.id.stableId, node.version, node.id.hash);
  }

  async deleteNode(nodeId: string): Promise<void> {
    this.nodes.delete(nodeId);
  }

  async restoreNode(nodeId: string): Promise<void> {
    if (!this.versions.has(nodeId)) {
      throw new Error(`No version history for node: ${nodeId}`);
    }
  }

  async getNode<TData>(nodeId: string): Promise<SemanticNode<TData> | undefined> {
    return this.nodes.get(nodeId) as SemanticNode<TData> | undefined;
  }

  async createRelation<TData>(relation: SemanticRelation<TData>): Promise<void> {
    if (!this.nodes.has(relation.sourceId) || !this.nodes.has(relation.targetId)) {
      throw new Error("Relation endpoints must exist before relation creation");
    }
    this.relations.set(relation.id.stableId, relation as SemanticRelation);
    this.recordVersion(relation.id.stableId, relation.version, relation.id.hash);
  }

  async deleteRelation(relationId: string): Promise<void> {
    this.relations.delete(relationId);
  }

  async queryGraph(query: GraphQuery): Promise<readonly SemanticRelation[]> {
    const relations = [...this.relations.values()].filter((relation) => {
      const startsAtNode =
        !query.startNodeId ||
        relation.sourceId === query.startNodeId ||
        relation.targetId === query.startNodeId;
      const matchesType =
        !query.relationshipTypes?.length || query.relationshipTypes.includes(relation.type);
      return startsAtNode && matchesType;
    });
    return relations.slice(0, query.limit);
  }

  async search(query: SearchQuery): Promise<readonly SearchResult[]> {
    const text = query.text?.toLowerCase();
    return [...this.nodes.values()]
      .filter((node) => !query.kind || node.kind === query.kind)
      .filter(
        (node) => !query.tags?.length || query.tags.every((tag) => node.semanticTags.includes(tag))
      )
      .filter(
        (node) =>
          !text ||
          node.metadata.title?.toLowerCase().includes(text) ||
          node.metadata.summary?.toLowerCase().includes(text)
      )
      .slice(0, query.limit ?? 50)
      .map((node) => ({
        nodeId: node.id.stableId,
        score: 1,
        source: "keyword",
        highlights: []
      }));
  }

  async versionHistory(objectId: string): Promise<readonly VersionRecord[]> {
    return this.versions.get(objectId) ?? [];
  }

  async compareVersions(
    objectId: string,
    fromVersion: string,
    toVersion: string
  ): Promise<unknown> {
    return { objectId, fromVersion, toVersion };
  }

  private recordVersion(objectId: string, version: VersionRecord["version"], hash: string): void {
    const history = this.versions.get(objectId) ?? [];
    history.push({ objectId, version, hash });
    this.versions.set(objectId, history);
  }
}

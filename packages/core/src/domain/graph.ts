import type { IdentityId, KnowledgeId, RelationId } from "./identifiers.js";

export type GraphRelationType =
  | "answers"
  | "extends"
  | "contradicts"
  | "supports"
  | "references"
  | "derived_from"
  | "generated_by"
  | "funded_by"
  | "belongs_to"
  | "improves"
  | "requires"
  | "teaches";

export interface GraphNode {
  readonly id: KnowledgeId;
  readonly labels: readonly string[];
  readonly properties: Readonly<Record<string, unknown>>;
  readonly version: string;
  readonly createdAt: string;
}

export interface GraphEdge {
  readonly id: RelationId;
  readonly from: KnowledgeId;
  readonly to: KnowledgeId;
  readonly type: GraphRelationType;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdBy: IdentityId;
  readonly createdAt: string;
  readonly version: string;
}

export interface GraphTraversalQuery {
  readonly startNodeId: KnowledgeId;
  readonly relationTypes?: readonly GraphRelationType[];
  readonly maxDepth: number;
}

export interface GraphTraversalResult {
  readonly nodeIds: readonly KnowledgeId[];
  readonly edgeIds: readonly RelationId[];
}

export const createRelation = (
  id: RelationId,
  from: KnowledgeId,
  to: KnowledgeId,
  type: GraphRelationType,
  createdBy: IdentityId,
  metadata: Readonly<Record<string, unknown>> = {}
): GraphEdge => {
  if (from === to) {
    throw new Error("Graph relation cannot target the same node");
  }
  return {
    id,
    from,
    to,
    type,
    metadata,
    createdBy,
    createdAt: new Date().toISOString(),
    version: "1.0.0"
  };
};

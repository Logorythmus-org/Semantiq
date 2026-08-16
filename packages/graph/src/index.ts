export interface GraphNode {
  readonly id: string;
  readonly type: string;
  readonly properties: Readonly<Record<string, unknown>>;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly type: string;
}

export {
  GraphApplicationService,
  MemoryGraphRepository,
  createRelation,
  type GraphRelationType,
  type GraphTraversalQuery,
  type GraphTraversalResult
} from "../../core/src/index.js";

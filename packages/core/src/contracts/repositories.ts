import type { CoreDomainEvent } from "../domain/events.js";
import type {
  GraphEdge,
  GraphNode,
  GraphTraversalQuery,
  GraphTraversalResult
} from "../domain/graph.js";
import type {
  IdentityId,
  KnowledgeId,
  PermissionId,
  QuestionId,
  RelationId,
  WorkspaceId
} from "../domain/identifiers.js";
import type {
  IdentityAggregate,
  KnowledgeObjectAggregate,
  QuestionAggregate,
  WorkspaceAggregate
} from "../domain/models.js";
import type { PermissionGrant } from "../domain/permissions.js";

export interface IdentityRepository {
  save(identity: IdentityAggregate): Promise<void>;
  get(id: IdentityId): Promise<IdentityAggregate | undefined>;
}

export interface WorkspaceRepository {
  save(workspace: WorkspaceAggregate): Promise<void>;
  get(id: WorkspaceId): Promise<WorkspaceAggregate | undefined>;
}

export interface KnowledgeRepository {
  save(object: KnowledgeObjectAggregate): Promise<void>;
  get(id: KnowledgeId): Promise<KnowledgeObjectAggregate | undefined>;
}

export interface QuestionRepository {
  save(question: QuestionAggregate): Promise<void>;
  get(id: QuestionId): Promise<QuestionAggregate | undefined>;
}

export interface GraphRepository {
  saveNode(node: GraphNode): Promise<void>;
  getNode(id: KnowledgeId): Promise<GraphNode | undefined>;
  saveEdge(edge: GraphEdge): Promise<void>;
  getEdge(id: RelationId): Promise<GraphEdge | undefined>;
  traverse(query: GraphTraversalQuery): Promise<GraphTraversalResult>;
}

export interface PermissionRepository {
  save(grant: PermissionGrant): Promise<void>;
  get(id: PermissionId): Promise<PermissionGrant | undefined>;
  list(subjectId: IdentityId, resourceId?: string): Promise<readonly PermissionGrant[]>;
  delete(id: PermissionId): Promise<void>;
}

export interface EventRepository {
  append(event: CoreDomainEvent): Promise<void>;
  list(): Promise<readonly CoreDomainEvent[]>;
}

export interface CoreUnitOfWork {
  readonly identities: IdentityRepository;
  readonly workspaces: WorkspaceRepository;
  readonly knowledge: KnowledgeRepository;
  readonly questions: QuestionRepository;
  readonly graph: GraphRepository;
  readonly permissions: PermissionRepository;
  readonly events: EventRepository;
}

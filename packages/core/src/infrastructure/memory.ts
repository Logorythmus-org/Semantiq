import type { CoreDomainEvent, CoreDomainEventType, EventBus, EventHandler } from "../domain/events.js";
import type { GraphEdge, GraphNode, GraphTraversalQuery, GraphTraversalResult } from "../domain/graph.js";
import type { KnowledgeId, RelationId } from "../domain/identifiers.js";
import type { IdentityAggregate, KnowledgeObjectAggregate, QuestionAggregate, WorkspaceAggregate } from "../domain/models.js";
import type { PermissionGrant } from "../domain/permissions.js";
import type {
  CoreUnitOfWork,
  EventRepository,
  GraphRepository,
  IdentityRepository,
  KnowledgeRepository,
  PermissionRepository,
  QuestionRepository,
  WorkspaceRepository
} from "../contracts/repositories.js";

class MapRepository<T extends { readonly id: string }> {
  protected readonly values = new Map<string, T>();

  async save(value: T): Promise<void> {
    this.values.set(value.id, value);
  }

  async get(id: string): Promise<T | undefined> {
    return this.values.get(id);
  }
}

export class MemoryIdentityRepository extends MapRepository<IdentityAggregate> implements IdentityRepository {}
export class MemoryWorkspaceRepository extends MapRepository<WorkspaceAggregate> implements WorkspaceRepository {}
export class MemoryKnowledgeRepository extends MapRepository<KnowledgeObjectAggregate> implements KnowledgeRepository {}
export class MemoryQuestionRepository extends MapRepository<QuestionAggregate> implements QuestionRepository {}

export class MemoryPermissionRepository extends MapRepository<PermissionGrant> implements PermissionRepository {
  async list(subjectId: string, resourceId?: string): Promise<readonly PermissionGrant[]> {
    return [...this.values.values()].filter(
      (grant) => grant.subjectId === subjectId && (resourceId ? grant.resourceId === resourceId : true)
    );
  }

  async delete(id: string): Promise<void> {
    this.values.delete(id);
  }
}

export class MemoryEventRepository implements EventRepository {
  private readonly events: CoreDomainEvent[] = [];

  async append(event: CoreDomainEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  async list(): Promise<readonly CoreDomainEvent[]> {
    return this.events;
  }
}

export class MemoryGraphRepository implements GraphRepository {
  private readonly nodes = new Map<KnowledgeId, GraphNode>();
  private readonly edges = new Map<RelationId, GraphEdge>();

  async saveNode(node: GraphNode): Promise<void> {
    this.nodes.set(node.id, node);
  }

  async getNode(id: KnowledgeId): Promise<GraphNode | undefined> {
    return this.nodes.get(id);
  }

  async saveEdge(edge: GraphEdge): Promise<void> {
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
      throw new Error("Graph edge requires both nodes to exist");
    }
    this.edges.set(edge.id, edge);
  }

  async getEdge(id: RelationId): Promise<GraphEdge | undefined> {
    return this.edges.get(id);
  }

  async traverse(query: GraphTraversalQuery): Promise<GraphTraversalResult> {
    const visitedNodes = new Set<KnowledgeId>([query.startNodeId]);
    const visitedEdges = new Set<RelationId>();
    let frontier: KnowledgeId[] = [query.startNodeId];

    for (let depth = 0; depth < query.maxDepth; depth += 1) {
      const next: KnowledgeId[] = [];
      for (const nodeId of frontier) {
        for (const edge of this.edges.values()) {
          const typeMatches = query.relationTypes ? query.relationTypes.includes(edge.type) : true;
          if (edge.from === nodeId && typeMatches) {
            visitedEdges.add(edge.id);
            if (!visitedNodes.has(edge.to)) {
              visitedNodes.add(edge.to);
              next.push(edge.to);
            }
          }
        }
      }
      frontier = next;
    }

    return { nodeIds: [...visitedNodes], edgeIds: [...visitedEdges] };
  }
}

export class MemoryEventBus implements EventBus {
  private readonly handlers = new Map<CoreDomainEventType, EventHandler[]>();
  private readonly failed: CoreDomainEvent[] = [];

  async publish(event: CoreDomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch {
        this.failed.push(event);
      }
    }
  }

  subscribe(type: CoreDomainEventType, handler: EventHandler): void {
    const existing = this.handlers.get(type) ?? [];
    this.handlers.set(type, [...existing, handler]);
  }

  async replay(events: readonly CoreDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  deadLetters(): readonly CoreDomainEvent[] {
    return this.failed;
  }
}

export const createMemoryUnitOfWork = (): CoreUnitOfWork => ({
  identities: new MemoryIdentityRepository(),
  workspaces: new MemoryWorkspaceRepository(),
  knowledge: new MemoryKnowledgeRepository(),
  questions: new MemoryQuestionRepository(),
  graph: new MemoryGraphRepository(),
  permissions: new MemoryPermissionRepository(),
  events: new MemoryEventRepository()
});

export type * from "./contracts.js";

import type {
  LiveCollaborationSession,
  RuntimeDocument,
  RuntimeKnowledgeObject,
  RuntimeNotebook,
  RuntimeWorkspace,
  WorkspaceAnalyticsSnapshot,
  WorkspaceGraphProjection,
  WorkspaceRuntimeEvent,
  WorkspaceRuntimeRepository,
  WorkspaceRuntimeService,
  WorkspaceSearchRequest,
  WorkspaceSyncPlan
} from "./contracts.js";

export class LocalWorkspaceRuntimeRepository implements WorkspaceRuntimeRepository {
  private readonly workspaces = new Map<string, RuntimeWorkspace>();
  private readonly objects = new Map<string, RuntimeKnowledgeObject>();
  private readonly documents = new Map<string, RuntimeDocument>();
  private readonly notebooks = new Map<string, RuntimeNotebook>();
  private readonly collaboration = new Map<string, LiveCollaborationSession>();
  private readonly events: WorkspaceRuntimeEvent[] = [];

  async saveWorkspace(workspace: RuntimeWorkspace): Promise<void> {
    this.workspaces.set(workspace.id, workspace);
  }

  async getWorkspace(workspaceId: string): Promise<RuntimeWorkspace | undefined> {
    return this.workspaces.get(workspaceId);
  }

  async saveObject(object: RuntimeKnowledgeObject): Promise<void> {
    this.objects.set(object.id, object);
  }

  async getObject(objectId: string): Promise<RuntimeKnowledgeObject | undefined> {
    return this.objects.get(objectId);
  }

  async saveDocument(document: RuntimeDocument): Promise<void> {
    this.documents.set(document.id, document);
  }

  async saveNotebook(notebook: RuntimeNotebook): Promise<void> {
    this.notebooks.set(notebook.id, notebook);
  }

  async saveCollaboration(session: LiveCollaborationSession): Promise<void> {
    this.collaboration.set(session.id, session);
  }

  async publishEvent(event: WorkspaceRuntimeEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listObjects(workspaceId: string): readonly RuntimeKnowledgeObject[] {
    return [...this.objects.values()].filter((object) => object.workspaceId === workspaceId);
  }

  listEvents(): readonly WorkspaceRuntimeEvent[] {
    return this.events;
  }
}

export class LocalWorkspaceRuntimeService implements WorkspaceRuntimeService {
  constructor(
    private readonly repository: LocalWorkspaceRuntimeRepository = new LocalWorkspaceRuntimeRepository()
  ) {}

  async createWorkspace(workspace: RuntimeWorkspace): Promise<void> {
    if (!workspace.offlineEnabled) {
      throw new Error("Workspace Runtime requires offline-first support");
    }
    await this.repository.saveWorkspace(workspace);
    await this.emit("WorkspaceCreated", { purpose: workspace.purpose }, workspace.id);
  }

  async openWorkspace(workspaceId: string): Promise<RuntimeWorkspace> {
    const workspace = await this.requireWorkspace(workspaceId);
    await this.emit("WorkspaceOpened", { graphId: workspace.graphId }, workspace.id);
    return workspace;
  }

  async closeWorkspace(workspaceId: string): Promise<void> {
    await this.requireWorkspace(workspaceId);
    await this.emit("WorkspaceArchived", { state: "closed" }, workspaceId);
  }

  async createObject(object: RuntimeKnowledgeObject): Promise<void> {
    await this.requireWorkspace(object.workspaceId);
    await this.repository.saveObject(object);
    await this.emit(
      "KnowledgeObjectCreated",
      { kind: object.kind, title: object.title },
      object.workspaceId,
      object.id
    );
  }

  async moveObject(objectId: string, targetWorkspaceId: string): Promise<void> {
    const object = await this.repository.getObject(objectId);
    if (!object) {
      throw new Error(`Knowledge object not found: ${objectId}`);
    }
    await this.requireWorkspace(targetWorkspaceId);
    await this.emit(
      "KnowledgeObjectCreated",
      { movedFrom: object.workspaceId, movedTo: targetWorkspaceId },
      targetWorkspaceId,
      object.id
    );
  }

  async searchWorkspace(
    request: WorkspaceSearchRequest
  ): Promise<readonly RuntimeKnowledgeObject[]> {
    await this.requireWorkspace(request.workspaceId);
    const query = request.query.toLowerCase();
    return this.repository
      .listObjects(request.workspaceId)
      .filter(
        (object) =>
          object.title.toLowerCase().includes(query) || object.kind.toLowerCase().includes(query)
      )
      .slice(0, request.limit);
  }

  async launchNotebook(notebook: RuntimeNotebook): Promise<void> {
    await this.requireWorkspace(notebook.workspaceId);
    await this.repository.saveNotebook(notebook);
    await this.emit(
      "NotebookExecuted",
      { notebookId: notebook.id, cellCount: notebook.cellIds.length },
      notebook.workspaceId
    );
  }

  async launchAgent(workspaceId: string, agentId: string): Promise<void> {
    await this.requireWorkspace(workspaceId);
    await this.emit("AgentJoined", { agentId }, workspaceId);
  }

  async renderGraph(projection: WorkspaceGraphProjection): Promise<WorkspaceGraphProjection> {
    await this.requireWorkspace(projection.workspaceId);
    await this.emit(
      "GraphUpdated",
      { projectionId: projection.id, renderer: projection.renderer },
      projection.workspaceId
    );
    return projection;
  }

  async syncWorkspace(plan: WorkspaceSyncPlan): Promise<void> {
    await this.requireWorkspace(plan.workspaceId);
    if (!plan.encrypted) {
      throw new Error("Workspace synchronization must be encrypted");
    }
    await this.emit(
      "WorkspaceSynced",
      { syncPlanId: plan.id, scopes: plan.scopes },
      plan.workspaceId
    );
  }

  async shareWorkspace(workspaceId: string, principalIds: readonly string[]): Promise<void> {
    await this.requireWorkspace(workspaceId);
    if (principalIds.length === 0) {
      throw new Error("Sharing requires at least one principal");
    }
    await this.emit("WorkspaceOpened", { sharedWith: principalIds }, workspaceId);
  }

  async exportWorkspace(workspaceId: string): Promise<string> {
    const workspace = await this.requireWorkspace(workspaceId);
    const objects = this.repository.listObjects(workspaceId);
    return JSON.stringify({ workspace, objects }, null, 2);
  }

  async benchmarkWorkspace(workspaceId: string): Promise<WorkspaceAnalyticsSnapshot> {
    const workspace = await this.requireWorkspace(workspaceId);
    const objects = this.repository.listObjects(workspaceId);
    const snapshot: WorkspaceAnalyticsSnapshot = {
      workspaceId,
      workspaceHealth: objects.length > 0 ? "healthy" : "unknown",
      knowledgeGrowth: objects.length,
      researchActivity: workspace.projectIds.length + workspace.questionIds.length,
      collaboration: workspace.agentIds.length,
      execution: workspace.workflowIds.length,
      agentUsage: workspace.agentIds.length,
      learning: workspace.benchmarkIds.length,
      benchmarkCount: workspace.benchmarkIds.length,
      innovation: workspace.timelineEventIds.length,
      performance: 1,
      storage: workspace.objectIds.length
    };
    await this.emit("BenchmarkCompleted", { snapshot }, workspace.id);
    return snapshot;
  }

  private async requireWorkspace(workspaceId: string): Promise<RuntimeWorkspace> {
    const workspace = await this.repository.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    return workspace;
  }

  private async emit(
    type: WorkspaceRuntimeEvent["type"],
    payload: unknown,
    workspaceId?: string,
    objectId?: string
  ): Promise<void> {
    const event: WorkspaceRuntimeEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withWorkspace = workspaceId ? { ...event, workspaceId } : event;
    const withObject = objectId ? { ...withWorkspace, objectId } : withWorkspace;
    await this.repository.publishEvent(withObject);
  }
}

export type RuntimeKnowledgeObjectKind =
  | "question"
  | "project"
  | "document"
  | "notebook"
  | "repository"
  | "dataset"
  | "diagram"
  | "canvas"
  | "mind-map"
  | "presentation"
  | "workflow"
  | "conversation"
  | "game"
  | "narrative"
  | "research-paper"
  | "publication"
  | "evidence"
  | "experiment";

export type RuntimeDocumentType =
  | "markdown"
  | "rich-text"
  | "scientific-paper"
  | "notebook"
  | "code"
  | "json"
  | "yaml"
  | "diagram"
  | "canvas"
  | "mind-map"
  | "presentation"
  | "table"
  | "math"
  | "interactive-block";

export type NotebookCellType =
  | "markdown"
  | "python"
  | "javascript"
  | "sql"
  | "visualization"
  | "chart"
  | "data-analysis"
  | "experiment"
  | "ai-assistance"
  | "benchmark"
  | "graph-query";

export type WorkspacePanelType =
  | "dashboard"
  | "explorer"
  | "knowledge-graph"
  | "document-editor"
  | "notebook"
  | "repository"
  | "task-board"
  | "workflow-editor"
  | "agent-console"
  | "terminal"
  | "benchmark-viewer"
  | "analytics"
  | "notifications"
  | "memory-explorer"
  | "timeline";

export type SyncScope =
  | "workspace"
  | "knowledge"
  | "repository"
  | "notebook"
  | "document"
  | "graph"
  | "selective"
  | "background"
  | "encrypted"
  | "peer-to-peer";

export interface RuntimeWorkspace {
  readonly id: string;
  readonly purpose: string;
  readonly projectIds: readonly string[];
  readonly questionIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly documentIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly workflowIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly graphId: string;
  readonly timelineEventIds: readonly string[];
  readonly analyticsId?: string;
  readonly permissionIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly templateIds: readonly string[];
  readonly automationRuleIds: readonly string[];
  readonly versionHistoryIds: readonly string[];
  readonly offlineEnabled: boolean;
  readonly openedAt?: string;
}

export interface RuntimeKnowledgeObject {
  readonly id: string;
  readonly workspaceId: string;
  readonly kind: RuntimeKnowledgeObjectKind;
  readonly title: string;
  readonly relationIds: readonly string[];
  readonly version: string;
  readonly permissionIds: readonly string[];
  readonly commentIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly agentContextIds: readonly string[];
  readonly collaborationSessionIds: readonly string[];
}

export interface RuntimeDocument {
  readonly id: string;
  readonly workspaceId: string;
  readonly objectId: string;
  readonly type: RuntimeDocumentType;
  readonly executable: boolean;
  readonly blockIds: readonly string[];
  readonly relationIds: readonly string[];
  readonly version: string;
  readonly permissionIds: readonly string[];
  readonly historyIds: readonly string[];
}

export interface RuntimeNotebook {
  readonly id: string;
  readonly workspaceId: string;
  readonly documentId: string;
  readonly cellIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly graphUpdateIds: readonly string[];
  readonly executionHistoryIds: readonly string[];
  readonly reproducibilityRecordIds: readonly string[];
}

export interface NotebookCell {
  readonly id: string;
  readonly notebookId: string;
  readonly type: NotebookCellType;
  readonly source: string;
  readonly outputIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly status: "idle" | "running" | "completed" | "failed" | "queued";
  readonly errorIds: readonly string[];
}

export interface LiveCollaborationSession {
  readonly id: string;
  readonly workspaceId: string;
  readonly objectId: string;
  readonly participantIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly presenceIds: readonly string[];
  readonly cursorIds: readonly string[];
  readonly selectionIds: readonly string[];
  readonly commentIds: readonly string[];
  readonly suggestionIds: readonly string[];
  readonly reviewIds: readonly string[];
  readonly conflictIds: readonly string[];
  readonly offline: boolean;
}

export interface WorkspacePanel {
  readonly id: string;
  readonly workspaceId: string;
  readonly type: WorkspacePanelType;
  readonly title: string;
  readonly objectId?: string;
  readonly active: boolean;
  readonly order: number;
  readonly configuration: Readonly<Record<string, unknown>>;
}

export interface WorkspaceSearchRequest {
  readonly workspaceId: string;
  readonly query: string;
  readonly scopes: readonly (
    | "semantic"
    | "knowledge"
    | "question"
    | "project"
    | "repository"
    | "notebook"
    | "conversation"
    | "workflow"
    | "agent"
    | "benchmark"
    | "global"
    | "instant"
  )[];
  readonly limit: number;
  readonly offline: boolean;
}

export interface WorkspaceGraphProjection {
  readonly id: string;
  readonly workspaceId: string;
  readonly focus:
    | "question-clusters"
    | "evidence-map"
    | "project-map"
    | "repository-map"
    | "agent-map"
    | "timeline"
    | "execution-graph"
    | "research-graph"
    | "narrative-graph";
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly filterIds: readonly string[];
  readonly incremental: boolean;
  readonly renderer: "virtual" | "canvas" | "webgl" | "server";
}

export interface WorkspaceSyncPlan {
  readonly id: string;
  readonly workspaceId: string;
  readonly scopes: readonly SyncScope[];
  readonly encrypted: boolean;
  readonly selectiveObjectIds: readonly string[];
  readonly localChangeIds: readonly string[];
  readonly remoteChangeIds: readonly string[];
  readonly conflictIds: readonly string[];
  readonly resolutionStrategy: "local-wins" | "remote-wins" | "merge" | "manual-review";
  readonly background: boolean;
}

export interface WorkspaceAnalyticsSnapshot {
  readonly workspaceId: string;
  readonly workspaceHealth: "healthy" | "at-risk" | "blocked" | "unknown";
  readonly knowledgeGrowth: number;
  readonly researchActivity: number;
  readonly collaboration: number;
  readonly execution: number;
  readonly agentUsage: number;
  readonly learning: number;
  readonly benchmarkCount: number;
  readonly innovation: number;
  readonly performance: number;
  readonly storage: number;
}

export interface WorkspaceRuntimeRepository {
  saveWorkspace(workspace: RuntimeWorkspace): Promise<void>;
  getWorkspace(workspaceId: string): Promise<RuntimeWorkspace | undefined>;
  saveObject(object: RuntimeKnowledgeObject): Promise<void>;
  getObject(objectId: string): Promise<RuntimeKnowledgeObject | undefined>;
  saveDocument(document: RuntimeDocument): Promise<void>;
  saveNotebook(notebook: RuntimeNotebook): Promise<void>;
  saveCollaboration(session: LiveCollaborationSession): Promise<void>;
  publishEvent(event: WorkspaceRuntimeEvent): Promise<void>;
}

export interface WorkspaceRuntimeService {
  createWorkspace(workspace: RuntimeWorkspace): Promise<void>;
  openWorkspace(workspaceId: string): Promise<RuntimeWorkspace>;
  closeWorkspace(workspaceId: string): Promise<void>;
  createObject(object: RuntimeKnowledgeObject): Promise<void>;
  moveObject(objectId: string, targetWorkspaceId: string): Promise<void>;
  searchWorkspace(request: WorkspaceSearchRequest): Promise<readonly RuntimeKnowledgeObject[]>;
  launchNotebook(notebook: RuntimeNotebook): Promise<void>;
  launchAgent(workspaceId: string, agentId: string): Promise<void>;
  renderGraph(projection: WorkspaceGraphProjection): Promise<WorkspaceGraphProjection>;
  syncWorkspace(plan: WorkspaceSyncPlan): Promise<void>;
  shareWorkspace(workspaceId: string, principalIds: readonly string[]): Promise<void>;
  exportWorkspace(workspaceId: string): Promise<string>;
  benchmarkWorkspace(workspaceId: string): Promise<WorkspaceAnalyticsSnapshot>;
}

export interface WorkspaceRuntimeEvent {
  readonly type:
    | "WorkspaceCreated"
    | "WorkspaceOpened"
    | "KnowledgeObjectCreated"
    | "DocumentEdited"
    | "NotebookExecuted"
    | "RepositoryUpdated"
    | "AgentJoined"
    | "WorkflowExecuted"
    | "GraphUpdated"
    | "BenchmarkCompleted"
    | "WorkspaceSynced"
    | "WorkspaceArchived";
  readonly version: number;
  readonly occurredAt: string;
  readonly workspaceId?: string;
  readonly objectId?: string;
  readonly payload: unknown;
}

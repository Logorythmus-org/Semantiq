export type WorkspaceType =
  | "personal"
  | "research"
  | "scientific"
  | "education"
  | "programming"
  | "creative"
  | "business"
  | "organization"
  | "community"
  | "shared"
  | "temporary"
  | "offline"
  | "enterprise";

export type WorkspaceMode =
  | "research"
  | "programming"
  | "writing"
  | "education"
  | "scientific"
  | "business"
  | "presentation"
  | "game-design"
  | "publishing"
  | "offline";

export type ProjectState =
  | "idea"
  | "question"
  | "exploration"
  | "research"
  | "planning"
  | "implementation"
  | "testing"
  | "benchmark"
  | "publication"
  | "archive";

export type KnowledgeObjectKind =
  | "question"
  | "answer"
  | "observation"
  | "idea"
  | "hypothesis"
  | "experiment"
  | "task"
  | "goal"
  | "repository"
  | "dataset"
  | "notebook"
  | "conversation"
  | "workflow"
  | "diagram"
  | "mind-map"
  | "presentation"
  | "research-paper"
  | "book"
  | "video"
  | "audio"
  | "game"
  | "benchmark";

export interface Workspace {
  readonly id: string;
  readonly type: WorkspaceType;
  readonly name: string;
  readonly mode: WorkspaceMode;
  readonly localFirst: boolean;
  readonly offlineEnabled: boolean;
  readonly projectIds: readonly string[];
  readonly objectIds: readonly string[];
  readonly permissionIds: readonly string[];
  readonly graphId?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Project {
  readonly id: string;
  readonly workspaceId: string;
  readonly title: string;
  readonly state: ProjectState;
  readonly questionIds: readonly string[];
  readonly goalIds: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly taskIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly documentIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly workflowIds: readonly string[];
  readonly publicationIds: readonly string[];
}

export interface KnowledgeObject {
  readonly id: string;
  readonly workspaceId: string;
  readonly projectId?: string;
  readonly kind: KnowledgeObjectKind;
  readonly title: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly version: string;
  readonly relationIds: readonly string[];
  readonly permissionIds: readonly string[];
  readonly agentNotes: readonly string[];
  readonly commentIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly tags: readonly string[];
  readonly benchmarkResultIds: readonly string[];
}

export interface WorkspaceTask {
  readonly id: string;
  readonly projectId: string;
  readonly questionIds: readonly string[];
  readonly priority: "low" | "normal" | "high" | "critical";
  readonly dependencyIds: readonly string[];
  readonly subtaskIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly notes: readonly string[];
  readonly deadline?: string;
  readonly automationRuleIds: readonly string[];
  readonly status: "todo" | "doing" | "review" | "blocked" | "done" | "archived";
}

export interface WorkspaceDocument {
  readonly id: string;
  readonly workspaceId: string;
  readonly type: "markdown" | "rich-text" | "notebook" | "diagram" | "mind-map" | "flowchart" | "canvas" | "presentation" | "scientific-paper" | "book" | "code" | "dataset";
  readonly knowledgeObjectId: string;
  readonly version: string;
  readonly exportFormats: readonly string[];
}

export interface Notebook {
  readonly id: string;
  readonly documentId: string;
  readonly cellIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly executionHistoryIds: readonly string[];
}

export interface CollaborationThread {
  readonly id: string;
  readonly targetObjectId: string;
  readonly comments: readonly string[];
  readonly suggestions: readonly string[];
  readonly approvalIds: readonly string[];
  readonly mentionIds: readonly string[];
  readonly assignmentIds: readonly string[];
}

export interface AgentCollaborationSession {
  readonly id: string;
  readonly workspaceId: string;
  readonly agentIds: readonly string[];
  readonly mode: "pair-programming" | "research" | "writing" | "planning" | "reviewing" | "benchmarking" | "translation" | "presentation" | "education" | "scientific-analysis";
  readonly approvalRequired: boolean;
  readonly timelineEventIds: readonly string[];
}

export interface WorkspaceAutomationRule {
  readonly id: string;
  readonly workspaceId: string;
  readonly trigger: "template" | "agent" | "schedule" | "event" | "macro" | "quick-action";
  readonly action: string;
  readonly approvalRequired: boolean;
  readonly enabled: boolean;
}

export interface WorkspaceSearchQuery {
  readonly workspaceId: string;
  readonly text?: string;
  readonly kinds?: readonly KnowledgeObjectKind[];
  readonly searchTypes: readonly (
    | "keyword"
    | "semantic"
    | "question"
    | "project"
    | "repository"
    | "conversation"
    | "notebook"
    | "knowledge-graph"
    | "agent"
    | "benchmark"
  )[];
  readonly limit: number;
}

export interface ProjectDashboard {
  readonly projectId: string;
  readonly overview: string;
  readonly goalIds: readonly string[];
  readonly questionIds: readonly string[];
  readonly progress: number;
  readonly milestoneIds: readonly string[];
  readonly taskIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly resourceIds: readonly string[];
  readonly graphId?: string;
  readonly recentActivityIds: readonly string[];
  readonly healthStatus: "healthy" | "at-risk" | "blocked" | "unknown";
}

export interface WorkspaceRepository {
  saveWorkspace(workspace: Workspace): Promise<void>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  saveProject(project: Project): Promise<void>;
  getProject(id: string): Promise<Project | undefined>;
  saveObject(object: KnowledgeObject): Promise<void>;
  getObject(id: string): Promise<KnowledgeObject | undefined>;
}

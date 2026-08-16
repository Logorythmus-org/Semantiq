import {
  IdentityApplicationService,
  MemoryEventBus,
  WorkspaceApplicationService,
  createMemoryUnitOfWork
} from "../../core/src/index.js";
import { LocalKnowledgeGraphRuntime, createKnowledgeEdge, type KnowledgeNode } from "../../graph-runtime/src/index.js";
import { LocalQuestionIntelligenceEngine } from "../../question-intelligence/src/index.js";
import { ExplainableSemantiqRuntime } from "../../semantiq/src/index.js";
import {
  LocalResearchRuntime,
  createResearchProject,
  type EvidenceObject,
  type ResearchCommunityRuntime
} from "../../research/src/index.js";
import {
  LocalAgentRuntime,
  createAgent,
  createGoal,
  type MemoryRecord,
  type ReflectionRecord,
  type LearningRecord
} from "../../agent-runtime/src/index.js";

export type MvpEventType =
  | "UserCreated"
  | "WorkspaceCreated"
  | "QuestionCreated"
  | "QuestionImproved"
  | "SemantiqCompleted"
  | "GraphUpdated"
  | "ResearchProjectCreated"
  | "EvidenceAdded"
  | "CommunityCreated"
  | "MemberJoined"
  | "GoalCreated"
  | "WorkflowStarted"
  | "WorkflowCompleted"
  | "AssetPublished"
  | "DashboardUpdated";

export interface MvpEvent {
  readonly type: MvpEventType;
  readonly version: number;
  readonly occurredAt: string;
  readonly payload: unknown;
}

export interface MvpJourneyInput {
  readonly identityId: string;
  readonly displayName: string;
  readonly workspaceId: string;
  readonly workspaceName: string;
  readonly questionId: string;
  readonly rawQuestion: string;
}

export interface DashboardSnapshot {
  readonly workspaceStatus: "ready" | "degraded";
  readonly questions: number;
  readonly semantiqScores: readonly number[];
  readonly researchProjects: number;
  readonly communityActivity: number;
  readonly agentActivity: number;
  readonly workflowRuns: number;
  readonly knowledgeGraphGrowth: number;
  readonly systemHealth: "healthy" | "degraded";
  readonly recentEvents: readonly MvpEvent[];
}

export interface PortableWorkspaceExport {
  readonly formatVersion: "mvp-alpha-1";
  readonly workspace: {
    readonly id: string;
    readonly name: string;
    readonly ownerId: string;
  };
  readonly identityId: string;
  readonly questions: readonly {
    readonly id: string;
    readonly original: string;
    readonly improved: string;
  }[];
  readonly researchProjects: readonly string[];
  readonly evidence: readonly EvidenceObject[];
  readonly semantiqReports: readonly string[];
  readonly graphSnapshot: {
    readonly eventCount: number;
    readonly searchResultIds: readonly string[];
  };
  readonly agentLogs: readonly MvpEvent[];
  readonly workflowHistory: readonly string[];
  readonly communityData: readonly string[];
  readonly markdownSummary: string;
}

export interface MvpJourneyResult {
  readonly identityId: string;
  readonly workspaceId: string;
  readonly questionId: string;
  readonly improvedQuestion: string;
  readonly semantiqReportId: string;
  readonly graphNodeId: string;
  readonly researchProjectId: string;
  readonly evidenceId: string;
  readonly goalId: string;
  readonly workflowId: string;
  readonly communityId: string;
  readonly dashboard: DashboardSnapshot;
  readonly exportPackage: PortableWorkspaceExport;
  readonly events: readonly MvpEvent[];
}

export interface HealthEndpoint {
  readonly service: string;
  readonly path: "/health";
  readonly status: "healthy" | "stubbed";
  readonly dependencies: readonly string[];
}

export const mvpScreens = [
  "Landing / Local Start",
  "Identity Setup",
  "Workspace Dashboard",
  "Question Composer",
  "Question Intelligence Panel",
  "Semantiq Report View",
  "Knowledge Graph View",
  "Research Project View",
  "Evidence Panel",
  "Community View",
  "Agent Goal Console",
  "Workflow Viewer",
  "Search View",
  "System Health View",
  "Export View"
] as const;

export const mvpHealthEndpoints: readonly HealthEndpoint[] = [
  { service: "api-gateway", path: "/health", status: "stubbed", dependencies: ["api"] },
  { service: "identity", path: "/health", status: "healthy", dependencies: ["core"] },
  { service: "workspace", path: "/health", status: "healthy", dependencies: ["core"] },
  { service: "question", path: "/health", status: "healthy", dependencies: ["question-intelligence"] },
  { service: "graph", path: "/health", status: "healthy", dependencies: ["graph-runtime"] },
  { service: "semantiq", path: "/health", status: "healthy", dependencies: ["semantiq"] },
  { service: "research", path: "/health", status: "healthy", dependencies: ["research"] },
  { service: "community", path: "/health", status: "healthy", dependencies: ["research"] },
  { service: "agent-runtime", path: "/health", status: "healthy", dependencies: ["agent-runtime"] },
  { service: "workflow-runtime", path: "/health", status: "healthy", dependencies: ["agent-runtime"] },
  { service: "search", path: "/health", status: "healthy", dependencies: ["graph-runtime"] },
  { service: "notification", path: "/health", status: "stubbed", dependencies: [] },
  { service: "dashboard", path: "/health", status: "healthy", dependencies: ["mvp-runtime"] }
];

const now = (): string => new Date().toISOString();

export class LocalMvpRuntime {
  private readonly core = createMemoryUnitOfWork();
  private readonly coreBus = new MemoryEventBus();
  private readonly identity = new IdentityApplicationService(this.core, this.coreBus);
  private readonly workspace = new WorkspaceApplicationService(this.core, this.coreBus);
  private readonly questionIntelligence = new LocalQuestionIntelligenceEngine();
  private readonly graph = new LocalKnowledgeGraphRuntime();
  private readonly semantiq = new ExplainableSemantiqRuntime();
  private readonly research = new LocalResearchRuntime(this.graph, this.semantiq);
  private readonly agents = new LocalAgentRuntime(this.graph, this.semantiq);
  private readonly events: MvpEvent[] = [];

  async runMvpJourney(input: MvpJourneyInput): Promise<MvpJourneyResult> {
    await this.identity.registerIdentity(input.identityId, input.displayName, input.displayName.toLowerCase(), {
      correlationId: "mvp-alpha"
    });
    this.emit("UserCreated", { identityId: input.identityId });

    await this.workspace.createWorkspace(input.workspaceId, input.identityId, input.workspaceName, {
      correlationId: "mvp-alpha"
    });
    this.emit("WorkspaceCreated", { workspaceId: input.workspaceId });

    this.emit("QuestionCreated", { questionId: input.questionId, rawQuestion: input.rawQuestion });
    const intelligence = await this.questionIntelligence.refineQuestion({
      id: `${input.questionId}:analysis`,
      rawInput: input.rawQuestion,
      workspaceId: input.workspaceId,
      actorId: input.identityId,
      contextObjectIds: []
    });
    const improved = intelligence.improvedVersion.payload.question;
    const approved = await this.questionIntelligence.approveSuggestion(intelligence.improvedVersion.id);
    this.emit("QuestionImproved", { suggestionId: approved.id, improved });

    const semantiq = await this.semantiq.runSemantiq(
      {
        id: input.questionId,
        kind: "question",
        version: "1.0.0",
        title: improved,
        content: improved,
        contextIds: [input.workspaceId],
        evidenceIds: []
      },
      {
        id: "mvp-question",
        version: "1.0.0",
        name: "MVP Question Score",
        weights: {
          clarity: 2,
          "question-quality": 2,
          novelty: 1,
          evidence: 1,
          reasoning: 1
        }
      }
    );
    this.emit("SemantiqCompleted", { reportId: semantiq.report.id, weightedScore: semantiq.report.weightedScore });

    const questionNodeId = `node:${input.questionId}`;
    await this.graph.createNode(this.node(questionNodeId, "question", improved, input.workspaceId, input.identityId));
    this.emit("GraphUpdated", { nodeId: questionNodeId });

    const project = createResearchProject("research:mvp", input.questionId, `Research: ${improved}`, ["Collect evidence", "Run workflow"], "MVP research scope");
    await this.research.createResearch(project);
    await this.graph.createEdge(createKnowledgeEdge("edge:question-research", questionNodeId, project.id, "generated_by", [input.questionId]));
    this.emit("ResearchProjectCreated", { projectId: project.id });

    const evidence: EvidenceObject = {
      id: "evidence:mvp",
      projectId: project.id,
      type: "external-reference",
      source: "Local MVP evidence note",
      confidence: 0.7,
      quality: 0.7,
      classification: "primary",
      provenance: input.identityId,
      metadata: { workspaceId: input.workspaceId },
      historyIds: []
    };
    await this.research.addEvidence(evidence);
    this.emit("EvidenceAdded", { evidenceId: evidence.id });

    const planner = createAgent("agent:planner:mvp", "planner", ["planning"], ["terminal"]);
    const researcher = createAgent("agent:research:mvp", "research", ["research"], ["search"]);
    await this.agents.registerAgent(planner);
    await this.agents.registerAgent(researcher);
    await this.agents.startAgent(planner.id);
    await this.agents.startAgent(researcher.id);

    const goal = createGoal("goal:mvp", `Advance research project ${project.id}`, input.workspaceId, [
      "Plan research",
      "Run research task",
      "Document result"
    ]);
    await this.agents.createGoal(goal);
    this.emit("GoalCreated", { goalId: goal.id });

    const plan = await this.agents.planGoal(goal.id);
    const workflow = await this.agents.createWorkflow(plan);
    this.emit("WorkflowStarted", { workflowId: workflow.id });
    const execution = await this.agents.executeWorkflow(workflow.id);
    this.emit("WorkflowCompleted", { workflowId: workflow.id, status: execution.status });

    const memory: MemoryRecord = {
      id: "memory:mvp",
      kind: "execution",
      ownerId: planner.id,
      goalId: goal.id,
      content: "MVP research workflow executed locally.",
      summary: "MVP workflow executed",
      sourceIds: [execution.id],
      version: "1.0.0",
      portable: true
    };
    await this.agents.storeMemory(memory);
    const reflection: ReflectionRecord = {
      id: "reflection:mvp",
      goalId: goal.id,
      executionReview: "The MVP workflow completed with local runtime adapters.",
      goalReview: "The research project produced an executable workflow.",
      errorReview: [],
      improvementSuggestions: ["Add persistent storage adapters.", "Replace UI descriptors with real screens."],
      benchmarkAnalysis: "Semantiq benchmark generated during workflow execution.",
      knowledgeExtracted: ["Local-first MVP loop is integrated."],
      futureRecommendations: ["Prepare public alpha UI refinement."],
      memoryUpdateIds: [memory.id]
    };
    const learning: LearningRecord = {
      id: "learning:mvp",
      goalId: goal.id,
      humanFeedbackIds: [],
      executionFeedbackIds: [execution.id],
      benchmarkIds: execution.benchmarkId ? [execution.benchmarkId] : [],
      workflowOptimization: ["Keep MVP journey deterministic."],
      knowledgeExtracted: reflection.knowledgeExtracted,
      recommendationUpdates: ["Prioritize storage and UI next."],
      explanation: "Learning generated from MVP workflow execution."
    };
    await this.agents.reflect(reflection);
    await this.agents.learn(learning);

    const community: ResearchCommunityRuntime = {
      id: "community:mvp",
      name: "MVP Question Community",
      type: "research-group",
      memberIds: [],
      roles: {},
      permissionIds: [],
      timelineIds: [],
      metrics: {},
      graphNodeId: "community-node:mvp"
    };
    await this.research.createCommunity(community);
    this.emit("CommunityCreated", { communityId: community.id });
    await this.research.joinCommunity(community.id, input.identityId, "founder");
    this.emit("MemberJoined", { communityId: community.id, identityId: input.identityId });

    this.emit("AssetPublished", { publication: "mvp-export-package", status: "local-export" });
    const dashboard = await this.dashboard();
    const exportPackage = await this.exportWorkspace(input.workspaceId, input.identityId, input.workspaceName, input.questionId, input.rawQuestion, improved, project.id, evidence);

    return {
      identityId: input.identityId,
      workspaceId: input.workspaceId,
      questionId: input.questionId,
      improvedQuestion: improved,
      semantiqReportId: semantiq.report.id,
      graphNodeId: questionNodeId,
      researchProjectId: project.id,
      evidenceId: evidence.id,
      goalId: goal.id,
      workflowId: workflow.id,
      communityId: community.id,
      dashboard,
      exportPackage,
      events: this.events
    };
  }

  async dashboard(): Promise<DashboardSnapshot> {
    const graphResults = await this.graph.searchKnowledge("mvp research question", 20);
    const agentMetrics = this.agents.metrics();
    const researchAnalytics = await this.research.analytics("research:mvp").catch(() => undefined);
    const dashboard: DashboardSnapshot = {
      workspaceStatus: "ready",
      questions: this.events.filter((event) => event.type === "QuestionCreated").length,
      semantiqScores: this.events
        .filter((event) => event.type === "SemantiqCompleted")
        .map((event) => Number((event.payload as { readonly weightedScore?: number }).weightedScore ?? 0)),
      researchProjects: this.events.filter((event) => event.type === "ResearchProjectCreated").length,
      communityActivity: researchAnalytics?.communityActivity ?? 0,
      agentActivity: agentMetrics.registeredAgents,
      workflowRuns: this.events.filter((event) => event.type === "WorkflowCompleted").length,
      knowledgeGraphGrowth: graphResults.length,
      systemHealth: agentMetrics.health === "healthy" ? "healthy" : "degraded",
      recentEvents: this.events.slice(-10)
    };
    this.emit("DashboardUpdated", { systemHealth: dashboard.systemHealth });
    return dashboard;
  }

  async exportWorkspace(
    workspaceId: string,
    identityId: string,
    workspaceName: string,
    questionId: string,
    original: string,
    improved: string,
    projectId: string,
    evidence: EvidenceObject
  ): Promise<PortableWorkspaceExport> {
    const search = await this.graph.searchKnowledge(improved, 20);
    const workflowHistory = this.events.filter((event) => event.type === "WorkflowStarted" || event.type === "WorkflowCompleted").map((event) => event.type);
    return {
      formatVersion: "mvp-alpha-1",
      workspace: {
        id: workspaceId,
        name: workspaceName,
        ownerId: identityId
      },
      identityId,
      questions: [{ id: questionId, original, improved }],
      researchProjects: [projectId],
      evidence: [evidence],
      semantiqReports: this.events
        .filter((event) => event.type === "SemantiqCompleted")
        .map((event) => String((event.payload as { readonly reportId?: string }).reportId ?? "")),
      graphSnapshot: {
        eventCount: this.events.filter((event) => event.type === "GraphUpdated").length,
        searchResultIds: search.map((result) => result.nodeId)
      },
      agentLogs: this.events.filter((event) => event.type === "GoalCreated" || event.type === "WorkflowCompleted"),
      workflowHistory,
      communityData: this.events.filter((event) => event.type === "CommunityCreated" || event.type === "MemberJoined").map((event) => event.type),
      markdownSummary: `# ${workspaceName}\n\nQuestion: ${improved}\n\nResearch project: ${projectId}\n\nEvidence: ${evidence.id}\n`
    };
  }

  serviceHealth(): readonly HealthEndpoint[] {
    return mvpHealthEndpoints;
  }

  private node(id: string, type: KnowledgeNode["type"], title: string, workspaceId: string, ownerId: string): KnowledgeNode {
    const object = {
      ...createKnowledgeObjectForMvp(id, workspaceId, ownerId, type, title),
      metadata: { workspaceId, ownerId, title }
    };
    return {
      id,
      type,
      object,
      labels: [type, "mvp"],
      properties: { title, workspaceId, ownerId },
      federationRefs: [],
      version: object.version,
      createdAt: object.createdAt,
      updatedAt: object.updatedAt
    };
  }

  private emit(type: MvpEventType, payload: unknown): void {
    this.events.push({
      type,
      version: 1,
      occurredAt: now(),
      payload
    });
  }
}

function createKnowledgeObjectForMvp(id: string, workspaceId: string, ownerId: string, kind: string, title: string) {
  return createKnowledgeObjectAggregateCompat(id, workspaceId, ownerId, kind, title);
}

function createKnowledgeObjectAggregateCompat(id: string, workspaceId: string, ownerId: string, kind: string, title: string) {
  return {
    id,
    workspaceId,
    ownerId,
    kind,
    title,
    metadata: {},
    relations: [],
    version: "1.0.0",
    tags: [],
    historyIds: [],
    semantiqReportIds: [],
    permissions: [],
    commentIds: [],
    attachmentIds: [],
    timelineIds: [],
    graphLinkIds: [],
    createdAt: now(),
    updatedAt: now()
  };
}

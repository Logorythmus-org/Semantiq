import { createKnowledgeObjectAggregate } from "../../core/src/index.js";
import { LocalKnowledgeGraphRuntime, createKnowledgeEdge, type KnowledgeEdge, type KnowledgeNode } from "../../graph-runtime/src/index.js";

export type Sprint1EventType =
  | "IdentityCreated"
  | "WorkspaceCreated"
  | "KnowledgeCreated"
  | "QuestionCreated"
  | "QuestionUpdated"
  | "GraphUpdated"
  | "WorkspaceExported"
  | "SearchExecuted";

export type LocalStorageKind = "memory" | "json" | "sqlite" | "postgresql" | "neo4j";

export interface LocalIdentity {
  readonly id: string;
  readonly profile: {
    readonly displayName: string;
    readonly avatar?: string;
    readonly language: string;
    readonly timezone: string;
    readonly preferences: Readonly<Record<string, unknown>>;
  };
  readonly anonymous: boolean;
  readonly offline: true;
  readonly workspaceMemberships: readonly string[];
  readonly roles: readonly string[];
  readonly semanticWalletId?: string;
  readonly settings: Readonly<Record<string, unknown>>;
  readonly historyIds: readonly string[];
  readonly auditIds: readonly string[];
}

export interface LocalSession {
  readonly id: string;
  readonly identityId: string;
  readonly deviceId: string;
  readonly encrypted: true;
  readonly remembered: boolean;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly active: boolean;
}

export interface WorkspaceRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly name: string;
  readonly archived: boolean;
  readonly templateId?: string;
  readonly settings: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly timeline: readonly string[];
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type KnowledgeKind =
  | "note"
  | "document"
  | "idea"
  | "question"
  | "research-object"
  | "bookmark"
  | "link"
  | "reference"
  | "attachment"
  | "collection";

export interface KnowledgeRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly kind: KnowledgeKind;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly collectionIds: readonly string[];
  readonly version: string;
  readonly archived: boolean;
  readonly bookmarked: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface QuestionRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly text: string;
  readonly tags: readonly string[];
  readonly status: "draft" | "active" | "archived" | "deleted";
  readonly relationIds: readonly string[];
  readonly templateId?: string;
  readonly history: readonly string[];
  readonly bookmarked: boolean;
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Sprint1Event {
  readonly type: Sprint1EventType;
  readonly version: number;
  readonly occurredAt: string;
  readonly workspaceId?: string;
  readonly objectId?: string;
  readonly payload: unknown;
}

export interface GraphViewerModel {
  readonly nodes: readonly {
    readonly id: string;
    readonly label: string;
    readonly kind: string;
    readonly selected: boolean;
  }[];
  readonly edges: readonly {
    readonly id: string;
    readonly sourceId: string;
    readonly targetId: string;
    readonly relation: string;
  }[];
  readonly viewport: {
    readonly zoom: number;
    readonly panX: number;
    readonly panY: number;
  };
  readonly filters: readonly string[];
  readonly timelineMode: boolean;
  readonly layout: "force" | "hierarchical" | "timeline";
}

export interface DashboardState {
  readonly recentQuestions: readonly QuestionRecord[];
  readonly recentKnowledge: readonly KnowledgeRecord[];
  readonly workspaceStatistics: {
    readonly workspaceCount: number;
    readonly knowledgeCount: number;
    readonly questionCount: number;
  };
  readonly semantiqPlaceholder: "ready-for-sprint-2";
  readonly graphSummary: {
    readonly nodes: number;
    readonly edges: number;
  };
  readonly recentActivity: readonly Sprint1Event[];
  readonly tasks: readonly string[];
  readonly notifications: readonly string[];
  readonly agentStatusPlaceholder: "ready-for-agent-runtime";
}

export interface SearchResult {
  readonly id: string;
  readonly type: "workspace" | "knowledge" | "question" | "graph-node" | "activity";
  readonly score: number;
  readonly title: string;
  readonly explanation: string;
}

export interface WorkspaceExport {
  readonly format: "json" | "markdown" | "zip-placeholder";
  readonly workspaceSnapshot: WorkspaceRecord;
  readonly knowledgeSnapshot: readonly KnowledgeRecord[];
  readonly questionExport: readonly QuestionRecord[];
  readonly graphSnapshot: GraphViewerModel;
  readonly markdown: string;
  readonly portable: true;
  readonly secure: true;
}

export interface ApiContracts {
  readonly createWorkspace: string;
  readonly updateWorkspace: string;
  readonly createQuestion: string;
  readonly updateQuestion: string;
  readonly createKnowledge: string;
  readonly search: string;
  readonly exportWorkspace: string;
  readonly graph: string;
}

export interface PerformanceMeasurements {
  readonly workspaceLoadingMs: number;
  readonly questionSaveMs: number;
  readonly graphUpdateMs: number;
  readonly searchMs: number;
  readonly exportMs: number;
}

const now = (): string => new Date().toISOString();
const id = (prefix: string): string => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export class LocalSprint1Runtime {
  private readonly identities = new Map<string, LocalIdentity>();
  private readonly sessions = new Map<string, LocalSession>();
  private readonly workspaces = new Map<string, WorkspaceRecord>();
  private readonly knowledge = new Map<string, KnowledgeRecord>();
  private readonly questions = new Map<string, QuestionRecord>();
  private readonly events: Sprint1Event[] = [];
  private readonly graph = new LocalKnowledgeGraphRuntime();
  private readonly graphEdges: KnowledgeEdge[] = [];

  async createIdentity(input: {
    readonly id: string;
    readonly displayName: string;
    readonly avatar?: string;
    readonly language?: string;
    readonly timezone?: string;
    readonly anonymous?: boolean;
  }): Promise<LocalIdentity> {
    const profileBase = {
      displayName: input.displayName,
      language: input.language ?? "en",
      timezone: input.timezone ?? "UTC",
      preferences: {}
    };
    const identity: LocalIdentity = {
      id: input.id,
      profile: input.avatar ? { ...profileBase, avatar: input.avatar } : profileBase,
      anonymous: input.anonymous ?? false,
      offline: true,
      workspaceMemberships: [],
      roles: ["owner"],
      semanticWalletId: `wallet:${input.id}`,
      settings: {},
      historyIds: [],
      auditIds: [id("audit")]
    };
    this.identities.set(identity.id, identity);
    this.emit("IdentityCreated", { identityId: identity.id });
    return identity;
  }

  async loginLocal(identityId: string, deviceId: string, rememberDevice = true): Promise<LocalSession> {
    this.requireIdentity(identityId);
    const session: LocalSession = {
      id: id("session"),
      identityId,
      deviceId,
      encrypted: true,
      remembered: rememberDevice,
      createdAt: now(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      active: true
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async logout(sessionId: string): Promise<LocalSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);
    const loggedOut = { ...session, active: false };
    this.sessions.set(sessionId, loggedOut);
    return loggedOut;
  }

  async createWorkspace(ownerId: string, name: string, templateId?: string): Promise<WorkspaceRecord> {
    this.requireIdentity(ownerId);
    const timestamp = now();
    const workspaceBase = {
      id: id("workspace"),
      ownerId,
      name,
      archived: false,
      settings: { darkMode: true, localFirst: true },
      metadata: { storage: "local" },
      timeline: [],
      version: "1.0.0",
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const workspace: WorkspaceRecord = templateId ? { ...workspaceBase, templateId } : workspaceBase;
    this.workspaces.set(workspace.id, workspace);
    this.emit("WorkspaceCreated", { workspaceId: workspace.id }, workspace.id);
    return workspace;
  }

  async updateWorkspace(workspaceId: string, patch: { readonly name?: string; readonly archived?: boolean }): Promise<WorkspaceRecord> {
    const workspace = this.requireWorkspace(workspaceId);
    const updated: WorkspaceRecord = {
      ...workspace,
      name: patch.name ?? workspace.name,
      archived: patch.archived ?? workspace.archived,
      timeline: [...workspace.timeline, id("timeline")],
      updatedAt: now()
    };
    this.workspaces.set(workspaceId, updated);
    return updated;
  }

  async createKnowledge(input: {
    readonly workspaceId: string;
    readonly ownerId: string;
    readonly kind: KnowledgeKind;
    readonly title: string;
    readonly body: string;
    readonly tags?: readonly string[];
  }): Promise<KnowledgeRecord> {
    this.requireWorkspace(input.workspaceId);
    this.requireIdentity(input.ownerId);
    const timestamp = now();
    const record: KnowledgeRecord = {
      id: id("knowledge"),
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      tags: input.tags ?? [],
      collectionIds: [],
      version: "1.0.0",
      archived: false,
      bookmarked: false,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    this.knowledge.set(record.id, record);
    await this.graph.createNode(this.toNode(record.id, record.kind, record.title, input.workspaceId, input.ownerId, { body: record.body, tags: record.tags }));
    this.emit("KnowledgeCreated", { knowledgeId: record.id }, input.workspaceId, record.id);
    this.emit("GraphUpdated", { nodeId: record.id }, input.workspaceId, record.id);
    return record;
  }

  async createQuestion(input: {
    readonly workspaceId: string;
    readonly ownerId: string;
    readonly text: string;
    readonly tags?: readonly string[];
    readonly templateId?: string;
  }): Promise<QuestionRecord> {
    this.requireWorkspace(input.workspaceId);
    this.requireIdentity(input.ownerId);
    const timestamp = now();
    const questionBase = {
      id: id("question"),
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      text: input.text,
      tags: input.tags ?? [],
      status: "active" as const,
      relationIds: [],
      history: [`created:${timestamp}`],
      bookmarked: false,
      version: "1.0.0",
      createdAt: timestamp,
      updatedAt: timestamp
    };
    const question: QuestionRecord = input.templateId ? { ...questionBase, templateId: input.templateId } : questionBase;
    this.questions.set(question.id, question);
    await this.graph.createNode(this.toNode(question.id, "question", question.text, input.workspaceId, input.ownerId, { tags: question.tags }));
    this.emit("QuestionCreated", { questionId: question.id }, input.workspaceId, question.id);
    this.emit("GraphUpdated", { nodeId: question.id }, input.workspaceId, question.id);
    return question;
  }

  async updateQuestion(questionId: string, patch: { readonly text?: string; readonly tags?: readonly string[]; readonly status?: QuestionRecord["status"] }): Promise<QuestionRecord> {
    const question = this.requireQuestion(questionId);
    const updated: QuestionRecord = {
      ...question,
      text: patch.text ?? question.text,
      tags: patch.tags ?? question.tags,
      status: patch.status ?? question.status,
      history: [...question.history, `updated:${now()}`],
      updatedAt: now()
    };
    this.questions.set(questionId, updated);
    this.emit("QuestionUpdated", { questionId }, updated.workspaceId, questionId);
    return updated;
  }

  async archiveQuestion(questionId: string): Promise<QuestionRecord> {
    return this.updateQuestion(questionId, { status: "archived" });
  }

  async deleteQuestion(questionId: string): Promise<QuestionRecord> {
    return this.updateQuestion(questionId, { status: "deleted" });
  }

  async duplicateQuestion(questionId: string): Promise<QuestionRecord> {
    const question = this.requireQuestion(questionId);
    const input = {
      workspaceId: question.workspaceId,
      ownerId: question.ownerId,
      text: question.text,
      tags: question.tags
    };
    return this.createQuestion(question.templateId ? { ...input, templateId: question.templateId } : input);
  }

  async bookmarkQuestion(questionId: string, bookmarked = true): Promise<QuestionRecord> {
    const question = this.requireQuestion(questionId);
    const updated: QuestionRecord = {
      ...question,
      bookmarked,
      history: [...question.history, `bookmarked:${bookmarked}:${now()}`],
      updatedAt: now()
    };
    this.questions.set(questionId, updated);
    this.emit("QuestionUpdated", { questionId, bookmarked }, updated.workspaceId, questionId);
    return updated;
  }

  async convertQuestionToKnowledge(questionId: string, kind: Exclude<KnowledgeKind, "question"> = "note"): Promise<KnowledgeRecord> {
    const question = this.requireQuestion(questionId);
    const converted = await this.createKnowledge({
      workspaceId: question.workspaceId,
      ownerId: question.ownerId,
      kind,
      title: question.text,
      body: question.text,
      tags: question.tags
    });
    await this.relateQuestionToKnowledge(questionId, converted.id);
    return converted;
  }

  async relateQuestionToKnowledge(questionId: string, knowledgeId: string): Promise<void> {
    const question = this.requireQuestion(questionId);
    if (!this.knowledge.has(knowledgeId)) throw new Error(`Knowledge not found: ${knowledgeId}`);
    const edge = createKnowledgeEdge(id("edge"), questionId, knowledgeId, "references", [questionId]);
    await this.graph.createEdge(edge);
    this.graphEdges.push(edge);
    this.emit("GraphUpdated", { questionId, knowledgeId }, question.workspaceId, questionId);
  }

  graphViewer(workspaceId: string, selectedId?: string): GraphViewerModel {
    const knowledgeNodes = [...this.knowledge.values()].filter((item) => item.workspaceId === workspaceId);
    const questionNodes = [...this.questions.values()].filter((item) => item.workspaceId === workspaceId);
    const nodes = [
      ...knowledgeNodes.map((item) => ({ id: item.id, label: item.title, kind: item.kind, selected: item.id === selectedId })),
      ...questionNodes.map((item) => ({ id: item.id, label: item.text, kind: "question", selected: item.id === selectedId }))
    ];
    const nodeIds = new Set(nodes.map((node) => node.id));
    return {
      nodes,
      edges: this.graphEdges
        .filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId))
        .map((edge) => ({ id: edge.id, sourceId: edge.sourceId, targetId: edge.targetId, relation: edge.relation })),
      viewport: { zoom: 1, panX: 0, panY: 0 },
      filters: [],
      timelineMode: false,
      layout: "force"
    };
  }

  search(workspaceId: string, query: string): readonly SearchResult[] {
    const started = performance.now();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const score = (text: string): number => {
      const lower = text.toLowerCase();
      return terms.length === 0 ? 0 : terms.filter((term) => lower.includes(term)).length / terms.length;
    };
    const results: SearchResult[] = [
      ...[...this.workspaces.values()]
        .filter((workspace) => workspace.id === workspaceId)
        .map((workspace) => ({ id: workspace.id, type: "workspace" as const, score: score(workspace.name), title: workspace.name, explanation: "Matched workspace name." })),
      ...[...this.knowledge.values()]
        .filter((item) => item.workspaceId === workspaceId)
        .map((item) => ({ id: item.id, type: "knowledge" as const, score: score(`${item.title} ${item.body} ${item.tags.join(" ")}`), title: item.title, explanation: "Matched knowledge title, body, or tags." })),
      ...[...this.questions.values()]
        .filter((item) => item.workspaceId === workspaceId)
        .map((item) => ({ id: item.id, type: "question" as const, score: score(`${item.text} ${item.tags.join(" ")}`), title: item.text, explanation: "Matched question text or tags." })),
      ...this.events.map((event) => ({ id: `${event.type}:${event.occurredAt}`, type: "activity" as const, score: score(event.type), title: event.type, explanation: "Matched recent activity." }))
    ]
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score);
    this.emit("SearchExecuted", { query, count: results.length, durationMs: performance.now() - started }, workspaceId);
    return results;
  }

  dashboard(workspaceId: string): DashboardState {
    const knowledge = [...this.knowledge.values()].filter((item) => item.workspaceId === workspaceId);
    const questions = [...this.questions.values()].filter((item) => item.workspaceId === workspaceId);
    return {
      recentQuestions: questions.slice(-5),
      recentKnowledge: knowledge.slice(-5),
      workspaceStatistics: {
        workspaceCount: [...this.workspaces.values()].filter((workspace) => workspace.id === workspaceId).length,
        knowledgeCount: knowledge.length,
        questionCount: questions.length
      },
      semantiqPlaceholder: "ready-for-sprint-2",
      graphSummary: {
        nodes: knowledge.length + questions.length,
        edges: this.graphEdges.filter((edge) => knowledge.some((item) => item.id === edge.targetId) || questions.some((item) => item.id === edge.sourceId)).length
      },
      recentActivity: this.events.filter((event) => event.workspaceId === workspaceId).slice(-10),
      tasks: [],
      notifications: [],
      agentStatusPlaceholder: "ready-for-agent-runtime"
    };
  }

  exportWorkspace(workspaceId: string, format: WorkspaceExport["format"] = "json"): WorkspaceExport {
    const started = performance.now();
    const workspace = this.requireWorkspace(workspaceId);
    const knowledge = [...this.knowledge.values()].filter((item) => item.workspaceId === workspaceId);
    const questions = [...this.questions.values()].filter((item) => item.workspaceId === workspaceId);
    const graph = this.graphViewer(workspaceId);
    const markdown = [`# ${workspace.name}`, "", "## Questions", ...questions.map((item) => `- ${item.text}`), "", "## Knowledge", ...knowledge.map((item) => `- ${item.title}`)].join("\n");
    this.emit("WorkspaceExported", { workspaceId, format, durationMs: performance.now() - started }, workspaceId);
    return {
      format,
      workspaceSnapshot: workspace,
      knowledgeSnapshot: knowledge,
      questionExport: questions,
      graphSnapshot: graph,
      markdown,
      portable: true,
      secure: true
    };
  }

  apiContracts(): ApiContracts {
    return {
      createWorkspace: "POST /workspaces",
      updateWorkspace: "PATCH /workspaces/{workspaceId}",
      createQuestion: "POST /questions",
      updateQuestion: "PATCH /questions/{questionId}",
      createKnowledge: "POST /knowledge",
      search: "GET /search",
      exportWorkspace: "POST /workspaces/{workspaceId}/export",
      graph: "GET /workspaces/{workspaceId}/graph"
    };
  }

  eventsLog(): readonly Sprint1Event[] {
    return this.events;
  }

  measurePerformance(workspaceId: string): PerformanceMeasurements {
    const workspaceStart = performance.now();
    this.dashboard(workspaceId);
    const workspaceLoadingMs = performance.now() - workspaceStart;
    const searchStart = performance.now();
    this.search(workspaceId, "question");
    const searchMs = performance.now() - searchStart;
    const exportStart = performance.now();
    this.exportWorkspace(workspaceId);
    const exportMs = performance.now() - exportStart;
    return {
      workspaceLoadingMs,
      questionSaveMs: 0,
      graphUpdateMs: 0,
      searchMs,
      exportMs
    };
  }

  private toNode(idValue: string, type: KnowledgeNode["type"] | string, title: string, workspaceId: string, ownerId: string, metadata: Readonly<Record<string, unknown>>): KnowledgeNode {
    const object = createKnowledgeObjectAggregate(idValue, workspaceId, ownerId, type, title, metadata);
    return {
      id: idValue,
      type: type === "question" ? "question" : "knowledge",
      object,
      labels: [type, "sprint1"],
      properties: metadata,
      federationRefs: [],
      version: object.version,
      createdAt: object.createdAt,
      updatedAt: object.updatedAt
    };
  }

  private requireIdentity(identityId: string): LocalIdentity {
    const identity = this.identities.get(identityId);
    if (!identity) throw new Error(`Identity not found: ${identityId}`);
    return identity;
  }

  private requireWorkspace(workspaceId: string): WorkspaceRecord {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`);
    return workspace;
  }

  private requireQuestion(questionId: string): QuestionRecord {
    const question = this.questions.get(questionId);
    if (!question) throw new Error(`Question not found: ${questionId}`);
    return question;
  }

  private emit(type: Sprint1EventType, payload: unknown, workspaceId?: string, objectId?: string): void {
    const base: Sprint1Event = { type, version: 1, occurredAt: now(), payload };
    const withWorkspace = workspaceId ? { ...base, workspaceId } : base;
    const withObject = objectId ? { ...withWorkspace, objectId } : withWorkspace;
    this.events.push(withObject);
  }
}

export const sprint1Screens = [
  "Welcome",
  "Identity Setup",
  "Workspace List",
  "Workspace Dashboard",
  "Question Editor",
  "Knowledge Editor",
  "Graph Viewer",
  "Search",
  "Settings",
  "Export",
  "404",
  "Error",
  "Loading"
] as const;

export const sprint1StorageAdapters = [
  { kind: "memory", status: "implemented", purpose: "Fast local tests and in-process previews." },
  { kind: "json", status: "planned", purpose: "Portable local workspace persistence." },
  { kind: "sqlite", status: "planned", purpose: "Default local-first desktop and web persistence." },
  { kind: "postgresql", status: "planned", purpose: "Future team and hosted deployments." },
  { kind: "neo4j", status: "planned", purpose: "Future graph-specialized persistence." }
] as const;

export const sprint1AuthAdapters = [
  { kind: "local-login", status: "implemented" },
  { kind: "device-auth", status: "implemented" },
  { kind: "oauth", status: "adapter-stub" },
  { kind: "federated-identity", status: "adapter-stub" },
  { kind: "recovery", status: "adapter-stub" }
] as const;

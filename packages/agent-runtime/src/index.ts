import { createKnowledgeObjectAggregate } from "../../core/src/index.js";
import {
  createKnowledgeEdge,
  type KnowledgeNode,
  LocalKnowledgeGraphRuntime
} from "../../graph-runtime/src/index.js";
import { ExplainableSemantiqRuntime } from "../../semantiq/src/index.js";

export type GoalStatus =
  | "created"
  | "planned"
  | "executing"
  | "waiting-for-approval"
  | "completed"
  | "failed"
  | "archived";
export type GoalPriority = "low" | "normal" | "high" | "critical";
export type AgentLifecycle =
  | "installed"
  | "registered"
  | "initialized"
  | "loaded"
  | "started"
  | "paused"
  | "disabled"
  | "archived"
  | "destroyed";
export type WorkflowNodeType =
  | "goal"
  | "task"
  | "question"
  | "decision"
  | "loop"
  | "parallel"
  | "approval"
  | "tool"
  | "agent"
  | "knowledge"
  | "repository"
  | "workspace"
  | "benchmark"
  | "notification"
  | "delay"
  | "custom";
export type ExecutionMode = "sequential" | "parallel" | "distributed";
export type MemoryKind =
  | "working"
  | "conversation"
  | "workspace"
  | "project"
  | "research"
  | "execution"
  | "semantic"
  | "long-term";
export type ToolKind =
  | "filesystem"
  | "git"
  | "github"
  | "python"
  | "docker"
  | "rest"
  | "graphql"
  | "mcp"
  | "browser"
  | "terminal"
  | "search"
  | "local-ai"
  | "cloud-ai"
  | "database"
  | "email"
  | "calendar"
  | "future-tool";

export type AgentType =
  | "planner"
  | "question"
  | "research"
  | "writing"
  | "programming"
  | "review"
  | "documentation"
  | "translation"
  | "visualization"
  | "education"
  | "community"
  | "governance"
  | "marketplace"
  | "repository"
  | "testing"
  | "security"
  | "deployment"
  | "analytics"
  | "memory"
  | "reflection";

export interface Goal {
  readonly id: string;
  readonly objective: string;
  readonly milestones: readonly string[];
  readonly taskIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly priority: GoalPriority;
  readonly status: GoalStatus;
  readonly resources: readonly string[];
  readonly workspaceId: string;
  readonly benchmarkIds: readonly string[];
  readonly historyIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly version: string;
}

export interface AgentDefinition {
  readonly id: string;
  readonly type: AgentType;
  readonly identityId: string;
  readonly capabilities: readonly string[];
  readonly skills: readonly string[];
  readonly permissions: readonly string[];
  readonly tools: readonly ToolKind[];
  readonly memoryIds: readonly string[];
  readonly knowledgeSourceIds: readonly string[];
  readonly runtimeContext: Readonly<Record<string, unknown>>;
  readonly health: "healthy" | "degraded" | "unavailable";
  readonly version: string;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly benchmarkHistoryIds: readonly string[];
  readonly trust: "unverified" | "verified" | "trusted";
  readonly auditIds: readonly string[];
  readonly lifecycle: AgentLifecycle;
}

export interface PlanTask {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly subtaskIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly requiredCapability: string;
  readonly assignedAgentId?: string;
  readonly riskIds: readonly string[];
  readonly validationCriteria: readonly string[];
  readonly approvalRequired: boolean;
  readonly status: "pending" | "running" | "completed" | "failed" | "blocked";
}

export interface ExecutionPlan {
  readonly id: string;
  readonly goalId: string;
  readonly strategy: string;
  readonly tasks: readonly PlanTask[];
  readonly agentAssignments: Readonly<Record<string, string>>;
  readonly dependencyOrder: readonly string[];
  readonly risks: readonly string[];
  readonly validationPlan: readonly string[];
  readonly alternativePlans: readonly string[];
}

export interface WorkflowNode {
  readonly id: string;
  readonly type: WorkflowNodeType;
  readonly name: string;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly approvalRequired: boolean;
}

export interface WorkflowEdge {
  readonly id: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly condition?: string;
}

export interface WorkflowDefinition {
  readonly id: string;
  readonly goalId: string;
  readonly nodes: readonly WorkflowNode[];
  readonly edges: readonly WorkflowEdge[];
  readonly mode: ExecutionMode;
  readonly checkpointIds: readonly string[];
  readonly recoveryStrategy: "retry" | "rollback" | "resume" | "human-escalation";
  readonly version: string;
}

export interface WorkflowExecutionResult {
  readonly id: string;
  readonly workflowId: string;
  readonly status: "completed" | "waiting-for-approval" | "failed";
  readonly completedNodeIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly benchmarkId?: string;
}

export interface ToolRequest {
  readonly id: string;
  readonly kind: ToolKind;
  readonly agentId: string;
  readonly goalId: string;
  readonly input: Readonly<Record<string, unknown>>;
  readonly permissionIds: readonly string[];
  readonly approvalRequired: boolean;
}

export interface ToolResult {
  readonly id: string;
  readonly requestId: string;
  readonly status: "succeeded" | "failed" | "waiting-for-approval";
  readonly output: Readonly<Record<string, unknown>>;
  readonly auditId: string;
}

export interface AgentMessage {
  readonly id: string;
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly type:
    | "delegation"
    | "knowledge-request"
    | "tool-request"
    | "benchmark-request"
    | "negotiation"
    | "consensus"
    | "conflict-resolution";
  readonly content: string;
  readonly contextIds: readonly string[];
  readonly createdAt: string;
}

export interface MemoryRecord {
  readonly id: string;
  readonly kind: MemoryKind;
  readonly ownerId: string;
  readonly goalId: string;
  readonly content: string;
  readonly summary: string;
  readonly sourceIds: readonly string[];
  readonly version: string;
  readonly portable: true;
}

export interface ReflectionRecord {
  readonly id: string;
  readonly goalId: string;
  readonly executionReview: string;
  readonly goalReview: string;
  readonly errorReview: readonly string[];
  readonly improvementSuggestions: readonly string[];
  readonly benchmarkAnalysis: string;
  readonly knowledgeExtracted: readonly string[];
  readonly futureRecommendations: readonly string[];
  readonly memoryUpdateIds: readonly string[];
}

export interface LearningRecord {
  readonly id: string;
  readonly goalId: string;
  readonly humanFeedbackIds: readonly string[];
  readonly executionFeedbackIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly workflowOptimization: readonly string[];
  readonly knowledgeExtracted: readonly string[];
  readonly recommendationUpdates: readonly string[];
  readonly explanation: string;
}

export interface RuntimeMetrics {
  readonly activeGoals: number;
  readonly registeredAgents: number;
  readonly runningWorkflows: number;
  readonly memoryRecords: number;
  readonly toolExecutions: number;
  readonly failures: number;
  readonly health: "healthy" | "degraded" | "critical";
}

export type AgentRuntimeEventType =
  | "GoalCreated"
  | "GoalPlanned"
  | "AgentRegistered"
  | "AgentStarted"
  | "AgentStopped"
  | "WorkflowStarted"
  | "WorkflowCompleted"
  | "ToolExecuted"
  | "MemoryUpdated"
  | "ReflectionCompleted"
  | "LearningCompleted"
  | "ExecutionBenchmarked"
  | "AgentUpgraded";

export interface AgentRuntimeEvent {
  readonly type: AgentRuntimeEventType;
  readonly version: number;
  readonly occurredAt: string;
  readonly goalId?: string;
  readonly agentId?: string;
  readonly workflowId?: string;
  readonly payload: unknown;
}

const createId = (prefix: string): string =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const now = (): string => new Date().toISOString();

export class LocalAgentRuntime {
  private readonly goals = new Map<string, Goal>();
  private readonly agents = new Map<string, AgentDefinition>();
  private readonly plans = new Map<string, ExecutionPlan>();
  private readonly workflows = new Map<string, WorkflowDefinition>();
  private readonly memory = new Map<string, MemoryRecord>();
  private readonly reflections = new Map<string, ReflectionRecord>();
  private readonly learning = new Map<string, LearningRecord>();
  private readonly messages: AgentMessage[] = [];
  private readonly eventLog: AgentRuntimeEvent[] = [];
  private toolExecutions = 0;
  private failures = 0;

  constructor(
    private readonly graph = new LocalKnowledgeGraphRuntime(),
    private readonly semantiq = new ExplainableSemantiqRuntime()
  ) {}

  async createGoal(goal: Goal): Promise<void> {
    if (goal.objective.trim().length === 0) {
      throw new Error("Goal objective is required");
    }
    this.goals.set(goal.id, goal);
    await this.createGraphNode(goal.id, "workflow", goal.objective, {
      type: "goal",
      priority: goal.priority
    });
    this.emit("GoalCreated", { objective: goal.objective }, goal.id);
  }

  async registerAgent(agent: AgentDefinition): Promise<void> {
    this.agents.set(agent.id, { ...agent, lifecycle: "registered" });
    await this.createGraphNode(agent.id, "agent", agent.type, {
      capabilities: agent.capabilities,
      tools: agent.tools
    });
    this.emit("AgentRegistered", { type: agent.type }, undefined, agent.id);
  }

  discoverAgents(capability: string): readonly AgentDefinition[] {
    return [...this.agents.values()].filter(
      (agent) => agent.capabilities.includes(capability) && agent.health === "healthy"
    );
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.requireAgent(agentId);
    this.agents.set(agentId, { ...agent, lifecycle: "started" });
    this.emit("AgentStarted", { agentId }, undefined, agentId);
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.requireAgent(agentId);
    this.agents.set(agentId, { ...agent, lifecycle: "paused" });
    this.emit("AgentStopped", { agentId }, undefined, agentId);
  }

  async planGoal(goalId: string): Promise<ExecutionPlan> {
    const goal = this.requireGoal(goalId);
    const tasks = goal.milestones.length > 0 ? goal.milestones : [goal.objective];
    const planTasks = tasks.map<PlanTask>((milestone, index) => {
      const requiredCapability = this.capabilityFromText(milestone);
      const agent =
        this.discoverAgents(requiredCapability)[0] ?? this.discoverAgents("planning")[0];
      const task: PlanTask = {
        id: `${goal.id}:task:${index + 1}`,
        goalId: goal.id,
        title: milestone,
        subtaskIds: [],
        dependencyIds: index === 0 ? [] : [`${goal.id}:task:${index}`],
        requiredCapability,
        riskIds: [],
        validationCriteria: [
          "Result is observable",
          "Knowledge Graph updated",
          "Semantiq benchmark completed"
        ],
        approvalRequired: this.requiresApproval(milestone),
        status: "pending"
      };
      return agent ? { ...task, assignedAgentId: agent.id } : task;
    });
    const assignments = Object.fromEntries(
      planTasks.flatMap((task) => (task.assignedAgentId ? [[task.id, task.assignedAgentId]] : []))
    );
    const plan: ExecutionPlan = {
      id: `${goal.id}:plan:1`,
      goalId,
      strategy: "deterministic milestone plan with human approval gates",
      tasks: planTasks,
      agentAssignments: assignments,
      dependencyOrder: planTasks.map((task) => task.id),
      risks: planTasks.some((task) => task.approvalRequired)
        ? ["Human approval required for privileged operation"]
        : [],
      validationPlan: ["Execute tasks", "Store memory", "Reflect", "Learn", "Benchmark"],
      alternativePlans: ["Pause for human planning", "Use sequential single-agent execution"]
    };
    this.plans.set(goalId, plan);
    await this.createGraphNode(plan.id, "workflow", "Execution Plan", {
      goalId,
      taskCount: plan.tasks.length
    });
    await this.link(plan.id, goalId, "generated_by");
    this.emit("GoalPlanned", { taskCount: plan.tasks.length }, goalId);
    return plan;
  }

  async createWorkflow(plan: ExecutionPlan): Promise<WorkflowDefinition> {
    const nodes = plan.tasks.map<WorkflowNode>((task) => ({
      id: `${task.id}:node`,
      type: task.approvalRequired ? "approval" : "task",
      name: task.title,
      configuration: { taskId: task.id, requiredCapability: task.requiredCapability },
      approvalRequired: task.approvalRequired
    }));
    const edges = nodes.slice(1).map<WorkflowEdge>((node, index) => ({
      id: `${plan.id}:edge:${index + 1}`,
      fromNodeId: nodes[index]!.id,
      toNodeId: node.id
    }));
    const workflow: WorkflowDefinition = {
      id: `${plan.id}:workflow`,
      goalId: plan.goalId,
      nodes,
      edges,
      mode: "sequential",
      checkpointIds: [],
      recoveryStrategy: "human-escalation",
      version: "1.0.0"
    };
    this.workflows.set(workflow.id, workflow);
    await this.createGraphNode(workflow.id, "workflow", "Workflow", {
      goalId: plan.goalId,
      nodes: nodes.length
    });
    await this.link(workflow.id, plan.id, "generated_by");
    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<WorkflowExecutionResult> {
    const workflow = this.requireWorkflow(workflowId);
    this.emit(
      "WorkflowStarted",
      { nodeCount: workflow.nodes.length },
      workflow.goalId,
      undefined,
      workflow.id
    );
    const approvalNode = workflow.nodes.find((node) => node.approvalRequired);
    if (approvalNode) {
      return {
        id: createId("workflow-execution"),
        workflowId,
        status: "waiting-for-approval",
        completedNodeIds: [],
        checkpointIds: []
      };
    }
    const completedNodeIds = workflow.nodes.map((node) => node.id);
    const benchmark = await this.benchmarkExecution(workflow.goalId, workflowId);
    this.emit("WorkflowCompleted", { completedNodeIds }, workflow.goalId, undefined, workflow.id);
    return {
      id: createId("workflow-execution"),
      workflowId,
      status: "completed",
      completedNodeIds,
      checkpointIds: [createId("checkpoint")],
      benchmarkId: benchmark.report.id
    };
  }

  async runTool(request: ToolRequest): Promise<ToolResult> {
    if (request.approvalRequired) {
      return {
        id: createId("tool-result"),
        requestId: request.id,
        status: "waiting-for-approval",
        output: { reason: "Human approval required" },
        auditId: createId("audit")
      };
    }
    this.toolExecutions += 1;
    this.emit(
      "ToolExecuted",
      { tool: request.kind, requestId: request.id },
      request.goalId,
      request.agentId
    );
    return {
      id: createId("tool-result"),
      requestId: request.id,
      status: "succeeded",
      output: { adapter: request.kind, deterministic: true },
      auditId: createId("audit")
    };
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    this.requireAgent(message.fromAgentId);
    this.requireAgent(message.toAgentId);
    this.messages.push(Object.freeze(message));
  }

  async storeMemory(record: MemoryRecord): Promise<void> {
    this.memory.set(record.id, record);
    await this.createGraphNode(record.id, "knowledge", record.summary, {
      kind: record.kind,
      goalId: record.goalId
    });
    await this.link(record.id, record.goalId, "generated_by");
    this.emit("MemoryUpdated", { memoryId: record.id, kind: record.kind }, record.goalId);
  }

  queryMemory(goalId: string): readonly MemoryRecord[] {
    return [...this.memory.values()].filter((record) => record.goalId === goalId);
  }

  async reflect(record: ReflectionRecord): Promise<void> {
    this.reflections.set(record.id, record);
    const memoryIds = record.memoryUpdateIds;
    this.emit("ReflectionCompleted", { reflectionId: record.id, memoryIds }, record.goalId);
  }

  async learn(record: LearningRecord): Promise<void> {
    this.learning.set(record.id, record);
    this.emit("LearningCompleted", { learningId: record.id }, record.goalId);
  }

  async benchmarkExecution(
    goalId: string,
    workflowId?: string
  ): Promise<Awaited<ReturnType<ExplainableSemantiqRuntime["runSemantiq"]>>> {
    const goal = this.requireGoal(goalId);
    const benchmark = await this.semantiq.runSemantiq(
      {
        id: workflowId ?? goal.id,
        kind: "workflow",
        version: goal.version,
        title: goal.objective,
        content: { goal, workflowId },
        contextIds: [goal.workspaceId],
        evidenceIds: goal.benchmarkIds
      },
      {
        id: "agent-runtime",
        version: "1.0.0",
        name: "Agent Runtime Execution",
        weights: { reasoning: 2, collaboration: 2, reflection: 2 }
      }
    );
    this.emit("ExecutionBenchmarked", { reportId: benchmark.report.id }, goalId);
    return benchmark;
  }

  metrics(): RuntimeMetrics {
    return {
      activeGoals: [...this.goals.values()].filter(
        (goal) => goal.status !== "completed" && goal.status !== "archived"
      ).length,
      registeredAgents: this.agents.size,
      runningWorkflows: this.workflows.size,
      memoryRecords: this.memory.size,
      toolExecutions: this.toolExecutions,
      failures: this.failures,
      health: this.failures === 0 ? "healthy" : "degraded"
    };
  }

  events(): readonly AgentRuntimeEvent[] {
    return this.eventLog;
  }

  private capabilityFromText(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes("test")) return "testing";
    if (lower.includes("research")) return "research";
    if (lower.includes("write") || lower.includes("document")) return "writing";
    if (lower.includes("security")) return "security";
    return "planning";
  }

  private requiresApproval(text: string): boolean {
    const lower = text.toLowerCase();
    return [
      "publish",
      "delete",
      "payment",
      "merge",
      "permission",
      "external",
      "wallet",
      "sensitive"
    ].some((term) => lower.includes(term));
  }

  private requireGoal(goalId: string): Goal {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }
    return goal;
  }

  private requireAgent(agentId: string): AgentDefinition {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    return agent;
  }

  private requireWorkflow(workflowId: string): WorkflowDefinition {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    return workflow;
  }

  private async createGraphNode(
    id: string,
    type: KnowledgeNode["type"],
    title: string,
    metadata: Readonly<Record<string, unknown>>
  ): Promise<void> {
    const object = createKnowledgeObjectAggregate(
      id,
      "workspace:agent-runtime",
      "identity:agent-runtime",
      type,
      title,
      metadata
    );
    await this.graph.createNode({
      id,
      type,
      object,
      labels: [type, "agent-runtime"],
      properties: metadata,
      federationRefs: [],
      version: object.version,
      createdAt: object.createdAt,
      updatedAt: object.updatedAt
    });
  }

  private async link(
    sourceId: string,
    targetId: string,
    relation: Parameters<typeof createKnowledgeEdge>[3]
  ): Promise<void> {
    await this.graph.createEdge(
      createKnowledgeEdge(createId("agent-edge"), sourceId, targetId, relation)
    );
  }

  private emit(
    type: AgentRuntimeEventType,
    payload: unknown,
    goalId?: string,
    agentId?: string,
    workflowId?: string
  ): void {
    const base: AgentRuntimeEvent = {
      type,
      version: 1,
      occurredAt: now(),
      payload
    };
    const withGoal = goalId ? { ...base, goalId } : base;
    const withAgent = agentId ? { ...withGoal, agentId } : withGoal;
    const withWorkflow = workflowId ? { ...withAgent, workflowId } : withAgent;
    this.eventLog.push(Object.freeze(withWorkflow));
  }
}

export const createGoal = (
  id: string,
  objective: string,
  workspaceId: string,
  milestones: readonly string[] = []
): Goal => ({
  id,
  objective,
  milestones,
  taskIds: [],
  dependencyIds: [],
  priority: "normal",
  status: "created",
  resources: [],
  workspaceId,
  benchmarkIds: [],
  historyIds: [],
  reflectionIds: [],
  version: "1.0.0"
});

export const createAgent = (
  id: string,
  type: AgentType,
  capabilities: readonly string[],
  tools: readonly ToolKind[] = []
): AgentDefinition => ({
  id,
  type,
  identityId: `identity:${id}`,
  capabilities,
  skills: capabilities,
  permissions: [],
  tools,
  memoryIds: [],
  knowledgeSourceIds: [],
  runtimeContext: {},
  health: "healthy",
  version: "1.0.0",
  configuration: {},
  benchmarkHistoryIds: [],
  trust: "verified",
  auditIds: [],
  lifecycle: "installed"
});

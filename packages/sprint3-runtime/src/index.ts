import { createAgent, createGoal as createAgentGoal, LocalAgentRuntime, type LearningRecord, type MemoryRecord, type ReflectionRecord, type ToolRequest } from "../../agent-runtime/src/index.js";
import { LocalSprint2Runtime, type Sprint2JourneyResult } from "../../sprint2-runtime/src/index.js";

export type Sprint3GoalState = "Draft" | "Planned" | "Ready" | "Executing" | "Waiting" | "Paused" | "Blocked" | "Completed" | "Cancelled" | "Archived";
export type Sprint3EventType =
  | "GoalCreated"
  | "GoalPlanned"
  | "WorkflowCreated"
  | "WorkflowStarted"
  | "WorkflowPaused"
  | "WorkflowCompleted"
  | "WorkflowFailed"
  | "AgentRegistered"
  | "AgentStarted"
  | "AgentStopped"
  | "MemoryUpdated"
  | "ReflectionCreated"
  | "LearningCompleted"
  | "ApprovalRequested"
  | "ApprovalGranted"
  | "ApprovalRejected";

export type ApprovalAction =
  | "Deleting Knowledge"
  | "Publishing"
  | "Running External Providers"
  | "Executing Dangerous Tools"
  | "Repository Writes"
  | "Workflow Changes"
  | "Agent Installation"
  | "Permission Changes"
  | "Policy Changes";

export type DefaultAgentRole =
  | "Planner Agent"
  | "Research Agent"
  | "Question Agent"
  | "Semantiq Agent"
  | "Evidence Agent"
  | "Hypothesis Agent"
  | "Programming Agent"
  | "Documentation Agent"
  | "Visualization Agent"
  | "Reviewer Agent"
  | "Testing Agent"
  | "Translation Agent"
  | "Summary Agent"
  | "Memory Agent"
  | "Reflection Agent"
  | "Coordinator Agent";

export interface Sprint3Event {
  readonly eventId: string;
  readonly type: Sprint3EventType;
  readonly version: number;
  readonly timestamp: string;
  readonly actorId: string;
  readonly workspaceId: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly payload: unknown;
  readonly audit: Readonly<Record<string, unknown>>;
}

export interface GoalRecord {
  readonly id: string;
  readonly mission: string;
  readonly objectives: readonly string[];
  readonly taskTree: readonly string[];
  readonly milestones: readonly string[];
  readonly dependencies: readonly string[];
  readonly priority: "low" | "normal" | "high" | "critical";
  readonly risks: readonly string[];
  readonly resources: readonly string[];
  readonly expectedOutput: string;
  readonly successCriteria: readonly string[];
  readonly history: readonly string[];
  readonly semantiqEvaluationId?: string;
  readonly knowledgeLinks: readonly string[];
  readonly state: Sprint3GoalState;
  readonly version: string;
}

export interface ExecutionPlanRecord {
  readonly id: string;
  readonly goalId: string;
  readonly kind: "Research Planning" | "Implementation Planning" | "Learning Planning" | "Publication Planning" | "Experiment Planning" | "Community Planning";
  readonly tasks: readonly PlanTaskRecord[];
  readonly dependencies: readonly string[];
  readonly resources: readonly string[];
  readonly risks: readonly string[];
  readonly milestones: readonly string[];
  readonly estimatedDurationMinutes: number;
  readonly confidence: number;
  readonly alternativePlans: readonly string[];
}

export interface PlanTaskRecord {
  readonly id: string;
  readonly description: string;
  readonly dependencyIds: readonly string[];
  readonly requiredCapability: string;
  readonly approvalRequired: boolean;
  readonly assignedAgentId?: string;
  readonly status: "pending" | "running" | "completed" | "blocked" | "waiting-for-approval";
}

export interface WorkflowRecord {
  readonly id: string;
  readonly goalId: string;
  readonly nodes: readonly WorkflowNodeRecord[];
  readonly edges: readonly WorkflowEdgeRecord[];
  readonly state: "draft" | "ready" | "running" | "paused" | "completed" | "failed" | "cancelled" | "waiting-for-approval";
  readonly conditions: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly recovery: "rollback" | "retry" | "resume" | "human-escalation";
  readonly templateId: string;
  readonly nestedWorkflowIds: readonly string[];
}

export interface WorkflowNodeRecord {
  readonly id: string;
  readonly taskId: string;
  readonly type: "task" | "approval" | "tool" | "agent" | "memory" | "reflection" | "learning" | "parallel" | "loop";
  readonly name: string;
  readonly approvalRequired: boolean;
  readonly status: "pending" | "running" | "completed" | "blocked";
}

export interface WorkflowEdgeRecord {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly condition: string;
}

export interface AgentRecord {
  readonly id: string;
  readonly role: DefaultAgentRole;
  readonly lifecycle: "Install" | "Register" | "Load" | "Initialize" | "Start" | "Pause" | "Resume" | "Restart" | "Update" | "Disable" | "Archive" | "Delete" | "Health Monitoring";
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly sandbox: true;
  readonly health: "healthy" | "degraded" | "unavailable";
  readonly version: string;
  readonly metrics: Readonly<Record<string, number>>;
}

export interface ApprovalRecord {
  readonly id: string;
  readonly action: ApprovalAction;
  readonly requesterId: string;
  readonly approverId?: string;
  readonly state: "requested" | "granted" | "rejected";
  readonly reason: string;
  readonly immutable: true;
  readonly createdAt: string;
  readonly decidedAt?: string;
}

export interface CollaborationRecord {
  readonly id: string;
  readonly goalId: string;
  readonly delegatedTaskIds: readonly string[];
  readonly sharedMemoryIds: readonly string[];
  readonly sharedContextIds: readonly string[];
  readonly knowledgeShared: readonly string[];
  readonly conflicts: readonly string[];
  readonly consensus: string;
  readonly negotiationLog: readonly string[];
  readonly humanInterventionRequired: boolean;
}

export interface ReflectionRecord3 {
  readonly id: string;
  readonly goalId: string;
  readonly executionReview: string;
  readonly taskReview: readonly string[];
  readonly goalReview: string;
  readonly knowledgeReview: readonly string[];
  readonly semantiqReview: string;
  readonly improvementSuggestions: readonly string[];
  readonly lessonsLearned: readonly string[];
  readonly failures: readonly string[];
  readonly successes: readonly string[];
  readonly history: readonly string[];
}

export interface LearningRecord3 {
  readonly id: string;
  readonly goalId: string;
  readonly humanFeedback: readonly string[];
  readonly executionFeedback: readonly string[];
  readonly benchmarkLearning: readonly string[];
  readonly workflowOptimization: readonly string[];
  readonly promptOptimization: readonly string[];
  readonly knowledgeExtraction: readonly string[];
  readonly patternDetection: readonly string[];
  readonly recommendationUpdates: readonly string[];
  readonly explanation: string;
}

export interface RuntimeStatus {
  readonly workflowDurationMs: number;
  readonly agentUtilization: number;
  readonly memoryUsage: number;
  readonly executionSuccess: number;
  readonly reflectionRate: number;
  readonly learningImprovements: number;
  readonly semantiqTrends: readonly number[];
  readonly toolUsage: number;
  readonly failures: number;
  readonly costs: number;
  readonly health: "healthy" | "degraded" | "critical";
}

export interface Sprint3JourneyResult {
  readonly sprint2: Sprint2JourneyResult;
  readonly goal: GoalRecord;
  readonly plan: ExecutionPlanRecord;
  readonly workflow: WorkflowRecord;
  readonly executionStatus: WorkflowRecord["state"];
  readonly agents: readonly AgentRecord[];
  readonly approvals: readonly ApprovalRecord[];
  readonly collaboration: CollaborationRecord;
  readonly memory: readonly MemoryRecord[];
  readonly reflection: ReflectionRecord3;
  readonly learning: LearningRecord3;
  readonly runtimeStatus: RuntimeStatus;
  readonly events: readonly Sprint3Event[];
}

const now = (): string => new Date().toISOString();
const id = (prefix: string): string => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export const sprint3DefaultWorkflows = [
  "Question Improvement",
  "Research Planning",
  "Evidence Collection",
  "Evidence Validation",
  "Hypothesis Review",
  "Experiment Planning",
  "Publication Draft",
  "Knowledge Review",
  "Community Review",
  "Semantiq Evaluation",
  "Research Summary"
] as const;

export const sprint3DefaultAgents: readonly { readonly role: DefaultAgentRole; readonly capabilities: readonly string[] }[] = [
  { role: "Planner Agent", capabilities: ["planning", "coordination"] },
  { role: "Research Agent", capabilities: ["research", "evidence"] },
  { role: "Question Agent", capabilities: ["question", "refinement"] },
  { role: "Semantiq Agent", capabilities: ["semantiq", "evaluation"] },
  { role: "Evidence Agent", capabilities: ["evidence", "validation"] },
  { role: "Hypothesis Agent", capabilities: ["hypothesis", "review"] },
  { role: "Programming Agent", capabilities: ["programming", "implementation"] },
  { role: "Documentation Agent", capabilities: ["documentation", "writing"] },
  { role: "Visualization Agent", capabilities: ["visualization", "graph"] },
  { role: "Reviewer Agent", capabilities: ["review", "quality"] },
  { role: "Testing Agent", capabilities: ["testing", "validation"] },
  { role: "Translation Agent", capabilities: ["translation", "language"] },
  { role: "Summary Agent", capabilities: ["summary", "synthesis"] },
  { role: "Memory Agent", capabilities: ["memory", "retrieval"] },
  { role: "Reflection Agent", capabilities: ["reflection", "learning"] },
  { role: "Coordinator Agent", capabilities: ["coordination", "delegation"] }
];

export const sprint3PromptRegistry = [
  "planning.v1",
  "research.v1",
  "review.v1",
  "reflection.v1",
  "summary.v1",
  "workflow.v1",
  "agent-routing.v1",
  "tool-selection.v1",
  "publication.v1",
  "documentation.v1"
] as const;

export const sprint3ApiContracts = [
  "createGoal()",
  "planGoal()",
  "runWorkflow()",
  "pauseWorkflow()",
  "resumeWorkflow()",
  "cancelWorkflow()",
  "registerAgent()",
  "discoverAgents()",
  "delegateTask()",
  "queryMemory()",
  "storeMemory()",
  "reflect()",
  "learn()",
  "approveExecution()"
] as const;

export const sprint3ToolAdapters = [
  "Filesystem",
  "Git",
  "GitHub",
  "Python",
  "Docker",
  "REST",
  "GraphQL",
  "MCP",
  "Browser",
  "Web Search",
  "Database",
  "Markdown",
  "Terminal",
  "Email",
  "Calendar"
] as const;

export class LocalSprint3Runtime {
  private readonly sprint2 = new LocalSprint2Runtime();
  private readonly agentRuntime = new LocalAgentRuntime();
  private readonly goals = new Map<string, GoalRecord>();
  private readonly plans = new Map<string, ExecutionPlanRecord>();
  private readonly workflows = new Map<string, WorkflowRecord>();
  private readonly agents = new Map<string, AgentRecord>();
  private readonly approvals: ApprovalRecord[] = [];
  private readonly collaboration = new Map<string, CollaborationRecord>();
  private readonly memory: MemoryRecord[] = [];
  private readonly reflections = new Map<string, ReflectionRecord3>();
  private readonly learning = new Map<string, LearningRecord3>();
  private readonly events: Sprint3Event[] = [];
  private readonly semantiqTrendScores: number[] = [];
  private failures = 0;
  private toolUsage = 0;
  private startedAt = performance.now();

  async runOperationalJourney(input: {
    readonly identityId: string;
    readonly displayName: string;
    readonly workspaceName: string;
    readonly rawQuestion: string;
    readonly evidenceTitle: string;
    readonly evidenceSource: string;
  }): Promise<Sprint3JourneyResult> {
    this.startedAt = performance.now();
    const sprint2 = await this.sprint2.runCriticalJourney(input);
    const agents = await this.installDefaultAgents(sprint2.identityId, sprint2.workspaceId);
    const goal = await this.createGoal(sprint2.workspaceId, sprint2.identityId, {
      mission: `Execute research workflow for ${sprint2.question.text}`,
      objectives: sprint2.researchProject.objectives,
      taskTree: sprint2.tasks.map((task) => task.description),
      milestones: sprint2.researchProject.milestones,
      dependencies: [sprint2.researchProject.id],
      priority: "high",
      risks: sprint2.researchProject.risks,
      resources: [sprint2.evidence.id, sprint2.hypothesis.id],
      expectedOutput: "Reviewed research summary with reusable knowledge and learning records.",
      successCriteria: ["Workflow completed", "Memory stored", "Reflection created", "Learning completed", "Graph updated"]
    });
    const plan = await this.planGoal(sprint2.workspaceId, sprint2.identityId, goal.id);
    const workflow = await this.createWorkflow(sprint2.workspaceId, sprint2.identityId, plan.id);
    const approval = await this.requestApproval(sprint2.workspaceId, sprint2.identityId, "Running External Providers", "Confirm workflow remains local and no external provider is called.");
    await this.approveExecution(sprint2.workspaceId, sprint2.identityId, approval.id);
    const executionStatus = await this.runWorkflow(sprint2.workspaceId, sprint2.identityId, workflow.id);
    const collaboration = await this.delegateTask(sprint2.workspaceId, sprint2.identityId, goal.id);
    const memory = await this.storeMemory(sprint2.workspaceId, sprint2.identityId, goal.id, "Workflow generated research summary, evidence review, and hypothesis review.");
    const reflection = await this.reflect(sprint2.workspaceId, sprint2.identityId, goal.id);
    const learning = await this.learn(sprint2.workspaceId, sprint2.identityId, goal.id, reflection.id);
    const runtimeStatus = this.runtimeStatus();
    return {
      sprint2,
      goal: this.requireGoal(goal.id),
      plan,
      workflow: this.requireWorkflow(workflow.id),
      executionStatus,
      agents,
      approvals: this.approvals,
      collaboration,
      memory,
      reflection,
      learning,
      runtimeStatus,
      events: this.events
    };
  }

  async createGoal(
    workspaceId: string,
    actorId: string,
    input: Omit<GoalRecord, "id" | "history" | "knowledgeLinks" | "state" | "version" | "semantiqEvaluationId">
  ): Promise<GoalRecord> {
    const goal: GoalRecord = {
      ...input,
      id: id("goal"),
      history: [`Draft:${now()}`],
      knowledgeLinks: input.resources,
      state: "Draft",
      version: "1.0.0"
    };
    this.goals.set(goal.id, goal);
    await this.agentRuntime.createGoal(createAgentGoal(goal.id, goal.mission, workspaceId, goal.taskTree));
    this.emit("GoalCreated", actorId, workspaceId, goal.id, { goalId: goal.id });
    return goal;
  }

  async planGoal(workspaceId: string, actorId: string, goalId: string): Promise<ExecutionPlanRecord> {
    const goal = this.requireGoal(goalId);
    const tasks = goal.taskTree.map<PlanTaskRecord>((task, index) => {
      const requiredCapability = this.capabilityFor(task);
      const agent = this.discoverAgents(requiredCapability)[0] ?? this.discoverAgents("planning")[0];
      const base = {
        id: `${goal.id}:task:${index + 1}`,
        description: task,
        dependencyIds: index === 0 ? [] : [`${goal.id}:task:${index}`],
        requiredCapability,
        approvalRequired: this.requiresApproval(task),
        status: "pending" as const
      };
      return agent ? { ...base, assignedAgentId: agent.id } : base;
    });
    const plan: ExecutionPlanRecord = {
      id: id("plan"),
      goalId,
      kind: "Research Planning",
      tasks,
      dependencies: goal.dependencies,
      resources: goal.resources,
      risks: goal.risks,
      milestones: goal.milestones,
      estimatedDurationMinutes: Math.max(15, tasks.length * 10),
      confidence: 0.78,
      alternativePlans: ["Sequential single-agent execution", "Human-led research checklist", "Pause for additional planning"]
    };
    this.plans.set(plan.id, plan);
    this.transitionGoal(goalId, "Planned", `GoalPlanned:${now()}`);
    await this.agentRuntime.planGoal(goalId);
    this.emit("GoalPlanned", actorId, workspaceId, goalId, { planId: plan.id, taskCount: tasks.length });
    return plan;
  }

  async createWorkflow(workspaceId: string, actorId: string, planId: string): Promise<WorkflowRecord> {
    const plan = this.requirePlan(planId);
    const nodes = plan.tasks.map<WorkflowNodeRecord>((task) => ({
      id: `${task.id}:node`,
      taskId: task.id,
      type: task.approvalRequired ? "approval" : "task",
      name: task.description,
      approvalRequired: task.approvalRequired,
      status: "pending"
    }));
    const edges = nodes.slice(1).map<WorkflowEdgeRecord>((node, index) => ({
      id: `${plan.id}:edge:${index + 1}`,
      from: nodes[index]!.id,
      to: node.id,
      condition: "previous completed"
    }));
    const workflow: WorkflowRecord = {
      id: id("workflow"),
      goalId: plan.goalId,
      nodes,
      edges,
      state: "ready",
      conditions: ["approval gates before privileged actions", "checkpoint after every task"],
      checkpointIds: [],
      recovery: "human-escalation",
      templateId: "research-summary",
      nestedWorkflowIds: []
    };
    this.workflows.set(workflow.id, workflow);
    this.transitionGoal(plan.goalId, "Ready", `WorkflowCreated:${now()}`);
    this.emit("WorkflowCreated", actorId, workspaceId, workflow.id, { workflowId: workflow.id, nodes: nodes.length });
    return workflow;
  }

  async runWorkflow(workspaceId: string, actorId: string, workflowId: string): Promise<WorkflowRecord["state"]> {
    const workflow = this.requireWorkflow(workflowId);
    this.workflows.set(workflowId, { ...workflow, state: "running" });
    this.transitionGoal(workflow.goalId, "Executing", `WorkflowStarted:${now()}`);
    this.emit("WorkflowStarted", actorId, workspaceId, workflowId, { workflowId });
    const blocked = workflow.nodes.find((node) => node.approvalRequired && !this.approvals.some((approval) => approval.state === "granted"));
    if (blocked) {
      const waiting = { ...workflow, state: "waiting-for-approval" as const };
      this.workflows.set(workflowId, waiting);
      this.transitionGoal(workflow.goalId, "Waiting", `ApprovalWaiting:${now()}`);
      return waiting.state;
    }
    const completed = {
      ...workflow,
      state: "completed" as const,
      nodes: workflow.nodes.map((node) => ({ ...node, status: "completed" as const })),
      checkpointIds: [...workflow.checkpointIds, id("checkpoint")]
    };
    this.workflows.set(workflowId, completed);
    const benchmark = await this.agentRuntime.benchmarkExecution(workflow.goalId, workflow.id);
    this.semantiqTrendScores.push(benchmark.report.weightedScore);
    this.transitionGoal(workflow.goalId, "Completed", `WorkflowCompleted:${now()}`);
    this.emit("WorkflowCompleted", actorId, workspaceId, workflowId, { workflowId, benchmarkId: benchmark.report.id });
    return completed.state;
  }

  pauseWorkflow(workspaceId: string, actorId: string, workflowId: string): WorkflowRecord {
    const workflow = this.requireWorkflow(workflowId);
    const updated = { ...workflow, state: "paused" as const };
    this.workflows.set(workflowId, updated);
    this.transitionGoal(workflow.goalId, "Paused", `WorkflowPaused:${now()}`);
    this.emit("WorkflowPaused", actorId, workspaceId, workflowId, { workflowId });
    return updated;
  }

  resumeWorkflow(workspaceId: string, actorId: string, workflowId: string): WorkflowRecord {
    const workflow = this.requireWorkflow(workflowId);
    const updated = { ...workflow, state: "ready" as const };
    this.workflows.set(workflowId, updated);
    this.transitionGoal(workflow.goalId, "Ready", `WorkflowResumed:${now()}`);
    return updated;
  }

  cancelWorkflow(workspaceId: string, actorId: string, workflowId: string): WorkflowRecord {
    const workflow = this.requireWorkflow(workflowId);
    const updated = { ...workflow, state: "cancelled" as const };
    this.workflows.set(workflowId, updated);
    this.transitionGoal(workflow.goalId, "Cancelled", `WorkflowCancelled:${now()}`);
    return updated;
  }

  async registerAgent(workspaceId: string, actorId: string, role: DefaultAgentRole, capabilities: readonly string[]): Promise<AgentRecord> {
    const agent: AgentRecord = {
      id: id("agent"),
      role,
      lifecycle: "Register",
      capabilities,
      permissions: [],
      sandbox: true,
      health: "healthy",
      version: "1.0.0",
      metrics: { utilization: 0, tasksCompleted: 0 }
    };
    this.agents.set(agent.id, agent);
    await this.agentRuntime.registerAgent(createAgent(agent.id, this.agentType(role), capabilities, []));
    await this.agentRuntime.startAgent(agent.id);
    this.emit("AgentRegistered", actorId, workspaceId, agent.id, { agentId: agent.id, role });
    this.emit("AgentStarted", actorId, workspaceId, agent.id, { agentId: agent.id });
    return agent;
  }

  discoverAgents(capability: string): readonly AgentRecord[] {
    return [...this.agents.values()].filter((agent) => agent.health === "healthy" && agent.capabilities.includes(capability));
  }

  async delegateTask(workspaceId: string, actorId: string, goalId: string): Promise<CollaborationRecord> {
    const plan = [...this.plans.values()].find((item) => item.goalId === goalId);
    if (!plan) throw new Error(`Plan not found for goal ${goalId}`);
    const record: CollaborationRecord = {
      id: id("collaboration"),
      goalId,
      delegatedTaskIds: plan.tasks.map((task) => task.id),
      sharedMemoryIds: this.memory.map((item) => item.id),
      sharedContextIds: plan.resources,
      knowledgeShared: ["Research question", "Evidence quality", "Hypothesis", "Semantiq report"],
      conflicts: [],
      consensus: "Agents agreed on sequential local execution with human approval gates.",
      negotiationLog: ["Coordinator delegated tasks by capability.", "Reviewer retained approval checkpoints."],
      humanInterventionRequired: plan.tasks.some((task) => task.approvalRequired)
    };
    this.collaboration.set(record.id, record);
    return record;
  }

  async storeMemory(workspaceId: string, actorId: string, goalId: string, content: string): Promise<readonly MemoryRecord[]> {
    const kinds: MemoryRecord["kind"][] = ["working", "workspace", "research", "semantic", "conversation", "execution", "long-term"];
    const created = kinds.map<MemoryRecord>((kind) => ({
      id: id("memory"),
      kind,
      ownerId: actorId,
      goalId,
      content,
      summary: `${kind} memory for ${goalId}`,
      sourceIds: [goalId],
      version: "1.0.0",
      portable: true
    }));
    for (const record of created) {
      this.memory.push(record);
      await this.agentRuntime.storeMemory(record);
      this.emit("MemoryUpdated", actorId, workspaceId, record.id, { memoryId: record.id, kind: record.kind });
    }
    return created;
  }

  queryMemory(goalId: string): readonly MemoryRecord[] {
    return this.memory.filter((record) => record.goalId === goalId);
  }

  async reflect(workspaceId: string, actorId: string, goalId: string): Promise<ReflectionRecord3> {
    const goal = this.requireGoal(goalId);
    const record: ReflectionRecord3 = {
      id: id("reflection"),
      goalId,
      executionReview: "Workflow completed through deterministic local execution.",
      taskReview: goal.taskTree.map((task) => `Reviewed task: ${task}`),
      goalReview: "Goal remained aligned with research objective and human oversight.",
      knowledgeReview: goal.knowledgeLinks,
      semantiqReview: "Semantiq execution benchmark recorded.",
      improvementSuggestions: ["Add persistent workflow storage.", "Expand real tool adapters under approval policy."],
      lessonsLearned: ["Approval-first execution keeps research automation auditable."],
      failures: [],
      successes: ["Plan created", "Workflow completed", "Memory stored"],
      history: [`created:${now()}`]
    };
    this.reflections.set(record.id, record);
    const agentReflection: ReflectionRecord = {
      id: record.id,
      goalId,
      executionReview: record.executionReview,
      goalReview: record.goalReview,
      errorReview: record.failures,
      improvementSuggestions: record.improvementSuggestions,
      benchmarkAnalysis: record.semantiqReview,
      knowledgeExtracted: record.lessonsLearned,
      futureRecommendations: record.improvementSuggestions,
      memoryUpdateIds: this.queryMemory(goalId).map((memory) => memory.id)
    };
    await this.agentRuntime.reflect(agentReflection);
    this.emit("ReflectionCreated", actorId, workspaceId, record.id, { reflectionId: record.id });
    return record;
  }

  async learn(workspaceId: string, actorId: string, goalId: string, reflectionId: string): Promise<LearningRecord3> {
    const reflection = this.reflections.get(reflectionId);
    if (!reflection) throw new Error(`Reflection not found: ${reflectionId}`);
    const record: LearningRecord3 = {
      id: id("learning"),
      goalId,
      humanFeedback: ["Human approval remained required for privileged operations."],
      executionFeedback: reflection.successes,
      benchmarkLearning: ["Use Semantiq trend scores to compare workflow quality."],
      workflowOptimization: ["Prefer reusable research-summary workflow template."],
      promptOptimization: ["Keep planning prompts explicit about approval gates."],
      knowledgeExtraction: reflection.lessonsLearned,
      patternDetection: ["Research tasks map cleanly to capability-based agent delegation."],
      recommendationUpdates: ["Start Sprint 4 with persistent orchestration storage."],
      explanation: "Learning derived from execution, reflection, memory, and human approval history."
    };
    this.learning.set(record.id, record);
    const agentLearning: LearningRecord = {
      id: record.id,
      goalId,
      humanFeedbackIds: record.humanFeedback,
      executionFeedbackIds: record.executionFeedback,
      benchmarkIds: [],
      workflowOptimization: record.workflowOptimization,
      knowledgeExtracted: record.knowledgeExtraction,
      recommendationUpdates: record.recommendationUpdates,
      explanation: record.explanation
    };
    await this.agentRuntime.learn(agentLearning);
    this.emit("LearningCompleted", actorId, workspaceId, record.id, { learningId: record.id });
    return record;
  }

  async requestApproval(workspaceId: string, actorId: string, action: ApprovalAction, reason: string): Promise<ApprovalRecord> {
    const approval: ApprovalRecord = { id: id("approval"), action, requesterId: actorId, state: "requested", reason, immutable: true, createdAt: now() };
    this.approvals.push(approval);
    this.emit("ApprovalRequested", actorId, workspaceId, approval.id, { action, reason });
    return approval;
  }

  async approveExecution(workspaceId: string, actorId: string, approvalId: string): Promise<ApprovalRecord> {
    const approval = this.requireApproval(approvalId);
    const updated: ApprovalRecord = { ...approval, approverId: actorId, state: "granted", decidedAt: now() };
    this.approvals.push(updated);
    this.emit("ApprovalGranted", actorId, workspaceId, approvalId, { approvalId });
    return updated;
  }

  rejectApproval(workspaceId: string, actorId: string, approvalId: string): ApprovalRecord {
    const approval = this.requireApproval(approvalId);
    const updated: ApprovalRecord = { ...approval, approverId: actorId, state: "rejected", decidedAt: now() };
    this.approvals.push(updated);
    this.emit("ApprovalRejected", actorId, workspaceId, approvalId, { approvalId });
    return updated;
  }

  async runTool(workspaceId: string, actorId: string, goalId: string, action: ApprovalAction): Promise<"waiting-for-approval" | "succeeded"> {
    const request: ToolRequest = {
      id: id("tool"),
      kind: "terminal",
      agentId: actorId,
      goalId,
      input: { action },
      permissionIds: [],
      approvalRequired: action === "Executing Dangerous Tools" || action === "Repository Writes"
    };
    const result = await this.agentRuntime.runTool(request);
    if (result.status === "waiting-for-approval") {
      await this.requestApproval(workspaceId, actorId, action, "Tool adapter requires human approval.");
      return "waiting-for-approval";
    }
    this.toolUsage += 1;
    return "succeeded";
  }

  runtimeStatus(): RuntimeStatus {
    const duration = performance.now() - this.startedAt;
    const completed = [...this.workflows.values()].filter((workflow) => workflow.state === "completed").length;
    return {
      workflowDurationMs: duration,
      agentUtilization: this.agents.size === 0 ? 0 : completed / this.agents.size,
      memoryUsage: this.memory.length,
      executionSuccess: this.workflows.size === 0 ? 0 : completed / this.workflows.size,
      reflectionRate: this.reflections.size,
      learningImprovements: this.learning.size,
      semantiqTrends: this.semantiqTrendScores,
      toolUsage: this.toolUsage,
      failures: this.failures,
      costs: 0,
      health: this.failures === 0 ? "healthy" : "degraded"
    };
  }

  eventsLog(): readonly Sprint3Event[] {
    return this.events;
  }

  private async installDefaultAgents(actorId: string, workspaceId: string): Promise<readonly AgentRecord[]> {
    const created: AgentRecord[] = [];
    for (const definition of sprint3DefaultAgents) {
      created.push(await this.registerAgent(workspaceId, actorId, definition.role, definition.capabilities));
    }
    return created;
  }

  private transitionGoal(goalId: string, state: Sprint3GoalState, history: string): void {
    const goal = this.requireGoal(goalId);
    this.goals.set(goalId, { ...goal, state, history: [...goal.history, history] });
  }

  private capabilityFor(task: string): string {
    const lower = task.toLowerCase();
    if (lower.includes("evidence")) return "evidence";
    if (lower.includes("hypothesis")) return "hypothesis";
    if (lower.includes("review")) return "review";
    if (lower.includes("summary")) return "summary";
    if (lower.includes("experiment")) return "research";
    return "planning";
  }

  private requiresApproval(task: string): boolean {
    const lower = task.toLowerCase();
    return ["publish", "delete", "external", "repository", "permission", "policy", "dangerous"].some((term) => lower.includes(term));
  }

  private agentType(role: DefaultAgentRole): Parameters<typeof createAgent>[1] {
    if (role.includes("Research")) return "research";
    if (role.includes("Question")) return "question";
    if (role.includes("Programming")) return "programming";
    if (role.includes("Documentation") || role.includes("Summary")) return "documentation";
    if (role.includes("Reviewer")) return "review";
    if (role.includes("Testing")) return "testing";
    if (role.includes("Visualization")) return "visualization";
    if (role.includes("Memory")) return "memory";
    if (role.includes("Reflection")) return "reflection";
    return "planner";
  }

  private requireGoal(goalId: string): GoalRecord {
    const goal = this.goals.get(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);
    return goal;
  }

  private requirePlan(planId: string): ExecutionPlanRecord {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);
    return plan;
  }

  private requireWorkflow(workflowId: string): WorkflowRecord {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);
    return workflow;
  }

  private requireApproval(approvalId: string): ApprovalRecord {
    const approval = [...this.approvals].reverse().find((item) => item.id === approvalId);
    if (!approval) throw new Error(`Approval not found: ${approvalId}`);
    return approval;
  }

  private emit(type: Sprint3EventType, actorId: string, workspaceId: string, causationId: string, payload: unknown): void {
    this.events.push({
      eventId: id("event"),
      type,
      version: 1,
      timestamp: now(),
      actorId,
      workspaceId,
      correlationId: `corr:${workspaceId}`,
      causationId,
      payload,
      audit: { localFirst: true, humanApproved: type === "ApprovalGranted" }
    });
  }
}

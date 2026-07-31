export type * from "./contracts.js";

import type { Command, Query, TechClubModule } from "@tech-club/core";
import type {
  AgentAssignment,
  AgentGoal,
  AgentOsEvent,
  AgentOsRepository,
  AgentOsRuntime,
  AgentProfile,
  ExecutionPlan,
  ExecutionTask,
  HumanApprovalPolicy,
  LearningRecord,
  MemoryRecord,
  ReflectionRecord,
  RuntimeStatus
} from "./contracts.js";

export interface AgentOsModule extends TechClubModule<AgentOsConfig> {
  dispatch(command: Command): Promise<void>;
  query<TResult>(query: Query): Promise<TResult>;
}

export interface AgentOsConfig {
  readonly humanApprovalRequired: boolean;
  readonly toolRegistryEnabled: boolean;
}

const approvalActions = new Set([
  "publishing",
  "deleting",
  "payments",
  "repository-merge",
  "permission-change",
  "external-communication",
  "wallet-operation",
  "sensitive-research",
  "major-workflow-change"
]);

export class LocalAgentOsRepository implements AgentOsRepository {
  private readonly goals = new Map<string, AgentGoal>();
  private readonly agents = new Map<string, AgentProfile>();
  private readonly plans = new Map<string, ExecutionPlan>();
  private readonly memory: MemoryRecord[] = [];
  private readonly reflections: ReflectionRecord[] = [];
  private readonly learning: LearningRecord[] = [];
  private readonly events: AgentOsEvent[] = [];

  async saveGoal(goal: AgentGoal): Promise<void> {
    this.goals.set(goal.id, goal);
  }

  async getGoal(goalId: string): Promise<AgentGoal | undefined> {
    return this.goals.get(goalId);
  }

  async saveAgent(agent: AgentProfile): Promise<void> {
    this.agents.set(agent.id, agent);
  }

  async getAgent(agentId: string): Promise<AgentProfile | undefined> {
    return this.agents.get(agentId);
  }

  async savePlan(plan: ExecutionPlan): Promise<void> {
    this.plans.set(plan.goalId, plan);
  }

  async getPlan(goalId: string): Promise<ExecutionPlan | undefined> {
    return this.plans.get(goalId);
  }

  async saveMemory(record: MemoryRecord): Promise<void> {
    this.memory.push(Object.freeze(record));
  }

  async queryMemory(goalId: string): Promise<readonly MemoryRecord[]> {
    return this.memory.filter((record) => record.goalId === goalId);
  }

  async saveReflection(record: ReflectionRecord): Promise<void> {
    this.reflections.push(Object.freeze(record));
  }

  async saveLearning(record: LearningRecord): Promise<void> {
    this.learning.push(Object.freeze(record));
  }

  async publishEvent(event: AgentOsEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listEvents(): readonly AgentOsEvent[] {
    return this.events;
  }
}

export class LocalAgentOsRuntime implements AgentOsRuntime {
  private startedAt = Date.now();
  private toolInvocationCount = 0;
  private failureCount = 0;

  constructor(
    private readonly repository: LocalAgentOsRepository = new LocalAgentOsRepository(),
    private readonly approvalPolicies: readonly HumanApprovalPolicy[] = []
  ) {}

  async createGoal(goal: AgentGoal): Promise<void> {
    if (goal.completionCriteria.length === 0) {
      throw new Error("Goals require explicit completion criteria");
    }
    await this.repository.saveGoal(goal);
    await this.emit("GoalCreated", { version: goal.version }, goal.id);
  }

  async planGoal(goalId: string): Promise<ExecutionPlan> {
    const goal = await this.requireGoal(goalId);
    const tasks = goal.requirements.map<ExecutionTask>((requirement, index) => ({
      id: `${goal.id}:task:${index + 1}`,
      goalId: goal.id,
      title: requirement,
      description: `Satisfy requirement: ${requirement}`,
      state: "pending",
      dependencyIds: index === 0 ? [] : [`${goal.id}:task:${index}`],
      requiredCapability: "goal-execution",
      validationCriteria: goal.completionCriteria,
      approvalRequired: this.requiresApproval(requirement),
      checkpointIds: []
    }));
    const plan: ExecutionPlan = {
      id: `${goal.id}:plan:${goal.version}`,
      goalId: goal.id,
      orchestrationMode: "sequential",
      objectiveIds: goal.requirements.map((_, index) => `${goal.id}:objective:${index + 1}`),
      milestoneIds: goal.requirements.map((_, index) => `${goal.id}:milestone:${index + 1}`),
      tasks,
      assignments: [],
      validationPlan: goal.completionCriteria,
      reflectionPlan: ["completion", "errors", "missed-opportunities", "efficiency", "knowledge-learned"],
      approvalGateIds: tasks.filter((task) => task.approvalRequired).map((task) => `${task.id}:approval`),
      checkpointIds: [],
      rollbackPlan: ["restore-latest-checkpoint", "escalate-to-human"],
      semantiqCriteria: ["reasoning", "evidence", "quality", "completeness", "clarity", "reflection", "learning"],
      graphWriteTargets: ["goals", "plans", "tasks", "results", "agents", "benchmarks", "reflections"]
    };
    await this.repository.savePlan(plan);
    await this.emit("GoalPlanned", { taskCount: plan.tasks.length }, goal.id);
    return plan;
  }

  async assignAgent(assignment: AgentAssignment): Promise<void> {
    const agent = await this.repository.getAgent(assignment.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${assignment.agentId}`);
    }
    await this.emit("AgentAssigned", assignment, assignment.goalId, assignment.agentId);
  }

  async executeTask(taskId: string): Promise<void> {
    const plan = await this.findPlanForTask(taskId);
    const task = plan.tasks.find((candidate) => candidate.id === taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (task.approvalRequired) {
      throw new Error(`Task requires human approval before execution: ${taskId}`);
    }
    this.toolInvocationCount += 1;
    await this.emit("ExecutionStarted", { taskId }, plan.goalId, task.assignedAgentId);
    await this.emit("ExecutionCompleted", { taskId }, plan.goalId, task.assignedAgentId);
  }

  async delegateTask(taskId: string, agentId: string): Promise<void> {
    const plan = await this.findPlanForTask(taskId);
    const agent = await this.repository.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    await this.emit("TaskDelegated", { taskId, agentId }, plan.goalId, agentId);
  }

  async pauseExecution(goalId: string): Promise<void> {
    await this.requireGoal(goalId);
    await this.emit("FailureDetected", { reason: "paused-by-request" }, goalId);
  }

  async resumeExecution(goalId: string): Promise<void> {
    await this.requireGoal(goalId);
    await this.emit("RecoveryStarted", { reason: "resume-requested" }, goalId);
  }

  async cancelExecution(goalId: string): Promise<void> {
    await this.requireGoal(goalId);
    await this.emit("GoalArchived", { state: "cancelled" }, goalId);
  }

  async attachMemory(record: MemoryRecord): Promise<void> {
    await this.repository.saveMemory(record);
    await this.emit("MemoryStored", { memoryId: record.id, type: record.type }, record.goalId);
  }

  async queryMemory(goalId: string): Promise<readonly MemoryRecord[]> {
    return this.repository.queryMemory(goalId);
  }

  async reflect(record: ReflectionRecord): Promise<void> {
    await this.repository.saveReflection(record);
    await this.emit("ReflectionCompleted", { reflectionId: record.id }, record.goalId, record.agentId);
  }

  async learn(record: LearningRecord): Promise<void> {
    await this.repository.saveLearning(record);
    await this.emit("LearningUpdated", { learningId: record.id }, record.goalId);
  }

  async benchmarkExecution(goalId: string): Promise<void> {
    await this.requireGoal(goalId);
    await this.emit("BenchmarkCompleted", { semantiq: "pending-adapter" }, goalId);
  }

  async getRuntimeStatus(): Promise<RuntimeStatus> {
    return {
      runningAgentCount: 0,
      activeGoalCount: 0,
      executionTimeMs: Date.now() - this.startedAt,
      successRate: this.failureCount === 0 ? 1 : 0,
      failureCount: this.failureCount,
      estimatedCost: 0,
      memoryUsage: 0,
      toolInvocationCount: this.toolInvocationCount,
      workspaceActivityCount: 0,
      knowledgeProducedCount: 0,
      benchmarkScoreIds: [],
      health: "healthy"
    };
  }

  registerAgent(agent: AgentProfile): Promise<void> {
    return this.repository.saveAgent(agent);
  }

  private requiresApproval(text: string): boolean {
    if (this.approvalPolicies.some((policy) => policy.required)) {
      return true;
    }
    const normalized = text.toLowerCase();
    return [...approvalActions].some((action) => normalized.includes(action));
  }

  private async requireGoal(goalId: string): Promise<AgentGoal> {
    const goal = await this.repository.getGoal(goalId);
    if (!goal) {
      throw new Error(`Goal not found: ${goalId}`);
    }
    return goal;
  }

  private async findPlanForTask(taskId: string): Promise<ExecutionPlan> {
    const [goalId] = taskId.split(":task:");
    if (!goalId) {
      throw new Error(`Invalid task id: ${taskId}`);
    }
    const plan = await this.repository.getPlan(goalId);
    if (!plan) {
      throw new Error(`Plan not found for task: ${taskId}`);
    }
    return plan;
  }

  private async emit(type: AgentOsEvent["type"], payload: unknown, goalId?: string, agentId?: string): Promise<void> {
    const event: AgentOsEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const eventWithGoal = goalId ? { ...event, goalId } : event;
    const eventWithAgent = agentId ? { ...eventWithGoal, agentId } : eventWithGoal;
    await this.repository.publishEvent(eventWithAgent);
  }
}

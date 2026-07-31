export type GoalPriority = "low" | "normal" | "high" | "critical";

export type GoalState =
  | "created"
  | "interpreted"
  | "planned"
  | "assigned"
  | "executing"
  | "paused"
  | "validating"
  | "benchmarking"
  | "reflecting"
  | "learning"
  | "completed"
  | "cancelled"
  | "archived"
  | "failed";

export type AgentLifecycleState =
  | "registered"
  | "loaded"
  | "initialized"
  | "assigned"
  | "planning"
  | "executing"
  | "validating"
  | "reflecting"
  | "learning"
  | "archived"
  | "unloaded";

export type AgentType =
  | "planner"
  | "research"
  | "question"
  | "writing"
  | "programming"
  | "review"
  | "scientific"
  | "data"
  | "visualization"
  | "presentation"
  | "translation"
  | "community"
  | "game"
  | "narrative"
  | "education"
  | "security"
  | "infrastructure"
  | "repository"
  | "workflow"
  | "benchmark"
  | "memory"
  | "analytics"
  | "notification";

export type OrchestrationMode =
  | "sequential"
  | "parallel"
  | "hierarchical"
  | "peer-collaboration"
  | "delegation"
  | "negotiation"
  | "voting"
  | "consensus"
  | "supervised"
  | "human-intervention"
  | "nested-workflow";

export type ExecutionTaskState =
  | "pending"
  | "assigned"
  | "running"
  | "waiting-for-approval"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export type MemoryType =
  | "working"
  | "project"
  | "workspace"
  | "semantic"
  | "conversation"
  | "agent"
  | "research"
  | "execution"
  | "reflection"
  | "long-term";

export type ToolKind =
  | "python"
  | "git"
  | "docker"
  | "terminal"
  | "filesystem"
  | "browser"
  | "mcp"
  | "rest"
  | "graphql"
  | "google-workspace"
  | "github"
  | "local-ai"
  | "cloud-ai"
  | "database"
  | "webgpu";

export type CriticalAction =
  | "publishing"
  | "deleting"
  | "payments"
  | "repository-merge"
  | "permission-change"
  | "external-communication"
  | "wallet-operation"
  | "sensitive-research"
  | "major-workflow-change";

export interface AgentGoal {
  readonly id: string;
  readonly version: number;
  readonly description: string;
  readonly priority: GoalPriority;
  readonly contextIds: readonly string[];
  readonly requirements: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly constraints: readonly string[];
  readonly resourceIds: readonly string[];
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly assignedAgentIds: readonly string[];
  readonly progress: number;
  readonly benchmarkIds: readonly string[];
  readonly risks: readonly string[];
  readonly expectedOutcome: string;
  readonly completionCriteria: readonly string[];
  readonly historyIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly state: GoalState;
}

export interface AgentCapabilityManifest {
  readonly agentId: string;
  readonly capabilities: readonly string[];
  readonly skills: readonly string[];
  readonly toolKinds: readonly ToolKind[];
  readonly permissionIds: readonly string[];
  readonly knowledgeSourceIds: readonly string[];
  readonly maxContextTokens: number;
  readonly supportedOrchestrationModes: readonly OrchestrationMode[];
}

export interface AgentProfile {
  readonly id: string;
  readonly type: AgentType;
  readonly displayName: string;
  readonly manifest: AgentCapabilityManifest;
  readonly memoryIds: readonly string[];
  readonly runtimeState: AgentLifecycleState;
  readonly health: "healthy" | "degraded" | "unavailable" | "unknown";
  readonly metricIds: readonly string[];
  readonly costProfileId?: string;
  readonly executionHistoryIds: readonly string[];
  readonly benchmarkHistoryIds: readonly string[];
  readonly trustLevel: "unverified" | "verified" | "trusted" | "restricted";
}

export interface RuntimeContext {
  readonly workspaceContextIds: readonly string[];
  readonly projectContextIds: readonly string[];
  readonly questionContextIds: readonly string[];
  readonly knowledgeGraphContextIds: readonly string[];
  readonly repositoryContextIds: readonly string[];
  readonly conversationContextIds: readonly string[];
  readonly memoryContextIds: readonly string[];
  readonly semanticWalletContextIds: readonly string[];
  readonly agentContextIds: readonly string[];
}

export interface ExecutionTask {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly description: string;
  readonly state: ExecutionTaskState;
  readonly dependencyIds: readonly string[];
  readonly assignedAgentId?: string;
  readonly requiredCapability: string;
  readonly validationCriteria: readonly string[];
  readonly approvalRequired: boolean;
  readonly checkpointIds: readonly string[];
}

export interface AgentAssignment {
  readonly id: string;
  readonly goalId: string;
  readonly taskId: string;
  readonly agentId: string;
  readonly requiredCapability: string;
  readonly context: RuntimeContext;
  readonly permissionIds: readonly string[];
  readonly validationCriteria: readonly string[];
  readonly approvalPolicyIds: readonly string[];
}

export interface ExecutionPlan {
  readonly id: string;
  readonly goalId: string;
  readonly orchestrationMode: OrchestrationMode;
  readonly objectiveIds: readonly string[];
  readonly milestoneIds: readonly string[];
  readonly tasks: readonly ExecutionTask[];
  readonly assignments: readonly AgentAssignment[];
  readonly validationPlan: readonly string[];
  readonly reflectionPlan: readonly string[];
  readonly approvalGateIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly rollbackPlan: readonly string[];
  readonly semantiqCriteria: readonly string[];
  readonly graphWriteTargets: readonly string[];
}

export interface MemoryRecord {
  readonly id: string;
  readonly type: MemoryType;
  readonly ownerId: string;
  readonly goalId?: string;
  readonly sourceIds: readonly string[];
  readonly content: string;
  readonly summary?: string;
  readonly version: number;
  readonly permissionIds: readonly string[];
  readonly confidence: number;
  readonly createdAt: string;
}

export interface ToolInvocation {
  readonly id: string;
  readonly goalId: string;
  readonly taskId: string;
  readonly agentId: string;
  readonly kind: ToolKind;
  readonly inputSummary: string;
  readonly permissionId: string;
  readonly timeoutMs: number;
  readonly auditId: string;
  readonly approvalRequired: boolean;
  readonly errorHandling: "retry" | "fallback-agent" | "rollback" | "checkpoint-restore" | "human-escalation" | "partial-completion";
}

export interface HumanApprovalPolicy {
  readonly id: string;
  readonly criticalActions: readonly CriticalAction[];
  readonly approverIds: readonly string[];
  readonly reason: string;
  readonly required: boolean;
}

export interface ReflectionRecord {
  readonly id: string;
  readonly goalId: string;
  readonly agentId?: string;
  readonly completion: string;
  readonly errors: readonly string[];
  readonly missedOpportunities: readonly string[];
  readonly efficiency: string;
  readonly knowledgeLearned: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly suggestedImprovements: readonly string[];
  readonly futureQuestions: readonly string[];
  readonly memoryUpdateIds: readonly string[];
}

export interface LearningRecord {
  readonly id: string;
  readonly goalId: string;
  readonly sourceReflectionIds: readonly string[];
  readonly sourceBenchmarkIds: readonly string[];
  readonly humanFeedbackIds: readonly string[];
  readonly memoryRecordIds: readonly string[];
  readonly approvedBy?: string;
  readonly confidence: number;
}

export interface RuntimeStatus {
  readonly runningAgentCount: number;
  readonly activeGoalCount: number;
  readonly executionTimeMs: number;
  readonly successRate: number;
  readonly failureCount: number;
  readonly estimatedCost: number;
  readonly memoryUsage: number;
  readonly toolInvocationCount: number;
  readonly workspaceActivityCount: number;
  readonly knowledgeProducedCount: number;
  readonly benchmarkScoreIds: readonly string[];
  readonly health: "healthy" | "degraded" | "critical" | "unknown";
}

export interface AgentOsEvent {
  readonly type:
    | "GoalCreated"
    | "GoalPlanned"
    | "AgentAssigned"
    | "ExecutionStarted"
    | "ExecutionCompleted"
    | "TaskDelegated"
    | "ReflectionCompleted"
    | "LearningUpdated"
    | "MemoryStored"
    | "FailureDetected"
    | "RecoveryStarted"
    | "BenchmarkCompleted"
    | "GoalArchived";
  readonly version: number;
  readonly occurredAt: string;
  readonly goalId?: string;
  readonly agentId?: string;
  readonly payload: unknown;
}

export interface AgentOsRepository {
  saveGoal(goal: AgentGoal): Promise<void>;
  getGoal(goalId: string): Promise<AgentGoal | undefined>;
  saveAgent(agent: AgentProfile): Promise<void>;
  getAgent(agentId: string): Promise<AgentProfile | undefined>;
  savePlan(plan: ExecutionPlan): Promise<void>;
  getPlan(goalId: string): Promise<ExecutionPlan | undefined>;
  saveMemory(record: MemoryRecord): Promise<void>;
  queryMemory(goalId: string): Promise<readonly MemoryRecord[]>;
  saveReflection(record: ReflectionRecord): Promise<void>;
  saveLearning(record: LearningRecord): Promise<void>;
  publishEvent(event: AgentOsEvent): Promise<void>;
}

export interface AgentOsRuntime {
  createGoal(goal: AgentGoal): Promise<void>;
  planGoal(goalId: string): Promise<ExecutionPlan>;
  assignAgent(assignment: AgentAssignment): Promise<void>;
  executeTask(taskId: string): Promise<void>;
  delegateTask(taskId: string, agentId: string): Promise<void>;
  pauseExecution(goalId: string): Promise<void>;
  resumeExecution(goalId: string): Promise<void>;
  cancelExecution(goalId: string): Promise<void>;
  attachMemory(record: MemoryRecord): Promise<void>;
  queryMemory(goalId: string): Promise<readonly MemoryRecord[]>;
  reflect(record: ReflectionRecord): Promise<void>;
  learn(record: LearningRecord): Promise<void>;
  benchmarkExecution(goalId: string): Promise<void>;
  getRuntimeStatus(): Promise<RuntimeStatus>;
}

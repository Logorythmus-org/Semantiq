export type WorkflowLifecycleState =
  | "draft"
  | "generated"
  | "reviewed"
  | "approved"
  | "executed"
  | "paused"
  | "resumed"
  | "completed"
  | "benchmarked"
  | "published"
  | "template"
  | "archived";

export type WorkflowNodeType =
  | "goal"
  | "question"
  | "agent"
  | "task"
  | "decision"
  | "condition"
  | "loop"
  | "parallel"
  | "merge"
  | "approval"
  | "tool"
  | "repository"
  | "workspace"
  | "knowledge-graph"
  | "semantiq"
  | "memory"
  | "notification"
  | "delay"
  | "custom";

export type WorkflowEdgeType =
  | "sequential"
  | "conditional"
  | "parallel"
  | "merge"
  | "exception"
  | "rollback"
  | "retry"
  | "event"
  | "data"
  | "knowledge";

export type WorkflowExecutionState =
  | "pending"
  | "running"
  | "waiting-for-approval"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "rolled-back";

export type WorkflowScheduleType =
  | "immediate"
  | "delayed"
  | "cron"
  | "event-based"
  | "manual"
  | "recurring"
  | "calendar-based"
  | "dependency-based"
  | "ai-generated";

export type DecisionOperator =
  | "if"
  | "else"
  | "match"
  | "switch"
  | "probability"
  | "confidence"
  | "benchmark-score"
  | "human-approval"
  | "semantic-rule"
  | "context-aware";

export type WorkflowTemplateCategory =
  | "research"
  | "programming"
  | "publication"
  | "question-refinement"
  | "benchmark"
  | "education"
  | "presentation"
  | "translation"
  | "repository-review"
  | "community-moderation"
  | "innovation-sprint"
  | "hackathon";

export type WorkflowToolKind =
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
  | "webgpu"
  | "cli";

export interface WorkflowGoalInput {
  readonly id: string;
  readonly version: number;
  readonly description: string;
  readonly requirements: readonly string[];
  readonly constraints: readonly string[];
  readonly resourceIds: readonly string[];
  readonly workspaceId: string;
  readonly ownerId: string;
  readonly assignedAgentIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly risks: readonly string[];
  readonly expectedOutcome: string;
  readonly reflectionIds: readonly string[];
  readonly contextIds: readonly string[];
}

export interface WorkflowVariable {
  readonly id: string;
  readonly name: string;
  readonly type: "string" | "number" | "boolean" | "json" | "artifact" | "secret" | "reference";
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly description: string;
}

export interface WorkflowNode {
  readonly id: string;
  readonly workflowId: string;
  readonly type: WorkflowNodeType;
  readonly name: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly validation: readonly string[];
  readonly executionStatus: WorkflowExecutionState;
  readonly logIds: readonly string[];
  readonly retryPolicy: {
    readonly maxAttempts: number;
    readonly backoffMs: number;
  };
  readonly permissionIds: readonly string[];
  readonly toolKind?: WorkflowToolKind;
  readonly decisionOperator?: DecisionOperator;
}

export interface WorkflowEdge {
  readonly id: string;
  readonly workflowId: string;
  readonly type: WorkflowEdgeType;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly condition?: string;
  readonly dataMapping: Readonly<Record<string, string>>;
  readonly knowledgeLinkIds: readonly string[];
}

export interface WorkflowApprovalCheckpoint {
  readonly id: string;
  readonly workflowId: string;
  readonly nodeId: string;
  readonly action:
    | "publish"
    | "delete"
    | "repository-merge"
    | "external-api"
    | "payments"
    | "sensitive-data"
    | "research-publication"
    | "wallet-action"
    | "organization-policy";
  readonly requiredApproverIds: readonly string[];
  readonly reason: string;
  readonly approved: boolean;
}

export interface WorkflowDefinition {
  readonly id: string;
  readonly version: number;
  readonly name: string;
  readonly description: string;
  readonly purpose: string;
  readonly ownerId: string;
  readonly workspaceId: string;
  readonly projectId?: string;
  readonly goalId: string;
  readonly state: WorkflowLifecycleState;
  readonly nodes: readonly WorkflowNode[];
  readonly edges: readonly WorkflowEdge[];
  readonly conditions: readonly string[];
  readonly variables: readonly WorkflowVariable[];
  readonly inputIds: readonly string[];
  readonly outputIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly toolKinds: readonly WorkflowToolKind[];
  readonly permissionIds: readonly string[];
  readonly eventIds: readonly string[];
  readonly executionHistoryIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly versionHistoryIds: readonly string[];
  readonly reflectionIds: readonly string[];
  readonly knowledgeLinkIds: readonly string[];
  readonly approvalCheckpoints: readonly WorkflowApprovalCheckpoint[];
  readonly generationExplanation?: string;
  readonly risks: readonly string[];
  readonly alternatives: readonly string[];
  readonly estimatedCost: number;
}

export interface WorkflowExecution {
  readonly id: string;
  readonly workflowId: string;
  readonly state: WorkflowExecutionState;
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly currentNodeIds: readonly string[];
  readonly checkpointIds: readonly string[];
  readonly memoryRecordIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly errorIds: readonly string[];
}

export interface WorkflowTemplate {
  readonly id: string;
  readonly workflowId: string;
  readonly category: WorkflowTemplateCategory;
  readonly name: string;
  readonly editable: true;
  readonly inputSchemaId: string;
  readonly outputSchemaId: string;
  readonly license: string;
  readonly authorId: string;
  readonly benchmarkIds: readonly string[];
  readonly approvalRequired: boolean;
}

export interface WorkflowMemoryRecord {
  readonly id: string;
  readonly workflowId: string;
  readonly executionId?: string;
  readonly type:
    | "input"
    | "output"
    | "intermediate-result"
    | "benchmark"
    | "error"
    | "agent-decision"
    | "tool-call"
    | "knowledge-produced"
    | "reflection"
    | "future-improvement";
  readonly content: string;
  readonly sourceIds: readonly string[];
  readonly confidence: number;
  readonly version: number;
}

export interface WorkflowSchedule {
  readonly id: string;
  readonly workflowId: string;
  readonly type: WorkflowScheduleType;
  readonly expression: string;
  readonly timezone: string;
  readonly enabled: boolean;
  readonly explanation: string;
  readonly approvalRequired: boolean;
}

export interface WorkflowSimulationReport {
  readonly id: string;
  readonly workflowId: string;
  readonly expectedPathNodeIds: readonly string[];
  readonly blockedNodeIds: readonly string[];
  readonly missingPermissionIds: readonly string[];
  readonly estimatedCost: number;
  readonly risks: readonly string[];
  readonly approvalCheckpointIds: readonly string[];
  readonly benchmarkCriteria: readonly string[];
  readonly graphWriteTargets: readonly string[];
}

export interface WorkflowOptimizationReport {
  readonly id: string;
  readonly workflowId: string;
  readonly executionTimeFindings: readonly string[];
  readonly agentUsageFindings: readonly string[];
  readonly failureFindings: readonly string[];
  readonly costFindings: readonly string[];
  readonly parallelizationSuggestions: readonly string[];
  readonly knowledgeDensityFindings: readonly string[];
  readonly benchmarkHistoryFindings: readonly string[];
  readonly recommendations: readonly string[];
}

export interface WorkflowEngineRepository {
  saveWorkflow(workflow: WorkflowDefinition): Promise<void>;
  getWorkflow(workflowId: string): Promise<WorkflowDefinition | undefined>;
  saveExecution(execution: WorkflowExecution): Promise<void>;
  getExecution(executionId: string): Promise<WorkflowExecution | undefined>;
  saveTemplate(template: WorkflowTemplate): Promise<void>;
  saveMemory(record: WorkflowMemoryRecord): Promise<void>;
  listMemory(workflowId: string): Promise<readonly WorkflowMemoryRecord[]>;
  publishEvent(event: WorkflowEngineEvent): Promise<void>;
}

export interface WorkflowEngineService {
  createWorkflow(workflow: WorkflowDefinition): Promise<void>;
  generateWorkflow(goal: WorkflowGoalInput): Promise<WorkflowDefinition>;
  executeWorkflow(workflowId: string): Promise<WorkflowExecution>;
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  cancelWorkflow(executionId: string): Promise<void>;
  validateWorkflow(workflowId: string): Promise<readonly string[]>;
  benchmarkWorkflow(workflowId: string): Promise<void>;
  publishWorkflow(workflowId: string): Promise<WorkflowTemplate>;
  cloneWorkflow(workflowId: string, cloneId: string): Promise<WorkflowDefinition>;
  exportWorkflow(workflowId: string): Promise<string>;
  simulateWorkflow(workflowId: string): Promise<WorkflowSimulationReport>;
  optimizeWorkflow(workflowId: string): Promise<WorkflowOptimizationReport>;
}

export interface WorkflowEngineEvent {
  readonly type:
    | "WorkflowCreated"
    | "WorkflowValidated"
    | "WorkflowGenerated"
    | "WorkflowStarted"
    | "WorkflowPaused"
    | "WorkflowResumed"
    | "WorkflowCompleted"
    | "WorkflowFailed"
    | "WorkflowOptimized"
    | "WorkflowPublished"
    | "WorkflowBenchmarked"
    | "TemplateCreated";
  readonly version: number;
  readonly occurredAt: string;
  readonly workflowId?: string;
  readonly executionId?: string;
  readonly payload: unknown;
}

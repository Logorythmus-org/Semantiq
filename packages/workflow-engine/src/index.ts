export type * from "./contracts.js";

import type {
  WorkflowGoalInput,
  WorkflowDefinition,
  WorkflowEdge,
  WorkflowEngineEvent,
  WorkflowEngineRepository,
  WorkflowEngineService,
  WorkflowExecution,
  WorkflowMemoryRecord,
  WorkflowNode,
  WorkflowOptimizationReport,
  WorkflowSimulationReport,
  WorkflowTemplate
} from "./contracts.js";

export class LocalWorkflowEngineRepository implements WorkflowEngineRepository {
  private readonly workflows = new Map<string, WorkflowDefinition>();
  private readonly executions = new Map<string, WorkflowExecution>();
  private readonly templates = new Map<string, WorkflowTemplate>();
  private readonly memory: WorkflowMemoryRecord[] = [];
  private readonly events: WorkflowEngineEvent[] = [];

  async saveWorkflow(workflow: WorkflowDefinition): Promise<void> {
    this.workflows.set(workflow.id, workflow);
  }

  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | undefined> {
    return this.workflows.get(workflowId);
  }

  async saveExecution(execution: WorkflowExecution): Promise<void> {
    this.executions.set(execution.id, execution);
  }

  async getExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    return this.executions.get(executionId);
  }

  async saveTemplate(template: WorkflowTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async saveMemory(record: WorkflowMemoryRecord): Promise<void> {
    this.memory.push(Object.freeze(record));
  }

  async listMemory(workflowId: string): Promise<readonly WorkflowMemoryRecord[]> {
    return this.memory.filter((record) => record.workflowId === workflowId);
  }

  async publishEvent(event: WorkflowEngineEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listEvents(): readonly WorkflowEngineEvent[] {
    return this.events;
  }
}

export class LocalWorkflowEngineService implements WorkflowEngineService {
  constructor(private readonly repository: LocalWorkflowEngineRepository = new LocalWorkflowEngineRepository()) {}

  async createWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const errors = validateDefinition(workflow);
    if (errors.length > 0) {
      throw new Error(`Workflow validation failed: ${errors.join("; ")}`);
    }
    await this.repository.saveWorkflow(workflow);
    await this.emit("WorkflowCreated", { version: workflow.version }, workflow.id);
  }

  async generateWorkflow(goal: WorkflowGoalInput): Promise<WorkflowDefinition> {
    const workflowId = `${goal.id}:workflow:${goal.version}`;
    const goalNode = createNode(workflowId, "goal", "Goal", 0, goal.description);
    const taskNodes = goal.requirements.map((requirement, index) =>
      createNode(workflowId, requiresApproval(requirement) ? "approval" : "task", requirement, index + 1, requirement)
    );
    const semantiqNode = createNode(workflowId, "semantiq", "Benchmark Workflow", taskNodes.length + 1, "Benchmark output quality");
    const memoryNode = createNode(workflowId, "memory", "Store Workflow Memory", taskNodes.length + 2, "Persist reusable learning");
    const nodes = [goalNode, ...taskNodes, semantiqNode, memoryNode];
    const edges = createSequentialEdges(workflowId, nodes);
    const workflow: WorkflowDefinition = {
      id: workflowId,
      version: 1,
      name: `Workflow for ${goal.id}`,
      description: goal.description,
      purpose: goal.expectedOutcome,
      ownerId: goal.ownerId,
      workspaceId: goal.workspaceId,
      goalId: goal.id,
      state: "generated",
      nodes,
      edges,
      conditions: goal.constraints,
      variables: [],
      inputIds: goal.resourceIds,
      outputIds: [],
      agentIds: goal.assignedAgentIds,
      toolKinds: [],
      permissionIds: [],
      eventIds: [],
      executionHistoryIds: [],
      benchmarkIds: goal.benchmarkIds,
      versionHistoryIds: [],
      reflectionIds: goal.reflectionIds,
      knowledgeLinkIds: goal.contextIds,
      approvalCheckpoints: taskNodes
        .filter((node) => node.type === "approval")
        .map((node) => ({
          id: `${node.id}:approval`,
          workflowId,
          nodeId: node.id,
          action: "organization-policy",
          requiredApproverIds: [goal.ownerId],
          reason: "Generated workflow contains a critical action requirement",
          approved: false
        })),
      generationExplanation: "Generated from goal requirements with Semantiq benchmarking and workflow memory nodes.",
      risks: goal.risks,
      alternatives: ["manual execution", "single-agent execution", "template-based workflow"],
      estimatedCost: 0
    };
    await this.repository.saveWorkflow(workflow);
    await this.emit("WorkflowGenerated", { goalId: goal.id, nodeCount: workflow.nodes.length }, workflow.id);
    return workflow;
  }

  async executeWorkflow(workflowId: string): Promise<WorkflowExecution> {
    const workflow = await this.requireWorkflow(workflowId);
    const errors = validateDefinition(workflow);
    if (errors.length > 0) {
      await this.emit("WorkflowFailed", { errors }, workflow.id);
      throw new Error(`Workflow validation failed: ${errors.join("; ")}`);
    }
    const blockedApproval = workflow.approvalCheckpoints.find((checkpoint) => !checkpoint.approved);
    if (blockedApproval) {
      return this.createExecution(workflow, "waiting-for-approval", [blockedApproval.nodeId]);
    }
    return this.createExecution(workflow, "completed", []);
  }

  async pauseWorkflow(executionId: string): Promise<void> {
    await this.requireExecution(executionId);
    await this.emit("WorkflowPaused", { executionId }, undefined, executionId);
  }

  async resumeWorkflow(executionId: string): Promise<void> {
    await this.requireExecution(executionId);
    await this.emit("WorkflowResumed", { executionId }, undefined, executionId);
  }

  async cancelWorkflow(executionId: string): Promise<void> {
    await this.requireExecution(executionId);
    await this.emit("WorkflowFailed", { executionId, state: "cancelled" }, undefined, executionId);
  }

  async validateWorkflow(workflowId: string): Promise<readonly string[]> {
    const workflow = await this.requireWorkflow(workflowId);
    const errors = validateDefinition(workflow);
    await this.emit("WorkflowValidated", { errors }, workflow.id);
    return errors;
  }

  async benchmarkWorkflow(workflowId: string): Promise<void> {
    await this.requireWorkflow(workflowId);
    await this.emit("WorkflowBenchmarked", { semantiq: "pending-adapter" }, workflowId);
  }

  async publishWorkflow(workflowId: string): Promise<WorkflowTemplate> {
    const workflow = await this.requireWorkflow(workflowId);
    if (workflow.approvalCheckpoints.some((checkpoint) => !checkpoint.approved)) {
      throw new Error(`Workflow has unresolved approval checkpoints: ${workflowId}`);
    }
    const template: WorkflowTemplate = {
      id: `${workflow.id}:template:${workflow.version}`,
      workflowId: workflow.id,
      category: "research",
      name: workflow.name,
      editable: true,
      inputSchemaId: `${workflow.id}:inputs`,
      outputSchemaId: `${workflow.id}:outputs`,
      license: "UNSPECIFIED",
      authorId: workflow.ownerId,
      benchmarkIds: workflow.benchmarkIds,
      approvalRequired: true
    };
    await this.repository.saveTemplate(template);
    await this.emit("WorkflowPublished", { templateId: template.id }, workflow.id);
    await this.emit("TemplateCreated", { templateId: template.id }, workflow.id);
    return template;
  }

  async cloneWorkflow(workflowId: string, cloneId: string): Promise<WorkflowDefinition> {
    const workflow = await this.requireWorkflow(workflowId);
    const clone: WorkflowDefinition = {
      ...workflow,
      id: cloneId,
      version: 1,
      state: "draft",
      nodes: workflow.nodes.map((node) => ({ ...node, workflowId: cloneId })),
      edges: workflow.edges.map((edge) => ({ ...edge, workflowId: cloneId })),
      approvalCheckpoints: workflow.approvalCheckpoints.map((checkpoint) => ({ ...checkpoint, workflowId: cloneId }))
    };
    await this.repository.saveWorkflow(clone);
    return clone;
  }

  async exportWorkflow(workflowId: string): Promise<string> {
    const workflow = await this.requireWorkflow(workflowId);
    return JSON.stringify(workflow, null, 2);
  }

  async simulateWorkflow(workflowId: string): Promise<WorkflowSimulationReport> {
    const workflow = await this.requireWorkflow(workflowId);
    const errors = validateDefinition(workflow);
    return {
      id: `${workflow.id}:simulation:${workflow.version}`,
      workflowId: workflow.id,
      expectedPathNodeIds: workflow.nodes.map((node) => node.id),
      blockedNodeIds: errors.length > 0 ? workflow.nodes.map((node) => node.id) : [],
      missingPermissionIds: [],
      estimatedCost: workflow.estimatedCost,
      risks: workflow.risks,
      approvalCheckpointIds: workflow.approvalCheckpoints.map((checkpoint) => checkpoint.id),
      benchmarkCriteria: ["workflow-quality", "execution-quality", "planning-quality", "reasoning-quality", "reusable-value"],
      graphWriteTargets: ["workflow", "goal", "execution", "agent", "repository", "project", "question", "benchmark", "reflection"]
    };
  }

  async optimizeWorkflow(workflowId: string): Promise<WorkflowOptimizationReport> {
    const workflow = await this.requireWorkflow(workflowId);
    const report: WorkflowOptimizationReport = {
      id: `${workflow.id}:optimization:${workflow.version}`,
      workflowId: workflow.id,
      executionTimeFindings: [],
      agentUsageFindings: workflow.agentIds.length === 0 ? ["No agents assigned"] : [],
      failureFindings: [],
      costFindings: workflow.estimatedCost === 0 ? ["Cost adapter is not connected"] : [],
      parallelizationSuggestions: workflow.nodes.length > 3 ? ["Inspect independent task nodes for parallel execution"] : [],
      knowledgeDensityFindings: workflow.knowledgeLinkIds.length === 0 ? ["No knowledge links attached"] : [],
      benchmarkHistoryFindings: workflow.benchmarkIds.length === 0 ? ["No benchmark history attached"] : [],
      recommendations: ["Run simulation before execution", "Benchmark completed executions", "Store workflow memory for reuse"]
    };
    await this.emit("WorkflowOptimized", { reportId: report.id }, workflow.id);
    return report;
  }

  async storeMemory(record: WorkflowMemoryRecord): Promise<void> {
    await this.repository.saveMemory(record);
  }

  async listMemory(workflowId: string): Promise<readonly WorkflowMemoryRecord[]> {
    return this.repository.listMemory(workflowId);
  }

  private async createExecution(
    workflow: WorkflowDefinition,
    state: WorkflowExecution["state"],
    currentNodeIds: readonly string[]
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `${workflow.id}:execution:${Date.now()}`,
      workflowId: workflow.id,
      state,
      startedAt: new Date().toISOString(),
      currentNodeIds,
      checkpointIds: workflow.approvalCheckpoints.map((checkpoint) => checkpoint.id),
      memoryRecordIds: [],
      benchmarkIds: workflow.benchmarkIds,
      errorIds: []
    };
    await this.repository.saveExecution(execution);
    await this.emit("WorkflowStarted", { state }, workflow.id, execution.id);
    if (state === "completed") {
      await this.emit("WorkflowCompleted", { executionId: execution.id }, workflow.id, execution.id);
    }
    return execution;
  }

  private async requireWorkflow(workflowId: string): Promise<WorkflowDefinition> {
    const workflow = await this.repository.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }
    return workflow;
  }

  private async requireExecution(executionId: string): Promise<WorkflowExecution> {
    const execution = await this.repository.getExecution(executionId);
    if (!execution) {
      throw new Error(`Workflow execution not found: ${executionId}`);
    }
    return execution;
  }

  private async emit(
    type: WorkflowEngineEvent["type"],
    payload: unknown,
    workflowId?: string,
    executionId?: string
  ): Promise<void> {
    const event: WorkflowEngineEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withWorkflow = workflowId ? { ...event, workflowId } : event;
    const withExecution = executionId ? { ...withWorkflow, executionId } : withWorkflow;
    await this.repository.publishEvent(withExecution);
  }
}

function createNode(
  workflowId: string,
  type: WorkflowNode["type"],
  name: string,
  index: number,
  description: string
): WorkflowNode {
  return {
    id: `${workflowId}:node:${index}`,
    workflowId,
    type,
    name,
    inputs: index === 0 ? [] : [`input:${index}`],
    outputs: [`output:${index}`],
    configuration: { description },
    validation: ["node-has-name", "node-has-type"],
    executionStatus: "pending",
    logIds: [],
    retryPolicy: {
      maxAttempts: 3,
      backoffMs: 1000
    },
    permissionIds: []
  };
}

function createSequentialEdges(workflowId: string, nodes: readonly WorkflowNode[]): readonly WorkflowEdge[] {
  return nodes.slice(1).map((node, index) => ({
    id: `${workflowId}:edge:${index}`,
    workflowId,
    type: "sequential",
    fromNodeId: nodes[index]?.id ?? node.id,
    toNodeId: node.id,
    dataMapping: {},
    knowledgeLinkIds: []
  }));
}

function validateDefinition(workflow: WorkflowDefinition): readonly string[] {
  const errors: string[] = [];
  if (workflow.nodes.length === 0) {
    errors.push("Workflow requires at least one node");
  }
  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.fromNodeId)) {
      errors.push(`Edge references missing source node: ${edge.id}`);
    }
    if (!nodeIds.has(edge.toNodeId)) {
      errors.push(`Edge references missing target node: ${edge.id}`);
    }
  }
  for (const checkpoint of workflow.approvalCheckpoints) {
    if (!nodeIds.has(checkpoint.nodeId)) {
      errors.push(`Approval checkpoint references missing node: ${checkpoint.id}`);
    }
  }
  return errors;
}

function requiresApproval(text: string): boolean {
  const normalized = text.toLowerCase();
  return [
    "publish",
    "delete",
    "repository merge",
    "external api",
    "payment",
    "sensitive data",
    "research publication",
    "wallet",
    "organization policy"
  ].some((phrase) => normalized.includes(phrase));
}

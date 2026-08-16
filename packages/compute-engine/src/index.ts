export type * from "./contracts.js";

import type {
  ComputeCheckpoint,
  ComputeEngineEvent,
  ComputeEngineRepository,
  ComputeEngineService,
  ComputeResource,
  ComputeRuntimeStatus,
  ComputeTask,
  ModelRoutingDecision,
  ResourceBenchmark,
  SchedulerDecision,
  WebGPUExecutionRequest
} from "./contracts.js";

export class LocalComputeEngineRepository implements ComputeEngineRepository {
  private readonly resources = new Map<string, ComputeResource>();
  private readonly tasks = new Map<string, ComputeTask>();
  private readonly checkpoints = new Map<string, ComputeCheckpoint>();
  private readonly benchmarks: ResourceBenchmark[] = [];
  private readonly events: ComputeEngineEvent[] = [];

  async saveResource(resource: ComputeResource): Promise<void> {
    this.resources.set(resource.id, resource);
  }

  async getResource(resourceId: string): Promise<ComputeResource | undefined> {
    return this.resources.get(resourceId);
  }

  async listResources(): Promise<readonly ComputeResource[]> {
    return [...this.resources.values()];
  }

  async saveTask(task: ComputeTask): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async getTask(taskId: string): Promise<ComputeTask | undefined> {
    return this.tasks.get(taskId);
  }

  async saveCheckpoint(checkpoint: ComputeCheckpoint): Promise<void> {
    this.checkpoints.set(checkpoint.id, checkpoint);
  }

  async getCheckpoint(checkpointId: string): Promise<ComputeCheckpoint | undefined> {
    return this.checkpoints.get(checkpointId);
  }

  async saveBenchmark(benchmark: ResourceBenchmark): Promise<void> {
    this.benchmarks.push(Object.freeze(benchmark));
  }

  async publishEvent(event: ComputeEngineEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listEvents(): readonly ComputeEngineEvent[] {
    return this.events;
  }
}

export class LocalComputeEngineService implements ComputeEngineService {
  constructor(private readonly repository: LocalComputeEngineRepository = new LocalComputeEngineRepository()) {}

  async registerResource(resource: ComputeResource): Promise<void> {
    await this.repository.saveResource(resource);
    await this.emit("ResourceRegistered", { type: resource.type, capabilities: resource.capabilities.length }, resource.id);
    if (resource.availability === "available") {
      await this.emit("ResourceAvailable", { health: resource.health }, resource.id);
    }
  }

  async discoverResources(): Promise<readonly ComputeResource[]> {
    return this.repository.listResources();
  }

  async scheduleTask(task: ComputeTask): Promise<SchedulerDecision> {
    await this.repository.saveTask(task);
    const resources = await this.repository.listResources();
    const candidates = resources.filter((resource) => matches(task, resource));
    const selected = chooseResource(candidates);
    if (!selected) {
      throw new Error(`No compatible compute resource found for task: ${task.id}`);
    }
    const decision: SchedulerDecision = {
      id: `${task.id}:schedule`,
      taskId: task.id,
      selectedResourceId: selected.id,
      candidateResourceIds: candidates.map((resource) => resource.id),
      rejectedResourceIds: resources.filter((resource) => !candidates.includes(resource)).map((resource) => resource.id),
      explanation: explainDecision(task, selected),
      estimatedCost: selected.estimatedCost + task.estimatedCost,
      confidence: selected.reliability,
      riskIds: selected.health === "healthy" ? [] : [`${selected.id}:health-risk`],
      benchmarkIds: selected.benchmarkHistoryIds
    };
    await this.emit("TaskScheduled", { decision }, selected.id, task.id);
    return decision;
  }

  async executeTask(taskId: string): Promise<void> {
    const task = await this.requireTask(taskId);
    await this.emit("TaskStarted", { state: task.state }, undefined, task.id);
    await this.emit("TaskCompleted", { knowledgeLinkIds: task.knowledgeLinkIds }, undefined, task.id);
  }

  async pauseTask(taskId: string): Promise<void> {
    await this.requireTask(taskId);
    await this.emit("ExecutionArchived", { state: "paused" }, undefined, taskId);
  }

  async resumeTask(taskId: string): Promise<void> {
    await this.requireTask(taskId);
    await this.emit("RuntimeScaled", { state: "resumed" }, undefined, taskId);
  }

  async cancelTask(taskId: string): Promise<void> {
    await this.requireTask(taskId);
    await this.emit("ExecutionArchived", { state: "cancelled" }, undefined, taskId);
  }

  async checkpoint(taskId: string): Promise<ComputeCheckpoint> {
    const task = await this.requireTask(taskId);
    const checkpoint: ComputeCheckpoint = {
      id: `${task.id}:checkpoint:${Date.now()}`,
      taskId: task.id,
      resourceId: "unassigned",
      state: "checkpointed",
      inputIds: task.inputIds,
      outputIds: task.outputIds,
      partialResultIds: [],
      logIds: task.logIds,
      benchmarkIds: task.benchmarkIds,
      memoryMb: task.requirements.minMemoryMb,
      retryCount: 0,
      restoreInstructions: ["reload-inputs", "restore-partial-results", "reschedule-compatible-resource"],
      version: 1
    };
    await this.repository.saveCheckpoint(checkpoint);
    await this.emit("CheckpointCreated", { checkpointId: checkpoint.id }, undefined, task.id);
    return checkpoint;
  }

  async restoreCheckpoint(checkpointId: string): Promise<void> {
    const checkpoint = await this.repository.getCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }
    await this.emit("CheckpointRestored", { checkpointId }, checkpoint.resourceId, checkpoint.taskId);
  }

  async routeModel(taskId: string): Promise<ModelRoutingDecision> {
    const task = await this.requireTask(taskId);
    const selectedTarget = task.requirements.offlineRequired ? "local" : "edge";
    return {
      id: `${task.id}:model-route`,
      taskId: task.id,
      selectedTarget,
      selectedModelId: `${selectedTarget}:default`,
      alternativeModelIds: ["local:small", "edge:balanced", "cloud:capable"],
      explanation: selectedTarget === "local" ? "Offline policy requires local execution" : "Edge model balances latency, privacy, and availability",
      latencyMs: task.requirements.maxLatencyMs ?? 1000,
      privacyImpact: selectedTarget === "local" ? "local-only" : "redacted-remote",
      estimatedCost: selectedTarget === "local" ? 0 : task.estimatedCost,
      confidence: 0.75,
      fallbackModelIds: ["local:small"]
    };
  }

  async runWebGPU(request: WebGPUExecutionRequest): Promise<void> {
    const resources = await this.repository.listResources();
    const webgpu = resources.find((resource) => resource.type === "webgpu" && resource.availability === "available");
    if (!webgpu && request.fallbackResourceTypes.length === 0) {
      throw new Error(`WebGPU unavailable and no fallback declared: ${request.id}`);
    }
    await this.emit("TaskStarted", { requestId: request.id, fallback: !webgpu }, webgpu?.id, request.taskId);
    await this.emit("TaskCompleted", { workload: request.workload }, webgpu?.id, request.taskId);
  }

  async benchmarkResource(resourceId: string): Promise<ResourceBenchmark> {
    const resource = await this.requireResource(resourceId);
    const benchmark: ResourceBenchmark = {
      id: `${resource.id}:benchmark:${Date.now()}`,
      resourceId: resource.id,
      taskType: "generic",
      cpuUsage: resource.type === "cpu" ? 1 : 0,
      gpuUsage: resource.type === "gpu" ? 1 : 0,
      webgpuUsage: resource.type === "webgpu" ? 1 : 0,
      memoryMb: resource.memoryMb,
      latencyMs: resource.latencyMs,
      energyEstimate: resource.powerProfile === "performance" ? 1 : 0.5,
      throughput: resource.performanceScore,
      successRate: resource.reliability,
      queueLength: 0,
      schedulingEfficiency: resource.availability === "available" ? 1 : 0,
      knowledgeProduced: 0
    };
    await this.repository.saveBenchmark(benchmark);
    await this.emit("ResourceBenchmarked", { benchmarkId: benchmark.id }, resource.id);
    return benchmark;
  }

  async monitorRuntime(): Promise<ComputeRuntimeStatus> {
    const resources = await this.repository.listResources();
    return {
      resourceCount: resources.length,
      availableResourceCount: resources.filter((resource) => resource.availability === "available").length,
      runningTaskCount: 0,
      queuedTaskCount: 0,
      failedTaskCount: 0,
      cpuUsage: resources.some((resource) => resource.type === "cpu") ? 0 : 0,
      gpuUsage: resources.some((resource) => resource.type === "gpu") ? 0 : 0,
      webgpuUsage: resources.some((resource) => resource.type === "webgpu") ? 0 : 0,
      memoryMb: resources.reduce((total, resource) => total + resource.memoryMb, 0),
      queueLength: 0,
      health: resources.every((resource) => resource.health === "healthy") ? "healthy" : "degraded"
    };
  }

  private async requireTask(taskId: string): Promise<ComputeTask> {
    const task = await this.repository.getTask(taskId);
    if (!task) {
      throw new Error(`Compute task not found: ${taskId}`);
    }
    return task;
  }

  private async requireResource(resourceId: string): Promise<ComputeResource> {
    const resource = await this.repository.getResource(resourceId);
    if (!resource) {
      throw new Error(`Compute resource not found: ${resourceId}`);
    }
    return resource;
  }

  private async emit(
    type: ComputeEngineEvent["type"],
    payload: unknown,
    resourceId?: string,
    taskId?: string
  ): Promise<void> {
    const event: ComputeEngineEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withResource = resourceId ? { ...event, resourceId } : event;
    const withTask = taskId ? { ...withResource, taskId } : withResource;
    await this.repository.publishEvent(withTask);
  }
}

function matches(task: ComputeTask, resource: ComputeResource): boolean {
  if (resource.availability !== "available") {
    return false;
  }
  if (task.requirements.resourceTypes.length > 0 && !task.requirements.resourceTypes.includes(resource.type)) {
    return false;
  }
  if (task.requirements.minMemoryMb > resource.memoryMb) {
    return false;
  }
  if (task.requirements.maxLatencyMs !== undefined && resource.latencyMs > task.requirements.maxLatencyMs) {
    return false;
  }
  if (task.requirements.offlineRequired && !resource.capabilities.some((capability) => capability.supportsOffline)) {
    return false;
  }
  return task.requirements.capabilityNames.every((name) =>
    resource.capabilities.some((capability) => capability.name === name)
  );
}

function chooseResource(resources: readonly ComputeResource[]): ComputeResource | undefined {
  return [...resources].sort((left, right) => {
    const leftScore = left.performanceScore * left.reliability - left.latencyMs / 1000 - left.estimatedCost;
    const rightScore = right.performanceScore * right.reliability - right.latencyMs / 1000 - right.estimatedCost;
    return rightScore - leftScore;
  })[0];
}

function explainDecision(task: ComputeTask, resource: ComputeResource): string {
  return `Selected ${resource.id} for ${task.id} because it satisfies capabilities, memory, latency, offline policy, and has reliability ${resource.reliability}.`;
}

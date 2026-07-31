export type ComputeResourceType =
  | "cpu"
  | "gpu"
  | "webgpu"
  | "browser-worker"
  | "node-worker"
  | "docker-worker"
  | "python-worker"
  | "inference-worker"
  | "storage-worker"
  | "graph-worker"
  | "search-worker"
  | "benchmark-worker"
  | "rendering-worker"
  | "simulation-worker"
  | "custom-worker";

export type ComputeExecutionStrategy =
  | "sequential"
  | "parallel"
  | "pipeline"
  | "map"
  | "reduce"
  | "scatter"
  | "gather"
  | "graph-execution"
  | "recursive"
  | "adaptive"
  | "checkpoint-recovery";

export type ComputeTaskPriority = "low" | "normal" | "high" | "critical";

export type ComputeTaskState =
  | "queued"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "checkpointed"
  | "restored";

export type ComputeQueueType =
  | "immediate"
  | "background"
  | "scheduled"
  | "priority"
  | "retry"
  | "long-running"
  | "streaming"
  | "distributed"
  | "ai"
  | "benchmark"
  | "graph";

export type ModelRouteTarget = "local" | "edge" | "cloud";

export interface ComputeCapability {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly strategyIds: readonly ComputeExecutionStrategy[];
  readonly maxConcurrency: number;
  readonly memoryLimitMb: number;
  readonly supportsOffline: boolean;
}

export interface ComputeResource {
  readonly id: string;
  readonly type: ComputeResourceType;
  readonly capabilities: readonly ComputeCapability[];
  readonly hardware: string;
  readonly software: string;
  readonly performanceScore: number;
  readonly availability: "available" | "busy" | "offline" | "degraded";
  readonly permissionIds: readonly string[];
  readonly powerProfile: "battery" | "balanced" | "performance" | "plugged-in" | "unknown";
  readonly estimatedCost: number;
  readonly temperatureCelsius?: number;
  readonly memoryMb: number;
  readonly latencyMs: number;
  readonly reliability: number;
  readonly benchmarkHistoryIds: readonly string[];
  readonly health: "healthy" | "degraded" | "unavailable" | "unknown";
  readonly runtimeStatus: "idle" | "running" | "paused" | "draining" | "offline";
}

export interface ResourceRequirement {
  readonly capabilityNames: readonly string[];
  readonly resourceTypes: readonly ComputeResourceType[];
  readonly minMemoryMb: number;
  readonly maxLatencyMs?: number;
  readonly offlineRequired: boolean;
  readonly gpuRequired: boolean;
  readonly webgpuPreferred: boolean;
  readonly permissionIds: readonly string[];
}

export interface ComputeTask {
  readonly id: string;
  readonly goalId?: string;
  readonly workflowId?: string;
  readonly priority: ComputeTaskPriority;
  readonly inputIds: readonly string[];
  readonly outputIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly estimatedCost: number;
  readonly requirements: ResourceRequirement;
  readonly permissionIds: readonly string[];
  readonly retryPolicy: {
    readonly maxAttempts: number;
    readonly backoffMs: number;
  };
  readonly checkpointId?: string;
  readonly logIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly knowledgeLinkIds: readonly string[];
  readonly state: ComputeTaskState;
}

export interface SchedulerDecision {
  readonly id: string;
  readonly taskId: string;
  readonly selectedResourceId: string;
  readonly candidateResourceIds: readonly string[];
  readonly rejectedResourceIds: readonly string[];
  readonly explanation: string;
  readonly estimatedCost: number;
  readonly confidence: number;
  readonly riskIds: readonly string[];
  readonly benchmarkIds: readonly string[];
}

export interface TaskQueue {
  readonly id: string;
  readonly type: ComputeQueueType;
  readonly taskIds: readonly string[];
  readonly maxConcurrency: number;
  readonly paused: boolean;
  readonly backpressure: "none" | "moderate" | "high" | "critical";
}

export interface ComputeCheckpoint {
  readonly id: string;
  readonly taskId: string;
  readonly resourceId: string;
  readonly state: ComputeTaskState;
  readonly inputIds: readonly string[];
  readonly outputIds: readonly string[];
  readonly partialResultIds: readonly string[];
  readonly logIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly memoryMb: number;
  readonly retryCount: number;
  readonly restoreInstructions: readonly string[];
  readonly version: number;
}

export interface ModelRoutingDecision {
  readonly id: string;
  readonly taskId: string;
  readonly selectedTarget: ModelRouteTarget;
  readonly selectedModelId: string;
  readonly alternativeModelIds: readonly string[];
  readonly explanation: string;
  readonly latencyMs: number;
  readonly privacyImpact: "local-only" | "redacted-remote" | "remote-allowed";
  readonly estimatedCost: number;
  readonly confidence: number;
  readonly fallbackModelIds: readonly string[];
}

export interface WebGPUExecutionRequest {
  readonly id: string;
  readonly taskId: string;
  readonly workload:
    | "parallel-compute"
    | "matrix-operations"
    | "graph-processing"
    | "simulation"
    | "embeddings"
    | "visualization"
    | "rendering"
    | "scientific-computing"
    | "ai-preprocessing"
    | "knowledge-graph-layout"
    | "future-ai-acceleration";
  readonly memoryLimitMb: number;
  readonly timeoutMs: number;
  readonly fallbackResourceTypes: readonly ComputeResourceType[];
  readonly benchmarkCriteria: readonly string[];
}

export interface ResourceBenchmark {
  readonly id: string;
  readonly resourceId: string;
  readonly taskType: string;
  readonly cpuUsage: number;
  readonly gpuUsage: number;
  readonly webgpuUsage: number;
  readonly memoryMb: number;
  readonly latencyMs: number;
  readonly energyEstimate: number;
  readonly throughput: number;
  readonly successRate: number;
  readonly queueLength: number;
  readonly schedulingEfficiency: number;
  readonly knowledgeProduced: number;
}

export interface ComputeRuntimeStatus {
  readonly resourceCount: number;
  readonly availableResourceCount: number;
  readonly runningTaskCount: number;
  readonly queuedTaskCount: number;
  readonly failedTaskCount: number;
  readonly cpuUsage: number;
  readonly gpuUsage: number;
  readonly webgpuUsage: number;
  readonly memoryMb: number;
  readonly queueLength: number;
  readonly health: "healthy" | "degraded" | "critical" | "unknown";
}

export interface ComputeEngineRepository {
  saveResource(resource: ComputeResource): Promise<void>;
  getResource(resourceId: string): Promise<ComputeResource | undefined>;
  listResources(): Promise<readonly ComputeResource[]>;
  saveTask(task: ComputeTask): Promise<void>;
  getTask(taskId: string): Promise<ComputeTask | undefined>;
  saveCheckpoint(checkpoint: ComputeCheckpoint): Promise<void>;
  getCheckpoint(checkpointId: string): Promise<ComputeCheckpoint | undefined>;
  saveBenchmark(benchmark: ResourceBenchmark): Promise<void>;
  publishEvent(event: ComputeEngineEvent): Promise<void>;
}

export interface ComputeEngineService {
  registerResource(resource: ComputeResource): Promise<void>;
  discoverResources(): Promise<readonly ComputeResource[]>;
  scheduleTask(task: ComputeTask): Promise<SchedulerDecision>;
  executeTask(taskId: string): Promise<void>;
  pauseTask(taskId: string): Promise<void>;
  resumeTask(taskId: string): Promise<void>;
  cancelTask(taskId: string): Promise<void>;
  checkpoint(taskId: string): Promise<ComputeCheckpoint>;
  restoreCheckpoint(checkpointId: string): Promise<void>;
  routeModel(taskId: string): Promise<ModelRoutingDecision>;
  runWebGPU(request: WebGPUExecutionRequest): Promise<void>;
  benchmarkResource(resourceId: string): Promise<ResourceBenchmark>;
  monitorRuntime(): Promise<ComputeRuntimeStatus>;
}

export interface ComputeEngineEvent {
  readonly type:
    | "ResourceRegistered"
    | "ResourceAvailable"
    | "TaskScheduled"
    | "TaskStarted"
    | "TaskCompleted"
    | "TaskFailed"
    | "CheckpointCreated"
    | "CheckpointRestored"
    | "SchedulerOptimized"
    | "ResourceBenchmarked"
    | "RuntimeScaled"
    | "ExecutionArchived";
  readonly version: number;
  readonly occurredAt: string;
  readonly resourceId?: string;
  readonly taskId?: string;
  readonly payload: unknown;
}

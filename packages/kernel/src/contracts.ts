import type { Command, DomainEvent, Query } from "@tech-club/core";

export type ServiceLifecycle = "singleton" | "scoped" | "transient" | "lazy" | "factory";
export type ServiceVisibility = "public" | "internal" | "extension";
export type LifecycleState =
  | "installed"
  | "initialized"
  | "configured"
  | "started"
  | "paused"
  | "stopped"
  | "unloaded"
  | "shutdown"
  | "unhealthy";

export interface RuntimeContext {
  readonly actorId?: string;
  readonly sessionId?: string;
  readonly workspaceId?: string;
  readonly projectId?: string;
  readonly correlationId: string;
  readonly capabilities: readonly string[];
}

export interface HealthReport {
  readonly id: string;
  readonly status: "healthy" | "degraded" | "unhealthy" | "unknown";
  readonly version?: string;
  readonly dependencies: readonly string[];
  readonly metrics: Readonly<Record<string, number>>;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface ServiceDescriptor<TService = unknown> {
  readonly id: string;
  readonly token: string;
  readonly version: string;
  readonly lifecycle: ServiceLifecycle;
  readonly visibility: ServiceVisibility;
  readonly capabilities: readonly string[];
  readonly ownerModule?: string;
  readonly factory: (
    container: DependencyContainer,
    context?: RuntimeContext
  ) => TService | Promise<TService>;
}

export interface ModuleDescriptor {
  readonly name: string;
  readonly version: string;
  readonly dependencies: readonly string[];
  readonly services: readonly ServiceDescriptor[];
  readonly commands: readonly string[];
  readonly events: readonly string[];
  readonly configurationKeys: readonly string[];
  readonly healthCheck?: () => HealthReport | Promise<HealthReport>;
  readonly lifecycle?: Partial<ModuleLifecycleHooks>;
}

export interface ModuleLifecycleHooks {
  install(context: RuntimeContext): void | Promise<void>;
  initialize(context: RuntimeContext): void | Promise<void>;
  configure(config: unknown, context: RuntimeContext): void | Promise<void>;
  start(context: RuntimeContext): void | Promise<void>;
  pause(context: RuntimeContext): void | Promise<void>;
  resume(context: RuntimeContext): void | Promise<void>;
  stop(context: RuntimeContext): void | Promise<void>;
  unload(context: RuntimeContext): void | Promise<void>;
  upgrade(targetVersion: string, context: RuntimeContext): void | Promise<void>;
  shutdown(context: RuntimeContext): void | Promise<void>;
}

export interface DependencyContainer {
  register<TService>(descriptor: ServiceDescriptor<TService>): void;
  resolve<TService>(token: string, context?: RuntimeContext): Promise<TService>;
  has(token: string): boolean;
}

export interface ServiceRegistry {
  register<TService>(descriptor: ServiceDescriptor<TService>): void;
  get(token: string): ServiceDescriptor | undefined;
  list(): readonly ServiceDescriptor[];
}

export interface ModuleRegistry {
  register(module: ModuleDescriptor): void;
  get(name: string): ModuleDescriptor | undefined;
  list(): readonly ModuleDescriptor[];
}

export interface Message<TPayload = unknown> {
  readonly id: string;
  readonly type: string;
  readonly kind: "command" | "query" | "event" | "notification" | "broadcast" | "request";
  readonly priority: "low" | "normal" | "high" | "critical";
  readonly payload: TPayload;
  readonly context: RuntimeContext;
  readonly scheduledFor?: string;
  readonly timeoutMs?: number;
}

export interface MessageBus {
  send<TPayload>(message: Message<TPayload>): Promise<unknown>;
  handle(type: string, handler: (message: Message) => unknown | Promise<unknown>): () => void;
  deadLetters(): readonly Message[];
}

export interface EventEngine {
  publish<TPayload>(event: DomainEvent<TPayload>, context: RuntimeContext): Promise<void>;
  subscribe(
    type: string,
    handler: (event: DomainEvent, context: RuntimeContext) => void | Promise<void>
  ): () => void;
  replay(type?: string): readonly DomainEvent[];
}

export interface ConfigurationRecord<TValue = unknown> {
  readonly scope:
    | "environment"
    | "workspace"
    | "project"
    | "user"
    | "module"
    | "plugin"
    | "development"
    | "production"
    | "testing";
  readonly key: string;
  readonly schemaVersion: number;
  readonly value: TValue;
}

export interface ConfigurationManager {
  set<TValue>(record: ConfigurationRecord<TValue>): void;
  get<TValue>(
    scope: ConfigurationRecord["scope"],
    key: string
  ): ConfigurationRecord<TValue> | undefined;
}

export interface ScheduledTask {
  readonly id: string;
  readonly type: "immediate" | "delayed" | "cron" | "workflow" | "agent";
  readonly priority: Message["priority"];
  readonly runAt?: string;
  readonly timeoutMs?: number;
  readonly maxRetries: number;
  readonly execute: (context: RuntimeContext) => void | Promise<void>;
}

export interface Scheduler {
  schedule(task: ScheduledTask, context: RuntimeContext): string;
  cancel(taskId: string): boolean;
}

export interface PluginManifest {
  readonly id: string;
  readonly version: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly dependencies: readonly string[];
  readonly configurationKeys: readonly string[];
  readonly commands: readonly string[];
  readonly events: readonly string[];
  readonly hooks: readonly string[];
}

export interface PluginManager {
  load(manifest: PluginManifest, context: RuntimeContext): Promise<void>;
  unload(pluginId: string, context: RuntimeContext): Promise<void>;
  list(): readonly PluginManifest[];
}

export interface ResourceDescriptor {
  readonly id: string;
  readonly type:
    | "memory"
    | "cpu"
    | "gpu"
    | "webgpu"
    | "worker"
    | "local-ai"
    | "external-ai"
    | "file"
    | "repository"
    | "cache"
    | "connection"
    | "distributed";
  readonly owner: string;
  readonly status: "available" | "reserved" | "busy" | "unavailable";
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface ResourceManager {
  register(resource: ResourceDescriptor): void;
  list(type?: ResourceDescriptor["type"]): readonly ResourceDescriptor[];
}

export interface PermissionVerifier {
  verify(context: RuntimeContext, capability: string): boolean;
}

export interface PlatformKernel {
  registerModule(module: ModuleDescriptor, context: RuntimeContext): Promise<void>;
  registerService<TService>(descriptor: ServiceDescriptor<TService>): void;
  resolve<TService>(token: string, context?: RuntimeContext): Promise<TService>;
  publish<TPayload>(event: DomainEvent<TPayload>, context: RuntimeContext): Promise<void>;
  subscribe(
    type: string,
    handler: (event: DomainEvent, context: RuntimeContext) => void | Promise<void>
  ): () => void;
  schedule(task: ScheduledTask, context: RuntimeContext): string;
  loadPlugin(manifest: PluginManifest, context: RuntimeContext): Promise<void>;
  startModule(name: string, context: RuntimeContext): Promise<void>;
  stopModule(name: string, context: RuntimeContext): Promise<void>;
  getHealth(): Promise<readonly HealthReport[]>;
  getConfiguration<TValue>(
    scope: ConfigurationRecord["scope"],
    key: string
  ): ConfigurationRecord<TValue> | undefined;
  setConfiguration<TValue>(record: ConfigurationRecord<TValue>): void;
  runAgent(command: Command, context: RuntimeContext): Promise<unknown>;
  executeWorkflow(query: Query, context: RuntimeContext): Promise<unknown>;
}

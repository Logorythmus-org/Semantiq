import type {
  ConfigurationManager,
  ConfigurationRecord,
  DependencyContainer,
  EventEngine,
  HealthReport,
  Message,
  MessageBus,
  ModuleDescriptor,
  PermissionVerifier,
  PlatformKernel,
  PluginManager,
  PluginManifest,
  ResourceDescriptor,
  ResourceManager,
  RuntimeContext,
  ScheduledTask,
  Scheduler,
  ServiceDescriptor,
  ServiceRegistry
} from "./contracts.js";
import type { Command, DomainEvent, Query } from "@tech-club/core";

export type * from "./contracts.js";

const createId = (prefix: string): string => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export class LocalDependencyContainer implements DependencyContainer, ServiceRegistry {
  private readonly descriptors = new Map<string, ServiceDescriptor>();
  private readonly singletons = new Map<string, unknown>();

  register<TService>(descriptor: ServiceDescriptor<TService>): void {
    this.descriptors.set(descriptor.token, descriptor);
  }

  has(token: string): boolean {
    return this.descriptors.has(token);
  }

  get(token: string): ServiceDescriptor | undefined {
    return this.descriptors.get(token);
  }

  list(): readonly ServiceDescriptor[] {
    return [...this.descriptors.values()];
  }

  async resolve<TService>(token: string, context?: RuntimeContext): Promise<TService> {
    const descriptor = this.descriptors.get(token);
    if (!descriptor) {
      throw new Error(`Service not registered: ${token}`);
    }

    if ((descriptor.lifecycle === "singleton" || descriptor.lifecycle === "lazy") && this.singletons.has(token)) {
      return this.singletons.get(token) as TService;
    }

    const service = await descriptor.factory(this, context);
    if (descriptor.lifecycle === "singleton" || descriptor.lifecycle === "lazy") {
      this.singletons.set(token, service);
    }
    return service as TService;
  }
}

export class LocalEventEngine implements EventEngine {
  private readonly history: Array<{ event: DomainEvent; context: RuntimeContext }> = [];
  private readonly handlers = new Map<string, Set<(event: DomainEvent, context: RuntimeContext) => void | Promise<void>>>();

  async publish<TPayload>(event: DomainEvent<TPayload>, context: RuntimeContext): Promise<void> {
    this.history.push({ event: event as DomainEvent, context });
    const handlers = this.handlers.get(event.type) ?? new Set();
    await Promise.all([...handlers].map((handler) => handler(event as DomainEvent, context)));
  }

  subscribe(type: string, handler: (event: DomainEvent, context: RuntimeContext) => void | Promise<void>): () => void {
    const handlers = this.handlers.get(type) ?? new Set();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    return () => {
      handlers.delete(handler);
    };
  }

  replay(type?: string): readonly DomainEvent[] {
    return this.history.filter((entry) => !type || entry.event.type === type).map((entry) => entry.event);
  }
}

export class LocalMessageBus implements MessageBus {
  private readonly handlers = new Map<string, Set<(message: Message) => unknown | Promise<unknown>>>();
  private readonly failed: Message[] = [];

  async send<TPayload>(message: Message<TPayload>): Promise<unknown> {
    const handlers = this.handlers.get(message.type);
    if (!handlers || handlers.size === 0) {
      this.failed.push(message as Message);
      return undefined;
    }
    const results = await Promise.all([...handlers].map((handler) => handler(message as Message)));
    return message.kind === "request" || message.kind === "query" ? results[0] : results;
  }

  handle(type: string, handler: (message: Message) => unknown | Promise<unknown>): () => void {
    const handlers = this.handlers.get(type) ?? new Set();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    return () => {
      handlers.delete(handler);
    };
  }

  deadLetters(): readonly Message[] {
    return [...this.failed];
  }
}

export class LocalConfigurationManager implements ConfigurationManager {
  private readonly records = new Map<string, ConfigurationRecord>();

  set<TValue>(record: ConfigurationRecord<TValue>): void {
    this.records.set(`${record.scope}:${record.key}`, Object.freeze(record) as ConfigurationRecord);
  }

  get<TValue>(scope: ConfigurationRecord["scope"], key: string): ConfigurationRecord<TValue> | undefined {
    return this.records.get(`${scope}:${key}`) as ConfigurationRecord<TValue> | undefined;
  }
}

export class LocalScheduler implements Scheduler {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  schedule(task: ScheduledTask, context: RuntimeContext): string {
    const delay = task.runAt ? Math.max(0, Date.parse(task.runAt) - Date.now()) : 0;
    const timer = setTimeout(() => {
      void task.execute(context);
      this.timers.delete(task.id);
    }, delay);
    this.timers.set(task.id, timer);
    return task.id;
  }

  cancel(taskId: string): boolean {
    const timer = this.timers.get(taskId);
    if (!timer) {
      return false;
    }
    clearTimeout(timer);
    this.timers.delete(taskId);
    return true;
  }
}

export class LocalPluginManager implements PluginManager {
  private readonly plugins = new Map<string, PluginManifest>();

  async load(manifest: PluginManifest, context: RuntimeContext): Promise<void> {
    for (const permission of manifest.permissions) {
      if (!context.capabilities.includes(permission)) {
        throw new Error(`Plugin permission denied: ${permission}`);
      }
    }
    this.plugins.set(manifest.id, manifest);
  }

  async unload(pluginId: string): Promise<void> {
    this.plugins.delete(pluginId);
  }

  list(): readonly PluginManifest[] {
    return [...this.plugins.values()];
  }
}

export class LocalResourceManager implements ResourceManager {
  private readonly resources = new Map<string, ResourceDescriptor>();

  register(resource: ResourceDescriptor): void {
    this.resources.set(resource.id, resource);
  }

  list(type?: ResourceDescriptor["type"]): readonly ResourceDescriptor[] {
    return [...this.resources.values()].filter((resource) => !type || resource.type === type);
  }
}

export class CapabilityPermissionVerifier implements PermissionVerifier {
  verify(context: RuntimeContext, capability: string): boolean {
    return context.capabilities.includes(capability);
  }
}

export class LocalPlatformKernel implements PlatformKernel {
  private readonly modules = new Map<string, { descriptor: ModuleDescriptor; state: string }>();

  constructor(
    private readonly container: DependencyContainer = new LocalDependencyContainer(),
    private readonly events: EventEngine = new LocalEventEngine(),
    private readonly messages: MessageBus = new LocalMessageBus(),
    private readonly scheduler: Scheduler = new LocalScheduler(),
    private readonly plugins: PluginManager = new LocalPluginManager(),
    private readonly resources: ResourceManager = new LocalResourceManager(),
    private readonly config: ConfigurationManager = new LocalConfigurationManager(),
    private readonly permissions: PermissionVerifier = new CapabilityPermissionVerifier()
  ) {}

  async registerModule(module: ModuleDescriptor, context: RuntimeContext): Promise<void> {
    this.requireCapability(context, "kernel:module:register");
    this.modules.set(module.name, { descriptor: module, state: "installed" });
    for (const service of module.services) {
      this.registerService(service);
    }
    await module.lifecycle?.install?.(context);
  }

  registerService<TService>(descriptor: ServiceDescriptor<TService>): void {
    this.container.register(descriptor);
  }

  resolve<TService>(token: string, context?: RuntimeContext): Promise<TService> {
    return this.container.resolve<TService>(token, context);
  }

  publish<TPayload>(event: DomainEvent<TPayload>, context: RuntimeContext): Promise<void> {
    this.requireCapability(context, "kernel:event:publish");
    return this.events.publish(event, context);
  }

  subscribe(type: string, handler: (event: DomainEvent, context: RuntimeContext) => void | Promise<void>): () => void {
    return this.events.subscribe(type, handler);
  }

  schedule(task: ScheduledTask, context: RuntimeContext): string {
    this.requireCapability(context, "kernel:task:schedule");
    return this.scheduler.schedule(task, context);
  }

  loadPlugin(manifest: PluginManifest, context: RuntimeContext): Promise<void> {
    this.requireCapability(context, "kernel:plugin:load");
    return this.plugins.load(manifest, context);
  }

  async startModule(name: string, context: RuntimeContext): Promise<void> {
    const entry = this.getModule(name);
    await entry.descriptor.lifecycle?.initialize?.(context);
    await entry.descriptor.lifecycle?.configure?.(this.config.get("module", name)?.value, context);
    await entry.descriptor.lifecycle?.start?.(context);
    this.modules.set(name, { descriptor: entry.descriptor, state: "started" });
  }

  async stopModule(name: string, context: RuntimeContext): Promise<void> {
    const entry = this.getModule(name);
    await entry.descriptor.lifecycle?.stop?.(context);
    this.modules.set(name, { descriptor: entry.descriptor, state: "stopped" });
  }

  async getHealth(): Promise<readonly HealthReport[]> {
    const reports = await Promise.all(
      [...this.modules.values()].map(async ({ descriptor, state }) => {
        if (descriptor.healthCheck) {
          return descriptor.healthCheck();
        }
        return {
          id: descriptor.name,
          status: state === "started" ? "healthy" : "unknown",
          version: descriptor.version,
          dependencies: descriptor.dependencies,
          metrics: {},
          errors: [],
          warnings: []
        } satisfies HealthReport;
      })
    );
    return reports;
  }

  getConfiguration<TValue>(scope: ConfigurationRecord["scope"], key: string): ConfigurationRecord<TValue> | undefined {
    return this.config.get(scope, key);
  }

  setConfiguration<TValue>(record: ConfigurationRecord<TValue>): void {
    this.config.set(record);
  }

  async runAgent(command: Command, context: RuntimeContext): Promise<unknown> {
    this.requireCapability(context, "kernel:agent:run");
    return this.messages.send({
      id: createId("agent"),
      type: command.type,
      kind: "command",
      priority: "normal",
      payload: command.payload,
      context
    });
  }

  async executeWorkflow(query: Query, context: RuntimeContext): Promise<unknown> {
    this.requireCapability(context, "kernel:workflow:execute");
    return this.messages.send({
      id: createId("workflow"),
      type: query.type,
      kind: "query",
      priority: "normal",
      payload: query.payload,
      context
    });
  }

  registerResource(resource: ResourceDescriptor): void {
    this.resources.register(resource);
  }

  private getModule(name: string): { descriptor: ModuleDescriptor; state: string } {
    const entry = this.modules.get(name);
    if (!entry) {
      throw new Error(`Module not registered: ${name}`);
    }
    return entry;
  }

  private requireCapability(context: RuntimeContext, capability: string): void {
    if (!this.permissions.verify(context, capability)) {
      throw new Error(`Missing capability: ${capability}`);
    }
  }
}

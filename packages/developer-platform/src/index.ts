export type * from "./contracts.js";

import type {
  CliCommandDescriptor,
  ComponentDescriptor,
  DeveloperPlatformEvent,
  DeveloperPlatformRepository,
  DeveloperPlatformService,
  DeveloperPortalResource,
  MarketplacePublishRequest,
  PluginLifecycleRecord,
  PluginManifest,
  PublicApiDescriptor,
  SDKManifest
} from "./contracts.js";

export class LocalDeveloperPlatformRepository implements DeveloperPlatformRepository {
  private readonly sdks = new Map<string, SDKManifest>();
  private readonly plugins = new Map<string, PluginManifest>();
  private readonly lifecycle: PluginLifecycleRecord[] = [];
  private readonly apis = new Map<string, PublicApiDescriptor>();
  private readonly cli = new Map<string, CliCommandDescriptor>();
  private readonly components = new Map<string, ComponentDescriptor>();
  private readonly publishRequests = new Map<string, MarketplacePublishRequest>();
  private readonly portal = new Map<string, DeveloperPortalResource>();
  private readonly events: DeveloperPlatformEvent[] = [];

  async saveSdk(manifest: SDKManifest): Promise<void> {
    this.sdks.set(manifest.id, manifest);
  }

  async getSdk(id: string): Promise<SDKManifest | undefined> {
    return this.sdks.get(id);
  }

  async savePlugin(manifest: PluginManifest): Promise<void> {
    this.plugins.set(manifest.id, manifest);
  }

  async getPlugin(id: string): Promise<PluginManifest | undefined> {
    return this.plugins.get(id);
  }

  async saveLifecycle(record: PluginLifecycleRecord): Promise<void> {
    this.lifecycle.push(Object.freeze(record));
  }

  async saveApi(api: PublicApiDescriptor): Promise<void> {
    this.apis.set(api.id, api);
  }

  async saveCliCommand(command: CliCommandDescriptor): Promise<void> {
    this.cli.set(command.id, command);
  }

  async saveComponent(component: ComponentDescriptor): Promise<void> {
    this.components.set(component.id, component);
  }

  async savePublishRequest(request: MarketplacePublishRequest): Promise<void> {
    this.publishRequests.set(request.id, request);
  }

  async savePortalResource(resource: DeveloperPortalResource): Promise<void> {
    this.portal.set(resource.id, resource);
  }

  async publishEvent(event: DeveloperPlatformEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listEvents(): readonly DeveloperPlatformEvent[] {
    return this.events;
  }
}

export class LocalDeveloperPlatformService implements DeveloperPlatformService {
  constructor(
    private readonly repository: LocalDeveloperPlatformRepository = new LocalDeveloperPlatformRepository()
  ) {}

  async registerSdk(manifest: SDKManifest): Promise<void> {
    if (manifest.modules.length === 0) {
      throw new Error("SDK manifests require at least one module");
    }
    await this.repository.saveSdk(manifest);
    await this.emit(
      "SdkRegistered",
      { language: manifest.language, version: manifest.version },
      manifest.id
    );
  }

  async installPlugin(manifest: PluginManifest): Promise<void> {
    if (!manifest.sandboxRequired) {
      throw new Error("Plugins must require sandbox isolation");
    }
    await this.repository.savePlugin(manifest);
    await this.saveLifecycle(manifest.id, manifest.version, "installed");
    await this.emit("PluginInstalled", { type: manifest.type }, undefined, manifest.id);
  }

  async verifyPlugin(pluginId: string): Promise<PluginLifecycleRecord> {
    const plugin = await this.requirePlugin(pluginId);
    if (!plugin.codeSignatureId) {
      throw new Error(`Plugin verification requires code signature: ${pluginId}`);
    }
    const record = await this.saveLifecycle(plugin.id, plugin.version, "verified");
    await this.emit(
      "PluginVerified",
      { codeSignatureId: plugin.codeSignatureId },
      undefined,
      plugin.id
    );
    return record;
  }

  async registerApi(api: PublicApiDescriptor): Promise<void> {
    if (!api.documented) {
      throw new Error(`Public API must be documented: ${api.id}`);
    }
    await this.repository.saveApi(api);
    await this.emit(
      "PublicApiRegistered",
      { kind: api.kind, version: api.version },
      undefined,
      undefined,
      api.id
    );
  }

  async registerCliCommand(command: CliCommandDescriptor): Promise<void> {
    await this.repository.saveCliCommand(command);
    await this.emit("CliCommandRegistered", {
      command: command.command,
      automationSafe: command.automationSafe
    });
  }

  async registerComponent(component: ComponentDescriptor): Promise<void> {
    if (!component.accessible) {
      throw new Error(`Components must be accessible: ${component.id}`);
    }
    await this.repository.saveComponent(component);
    await this.emit("ComponentRegistered", { category: component.category });
  }

  async publishToMarketplace(request: MarketplacePublishRequest): Promise<void> {
    const missingReviews = [
      request.semantiqReviewId,
      request.securityReviewId,
      request.compatibilityReviewId,
      request.permissionReviewId
    ].filter((value) => !value);
    if (missingReviews.length > 0 || !request.approved) {
      throw new Error(
        `Marketplace publishing requires Semantiq, security, compatibility, permission review, and approval: ${request.id}`
      );
    }
    await this.repository.savePublishRequest(request);
    await this.emit("MarketplacePublishValidated", {
      targetType: request.targetType,
      targetId: request.targetId
    });
  }

  async addPortalResource(resource: DeveloperPortalResource): Promise<void> {
    await this.repository.savePortalResource(resource);
    await this.emit("PortalResourceAdded", { type: resource.type, title: resource.title });
  }

  private async requirePlugin(pluginId: string): Promise<PluginManifest> {
    const plugin = await this.repository.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }
    return plugin;
  }

  private async saveLifecycle(
    pluginId: string,
    version: string,
    state: PluginLifecycleRecord["state"]
  ): Promise<PluginLifecycleRecord> {
    const record: PluginLifecycleRecord = {
      id: `${pluginId}:lifecycle:${state}:${Date.now()}`,
      pluginId,
      state,
      version,
      occurredAt: new Date().toISOString(),
      auditId: `${pluginId}:audit:${state}`
    };
    await this.repository.saveLifecycle(record);
    return record;
  }

  private async emit(
    type: DeveloperPlatformEvent["type"],
    payload: unknown,
    sdkId?: string,
    pluginId?: string,
    apiId?: string
  ): Promise<void> {
    const event: DeveloperPlatformEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withSdk = sdkId ? { ...event, sdkId } : event;
    const withPlugin = pluginId ? { ...withSdk, pluginId } : withSdk;
    const withApi = apiId ? { ...withPlugin, apiId } : withPlugin;
    await this.repository.publishEvent(withApi);
  }
}

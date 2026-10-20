export type SDKLanguage =
  | "typescript"
  | "python"
  | "rust"
  | "go"
  | "csharp"
  | "java"
  | "kotlin"
  | "swift"
  | "future";

export type SDKModuleName =
  | "workspace"
  | "question"
  | "knowledge-graph"
  | "semantiq"
  | "workflow"
  | "agent"
  | "repository"
  | "community"
  | "marketplace"
  | "identity"
  | "wallet"
  | "storage"
  | "search"
  | "events"
  | "benchmark";

export type PluginType =
  | "ui"
  | "workflow"
  | "ai"
  | "knowledge"
  | "visualization"
  | "editor"
  | "notebook"
  | "repository"
  | "search"
  | "community"
  | "education"
  | "game"
  | "marketplace"
  | "analytics"
  | "security"
  | "storage"
  | "import-export";

export type PluginLifecycleState =
  | "installed"
  | "verified"
  | "registered"
  | "loaded"
  | "initialized"
  | "executing"
  | "suspended"
  | "resumed"
  | "updated"
  | "disabled"
  | "uninstalled"
  | "archived";

export type PublicApiKind =
  | "rest"
  | "graphql"
  | "websocket"
  | "event-stream"
  | "cli"
  | "mcp"
  | "sdk"
  | "batch"
  | "streaming";

export interface DeveloperApplication {
  readonly id: string;
  readonly name: string;
  readonly ownerId: string;
  readonly description: string;
  readonly pluginIds: readonly string[];
  readonly apiIds: readonly string[];
  readonly marketplaceAssetIds: readonly string[];
  readonly version: string;
}

export interface SDKModule {
  readonly name: SDKModuleName;
  readonly concepts: readonly string[];
  readonly apiIds: readonly string[];
  readonly eventTypes: readonly string[];
  readonly graphIntegrated: boolean;
}

export interface SDKManifest {
  readonly id: string;
  readonly language: SDKLanguage;
  readonly version: string;
  readonly modules: readonly SDKModule[];
  readonly compatiblePlatformVersions: readonly string[];
  readonly lts: boolean;
  readonly migrationGuideIds: readonly string[];
}

export interface PluginCapability {
  readonly id: string;
  readonly name: string;
  readonly permissions: readonly string[];
  readonly commands: readonly string[];
  readonly eventTypes: readonly string[];
  readonly uiComponentIds: readonly string[];
}

export interface PluginManifest {
  readonly id: string;
  readonly type: PluginType;
  readonly version: string;
  readonly authorId: string;
  readonly capabilities: readonly PluginCapability[];
  readonly dependencyIds: readonly string[];
  readonly permissionIds: readonly string[];
  readonly eventTypes: readonly string[];
  readonly commandIds: readonly string[];
  readonly uiComponentIds: readonly string[];
  readonly apiEndpointIds: readonly string[];
  readonly configurationSchemaId: string;
  readonly lifecycle: readonly PluginLifecycleState[];
  readonly licenseId: string;
  readonly marketplaceMetadataId?: string;
  readonly sandboxRequired: true;
  readonly codeSignatureId?: string;
}

export interface PluginLifecycleRecord {
  readonly id: string;
  readonly pluginId: string;
  readonly state: PluginLifecycleState;
  readonly version: string;
  readonly occurredAt: string;
  readonly auditId: string;
}

export interface PublicApiDescriptor {
  readonly id: string;
  readonly kind: PublicApiKind;
  readonly name: string;
  readonly version: string;
  readonly path: string;
  readonly authenticated: boolean;
  readonly permissionIds: readonly string[];
  readonly rateLimitPolicyId: string;
  readonly documented: boolean;
  readonly deprecated: boolean;
  readonly migrationGuideId?: string;
}

export interface CliCommandDescriptor {
  readonly id: string;
  readonly command:
    | "techclub init"
    | "techclub dev"
    | "techclub plugin create"
    | "techclub plugin publish"
    | "techclub workflow create"
    | "techclub benchmark"
    | "techclub graph"
    | "techclub build"
    | "techclub test"
    | "techclub deploy"
    | "techclub doctor"
    | "techclub login"
    | "techclub marketplace";
  readonly automationSafe: boolean;
  readonly outputFormat: "text" | "json" | "stream";
  readonly permissionIds: readonly string[];
}

export interface ComponentDescriptor {
  readonly id: string;
  readonly name: string;
  readonly category:
    | "button"
    | "card"
    | "knowledge-view"
    | "question-view"
    | "graph-component"
    | "notebook-component"
    | "timeline"
    | "editor"
    | "table"
    | "form"
    | "dashboard"
    | "workflow-node"
    | "agent-panel"
    | "marketplace-view"
    | "chart"
    | "accessibility";
  readonly accessible: boolean;
  readonly propsSchemaId: string;
  readonly eventTypes: readonly string[];
}

export interface MarketplacePublishRequest {
  readonly id: string;
  readonly publisherId: string;
  readonly targetType:
    | "plugin"
    | "agent"
    | "workflow"
    | "template"
    | "ui-component"
    | "knowledge-pack"
    | "game"
    | "education-content"
    | "research-tool";
  readonly targetId: string;
  readonly semantiqReviewId?: string;
  readonly securityReviewId?: string;
  readonly compatibilityReviewId?: string;
  readonly permissionReviewId?: string;
  readonly licenseId: string;
  readonly approved: boolean;
}

export interface DeveloperPortalResource {
  readonly id: string;
  readonly type:
    | "api-explorer"
    | "sdk-docs"
    | "plugin-docs"
    | "tutorial"
    | "quickstart"
    | "example"
    | "architecture-guide"
    | "best-practice"
    | "migration-guide"
    | "video-tutorial"
    | "interactive-playground";
  readonly title: string;
  readonly url: string;
  readonly version: string;
  readonly tags: readonly string[];
}

export interface DeveloperPlatformRepository {
  saveSdk(manifest: SDKManifest): Promise<void>;
  getSdk(id: string): Promise<SDKManifest | undefined>;
  savePlugin(manifest: PluginManifest): Promise<void>;
  getPlugin(id: string): Promise<PluginManifest | undefined>;
  saveLifecycle(record: PluginLifecycleRecord): Promise<void>;
  saveApi(api: PublicApiDescriptor): Promise<void>;
  saveCliCommand(command: CliCommandDescriptor): Promise<void>;
  saveComponent(component: ComponentDescriptor): Promise<void>;
  savePublishRequest(request: MarketplacePublishRequest): Promise<void>;
  savePortalResource(resource: DeveloperPortalResource): Promise<void>;
  publishEvent(event: DeveloperPlatformEvent): Promise<void>;
}

export interface DeveloperPlatformService {
  registerSdk(manifest: SDKManifest): Promise<void>;
  installPlugin(manifest: PluginManifest): Promise<void>;
  verifyPlugin(pluginId: string): Promise<PluginLifecycleRecord>;
  registerApi(api: PublicApiDescriptor): Promise<void>;
  registerCliCommand(command: CliCommandDescriptor): Promise<void>;
  registerComponent(component: ComponentDescriptor): Promise<void>;
  publishToMarketplace(request: MarketplacePublishRequest): Promise<void>;
  addPortalResource(resource: DeveloperPortalResource): Promise<void>;
}

export interface DeveloperPlatformEvent {
  readonly type:
    | "SdkRegistered"
    | "PluginInstalled"
    | "PluginVerified"
    | "PluginRegistered"
    | "PluginLoaded"
    | "PluginDisabled"
    | "PublicApiRegistered"
    | "CliCommandRegistered"
    | "ComponentRegistered"
    | "MarketplacePublishValidated"
    | "PortalResourceAdded";
  readonly version: number;
  readonly occurredAt: string;
  readonly sdkId?: string;
  readonly pluginId?: string;
  readonly apiId?: string;
  readonly payload: unknown;
}

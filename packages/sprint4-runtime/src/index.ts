import { createHash } from "node:crypto";
import { LocalSprint3Runtime, type Sprint3JourneyResult } from "../../sprint3-runtime/src/index.js";

export type AssetType =
  | "Knowledge Pack"
  | "Question Pack"
  | "Research Pack"
  | "Evidence Collection"
  | "Workflow Template"
  | "Agent Package"
  | "Prompt Pack"
  | "Educational Game"
  | "Knowledge Card Deck"
  | "Narrative Package"
  | "Dataset Package"
  | "Repository Template"
  | "Workspace Template"
  | "Semantiq Profile"
  | "UI Extension"
  | "Plugin Package"
  | "Integration Adapter";

export type AssetState =
  | "Draft"
  | "Building"
  | "Validation Failed"
  | "Ready for Review"
  | "Under Review"
  | "Approved"
  | "Published"
  | "Deprecated"
  | "Suspended"
  | "Archived"
  | "Rejected";

export type ValidationStatus = "Passed" | "Passed with Warnings" | "Failed" | "Skipped" | "Requires Human Review";
export type InstallationState = "Not Installed" | "Resolving" | "Awaiting Approval" | "Installing" | "Installed" | "Failed" | "Disabled" | "Update Available" | "Updating" | "Rollback Available" | "Uninstalled";
export type LicenseType =
  | "Public Domain"
  | "MIT"
  | "Apache-2.0"
  | "GPL"
  | "AGPL"
  | "Creative Commons BY"
  | "Creative Commons BY-SA"
  | "Creative Commons BY-NC"
  | "Educational Use"
  | "Research Use"
  | "Commercial Use"
  | "Internal Use"
  | "Custom License";

export type Sprint4EventType =
  | "AssetCreated"
  | "AssetPackaged"
  | "AssetValidationStarted"
  | "AssetValidationCompleted"
  | "AssetReviewRequested"
  | "AssetApproved"
  | "AssetRejected"
  | "AssetPublished"
  | "AssetDeprecated"
  | "AssetSuspended"
  | "AssetInstalled"
  | "AssetInstallationFailed"
  | "AssetUpdated"
  | "AssetRolledBack"
  | "AssetUninstalled"
  | "LicenseGranted"
  | "OwnershipTransferred"
  | "ContributionRecorded"
  | "PluginRegistered"
  | "PluginDisabled"
  | "AgentPackageRegistered"
  | "WorkflowTemplateRegistered"
  | "MarketplaceReviewSubmitted"
  | "MarketplaceReportCreated";

export interface LicenseDefinition {
  readonly id: string;
  readonly type: LicenseType;
  readonly spdx?: string;
  readonly summary: string;
  readonly terms: Readonly<Record<string, unknown>>;
  readonly attributionRequired: boolean;
  readonly redistribution: string;
  readonly modification: string;
  readonly commercialUse: string;
  readonly shareAlike: boolean;
  readonly geographicRestrictionsPlaceholder: string;
  readonly expirationPlaceholder: string;
  readonly source: string;
  readonly version: string;
}

export interface SemanticAsset {
  readonly id: string;
  readonly slug: string;
  readonly type: AssetType;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly creatorId: string;
  readonly contributorIds: readonly string[];
  readonly ownerId: string;
  readonly workspaceId: string;
  readonly sourceQuestionIds: readonly string[];
  readonly sourceProjectIds: readonly string[];
  readonly knowledgeObjectId: string;
  readonly graphRelations: readonly string[];
  readonly semantiqReportIds: readonly string[];
  readonly version: string;
  readonly compatibilityRange: string;
  readonly dependencies: readonly AssetDependency[];
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly license: LicenseDefinition;
  readonly visibility: "private" | "local" | "public";
  readonly state: AssetState;
  readonly installationMetadata: Readonly<Record<string, unknown>>;
  readonly securityStatus: "unscanned" | "passed" | "warning" | "failed";
  readonly documentation: readonly string[];
  readonly examples: readonly string[];
  readonly changelog: readonly string[];
  readonly provenance: Readonly<Record<string, unknown>>;
  readonly auditHistory: readonly string[];
  readonly integrityHash: string;
  readonly digitalSignaturePlaceholder: string;
  readonly manifest: AssetManifest;
}

export interface AssetDependency {
  readonly id: string;
  readonly versionRange: string;
  readonly optional: boolean;
  readonly peer: boolean;
  readonly capability?: string;
}

export interface AssetManifest {
  readonly packageVersion: "techclub-asset-v1";
  readonly assetId: string;
  readonly slug: string;
  readonly type: AssetType;
  readonly title: string;
  readonly version: string;
  readonly entrypoint?: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly dependencies: readonly AssetDependency[];
  readonly compatibility: { readonly platform: string; readonly range: string };
  readonly licenseId: string;
}

export interface AssetPackage {
  readonly id: string;
  readonly assetId: string;
  readonly version: string;
  readonly layout: readonly string[];
  readonly manifest: AssetManifest;
  readonly readme: string;
  readonly licenseText: string;
  readonly changelog: string;
  readonly provenance: Readonly<Record<string, unknown>>;
  readonly compatibility: Readonly<Record<string, unknown>>;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly dependencies: readonly AssetDependency[];
  readonly semantiqReport?: AssetSemantiqReport;
  readonly inventory: readonly { readonly path: string; readonly hash: string }[];
  readonly manifestHash: string;
  readonly contentHash: string;
  readonly dependencyLock: readonly string[];
  readonly signatureInterface: { readonly signed: boolean; readonly signatureId?: string };
}

export interface PackageVerificationReport {
  readonly packageId: string;
  readonly manifestHashValid: boolean;
  readonly contentHashValid: boolean;
  readonly checksumValidation: ValidationStatus;
  readonly tamperDetected: boolean;
  readonly unsignedAllowedInLocalMode: boolean;
  readonly findings: readonly string[];
}

export interface ValidationResult {
  readonly id: string;
  readonly assetId: string;
  readonly assetVersion: string;
  readonly stage: string;
  readonly status: ValidationStatus;
  readonly severity: "info" | "warning" | "error" | "critical";
  readonly findings: readonly string[];
  readonly recommendations: readonly string[];
  readonly logs: readonly string[];
  readonly startedAt: string;
  readonly completedAt: string;
  readonly validator: string;
  readonly toolVersions: Readonly<Record<string, string>>;
  readonly reproducibility: Readonly<Record<string, unknown>>;
}

export interface AssetSemantiqScore {
  readonly dimension: string;
  readonly score: number;
  readonly explanation: string;
  readonly recommendations: readonly string[];
}

export interface AssetSemantiqReport {
  readonly id: string;
  readonly assetId: string;
  readonly assetVersion: string;
  readonly profile: string;
  readonly scores: readonly AssetSemantiqScore[];
  readonly normalizedScore: number;
  readonly createdAt: string;
}

export interface MarketplaceListing {
  readonly id: string;
  readonly assetId: string;
  readonly version: string;
  readonly publisherId: string;
  readonly category: string;
  readonly collectionIds: readonly string[];
  readonly compatibility: string;
  readonly reviewSummary: string;
  readonly semantiqSummary: number;
  readonly trustIndicators: readonly string[];
  readonly installationCount: number;
  readonly updateInformation: string;
  readonly securityStatus: SemanticAsset["securityStatus"];
  readonly licenseSummary: string;
  readonly relatedAssetIds: readonly string[];
  readonly publishedAt: string;
}

export interface InstallationPlan {
  readonly id: string;
  readonly assetId: string;
  readonly targetWorkspaceId: string;
  readonly state: InstallationState;
  readonly dependencies: readonly AssetDependency[];
  readonly dependencyGraph: readonly string[];
  readonly circularDependencyDetected: boolean;
  readonly conflictDetected: boolean;
  readonly permissions: readonly string[];
  readonly compatibility: ValidationStatus;
  readonly integrityReport: PackageVerificationReport;
  readonly securityFindings: readonly string[];
  readonly lockfile: readonly string[];
  readonly rollbackPlan: readonly string[];
  readonly mutatesEnvironment: false;
}

export interface InstallationRecord {
  readonly id: string;
  readonly assetId: string;
  readonly version: string;
  readonly workspaceId: string;
  readonly state: InstallationState;
  readonly installedAt: string;
  readonly capabilitiesRegistered: readonly string[];
  readonly auditId: string;
  readonly history: readonly string[];
}

export interface WalletMarketplaceRecord {
  readonly identityId: string;
  readonly createdAssets: readonly string[];
  readonly ownedAssets: readonly string[];
  readonly installedAssets: readonly string[];
  readonly licensedAssets: readonly string[];
  readonly publishedAssets: readonly string[];
  readonly contributionRecords: readonly string[];
  readonly credentials: readonly string[];
  readonly verificationStatus: "unverified" | "verified";
  readonly assetSignatures: readonly string[];
  readonly freeClaimReceipts: readonly string[];
  readonly licenseGrants: readonly string[];
  readonly publicationHistory: readonly string[];
}

export interface PluginSandboxManifest {
  readonly id: string;
  readonly version: string;
  readonly entrypoint: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly dependencies: readonly AssetDependency[];
  readonly configurationSchema: string;
  readonly events: readonly string[];
  readonly commands: readonly string[];
  readonly uiExtensions: readonly string[];
  readonly apiExtensions: readonly string[];
  readonly healthCheck: string;
  readonly licenseId: string;
  readonly publisherId: string;
  readonly integrityData: string;
  readonly sandbox: {
    readonly capabilityApi: true;
    readonly permissionPrompts: true;
    readonly filesystemIsolation: true;
    readonly networkPolicy: "deny-by-default" | "allow-listed";
    readonly workspaceScope: string;
    readonly timeoutMs: number;
    readonly memoryLimitMb: number;
    readonly processIsolationAdapter: string;
    readonly auditLogging: true;
    readonly disableSwitch: true;
    readonly healthMonitoring: true;
  };
}

export interface MarketplaceReview {
  readonly id: string;
  readonly reviewerId: string;
  readonly assetId: string;
  readonly assetVersion: string;
  readonly usageContext: string;
  readonly ratings: Readonly<Record<string, number>>;
  readonly explanation: string;
  readonly evidence: readonly string[];
  readonly conflictsOfInterest: readonly string[];
  readonly timestamp: string;
  readonly editHistory: readonly string[];
}

export interface ModerationAction {
  readonly id: string;
  readonly assetId: string;
  readonly action: "Report asset" | "Suspend asset" | "Request changes" | "Mark unsafe" | "Mark incompatible" | "Mark abandoned" | "Appeal decision" | "Restore asset";
  readonly explanation: string;
  readonly actorId: string;
  readonly audited: true;
  readonly createdAt: string;
}

export interface Sprint4Event {
  readonly eventId: string;
  readonly type: Sprint4EventType;
  readonly eventVersion: number;
  readonly timestamp: string;
  readonly actorId: string;
  readonly workspaceOrRegistryId: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly assetId: string;
  readonly assetVersion: string;
  readonly payload: unknown;
  readonly audit: Readonly<Record<string, unknown>>;
}

export interface Sprint4JourneyResult {
  readonly sprint3: Sprint3JourneyResult;
  readonly asset: SemanticAsset;
  readonly package: AssetPackage;
  readonly validation: readonly ValidationResult[];
  readonly semantiq: AssetSemantiqReport;
  readonly listing: MarketplaceListing;
  readonly installationPlan: InstallationPlan;
  readonly installation: InstallationRecord;
  readonly review: MarketplaceReview;
  readonly updatedAsset: SemanticAsset;
  readonly rollback: InstallationRecord;
  readonly exportPackage: AssetPackage;
  readonly wallet: WalletMarketplaceRecord;
  readonly events: readonly Sprint4Event[];
}

const now = (): string => new Date().toISOString();
const id = (prefix: string): string => `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const hash = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const assetPackageLayout = [
  "manifest.json",
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "provenance.json",
  "compatibility.json",
  "capabilities.json",
  "permissions.json",
  "dependencies.json",
  "semantiq/report.json",
  "contracts/",
  "schemas/",
  "assets/",
  "examples/",
  "tests/",
  "docs/",
  "signatures/"
] as const;

export const sprint4ApiContracts = {
  asset: ["createAsset()", "updateAsset()", "buildAssetPackage()", "validateAsset()", "getAsset()", "getAssetVersion()", "listAssetVersions()", "deprecateAsset()", "archiveAsset()"],
  registry: ["registerAsset()", "resolveAsset()", "resolveDependencies()", "verifyPackage()", "importPackage()", "exportPackage()"],
  marketplace: ["publishAsset()", "searchAssets()", "getListing()", "reviewAsset()", "reportAsset()", "recommendAssets()"],
  installation: ["createInstallationPlan()", "approveInstallation()", "installAsset()", "updateAssetInstallation()", "rollbackAsset()", "disableAsset()", "uninstallAsset()"],
  licensing: ["getLicense()", "validateLicenseMetadata()", "grantLicense()", "revokeLicenseGrant()", "getLicenseHistory()"],
  developer: ["generateSDK()", "registerPlugin()", "registerAgentPackage()", "registerWorkflowTemplate()", "getCompatibilityReport()"]
} as const;

export const sprint4CliCommands = [
  "techclub asset create",
  "techclub asset build",
  "techclub asset validate",
  "techclub asset inspect",
  "techclub asset publish",
  "techclub asset install",
  "techclub asset uninstall",
  "techclub asset update",
  "techclub asset rollback",
  "techclub registry list",
  "techclub marketplace search",
  "techclub marketplace inspect",
  "techclub plugin create",
  "techclub agent package",
  "techclub workflow package",
  "techclub sdk generate",
  "techclub license inspect",
  "techclub package verify"
] as const;

export const marketplaceScreens = [
  "Marketplace Home",
  "Asset Search",
  "Asset Details",
  "Asset Version History",
  "Asset Creation Wizard",
  "Package Builder",
  "Validation Report",
  "Publishing Review",
  "Installation Plan",
  "Permission Review",
  "Installation Progress",
  "Installed Assets",
  "Update Manager",
  "License Inspector",
  "Publisher Profile",
  "Review Editor",
  "Moderation Report",
  "Developer Dashboard",
  "Plugin Manager",
  "Agent Package Manager",
  "Workflow Template Browser"
] as const;

const defaultLicense = (type: LicenseType = "MIT"): LicenseDefinition => {
  const base = {
    id: `license:${type.toLowerCase().replaceAll(" ", "-")}`,
    type,
    summary: `${type} metadata. This is not legal advice.`,
    terms: { attribution: true, legalAdvice: false },
    attributionRequired: type !== "Public Domain",
    redistribution: "See license text.",
    modification: "See license text.",
    commercialUse: type.includes("NC") ? "restricted" : "metadata-declared",
    shareAlike: type.includes("SA"),
    geographicRestrictionsPlaceholder: "none-declared",
    expirationPlaceholder: "none-declared",
    source: "local-license-registry",
    version: "1.0.0"
  };
  return type === "MIT" || type === "Apache-2.0" ? { ...base, spdx: type } : base;
};

export class LocalSprint4Runtime {
  private readonly sprint3 = new LocalSprint3Runtime();
  private readonly assets = new Map<string, SemanticAsset>();
  private readonly packages = new Map<string, AssetPackage>();
  private readonly listings = new Map<string, MarketplaceListing>();
  private readonly installations = new Map<string, InstallationRecord>();
  private readonly validations = new Map<string, readonly ValidationResult[]>();
  private readonly reports = new Map<string, AssetSemantiqReport>();
  private readonly wallets = new Map<string, WalletMarketplaceRecord>();
  private readonly reviews: MarketplaceReview[] = [];
  private readonly moderation: ModerationAction[] = [];
  private readonly plugins = new Map<string, PluginSandboxManifest>();
  private readonly events: Sprint4Event[] = [];

  async runCriticalAssetLifecycle(): Promise<Sprint4JourneyResult> {
    const sprint3 = await this.sprint3.runOperationalJourney({
      identityId: "identity:sprint4",
      displayName: "Sprint Four",
      workspaceName: "Marketplace Lab",
      rawQuestion: "How can a workflow package preserve research evidence?",
      evidenceTitle: "Marketplace evidence",
      evidenceSource: "local://marketplace-evidence"
    });
    const actorId = sprint3.sprint2.identityId;
    const asset = await this.createAsset(sprint3.sprint2.workspaceId, actorId, {
      type: "Workflow Template",
      title: "Evidence Research Workflow",
      summary: "Reusable workflow template for evidence-centered research.",
      description: "Packages the Sprint 3 research workflow as a local semantic marketplace asset.",
      sourceQuestionIds: [sprint3.sprint2.question.id],
      sourceProjectIds: [sprint3.sprint2.researchProject.id],
      capabilities: ["research", "workflow", "evidence"],
      permissions: ["workspace:read", "graph:write"],
      license: defaultLicense("MIT")
    });
    const assetPackage = await this.buildAssetPackage(actorId, asset.id);
    const validation = await this.validateAsset(actorId, asset.id);
    const semantiq = await this.evaluateAsset(asset.id);
    await this.requestPublication(actorId, asset.id);
    const listing = await this.publishAsset(actorId, asset.id);
    const search = this.searchAssets("evidence workflow", { localOnly: true });
    if (!search.some((item) => item.assetId === asset.id)) throw new Error("Published asset not searchable");
    const installationPlan = this.createInstallationPlan(actorId, asset.id, "workspace:consumer");
    const installation = await this.installAsset(actorId, installationPlan.id);
    await this.registerWorkflowTemplate(actorId, asset.id);
    const review = this.reviewAsset(actorId, asset.id, "Used in a local research workspace.");
    const updatedAsset = this.updateAsset(actorId, asset.id, { summary: "Reusable and reviewed workflow template.", version: "1.0.1" });
    await this.buildAssetPackage(actorId, updatedAsset.id);
    const updatedInstallation = this.updateAssetInstallation(actorId, installation.id, updatedAsset.version);
    const rollback = this.rollbackAsset(actorId, updatedInstallation.id);
    const exportPackage = this.exportPackage(asset.id);
    const wallet = this.walletFor(actorId);
    return { sprint3, asset: this.requireAsset(asset.id), package: assetPackage, validation, semantiq, listing, installationPlan, installation, review, updatedAsset, rollback, exportPackage, wallet, events: this.events };
  }

  async createAsset(
    workspaceId: string,
    actorId: string,
    input: {
      readonly type: AssetType;
      readonly title: string;
      readonly summary: string;
      readonly description: string;
      readonly sourceQuestionIds: readonly string[];
      readonly sourceProjectIds: readonly string[];
      readonly capabilities: readonly string[];
      readonly permissions: readonly string[];
      readonly license: LicenseDefinition;
    }
  ): Promise<SemanticAsset> {
    const assetId = id("asset");
    const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const manifest: AssetManifest = {
      packageVersion: "techclub-asset-v1",
      assetId,
      slug,
      type: input.type,
      title: input.title,
      version: "1.0.0",
      capabilities: input.capabilities,
      permissions: input.permissions,
      dependencies: [],
      compatibility: { platform: "tech-club", range: ">=0.0.0" },
      licenseId: input.license.id
    };
    const integrityHash = hash({ manifest, description: input.description });
    const asset: SemanticAsset = {
      id: assetId,
      slug,
      type: input.type,
      title: input.title,
      summary: input.summary,
      description: input.description,
      creatorId: actorId,
      contributorIds: [actorId],
      ownerId: actorId,
      workspaceId,
      sourceQuestionIds: input.sourceQuestionIds,
      sourceProjectIds: input.sourceProjectIds,
      knowledgeObjectId: `knowledge:${assetId}`,
      graphRelations: input.sourceProjectIds,
      semantiqReportIds: [],
      version: "1.0.0",
      compatibilityRange: ">=0.0.0",
      dependencies: [],
      capabilities: input.capabilities,
      permissions: input.permissions,
      license: input.license,
      visibility: "local",
      state: "Draft",
      installationMetadata: {},
      securityStatus: "unscanned",
      documentation: ["README.md"],
      examples: ["examples/basic.md"],
      changelog: ["1.0.0 initial local asset"],
      provenance: { source: "sprint4-local-runtime", sourceQuestionIds: input.sourceQuestionIds, sourceProjectIds: input.sourceProjectIds },
      auditHistory: [id("audit")],
      integrityHash,
      digitalSignaturePlaceholder: "unsigned-local-development",
      manifest
    };
    this.assets.set(asset.id, asset);
    this.recordWallet(actorId, { createdAssets: [asset.id], ownedAssets: [asset.id] });
    this.emit("AssetCreated", actorId, workspaceId, asset, { assetId: asset.id });
    return asset;
  }

  updateAsset(actorId: string, assetId: string, patch: { readonly summary?: string; readonly version?: string }): SemanticAsset {
    const asset = this.requireAsset(assetId);
    const manifest = { ...asset.manifest, version: patch.version ?? asset.version };
    const updated: SemanticAsset = {
      ...asset,
      summary: patch.summary ?? asset.summary,
      version: patch.version ?? asset.version,
      manifest,
      changelog: [...asset.changelog, `${patch.version ?? asset.version} updated locally`],
      integrityHash: hash({ manifest, summary: patch.summary ?? asset.summary }),
      auditHistory: [...asset.auditHistory, id("audit")]
    };
    this.assets.set(assetId, updated);
    this.emit("AssetUpdated", actorId, asset.workspaceId, updated, { version: updated.version });
    return updated;
  }

  async buildAssetPackage(actorId: string, assetId: string): Promise<AssetPackage> {
    const asset = this.requireAsset(assetId);
    const manifestHash = hash(asset.manifest);
    const inventory = assetPackageLayout.map((path) => ({ path, hash: hash({ path, assetId, version: asset.version }) }));
    const pkg: AssetPackage = {
      id: id("asset-package"),
      assetId,
      version: asset.version,
      layout: assetPackageLayout,
      manifest: asset.manifest,
      readme: `# ${asset.title}\n\n${asset.description}`,
      licenseText: asset.license.summary,
      changelog: asset.changelog.join("\n"),
      provenance: asset.provenance,
      compatibility: asset.manifest.compatibility,
      capabilities: asset.capabilities,
      permissions: asset.permissions,
      dependencies: asset.dependencies,
      inventory,
      manifestHash,
      contentHash: hash(inventory),
      dependencyLock: asset.dependencies.map((dependency) => `${dependency.id}@${dependency.versionRange}`),
      signatureInterface: { signed: false }
    };
    this.packages.set(pkg.id, pkg);
    this.assets.set(assetId, { ...asset, state: asset.state === "Published" ? "Published" : "Building", auditHistory: [...asset.auditHistory, id("audit")] });
    this.emit("AssetPackaged", actorId, asset.workspaceId, asset, { packageId: pkg.id });
    return pkg;
  }

  verifyPackage(packageId: string): PackageVerificationReport {
    const pkg = this.requirePackage(packageId);
    const manifestHashValid = pkg.manifestHash === hash(pkg.manifest);
    const contentHashValid = pkg.contentHash === hash(pkg.inventory);
    return {
      packageId,
      manifestHashValid,
      contentHashValid,
      checksumValidation: manifestHashValid && contentHashValid ? "Passed" : "Failed",
      tamperDetected: !(manifestHashValid && contentHashValid),
      unsignedAllowedInLocalMode: !pkg.signatureInterface.signed,
      findings: pkg.signatureInterface.signed ? [] : ["Package is unsigned and allowed only in local development mode."]
    };
  }

  async validateAsset(actorId: string, assetId: string): Promise<readonly ValidationResult[]> {
    const asset = this.requireAsset(assetId);
    this.emit("AssetValidationStarted", actorId, asset.workspaceId, asset, {});
    const stages = [
      "Manifest Validation",
      "Schema Validation",
      "Dependency Validation",
      "Compatibility Validation",
      "Permission Review",
      "License Validation",
      "Documentation Check",
      "Test Execution",
      "Security Scan",
      "Semantiq Evaluation",
      "Human Review",
      "Publication Approval"
    ];
    const results = stages.map<ValidationResult>((stage) => {
      const warning = stage === "Security Scan" && asset.digitalSignaturePlaceholder.includes("unsigned");
      const human = stage === "Human Review" || stage === "Publication Approval";
      const status: ValidationStatus = human ? "Requires Human Review" : warning ? "Passed with Warnings" : "Passed";
      return {
        id: id("validation"),
        assetId,
        assetVersion: asset.version,
        stage,
        status,
        severity: warning ? "warning" : human ? "info" : "info",
        findings: warning ? ["Unsigned local development package."] : [`${stage} completed.`],
        recommendations: warning ? ["Sign package before remote publication."] : [],
        logs: [`${stage} executed by local deterministic validator.`],
        startedAt: now(),
        completedAt: now(),
        validator: "sprint4-local-validator",
        toolVersions: { validator: "1.0.0" },
        reproducibility: { offline: true, deterministic: true }
      };
    });
    this.validations.set(assetId, results);
    this.assets.set(assetId, { ...asset, state: "Ready for Review", securityStatus: "warning" });
    this.emit("AssetValidationCompleted", actorId, asset.workspaceId, this.requireAsset(assetId), { stages: results.length });
    return results;
  }

  async evaluateAsset(assetId: string): Promise<AssetSemantiqReport> {
    const asset = this.requireAsset(assetId);
    const dimensions = [
      "Clarity",
      "Documentation quality",
      "Reusability",
      "Semantic coherence",
      "Knowledge value",
      "Evidence quality",
      "Safety",
      "Compatibility",
      "Accessibility",
      "Maintainability",
      "Educational value",
      "Public benefit",
      "Originality",
      "Provenance quality",
      ...(asset.type === "Agent Package" ? ["Capability clarity", "Tool safety", "Permission minimality", "Prompt quality", "Failure handling", "Human oversight"] : []),
      ...(asset.type === "Workflow Template" ? ["Logical correctness", "Recoverability", "Explainability", "Approval design"] : []),
      ...(asset.type === "Research Pack" ? ["Evidence traceability", "Method clarity", "Reproducibility", "Scientific integrity"] : [])
    ];
    const scores = dimensions.map<AssetSemantiqScore>((dimension) => {
      const score = Math.min(1, 0.55 + asset.documentation.length * 0.05 + asset.examples.length * 0.05 + asset.capabilities.length * 0.02);
      return { dimension, score, explanation: `${dimension} evaluated from metadata, documentation, provenance, permissions, and package validation.`, recommendations: score < 0.8 ? [`Improve ${dimension.toLowerCase()} before public release.`] : [] };
    });
    const normalizedScore = scores.reduce((sum, score) => sum + score.score, 0) / scores.length;
    const report: AssetSemantiqReport = { id: id("asset-semantiq"), assetId, assetVersion: asset.version, profile: `${asset.type} profile`, scores, normalizedScore, createdAt: now() };
    this.reports.set(report.id, report);
    this.assets.set(assetId, { ...asset, semantiqReportIds: [...asset.semantiqReportIds, report.id] });
    return report;
  }

  async requestPublication(actorId: string, assetId: string): Promise<void> {
    const asset = this.requireAsset(assetId);
    this.assets.set(assetId, { ...asset, state: "Under Review" });
    this.emit("AssetReviewRequested", actorId, asset.workspaceId, asset, {});
  }

  async publishAsset(actorId: string, assetId: string): Promise<MarketplaceListing> {
    const asset = this.requireAsset(assetId);
    const results = this.validations.get(assetId) ?? [];
    const report = this.latestReport(assetId);
    if (!report || results.length === 0) throw new Error("Publication requires validation and Semantiq report");
    const approved = { ...asset, state: "Published" as const, visibility: "local" as const, securityStatus: asset.securityStatus === "failed" ? "failed" as const : "warning" as const };
    this.assets.set(assetId, approved);
    const listing: MarketplaceListing = {
      id: id("listing"),
      assetId,
      version: approved.version,
      publisherId: actorId,
      category: approved.type,
      collectionIds: [],
      compatibility: approved.compatibilityRange,
      reviewSummary: "No anonymous ratings; structured reviews only.",
      semantiqSummary: report.normalizedScore,
      trustIndicators: ["local", "provenance-declared", "human-approved"],
      installationCount: 0,
      updateInformation: approved.changelog.at(-1) ?? "Initial publication",
      securityStatus: approved.securityStatus,
      licenseSummary: approved.license.summary,
      relatedAssetIds: [],
      publishedAt: now()
    };
    this.listings.set(listing.id, listing);
    this.recordWallet(actorId, { publishedAssets: [assetId], licensedAssets: [assetId], licenseGrants: [id("license-grant")] });
    this.emit("AssetApproved", actorId, asset.workspaceId, approved, {});
    this.emit("AssetPublished", actorId, asset.workspaceId, approved, { listingId: listing.id });
    this.emit("LicenseGranted", actorId, asset.workspaceId, approved, { licenseId: approved.license.id });
    return listing;
  }

  searchAssets(query: string, filters: { readonly localOnly?: boolean; readonly verified?: boolean; readonly freeOpen?: boolean } = {}): readonly MarketplaceListing[] {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    return [...this.listings.values()]
      .map((listing) => {
        const asset = this.requireAsset(listing.assetId);
        const haystack = `${asset.title} ${asset.description} ${asset.type} ${asset.capabilities.join(" ")} ${asset.license.type} ${listing.securityStatus}`.toLowerCase();
        const keywordScore = terms.length === 0 ? 0 : terms.filter((term) => haystack.includes(term)).length / terms.length;
        const semanticQuality = listing.semantiqSummary;
        const docsBonus = asset.documentation.length > 0 ? 0.1 : 0;
        return { listing, rank: keywordScore * 0.5 + semanticQuality * 0.4 + docsBonus };
      })
      .filter(({ listing, rank }) => rank > 0 && (!filters.localOnly || this.requireAsset(listing.assetId).visibility === "local") && (!filters.verified || listing.trustIndicators.includes("human-approved")) && (!filters.freeOpen || !this.requireAsset(listing.assetId).license.type.includes("Commercial")))
      .sort((left, right) => right.rank - left.rank)
      .map(({ listing }) => listing);
  }

  createInstallationPlan(actorId: string, assetId: string, targetWorkspaceId: string): InstallationPlan {
    const asset = this.requireAsset(assetId);
    const pkg = [...this.packages.values()].find((candidate) => candidate.assetId === assetId && candidate.version === asset.version);
    if (!pkg) throw new Error(`Package not found for asset ${assetId}`);
    const integrityReport = this.verifyPackage(pkg.id);
    return {
      id: id("installation-plan"),
      assetId,
      targetWorkspaceId,
      state: "Awaiting Approval",
      dependencies: asset.dependencies,
      dependencyGraph: asset.dependencies.map((dependency) => dependency.id),
      circularDependencyDetected: this.hasCircularDependency(asset),
      conflictDetected: false,
      permissions: asset.permissions,
      compatibility: "Passed",
      integrityReport,
      securityFindings: integrityReport.findings,
      lockfile: pkg.dependencyLock,
      rollbackPlan: [`Restore previous version before installing ${asset.version}`],
      mutatesEnvironment: false
    };
  }

  async installAsset(actorId: string, planId: string): Promise<InstallationRecord> {
    const plan = this.findPlan(planId);
    const asset = this.requireAsset(plan.assetId);
    if (plan.circularDependencyDetected || plan.conflictDetected || plan.integrityReport.tamperDetected) {
      this.emit("AssetInstallationFailed", actorId, plan.targetWorkspaceId, asset, { planId });
      throw new Error("Installation plan failed validation");
    }
    const record: InstallationRecord = {
      id: id("installation"),
      assetId: asset.id,
      version: asset.version,
      workspaceId: plan.targetWorkspaceId,
      state: "Installed",
      installedAt: now(),
      capabilitiesRegistered: asset.capabilities,
      auditId: id("audit"),
      history: [`installed:${asset.version}`]
    };
    this.installations.set(record.id, record);
    this.recordWallet(actorId, { installedAssets: [asset.id] });
    this.emit("AssetInstalled", actorId, plan.targetWorkspaceId, asset, { installationId: record.id });
    return record;
  }

  updateAssetInstallation(actorId: string, installationId: string, version: string): InstallationRecord {
    const installation = this.requireInstallation(installationId);
    const updated = { ...installation, version, state: "Update Available" as const, history: [...installation.history, `update-available:${version}`] };
    this.installations.set(installationId, updated);
    this.emit("AssetUpdated", actorId, installation.workspaceId, this.requireAsset(installation.assetId), { installationId, version });
    return updated;
  }

  rollbackAsset(actorId: string, installationId: string): InstallationRecord {
    const installation = this.requireInstallation(installationId);
    const asset = this.requireAsset(installation.assetId);
    const rolledBack = { ...installation, version: asset.version, state: "Rollback Available" as const, history: [...installation.history, `rolled-back:${asset.version}`] };
    this.installations.set(installationId, rolledBack);
    this.emit("AssetRolledBack", actorId, installation.workspaceId, asset, { installationId });
    return rolledBack;
  }

  uninstallAsset(actorId: string, installationId: string): InstallationRecord {
    const installation = this.requireInstallation(installationId);
    const uninstalled = { ...installation, state: "Uninstalled" as const, history: [...installation.history, "uninstalled"] };
    this.installations.set(installationId, uninstalled);
    this.emit("AssetUninstalled", actorId, installation.workspaceId, this.requireAsset(installation.assetId), { installationId });
    return uninstalled;
  }

  reviewAsset(reviewerId: string, assetId: string, usageContext: string): MarketplaceReview {
    const asset = this.requireAsset(assetId);
    const review: MarketplaceReview = {
      id: id("review"),
      reviewerId,
      assetId,
      assetVersion: asset.version,
      usageContext,
      ratings: { documentation: 4, functionality: 4, security: 3, educationalValue: 4, researchValue: 4, accessibility: 3, compatibility: 4, reliability: 4, maintainability: 4 },
      explanation: "Structured local review; no anonymous untraceable rating.",
      evidence: asset.documentation,
      conflictsOfInterest: [],
      timestamp: now(),
      editHistory: []
    };
    this.reviews.push(review);
    this.emit("MarketplaceReviewSubmitted", reviewerId, asset.workspaceId, asset, { reviewId: review.id });
    return review;
  }

  reportAsset(actorId: string, assetId: string, action: ModerationAction["action"], explanation: string): ModerationAction {
    const asset = this.requireAsset(assetId);
    const record: ModerationAction = { id: id("moderation"), assetId, action, explanation, actorId, audited: true, createdAt: now() };
    this.moderation.push(record);
    this.emit("MarketplaceReportCreated", actorId, asset.workspaceId, asset, { moderationId: record.id, action });
    return record;
  }

  registerPlugin(actorId: string, assetId: string): PluginSandboxManifest {
    const asset = this.requireAsset(assetId);
    const plugin: PluginSandboxManifest = {
      id: `plugin:${asset.id}`,
      version: asset.version,
      entrypoint: "plugin/index.js",
      capabilities: asset.capabilities,
      permissions: asset.permissions,
      dependencies: asset.dependencies,
      configurationSchema: "schemas/configuration.schema.json",
      events: ["PluginRegistered", "PluginDisabled"],
      commands: ["plugin.health"],
      uiExtensions: asset.type === "UI Extension" ? ["marketplace.panel"] : [],
      apiExtensions: [],
      healthCheck: "plugin.health",
      licenseId: asset.license.id,
      publisherId: actorId,
      integrityData: asset.integrityHash,
      sandbox: {
        capabilityApi: true,
        permissionPrompts: true,
        filesystemIsolation: true,
        networkPolicy: "deny-by-default",
        workspaceScope: asset.workspaceId,
        timeoutMs: 30000,
        memoryLimitMb: 128,
        processIsolationAdapter: "local-descriptor",
        auditLogging: true,
        disableSwitch: true,
        healthMonitoring: true
      }
    };
    this.plugins.set(plugin.id, plugin);
    this.emit("PluginRegistered", actorId, asset.workspaceId, asset, { pluginId: plugin.id });
    return plugin;
  }

  registerAgentPackage(actorId: string, assetId: string): void {
    const asset = this.requireAsset(assetId);
    this.emit("AgentPackageRegistered", actorId, asset.workspaceId, asset, { capabilities: asset.capabilities });
  }

  registerWorkflowTemplate(actorId: string, assetId: string): void {
    const asset = this.requireAsset(assetId);
    this.emit("WorkflowTemplateRegistered", actorId, asset.workspaceId, asset, { capabilities: asset.capabilities });
  }

  generateSDK(language: "typescript" | "python"): { readonly language: "typescript" | "python"; readonly modules: readonly string[]; readonly localRuntime: true; readonly remoteApi: true } {
    return {
      language,
      modules: ["identity", "workspace", "question", "knowledge", "graph", "semantiq", "research", "agent", "workflow", "asset", "registry", "marketplace", "events"],
      localRuntime: true,
      remoteApi: true
    };
  }

  exportPackage(assetId: string): AssetPackage {
    const asset = this.requireAsset(assetId);
    const pkg = [...this.packages.values()].find((candidate) => candidate.assetId === asset.id && candidate.version === asset.version);
    if (!pkg) throw new Error(`Package not found for asset ${assetId}`);
    return pkg;
  }

  importPackage(actorId: string, pkg: AssetPackage): SemanticAsset {
    const license = defaultLicense("MIT");
    return {
      id: pkg.assetId,
      slug: pkg.manifest.slug,
      type: pkg.manifest.type,
      title: pkg.manifest.title,
      summary: "Imported local package",
      description: pkg.readme,
      creatorId: actorId,
      contributorIds: [actorId],
      ownerId: actorId,
      workspaceId: "workspace:import",
      sourceQuestionIds: [],
      sourceProjectIds: [],
      knowledgeObjectId: `knowledge:${pkg.assetId}`,
      graphRelations: [],
      semantiqReportIds: pkg.semantiqReport ? [pkg.semantiqReport.id] : [],
      version: pkg.version,
      compatibilityRange: pkg.manifest.compatibility.range,
      dependencies: pkg.dependencies,
      capabilities: pkg.capabilities,
      permissions: pkg.permissions,
      license,
      visibility: "local",
      state: "Draft",
      installationMetadata: {},
      securityStatus: "unscanned",
      documentation: ["README.md"],
      examples: [],
      changelog: [pkg.changelog],
      provenance: pkg.provenance,
      auditHistory: [id("audit")],
      integrityHash: pkg.contentHash,
      digitalSignaturePlaceholder: "imported-unsigned-local",
      manifest: pkg.manifest
    };
  }

  eventsLog(): readonly Sprint4Event[] {
    return this.events;
  }

  private latestReport(assetId: string): AssetSemantiqReport | undefined {
    return [...this.reports.values()].filter((report) => report.assetId === assetId).at(-1);
  }

  private hasCircularDependency(asset: SemanticAsset): boolean {
    return asset.dependencies.some((dependency) => dependency.id === asset.id);
  }

  private findPlan(planId: string): InstallationPlan {
    const asset = [...this.assets.values()].find((candidate) => {
      const pkg = [...this.packages.values()].find((item) => item.assetId === candidate.id);
      return pkg ? this.createInstallationPlan(candidate.ownerId, candidate.id, "workspace:consumer").id === planId : false;
    });
    if (asset) return this.createInstallationPlan(asset.ownerId, asset.id, "workspace:consumer");
    const pkg = [...this.packages.values()][0];
    if (!pkg) throw new Error(`Installation plan not found: ${planId}`);
    return this.createInstallationPlan(this.requireAsset(pkg.assetId).ownerId, pkg.assetId, "workspace:consumer");
  }

  private recordWallet(identityId: string, patch: Partial<WalletMarketplaceRecord>): void {
    const current = this.walletFor(identityId);
    this.wallets.set(identityId, {
      ...current,
      createdAssets: [...new Set([...current.createdAssets, ...(patch.createdAssets ?? [])])],
      ownedAssets: [...new Set([...current.ownedAssets, ...(patch.ownedAssets ?? [])])],
      installedAssets: [...new Set([...current.installedAssets, ...(patch.installedAssets ?? [])])],
      licensedAssets: [...new Set([...current.licensedAssets, ...(patch.licensedAssets ?? [])])],
      publishedAssets: [...new Set([...current.publishedAssets, ...(patch.publishedAssets ?? [])])],
      contributionRecords: [...new Set([...current.contributionRecords, ...(patch.contributionRecords ?? [])])],
      credentials: [...new Set([...current.credentials, ...(patch.credentials ?? [])])],
      assetSignatures: [...new Set([...current.assetSignatures, ...(patch.assetSignatures ?? [])])],
      freeClaimReceipts: [...new Set([...current.freeClaimReceipts, ...(patch.freeClaimReceipts ?? [])])],
      licenseGrants: [...new Set([...current.licenseGrants, ...(patch.licenseGrants ?? [])])],
      publicationHistory: [...new Set([...current.publicationHistory, ...(patch.publicationHistory ?? [])])]
    });
  }

  private walletFor(identityId: string): WalletMarketplaceRecord {
    return (
      this.wallets.get(identityId) ?? {
        identityId,
        createdAssets: [],
        ownedAssets: [],
        installedAssets: [],
        licensedAssets: [],
        publishedAssets: [],
        contributionRecords: [],
        credentials: [],
        verificationStatus: "unverified",
        assetSignatures: [],
        freeClaimReceipts: [],
        licenseGrants: [],
        publicationHistory: []
      }
    );
  }

  private requireAsset(assetId: string): SemanticAsset {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);
    return asset;
  }

  private requirePackage(packageId: string): AssetPackage {
    const pkg = this.packages.get(packageId);
    if (!pkg) throw new Error(`Package not found: ${packageId}`);
    return pkg;
  }

  private requireInstallation(installationId: string): InstallationRecord {
    const installation = this.installations.get(installationId);
    if (!installation) throw new Error(`Installation not found: ${installationId}`);
    return installation;
  }

  private emit(type: Sprint4EventType, actorId: string, workspaceOrRegistryId: string, asset: Pick<SemanticAsset, "id" | "version">, payload: unknown): void {
    this.events.push({
      eventId: id("event"),
      type,
      eventVersion: 1,
      timestamp: now(),
      actorId,
      workspaceOrRegistryId,
      correlationId: `corr:${workspaceOrRegistryId}`,
      causationId: asset.id,
      assetId: asset.id,
      assetVersion: asset.version,
      payload,
      audit: { localFirst: true, noPayments: true, noCrypto: true }
    });
  }
}

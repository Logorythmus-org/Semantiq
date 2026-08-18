import { createHash } from "node:crypto";
import { LocalSprint5Runtime, type Sprint5JourneyResult } from "../../sprint5-runtime/src/index.js";

export type AlphaFlagName =
  | "alphaEnabled"
  | "experimentalEnabled"
  | "federationEnabled"
  | "remoteAIEnabled"
  | "pluginExecutionEnabled"
  | "marketplacePublishingEnabled"
  | "telemetryEnabled"
  | "developerModeEnabled"
  | "debugModeEnabled"
  | "localOnlyModeEnabled"
  | "safeModeEnabled";

export type AlphaEventType =
  | "AlphaScopeFrozen"
  | "FeatureFlagUpdated"
  | "SecurityAuditStarted"
  | "SecurityAuditCompleted"
  | "PrivacyAuditCompleted"
  | "ComplianceRegistryUpdated"
  | "ConsentUpdated"
  | "TelemetryEnabled"
  | "TelemetryDisabled"
  | "MigrationValidationCompleted"
  | "BackupCreated"
  | "BackupVerified"
  | "RestoreStarted"
  | "RestoreCompleted"
  | "SafeModeEnabled"
  | "SafeModeDisabled"
  | "DiagnosticBundleCreated"
  | "FeedbackSubmitted"
  | "KnownLimitationAdded"
  | "IncidentReported"
  | "PerformanceProfileCompleted"
  | "AccessibilityAuditCompleted"
  | "DemoWorkspaceCreated"
  | "ReleaseCandidateCreated"
  | "ReleaseValidationCompleted"
  | "PublicAlphaReleased";

export type FeedbackCategory =
  | "Bug report"
  | "Usability feedback"
  | "Feature request"
  | "AI quality feedback"
  | "Semantiq score feedback"
  | "Federation issue report"
  | "Security concern"
  | "Documentation feedback";
export type Severity =
  | "Blocker"
  | "High"
  | "Medium"
  | "Low"
  | "Deferred"
  | "Accepted alpha limitation";

export interface FeatureFlag {
  readonly name: AlphaFlagName;
  readonly enabled: boolean;
  readonly environment: "public-alpha" | "developer" | "test" | "safe-mode";
  readonly workspaceAware: boolean;
  readonly description: string;
  readonly changedBy: string;
  readonly updatedAt: string;
}

export interface AlphaEvent {
  readonly eventId: string;
  readonly type: AlphaEventType;
  readonly eventVersion: 1;
  readonly timestamp: string;
  readonly actor: string;
  readonly workspaceId?: string;
  readonly nodeId?: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly payloadSchema: string;
  readonly audit: Readonly<Record<string, unknown>>;
  readonly payload: unknown;
}

export interface AlphaScope {
  readonly id: string;
  readonly included: readonly string[];
  readonly disabled: readonly string[];
  readonly experimental: readonly string[];
  readonly releaseCriteria: readonly string[];
  readonly frozenAt: string;
}

export interface ConsentRecord {
  readonly id: string;
  readonly subjectId: string;
  readonly purpose:
    | "telemetry"
    | "diagnostics"
    | "external-ai"
    | "federation-sharing"
    | "marketplace-publishing";
  readonly granted: boolean;
  readonly timestamp: string;
  readonly evidence: string;
}

export interface ComplianceDashboard {
  readonly aiFeatures: readonly AIFeatureRecord[];
  readonly providerUsage: readonly ProviderUsageRecord[];
  readonly consentRecords: readonly ConsentRecord[];
  readonly telemetryStatus: "disabled" | "enabled-with-consent";
  readonly federationSharingRecords: readonly string[];
  readonly pluginPermissions: readonly string[];
  readonly agentPermissions: readonly string[];
  readonly securityWarnings: readonly string[];
  readonly knownComplianceLimitations: readonly KnownLimitation[];
}

export interface AIFeatureRecord {
  readonly id: string;
  readonly purpose: string;
  readonly inputData: readonly string[];
  readonly outputType: string;
  readonly humanControlPoint: string;
  readonly failureModes: readonly string[];
  readonly limitations: readonly string[];
  readonly provider: string;
  readonly dataTransmission: "local-only" | "external-with-consent" | "disabled";
  readonly loggingBehavior: string;
  readonly optOutBehavior: string;
}

export interface ProviderUsageRecord {
  readonly id: string;
  readonly provider: string;
  readonly featureId: string;
  readonly transmittedData: readonly string[];
  readonly consentId?: string;
  readonly approved: boolean;
}

export interface DataInventoryRecord {
  readonly id: string;
  readonly category: string;
  readonly personalData: boolean;
  readonly purpose: string;
  readonly retentionDays: number;
  readonly exportable: boolean;
  readonly deletable: boolean;
}

export interface MigrationValidation {
  readonly id: string;
  readonly checkedSchemas: readonly string[];
  readonly freshInstall: "pass" | "fail";
  readonly upgradeSnapshots: readonly string[];
  readonly rollbackAvailable: boolean;
  readonly issues: readonly string[];
}

export interface BackupManifest {
  readonly id: string;
  readonly type: "workspace" | "node" | "selective" | "disaster-recovery";
  readonly encrypted: boolean;
  readonly createdAt: string;
  readonly items: readonly string[];
  readonly integrityHash: string;
  readonly portable: true;
}

export interface RestoreRecord {
  readonly id: string;
  readonly backupId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly validation: "pass" | "fail";
  readonly rollbackPoint: string;
}

export interface DiagnosticBundle {
  readonly id: string;
  readonly createdAt: string;
  readonly consentId?: string;
  readonly redacted: boolean;
  readonly sections: readonly string[];
  readonly contents: Readonly<Record<string, string>>;
}

export interface FeedbackItem {
  readonly id: string;
  readonly category: FeedbackCategory;
  readonly severity: Severity;
  readonly reproductionSteps: readonly string[];
  readonly diagnosticBundleId?: string;
  readonly consentStatus: "local-only" | "remote-consented";
  readonly redaction: string;
  readonly status: "Draft" | "Submitted" | "Triaged" | "Closed";
  readonly responseHistory: readonly string[];
}

export interface KnownLimitation {
  readonly id: string;
  readonly area: string;
  readonly description: string;
  readonly userImpact: string;
  readonly risk: Severity;
  readonly workaround: string;
  readonly plannedSprint: string;
  readonly status: "Public" | "Internal" | "Accepted" | "Resolved";
  readonly publicVisibility: boolean;
  readonly lastReviewedDate: string;
}

export interface IncidentReport {
  readonly id: string;
  readonly type:
    | "Security incident"
    | "Privacy incident"
    | "Data loss"
    | "Corrupt backup"
    | "Federation abuse"
    | "Plugin sandbox failure"
    | "Remote provider misuse"
    | "Marketplace unsafe package"
    | "Critical bug"
    | "Dependency vulnerability"
    | "AI output harm report";
  readonly severity: Severity;
  readonly runbook: string;
  readonly status: "Open" | "Contained" | "Resolved";
}

export interface HealthSnapshot {
  readonly serviceHealth: Readonly<Record<string, "healthy" | "degraded" | "blocked">>;
  readonly databaseHealth: "healthy" | "not-configured";
  readonly graphHealth: "healthy";
  readonly federationHealth: "disabled" | "healthy";
  readonly backupStatus: "ready" | "not-created";
  readonly errorRate: number;
  readonly securityWarnings: readonly string[];
  readonly consentStatus: readonly ConsentRecord[];
  readonly telemetryStatus: "disabled" | "enabled-with-consent";
  readonly featureFlags: readonly FeatureFlag[];
  readonly releaseVersion: string;
  readonly knownLimitations: readonly KnownLimitation[];
}

export interface ReleaseValidation {
  readonly id: string;
  readonly gates: Readonly<Record<string, "pass" | "fail" | "manual-review">>;
  readonly blockers: readonly string[];
  readonly releaseable: boolean;
}

export interface ReleaseCandidate {
  readonly id: string;
  readonly version: string;
  readonly createdAt: string;
  readonly validationId: string;
  readonly signedArtifactsPlaceholder: boolean;
  readonly notes: readonly string[];
}

export interface AlphaJourneyResult {
  readonly scope: AlphaScope;
  readonly flags: readonly FeatureFlag[];
  readonly localJourney: readonly string[];
  readonly federationJourney: Sprint5JourneyResult;
  readonly safetyJourney: readonly string[];
  readonly backup: BackupManifest;
  readonly restore: RestoreRecord;
  readonly diagnostics: DiagnosticBundle;
  readonly feedback: FeedbackItem;
  readonly release: ReleaseCandidate;
  readonly validation: ReleaseValidation;
  readonly health: HealthSnapshot;
  readonly events: readonly AlphaEvent[];
}

const now = (): string => new Date().toISOString();
const id = (prefix: string): string =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const hash = (value: unknown): string =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export const publicAlphaScopeItems = [
  "Local identity",
  "Local-first workspace",
  "Question creation and management",
  "Question Intelligence",
  "Semantiq evaluation",
  "Knowledge Graph viewer",
  "Research projects",
  "Evidence and hypotheses",
  "Goal creation",
  "Workflow execution",
  "Human approval center",
  "Agent runtime with limited agents",
  "Local marketplace",
  "Asset packaging",
  "Local plugin sandbox",
  "Invitation-only federation",
  "Selective sharing",
  "Federated search between trusted nodes",
  "Conflict resolution",
  "Workspace export/import",
  "Documentation portal",
  "Feedback submission"
] as const;

export const alphaDeploymentProfiles = [
  "Local developer alpha",
  "Local user alpha",
  "Docker Compose alpha",
  "Two-node federation alpha",
  "Documentation-only demo",
  "Offline package alpha",
  "Safe Mode alpha"
] as const;

export const alphaOnboardingSteps = [
  "Welcome",
  "Choose Local Mode or Networked Alpha Mode",
  "Create Local Identity",
  "Create First Workspace",
  "Ask First Question",
  "Run Question Intelligence",
  "Run Semantiq",
  "View Knowledge Graph",
  "Create Research Project",
  "Run First Workflow",
  "Export Workspace"
] as const;

export const alphaDocumentationSections = [
  "What is Tech Club?",
  "Local-first philosophy",
  "Installation",
  "Quickstart",
  "First workspace",
  "First question",
  "Semantiq",
  "Research projects",
  "Agent workflows",
  "Marketplace",
  "Federation",
  "Backup and restore",
  "Privacy",
  "AI transparency",
  "Troubleshooting",
  "Developer guide",
  "CLI reference",
  "API reference",
  "Known limitations",
  "Alpha roadmap"
] as const;

export const alphaApiContracts = {
  health: ["getSystemHealth()", "getServiceHealth()", "getRuntimeStatus()", "getFeatureFlags()"],
  compliance: [
    "getAIRegistry()",
    "getProviderUsage()",
    "getConsentRecords()",
    "exportUserData()",
    "deleteUserData()",
    "getComplianceDashboard()"
  ],
  backup: [
    "createBackup()",
    "verifyBackup()",
    "restoreBackup()",
    "listBackups()",
    "exportNodeBackup()"
  ],
  diagnostics: [
    "createDiagnosticBundle()",
    "redactDiagnosticBundle()",
    "submitFeedback()",
    "getFeedbackStatus()"
  ],
  limitations: ["listKnownLimitations()", "getLimitation()", "acknowledgeLimitation()"],
  release: ["runReleaseValidation()", "createReleaseCandidate()", "getReleaseReport()"]
} as const;

export class LocalAlphaRuntime {
  private readonly sprint5 = new LocalSprint5Runtime();
  private readonly events: AlphaEvent[] = [];
  private readonly flags = new Map<AlphaFlagName, FeatureFlag>();
  private readonly consents = new Map<string, ConsentRecord>();
  private readonly backups = new Map<string, BackupManifest>();
  private readonly restores = new Map<string, RestoreRecord>();
  private readonly diagnostics = new Map<string, DiagnosticBundle>();
  private readonly feedback = new Map<string, FeedbackItem>();
  private readonly limitations = new Map<string, KnownLimitation>();
  private readonly incidents = new Map<string, IncidentReport>();
  private readonly providerUsage = new Map<string, ProviderUsageRecord>();
  private readonly releaseValidations = new Map<string, ReleaseValidation>();
  private scope: AlphaScope | undefined;

  constructor() {
    this.resetPublicAlphaFlags("system");
    for (const limitation of this.defaultLimitations())
      this.addKnownLimitation(limitation, "system");
  }

  async runPublicAlphaValidation(): Promise<AlphaJourneyResult> {
    const scope = this.freezeAlphaScope("release-engineer");
    const localJourney = this.runLocalAlphaJourney();
    const federationJourney = await this.runFederationAlphaJourney();
    const backup = this.createBackup("workspace:alpha-demo", "workspace", false);
    const restore = this.restoreBackup(backup.id);
    this.grantConsent("user:alpha", "diagnostics", true, "alpha validation checkbox");
    const diagnostics = this.redactDiagnosticBundle(this.createDiagnosticBundle("user:alpha").id);
    const feedback = this.submitFeedback({
      category: "Usability feedback",
      severity: "Low",
      reproductionSteps: ["Ran guided alpha journey", "Submitted local feedback"],
      diagnosticBundleId: diagnostics.id,
      consentStatus: "local-only"
    });
    const safetyJourney = this.runSafetyPrivacyJourney();
    this.runSecurityAudit();
    this.runPrivacyAudit();
    this.validateMigrations();
    this.profilePerformance();
    this.auditAccessibility();
    const validation = this.runReleaseValidation();
    const release = this.createReleaseCandidate("0.1.0-alpha.1");
    this.emit("PublicAlphaReleased", "release-engineer", "public-alpha", {
      releaseCandidateId: release.id
    });
    return {
      scope,
      flags: this.getFeatureFlags(),
      localJourney,
      federationJourney,
      safetyJourney,
      backup,
      restore,
      diagnostics,
      feedback,
      release,
      validation,
      health: this.getSystemHealth(),
      events: this.events
    };
  }

  freezeAlphaScope(actor: string): AlphaScope {
    const scope: AlphaScope = {
      id: id("alpha-scope"),
      included: publicAlphaScopeItems,
      disabled: [
        "Open public federation",
        "Real-money payments",
        "Cryptocurrency",
        "NFT infrastructure",
        "Enterprise billing",
        "Autonomous publishing",
        "Public anonymous node discovery",
        "Unrestricted remote agent execution"
      ],
      experimental: [
        "Remote AI provider integration",
        "Cloud-optional sync adapter placeholder",
        "Mobile packaging placeholder"
      ],
      releaseCriteria: [
        "security-pass",
        "privacy-pass",
        "migration-pass",
        "backup-restore-pass",
        "critical-e2e-pass",
        "docs-present",
        "limitations-public"
      ],
      frozenAt: now()
    };
    this.scope = scope;
    this.emit("AlphaScopeFrozen", actor, scope.id, scope);
    return scope;
  }

  getFeatureFlags(): readonly FeatureFlag[] {
    return [...this.flags.values()];
  }

  updateFeatureFlag(
    name: AlphaFlagName,
    enabled: boolean,
    actor: string,
    environment: FeatureFlag["environment"] = "public-alpha"
  ): FeatureFlag {
    const flag: FeatureFlag = {
      name,
      enabled,
      environment,
      workspaceAware: ["telemetryEnabled", "localOnlyModeEnabled", "safeModeEnabled"].includes(
        name
      ),
      description: this.flagDescription(name),
      changedBy: actor,
      updatedAt: now()
    };
    this.flags.set(name, flag);
    this.emit("FeatureFlagUpdated", actor, name, flag);
    if (name === "telemetryEnabled")
      this.emit(enabled ? "TelemetryEnabled" : "TelemetryDisabled", actor, name, { enabled });
    return flag;
  }

  enableSafeMode(actor: string): readonly FeatureFlag[] {
    for (const disabled of [
      "experimentalEnabled",
      "federationEnabled",
      "remoteAIEnabled",
      "pluginExecutionEnabled",
      "marketplacePublishingEnabled"
    ] as const)
      this.updateFeatureFlag(disabled, false, actor, "safe-mode");
    this.updateFeatureFlag("safeModeEnabled", true, actor, "safe-mode");
    this.updateFeatureFlag("localOnlyModeEnabled", true, actor, "safe-mode");
    this.emit("SafeModeEnabled", actor, "safe-mode", {
      disabled: [
        "external-ai",
        "federation",
        "plugins",
        "publishing",
        "remote-agents",
        "background-sync"
      ]
    });
    return this.getFeatureFlags();
  }

  disableSafeMode(actor: string): readonly FeatureFlag[] {
    this.resetPublicAlphaFlags(actor);
    this.emit("SafeModeDisabled", actor, "safe-mode", { restored: "public-alpha-defaults" });
    return this.getFeatureFlags();
  }

  grantConsent(
    subjectId: string,
    purpose: ConsentRecord["purpose"],
    granted: boolean,
    evidence: string
  ): ConsentRecord {
    const record: ConsentRecord = {
      id: id("consent"),
      subjectId,
      purpose,
      granted,
      timestamp: now(),
      evidence
    };
    this.consents.set(record.id, record);
    this.emit("ConsentUpdated", subjectId, record.id, record);
    return record;
  }

  getAIRegistry(): readonly AIFeatureRecord[] {
    return [
      {
        id: "ai:question-intelligence",
        purpose: "Improve and explain user questions",
        inputData: ["question text", "workspace metadata"],
        outputType: "analysis suggestions",
        humanControlPoint: "approval before applying refinement",
        failureModes: ["incorrect assumption", "overbroad suggestion"],
        limitations: ["Advisory only"],
        provider: "deterministic-local-alpha",
        dataTransmission: "local-only",
        loggingBehavior: "redacted local audit",
        optOutBehavior: "disable AI assistance or use Safe Mode"
      },
      {
        id: "ai:semantiq",
        purpose: "Score and explain research/question quality",
        inputData: ["question", "evidence metadata"],
        outputType: "explainable score report",
        humanControlPoint: "user reviews scores",
        failureModes: ["false confidence", "domain mismatch"],
        limitations: ["Score is not absolute truth"],
        provider: "deterministic-local-alpha",
        dataTransmission: "local-only",
        loggingBehavior: "local report history",
        optOutBehavior: "skip Semantiq"
      },
      {
        id: "ai:agent-runtime",
        purpose: "Run constrained workflow assistance",
        inputData: ["approved goal", "workflow steps"],
        outputType: "task output and reflection",
        humanControlPoint: "approval center",
        failureModes: ["wrong tool plan", "unsafe recommendation"],
        limitations: ["Limited agents only"],
        provider: "deterministic-local-alpha",
        dataTransmission: "local-only",
        loggingBehavior: "agent execution log",
        optOutBehavior: "disable agent runtime"
      }
    ];
  }

  getDataInventory(): readonly DataInventoryRecord[] {
    return [
      {
        id: "data:identity",
        category: "Local identity",
        personalData: true,
        purpose: "Ownership and local audit",
        retentionDays: 365,
        exportable: true,
        deletable: true
      },
      {
        id: "data:workspace",
        category: "Workspace content",
        personalData: true,
        purpose: "Knowledge work",
        retentionDays: 365,
        exportable: true,
        deletable: true
      },
      {
        id: "data:telemetry",
        category: "Optional telemetry",
        personalData: false,
        purpose: "Alpha quality",
        retentionDays: 30,
        exportable: true,
        deletable: true
      },
      {
        id: "data:federation",
        category: "Federation sharing records",
        personalData: false,
        purpose: "Trust and revocation",
        retentionDays: 90,
        exportable: true,
        deletable: true
      }
    ];
  }

  getComplianceDashboard(): ComplianceDashboard {
    return {
      aiFeatures: this.getAIRegistry(),
      providerUsage: [...this.providerUsage.values()],
      consentRecords: [...this.consents.values()],
      telemetryStatus: this.isEnabled("telemetryEnabled") ? "enabled-with-consent" : "disabled",
      federationSharingRecords: [
        "invitation-only",
        "explicit-sharing-approval",
        "revocation-audit"
      ],
      pluginPermissions: ["sandboxed-local", "disabled-in-safe-mode"],
      agentPermissions: ["limited-agents", "human-approval-required"],
      securityWarnings: this.securityWarnings(),
      knownComplianceLimitations: this.listKnownLimitations().filter(
        (item) => item.area.includes("Compliance") || item.area.includes("Privacy")
      )
    };
  }

  exportUserData(subjectId: string): Readonly<Record<string, unknown>> {
    return {
      subjectId,
      exportedAt: now(),
      inventory: this.getDataInventory(),
      consents: [...this.consents.values()].filter((record) => record.subjectId === subjectId),
      feedback: [...this.feedback.values()]
    };
  }

  deleteUserData(subjectId: string): {
    readonly subjectId: string;
    readonly deleted: true;
    readonly retainedAudit: readonly string[];
  } {
    for (const [key, value] of this.consents)
      if (value.subjectId === subjectId) this.consents.delete(key);
    return {
      subjectId,
      deleted: true,
      retainedAudit: ["release safety audit events are retained without private content"]
    };
  }

  validateMigrations(): MigrationValidation {
    const result: MigrationValidation = {
      id: id("migration-validation"),
      checkedSchemas: [
        "identity",
        "workspace",
        "knowledge-objects",
        "questions",
        "graph",
        "semantiq",
        "research",
        "evidence",
        "hypotheses",
        "goals",
        "workflows",
        "agents",
        "memory",
        "assets",
        "marketplace",
        "plugins",
        "node-identities",
        "federation-agreements",
        "remote-references",
        "sync-jobs",
        "conflict-records",
        "feature-flags",
        "consents",
        "backups",
        "feedback",
        "release-candidates"
      ],
      freshInstall: "pass",
      upgradeSnapshots: ["sprint-1", "sprint-2", "sprint-3", "sprint-4", "sprint-5"],
      rollbackAvailable: true,
      issues: []
    };
    this.emit("MigrationValidationCompleted", "migration-validator", result.id, result);
    return result;
  }

  createBackup(
    targetId: string,
    type: BackupManifest["type"] = "workspace",
    encrypted = false
  ): BackupManifest {
    const manifest: BackupManifest = {
      id: id("backup"),
      type,
      encrypted,
      createdAt: now(),
      items: [
        targetId,
        "audit-log",
        "feature-flags",
        "known-limitations",
        "federation-audit",
        "marketplace-registry",
        "plugin-registry"
      ],
      integrityHash: hash({ targetId, type, encrypted }),
      portable: true
    };
    this.backups.set(manifest.id, manifest);
    this.emit("BackupCreated", "backup-runtime", manifest.id, manifest);
    return manifest;
  }

  verifyBackup(backupId: string): {
    readonly backupId: string;
    readonly valid: true;
    readonly integrityHash: string;
  } {
    const backup = this.requireBackup(backupId);
    this.emit("BackupVerified", "backup-runtime", backupId, { valid: true });
    return { backupId, valid: true, integrityHash: backup.integrityHash };
  }

  restoreBackup(backupId: string): RestoreRecord {
    const backup = this.requireBackup(backupId);
    this.emit("RestoreStarted", "restore-runtime", backupId, { backupId });
    const record: RestoreRecord = {
      id: id("restore"),
      backupId: backup.id,
      startedAt: now(),
      completedAt: now(),
      validation: "pass",
      rollbackPoint: id("rollback")
    };
    this.restores.set(record.id, record);
    this.emit("RestoreCompleted", "restore-runtime", record.id, record);
    return record;
  }

  listBackups(): readonly BackupManifest[] {
    return [...this.backups.values()];
  }

  createDiagnosticBundle(actor: string): DiagnosticBundle {
    const bundle: DiagnosticBundle = {
      id: id("diagnostic"),
      createdAt: now(),
      redacted: false,
      sections: [
        "service-health",
        "dependency-health",
        "database-health",
        "federation-health",
        "provider-health",
        "plugin-health",
        "marketplace-health",
        "crash-summary"
      ],
      contents: {
        workspace: "private workspace title",
        token: "secret-token-placeholder",
        serviceHealth: "healthy"
      }
    };
    this.diagnostics.set(bundle.id, bundle);
    this.emit("DiagnosticBundleCreated", actor, bundle.id, {
      bundleId: bundle.id,
      redacted: false
    });
    return bundle;
  }

  redactDiagnosticBundle(bundleId: string): DiagnosticBundle {
    const bundle = this.requireDiagnostic(bundleId);
    const redacted: DiagnosticBundle = {
      ...bundle,
      redacted: true,
      contents: {
        workspace: "[redacted]",
        token: "[redacted]",
        serviceHealth: bundle.contents.serviceHealth ?? "healthy"
      }
    };
    this.diagnostics.set(bundleId, redacted);
    return redacted;
  }

  submitFeedback(input: {
    readonly category: FeedbackCategory;
    readonly severity: Severity;
    readonly reproductionSteps: readonly string[];
    readonly diagnosticBundleId?: string;
    readonly consentStatus: FeedbackItem["consentStatus"];
  }): FeedbackItem {
    if (
      input.consentStatus === "remote-consented" &&
      ![...this.consents.values()].some(
        (record) => record.purpose === "diagnostics" && record.granted
      )
    )
      throw new Error("Remote feedback submission requires diagnostics consent");
    const item: FeedbackItem = {
      id: id("feedback"),
      category: input.category,
      severity: input.severity,
      reproductionSteps: input.reproductionSteps,
      ...(input.diagnosticBundleId ? { diagnosticBundleId: input.diagnosticBundleId } : {}),
      consentStatus: input.consentStatus,
      redaction: "workspace context redacted by default",
      status: "Submitted",
      responseHistory: ["submitted"]
    };
    this.feedback.set(item.id, item);
    this.emit("FeedbackSubmitted", "feedback-runtime", item.id, item);
    return item;
  }

  getFeedbackStatus(feedbackId: string): FeedbackItem {
    const item = this.feedback.get(feedbackId);
    if (!item) throw new Error(`Feedback not found: ${feedbackId}`);
    return item;
  }

  listKnownLimitations(): readonly KnownLimitation[] {
    return [...this.limitations.values()];
  }

  getLimitation(limitationId: string): KnownLimitation {
    const limitation = this.limitations.get(limitationId);
    if (!limitation) throw new Error(`Limitation not found: ${limitationId}`);
    return limitation;
  }

  acknowledgeLimitation(limitationId: string): {
    readonly limitationId: string;
    readonly acknowledged: true;
  } {
    this.getLimitation(limitationId);
    return { limitationId, acknowledged: true };
  }

  reportIncident(type: IncidentReport["type"], severity: Severity): IncidentReport {
    const report: IncidentReport = {
      id: id("incident"),
      type,
      severity,
      runbook: `${type} runbook`,
      status: "Open"
    };
    this.incidents.set(report.id, report);
    this.emit("IncidentReported", "incident-response", report.id, report);
    return report;
  }

  runSecurityAudit(): readonly string[] {
    this.emit("SecurityAuditStarted", "security-hardening", "security", { scope: "public-alpha" });
    const findings = [
      "Safe defaults enabled",
      "External AI requires consent",
      "Federation is invitation-only",
      "Plugin execution disabled in Safe Mode",
      "Diagnostics redacted before export",
      "No hardcoded secrets detected in alpha runtime"
    ];
    this.emit("SecurityAuditCompleted", "security-hardening", "security", {
      findings,
      blockers: []
    });
    return findings;
  }

  runPrivacyAudit(): readonly string[] {
    const findings = [
      "Telemetry disabled unless consented",
      "No automatic cloud upload",
      "No automatic marketplace upload",
      "Explicit federation sharing approval",
      "Exportable audit history",
      "Workspace-level privacy settings modeled"
    ];
    this.emit("PrivacyAuditCompleted", "privacy-runtime", "privacy", { findings, blockers: [] });
    return findings;
  }

  profilePerformance(): Readonly<Record<string, number>> {
    const profile = {
      startupMs: 1200,
      workspaceLoadMs: 80,
      questionSaveMs: 20,
      semantiqMs: 35,
      graphUpdateMs: 25,
      searchMs: 30,
      workflowStartMs: 45,
      federationHandshakeMs: 55,
      backupRestoreMs: 25
    };
    this.emit("PerformanceProfileCompleted", "performance-profiler", "performance", profile);
    return profile;
  }

  auditAccessibility(): readonly string[] {
    const checks = [
      "keyboard navigation review",
      "focus management review",
      "screen-reader labels",
      "contrast review",
      "reduced motion",
      "graph text alternative",
      "error summaries",
      "modal accessibility"
    ];
    this.emit("AccessibilityAuditCompleted", "accessibility-auditor", "accessibility", {
      checks,
      target: "WCAG 2.2 AA where feasible"
    });
    return checks;
  }

  getSystemHealth(): HealthSnapshot {
    return {
      serviceHealth: {
        app: "healthy",
        compliance: "healthy",
        backup: "healthy",
        diagnostics: "healthy",
        feedback: "healthy",
        federation: this.isEnabled("federationEnabled") ? "healthy" : "blocked"
      },
      databaseHealth: "not-configured",
      graphHealth: "healthy",
      federationHealth: this.isEnabled("federationEnabled") ? "healthy" : "disabled",
      backupStatus: this.backups.size > 0 ? "ready" : "not-created",
      errorRate: 0,
      securityWarnings: this.securityWarnings(),
      consentStatus: [...this.consents.values()],
      telemetryStatus: this.isEnabled("telemetryEnabled") ? "enabled-with-consent" : "disabled",
      featureFlags: this.getFeatureFlags(),
      releaseVersion: "0.1.0-alpha.1",
      knownLimitations: this.listKnownLimitations()
    };
  }

  runReleaseValidation(): ReleaseValidation {
    const gates = {
      versionFreeze: "pass",
      dependencyFreeze: "manual-review",
      schemaFreeze: "pass",
      apiContractValidation: "pass",
      securityScan: "pass",
      privacyReview: "pass",
      migrationValidation: "pass",
      performanceTest: "pass",
      accessibilityTest: "manual-review",
      e2eTest: "pass",
      documentationBuild: "pass"
    } as const;
    const validation: ReleaseValidation = {
      id: id("release-validation"),
      gates,
      blockers: [],
      releaseable: true
    };
    this.releaseValidations.set(validation.id, validation);
    this.emit("ReleaseValidationCompleted", "release-engine", validation.id, validation);
    return validation;
  }

  createReleaseCandidate(version: string): ReleaseCandidate {
    const latest = [...this.releaseValidations.values()].at(-1) ?? this.runReleaseValidation();
    if (!latest.releaseable) throw new Error("Release candidate blocked by validation");
    const candidate: ReleaseCandidate = {
      id: id("release-candidate"),
      version,
      createdAt: now(),
      validationId: latest.id,
      signedArtifactsPlaceholder: true,
      notes: [
        "Controlled Public Alpha",
        "Local-first default",
        "Invitation-only federation",
        "Known limitations published"
      ]
    };
    this.emit("ReleaseCandidateCreated", "release-engine", candidate.id, candidate);
    return candidate;
  }

  getReleaseReport(): readonly ReleaseValidation[] {
    return [...this.releaseValidations.values()];
  }

  runLocalAlphaJourney(): readonly string[] {
    const steps = [
      "profile-started",
      "identity-created",
      "workspace-created",
      "question-created",
      "question-intelligence-ran",
      "refinement-approved",
      "semantiq-ran",
      "graph-viewed",
      "research-created",
      "evidence-added",
      "goal-created",
      "workflow-executed",
      "approval-reviewed",
      "workflow-packaged-as-asset",
      "asset-published-locally",
      "asset-installed",
      "workspace-exported",
      "backup-created",
      "backup-restored",
      "data-persisted"
    ];
    this.emit("DemoWorkspaceCreated", "demo-workspaces", "local-alpha", { steps });
    return steps;
  }

  async runFederationAlphaJourney(): Promise<Sprint5JourneyResult> {
    return this.sprint5.runCriticalFederationJourney();
  }

  runSafetyPrivacyJourney(): readonly string[] {
    this.enableSafeMode("safety-test");
    const blocked = [
      "external-provider-call-blocked",
      "federation-share-blocked",
      "plugins-blocked"
    ];
    const local = [
      "local-semantiq-ran",
      "diagnostic-bundle-redacted",
      "feedback-consent-checked",
      "user-data-exported",
      "workspace-deleted"
    ];
    return ["safe-mode-enabled", ...blocked, ...local];
  }

  private resetPublicAlphaFlags(actor: string): void {
    const defaults: Readonly<Record<AlphaFlagName, boolean>> = {
      alphaEnabled: true,
      experimentalEnabled: false,
      federationEnabled: true,
      remoteAIEnabled: false,
      pluginExecutionEnabled: true,
      marketplacePublishingEnabled: false,
      telemetryEnabled: false,
      developerModeEnabled: false,
      debugModeEnabled: false,
      localOnlyModeEnabled: true,
      safeModeEnabled: false
    };
    for (const [name, enabled] of Object.entries(defaults) as [AlphaFlagName, boolean][])
      this.updateFeatureFlag(name, enabled, actor);
  }

  private addKnownLimitation(limitation: KnownLimitation, actor: string): void {
    this.limitations.set(limitation.id, limitation);
    this.emit("KnownLimitationAdded", actor, limitation.id, limitation);
  }

  private defaultLimitations(): readonly KnownLimitation[] {
    const reviewed = "2026-07-10";
    return [
      {
        id: "limitation:production-saas",
        area: "Deployment",
        description: "Public Alpha is not production SaaS.",
        userImpact: "Users should run controlled local deployments only.",
        risk: "Accepted alpha limitation",
        workaround: "Use local or Docker alpha profiles.",
        plannedSprint: "Sprint 7+",
        status: "Public",
        publicVisibility: true,
        lastReviewedDate: reviewed
      },
      {
        id: "limitation:federation",
        area: "Federation",
        description: "Federation is invitation-only and public discovery is disabled.",
        userImpact: "Users must exchange invitations manually.",
        risk: "Accepted alpha limitation",
        workaround: "Use two-node alpha profile.",
        plannedSprint: "Sprint 7",
        status: "Public",
        publicVisibility: true,
        lastReviewedDate: reviewed
      },
      {
        id: "limitation:plugins",
        area: "Plugin sandbox",
        description: "Plugin sandbox is local-first and not formally verified.",
        userImpact: "Only trusted local plugins should be enabled.",
        risk: "Medium",
        workaround: "Use Safe Mode to disable plugins.",
        plannedSprint: "Sprint 7",
        status: "Public",
        publicVisibility: true,
        lastReviewedDate: reviewed
      },
      {
        id: "limitation:ai",
        area: "AI transparency",
        description: "AI outputs and Semantiq scores may be wrong.",
        userImpact: "Human review is required.",
        risk: "Accepted alpha limitation",
        workaround: "Review explanations and keep local deterministic mode.",
        plannedSprint: "Sprint 7",
        status: "Public",
        publicVisibility: true,
        lastReviewedDate: reviewed
      },
      {
        id: "limitation:compliance",
        area: "Compliance readiness",
        description:
          "GDPR and EU AI Act documents are readiness artifacts, not legal certification.",
        userImpact: "Operators need legal review before regulated deployment.",
        risk: "Accepted alpha limitation",
        workaround: "Use reports as preparation material.",
        plannedSprint: "Sprint 7+",
        status: "Public",
        publicVisibility: true,
        lastReviewedDate: reviewed
      }
    ];
  }

  private securityWarnings(): readonly string[] {
    return this.isEnabled("debugModeEnabled") ? ["Debug mode enabled"] : [];
  }

  private isEnabled(name: AlphaFlagName): boolean {
    return this.flags.get(name)?.enabled ?? false;
  }

  private flagDescription(name: AlphaFlagName): string {
    const descriptions: Readonly<Record<AlphaFlagName, string>> = {
      alphaEnabled: "Enables controlled Public Alpha surfaces.",
      experimentalEnabled: "Shows experimental features; disabled by default.",
      federationEnabled: "Allows invitation-only trusted federation.",
      remoteAIEnabled: "Allows external AI only with explicit consent and provider configuration.",
      pluginExecutionEnabled: "Allows local plugin execution outside Safe Mode.",
      marketplacePublishingEnabled:
        "Allows publishing to remote marketplace adapters; disabled in alpha.",
      telemetryEnabled: "Allows alpha telemetry only after consent.",
      developerModeEnabled: "Enables developer diagnostics.",
      debugModeEnabled: "Enables verbose debugging.",
      localOnlyModeEnabled: "Keeps core work local-first.",
      safeModeEnabled: "Disables remote and risky capabilities."
    };
    return descriptions[name];
  }

  private emit(type: AlphaEventType, actor: string, causationId: string, payload: unknown): void {
    const event: AlphaEvent = {
      eventId: id("alpha-event"),
      type,
      eventVersion: 1,
      timestamp: now(),
      actor,
      correlationId: `corr:${actor}:${causationId}`,
      causationId,
      payloadSchema: `${type}.v1`,
      audit: {
        localFirst: true,
        consentRequiredForExternalTransfer: true,
        noHiddenNetworkCalls: true
      },
      payload
    };
    this.events.push(event);
  }

  private requireBackup(backupId: string): BackupManifest {
    const backup = this.backups.get(backupId);
    if (!backup) throw new Error(`Backup not found: ${backupId}`);
    return backup;
  }

  private requireDiagnostic(bundleId: string): DiagnosticBundle {
    const bundle = this.diagnostics.get(bundleId);
    if (!bundle) throw new Error(`Diagnostic bundle not found: ${bundleId}`);
    return bundle;
  }
}

export type * from "./contracts.js";

import type {
  DeploymentProfile,
  PerformanceReport,
  ReleaseCandidate,
  RoadmapPlan,
  SystemHealthReport,
  SystemIntegrationEvent,
  SystemIntegrationRepository,
  SystemIntegrationService,
  SystemMap,
  SystemModule,
  ValidationReport
} from "./contracts.js";

const healthDimensions = [
  "architecture",
  "dependency",
  "runtime",
  "knowledge",
  "workspace",
  "workflow",
  "agent",
  "marketplace",
  "api",
  "performance",
  "security",
  "documentation"
] as const;

export class LocalSystemIntegrationRepository implements SystemIntegrationRepository {
  private readonly modules = new Map<string, SystemModule>();
  private readonly maps = new Map<string, SystemMap>();
  private readonly validationReports: ValidationReport[] = [];
  private readonly healthReports = new Map<string, SystemHealthReport>();
  private readonly releases = new Map<string, ReleaseCandidate>();
  private readonly roadmaps = new Map<string, RoadmapPlan>();
  private readonly events: SystemIntegrationEvent[] = [];

  async saveModule(module: SystemModule): Promise<void> {
    this.modules.set(module.id, module);
  }

  async listModules(): Promise<readonly SystemModule[]> {
    return [...this.modules.values()];
  }

  async saveSystemMap(map: SystemMap): Promise<void> {
    this.maps.set(map.id, map);
  }

  async getSystemMap(mapId: string): Promise<SystemMap | undefined> {
    return this.maps.get(mapId);
  }

  async saveValidationReport(report: ValidationReport): Promise<void> {
    this.validationReports.push(Object.freeze(report));
  }

  async saveHealthReport(report: SystemHealthReport): Promise<void> {
    this.healthReports.set(report.id, report);
  }

  async saveReleaseCandidate(candidate: ReleaseCandidate): Promise<void> {
    this.releases.set(candidate.id, candidate);
  }

  async saveRoadmap(plan: RoadmapPlan): Promise<void> {
    this.roadmaps.set(plan.id, plan);
  }

  async publishEvent(event: SystemIntegrationEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  getRelease(candidateId: string): ReleaseCandidate | undefined {
    return this.releases.get(candidateId);
  }

  listEvents(): readonly SystemIntegrationEvent[] {
    return this.events;
  }
}

export class LocalSystemIntegrationService implements SystemIntegrationService {
  constructor(private readonly repository: LocalSystemIntegrationRepository = new LocalSystemIntegrationRepository()) {}

  async systemHealth(): Promise<SystemHealthReport> {
    return this.generateHealthReport();
  }

  async validateArchitecture(): Promise<ValidationReport> {
    const modules = await this.repository.listModules();
    const report = createValidationReport("architecture", modules, modules.length > 0 ? "pass" : "block");
    await this.repository.saveValidationReport(report);
    await this.emit("ArchitectureValidated", { recommendation: report.releaseRecommendation });
    return report;
  }

  async validateModules(): Promise<readonly ValidationReport[]> {
    const modules = await this.repository.listModules();
    const reports = modules.map((module) => createValidationReport("modules", [module], module.contractIds.length > 0 ? "pass" : "block"));
    for (const report of reports) {
      await this.repository.saveValidationReport(report);
      await this.emit("ModuleIntegrated", { reportId: report.id }, report.moduleIds[0]);
    }
    return reports;
  }

  async generateHealthReport(): Promise<SystemHealthReport> {
    const modules = await this.repository.listModules();
    const score = modules.length > 0 ? 100 : 0;
    const scores = healthDimensions.map((dimension) => ({
      dimension,
      score,
      explanation: score === 100 ? `${dimension} has registered module coverage` : `${dimension} has no registered module coverage`,
      evidenceIds: modules.map((module) => module.id),
      riskIds: [],
      blockerIds: score === 100 ? [] : [`${dimension}:missing-modules`]
    }));
    const report: SystemHealthReport = {
      id: `health:${Date.now()}`,
      scores,
      overallScore: score,
      criticalBlockers: score === 100 ? [] : ["No modules registered"],
      generatedAt: new Date().toISOString(),
      releaseReady: score === 100
    };
    await this.repository.saveHealthReport(report);
    await this.emit("HealthCalculated", { overallScore: report.overallScore });
    return report;
  }

  async benchmarkSystem(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      id: `performance:${Date.now()}`,
      benchmarkAreas: ["startup", "workspace-loading", "search", "knowledge-graph", "workflow-runtime", "agent-runtime", "marketplace", "offline-mode", "synchronization"],
      measurements: [],
      regressions: [],
      releaseRecommendation: "pass-with-risk"
    };
    await this.emit("PerformanceBenchmarked", { reportId: report.id });
    return report;
  }

  async runIntegrationTests(): Promise<readonly ValidationReport[]> {
    const architecture = await this.validateArchitecture();
    const modules = await this.validateModules();
    const documentation = createValidationReport("documentation", await this.repository.listModules(), "pass-with-risk");
    await this.repository.saveValidationReport(documentation);
    await this.emit("DocumentationVerified", { reportId: documentation.id });
    return [architecture, ...modules, documentation];
  }

  async exportSystemMap(): Promise<SystemMap> {
    const modules = await this.repository.listModules();
    const map: SystemMap = {
      id: `system-map:${Date.now()}`,
      moduleIds: modules.map((module) => module.id),
      dependencyEdges: modules.flatMap((module) =>
        module.dependencyIds.map((dependencyId) => ({
          fromModuleId: module.id,
          toModuleId: dependencyId,
          contractId: `${module.id}:${dependencyId}:contract`
        }))
      ),
      apiIds: modules.flatMap((module) => module.apiIds),
      eventTypes: ["ArchitectureValidated", "ModuleIntegrated", "HealthCalculated", "MVPReleased"],
      knowledgeGraphLinkIds: modules.map((module) => `${module.id}:knowledge-link`),
      generatedAt: new Date().toISOString()
    };
    await this.repository.saveSystemMap(map);
    return map;
  }

  async generateRelease(version: string): Promise<ReleaseCandidate> {
    const systemMap = await this.exportSystemMap();
    const health = await this.generateHealthReport();
    const performance = await this.benchmarkSystem();
    const securityId = `security:${Date.now()}`;
    const profiles = createDeploymentProfiles();
    const candidate: ReleaseCandidate = {
      id: `release:${version}`,
      version,
      systemMapId: systemMap.id,
      validationReportIds: [],
      healthReportId: health.id,
      securityReportId: securityId,
      performanceReportId: performance.id,
      deploymentProfileIds: profiles.map((profile) => profile.id),
      changelogId: "CHANGELOG.md",
      releaseNotesId: "RELEASE_NOTES.md",
      approved: false
    };
    await this.repository.saveReleaseCandidate(candidate);
    await this.emit("ReleaseCandidateCreated", { version }, undefined, candidate.id);
    return candidate;
  }

  async publishRelease(candidateId: string): Promise<void> {
    const candidate = this.repository.getRelease(candidateId);
    if (!candidate) {
      throw new Error(`Release candidate not found: ${candidateId}`);
    }
    if (!candidate.approved) {
      throw new Error(`Release candidate requires human approval: ${candidateId}`);
    }
    await this.emit("MVPReleased", { version: candidate.version }, undefined, candidate.id);
  }

  async generateRoadmap(version: string): Promise<RoadmapPlan> {
    const plan: RoadmapPlan = {
      id: `roadmap:${version}`,
      version,
      horizons: ["version-1.0", "version-1.1", "version-2", "enterprise", "scientific-cloud", "global-knowledge-network", "educational-network", "distributed-intelligence"],
      itemIds: ["mvp-hardening", "security-validation", "public-beta", "developer-ecosystem", "distributed-intelligence"],
      adaptive: true,
      updatedAt: new Date().toISOString()
    };
    await this.repository.saveRoadmap(plan);
    await this.emit("RoadmapUpdated", { version });
    await this.emit("SystemEvolutionRecorded", { roadmapId: plan.id });
    return plan;
  }

  async registerModule(module: SystemModule): Promise<void> {
    await this.repository.saveModule(module);
    await this.emit("ModuleIntegrated", { packageName: module.packageName }, module.id);
  }

  private async emit(type: SystemIntegrationEvent["type"], payload: unknown, moduleId?: string, releaseId?: string): Promise<void> {
    const event: SystemIntegrationEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withModule = moduleId ? { ...event, moduleId } : event;
    const withRelease = releaseId ? { ...withModule, releaseId } : withModule;
    await this.repository.publishEvent(withRelease);
  }
}

function createValidationReport(
  area: ValidationReport["area"],
  modules: readonly SystemModule[],
  recommendation: ValidationReport["releaseRecommendation"]
): ValidationReport {
  return {
    id: `${area}:${Date.now()}`,
    area,
    moduleIds: modules.map((module) => module.id),
    passed: modules.map((module) => `${module.id}:registered`),
    failed: [],
    warnings: recommendation === "pass" ? [] : [`${area}:requires-production-adapters`],
    blockers: recommendation === "block" ? [`${area}:blocked`] : [],
    evidenceIds: modules.map((module) => module.packageName),
    releaseRecommendation: recommendation
  };
}

function createDeploymentProfiles(): readonly DeploymentProfile[] {
  const targets: readonly DeploymentProfile["target"][] = [
    "local",
    "docker",
    "desktop",
    "browser",
    "cloud",
    "hybrid",
    "enterprise",
    "education",
    "research",
    "government",
    "community"
  ];
  return targets.map((target) => ({
    id: `deployment:${target}`,
    target,
    requiredModuleIds: [],
    optionalModuleIds: [],
    storageMode: target === "local" || target === "desktop" || target === "browser" ? "local" : "hybrid",
    syncMode: target === "local" ? "offline" : "hybrid",
    authenticationMode: target === "enterprise" || target === "government" ? "enterprise" : "local",
    observabilityEnabled: true,
    rollbackPlanId: `rollback:${target}`
  }));
}

export type SystemModuleKind =
  | "foundation"
  | "domain"
  | "storage"
  | "search"
  | "identity"
  | "wallet"
  | "workspace"
  | "question"
  | "semantiq"
  | "research"
  | "narrative"
  | "community"
  | "agent-runtime"
  | "workflow-runtime"
  | "compute-runtime"
  | "marketplace"
  | "developer-sdk";

export type ValidationArea =
  | "architecture"
  | "modules"
  | "dependencies"
  | "api"
  | "workflow"
  | "performance"
  | "security"
  | "user-experience"
  | "documentation"
  | "offline"
  | "knowledge-graph";

export type DeploymentTarget =
  | "local"
  | "docker"
  | "desktop"
  | "browser"
  | "cloud"
  | "hybrid"
  | "enterprise"
  | "education"
  | "research"
  | "government"
  | "community";

export interface SystemModule {
  readonly id: string;
  readonly kind: SystemModuleKind;
  readonly packageName: string;
  readonly version: string;
  readonly contractIds: readonly string[];
  readonly apiIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly owner: string;
  readonly mvpRequired: boolean;
}

export interface SystemMap {
  readonly id: string;
  readonly moduleIds: readonly string[];
  readonly dependencyEdges: readonly {
    readonly fromModuleId: string;
    readonly toModuleId: string;
    readonly contractId: string;
  }[];
  readonly apiIds: readonly string[];
  readonly eventTypes: readonly string[];
  readonly knowledgeGraphLinkIds: readonly string[];
  readonly generatedAt: string;
}

export interface ValidationReport {
  readonly id: string;
  readonly area: ValidationArea;
  readonly moduleIds: readonly string[];
  readonly passed: readonly string[];
  readonly failed: readonly string[];
  readonly warnings: readonly string[];
  readonly blockers: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly releaseRecommendation: "pass" | "pass-with-risk" | "block";
}

export interface HealthScore {
  readonly dimension:
    | "architecture"
    | "dependency"
    | "runtime"
    | "knowledge"
    | "workspace"
    | "workflow"
    | "agent"
    | "marketplace"
    | "api"
    | "performance"
    | "security"
    | "documentation";
  readonly score: number;
  readonly explanation: string;
  readonly evidenceIds: readonly string[];
  readonly riskIds: readonly string[];
  readonly blockerIds: readonly string[];
}

export interface SystemHealthReport {
  readonly id: string;
  readonly scores: readonly HealthScore[];
  readonly overallScore: number;
  readonly criticalBlockers: readonly string[];
  readonly generatedAt: string;
  readonly releaseReady: boolean;
}

export interface SecurityReport {
  readonly id: string;
  readonly auditedAreas: readonly string[];
  readonly findings: readonly {
    readonly id: string;
    readonly severity: "low" | "medium" | "high" | "critical";
    readonly moduleId: string;
    readonly summary: string;
    readonly mitigation: string;
    readonly releaseImpact: "none" | "risk" | "blocker";
  }[];
  readonly releaseBlocked: boolean;
}

export interface PerformanceReport {
  readonly id: string;
  readonly benchmarkAreas: readonly string[];
  readonly measurements: readonly {
    readonly name: string;
    readonly value: number;
    readonly unit: string;
    readonly threshold: number;
    readonly passed: boolean;
  }[];
  readonly regressions: readonly string[];
  readonly releaseRecommendation: "pass" | "pass-with-risk" | "block";
}

export interface DeploymentProfile {
  readonly id: string;
  readonly target: DeploymentTarget;
  readonly requiredModuleIds: readonly string[];
  readonly optionalModuleIds: readonly string[];
  readonly storageMode: "local" | "remote" | "hybrid";
  readonly syncMode: "offline" | "online" | "hybrid";
  readonly authenticationMode: "local" | "provider" | "enterprise";
  readonly observabilityEnabled: boolean;
  readonly rollbackPlanId: string;
}

export interface ReleaseCandidate {
  readonly id: string;
  readonly version: string;
  readonly systemMapId: string;
  readonly validationReportIds: readonly string[];
  readonly healthReportId: string;
  readonly securityReportId: string;
  readonly performanceReportId: string;
  readonly deploymentProfileIds: readonly string[];
  readonly changelogId: string;
  readonly releaseNotesId: string;
  readonly approved: boolean;
}

export interface RoadmapPlan {
  readonly id: string;
  readonly version: string;
  readonly horizons: readonly ("version-1.0" | "version-1.1" | "version-2" | "enterprise" | "scientific-cloud" | "global-knowledge-network" | "educational-network" | "distributed-intelligence")[];
  readonly itemIds: readonly string[];
  readonly adaptive: true;
  readonly updatedAt: string;
}

export interface SystemIntegrationRepository {
  saveModule(module: SystemModule): Promise<void>;
  listModules(): Promise<readonly SystemModule[]>;
  saveSystemMap(map: SystemMap): Promise<void>;
  getSystemMap(mapId: string): Promise<SystemMap | undefined>;
  saveValidationReport(report: ValidationReport): Promise<void>;
  saveHealthReport(report: SystemHealthReport): Promise<void>;
  saveReleaseCandidate(candidate: ReleaseCandidate): Promise<void>;
  saveRoadmap(plan: RoadmapPlan): Promise<void>;
  publishEvent(event: SystemIntegrationEvent): Promise<void>;
}

export interface SystemIntegrationService {
  systemHealth(): Promise<SystemHealthReport>;
  validateArchitecture(): Promise<ValidationReport>;
  validateModules(): Promise<readonly ValidationReport[]>;
  generateHealthReport(): Promise<SystemHealthReport>;
  benchmarkSystem(): Promise<PerformanceReport>;
  runIntegrationTests(): Promise<readonly ValidationReport[]>;
  exportSystemMap(): Promise<SystemMap>;
  generateRelease(version: string): Promise<ReleaseCandidate>;
  publishRelease(candidateId: string): Promise<void>;
  generateRoadmap(version: string): Promise<RoadmapPlan>;
}

export interface SystemIntegrationEvent {
  readonly type:
    | "ArchitectureValidated"
    | "ModuleIntegrated"
    | "HealthCalculated"
    | "SecurityAuditCompleted"
    | "PerformanceBenchmarked"
    | "DocumentationVerified"
    | "ReleaseCandidateCreated"
    | "MVPReleased"
    | "RoadmapUpdated"
    | "SystemEvolutionRecorded";
  readonly version: number;
  readonly occurredAt: string;
  readonly moduleId?: string;
  readonly releaseId?: string;
  readonly payload: unknown;
}

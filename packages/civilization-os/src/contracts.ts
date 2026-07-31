export type ArchiveObjectType =
  | "question"
  | "project"
  | "repository"
  | "dataset"
  | "research"
  | "game"
  | "story"
  | "community"
  | "workflow"
  | "agent"
  | "asset";

export type GovernanceScope = "community" | "scientific" | "educational" | "institutional" | "policy" | "ethics" | "version";

export interface CivilizationMemoryRecord {
  readonly id: string;
  readonly objectId: string;
  readonly archiveId: string;
  readonly lineageId: string;
  readonly provenanceId: string;
  readonly timelineEntryIds: readonly string[];
  readonly semantiqScoreIds: readonly string[];
  readonly preservationStatus: "active" | "snapshot" | "archived" | "migrated" | "restored";
  readonly accessScope: "public" | "federated" | "community" | "private";
  readonly migrationHistoryIds: readonly string[];
}

export interface SemanticArchive {
  readonly id: string;
  readonly objectType: ArchiveObjectType;
  readonly objectIds: readonly string[];
  readonly immutableSnapshotIds: readonly string[];
  readonly storageLocationIds: readonly string[];
  readonly signatureIds: readonly string[];
  readonly encrypted: boolean;
  readonly searchable: true;
  readonly formatVersion: string;
  readonly createdAt: string;
}

export interface KnowledgeLineageRecord {
  readonly id: string;
  readonly objectId: string;
  readonly originId: string;
  readonly parentIds: readonly string[];
  readonly contributorIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly publicationIds: readonly string[];
  readonly narrativeIds: readonly string[];
  readonly educationalMaterialIds: readonly string[];
}

export interface KnowledgeTimelineEntry {
  readonly id: string;
  readonly objectId: string;
  readonly type:
    | "question"
    | "research"
    | "community"
    | "discovery"
    | "experiment"
    | "project"
    | "innovation"
    | "publication"
    | "education"
    | "knowledge-evolution";
  readonly occurredAt: string;
  readonly description: string;
  readonly snapshotId?: string;
}

export interface KnowledgeProvenance {
  readonly id: string;
  readonly objectId: string;
  readonly creatorId: string;
  readonly purpose: string;
  readonly createdAt: string;
  readonly evidenceIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly sourceIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly aiContributionIds: readonly string[];
  readonly humanContributionIds: readonly string[];
  readonly reviewHistoryIds: readonly string[];
  readonly trustHistoryIds: readonly string[];
}

export interface OpenKnowledgeStandard {
  readonly id: string;
  readonly area:
    | "knowledge-object"
    | "question"
    | "relation"
    | "evidence"
    | "research"
    | "benchmark"
    | "community"
    | "agent"
    | "workflow"
    | "marketplace-asset"
    | "semantic-wallet";
  readonly version: string;
  readonly schemaId: string;
  readonly publicUrl: string;
  readonly migrationGuideIds: readonly string[];
  readonly published: boolean;
}

export interface GovernanceRule {
  readonly id: string;
  readonly scope: GovernanceScope;
  readonly title: string;
  readonly rule: string;
  readonly appealProcess: string;
  readonly reviewCadence: string;
  readonly transparent: true;
}

export interface KnowledgeConstitution {
  readonly id: string;
  readonly principles: readonly string[];
  readonly knowledgeRights: readonly string[];
  readonly knowledgeResponsibilities: readonly string[];
  readonly openSciencePrinciples: readonly string[];
  readonly educationalPrinciples: readonly string[];
  readonly privacyPrinciples: readonly string[];
  readonly transparencyPrinciples: readonly string[];
  readonly communityRights: readonly string[];
  readonly operationalAiRights: readonly string[];
  readonly humanOversight: string;
  readonly amendmentRuleIds: readonly string[];
}

export interface PersistentIdentifier {
  readonly id: string;
  readonly objectId: string;
  readonly objectType: "question" | "project" | "research" | "community" | "repository" | "dataset" | "asset" | "workflow" | "agent";
  readonly permanentUri: string;
  readonly resolverIds: readonly string[];
  readonly migrationHistoryIds: readonly string[];
  readonly active: boolean;
}

export interface KnowledgeMigrationPlan {
  readonly id: string;
  readonly type: "schema" | "semantic" | "data" | "knowledge" | "version" | "api" | "plugin" | "format" | "storage";
  readonly sourceVersion: string;
  readonly targetVersion: string;
  readonly objectIds: readonly string[];
  readonly preserveLineage: true;
  readonly preserveProvenance: true;
  readonly zeroKnowledgeLossGoal: true;
  readonly validationIds: readonly string[];
}

export interface CivilizationReport {
  readonly id: string;
  readonly knowledgeAge: number;
  readonly knowledgeEvolution: number;
  readonly researchVelocity: number;
  readonly innovationGrowth: number;
  readonly educationalImpact: number;
  readonly communityHealth: number;
  readonly scientificProgress: number;
  readonly knowledgeAccessibility: number;
  readonly preservationStatus: number;
  readonly civilizationMemoryHealth: number;
}

export interface FutureCompatibilityProfile {
  readonly id: string;
  readonly objectId: string;
  readonly storageEngineTargets: readonly string[];
  readonly aiModelTargets: readonly string[];
  readonly databaseTargets: readonly string[];
  readonly languageTargets: readonly string[];
  readonly hardwareTargets: readonly string[];
  readonly networkTargets: readonly string[];
  readonly standardTargets: readonly string[];
  readonly migrationPlanIds: readonly string[];
}

export interface KnowledgeQualitySnapshot {
  readonly id: string;
  readonly objectId: string;
  readonly knowledgeGrowth: number;
  readonly historicalStability: number;
  readonly evidenceQuality: number;
  readonly scientificIntegrity: number;
  readonly educationalValue: number;
  readonly innovation: number;
  readonly globalAccessibility: number;
  readonly longTermPreservation: number;
  readonly semantiqScoreIds: readonly string[];
}

export interface GlobalEducationArtifact {
  readonly id: string;
  readonly sourceObjectIds: readonly string[];
  readonly type: "course" | "book" | "lesson" | "game" | "workshop" | "research-guide" | "learning-path" | "curriculum";
  readonly title: string;
  readonly lineageIds: readonly string[];
  readonly provenanceIds: readonly string[];
  readonly accessibilityNotes: readonly string[];
  readonly offlineReady: boolean;
}

export interface CivilizationAgentRole {
  readonly role:
    | "archive-agent"
    | "historian-agent"
    | "knowledge-curator"
    | "migration-agent"
    | "integrity-agent"
    | "preservation-agent"
    | "education-agent"
    | "governance-agent"
    | "constitution-agent"
    | "future-compatibility-agent";
  readonly capabilities: readonly string[];
  readonly humanReviewRequired: true;
  readonly preservationCriteria: readonly string[];
  readonly prohibitedActions: readonly string[];
}

export interface CivilizationOsRepository {
  saveMemory(record: CivilizationMemoryRecord): Promise<void>;
  saveArchive(archive: SemanticArchive): Promise<void>;
  getArchive(archiveId: string): Promise<SemanticArchive | undefined>;
  saveLineage(record: KnowledgeLineageRecord): Promise<void>;
  saveTimeline(entry: KnowledgeTimelineEntry): Promise<void>;
  listTimeline(objectId?: string): Promise<readonly KnowledgeTimelineEntry[]>;
  saveProvenance(provenance: KnowledgeProvenance): Promise<void>;
  getProvenance(objectId: string): Promise<KnowledgeProvenance | undefined>;
  saveStandard(standard: OpenKnowledgeStandard): Promise<void>;
  savePersistentId(identifier: PersistentIdentifier): Promise<void>;
  saveMigration(plan: KnowledgeMigrationPlan): Promise<void>;
  publishEvent(event: CivilizationOsEvent): Promise<void>;
}

export interface CivilizationOsService {
  archiveKnowledge(archive: SemanticArchive): Promise<void>;
  restoreKnowledge(archiveId: string): Promise<SemanticArchive>;
  queryHistory(objectId: string): Promise<readonly KnowledgeTimelineEntry[]>;
  generateTimeline(objectId?: string): Promise<readonly KnowledgeTimelineEntry[]>;
  trackLineage(lineage: KnowledgeLineageRecord): Promise<void>;
  verifyIntegrity(archiveId: string): Promise<boolean>;
  migrateKnowledge(plan: KnowledgeMigrationPlan): Promise<void>;
  publishStandard(standard: OpenKnowledgeStandard): Promise<void>;
  registerPersistentID(identifier: PersistentIdentifier): Promise<void>;
  generateCivilizationReport(): Promise<CivilizationReport>;
}

export interface CivilizationOsEvent {
  readonly type:
    | "KnowledgeArchived"
    | "KnowledgeRestored"
    | "LineageUpdated"
    | "TimelineExtended"
    | "HistoricalSnapshotCreated"
    | "MigrationCompleted"
    | "IntegrityVerified"
    | "KnowledgeStandardPublished"
    | "CivilizationMilestoneReached"
    | "DigitalHeritageCreated";
  readonly version: number;
  readonly occurredAt: string;
  readonly objectId?: string;
  readonly archiveId?: string;
  readonly payload: unknown;
}

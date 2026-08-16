export type * from "./contracts.js";

import type {
  CivilizationMemoryRecord,
  CivilizationOsEvent,
  CivilizationOsRepository,
  CivilizationOsService,
  CivilizationReport,
  KnowledgeLineageRecord,
  KnowledgeMigrationPlan,
  KnowledgeProvenance,
  KnowledgeTimelineEntry,
  OpenKnowledgeStandard,
  PersistentIdentifier,
  SemanticArchive
} from "./contracts.js";

export class LocalCivilizationOsRepository implements CivilizationOsRepository {
  private readonly memory = new Map<string, CivilizationMemoryRecord>();
  private readonly archives = new Map<string, SemanticArchive>();
  private readonly lineage = new Map<string, KnowledgeLineageRecord>();
  private readonly timeline: KnowledgeTimelineEntry[] = [];
  private readonly provenance = new Map<string, KnowledgeProvenance>();
  private readonly standards = new Map<string, OpenKnowledgeStandard>();
  private readonly identifiers = new Map<string, PersistentIdentifier>();
  private readonly migrations = new Map<string, KnowledgeMigrationPlan>();
  private readonly events: CivilizationOsEvent[] = [];

  async saveMemory(record: CivilizationMemoryRecord): Promise<void> {
    this.memory.set(record.id, record);
  }

  async saveArchive(archive: SemanticArchive): Promise<void> {
    this.archives.set(archive.id, archive);
  }

  async getArchive(archiveId: string): Promise<SemanticArchive | undefined> {
    return this.archives.get(archiveId);
  }

  async saveLineage(record: KnowledgeLineageRecord): Promise<void> {
    this.lineage.set(record.id, record);
  }

  async saveTimeline(entry: KnowledgeTimelineEntry): Promise<void> {
    this.timeline.push(Object.freeze(entry));
  }

  async listTimeline(objectId?: string): Promise<readonly KnowledgeTimelineEntry[]> {
    return objectId ? this.timeline.filter((entry) => entry.objectId === objectId) : this.timeline;
  }

  async saveProvenance(provenance: KnowledgeProvenance): Promise<void> {
    this.provenance.set(provenance.objectId, provenance);
  }

  async getProvenance(objectId: string): Promise<KnowledgeProvenance | undefined> {
    return this.provenance.get(objectId);
  }

  async saveStandard(standard: OpenKnowledgeStandard): Promise<void> {
    this.standards.set(standard.id, standard);
  }

  async savePersistentId(identifier: PersistentIdentifier): Promise<void> {
    this.identifiers.set(identifier.id, identifier);
  }

  async saveMigration(plan: KnowledgeMigrationPlan): Promise<void> {
    this.migrations.set(plan.id, plan);
  }

  async publishEvent(event: CivilizationOsEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }
}

export class LocalCivilizationOsService implements CivilizationOsService {
  constructor(
    private readonly repository: LocalCivilizationOsRepository = new LocalCivilizationOsRepository()
  ) {}

  async archiveKnowledge(archive: SemanticArchive): Promise<void> {
    if (!archive.searchable) {
      throw new Error("Semantic archives must remain searchable");
    }
    await this.repository.saveArchive(archive);
    await this.emit("KnowledgeArchived", { objectType: archive.objectType }, undefined, archive.id);
    await this.emit(
      "HistoricalSnapshotCreated",
      { snapshotIds: archive.immutableSnapshotIds },
      undefined,
      archive.id
    );
  }

  async restoreKnowledge(archiveId: string): Promise<SemanticArchive> {
    const archive = await this.requireArchive(archiveId);
    await this.emit("KnowledgeRestored", { objectIds: archive.objectIds }, undefined, archive.id);
    return archive;
  }

  async queryHistory(objectId: string): Promise<readonly KnowledgeTimelineEntry[]> {
    return this.repository.listTimeline(objectId);
  }

  async generateTimeline(objectId?: string): Promise<readonly KnowledgeTimelineEntry[]> {
    const timeline = await this.repository.listTimeline(objectId);
    await this.emit("TimelineExtended", { entries: timeline.length }, objectId);
    return timeline;
  }

  async trackLineage(lineage: KnowledgeLineageRecord): Promise<void> {
    await this.repository.saveLineage(lineage);
    await this.emit("LineageUpdated", { lineageId: lineage.id }, lineage.objectId);
  }

  async verifyIntegrity(archiveId: string): Promise<boolean> {
    const archive = await this.requireArchive(archiveId);
    const verified = archive.signatureIds.length > 0;
    await this.emit("IntegrityVerified", { verified }, undefined, archive.id);
    return verified;
  }

  async migrateKnowledge(plan: KnowledgeMigrationPlan): Promise<void> {
    if (!plan.preserveLineage || !plan.preserveProvenance || !plan.zeroKnowledgeLossGoal) {
      throw new Error(
        "Knowledge migration must preserve lineage, provenance, and zero-loss intent"
      );
    }
    await this.repository.saveMigration(plan);
    await this.emit("MigrationCompleted", { type: plan.type, targetVersion: plan.targetVersion });
  }

  async publishStandard(standard: OpenKnowledgeStandard): Promise<void> {
    await this.repository.saveStandard(standard);
    await this.emit("KnowledgeStandardPublished", {
      area: standard.area,
      version: standard.version
    });
  }

  async registerPersistentID(identifier: PersistentIdentifier): Promise<void> {
    if (!identifier.active) {
      throw new Error("Persistent identifiers must be active when registered");
    }
    await this.repository.savePersistentId(identifier);
  }

  async generateCivilizationReport(): Promise<CivilizationReport> {
    const timeline = await this.repository.listTimeline();
    const report: CivilizationReport = {
      id: `civilization-report:${Date.now()}`,
      knowledgeAge: timeline.length,
      knowledgeEvolution: timeline.length,
      researchVelocity: timeline.filter((entry) => entry.type === "research").length,
      innovationGrowth: timeline.filter((entry) => entry.type === "innovation").length,
      educationalImpact: timeline.filter((entry) => entry.type === "education").length,
      communityHealth: timeline.filter((entry) => entry.type === "community").length,
      scientificProgress: timeline.filter(
        (entry) => entry.type === "discovery" || entry.type === "experiment"
      ).length,
      knowledgeAccessibility: timeline.length,
      preservationStatus: timeline.length,
      civilizationMemoryHealth: timeline.length
    };
    await this.emit("CivilizationMilestoneReached", { reportId: report.id });
    await this.emit("DigitalHeritageCreated", { reportId: report.id });
    return report;
  }

  private async requireArchive(archiveId: string): Promise<SemanticArchive> {
    const archive = await this.repository.getArchive(archiveId);
    if (!archive) {
      throw new Error(`Semantic archive not found: ${archiveId}`);
    }
    return archive;
  }

  private async emit(
    type: CivilizationOsEvent["type"],
    payload: unknown,
    objectId?: string,
    archiveId?: string
  ): Promise<void> {
    const event: CivilizationOsEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withObject = objectId ? { ...event, objectId } : event;
    const withArchive = archiveId ? { ...withObject, archiveId } : withObject;
    await this.repository.publishEvent(withArchive);
  }
}

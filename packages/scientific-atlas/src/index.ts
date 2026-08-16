export type * from "./contracts.js";

import type {
  AtlasEntry,
  AtlasRepository,
  EvidenceItem,
  ExperimentRecord,
  Hypothesis,
  KnowledgeTimelineEvent,
  ResearchRecommendation,
  ScientificAtlasService
} from "./contracts.js";

export class LocalAtlasRepository implements AtlasRepository {
  private readonly entries = new Map<string, AtlasEntry>();
  private readonly evidence = new Map<string, EvidenceItem>();
  private readonly hypotheses = new Map<string, Hypothesis>();
  private readonly experiments = new Map<string, ExperimentRecord>();
  private readonly timelineEvents: KnowledgeTimelineEvent[] = [];

  async saveEntry(entry: AtlasEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  async getEntry(entryId: string): Promise<AtlasEntry | undefined> {
    return this.entries.get(entryId);
  }

  async linkEvidence(entryId: string, evidence: EvidenceItem): Promise<void> {
    this.requireEntry(entryId);
    this.evidence.set(evidence.id, evidence);
  }

  async addHypothesis(hypothesis: Hypothesis): Promise<void> {
    this.hypotheses.set(hypothesis.id, hypothesis);
  }

  async registerExperiment(experiment: ExperimentRecord): Promise<void> {
    this.experiments.set(experiment.id, experiment);
  }

  async appendTimelineEvent(event: KnowledgeTimelineEvent): Promise<void> {
    this.timelineEvents.push(Object.freeze(event));
  }

  async timeline(entryId: string): Promise<readonly KnowledgeTimelineEvent[]> {
    return this.timelineEvents.filter((event) => event.entryId === entryId);
  }

  async searchAtlas(query: string, limit: number): Promise<readonly AtlasEntry[]> {
    const text = query.toLowerCase();
    return [...this.entries.values()]
      .filter(
        (entry) =>
          entry.summary.toLowerCase().includes(text) ||
          entry.context.toLowerCase().includes(text) ||
          entry.domain.toLowerCase().includes(text) ||
          entry.futureDirections.some((direction) => direction.toLowerCase().includes(text))
      )
      .slice(0, limit);
  }

  private requireEntry(entryId: string): void {
    if (!this.entries.has(entryId)) {
      throw new Error(`Atlas entry not found: ${entryId}`);
    }
  }
}

export class LocalScientificAtlasService implements ScientificAtlasService {
  constructor(private readonly repository: AtlasRepository = new LocalAtlasRepository()) {}

  async createAtlasEntry(entry: AtlasEntry): Promise<void> {
    await this.repository.saveEntry(entry);
    await this.repository.appendTimelineEvent({
      id: `${entry.id}:created`,
      entryId: entry.id,
      type: "creation",
      occurredAt: new Date().toISOString(),
      explanation: "Atlas entry created.",
      objectIds: [entry.questionId]
    });
  }

  async updateAtlasEntry(entry: AtlasEntry): Promise<void> {
    await this.repository.saveEntry(entry);
  }

  async linkEvidence(entryId: string, evidence: EvidenceItem): Promise<void> {
    await this.repository.linkEvidence(entryId, evidence);
    await this.repository.appendTimelineEvent({
      id: `${entryId}:evidence:${evidence.id}`,
      entryId,
      type: "evidence-added",
      occurredAt: new Date().toISOString(),
      explanation: evidence.explanation,
      objectIds: [evidence.id]
    });
  }

  async addHypothesis(hypothesis: Hypothesis): Promise<void> {
    await this.repository.addHypothesis(hypothesis);
  }

  async registerExperiment(experiment: ExperimentRecord): Promise<void> {
    await this.repository.registerExperiment(experiment);
  }

  searchAtlas(query: string, limit: number): Promise<readonly AtlasEntry[]> {
    return this.repository.searchAtlas(query, limit);
  }

  generateTimeline(entryId: string): Promise<readonly KnowledgeTimelineEvent[]> {
    return this.repository.timeline(entryId);
  }

  async recommendResearch(entryId: string): Promise<readonly ResearchRecommendation[]> {
    const entry = await this.repository.getEntry(entryId);
    if (!entry) {
      throw new Error(`Atlas entry not found: ${entryId}`);
    }
    return entry.unknowns.map((unknown, index) => ({
      id: `${entryId}:recommendation:${index}`,
      entryId,
      type: "future-question",
      explanation: `Investigate unresolved unknown: ${unknown}`,
      sourceSignals: ["unknowns"]
    }));
  }
}

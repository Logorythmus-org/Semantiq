export type KnowledgeState =
  | "unknown"
  | "observed"
  | "explored"
  | "evidence-growing"
  | "actively-researched"
  | "experiment-running"
  | "verified"
  | "disputed"
  | "open-debate"
  | "historical"
  | "archived"
  | "reopened";

export type ScientificDomain =
  | "physics"
  | "mathematics"
  | "biology"
  | "medicine"
  | "chemistry"
  | "astronomy"
  | "earth-science"
  | "engineering"
  | "computer-science"
  | "ai"
  | "history"
  | "philosophy"
  | "psychology"
  | "economics"
  | "education"
  | "arts"
  | "language"
  | "politics"
  | "law"
  | "culture"
  | "environment"
  | "energy"
  | "space"
  | "future-technologies"
  | "custom";

export interface AtlasEntry {
  readonly id: string;
  readonly questionId: string;
  readonly summary: string;
  readonly context: string;
  readonly domain: ScientificDomain;
  readonly subdomain?: string;
  readonly difficulty: "introductory" | "intermediate" | "advanced" | "frontier" | "unknown";
  readonly states: readonly KnowledgeState[];
  readonly importance: number;
  readonly scientificPotential: number;
  readonly evidenceIds: readonly string[];
  readonly counterEvidenceIds: readonly string[];
  readonly unknowns: readonly string[];
  readonly assumptions: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly hypothesisIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly publicationIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly expertIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly benchmarkHistoryIds: readonly string[];
  readonly timelineId: string;
  readonly aiNoteIds: readonly string[];
  readonly futureDirections: readonly string[];
}

export interface EvidenceItem {
  readonly id: string;
  readonly source: string;
  readonly sourceType:
    | "paper"
    | "book"
    | "dataset"
    | "experiment"
    | "observation"
    | "repository"
    | "benchmark"
    | "publication"
    | "other";
  readonly linkedQuestionIds: readonly string[];
  readonly confidence: number;
  readonly traceability: string;
  readonly quality: number;
  readonly date: string;
  readonly version: string;
  readonly explanation: string;
}

export interface Hypothesis {
  readonly id: string;
  readonly questionId: string;
  readonly statement: string;
  readonly kind: "primary" | "alternative" | "null";
  readonly status:
    "proposed" | "testing" | "supported" | "refuted" | "inconclusive" | "superseded" | "archived";
  readonly evidenceIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly probability?: number;
  readonly historyIds: readonly string[];
  readonly futureTesting: readonly string[];
}

export interface ExperimentRecord {
  readonly id: string;
  readonly questionId: string;
  readonly hypothesisIds: readonly string[];
  readonly goal: string;
  readonly method: string;
  readonly variables: readonly string[];
  readonly dataIds: readonly string[];
  readonly resultIds: readonly string[];
  readonly replicationIds: readonly string[];
  readonly limitations: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly projectIds: readonly string[];
  readonly futureWork: readonly string[];
}

export interface KnowledgeTimelineEvent {
  readonly id: string;
  readonly entryId: string;
  readonly type:
    | "creation"
    | "evidence-added"
    | "hypothesis-added"
    | "experiment-registered"
    | "benchmark-updated"
    | "publication-linked"
    | "project-linked"
    | "community-activity"
    | "ai-suggestion"
    | "milestone"
    | "future-recommendation";
  readonly occurredAt: string;
  readonly actorId?: string;
  readonly explanation: string;
  readonly objectIds: readonly string[];
}

export interface KnowledgeTimeline {
  readonly id: string;
  readonly entryId: string;
  readonly eventIds: readonly string[];
}

export interface UncertaintyProfile {
  readonly entryId: string;
  readonly unknowns: readonly string[];
  readonly assumptions: readonly string[];
  readonly missingEvidence: readonly string[];
  readonly conflictingEvidenceIds: readonly string[];
  readonly confidence: number;
  readonly researchGaps: readonly string[];
  readonly openChallenges: readonly string[];
  readonly futureQuestionIds: readonly string[];
}

export interface ResearchRecommendation {
  readonly id: string;
  readonly entryId: string;
  readonly type:
    | "next-experiment"
    | "paper"
    | "project"
    | "dataset"
    | "repository"
    | "expert"
    | "community"
    | "funding"
    | "education"
    | "open-problem"
    | "future-question";
  readonly targetId?: string;
  readonly explanation: string;
  readonly sourceSignals: readonly string[];
}

export interface DisciplineBridge {
  readonly id: string;
  readonly sourceDomain: ScientificDomain;
  readonly targetDomain: ScientificDomain;
  readonly explanation: string;
  readonly questionIds: readonly string[];
  readonly confidence: number;
}

export interface AtlasRepository {
  saveEntry(entry: AtlasEntry): Promise<void>;
  getEntry(entryId: string): Promise<AtlasEntry | undefined>;
  linkEvidence(entryId: string, evidence: EvidenceItem): Promise<void>;
  addHypothesis(hypothesis: Hypothesis): Promise<void>;
  registerExperiment(experiment: ExperimentRecord): Promise<void>;
  appendTimelineEvent(event: KnowledgeTimelineEvent): Promise<void>;
  timeline(entryId: string): Promise<readonly KnowledgeTimelineEvent[]>;
  searchAtlas(query: string, limit: number): Promise<readonly AtlasEntry[]>;
}

export interface ScientificAtlasService {
  createAtlasEntry(entry: AtlasEntry): Promise<void>;
  updateAtlasEntry(entry: AtlasEntry): Promise<void>;
  linkEvidence(entryId: string, evidence: EvidenceItem): Promise<void>;
  addHypothesis(hypothesis: Hypothesis): Promise<void>;
  registerExperiment(experiment: ExperimentRecord): Promise<void>;
  searchAtlas(query: string, limit: number): Promise<readonly AtlasEntry[]>;
  generateTimeline(entryId: string): Promise<readonly KnowledgeTimelineEvent[]>;
  recommendResearch(entryId: string): Promise<readonly ResearchRecommendation[]>;
}

export interface ScientificAtlasEvent {
  readonly type:
    | "AtlasEntryCreated"
    | "EvidenceLinked"
    | "HypothesisAdded"
    | "ExperimentRegistered"
    | "ResearchUpdated"
    | "KnowledgeExpanded"
    | "ScientificMilestoneReached"
    | "QuestionReopened"
    | "ContradictionDetected"
    | "RecommendationGenerated"
    | "BenchmarkUpdated";
  readonly version: number;
  readonly occurredAt: string;
  readonly entryId?: string;
  readonly payload: unknown;
}

export type ResearchProjectState =
  | "question"
  | "investigation"
  | "planning"
  | "evidence-collection"
  | "hypothesis-formation"
  | "experiment"
  | "validation"
  | "peer-review"
  | "publication"
  | "community-review"
  | "project-evolution"
  | "archive";

export type ResearchTeamType =
  | "individual"
  | "open-community"
  | "private-team"
  | "institutional"
  | "university"
  | "citizen-science"
  | "ai-assisted"
  | "hybrid-human-ai";

export type ContributionType =
  | "observation"
  | "evidence"
  | "experiment"
  | "code"
  | "dataset"
  | "review"
  | "comment"
  | "visualization"
  | "publication"
  | "translation"
  | "teaching-material";

export interface ResearchProject {
  readonly id: string;
  readonly researchGoal: string;
  readonly originalQuestionIds: readonly string[];
  readonly scope: string;
  readonly objectives: readonly string[];
  readonly state: ResearchProjectState;
  readonly milestoneIds: readonly string[];
  readonly taskIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly hypothesisIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly researcherIds: readonly string[];
  readonly contributorIds: readonly string[];
  readonly organizationIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly timelineEventIds: readonly string[];
  readonly budgetId?: string;
  readonly resourceIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly risks: readonly string[];
  readonly ethicsNotes: readonly string[];
  readonly publicationIds: readonly string[];
  readonly outcomes: readonly string[];
  readonly futureWork: readonly string[];
}

export interface ResearchTeam {
  readonly id: string;
  readonly projectId: string;
  readonly type: ResearchTeamType;
  readonly roleIds: readonly string[];
  readonly permissionIds: readonly string[];
  readonly responsibilityIds: readonly string[];
  readonly contributionIds: readonly string[];
  readonly trustSignalIds: readonly string[];
  readonly reputationEntryIds: readonly string[];
}

export interface ResearchContribution {
  readonly id: string;
  readonly projectId: string;
  readonly type: ContributionType;
  readonly authorId: string;
  readonly timestamp: string;
  readonly version: string;
  readonly confidence: number;
  readonly license: string;
  readonly benchmarkId?: string;
  readonly relationIds: readonly string[];
  readonly provenance: string;
}

export interface ResearchWorkflow {
  readonly id: string;
  readonly name: string;
  readonly type:
    | "scientific-research"
    | "engineering-research"
    | "educational-research"
    | "historical-investigation"
    | "ai-research"
    | "medical-review"
    | "literature-review"
    | "comparative-analysis"
    | "exploratory-research"
    | "innovation-sprint";
  readonly customizable: boolean;
  readonly stepIds: readonly string[];
}

export interface ResearchEvidence {
  readonly id: string;
  readonly projectId: string;
  readonly sourceType:
    | "paper"
    | "book"
    | "dataset"
    | "repository"
    | "experiment"
    | "sensor"
    | "image"
    | "audio"
    | "video"
    | "user-observation"
    | "historical-document"
    | "external-api";
  readonly provenance: string;
  readonly confidence: number;
  readonly contributionId: string;
}

export interface ResearchHypothesisWorkspace {
  readonly id: string;
  readonly projectId: string;
  readonly hypothesisIds: readonly string[];
  readonly evidenceMapIds: readonly string[];
  readonly variableIds: readonly string[];
  readonly expectedOutcomes: readonly string[];
  readonly counterArgumentIds: readonly string[];
  readonly experimentPlanIds: readonly string[];
  readonly reviewIds: readonly string[];
  readonly benchmarkHistoryIds: readonly string[];
}

export interface ManagedExperiment {
  readonly id: string;
  readonly projectId: string;
  readonly state: "idea" | "protocol" | "preparation" | "execution" | "data-collection" | "analysis" | "replication" | "review" | "publication" | "future-improvements";
  readonly protocolIds: readonly string[];
  readonly variableIds: readonly string[];
  readonly measurementIds: readonly string[];
  readonly equipmentIds: readonly string[];
  readonly softwareIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly resultIds: readonly string[];
  readonly limitations: readonly string[];
}

export interface PeerReview {
  readonly id: string;
  readonly projectId: string;
  readonly mode: "open" | "blind" | "double-blind" | "community" | "expert" | "ai-assisted";
  readonly reviewerIds: readonly string[];
  readonly methodology: string;
  readonly evidence: string;
  readonly logic: string;
  readonly reproducibility: string;
  readonly transparency: string;
  readonly ethics: string;
  readonly novelty: string;
  readonly scientificPotential: string;
  readonly submittedAt: string;
}

export interface ResearchPublication {
  readonly id: string;
  readonly projectId: string;
  readonly type: "report" | "scientific-paper" | "technical-report" | "educational-material" | "book" | "presentation" | "dataset" | "open-knowledge-object";
  readonly title: string;
  readonly linkedQuestionIds: readonly string[];
  readonly contributionIds: readonly string[];
  readonly reviewIds: readonly string[];
  readonly approvedBy: string;
  readonly releasedAt?: string;
}

export interface ResearchAnalyticsSnapshot {
  readonly projectId: string;
  readonly progress: number;
  readonly evidenceGrowth: number;
  readonly knowledgeExpansion: number;
  readonly experimentSuccess: number;
  readonly collaboration: number;
  readonly researchVelocity: number;
  readonly scientificImpact: number;
  readonly semantiqEvolution: number;
  readonly projectHealth: "healthy" | "at-risk" | "blocked" | "unknown";
  readonly knowledgeDensity: number;
}

export interface InnovationRecord {
  readonly id: string;
  readonly projectId: string;
  readonly type: "idea" | "prototype" | "patent" | "open-design" | "software" | "hardware" | "educational-product" | "game" | "book" | "startup";
  readonly title: string;
  readonly linkedEvidenceIds: readonly string[];
  readonly linkedExperimentIds: readonly string[];
  readonly linkedPublicationIds: readonly string[];
}

export interface ResearchAgentRole {
  readonly role:
    | "research-planner"
    | "evidence"
    | "literature"
    | "dataset"
    | "hypothesis"
    | "experiment"
    | "review"
    | "statistics"
    | "writing"
    | "publication"
    | "visualization"
    | "recommendation";
  readonly purpose: string;
  readonly capabilities: readonly string[];
  readonly permissions: readonly string[];
  readonly failureModes: readonly string[];
  readonly evaluationMetrics: readonly string[];
}

export interface ResearchEngineRepository {
  saveProject(project: ResearchProject): Promise<void>;
  getProject(projectId: string): Promise<ResearchProject | undefined>;
  addContribution(contribution: ResearchContribution): Promise<void>;
  listContributions(projectId: string): Promise<readonly ResearchContribution[]>;
  submitReview(review: PeerReview): Promise<void>;
  publish(publication: ResearchPublication): Promise<void>;
}

export interface ResearchEngineService {
  createResearchProject(project: ResearchProject): Promise<void>;
  linkQuestion(projectId: string, questionId: string): Promise<ResearchProject>;
  addEvidence(evidence: ResearchEvidence): Promise<void>;
  submitReview(review: PeerReview): Promise<void>;
  publishResearch(publication: ResearchPublication): Promise<void>;
  trackProgress(projectId: string): Promise<ResearchAnalyticsSnapshot>;
}

export interface ResearchEngineEvent {
  readonly type:
    | "ResearchCreated"
    | "EvidenceCollected"
    | "HypothesisCreated"
    | "ExperimentStarted"
    | "ExperimentCompleted"
    | "PeerReviewSubmitted"
    | "PublicationReleased"
    | "KnowledgeExpanded"
    | "ResearchBenchmarked"
    | "InnovationCreated"
    | "ResearchArchived";
  readonly version: number;
  readonly occurredAt: string;
  readonly projectId?: string;
  readonly payload: unknown;
}

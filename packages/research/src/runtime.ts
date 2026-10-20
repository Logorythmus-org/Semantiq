import { createKnowledgeObjectAggregate } from "../../core/src/index.js";
import {
  createKnowledgeEdge,
  type KnowledgeNode,
  LocalKnowledgeGraphRuntime
} from "../../graph-runtime/src/index.js";
import { ExplainableSemantiqRuntime } from "../../semantiq/src/index.js";

export type ResearchStatus =
  "draft" | "active" | "evidence" | "experiment" | "review" | "published" | "archived";
export type EvidenceType =
  | "observation"
  | "experiment"
  | "measurement"
  | "simulation"
  | "publication"
  | "dataset"
  | "interview"
  | "survey"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "mathematical-proof"
  | "external-reference";
export type ExperimentType =
  | "scientific"
  | "engineering"
  | "educational"
  | "social"
  | "simulation"
  | "digital"
  | "community"
  | "ai"
  | "hybrid"
  | "custom";
export type ReviewMode = "blind" | "open" | "semantiq" | "community" | "expert";
export type CommunityRole =
  | "founder"
  | "administrator"
  | "moderator"
  | "researcher"
  | "student"
  | "teacher"
  | "mentor"
  | "reviewer"
  | "guest"
  | "ai-agent"
  | "observer";

export interface ResearchProjectRuntime {
  readonly id: string;
  readonly questionId: string;
  readonly title: string;
  readonly objectives: readonly string[];
  readonly scope: string;
  readonly hypothesisIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly experimentIds: readonly string[];
  readonly datasetIds: readonly string[];
  readonly repositoryIds: readonly string[];
  readonly communityIds: readonly string[];
  readonly researcherIds: readonly string[];
  readonly mentorIds: readonly string[];
  readonly semantiqReportIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly publicationIds: readonly string[];
  readonly benchmarkIds: readonly string[];
  readonly version: string;
  readonly status: ResearchStatus;
  readonly progress: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EvidenceObject {
  readonly id: string;
  readonly projectId: string;
  readonly type: EvidenceType;
  readonly source: string;
  readonly confidence: number;
  readonly quality: number;
  readonly classification: "primary" | "secondary" | "derived" | "uncertain";
  readonly provenance: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly historyIds: readonly string[];
}

export interface HypothesisObject {
  readonly id: string;
  readonly projectId: string;
  readonly statement: string;
  readonly assumptions: readonly string[];
  readonly predictions: readonly string[];
  readonly expectedResults: readonly string[];
  readonly supportingEvidenceIds: readonly string[];
  readonly contradictionIds: readonly string[];
  readonly confidence: number;
  readonly validationStatus: "untested" | "supported" | "contradicted" | "mixed" | "revised";
  readonly historyIds: readonly string[];
}

export interface ExperimentObject {
  readonly id: string;
  readonly projectId: string;
  readonly type: ExperimentType;
  readonly protocol: string;
  readonly variables: readonly string[];
  readonly environment: string;
  readonly resources: readonly string[];
  readonly participantIds: readonly string[];
  readonly status: "planned" | "running" | "completed" | "failed" | "replicating";
  readonly resultIds: readonly string[];
  readonly observationIds: readonly string[];
  readonly failureNotes: readonly string[];
  readonly replicationIds: readonly string[];
  readonly benchmarkIds: readonly string[];
}

export interface DatasetObject {
  readonly id: string;
  readonly projectId: string;
  readonly schema: Readonly<Record<string, unknown>>;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly version: string;
  readonly license: string;
  readonly storageRef: string;
  readonly quality: number;
  readonly provenance: string;
  readonly relationIds: readonly string[];
}

export interface PublicationObject {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly status: "draft" | "review" | "revision" | "published";
  readonly citationIds: readonly string[];
  readonly doiPlaceholder: string;
  readonly version: string;
  readonly authorIds: readonly string[];
  readonly contributorIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly researchIds: readonly string[];
  readonly graphLinkIds: readonly string[];
}

export interface PeerReviewObject {
  readonly id: string;
  readonly publicationId: string;
  readonly reviewerId: string;
  readonly mode: ReviewMode;
  readonly comments: readonly string[];
  readonly approved: boolean;
  readonly revisionRequests: readonly string[];
  readonly conflictResolutionNotes: readonly string[];
  readonly completedAt: string;
}

export interface ResearchCommunityRuntime {
  readonly id: string;
  readonly name: string;
  readonly type: "community" | "research-group" | "laboratory" | "institution" | "organization";
  readonly memberIds: readonly string[];
  readonly roles: Readonly<Record<string, CommunityRole>>;
  readonly permissionIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly metrics: Readonly<Record<string, number>>;
  readonly graphNodeId: string;
}

export interface CollaborationRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly participantIds: readonly string[];
  readonly sharedObjectIds: readonly string[];
  readonly comments: readonly string[];
  readonly mentions: readonly string[];
  readonly notificationIds: readonly string[];
  readonly assignmentIds: readonly string[];
}

export interface ResearchTask {
  readonly id: string;
  readonly projectId: string;
  readonly title: string;
  readonly milestoneId?: string;
  readonly dependencyIds: readonly string[];
  readonly assigneeIds: readonly string[];
  readonly checklist: readonly string[];
  readonly status: "todo" | "doing" | "review" | "blocked" | "done";
  readonly progress: number;
  readonly benchmarkIds: readonly string[];
}

export interface ResearchAnalytics {
  readonly projectId: string;
  readonly researchVelocity: number;
  readonly evidenceGrowth: number;
  readonly experimentCount: number;
  readonly knowledgeGrowth: number;
  readonly publicationQuality: number;
  readonly communityActivity: number;
  readonly collaboration: number;
  readonly semantiq: number;
  readonly researchHealth: number;
  readonly innovationPotential: number;
}

export type ResearchRuntimeEventType =
  | "ResearchCreated"
  | "EvidenceAdded"
  | "HypothesisCreated"
  | "ExperimentStarted"
  | "ExperimentCompleted"
  | "PublicationDrafted"
  | "PublicationPublished"
  | "ReviewCompleted"
  | "CommunityCreated"
  | "MemberJoined"
  | "RecommendationGenerated"
  | "KnowledgeExpanded";

export interface ResearchRuntimeEvent {
  readonly type: ResearchRuntimeEventType;
  readonly version: number;
  readonly occurredAt: string;
  readonly projectId?: string;
  readonly objectId?: string;
  readonly payload: unknown;
}

export interface ResearchRecommendation {
  readonly id: string;
  readonly type:
    | "researcher"
    | "community"
    | "project"
    | "evidence"
    | "experiment"
    | "dataset"
    | "mentor"
    | "publication"
    | "question"
    | "workflow";
  readonly targetId: string;
  readonly score: number;
  readonly explanation: string;
  readonly sourceSignals: readonly string[];
}

const createId = (prefix: string): string =>
  `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const now = (): string => new Date().toISOString();

export class LocalResearchRuntime {
  private readonly projects = new Map<string, ResearchProjectRuntime>();
  private readonly evidence = new Map<string, EvidenceObject>();
  private readonly hypotheses = new Map<string, HypothesisObject>();
  private readonly experiments = new Map<string, ExperimentObject>();
  private readonly datasets = new Map<string, DatasetObject>();
  private readonly publications = new Map<string, PublicationObject>();
  private readonly reviews = new Map<string, PeerReviewObject>();
  private readonly communities = new Map<string, ResearchCommunityRuntime>();
  private readonly collaborations = new Map<string, CollaborationRecord>();
  private readonly tasks = new Map<string, ResearchTask>();
  private readonly eventLog: ResearchRuntimeEvent[] = [];

  constructor(
    private readonly graph = new LocalKnowledgeGraphRuntime(),
    private readonly semantiq = new ExplainableSemantiqRuntime()
  ) {}

  async createResearch(project: ResearchProjectRuntime): Promise<void> {
    if (!project.questionId) {
      throw new Error("Research projects must originate from a question");
    }
    this.projects.set(project.id, project);
    await this.createNode(project.id, "research", project.title, {
      questionId: project.questionId,
      scope: project.scope
    });
    await this.emit("ResearchCreated", project.id, project.id, { questionId: project.questionId });
    await this.evaluateProject(project);
  }

  async createHypothesis(hypothesis: HypothesisObject): Promise<void> {
    this.requireProject(hypothesis.projectId);
    this.hypotheses.set(hypothesis.id, hypothesis);
    await this.createNode(hypothesis.id, "research", hypothesis.statement, {
      type: "hypothesis",
      confidence: hypothesis.confidence
    });
    await this.link(
      hypothesis.id,
      hypothesis.projectId,
      "belongs_to",
      hypothesis.supportingEvidenceIds
    );
    await this.emit("HypothesisCreated", hypothesis.projectId, hypothesis.id, {
      confidence: hypothesis.confidence
    });
  }

  async addEvidence(evidence: EvidenceObject): Promise<void> {
    this.requireProject(evidence.projectId);
    this.evidence.set(evidence.id, evidence);
    await this.createNode(evidence.id, "evidence", evidence.source, {
      evidenceType: evidence.type,
      confidence: evidence.confidence,
      quality: evidence.quality,
      provenance: evidence.provenance
    });
    await this.link(evidence.id, evidence.projectId, "supports", [evidence.id]);
    await this.emit("EvidenceAdded", evidence.projectId, evidence.id, {
      type: evidence.type,
      confidence: evidence.confidence
    });
  }

  async createExperiment(experiment: ExperimentObject): Promise<void> {
    this.requireProject(experiment.projectId);
    this.experiments.set(experiment.id, experiment);
    await this.createNode(experiment.id, "experiment", experiment.protocol, {
      experimentType: experiment.type,
      status: experiment.status
    });
    await this.link(experiment.id, experiment.projectId, "belongs_to");
    await this.emit(
      experiment.status === "completed" ? "ExperimentCompleted" : "ExperimentStarted",
      experiment.projectId,
      experiment.id,
      {
        status: experiment.status
      }
    );
  }

  async addDataset(dataset: DatasetObject): Promise<void> {
    this.requireProject(dataset.projectId);
    this.datasets.set(dataset.id, dataset);
    await this.createNode(dataset.id, "dataset", String(dataset.metadata["title"] ?? dataset.id), {
      schema: dataset.schema,
      quality: dataset.quality,
      license: dataset.license,
      provenance: dataset.provenance
    });
    await this.link(dataset.id, dataset.projectId, "references");
    await this.emit("KnowledgeExpanded", dataset.projectId, dataset.id, { datasetId: dataset.id });
  }

  async publishResearch(publication: PublicationObject): Promise<void> {
    this.requireProject(publication.projectId);
    this.publications.set(publication.id, publication);
    await this.createNode(publication.id, "publication", publication.title, {
      status: publication.status,
      doiPlaceholder: publication.doiPlaceholder,
      version: publication.version
    });
    await this.link(publication.id, publication.projectId, "generated_by", publication.evidenceIds);
    await this.emit(
      publication.status === "published" ? "PublicationPublished" : "PublicationDrafted",
      publication.projectId,
      publication.id,
      {
        status: publication.status
      }
    );
  }

  async reviewPublication(review: PeerReviewObject): Promise<void> {
    if (!this.publications.has(review.publicationId)) {
      throw new Error(`Publication not found: ${review.publicationId}`);
    }
    this.reviews.set(review.id, review);
    await this.emit("ReviewCompleted", undefined, review.id, {
      publicationId: review.publicationId,
      approved: review.approved
    });
  }

  async createCommunity(community: ResearchCommunityRuntime): Promise<void> {
    this.communities.set(community.id, community);
    await this.createNode(community.graphNodeId, "community", community.name, {
      communityType: community.type,
      members: community.memberIds.length
    });
    await this.emit("CommunityCreated", undefined, community.id, { communityId: community.id });
  }

  async joinCommunity(
    communityId: string,
    identityId: string,
    role: CommunityRole
  ): Promise<ResearchCommunityRuntime> {
    const community = this.requireCommunity(communityId);
    const updated: ResearchCommunityRuntime = {
      ...community,
      memberIds: [...new Set([...community.memberIds, identityId])],
      roles: { ...community.roles, [identityId]: role }
    };
    this.communities.set(communityId, updated);
    await this.emit("MemberJoined", undefined, identityId, { communityId, role });
    return updated;
  }

  async createCollaboration(record: CollaborationRecord): Promise<void> {
    this.requireProject(record.projectId);
    this.collaborations.set(record.id, record);
    await this.emit("KnowledgeExpanded", record.projectId, record.id, {
      collaborationId: record.id
    });
  }

  async assignTask(task: ResearchTask): Promise<void> {
    this.requireProject(task.projectId);
    this.tasks.set(task.id, task);
    await this.emit("KnowledgeExpanded", task.projectId, task.id, {
      taskId: task.id,
      status: task.status
    });
  }

  async recommendResearch(projectId: string): Promise<readonly ResearchRecommendation[]> {
    this.requireProject(projectId);
    const graphRecommendations = await this.graph.recommendKnowledge(projectId);
    const recommendations = graphRecommendations.map((recommendation) => ({
      id: createId("research-recommendation"),
      type: recommendation.type === "community" ? "community" : "evidence",
      targetId: recommendation.targetId,
      score: recommendation.score,
      explanation: recommendation.explanation,
      sourceSignals: recommendation.sourceSignals
    })) satisfies readonly ResearchRecommendation[];
    await this.emit("RecommendationGenerated", projectId, undefined, {
      count: recommendations.length
    });
    return recommendations;
  }

  async recommendEvidence(projectId: string): Promise<readonly ResearchRecommendation[]> {
    this.requireProject(projectId);
    return [...this.evidence.values()]
      .filter((item) => item.projectId === projectId)
      .map((item) => ({
        id: createId("evidence-recommendation"),
        type: "evidence",
        targetId: item.id,
        score: item.quality * item.confidence,
        explanation: `Evidence recommended from quality ${item.quality} and confidence ${item.confidence}.`,
        sourceSignals: [item.id, item.type]
      }));
  }

  async searchResearch(query: string): Promise<readonly string[]> {
    const results = await this.graph.searchKnowledge(query);
    return results.map((result) => result.nodeId);
  }

  async analytics(projectId: string): Promise<ResearchAnalytics> {
    this.requireProject(projectId);
    const evidenceCount = [...this.evidence.values()].filter(
      (item) => item.projectId === projectId
    ).length;
    const experimentCount = [...this.experiments.values()].filter(
      (item) => item.projectId === projectId
    ).length;
    const publicationCount = [...this.publications.values()].filter(
      (item) => item.projectId === projectId
    ).length;
    const collaborationCount = [...this.collaborations.values()].filter(
      (item) => item.projectId === projectId
    ).length;
    return {
      projectId,
      researchVelocity: evidenceCount + experimentCount + publicationCount,
      evidenceGrowth: evidenceCount,
      experimentCount,
      knowledgeGrowth: evidenceCount + experimentCount,
      publicationQuality: publicationCount > 0 ? 0.75 : 0,
      communityActivity: [...this.communities.values()].reduce(
        (sum, community) => sum + community.memberIds.length,
        0
      ),
      collaboration: collaborationCount,
      semantiq: 0.7,
      researchHealth: Math.min(1, (evidenceCount + experimentCount + 1) / 5),
      innovationPotential: Math.min(1, (publicationCount + experimentCount) / 4)
    };
  }

  events(): readonly ResearchRuntimeEvent[] {
    return this.eventLog;
  }

  async graphTimeline(projectId: string): Promise<readonly unknown[]> {
    return this.graph.getTimeline(projectId);
  }

  private async evaluateProject(project: ResearchProjectRuntime): Promise<void> {
    const result = await this.semantiq.runSemantiq(
      {
        id: project.id,
        kind: "project",
        version: project.version,
        title: project.title,
        content: project,
        contextIds: [project.questionId],
        evidenceIds: project.evidenceIds
      },
      {
        id: "research-runtime",
        version: "1.0.0",
        name: "Research Runtime",
        weights: { evidence: 2, "scientific-quality": 2 }
      }
    );
    await this.emit("KnowledgeExpanded", project.id, result.report.id, {
      semantiqReportId: result.report.id
    });
  }

  private async createNode(
    id: string,
    type: KnowledgeNode["type"],
    title: string,
    metadata: Readonly<Record<string, unknown>>
  ): Promise<void> {
    const object = createKnowledgeObjectAggregate(
      id,
      "workspace:research",
      "identity:research-runtime",
      type,
      title,
      metadata
    );
    const node: KnowledgeNode = {
      id,
      type,
      object,
      labels: [type, "research-runtime"],
      properties: metadata,
      federationRefs: [],
      version: object.version,
      createdAt: object.createdAt,
      updatedAt: object.updatedAt
    };
    await this.graph.createNode(node);
  }

  private async link(
    sourceId: string,
    targetId: string,
    relation: Parameters<typeof createKnowledgeEdge>[3],
    evidenceIds: readonly string[] = []
  ): Promise<void> {
    await this.graph.createEdge(
      createKnowledgeEdge(createId("research-edge"), sourceId, targetId, relation, evidenceIds)
    );
  }

  private requireProject(projectId: string): ResearchProjectRuntime {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Research project not found: ${projectId}`);
    }
    return project;
  }

  private requireCommunity(communityId: string): ResearchCommunityRuntime {
    const community = this.communities.get(communityId);
    if (!community) {
      throw new Error(`Community not found: ${communityId}`);
    }
    return community;
  }

  private async emit(
    type: ResearchRuntimeEventType,
    projectId: string | undefined,
    objectId: string | undefined,
    payload: unknown
  ): Promise<void> {
    const base: ResearchRuntimeEvent = {
      type,
      version: 1,
      occurredAt: now(),
      payload
    };
    const withProject = projectId ? { ...base, projectId } : base;
    const withObject = objectId ? { ...withProject, objectId } : withProject;
    this.eventLog.push(Object.freeze(withObject));
  }
}

export const createResearchProject = (
  id: string,
  questionId: string,
  title: string,
  objectives: readonly string[],
  scope: string
): ResearchProjectRuntime => {
  const timestamp = now();
  return {
    id,
    questionId,
    title,
    objectives,
    scope,
    hypothesisIds: [],
    evidenceIds: [],
    experimentIds: [],
    datasetIds: [],
    repositoryIds: [],
    communityIds: [],
    researcherIds: [],
    mentorIds: [],
    semantiqReportIds: [],
    timelineIds: [],
    publicationIds: [],
    benchmarkIds: [],
    version: "1.0.0",
    status: "active",
    progress: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export type * from "./contracts.js";

import type {
  PeerReview,
  ResearchAnalyticsSnapshot,
  ResearchContribution,
  ResearchEngineRepository,
  ResearchEngineService,
  ResearchEvidence,
  ResearchProject,
  ResearchPublication
} from "./contracts.js";

export class LocalResearchEngineRepository implements ResearchEngineRepository {
  private readonly projects = new Map<string, ResearchProject>();
  private readonly contributions: ResearchContribution[] = [];
  private readonly reviews = new Map<string, PeerReview>();
  private readonly publications = new Map<string, ResearchPublication>();

  async saveProject(project: ResearchProject): Promise<void> {
    this.projects.set(project.id, project);
  }

  async getProject(projectId: string): Promise<ResearchProject | undefined> {
    return this.projects.get(projectId);
  }

  async addContribution(contribution: ResearchContribution): Promise<void> {
    this.contributions.push(Object.freeze(contribution));
  }

  async listContributions(projectId: string): Promise<readonly ResearchContribution[]> {
    return this.contributions.filter((contribution) => contribution.projectId === projectId);
  }

  async submitReview(review: PeerReview): Promise<void> {
    this.reviews.set(review.id, review);
  }

  async publish(publication: ResearchPublication): Promise<void> {
    this.publications.set(publication.id, publication);
  }
}

export class LocalResearchEngineService implements ResearchEngineService {
  constructor(
    private readonly repository: ResearchEngineRepository = new LocalResearchEngineRepository()
  ) {}

  async createResearchProject(project: ResearchProject): Promise<void> {
    if (project.originalQuestionIds.length === 0) {
      throw new Error("Research projects must originate from at least one question");
    }
    await this.repository.saveProject(project);
  }

  async linkQuestion(projectId: string, questionId: string): Promise<ResearchProject> {
    const project = await this.requiredProject(projectId);
    const updated = {
      ...project,
      originalQuestionIds: [...new Set([...project.originalQuestionIds, questionId])]
    };
    await this.repository.saveProject(updated);
    return updated;
  }

  async addEvidence(evidence: ResearchEvidence): Promise<void> {
    await this.repository.addContribution({
      id: evidence.contributionId,
      projectId: evidence.projectId,
      type: "evidence",
      authorId: "unknown",
      timestamp: new Date().toISOString(),
      version: "0.1.0",
      confidence: evidence.confidence,
      license: "unspecified",
      relationIds: [],
      provenance: evidence.provenance
    });
  }

  async submitReview(review: PeerReview): Promise<void> {
    await this.repository.submitReview(review);
  }

  async publishResearch(publication: ResearchPublication): Promise<void> {
    if (!publication.approvedBy) {
      throw new Error("Publication requires human approval");
    }
    await this.repository.publish(publication);
  }

  async trackProgress(projectId: string): Promise<ResearchAnalyticsSnapshot> {
    const project = await this.requiredProject(projectId);
    const contributionCount = (await this.repository.listContributions(projectId)).length;
    return {
      projectId,
      progress: project.state === "archive" ? 1 : 0.25,
      evidenceGrowth: project.evidenceIds.length + contributionCount,
      knowledgeExpansion: project.outcomes.length,
      experimentSuccess: project.experimentIds.length,
      collaboration: project.contributorIds.length,
      researchVelocity: contributionCount,
      scientificImpact: project.publicationIds.length,
      semantiqEvolution: project.benchmarkIds.length,
      projectHealth: project.risks.length ? "at-risk" : "healthy",
      knowledgeDensity:
        project.evidenceIds.length + project.hypothesisIds.length + project.experimentIds.length
    };
  }

  private async requiredProject(projectId: string): Promise<ResearchProject> {
    const project = await this.repository.getProject(projectId);
    if (!project) {
      throw new Error(`Research project not found: ${projectId}`);
    }
    return project;
  }
}

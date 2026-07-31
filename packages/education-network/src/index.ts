export type * from "./contracts.js";

import type {
  CompetencyNode,
  EducationNetworkEvent,
  EducationNetworkRepository,
  EducationNetworkService,
  LearningAnalyticsSnapshot,
  LearningObject,
  LearningPath,
  MentorshipAssignment,
  PortfolioAssessment,
  TeachingArtifact,
  VerifiableCredential
} from "./contracts.js";

export class LocalEducationNetworkRepository implements EducationNetworkRepository {
  private readonly objects = new Map<string, LearningObject>();
  private readonly paths = new Map<string, LearningPath>();
  private readonly competencies: CompetencyNode[] = [];
  private readonly mentorships = new Map<string, MentorshipAssignment>();
  private readonly teaching = new Map<string, TeachingArtifact>();
  private readonly assessments = new Map<string, PortfolioAssessment>();
  private readonly credentials = new Map<string, VerifiableCredential>();
  private readonly analytics: LearningAnalyticsSnapshot[] = [];
  private readonly events: EducationNetworkEvent[] = [];

  async saveLearningObject(object: LearningObject): Promise<void> {
    this.objects.set(object.id, object);
  }

  async saveLearningPath(path: LearningPath): Promise<void> {
    this.paths.set(path.id, path);
  }

  async getLearningPath(pathId: string): Promise<LearningPath | undefined> {
    return this.paths.get(pathId);
  }

  async saveCompetency(node: CompetencyNode): Promise<void> {
    this.competencies.push(Object.freeze(node));
  }

  async saveMentorship(assignment: MentorshipAssignment): Promise<void> {
    this.mentorships.set(assignment.id, assignment);
  }

  async saveTeaching(artifact: TeachingArtifact): Promise<void> {
    this.teaching.set(artifact.id, artifact);
  }

  async saveAssessment(assessment: PortfolioAssessment): Promise<void> {
    this.assessments.set(assessment.id, assessment);
  }

  async saveCredential(credential: VerifiableCredential): Promise<void> {
    this.credentials.set(credential.id, credential);
  }

  async getCredential(credentialId: string): Promise<VerifiableCredential | undefined> {
    return this.credentials.get(credentialId);
  }

  async saveAnalytics(snapshot: LearningAnalyticsSnapshot): Promise<void> {
    this.analytics.push(Object.freeze(snapshot));
  }

  async publishEvent(event: EducationNetworkEvent): Promise<void> {
    this.events.push(Object.freeze(event));
  }

  listCompetencies(learnerId: string): readonly CompetencyNode[] {
    return this.competencies.filter((competency) => competency.learnerId === learnerId);
  }
}

export class LocalEducationNetworkService implements EducationNetworkService {
  constructor(private readonly repository: LocalEducationNetworkRepository = new LocalEducationNetworkRepository()) {}

  async createLearningPath(path: LearningPath): Promise<void> {
    if (path.questionIds.length === 0) {
      throw new Error("Learning paths must begin with questions");
    }
    await this.repository.saveLearningPath(path);
    await this.emit("LearningStarted", { pathId: path.id, mode: path.mode }, path.learnerId);
  }

  async recommendLearning(learnerId: string): Promise<readonly string[]> {
    const competencies = this.repository.listCompetencies(learnerId);
    return competencies.flatMap((competency) => competency.evidenceIds);
  }

  async trackCompetency(node: CompetencyNode): Promise<void> {
    await this.repository.saveCompetency(node);
    await this.emit("CompetencyImproved", { competencyId: node.id, level: node.level }, node.learnerId);
  }

  async assignMentor(assignment: MentorshipAssignment): Promise<void> {
    await this.repository.saveMentorship(assignment);
    await this.emit("MentorAssigned", { mentorId: assignment.mentorId, type: assignment.type }, assignment.learnerId);
  }

  async createCourse(artifact: TeachingArtifact): Promise<void> {
    if (artifact.demonstratedKnowledgeIds.length === 0) {
      throw new Error("Teaching must link to demonstrated knowledge");
    }
    await this.repository.saveTeaching(artifact);
  }

  async publishLesson(artifactId: string): Promise<void> {
    await this.emit("TeachingPublished", { artifactId });
  }

  async assessPortfolio(assessment: PortfolioAssessment): Promise<void> {
    await this.repository.saveAssessment(assessment);
    await this.emit("AssessmentCompleted", { assessmentId: assessment.id, mastery: assessment.mastery }, assessment.learnerId);
    if (assessment.mastery) {
      await this.emit("MasteryAchieved", { assessmentId: assessment.id }, assessment.learnerId);
    }
  }

  async issueCredential(credential: VerifiableCredential): Promise<void> {
    if (!credential.signatureId || credential.revoked) {
      throw new Error("Credentials must be signed and active when issued");
    }
    await this.repository.saveCredential(credential);
    await this.emit("CredentialIssued", { type: credential.type }, credential.subjectId, credential.id);
  }

  async verifyCredential(credentialId: string): Promise<boolean> {
    const credential = await this.repository.getCredential(credentialId);
    return Boolean(credential && !credential.revoked && credential.signatureId);
  }

  async generateLearningAnalytics(learnerId: string): Promise<LearningAnalyticsSnapshot> {
    const competencies = this.repository.listCompetencies(learnerId);
    const snapshot: LearningAnalyticsSnapshot = {
      id: `${learnerId}:learning-analytics:${Date.now()}`,
      learnerId,
      knowledgeGrowth: competencies.reduce((total, competency) => total + competency.evidenceIds.length, 0),
      competencyGrowth: competencies.reduce((total, competency) => total + competency.level, 0),
      researchParticipation: competencies.reduce((total, competency) => total + competency.researchIds.length, 0),
      teaching: competencies.reduce((total, competency) => total + competency.teachingIds.length, 0),
      reflection: competencies.filter((competency) => competency.kind === "reflection").length,
      projects: competencies.reduce((total, competency) => total + competency.projectIds.length, 0),
      innovation: 0,
      collaboration: competencies.filter((competency) => competency.kind === "collaboration").length,
      communityLearning: competencies.reduce((total, competency) => total + competency.mentorshipIds.length, 0),
      longTermProgress: competencies.length,
      privacyPreserving: true
    };
    await this.repository.saveAnalytics(snapshot);
    return snapshot;
  }

  private async emit(type: EducationNetworkEvent["type"], payload: unknown, learnerId?: string, credentialId?: string): Promise<void> {
    const event: EducationNetworkEvent = {
      type,
      version: 1,
      occurredAt: new Date().toISOString(),
      payload
    };
    const withLearner = learnerId ? { ...event, learnerId } : event;
    const withCredential = credentialId ? { ...withLearner, credentialId } : withLearner;
    await this.repository.publishEvent(withCredential);
  }
}
